import React, { useState, useEffect } from 'react';
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from "react-markdown";

const ChatBox = () => {
    const [sessionId, setSessionId] = useState('');
    const [stack, setStack] = useState([{ type: 'bot', message: "Hello! Ask me a question?" }]);
    const [usermessage, setUser] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const newSessionId = uuidv4();
        setSessionId(newSessionId);
    }, []);

    const response = () => {
        if (!usermessage.trim()) return;

        setStack([...stack, { type: 'user', message: usermessage }]);
        setLoading(true);
        axios.post("http://127.0.0.1:5000/chatresponse", {
            ques: usermessage,
            session_id: sessionId
        })
        .then((res) => {
            setStack(prevStack => [...prevStack, { type: 'bot', message: res.data.response }]);
        })
        .catch((err) => {
            console.error("Error:", err);
        })
        .finally(() => {
            setUser("");
            setLoading(false);
        });
    };

    const updatedata = (e) => setUser(e.target.value);

    return (
        <section className="watch-video">
            <div className="video-container">
                <h3 className="heading">Chat Bot Assistance</h3>

                <div className="message-container">
                    {stack.map((entry, idx) => (
                        <div key={idx} className={entry.type === 'user' ? 'user-message' : 'bot-response'}>
                            <ReactMarkdown>{entry.message}</ReactMarkdown>
                        </div>
                    ))}
                </div>

                <section className="comments">
                    <h3 className="heading">Enter Prompt</h3>
                    <input
                        className="globalsub5 p-3"
                        type="text"
                        onChange={updatedata}
                        value={usermessage}
                        placeholder="Type here..."
                    />
                    <button className="inline-btn" onClick={response}>
                        {loading ? "Sending..." : "Send!"}
                    </button>
                </section>
            </div>
        </section>
    );
};

export default ChatBox;
