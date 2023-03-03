# Python
import logging

# Streamlit
import streamlit as st

# TIPS
from tips.framework.db.database_connection import DatabaseConnection
from tips.framework.utils.sql_template import SQLTemplate
from tips.utils.logger import Logger
from tips.utils.utils import Globals, escapeValuesForSQL

# Components
from utils import processesTable, createCommandModal, processCommandsModal

# Enums
from tips.app.enums import StateVariable, ProcessTableInstruction, CommandUpdateProperty, CreateCommandModalInstruction, EditCommandModalInstruction

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
    st.markdown('<style>iframe[title="utils.react_component_processTable"] {min-height: 20rem;}</style>', unsafe_allow_html=True) # Sets minimum height for processTable iframe (othwerwise menu dropdown may be cut off if too few processes are rendered)

def _setUpStateInstructions():
    if ProcessTableInstruction.RESET_SELECTED_COMMAND not in st.session_state:
        st.session_state[ProcessTableInstruction.RESET_SELECTED_COMMAND] = False

    if ProcessTableInstruction.RESET_CREATE_COMMAND not in st.session_state:
        st.session_state[ProcessTableInstruction.RESET_CREATE_COMMAND] = False

    if CreateCommandModalInstruction.RESET_PROCESSING_INDICATOR not in st.session_state:
        st.session_state[CreateCommandModalInstruction.RESET_PROCESSING_INDICATOR] = False

    if EditCommandModalInstruction.RESET_UPDATE_COMMAND not in st.session_state:
        st.session_state[EditCommandModalInstruction.RESET_UPDATE_COMMAND] = False

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
            processDescription: str | None = row["PROCESS_DESCRIPTION"]
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

def _createProcessCommand(processId: int, commandData: dict):

    # Validate that both processId has been provided and is integer
    if not isinstance(processId, int):
        return False

    # Validate that commandData dictionary has all required keys
    requiredKeys = [propertyKey for propertyKey in dir(CommandUpdateProperty) if not (propertyKey.startswith('__') and propertyKey.endswith('__'))]
    cleansedCommandData = { key: commandData[key] for key in commandData.keys() if key in requiredKeys }
    if len(cleansedCommandData.keys()) != len(requiredKeys):
        return False
    
    # Escape values and store None values as NULL
    formattedCommandData = escapeValuesForSQL(cleansedCommandData)

    # Construct SQL command to create process command
    commandDataWithIdentifiers = {
        **formattedCommandData,
        "PROCESS_ID": processId,
        "PROCESS_CMD_ID": f"(SELECT MAX(PROCESS_CMD_ID) + 10 FROM process_cmd WHERE PROCESS_ID = {processId})" # Dynamically generate process command ID
    }
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction = "create_process_command",
        parameters = commandDataWithIdentifiers
    )

    # Execute SQL command
    db = DatabaseConnection()
    try:
        db.executeSQL(sqlCommand=cmdStr)

        # Update process data in session state
        processData = st.session_state[StateVariable.PROCESS_DATA]
        selectedProcess = [process for process in processData if process['id'] == processId][0]
        selectedProcess['steps'].append(cleansedCommandData)
        st.session_state[StateVariable.PROCESS_DATA] = processData

        return True

    except Exception as e:
        logger.error(f'Error creating process command: {e}')
        return False

def _updateProcessCommand(processId: int, commandId: int, updates: dict):

    # Validate that both processId and commandId have been provided and are integers
    if not isinstance(processId, int) or not isinstance(commandId, int):
        return False

    # Validate that updates dictionary has at least one update where the update key is a value in the CommandUpdateProperty enum
    validPropertyKeys = [propertyKey for propertyKey in dir(CommandUpdateProperty) if not (propertyKey.startswith('__') and propertyKey.endswith('__'))]
    cleansedUpdates = { key: updates[key] for key in updates.keys() if key in validPropertyKeys }
    if len(cleansedUpdates.keys()) == 0:
        return False

    # Escape values and store None values as NULL
    formattedUpdates = escapeValuesForSQL(cleansedUpdates)

    # Construct SQL command to update process command
    updatesWithIdentifiers = {
        **formattedUpdates,
        "PROCESS_ID": processId,
        "PROCESS_CMD_ID": commandId
    }
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction = "update_process_command",
        parameters = updatesWithIdentifiers
    )

    # Execute SQL command
    db = DatabaseConnection()
    try:
        db.executeSQL(sqlCommand=cmdStr)

        # Update process data in session state
        processData = st.session_state[StateVariable.PROCESS_DATA]
        selectedProcess = [process for process in processData if process['id'] == processId][0]
        selectedCommand = [command for command in selectedProcess['steps'] if command['PROCESS_CMD_ID'] == commandId][0]
        for update in cleansedUpdates.keys():
            selectedCommand[update] = cleansedUpdates[update]
        st.session_state[StateVariable.PROCESS_DATA] = processData

        return True
    except Exception as e:
        logger.error(f'Error updating process command: {e}')
        return False


