# Python
import logging

# Streamlit
import streamlit as st

# Streamlit modal
from utils.modal import Modal

# TIPS
from tips.framework.db.database_connection import DatabaseConnection
from tips.framework.utils.sql_template import SQLTemplate
from tips.utils.logger import Logger
from tips.utils.utils import Globals

# Components
from utils import processesTable, processComandsModal

# Enums
from tips.app.enums import StateVariable, ProcessTableInstructions

logger = logging.getLogger(Logger.getRootLoggerName())
globals = Globals()

def _setUpPageLayout():
    st.set_page_config(
        page_title="TIPS",
        page_icon="✨",
        layout="wide"
    )

def _loadCustomCSS():
    st.markdown('<style>iframe[title="utils.react_component_modal"] {width: 100vw; height: 100vh}</style>', unsafe_allow_html=True) # Makes the modal full screen

def _setUpProcessTableInstructions():

    # Initialise processTableInstructions dictionary with default values
    processTableInstructions = {
        ProcessTableInstructions.RESET_SELECTED_COMMAND: False
    }

    # Retrieve instructions stored in session state from previous run iteration and translate them into appropriate instructions in the ProcessTableInstructions dictionary
    if StateVariable.CLOSE_COMMAND_MODAL in st.session_state: # If user has closed the overlaying modal component, add instruction to deselect selected command in rendered ProcessTable component
        processTableInstructions[ProcessTableInstructions.RESET_SELECTED_COMMAND] = True
        del st.session_state[StateVariable.CLOSE_COMMAND_MODAL]
    
    return processTableInstructions

def _loadListOfProcesses():
    db = DatabaseConnection()
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="framework_metadata",
        parameters={"process_name": "ALL"},
    )

    fetchedProcessData = [] # Stores list of processes fetched from SQL query (in results variable). May be a two-dimensional array of 

    try:
        results: dict = db.executeSQL(sqlCommand=cmdStr)

        # Iterate through keys in dictionary 'results' and for each unique process name, capture process details in 'fetchedProcessData'
        prevVal = ""
        for row in results:
            processID: str = row["PROCESS_ID"]
            processName: str = row["PROCESS_NAME"]
            processDescription: str = row["PROCESS_DESCRIPTION"]
            processStatus = "active" if row["PROCESS_ACTIVE"] == "Y" else "inactive"
            if processName != prevVal:
                fetchedProcessData.append(
                    {
                        "id": processID,
                        "name": processName,
                        "description": processDescription,
                        "steps": [_stripStepDict(row)],
                        "status": processStatus,
                    }
                )
            else:
                fetchedProcessData[len(fetchedProcessData) - 1]["steps"].append(_stripStepDict(row))

            prevVal = processName
    except Exception as e:
        logger.error(f'Error loading list of processes: {e}')

    return fetchedProcessData

def _stripStepDict(stepDict: dict): # Removes process keys from dictionary intended to store data on process's command, since the command dictionary is nested within the process dictionary (which contains the process's details already)
    strippedDict = stepDict.copy()
    strippedDict.pop("PROCESS_ID")
    strippedDict.pop("PROCESS_NAME")
    strippedDict.pop("PROCESS_DESCRIPTION")
    strippedDict.pop("PROCESS_ACTIVE")
    return strippedDict

def main():

    _setUpPageLayout()
    _loadCustomCSS()
    processTableInstructions = _setUpProcessTableInstructions()

    # Fetch process data if it hasn't been fetched previously
    processesTableData = None
    if StateVariable.PROCESS_DATA not in st.session_state:
        with st.spinner("Fetching Metadata from DB..."):
            st.session_state[StateVariable.PROCESS_DATA] = _loadListOfProcesses()

    # Render processes table component
    processesTableData = processesTable(
        key = 'processTable', 
        processData = st.session_state[StateVariable.PROCESS_DATA],
        instructions = processTableInstructions
    )
    
    # Render process commands modal component (if a command has been selected in the processes table component)
    commandModalData = None
    if processesTableData != None and processesTableData.get('selectedCommand') != None:
        modal = Modal(title="Process Comands Modal", key="processCommandsModal")
        with modal.container():
            commandModalData = processComandsModal(
                key = 'modal',
                processData = processesTableData.get('processData'),
                selectedProcessId = processesTableData.get('selectedProcess').get('id'),
                selectedCommandId = processesTableData.get('selectedCommand').get('PROCESS_CMD_ID')
            )

            # If user has closed the modal, add instruction to deselect selected command in rendered ProcessTable component on next script run
            if commandModalData != None:
                if commandModalData.get('selectedCommand') == None: # User has closed the modal
                    st.session_state[StateVariable.CLOSE_COMMAND_MODAL] = True
                    st.experimental_rerun()        

if __name__ == "__main__":
    # tips_project.toml file is needed for next command to run
    # Initialise globals
    globals.initGlobals()    
    main()