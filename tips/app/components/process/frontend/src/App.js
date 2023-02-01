// import { useState, useEffect } from "react";
function App(props) {

  const inputData = props.inputData;


  return (
    <div>
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          { inputData }
        </a>
    </div>
  );
}

export default App;
