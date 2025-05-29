import React, { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import ReactMarkdown from "react-markdown";

function PathPlanner() {
    const [query, setQuery] = useState("");
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchPathPlanner = async () => {
        setLoading(true);
        try {
            const res = await axios.post("http://127.0.0.1:5000/generate-career-guide", { query });
            console.log(res)
            setResponse(res.data);
        } catch (error) {
            console.error("Error fetching career guide:", error);
        }
        setLoading(false);
    };

    return (
        // <div className=" mt-5">
           
            <section className="comments">
                <h1 class="heading" >Buil a plan...</h1>

                <input
                    type="text"
                    className="add-comment2 fs-2"
                    placeholder="Enter a career field..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />


                <button className="inline-option-btn" onClick={fetchPathPlanner} disabled={loading}>
                    {loading ? "Fetching..." : "Get Career Guide"}
                </button>
                {loading && (
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "40vh", // occupy most of the viewport height
                        width: "100%",
                    }}>
                        <svg className="pl" width="240" height="240" viewBox="0 0 240 240">
                            <circle className="pl__ring pl__ring--a" cx="120" cy="120" r="105" fill="none" stroke="#000" strokeWidth="20" strokeDasharray="0 660" strokeDashoffset="-330" strokeLinecap="round"></circle>
                            <circle className="pl__ring pl__ring--b" cx="120" cy="120" r="35" fill="none" stroke="#000" strokeWidth="20" strokeDasharray="0 220" strokeDashoffset="-110" strokeLinecap="round"></circle>
                            <circle className="pl__ring pl__ring--c" cx="85" cy="120" r="70" fill="none" stroke="#000" strokeWidth="20" strokeDasharray="0 440" strokeLinecap="round"></circle>
                            <circle className="pl__ring pl__ring--d" cx="155" cy="120" r="70" fill="none" stroke="#000" strokeWidth="20" strokeDasharray="0 440" strokeLinecap="round"></circle>
                        </svg>
                    </div>
                )}

                {response && (
                    <div className="mt-4 globalcontainer">
                        <h3 className="text-primary">Career Guide</h3>

                        <ReactMarkdown>{response.career_guide}</ReactMarkdown>

                        <h4 className="text-dark mt-4">YouTube Resources</h4>
                        <ul className="list-group">
                            {response.youtube_links.map((link, index) => (
                                <li key={index} className="list-group-item">
                                    <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
                                </li>
                            ))}
                        </ul>
                        <h4 className="text-dark mt-4">Web Resources</h4>
                        <ul className="list-group">
                            {response.web_links.map((link, index) => (
                                <li key={index} className="list-group-item">
                                    <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>
       
    );
}

export default PathPlanner;
