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
class ProcessList extends StreamlitComponentBase<State> {

  public state = { returnData: {} }

  public render = (): ReactNode => {
    // Arguments that are passed to the plugin in Python are accessible
    // via `this.props.args`. Here, we access the "name" arg.
    const inputData = this.props.args["inputData"]

    return (
      <span>
        <h1>Process List Page</h1>
        <button onClick={this.onClicked}>Click to move to Add</button>
      </span>
    )
  }

  /** Click handler for our "Click Me!" button. */
  private onClicked = (): void => {
    // Increment state.numClicks, and pass the new value back to
    // Streamlit via `Streamlit.setComponentValue`.
    const responseData = {nextAction: "ProcessAdd"};
    Streamlit.setComponentValue(responseData)
    // this.setState(
    //   state => response,
    //   () => Streamlit.setComponentValue(this.state.returnData)
    // )
  }


}

export default withStreamlitConnection(ProcessList)
