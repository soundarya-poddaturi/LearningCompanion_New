import React, { useState } from "react";
import axios from "axios";
import "./style.css";

function Compiler() {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [sourceLang, setSourceLang] = useState("Python");
  const [targetLang, setTargetLang] = useState("Java");
  const [loading, setLoading] = useState(false);


  const handleOptimize = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:5000/optimize-code", {
        code,
        language: sourceLang,
      });
      setOutput(res.data.optimized_code);
    } catch (err) {
      console.error(err);
      setOutput("❌ Error optimizing code.");
    } finally {
      setLoading(false);
    }
  };


  const handleConvert = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:5000/convert-code", {
        code,
        target_language: targetLang,
      });
      setOutput(res.data.converted_code);
    } catch (err) {
      console.error(err);
      setOutput("❌ Error converting code.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="code-assistant-container ms-5 mt-5">
      <h2>🧠 Code Assistant</h2>
      <br />
      <br />
      <div className="mb-3">
        <label htmlFor="sourceLang" className="form-label"><strong><h3>Source Language:
        </h3></strong></label>
        <select
          className="form-select w-25 fs-3"
          id="sourceLang"
          value={sourceLang}
          onChange={(e) => setSourceLang(e.target.value)}
        >
          <option value="Python">Python</option>
          <option value="Java">Java</option>
          <option value="JavaScript">JavaScript</option>
          <option value="C">C</option>
          <option value="C++">C++</option>
        </select>
      </div>


      <br /><br />
      <textarea
        rows="15"
        cols="100"
        className="mb-5 fs-3 p-3 w-75"
        placeholder="Paste your code here..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />


      <div className="d-flex gap-5 m-4 " w-50>
        <div className="d-flex  align-items-center justify-content-center">
          <button className="inline-btn h-50" onClick={handleOptimize}>Optimize Code</button>
        </div>
        {loading && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            // backgroundColor: "rgba(255, 255, 255, 0.6)", // optional dimming effect
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}>
            <svg width="80" height="80" viewBox="0 0 240 240">
              <circle className="pl__ring pl__ring--a" cx="120" cy="120" r="105" fill="none" stroke="#000" strokeWidth="20" strokeDasharray="0 660" strokeDashoffset="-330" strokeLinecap="round"></circle>
              <circle className="pl__ring pl__ring--b" cx="120" cy="120" r="35" fill="none" stroke="#000" strokeWidth="20" strokeDasharray="0 220" strokeDashoffset="-110" strokeLinecap="round"></circle>
              <circle className="pl__ring pl__ring--c" cx="85" cy="120" r="70" fill="none" stroke="#000" strokeWidth="20" strokeDasharray="0 440" strokeLinecap="round"></circle>
              <circle className="pl__ring pl__ring--d" cx="155" cy="120" r="70" fill="none" stroke="#000" strokeWidth="20" strokeDasharray="0 440" strokeLinecap="round"></circle>
            </svg>
          </div>
        )}


        <div className="d-flex flex-column">
          <label><strong><h3>Convert to:</h3></strong></label>
          <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}
            className="form-select fs-3">
            <option value="Python">Python</option>
            <option value="Java">Java</option>
            <option value="JavaScript">JavaScript</option>
            <option value="C">C</option>
            <option value="C++">C++</option>
          </select>

          <button className="inline-btn" onClick={handleConvert}>Convert Code</button>
        </div>
      </div>
      <br /><br />
      <h3>🧾 Output</h3>
      <textarea rows="12" cols="100" value={output} readOnly className="mb-5 fs-3 p-3 w-75" />

    </div>
  );
}

export default Compiler;
