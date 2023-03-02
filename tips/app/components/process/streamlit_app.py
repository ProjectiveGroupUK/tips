import os
import streamlit.components.v1 as components
import streamlit as st
from tips.framework.db.database_connection import DatabaseConnection
from tips.framework.utils.sql_template import SQLTemplate
import logging
from tips.utils.logger import Logger
from tips.utils.utils import Globals

logger = logging.getLogger(Logger.getRootLoggerName())
globals = Globals()


_RELEASE = False

if not _RELEASE:
    _component_func = components.declare_component(
        "react_component",
        url="http://localhost:3001",
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _component_func = components.declare_component("react_component", path=build_dir)

def react_component(functionCalled: str, inputData:dict, key=None):
    """Create a new instance of "react_component".
    Parameters
    ----------
    inputData: dict           
    key: str or None
        An optional key that uniquely identifies this component. If this is
        None, and the component's arguments are changed, the component will
        be re-mounted in the Streamlit frontend and lose its current state.
    Returns
    -------
    dict
        Output Data returned from react component
    """
    component_value = _component_func(functionCalled=functionCalled, inputData=inputData, key=key, default={})

    # We could modify the value returned from the component if we wanted.
    # There's no need to do this in our simple example - but it's an option.
    return component_value

def main():
    global returnData

    if st.session_state['entryPoint'] == "ProcessList":
        db = DatabaseConnection()
        cmdStr: str = SQLTemplate().getTemplate(
            sqlAction="framework_metadata",
            parameters={"process_name": "ALL"},
        )

        with st.spinner("Fetching Metadata from DB..."):
            results = db.executeSQL(sqlCommand=cmdStr)

            newList = []
            if len(results) > 0:
                prevVal = ""
                for row in results:
                    processID = row["PROCESS_ID"]
                    processName = row["PROCESS_NAME"]
                    processDescription = row["PROCESS_DESCRIPTION"]
                    processStatus = "active" if row["PROCESS_ACTIVE"] == "Y" else "inactive"
                    if processName != prevVal:
                        newList.append(
                            {
                                "id": processID,
                                "name": processName,
                                "description": processDescription,
                                "steps": [row],
                                "status": processStatus,
                            }
                        )
                    else:
                        newList[len(newList) - 1]["steps"].append(row)

                    prevVal = processName  

            data = {"dbData": newList}
            functionCalled = "ProcessList"
            res = react_component(functionCalled=functionCalled, inputData=data,  key="process_list")
            if "nextAction" in res:
                st.session_state['entryPoint'] = res["nextAction"]
                st.experimental_rerun()

    elif st.session_state['entryPoint'] == "ProcessAdd":
        data = {}
        functionCalled = "ProcessAdd"
        res = react_component(functionCalled=functionCalled, inputData=data,  key="process_add")
        if "nextAction" in res:
            st.session_state['entryPoint'] = res["nextAction"]
            st.experimental_rerun()

if __name__ == "__main__":
    # tips_project.toml file is needed for next command to run
    # Initialise globals
    globals.initGlobals()    
    main()