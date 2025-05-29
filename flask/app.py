from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
import faiss
import numpy as np
from dotenv import load_dotenv
from flask_cors import CORS
import os
import json
import fitz
import requests
from youtube_transcript_api import YouTubeTranscriptApi as yta 

# Load .env file and configure API key for Gemini
load_dotenv()
GOOGLE_MODEL = os.getenv("GOOGLE_MODEL")
YOUTUBE = os.getenv("YOUTUBE")
TAVILY = os.getenv("TAVILY")
genai.configure(api_key=GOOGLE_MODEL)

YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
TAVILY_SEARCH_URL = "https://api.tavily.com/search"

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Load embedding model once
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# Load Gemini model
model = genai.GenerativeModel("gemini-2.0-flash")

# Global dictionary to track chat history
chat_histories = {}
#using of the model and using history for remembering contxt
def askgem(prompt, session_id=None, use_history=False):
    if use_history and session_id:
        raw_history = chat_histories.get(session_id, [])
        
        # Convert stored history (list of tuples) into Gemini-compatible format
        formatted_history = [{"role": role, "parts": [msg]} for role, msg in raw_history]
        chat = model.start_chat(history=formatted_history)
    else:
        chat = model.start_chat(history=[])

    # Send the new user prompt
    response = chat.send_message(prompt)

    # Store the current prompt and response
    if use_history and session_id:
        chat_histories.setdefault(session_id, []).append(("user", prompt))
        chat_histories[session_id].append(("model", response.text.strip()))

    return response.text.strip()


# Chunk text into overlapping pieces
def chunk_text(text, chunk_size=500, overlap=50):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

# Embed text chunks
def embed_chunks(chunks):
    return embedding_model.encode(chunks)

# Build FAISS index
def build_faiss_index(embeddings):
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)
    return index


rag_data = {}  # This will hold session_id to the (index, chunks) for each PDF


# Route to handle content generation # for PDFReader(summary,chat withPdf and quiz)
@app.route("/generate-content", methods=["POST"])
def generate_content():
    try:
        data = request.get_json()

        user_question = data.get("user_question", None)
        pdf_text = data.get("pdf_text", "")
        prompt_type = data.get("prompt_type", "")
        session_id = data.get("session_id", None)

        if not prompt_type or not pdf_text:
            return jsonify({"error": "Prompt type and PDF text are required"}), 400
        if session_id in rag_data:
            index, chunks = rag_data[session_id]
        else:
            # Perform RAG (chunking, embedding, indexing) since it's a new PDF
            chunks = chunk_text(pdf_text)
            chunk_embeddings = embed_chunks(chunks)
            embeddings_array = np.array(chunk_embeddings)
            index = build_faiss_index(embeddings_array)
            
            # Store RAG data for future queries in this session
            rag_data[session_id] = (index, chunks)

        query_embedding = embedding_model.encode([user_question if user_question else ""])
        D, I = index.search(np.array(query_embedding), k=3)
        top_chunks = [chunks[i] for i in I[0]]
        context = "\n\n".join(top_chunks)

        if prompt_type == "1":
            print("chat\n\n")
            if not user_question:
                return jsonify({"error": "No question provided for prompt_type 1"}), 400
            final_prompt = f"""Based on the provided context, answer the following question positively. 
If the context does not directly contain the information, provide a reasonable, informative answer. 
If examples are required but not present, create relevant examples.

### Context:
{context}

### Question:
{user_question}

### Answer:"""
            use_history = True

        elif prompt_type == "2":
            final_prompt = f"""Create a JSON-formatted 5-question quiz based on the following content. 
Each question should have 4 multiple-choice answers and one correct answer. 
Ensure that your response is strictly valid JSON and does not include any extra text. 
Format it as: {{"questions": [{{"question": "...", "choices": ["A", "B", "C", "D"], "answer": "..."}}, ...]}}.

### Context:
{context}
"""
            use_history = False

        elif prompt_type == "3":
            final_prompt = f"""Summarize all the important topics concisely and cover all important topics.

### Context:
{context}
"""
            use_history = False

        elif prompt_type == "feedback":
            questions = data.get("questions", [])
            incorrect_qs = [q for q in questions if not q["isCorrect"]]

            if not incorrect_qs:
                return jsonify({"generated_text": "All your answers were correct. Great job!"})

            user_answers_text = "\n".join([
                f"{i+1}. {q['question']}\nUser Answer: {q['selectedAnswer'] or '[No Answer]'}"
                for i, q in enumerate(incorrect_qs)
            ])

            correct_answers_text = "\n".join([
                f"{i+1}. {q['question']}\nCorrect Answer: {q['correctAnswer']}"
                for i, q in enumerate(incorrect_qs)
            ])

            final_prompt = f"""You are an expert tutor reviewing a multiple-choice quiz.

### Context (Study Material):
{context}

### Incorrect Answers from the User:
{user_answers_text}

### Correct Answers:
{correct_answers_text}

### Instructions:
- ONLY give feedback for the listed incorrect answers.
- For each, explain **why** the user's answer is wrong using the provided context.
- Clarify the correct answer and reference supporting info from the context.
- Provide an example or analogy if it helps with understanding.
- Be concise, clear, and constructive.

### Feedback:"""
            use_history = False

        else:
            return jsonify({"error": "Invalid prompt type"}), 400

        # Send prompt to Gemini
        answer = askgem(final_prompt, session_id=session_id, use_history=use_history)

        if prompt_type == "2":
            try:
                json_start = answer.find("{")
                json_end = answer.rfind("}") + 1
                json_cleaned = answer[json_start:json_end]
                quiz_data = json.loads(json_cleaned)
                return quiz_data
            except json.JSONDecodeError as e:
                return {"error": "Failed to parse AI-generated quiz"}

        return jsonify({"generated_text": answer})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to extract text from uploaded PDF
