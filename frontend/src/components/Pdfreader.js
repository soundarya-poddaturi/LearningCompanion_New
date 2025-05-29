import React, { useEffect, useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
import QuizApp from "./questions.js";
import Summary from "./summary.js";
import ReactMarkdown from "react-markdown";
function Pdfreader() {
    const [resultText, setResultText] = useState('');
    const inpFileRef = React.createRef();
    const [enhance, setEnhance] = useState('');
    const [stack, setStack] = useState(["Hello! Ask me a question."]);
    const [usermessage, setUser] = useState("");
    const [loading, setLoading] = useState(false);
    const [enhancing, setEnhancing] = useState(false);
    const [sessionId, setSessionId] = useState('');

    const HandleUpload = () => {
        const formData = new FormData();
        formData.append('pdfFile', inpFileRef.current.files[0]);
        const newSessionId = uuidv4();
        setSessionId(newSessionId);
        sessionStorage.setItem('pdf_session_id', newSessionId); // Store new session_id

        setLoading(true);  // Start loading
        fetch('http://127.0.0.1:5000/extract-text', {
            method: 'POST',
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                setResultText(data.text.trim());
                setLoading(false);
            })
            .catch(error => {
                console.error("Error uploading file:", error);
                setLoading(false);
            });
    };

    const enhancetext = () => {
        setEnhancing(true);
        axios.post('/enhancetext', { text: resultText })
            .then((response) => {
                setEnhance(response.data.analysis);
                setEnhancing(false);
            })
            .catch((error) => {
                console.error(error);
                setEnhancing(false);
            });
    };

    const response = () => {
        if (!usermessage.trim()) return;

        setStack([...stack, { type: 'user', message: usermessage }]);  // Add user message to stack
        setLoading(true);
        setUser("");

        axios.post("http://127.0.0.1:5000/generate-content", {
            pdf_text: resultText,
            prompt_type: "1",
            user_question: usermessage,
            session_id: sessionId,
        })
            .then((response) => {
                setStack(prevStack => [...prevStack, { type: 'bot', message: response.data.generated_text }]); // Add bot response to stack
            })
            .catch((error) => {
                console.error("Error fetching response:", error);
            }).finally(() => {
                setLoading(false);
            });
    };

    const updatedata = (event) => {
        setUser(event.target.value);
    };

    function Display() {
        return (
            <section className="watch-video">
                <div className="video-container">
                    <h1 className="heading">Study Guide</h1>
                    <div className="globalcontainer">
                        <div>
                            <textarea
                                className="globalsub"
                                style={{ border: '1px rgba(0, 0, 0, 0.59) solid' }}
                                value={resultText}
                                placeholder="Your PDF text will appear here..."
                                readOnly
                            />
                        </div>
                        <div className="message-container">
                            {stack.map((entry, index) => (
                                <div
                                    key={index}
                                    className={entry.type === 'user' ? 'user-message' : 'bot-response'}>
                                        <ReactMarkdown>{entry.message}</ReactMarkdown>
                                    
                                </div>
                            ))}
                        </div>
                        <div>
                            <input
                                type="text"
                                className="globalsub5 p-3 w-75"
                                style={{ fontSize: 25 }}
                                onChange={updatedata}
                                value={usermessage}
                                placeholder="Type here..."
                                autoFocus
                            />
                            <br />
                            <button onClick={response} className="btn btn-primary mt-2">
                                {loading ? "Fetching..." : "Clarify"}
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <QuizApp data={resultText} />
                    <Summary data={resultText} />
                </div>
            </section>
        );
    }

    return (
        <section>
            <section>
                <h1 className="heading">Select your PDF file...</h1>
                <div className="add-comment2">
                    <input type="file" className="globalbtn" ref={inpFileRef} />
                    <button type="button" className="inline-option-btn" onClick={HandleUpload}>
                        {loading ? "Uploading..." : "Upload"}
                    </button>
                </div>
            </section>
            {resultText.length > 0 && <Display />}
        </section>
    );
}

export default Pdfreader;
