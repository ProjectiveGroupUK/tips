import {
  Streamlit,
  StreamlitComponentBase,
  withStreamlitConnection,
} from "streamlit-component-lib"
import React, { ReactNode } from "react"
import ProcessList from "./pages/processes/ProcessList"
import ProcessAdd from "./pages/processes/ProcessAdd"

interface State {
  numClicks: number
  isFocused: boolean
}

/**
 * This is a React-based component template. The `render()` function is called
 * automatically when your component should be re-rendered.
 */
class App extends StreamlitComponentBase<State> {

  componentDidMount(): void {
    Streamlit.setFrameHeight();
  }

  public render = (): ReactNode => {
    const functionCalled = this.props.args["functionCalled"]
    const inputData = this.props.args["inputData"]

    switch (functionCalled) {
      case "ProcessList":
        return <ProcessList dbData={inputData.dbData}/>
      case "ProcessAdd":
        return <ProcessAdd />
    }

  }
}

// "withStreamlitConnection" is a wrapper function. It bootstraps the
// connection between your component and the Streamlit app, and handles
// passing arguments from Python -> Component.
//
// You don't need to edit withStreamlitConnection (but you're welcome to!).
export default withStreamlitConnection(App)
