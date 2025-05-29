import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./style.css"
import Editor from "@monaco-editor/react";

import QuizApp from "./questions";
import GenVid from "./Videogen";

function DsaCompiler(props) {
  const [apidata, setAPi] = useState({})
  const [obj1, setobj] = useState({})
  const [revCode, setRevcode] = useState("");
  const [terminal, setTer] = useState("");
  const [code, setCode] = useState("");
  const [current, setCurr] = useState(0);
  const [check, setcheck] = useState("")
  async function response() {
    //const data = await axios.get("/compilecode");
    axios.post('/compilecode', {
      code: code,
      input: "",
      lang: "Python"

    })
      .then(function (response) {
        console.log(response);
        setCode(response.data.code)
        setTer(response.data.output)
      })
      .catch(function (error) {
        console.log(error);
      });
  }
  function getques() {
    axios.post('/dsaques', {
      data: props.data

    })
      .then(function (response) {
        console.log(response);
        setobj(JSON.parse(response.data.id))
        setcheck("vudwbuv")
      })
      .catch(function (error) {
        console.log(error);
      });
  }



  const obj = obj1
  function codeupdate(event) {
    setCode(event.target.value)
    console.log(code)

  }
  function ai() {
    axios.post(("compilecodeai"), {
      code: code
    })
      .then(function (response) {
        setRevcode(response.data.anaylsis)
      })
      .catch(function (error) {
        console.log(error);
      });
  }
  function nextq() {
    if (current < (obj.questions).length - 1) {
      setCurr(current + 1)
    }
  }
  function prevq() {
    if (current >= 1) {
      setCurr(current - 1)
    }
  }
  function Display() {
    return (
      <section class="watch-video">
        <div class="video-container">
          <h1 class="heading">Study guide </h1>

          <form action="" class="add-commentt">
          </form>
        </div>



        <div class="video-container">


        </div>
        <div>
          <GenVid data={code} />
          <QuizApp data={code} />
        </div>
      </section >
    );
  }

  return (
    <div>
      <button class="inline-btn" onClick={getques}>Practice Codes</button>
      {check.length > 0 && (<>
        <section class="watch-video">
          <div class="video-container">
            <h2>Question</h2>
            <h2>{obj.questions[current].question}</h2>
            <br></br>
            <h2>Expected output: </h2>
            <h2>{obj.questions[current].output}</h2>
            <button class="btn" onClick={nextq}>Next</button>
            <button class="btn" onClick={prevq}>Prev</button>
          </div>

        </section>
        <section class="watch-video">
          <div class="video-container">

            <h3 class="heading">Code</h3>
            <textarea rows="13" cols="100" id="code" name="code" class="globalsub2" onChange={codeupdate}>type here </textarea>
            <br />
            <br></br>
            <h3 class="heading">Terminal</h3>
            <button type="button" class="inline-btn" onClick={response}>compile</button>
            <br></br>
            <br></br>
            <textarea class="globalsub3" rows="10" cols="100" id="input" name="input" value={terminal}></textarea>
            <br />
            Language:<select name="lang">

              <option value="Python">Python</option>
            </select>
            Compile with Input:
            <input type="radio" name="inputRadio" value="true" />yes
            <input type="radio" name="inputRadio" id="inputRadio" value="false" />No
            <br />

            <br></br>
            <br></br>
            <h3 class="heading">AI analysis</h3>
            <button class="inline-btn" type="button" onClick={ai}>Ask AI</button>
            <br></br>
            <br></br>
            <textarea
              class="globalsub4"
              value={revCode}
              placeholder="Ai analysis "
              readOnly
            />

          </div>
        </section>
      </>)}
    </div>
  )
}
export default DsaCompiler;