def main():
    _setUpPageLayout()
    _loadCustomCSS()
    _setUpStateInstructions()

    # Fetch process data if it hasn't been fetched previously
    processesTableData = None
    if StateVariable.PROCESS_DATA not in st.session_state:
        with st.spinner("Fetching Metadata from DB..."):
            st.session_state[StateVariable.PROCESS_DATA] = _loadListOfProcesses()

    # Render processes table component
    processesTableData = processesTable(
        key = 'processTable', 
        processData = st.session_state[StateVariable.PROCESS_DATA],
        instructions = {
            ProcessTableInstruction.RESET_CREATE_COMMAND: st.session_state[ProcessTableInstruction.RESET_CREATE_COMMAND],
            ProcessTableInstruction.RESET_SELECTED_COMMAND: st.session_state[ProcessTableInstruction.RESET_SELECTED_COMMAND]
        }
    )

    # Render Create New Command Modal (if user has clicked the create command button)
    createCommandModalData = None
    if processesTableData != None:
        if processesTableData.get('createCommand') != None:
            createCommandModalData = createCommandModal(
                key = 'modal',
                commandData = processesTableData.get('createCommand'),
                instructions = {
                    CreateCommandModalInstruction.RESET_PROCESSING_INDICATOR: st.session_state[CreateCommandModalInstruction.RESET_PROCESSING_INDICATOR]
                }
            )

            # Check for instructions from the modal that require performing activities on the Python side
            if createCommandModalData != None:

                if createCommandModalData.get('createCommand') == None:
                    st.session_state[ProcessTableInstruction.RESET_CREATE_COMMAND] = True
                    st.experimental_rerun()

                elif createCommandModalData.get('createCommand').get('processing') == True: # User has submitted new command data -> store new command in db
                    if st.session_state[CreateCommandModalInstruction.RESET_PROCESSING_INDICATOR] != True: # Create command instructions hasn't yet been executed in db
                        _createProcessCommand(
                            createCommandModalData.get('createCommand').get('process').get('id'),
                            createCommandModalData.get('createCommand').get('data')
                        )
                        st.session_state[CreateCommandModalInstruction.RESET_PROCESSING_INDICATOR] = True
                        st.experimental_rerun()
                    
                    else:
                        st.session_state[ProcessTableInstruction.RESET_CREATE_COMMAND] = False

                elif createCommandModalData.get('createCommand').get('processing') == False:
                    st.session_state[CreateCommandModalInstruction.RESET_PROCESSING_INDICATOR] = False

        else: # Create command button has not been clicked -> reset RESET_CREATE_COMMAND instruction
            st.session_state[ProcessTableInstruction.RESET_CREATE_COMMAND] = False

    # Render process commands modal component (if a command has been selected in the processes table component)
    commandModalData = None
    if processesTableData != None:
        if processesTableData.get('selectedCommand') != None:
            commandModalData = processCommandsModal(
                key = 'modal',
                processData = processesTableData.get('processData'),
                selectedProcessId = processesTableData.get('selectedProcess').get('id'),
                selectedCommandId = processesTableData.get('selectedCommand').get('PROCESS_CMD_ID'),
                instructions = {
                    EditCommandModalInstruction.RESET_UPDATE_COMMAND: st.session_state[EditCommandModalInstruction.RESET_UPDATE_COMMAND]
                }
            )

            # Check for instructions from the modal that require performing activities on the Python side
            if commandModalData != None:

                if commandModalData.get('updateCommand') != None:
                    if st.session_state[EditCommandModalInstruction.RESET_UPDATE_COMMAND] != True: # Reset update command instruction hasn't yet been performed
                        _updateProcessCommand(processId=processesTableData.get('selectedProcess').get('id'), commandId=processesTableData.get('selectedCommand').get('PROCESS_CMD_ID'), updates=commandModalData.get('updateCommand'))
                        st.session_state[EditCommandModalInstruction.RESET_UPDATE_COMMAND] = True
                        st.experimental_rerun()
                else: # Modal does not request update to be made to command -> reset RESET_UPDATE_COMMAND instruction (since it no longer needs to actively prevent the update command instruction from being performed)
                    st.session_state[EditCommandModalInstruction.RESET_UPDATE_COMMAND] = False

                if commandModalData.get('selectedCommand') == None: # User has closed the modal -> add instruction to deselect selected command in rendered ProcessTable component on next script run
                    st.session_state[ProcessTableInstruction.RESET_SELECTED_COMMAND] = True
                    st.experimental_rerun()

        else: # No command has been selected -> reset RESET_SELECTED_COMMAND instruction (since it no longer needs to ask the ProcessTable component to deselect the selected command in its SharedDataContext)
            st.session_state[ProcessTableInstruction.RESET_SELECTED_COMMAND] = False

if __name__ == "__main__":
    # tips_project.toml file is needed for next command to run
    # Initialise globals
    globals.initGlobals()    
    main()