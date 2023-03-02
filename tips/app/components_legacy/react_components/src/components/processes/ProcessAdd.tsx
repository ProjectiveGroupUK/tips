import {
  Streamlit,
  StreamlitComponentBase,
  withStreamlitConnection,
} from "streamlit-component-lib"
import React, { ReactNode } from "react"

interface State {
  returnData: object
}

/**
 * This is a React-based component template. The `render()` function is called
 * automatically when your component should be re-rendered.
 */
class ProcessAdd extends StreamlitComponentBase<State> {

  public state = { returnData: {} }

  public render = (): ReactNode => {
    // Arguments that are passed to the plugin in Python are accessible
    // via `this.props.args`. Here, we access the "name" arg.
    const inputData = this.props.args["inputData"]

    return (
      <span>
        <h1>Process Add Page</h1>
        {inputData.key2}
        <button onClick={this.onClicked}>Click to move to List</button>
      </span>
    )
  }

  /** Click handler for our "Click Me!" button. */
  private onClicked = (): void => {
    // Increment state.numClicks, and pass the new value back to
    // Streamlit via `Streamlit.setComponentValue`.
    const responseData = {nextAction: "ProcessList"};
    Streamlit.setComponentValue(responseData)
  }


}

export default withStreamlitConnection(ProcessAdd)
