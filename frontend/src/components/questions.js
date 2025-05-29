import React, { useState } from 'react';
import axios from "axios";
import './style.css';
import ReactMarkdown from "react-markdown";
import { remarkGfm } from "remark-gfm";

function QuizApp(props) {
  const [quizData, setQuizData] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(''); // State to store feedback

  const getQuestions = () => {
    setIsLoading(true);
    axios.post("http://127.0.0.1:5000/generate-content", {  
      pdf_text: props.data,
      prompt_type: "2"
    })
    .then(response => {
      try {
        let obj = response.data;
        if (typeof obj === "string") {
          obj = JSON.parse(obj);  // Ensure JSON parsing if backend returns a string
        }
        if (obj && Array.isArray(obj.questions)) {
          setQuizData(obj.questions);
          setCurrentQuestion(0);
          setScore(0);
          setIncorrectAnswers([]);
          setShowResult(false);
        }
      } catch (error) {
        console.error("Error parsing quiz data", error);
      }
    })
    .catch(error => console.error("Error fetching quiz:", error))
    .finally(() => setIsLoading(false));
  };

  const checkAnswer = () => {
    if (selectedOption === '') return;

    const isCorrect = selectedOption === quizData[currentQuestion].answer;
    if (isCorrect) {
      setScore(prevScore => prevScore + 1);
    } else {
      setIncorrectAnswers(prev => [...prev, {
        question: quizData[currentQuestion].question,
        incorrectAnswer: selectedOption,
        correctAnswer: quizData[currentQuestion].answer,
      }]);
    }

    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption('');
    } else {
      setShowResult(true);
      submitFeedback();
    }
  };

  const submitFeedback = () => {
    const feedbackData = {
      prompt_type: "feedback",
      pdf_text: props.data,  // full context or original content
      score: score,
      totalQuestions: quizData.length,
      questions: incorrectAnswers.map((answerObj) => ({
        question: answerObj.question,
        selectedAnswer: answerObj.incorrectAnswer || '',
        correctAnswer: answerObj.correctAnswer,
        isCorrect: false
      }))
    };

    axios.post("http://127.0.0.1:5000/generate-content", feedbackData)
      .then(response => {
        setFeedback(response.data.generated_text);
      })
      .catch(error => {
        console.error("Error fetching feedback:", error);
      });
  };

  const retryQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setIncorrectAnswers([]);
    setShowResult(false);
    setSelectedOption('');
  };

  const renderFeedback = (text) => {
    const sections = text.split('\n').map((line, index) => {
      if (line.includes("Question")) {
        return <p key={index} className="your-question m-5 text-dark fs-1"><ReactMarkdown>{line}</ReactMarkdown></p>;
      }

      if (line.includes("Your Answer")) {
        return <p key={index} className="your-answer"><ReactMarkdown>{line}</ReactMarkdown></p>;
      }
      if (line.includes("Why it's wrong")) {
        return <p key={index} className="why-wrong"><ReactMarkdown>{line}</ReactMarkdown></p>;
      }
      if (line.includes("Correct Answer")) {
        return <p key={index} className="correct-answer"><ReactMarkdown>{line}</ReactMarkdown></p>;
      }
      if (line.includes("Explanation")) {
        return <p key={index} className="explanation m-5"><ReactMarkdown>{line}</ReactMarkdown></p>;
      }
      return <p key={index}>{line}</p>;
    });
    return sections;
  };

  return (
    <div className="quiz-container">
      <button className="inline-btn mb-3" onClick={getQuestions} 
      disabled={isLoading}>
        {isLoading ? "Loading..." : "Start Quiz"}
      </button>

      {quizData.length > 0 && !showResult && (
        <div className="quiz-section globalcontainer">
          <h2>Question {currentQuestion + 1} of {quizData.length}</h2>
          <p className="question-text">{quizData[currentQuestion].question}</p>

          <div className="options">
            {quizData[currentQuestion].choices.map((choice, index) => (
              <label key={index} className="option p-1 fs-2">
                <input 
                  type="radio" 
                  name="quiz" 
                  value={choice} 
                  checked={selectedOption === choice}
                  onChange={() => setSelectedOption(choice)}
                  className='p-2 me-3 '
                />
                {choice}
              </label>
            ))}
          </div>

          <button className="inline-btn" onClick={checkAnswer} 
          disabled={!selectedOption}>
            Submit
          </button>
        </div>
      )}

      {showResult && (
        <div className="result">
          <h2>Quiz Completed!</h2>
          <p>Your score: {score} / {quizData.length}</p>

          {incorrectAnswers.length > 0 && (
            <div>
              <h3>Incorrect Answers:</h3>
              {incorrectAnswers.map((answer, index) => (
                <div key={index} className='d-flex flex-column align-items-start mb-3'>
                  <p className='text-dark'> {answer.question}</p>
                  <p className='text-danger'>❌ {answer.incorrectAnswer}</p>
                  <p className='text-success'>✅ {answer.correctAnswer}</p>
                </div>
              ))}
            </div>
          )}

          <div className='globalcontainer'>
            <h3>Feedback:</h3>
            {renderFeedback(feedback)}
          </div>
          
          <button className="inline-btn" onClick={retryQuiz}>Retry</button>
        </div>
      )}
    </div>
  );
}

export default QuizApp;
