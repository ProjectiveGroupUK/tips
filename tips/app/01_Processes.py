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
from utils import processesTable, commandModal

# Enums
from tips.app.enums import StateVariable, ProcessDataProperty, CommandDataProperty
from tips.app.enums import ProcessTableInstruction, CommandModalInstruction, ExecutionStatus, CommandOperationType

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

    if CommandModalInstruction.CHANGE_UPDATE_COMMAND_TO_CREATE_COMMAND not in st.session_state:
        st.session_state[CommandModalInstruction.CHANGE_UPDATE_COMMAND_TO_CREATE_COMMAND] = None

    if CommandModalInstruction.EXECUTION_STATUS not in st.session_state:
        st.session_state[CommandModalInstruction.EXECUTION_STATUS] = { 'status': ExecutionStatus.NONE }

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
            processID: str = row[ProcessDataProperty.PROCESS_ID]
            processName: str = row[ProcessDataProperty.PROCESS_NAME]
            processDescription: str | None = row[ProcessDataProperty.PROCESS_DESCRIPTION]
            processStatus = "active" if row[ProcessDataProperty.PROCESS_ACTIVE] == "Y" else "inactive"
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
    strippedDict.pop(ProcessDataProperty.PROCESS_ID)
    strippedDict.pop(ProcessDataProperty.PROCESS_NAME)
    strippedDict.pop(ProcessDataProperty.PROCESS_DESCRIPTION)
    strippedDict.pop(ProcessDataProperty.PROCESS_ACTIVE)
    return strippedDict

def _createProcessCommand(processId: int, commandData: dict):

    # Validate that both processId has been provided and is integer
    if not isinstance(processId, int):
        logger.error(f"Process ID is not an integer: '{processId}' (type: {type(processId)})")
        return ExecutionStatus.FAIL

    # Cleanse commandData dictionary so that it contains only properties which are allowed to be updated
    allowedProperties = [propertyKey for propertyKey in dir(CommandDataProperty) if not (propertyKey.startswith('__') and propertyKey.endswith('__'))]
    cleansedCommandData = { key: commandData[key] for key in commandData.keys() if key in allowedProperties }
    if len(allowedProperties) == 0:
        logger.error("No valid updates provided")
        return ExecutionStatus.FAIL
    
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
        
        # Retrieve process ID of newly-created process command
        response = db.executeSQL(sqlCommand=f"SELECT MAX(PROCESS_CMD_ID) AS PROCESS_CMD_ID FROM process_cmd WHERE PROCESS_ID = {processId}")
        newCommandId: int = response[0][CommandDataProperty.PROCESS_CMD_ID]

        # Update PROCESS_CMD_ID of newly-created command in commandDataWithIdentifiers (since it'll be added to the PROCESS_DATA session state)
        commandDataWithIdentifiers[CommandDataProperty.PROCESS_CMD_ID] = newCommandId

        # Update process data in session state
        processData = st.session_state[StateVariable.PROCESS_DATA]
        selectedProcess = [process for process in processData if process['id'] == processId][0]
        selectedProcess['steps'].append({propertyName: (processId if propertyName == ProcessDataProperty.PROCESS_ID else newCommandId if propertyName == CommandDataProperty.PROCESS_CMD_ID else propertyValue) for propertyName, propertyValue in cleansedCommandData.items()}) # Insert command data prior to when it was escaped (i.e., cleansedCommandData), and add process and command Ids
        st.session_state[StateVariable.PROCESS_DATA] = processData

        return (ExecutionStatus.SUCCESS, newCommandId)

    except Exception as e:
        logger.error(f'Error creating process command: {e}')
        return ExecutionStatus.FAIL