@app.route('/extract-text', methods=['POST'])
def extract_text():
    if 'pdfFile' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['pdfFile']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    pdf_path = "temp.pdf"
    file.save(pdf_path)

    try:
        pdf_text = extract_text_from_pdf(pdf_path)
        os.remove(pdf_path)
        return jsonify({"text": pdf_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def extract_text_from_pdf(pdf_path):
    text = ""
    with fitz.open(pdf_path) as doc:
        for page in doc:
            text += page.get_text("text") + "\n"
    return text.strip()

#for ChatBox
@app.route("/chatresponse", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        user_message = data.get("ques")
        session_id = data.get("session_id")
        print(user_message+" "+session_id)
        if not user_message or not session_id:
            return jsonify({"error": "Both 'message' and 'session_id' are required"}), 400

        # Use Gemini with history
        response_text = askgem(user_message, session_id=session_id, use_history=True)

        return jsonify({"response": response_text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
#for youtube transcriber
def transcribe_util(link):#Here pass the link only , copy it from the url 
    ids=link.split("=")
    vid_id=ids[1]
    data=yta.get_transcript(vid_id,languages=['en'])
    transcript=''
    for value in data:
        for key,val in value.items():
            if key=="text":
                transcript+=val

    l=transcript.splitlines()
    finaldata=" ".join(l)
    return finaldata

@app.route("/transcribe", methods=["POST"])
def transcribe():
    data = request.json
    user_link = data.get("link")
    explanation_type = data.get("type", "short")  # Default to concise

    transcript = transcribe_util(user_link)
    prompt_suffix = "Explain it in a detailed manner" if explanation_type == "detailed" else "Explain it in concise manner"

    if len(transcript) <= 40000:
        to_return = askgem(transcript + " " + prompt_suffix)
    else:
        to_return = ""
        prev = 0
        for i in range(0, len(transcript), 5000):
            to_return += askgem(transcript[prev:i] + " " + prompt_suffix)
            prev = i

    return jsonify({"data": to_return})




# for path Planner
# API Endpoint for career guidance
@app.route("/generate-career-guide", methods=["POST"])
def generate_career_guide():
    print(request)
    data = request.json
    user_query = data.get("query")

    if not user_query:
        return jsonify({"error": "No query provided"}), 400
    print(user_query)
    # YouTube & Web search
    youtube_links = search_youtube(user_query)
    web_links = search_web(user_query)
    print(youtube_links)
    print(web_links)
    # Prepare Flash API request
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": f"""
            You are a career guidance expert. When the user asks about a topic, provide a **detailed step-by-step career path** for mastering it. Your response should include:

            1. **Introduction to the topic** - Explain what it is and why it matters.
            2. **Skills required** - List essential skills.
            3. **Step-by-step learning roadmap** - Courses, books, hands-on projects, and important milestones.
            4. **Job opportunities** - Different roles available in this field.
            5. **Salary expectations** - Entry-level, mid-level, and expert salaries.
            6. **Challenges and industry trends** - Common pitfalls and advancements in this field.
            7. **Top resources** - Websites, online courses, books, and communities.

            Make the answer **detailed, structured, and easy to follow**.

            ### **User's Query:** {user_query}

            Now generate a **comprehensive guide** on this career path.
            """
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1000
        }
    }

    # Send request to Flash API
    print("heyyyyyy")
    response = requests.post(f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GOOGLE_MODEL}", json=payload)
    if response.status_code == 200:
        ai_reply = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        print(ai_reply)
        print(youtube_links)
        print(web_links)
        return jsonify({"career_guide": ai_reply, "youtube_links": youtube_links, "web_links": web_links})
    print("heyyyyyy")
    return jsonify({"error": "Failed to generate career guide"}), response.status_code


# Function to search YouTube

def search_youtube(query, max_results=3):
    params = {
        "part": "snippet",
        "q": query,
        "key": YOUTUBE,
        "maxResults": max_results,
        "type": "video"
    }
    response = requests.get(YOUTUBE_SEARCH_URL, params=params)
    if response.status_code == 200:
        videos = response.json().get("items", [])
        return [f"https://www.youtube.com/watch?v={video['id']['videoId']}" for video in videos]
    return ["No YouTube results found."]

        


# Function to search the web using Tavily
def search_web(query, max_results=3):
    payload = {
        "model": TAVILY,
        "query": query,
        "search_depth": "basic",
        "max_results": max_results
    }
    response = requests.post(TAVILY_SEARCH_URL, json=payload)
    if response.status_code == 200:
        results = response.json().get("results", [])
        return [result["url"] for result in results]
    return ["No web results found."]



# for compiler
@app.route("/optimize-code", methods=["POST"])
def optimize_code():
    data = request.json
    code = data.get("code", "")
    lang = data.get("language", "Python")

    prompt = f"""
You are a software engineering assistant.

Analyze the following {lang} code and perform **optimization** ONLY if possible.

1. If time or space complexity can be improved, return:
- The **optimized code**
- The **new time complexity**
- The **new space complexity**

2. If the code is already optimal, return:
"This code is already optimized for time and space complexity."

ONLY provide code and complexity info. Be concise. Do not add extra explanation or tips.

Code:
{code}
    """

    optimized_response = askgem(prompt)
    return jsonify({"optimized_code": optimized_response})



@app.route("/convert-code", methods=["POST"])
def convert_code():
    data = request.json
    code = data.get("code", "")
    target_lang = data.get("target_language", "Java")

    prompt = f"""
Convert the following code to {target_lang}.
Only return the converted code. Do not include any explanation, comments, or formatting instructions.

Code:
{code}
    """

    converted = askgem(prompt)
    return jsonify({"converted_code": converted})


# Run the Flask app
if __name__ == "__main__":
    app.run(debug=True)
