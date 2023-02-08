# Python
import os
import logging

# Streamlit
import streamlit.components.v1 as components
import streamlit as st

# TIPS
from tips.framework.db.database_connection import DatabaseConnection
from tips.framework.utils.sql_template import SQLTemplate
from tips.utils.logger import Logger
from tips.utils.utils import Globals

# Enums
from tips.app.enums import StateVariable, EntryPoint

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

def _setUpPageLayout():
    st.set_page_config(
        page_title="TIPS",
        page_icon="✨",
        layout="wide"
    ) 

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

def _loadListOfProcesses():
    db = DatabaseConnection()
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="framework_metadata",
        parameters={"process_name": "ALL"},
    )

    try:
        results: dict = db.executeSQL(sqlCommand=cmdStr)
        newList = [] # Stores list of processes fetched from SQL query (in results variable). May be a two-dimensional array of 

        # Iterate through keys in dictionary 'results' and for each unique process name, capture process details in 'newList'
        prevVal = ""
        for row in results:
            processID: str = row["PROCESS_ID"]
            processName: str = row["PROCESS_NAME"]
            processDescription: str = row["PROCESS_DESCRIPTION"]
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
    except Exception as e:
        logger.error(f'Error loading list of processes: {e}')

    return newList

def main():

    _setUpPageLayout()

    # Ensure that state contains an entryPoint value (and revert to PROCESS_LIST if it doesn't)
    entryPoint = st.session_state.get(StateVariable.ENTRY_POINT)
    if(entryPoint is None):
        entryPoint = EntryPoint.PROCESS_LIST
        st.session_state[StateVariable.ENTRY_POINT] = entryPoint

    # Iterate through potential EntryPoint values for Processes page and display widgets/components for matched value

    if entryPoint == EntryPoint.PROCESS_LIST: # Show user list of all processes
        # Fetch process data and pass it as a prop to React component
        with st.spinner("Fetching Metadata from DB..."):
            newList = _loadListOfProcesses()
            data = {"dbData": newList}
            functionCalled = "ProcessList"
            res = react_component(functionCalled=functionCalled, inputData=data, key="process_list")
            if "nextAction" in res:
                st.session_state[StateVariable.ENTRY_POINT] = res["nextAction"]
                st.experimental_rerun()

    elif entryPoint == EntryPoint.PROCESS_ADD:
        data = {}
        functionCalled = "ProcessAdd"
        res = react_component(functionCalled=functionCalled, inputData=data, key="process_add")
        if "nextAction" in res:
            st.session_state[StateVariable.ENTRY_POINT] = res["nextAction"]
            st.experimental_rerun()

if __name__ == "__main__":
    # tips_project.toml file is needed for next command to run
    # Initialise globals
    globals.initGlobals()    
    main()