def _updateProcessCommand(processId: int, commandId: int, updatedData: dict):

    # Validate that both processId and commandId have been provided and are integers
    if not isinstance(processId, int) or not isinstance(commandId, int):
        logger.error(f"Process ID ('{processId}' {type(processId)}) and/or command ID ('{commandId}' {type(commandId)}) is not an integer")
        return ExecutionStatus.FAIL

    # Validate that updates dictionary has at least one update where the update key is a value in the CommandDataProperty enum
    validPropertyKeys = [propertyKey for propertyKey in dir(CommandDataProperty) if not ((propertyKey.startswith('__') and propertyKey.endswith('__')) or (propertyKey == CommandDataProperty.PROCESS_ID or propertyKey == CommandDataProperty.PROCESS_CMD_ID))] # Exclude default properties (__propertyName__) and properties which shouldn't be updated via this command (i.e., process id and process command id)
    cleansedUpdates = { key: updatedData[key] for key in updatedData.keys() if key in validPropertyKeys }
    if len(cleansedUpdates.keys()) == 0:
        logger.error('No valid updates provided')
        return ExecutionStatus.FAIL

    # Escape values and store None values as NULL
    formattedUpdates = escapeValuesForSQL(cleansedUpdates)

    # Construct SQL command to update process command
    updatesWithIdentifiers = {
        **formattedUpdates,
        CommandDataProperty.PROCESS_ID: processId,
        CommandDataProperty.PROCESS_CMD_ID: commandId
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
        selectedCommand = [command for command in selectedProcess['steps'] if command[CommandDataProperty.PROCESS_CMD_ID] == commandId][0]
        for update in cleansedUpdates.keys():
            selectedCommand[update] = cleansedUpdates[update]
        st.session_state[StateVariable.PROCESS_DATA] = processData

        return ExecutionStatus.SUCCESS
    except Exception as e:
        logger.error(f'Error updating process command: {e}')
        return ExecutionStatus.FAIL


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
            ProcessTableInstruction.RESET_SELECTED_COMMAND: st.session_state[ProcessTableInstruction.RESET_SELECTED_COMMAND],
        }
    )

    # Render CommandModal if user intends to create or edit a command
    commandModalData = None
    if processesTableData != None:
        createCommand = processesTableData.get('createCommand')
        updateCommand = processesTableData.get('updateCommand')

        if createCommand != None or updateCommand != None:

            # Prepare modal parameters
            preparedOperationType = 'create' if (createCommand != None and st.session_state[CommandModalInstruction.CHANGE_UPDATE_COMMAND_TO_CREATE_COMMAND] == None) else 'edit'
            preparedCommand = createCommand.get('data') if createCommand != None else updateCommand.get('data')
            if st.session_state[CommandModalInstruction.CHANGE_UPDATE_COMMAND_TO_CREATE_COMMAND] != None:
                preparedCommand[CommandDataProperty.PROCESS_CMD_ID] = st.session_state[CommandModalInstruction.CHANGE_UPDATE_COMMAND_TO_CREATE_COMMAND]

            # Render commandModal
            commandModalData = commandModal(
                key = 'modal',
                operationType = preparedOperationType,
                process = createCommand.get('process') if createCommand != None else updateCommand.get('process'),
                command = preparedCommand,
                instructions = {
                    CommandModalInstruction.EXECUTION_STATUS: st.session_state[CommandModalInstruction.EXECUTION_STATUS],
                }
            )

            # Check for instructions from the modal that require performing activities on the Python side
            if commandModalData != None:
                command = commandModalData.get('command')

                if command == None:
                    st.session_state[ProcessTableInstruction.RESET_CREATE_COMMAND] = True
                    st.session_state[ProcessTableInstruction.RESET_SELECTED_COMMAND] = True
                    st.experimental_rerun()

                elif command.get('executionStatus') == ExecutionStatus.RUNNING and st.session_state[CommandModalInstruction.EXECUTION_STATUS].get('status') == ExecutionStatus.NONE: # Execution of operation has been requested, but Python hasn't started executing it yet -> execute operation
                        result = None
                        if command.get('operation').get('type') == 'create':
                            result = _createProcessCommand(
                                processId = command.get('process').get('id'),
                                commandData = command.get('command')
                            )
                        elif command.get('operation').get('type') == 'edit':
                            result = _updateProcessCommand(
                                processId = command.get('process').get('id'),
                                commandId = command.get('command').get(CommandDataProperty.PROCESS_CMD_ID),
                                updatedData = command.get('command')
                            )

                        resultStatus = result[0] if isinstance(result, tuple) else result # A successful create command operation returns a tuple where first element is execution status and second is the ID of the newly-created command
                        newCommandId = result[1] if isinstance(result, tuple) else None
                        st.session_state[CommandModalInstruction.EXECUTION_STATUS] = { 'status': resultStatus, 'operationType': CommandOperationType.CREATE if command.get('operation').get('type') == 'create' else CommandOperationType.EDIT }

                        if newCommandId != None:
                            st.session_state[CommandModalInstruction.CHANGE_UPDATE_COMMAND_TO_CREATE_COMMAND] = newCommandId

                        st.experimental_rerun()

                elif command.get('executionStatus') == ExecutionStatus.NONE:
                    st.session_state[CommandModalInstruction.EXECUTION_STATUS] = { 'status': ExecutionStatus.NONE }

        else: # Process table does not instruct command modal to appear -> reset instructions to be used again when modal is present
            st.session_state[ProcessTableInstruction.RESET_CREATE_COMMAND] = False
            st.session_state[ProcessTableInstruction.RESET_SELECTED_COMMAND] = False

            # Comand modal is not showing -> reset CHANGE_UPDATE_COMMAND_TO_CREATE_COMMAND instruction
            logger.warning('resetting instruction')
            st.session_state[CommandModalInstruction.CHANGE_UPDATE_COMMAND_TO_CREATE_COMMAND] = None
            

if __name__ == "__main__":
    # tips_project.toml file is needed for next command to run
    # Initialise globals
    globals.initGlobals()    
    main()