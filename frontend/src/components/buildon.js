import React, { useState } from "react";
import axios from "axios";
import QuizApp from "./questions";
import GenVid from "./Videogen";
import DsaCompiler from "./dsa";

function Build() {
  const [maindata, setMain] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  function fetchItems() {
    setLoading(true);
    axios
      .post("http://127.0.0.1:5000/generate-career-guide", {
        query: prompt,
      })
      .then((response) => {
        console.log("API Response:", response.data);
        setMain(response.data.career_guide);  // ✅ this matches what Flask returns
        setShowResults(true);
      })
      .catch((err) => {
        console.error("Error fetching study guide:", err);
        setMain("❌ Failed to load data");
      })
      .finally(() => setLoading(false));
  }

  function takeData(event) {
    setPrompt(event.target.value);
  }

  function Display(props) {
    return (
      <section className="watch-video">
        <div className="video-container">
          <h1 className="heading">📘 Study Guide</h1>
          <textarea
            className="globalsub3"
            value={props.data}
            readOnly
            rows="15"
            cols="100"
          />
        </div>

        <div>
          <GenVid data={props.data} />
          <QuizApp data={props.data} />
          <DsaCompiler data={props.data} />
        </div>
      </section>
    );
  }

  return (
    <div>
      <section className="comments">
        <h1 className="heading">Enter Topic to Build Your Learning Guide</h1>
        <textarea
          className="globalsub3"
          rows="5"
          cols="100"
          onChange={takeData}
          placeholder="e.g., Machine Learning, Dynamic Programming..."
        />

        <button onClick={fetchItems} className="inline-option-btn">
          Build Lesson
        </button>

        <br />
        {loading && (
          <div>
            <p>Generating guide...</p>
            <svg className="pl" width="240" height="240" viewBox="0 0 240 240">
              {/* Loading Spinner SVG */}
            </svg>
          </div>
        )}

        {!loading && showResults && (
          <div className="details">
            <Display data={maindata} />
          </div>
        )}
      </section>
    </div>
  );
}

export default Build;







// import React ,{useEffect, useState} from "react";
// import axios from "axios";
// import {Link} from "react-router-dom";
// import QuizApp from "./questions";
// import GenVid from "./Videogen";
// import DsaCompiler from "./dsa";


// function Build() {
//     const[maindata,setMain]=useState("")
//     const[prompt,setPro]=useState("")
//     const [loading, setLoading] = useState(false);
//     const[check,setCheck]=useState("")
//     function fetchItems(){
//         axios.post("/chatresponse",{
//             ques:prompt
//         })
//         .then((response)=>{
//             console.log(response.data.anaylsis)
//             setMain(response.data.anaylsis)
//             setCheck("klsvnrnrvi")
//         })
//     }
//     function takeData(event){
//         setPro(event.target.value)
//         setPro(event.target.value)
//     }
//     function Display(props) {
//         return (
//          <section class="watch-video">
         

         
//          <div class="video-container">
            
        
// <h1 class="heading">Study guide </h1>

// <form action="" class="add-commentt">
   
//    <textarea name="comment_box" placeholder="enter your comment" required maxlength="1000" cols="30" rows="100">
//    {props.data}
//    </textarea>
   
// </form>
        
//          </div>
//          <div>
//             <GenVid data={props.data}/>
//             <QuizApp data={props.data}/>
//             <DsaCompiler data={props.data}/>
//          </div>
//        </section >
//         );
//     }
    
    
//     return (
//         <div>
//        <section class="comments">
//             <h1 class="heading" > hi Enter Prompt ...</h1>
            
//             <textarea type="text" className="globalsub3" onChange={takeData} />
//             <button onClick={fetchItems} class="inline-option-btn" >Build lesson</button>
            
            
  
//             <br></br>
            
//             {loading && <svg class="pl" width="240" height="240" viewBox="0 0 240 240">
// 	<circle class="pl__ring pl__ring--a" cx="120" cy="120" r="105" fill="none" stroke="#000" stroke-width="20" stroke-dasharray="0 660" stroke-dashoffset="-330" stroke-linecap="round"></circle>
// 	<circle class="pl__ring pl__ring--b" cx="120" cy="120" r="35" fill="none" stroke="#000" stroke-width="20" stroke-dasharray="0 220" stroke-dashoffset="-110" stroke-linecap="round"></circle>
// 	<circle class="pl__ring pl__ring--c" cx="85" cy="120" r="70" fill="none" stroke="#000" stroke-width="20" stroke-dasharray="0 440" stroke-linecap="round"></circle>
// 	<circle class="pl__ring pl__ring--d" cx="155" cy="120" r="70" fill="none" stroke="#000" stroke-width="20" stroke-dasharray="0 440" stroke-linecap="round"></circle>
// </svg>}
//             {!loading && check.length > 0 &&  (
//                 <div class ="details">
//                <h3> <Display data={maindata}  /> </h3>
//                </div>
//             )}
// </section>
// <div>


      


//         </div>

//         </div>
//     );
// }
// //src={require("./images/customlogo.png")}
// export default Build;