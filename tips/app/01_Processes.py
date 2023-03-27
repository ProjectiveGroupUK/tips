# Python
import logging
import json
from datetime import datetime

# import asyncio

# Streamlit
import streamlit as st

# TIPS
from tips.framework.db.database_connection import DatabaseConnection
from tips.framework.utils.sql_template import SQLTemplate
from tips.utils.logger import Logger
from tips.utils.utils import Globals, escapeValuesForSQL
from tips.framework.app import App


# Components
from utils import processesTable, processModal, commandModal

# Enums
from tips.app.enums import StateVariable, ProcessDataProperty, CommandDataProperty
from tips.app.enums import (
    ProcessTableInstruction,
    ProcessModalInstruction,
    CommandModalInstruction,
    ExecutionStatus,
    OperationType,
)

#Logger initialisation
logger = logging.getLogger(Logger.getRootLoggerName())
globals = Globals()

def _setUpPageLayout():
    st.set_page_config(page_title="TIPS", page_icon="✨", layout="wide")


def _loadCustomCSS():
    st.markdown(
        '<style>iframe[title="utils.react_component_modal"] {width: 100vw; height: 100vh}</style>',
        unsafe_allow_html=True,
    )  # Makes the modal full screen
    st.markdown(
        '<style>iframe[title="utils.react_component_processTable"] {min-height: 20rem;}</style>',
        unsafe_allow_html=True,
    )  # Sets minimum height for processTable iframe (othwerwise menu dropdown may be cut off if too few processes are rendered)


def _setUpStateInstructions():
    if ProcessTableInstruction.RESET_EDIT_PROCESS not in st.session_state:
        st.session_state[ProcessTableInstruction.RESET_EDIT_PROCESS] = False

    if ProcessTableInstruction.RESET_COMMAND not in st.session_state:
        st.session_state[ProcessTableInstruction.RESET_COMMAND] = False

    if ProcessModalInstruction.EXECUTION_STATUS not in st.session_state:
        st.session_state[ProcessModalInstruction.EXECUTION_STATUS] = {
            "status": ExecutionStatus.NONE
        }

    if ProcessModalInstruction.PROCESS_RUN_STATUS not in st.session_state:
        st.session_state[ProcessModalInstruction.PROCESS_RUN_STATUS] = {}

    if (
        CommandModalInstruction.CHANGE_UPDATE_COMMAND_TO_CREATE_COMMAND
        not in st.session_state
    ):
        st.session_state[
            CommandModalInstruction.CHANGE_UPDATE_COMMAND_TO_CREATE_COMMAND
        ] = None

    if CommandModalInstruction.EXECUTION_STATUS not in st.session_state:
        st.session_state[CommandModalInstruction.EXECUTION_STATUS] = {
            "status": ExecutionStatus.NONE
        }


def _loadListOfProcesses():
    db = DatabaseConnection()
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="framework_metadata",
        parameters={"process_name": "ALL"},
    )

    fetchedProcessData = (
        []
    )  # Stores list of processes fetched from SQL query (in results variable). May be a two-dimensional array of

    try:
        results: dict = db.executeSQL(sqlCommand=cmdStr)

        # Iterate through keys in dictionary 'results' and for each unique process name, capture process details in 'fetchedProcessData'
        for row in results:

            indexOfExistingProcess = [
                i
                for i, process in enumerate(fetchedProcessData)
                if process[ProcessDataProperty.PROCESS_ID]
                == row[ProcessDataProperty.PROCESS_ID]
            ]
            if (
                len(indexOfExistingProcess) == 0
            ):  # If process id hasn't been captured yet, load whole record as new process with a command
                processHasCommands = row[CommandDataProperty.PROCESS_CMD_ID] is not None
                processRecord = {
                    ProcessDataProperty.PROCESS_ID: row[ProcessDataProperty.PROCESS_ID],
                    ProcessDataProperty.PROCESS_NAME: row[
                        ProcessDataProperty.PROCESS_NAME
                    ],
                    ProcessDataProperty.PROCESS_DESCRIPTION: row[
                        ProcessDataProperty.PROCESS_DESCRIPTION
                    ],
                    ProcessDataProperty.ACTIVE: row["PROCESS_ACTIVE"],
                }
                if processHasCommands:
                    processRecord["steps"] = [_stripStepDict(row)]
                else:
                    processRecord["steps"] = []
                fetchedProcessData.append(processRecord)
            else:  # If iterating over row for already-captured proces, just capture the command information within the commands array of the already-captured process
                fetchedProcessData[indexOfExistingProcess[0]]["steps"].append(
                    _stripStepDict(row)
                )

    except Exception as e:
        logger.error(f"Error loading list of processes: {e}")

    return fetchedProcessData


def _stripStepDict(
    stepDict: dict,
):  # Removes process keys from dictionary intended to store data on process's command, since the command dictionary is nested within the process dictionary (which contains the process's details already)
    strippedDict = stepDict.copy()
    strippedDict.pop(ProcessDataProperty.PROCESS_ID)
    strippedDict.pop(ProcessDataProperty.PROCESS_NAME)
    strippedDict.pop(ProcessDataProperty.PROCESS_DESCRIPTION)
    strippedDict.pop(
        "PROCESS_ACTIVE"
    )  # uses alias because 'ACTIVE' (i.e., the name of the column as it exists in the table) is the same as the name of the CommandDataProperty active status column
    return strippedDict


def _createProcess(newProcessData: dict):

    # Validate that newProcessData has been provided and is a dictionary
    if not isinstance(newProcessData, dict):
        logger.error(
            f"newProcessData is not an integer: '{newProcessData}' (type: {type(newProcessData).__name__})"
        )
        return ExecutionStatus.FAIL

    # Cleanse newProcessData dictionary so that it contains only properties which are allowed to be updated
    allowedProperties = [
        propertyKey
        for propertyKey in dir(ProcessDataProperty)
        if not (
            (propertyKey.startswith("__") and propertyKey.endswith("__"))
            or propertyKey == ProcessDataProperty.PROCESS_ID
        )
    ]
    cleansedProcessData = {
        key: newProcessData[key]
        for key in newProcessData.keys()
        if key in allowedProperties
    }
    if len(allowedProperties) == 0:
        logger.error("No valid updates provided")
        return ExecutionStatus.FAIL

    # Escape values and store None values as NULL
    formattedCommandData = escapeValuesForSQL(cleansedProcessData)

    # Construct SQL command to create process command
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="create_process", parameters=formattedCommandData
    )

    # Execute SQL command
    db = DatabaseConnection()
    try:
        db.executeSQL(sqlCommand=cmdStr)

        # Retrieve PROCESS_ID of newly-created process command
        response = db.executeSQL(
            sqlCommand=f"SELECT MAX({ProcessDataProperty.PROCESS_ID}) AS {ProcessDataProperty.PROCESS_ID} FROM tips_md_schema.process"
        )
        newProcessId: int = response[0][ProcessDataProperty.PROCESS_ID]

        # Update PROCESS_ID of newly-created process in cleansedCommandData (since it'll be added to the PROCESS_DATA session state)
        cleansedProcessData[ProcessDataProperty.PROCESS_ID] = newProcessId
        cleansedProcessData["steps"] = []

        # Update process data in session state
        processData = st.session_state[StateVariable.PROCESS_DATA]
        processData.append(cleansedProcessData)
        st.session_state[StateVariable.PROCESS_DATA] = processData

        return (ExecutionStatus.SUCCESS, newProcessId)

    except Exception as e:
        logger.error(f"Error creating process: {e}")
        return ExecutionStatus.FAIL


def _updateProcess(processId: int, updatedData: dict):

    # Validate that processId has been provided and is integer
    if not isinstance(processId, int):
        logger.error(
            f"processId '{processId}' ({type(processId).__name__}) is not an integer"
        )
        return ExecutionStatus.FAIL

    # Validate that updates dictionary has at least one update where the update key is a value in the CommandDataProperty enum
    validPropertyKeys = [
        propertyKey
        for propertyKey in dir(ProcessDataProperty)
        if not (
            (propertyKey.startswith("__") and propertyKey.endswith("__"))
            or propertyKey == CommandDataProperty.PROCESS_ID
        )
    ]  # Exclude default properties (__propertyName__) and properties which shouldn't be updated via this command (i.e., process id)
    cleansedUpdates = {
        key: updatedData[key] for key in updatedData.keys() if key in validPropertyKeys
    }
    if len(cleansedUpdates.keys()) == 0:
        logger.error("No valid updates provided")
        return ExecutionStatus.FAIL

    # Escape values and store None values as NULL
    formattedUpdates = escapeValuesForSQL(cleansedUpdates)

    # Construct SQL command to update process command
    updatesWithIdentifiers = {
        **formattedUpdates,
        CommandDataProperty.PROCESS_ID: processId,
    }
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="update_process", parameters=updatesWithIdentifiers
    )

    # Execute SQL command
    db = DatabaseConnection()
    try:
        db.executeSQL(sqlCommand=cmdStr)

        # Update process data in session state
        processData = st.session_state[StateVariable.PROCESS_DATA]
        selectedProcess = [
            process
            for process in processData
            if process[ProcessDataProperty.PROCESS_ID] == processId
        ][0]
        for update in cleansedUpdates.keys():
            selectedProcess[update] = cleansedUpdates[update]
        st.session_state[StateVariable.PROCESS_DATA] = processData
        return ExecutionStatus.SUCCESS
    except Exception as e:
        logger.error(f"Error updating process: {e}")
        return ExecutionStatus.FAIL


def _deleteProcess(processId: int):

    # Validate that processId has been provided and is integer
    if not isinstance(processId, int):
        logger.error(
            f"processId '{processId}' ({type(processId).__name__}) is not an integer"
        )
        return ExecutionStatus.FAIL

    # Delete all commands within process
    deleteCommandResult = _deleteProcessCommand(processId=processId, commandId="all")
    if deleteCommandResult != ExecutionStatus.SUCCESS:
        logger.error(f"Error deleting commands within process {processId}")
        return ExecutionStatus.FAIL

    # Construct SQL command to delete process
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="delete_process",
        parameters={ProcessDataProperty.PROCESS_ID: processId},
    )

    # Execute SQL command
    db = DatabaseConnection()
    try:
        db.executeSQL(sqlCommand=cmdStr)

        # Update process data in session state
        processData = st.session_state[StateVariable.PROCESS_DATA]
        processDataWithoutDeletedProcess = [
            process
            for process in processData
            if process[ProcessDataProperty.PROCESS_ID] != processId
        ]
        st.session_state[StateVariable.PROCESS_DATA] = processDataWithoutDeletedProcess
        return ExecutionStatus.SUCCESS
    except Exception as e:
        logger.error(
            f"Error deleting process (although commands for process have been removed): {e}"
        )
        return ExecutionStatus.FAIL


# async def _runProcessTask(processName: str, bindVariables: str, executeFlag: str):
#     def runApp():
#         print('########################')
#         print('Starting Process')
#         st.session_state[ProcessModalInstruction.PROCESS_RUN_STATUS] = {
#             processName: 'STARTING'
#         }
#         app = App(
#             processName=processName,
#             bindVariables=bindVariables,
#             executeFlag=executeFlag,
#         )
#         app.main()
#         st.session_state[ProcessModalInstruction.PROCESS_RUN_STATUS] = {
#             processName: 'COMPLETED'
#         }
#         print('########################')
#         print('Process Completed')

#     asyncio.get_event_loop().run_in_executor(None, runApp)

# def _runProcessAsync(ProcessData: dict):

#     v_process_name = ProcessData.get("PROCESS_NAME")
#     v_vars = ProcessData.get("BIND_VARS")
#     v_exec = ProcessData.get("EXECUTE_FLAG")
#     #Async IO Eventloop initialisation
#     eventLoop = asyncio.new_event_loop()
#     asyncio.set_event_loop(eventLoop)

#     asyncio.get_event_loop().run_until_complete(
#         _runProcessTask(
#             processName=v_process_name, bindVariables=v_vars, executeFlag=v_exec
#         )
#     )

#     return ExecutionStatus.SUCCESS

def _runProcess(ProcessData: dict):

    v_process_name = ProcessData.get("PROCESS_NAME")
    v_vars = ProcessData.get("BIND_VARS")
    v_exec = ProcessData.get("EXECUTE_FLAG")
    
    if v_vars is not None:
        if v_vars.startswith("{") == False or v_vars.endswith("}") == False:
            raise ValueError(
                "Invalid value for argument Bind Variable. Should be in form of Dictionary!"
            )
        v_vars = v_vars.replace("'", '"')
   
    try:
        app = App(
                processName=v_process_name,
                bindVariables=v_vars,
                executeFlag=v_exec,
            )
        app.main()
        return ExecutionStatus.SUCCESS
    except Exception as err:
        logger.error(f'Error occured {err}')
        return ExecutionStatus.FAIL

# def _runProcess(ProcessData: dict):

#     v_process_name = ProcessData.get("PROCESS_NAME")
#     v_vars = ProcessData.get("BIND_VARS")
#     v_exec = ProcessData.get("EXECUTE_FLAG")
    
#     if v_vars is not None:
#         if v_vars.startswith("{") == False or v_vars.endswith("}") == False:
#             raise ValueError(
#                 "Invalid value for argument Bind Variable. Should be in form of Dictionary!"
#             )
#         v_vars = v_vars.replace("'", '"')

#     Logger().addFileHandler(processName=v_process_name)

#     dbConnection: DatabaseConnection = DatabaseConnection()
#     logger.debug("DB Connection established!")

#     start_dt = datetime.now()
#     framework: FrameworkMetaData = FrameworkFactory().getProcess(v_process_name)
#     frameworkMetaData = framework.getMetaData(dbConnection)

#     if len(frameworkMetaData) <= 0:
#         logger.error(
#             "Could not fetch Metadata. Please make sure correct process name is passed and metadata setup has been done correctly first!"
#         )
#     else:
#         logger.info("Fetched Framework Metadata!")
#         processStartTime = start_dt

#         frameworkDQMetaData = framework.getDQMetaData(dbConnection)

        
#         columnMetaData = ColumnMetadata().getData(
#             frameworkMetaData=frameworkMetaData, conn=dbConnection
#         )

#         tableMetaData: TableMetaData = TableMetaData(columnMetaData)

#         frameworkRunner: FrameworkRunner = FrameworkRunner(
#             processName=v_process_name,
#             bindVariables=v_vars,
#             executeFlag=v_exec,
#         )

#         runFramework, dqTestLogs = frameworkRunner.run(
#             conn=dbConnection,
#             tableMetaData=tableMetaData,
#             frameworkMetaData=frameworkMetaData,
#             frameworkDQMetaData=frameworkDQMetaData,
#         )

#         Logger().writeResultJson(runFramework)

#         # Now insert process run log to database
#         processEndTime = datetime.now()
#         results = dbConnection.executeSQL(
#             sqlCommand="SELECT TIPS_MD_SCHEMA.PROCESS_LOG_SEQ.NEXTVAL AS SEQVAL FROM DUAL"
#         )
#         seqVal = results[0]["SEQVAL"]

#         sqlCommand = f"""
# INSERT INTO tips_md_schema.process_log (process_log_id, process_name, process_start_time, process_end_time, process_elapsed_time_in_seconds, execute_flag, status, error_message, log_json)
# SELECT {seqVal}, '{v_process_name}','{processStartTime}','{processEndTime}',{round((processEndTime - processStartTime).total_seconds(),2)},'{v_exec}','{runFramework["status"]}','{runFramework["error_message"]}',PARSE_JSON('{json.dumps(runFramework).replace("'","''")}')
#             """
#         # logger.info(sqlCommand)
#         results = dbConnection.executeSQL(sqlCommand=sqlCommand)

#         # Now insert DQ Logs if any
#         if len(dqTestLogs) > 0:
#             for dqTestLog in dqTestLogs:
#                 sqlCommand = f"""
# INSERT INTO tips_md_schema.process_dq_log (
#     process_log_id
#   , tgt_name
#   , attribute_name
#   , dq_test_name
#   , dq_test_query
#   , dq_test_result
#   , start_time
#   , end_time
#   , elapsed_time_in_seconds
#   , status
#   , status_message
# )
# SELECT {seqVal}
#      , '{dqTestLog["tgt_name"]}'
#      , '{dqTestLog["attribute_name"]}'
#      , '{dqTestLog["dq_test_name"]}'
#      , '{dqTestLog["dq_test_query"].replace("'","''")}'
#      , PARSE_JSON('{json.dumps(dqTestLog["dq_test_result"]).replace("'","''")}')
#      , '{dqTestLog["start_time"]}'
#      , '{dqTestLog["end_time"]}'
#      , '{dqTestLog["elapsed_time_in_seconds"]}'
#      , '{dqTestLog["status"]}'
#      , '{dqTestLog["status_message"]}'
#                     """

#                 results = dbConnection.executeSQL(sqlCommand=sqlCommand)

#         if runFramework.get("status") == "ERROR":
#             error_message = runFramework.get("error_message")
#             logger.error(error_message)
#         elif runFramework.get("status") == "WARNING":
#             warning_message = runFramework.get("warning_message")
#             logger.warning(warning_message)

#     ##dbConnection.closeConnection()
#     Logger().removeFileHandler()
#     end_dt = datetime.now()
#     logger.info(f"Start DateTime: {start_dt}")
#     logger.info(f"End DateTime: {end_dt}")
#     logger.info(
#         f"Total Elapsed Time (secs): {round((end_dt - start_dt).total_seconds(),2)}"
#     )
#     if runFramework.get("status") == "ERROR":
#         return ExecutionStatus.FAIL
#     else:
#         return ExecutionStatus.SUCCESS

def _createProcessCommand(processId: int, commandData: dict):

    # Validate that processId has been provided and is integer
    if not isinstance(processId, int):
        logger.error(
            f"processId is not an integer: '{processId}' (type: {type(processId).__name__})"
        )
        return ExecutionStatus.FAIL

    # Cleanse commandData dictionary so that it contains only properties which are allowed to be updated
    allowedProperties = [
        propertyKey
        for propertyKey in dir(CommandDataProperty)
        if not (propertyKey.startswith("__") and propertyKey.endswith("__"))
    ]
    cleansedCommandData = {
        key: commandData[key] for key in commandData.keys() if key in allowedProperties
    }
    if len(allowedProperties) == 0:
        logger.error("No valid updates provided")
        return ExecutionStatus.FAIL

    # Escape values and store None values as NULL
    formattedCommandData = escapeValuesForSQL(cleansedCommandData)

    # Construct SQL command to create process command
    commandDataWithIdentifiers = {
        **formattedCommandData,
        ProcessDataProperty.PROCESS_ID: processId,
        CommandDataProperty.PROCESS_CMD_ID: f"SELECT COALESCE(MAX({CommandDataProperty.PROCESS_CMD_ID}) + 10, 10)",  # Dynamically generate process command ID as highest existing command ID that exists for process (or 0 if none exists yet), + 10
    }
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="create_process_command", parameters=commandDataWithIdentifiers
    )

    # Execute SQL command
    db = DatabaseConnection()
    try:
        db.executeSQL(sqlCommand=cmdStr)

        # Retrieve PROCESS_CMD_ID of newly-created process command
        response = db.executeSQL(
            sqlCommand=f"SELECT MAX({CommandDataProperty.PROCESS_CMD_ID}) AS {CommandDataProperty.PROCESS_CMD_ID} FROM tips_md_schema.process_cmd WHERE {ProcessDataProperty.PROCESS_ID} = {processId}"
        )
        newCommandId: int = response[0][CommandDataProperty.PROCESS_CMD_ID]

        # Update PROCESS_CMD_ID of newly-created command in commandDataWithIdentifiers (since it'll be added to the PROCESS_DATA session state)
        commandDataWithIdentifiers[CommandDataProperty.PROCESS_CMD_ID] = newCommandId

        # Update process data in session state
        processData = st.session_state[StateVariable.PROCESS_DATA]
        selectedProcess = [
            process
            for process in processData
            if process[ProcessDataProperty.PROCESS_ID] == processId
        ][0]
        selectedProcess["steps"].append(
            {
                propertyName: (
                    processId
                    if propertyName == ProcessDataProperty.PROCESS_ID
                    else newCommandId
                    if propertyName == CommandDataProperty.PROCESS_CMD_ID
                    else propertyValue
                )
                for propertyName, propertyValue in cleansedCommandData.items()
            }
        )  # Insert command data prior to when it was escaped (i.e., cleansedCommandData), and add process and command Ids
        st.session_state[StateVariable.PROCESS_DATA] = processData

        return (ExecutionStatus.SUCCESS, newCommandId)

    except Exception as e:
        logger.error(f"Error creating process command: {e}")
        return ExecutionStatus.FAIL


def _updateProcessCommand(processId: int, commandId: int, updatedData: dict):

    # Validate that both processId and commandId have been provided and are integers
    if not isinstance(processId, int) or not isinstance(commandId, int):
        logger.error(
            f"processId ('{processId}' {type(processId).__name__}) and/or command ID ('{commandId}' {type(commandId).__name__}) is not an integer"
        )
        return ExecutionStatus.FAIL

    # Validate that updates dictionary has at least one update where the update key is a value in the CommandDataProperty enum
    validPropertyKeys = [
        propertyKey
        for propertyKey in dir(CommandDataProperty)
        if not (
            (propertyKey.startswith("__") and propertyKey.endswith("__"))
            or (
                propertyKey == CommandDataProperty.PROCESS_ID
                or propertyKey == CommandDataProperty.PROCESS_CMD_ID
            )
        )
    ]  # Exclude default properties (__propertyName__) and properties which shouldn't be updated via this command (i.e., process id and process command id)
    cleansedUpdates = {
        key: updatedData[key] for key in updatedData.keys() if key in validPropertyKeys
    }
    if len(cleansedUpdates.keys()) == 0:
        logger.error("No valid updates provided")
        return ExecutionStatus.FAIL

    # Escape values and store None values as NULL
    formattedUpdates = escapeValuesForSQL(cleansedUpdates)

    # Construct SQL command to update process command
    updatesWithIdentifiers = {
        **formattedUpdates,
        CommandDataProperty.PROCESS_ID: processId,
        CommandDataProperty.PROCESS_CMD_ID: commandId,
    }
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="update_process_command", parameters=updatesWithIdentifiers
    )

    # Execute SQL command
    db = DatabaseConnection()
    try:
        db.executeSQL(sqlCommand=cmdStr)

        # Update process data in session state
        processData = st.session_state[StateVariable.PROCESS_DATA]
        selectedProcess = [
            process
            for process in processData
            if process[ProcessDataProperty.PROCESS_ID] == processId
        ][0]
        selectedCommand = [
            command
            for command in selectedProcess["steps"]
            if command[CommandDataProperty.PROCESS_CMD_ID] == commandId
        ][0]
        for update in cleansedUpdates.keys():
            selectedCommand[update] = cleansedUpdates[update]
        st.session_state[StateVariable.PROCESS_DATA] = processData

        return ExecutionStatus.SUCCESS
    except Exception as e:
        logger.error(f"Error updating process command: {e}")
        return ExecutionStatus.FAIL


def _deleteProcessCommand(
    processId: int, commandId
):  # processId: int, commandId: int | 'all'

    # Validate that processId has been provided and is integer
    if not isinstance(processId, int):
        logger.error(
            f"processId ('{processId}' {type(processId).__name__}) is not an integer"
        )
        return ExecutionStatus.FAIL

    # Validate that commandId has been provided and is integer or 'all'
    if not isinstance(commandId, int) and commandId != "all":
        logger.error(
            f"commandId ('{commandId}' {type(commandId).__name__}) is not an integer or string literal 'all'"
        )
        return ExecutionStatus.FAIL

    # Construct SQL command to delete process command
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="delete_process_command",
        parameters={
            ProcessDataProperty.PROCESS_ID: processId,
            CommandDataProperty.PROCESS_CMD_ID: commandId,
        },
    )

    # Execute SQL command
    db = DatabaseConnection()
    try:
        db.executeSQL(sqlCommand=cmdStr)

        # Update process data in session state
        processData = st.session_state[StateVariable.PROCESS_DATA]
        selectedProcess = [
            process
            for process in processData
            if process[ProcessDataProperty.PROCESS_ID] == processId
        ][0]
        processCommandsWithoutRemovedCommand = (
            []
            if commandId == "all"
            else [
                command
                for command in selectedProcess["steps"]
                if command[CommandDataProperty.PROCESS_CMD_ID] != commandId
            ]
        )
        selectedProcess["steps"] = processCommandsWithoutRemovedCommand
        st.session_state[StateVariable.PROCESS_DATA] = processData

        return ExecutionStatus.SUCCESS
    except Exception as e:
        logger.error(f"Error updating process command: {e}")
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
        key="processTable",
        processData=st.session_state[StateVariable.PROCESS_DATA],
        instructions={
            ProcessTableInstruction.RESET_EDIT_PROCESS: st.session_state[
                ProcessTableInstruction.RESET_EDIT_PROCESS
            ],
            ProcessTableInstruction.RESET_COMMAND: st.session_state[
                ProcessTableInstruction.RESET_COMMAND
            ],
        },
    )

    # Render processModal if user intends to create or edit a process
    processModalData = None
    if processesTableData != None:
        processTableProcess = processesTableData.get("editedProcess")

        if processTableProcess != None:

            # Prepare modal parameters
            preparedOperationType = (
                OperationType.RUN
                if processTableProcess.get("operation").get("type") == OperationType.RUN
                else OperationType.CREATE
                if (
                    processTableProcess.get("operation").get("type")
                    == OperationType.CREATE
                    and st.session_state[
                        ProcessModalInstruction.CHANGE_UPDATE_PROCESS_TO_CREATE_PROCESS
                    ]
                    == None
                )
                else OperationType.EDIT
            )
            preparedProcess = processTableProcess.get("process")
            if (
                st.session_state[
                    ProcessModalInstruction.CHANGE_UPDATE_PROCESS_TO_CREATE_PROCESS
                ]
                != None
            ):
                preparedProcess[ProcessDataProperty.PROCESS_ID] = st.session_state[
                    ProcessModalInstruction.CHANGE_UPDATE_PROCESS_TO_CREATE_PROCESS
                ]

            # Render processModal
            processModalData = processModal(
                key="modal",
                operationType=preparedOperationType,
                process=preparedProcess,
                instructions={
                    ProcessModalInstruction.EXECUTION_STATUS: st.session_state[
                        ProcessModalInstruction.EXECUTION_STATUS
                    ]
                },
            )

            # Check for instructions from the modal that require performing activities on the Python side
            if processModalData != None:
                processModalProcess = processModalData.get("process")

                if processModalProcess == None:
                    st.session_state[ProcessTableInstruction.RESET_EDIT_PROCESS] = True
                    st.experimental_rerun()

                elif (
                    processModalProcess.get("executionStatus")
                    == ExecutionStatus.RUNNING
                    and st.session_state[ProcessModalInstruction.EXECUTION_STATUS].get(
                        "status"
                    )
                    == ExecutionStatus.NONE
                ):  # Execution of operation has been requested, but Python hasn't started executing it yet -> execute operation
                    result = None
                    if (
                        processModalProcess.get("operation").get("type")
                        == OperationType.CREATE
                    ):
                        result = _createProcess(
                            newProcessData=processModalProcess.get("process")
                        )
                    elif (
                        processModalProcess.get("operation").get("type")
                        == OperationType.EDIT
                    ):
                        result = _updateProcess(
                            processId=processModalProcess.get("process").get(
                                ProcessDataProperty.PROCESS_ID
                            ),
                            updatedData=processModalProcess.get("process"),
                        )
                    elif (
                        processModalProcess.get("operation").get("type")
                        == OperationType.DELETE
                    ):
                        result = _deleteProcess(
                            processId=processModalProcess.get("process").get(
                                ProcessDataProperty.PROCESS_ID
                            )
                        )
                    elif (
                        processModalProcess.get("operation").get("type")
                        == OperationType.RUN
                    ):
                        result = _runProcess(
                            ProcessData=processModalProcess.get("process")
                        )

                    resultStatus = (
                        result[0] if isinstance(result, tuple) else result
                    )  # A successful update process operation returns a tuple where first element is execution status and second is the ID of the newly-created process
                    newProcessId = result[1] if isinstance(result, tuple) else None
                    st.session_state[ProcessModalInstruction.EXECUTION_STATUS] = {
                        "status": resultStatus,
                        "operationType": processModalProcess.get("operation").get(
                            "type"
                        ),
                    }

                    if newProcessId != None:
                        st.session_state[
                            ProcessModalInstruction.CHANGE_UPDATE_PROCESS_TO_CREATE_PROCESS
                        ] = newProcessId

                    st.experimental_rerun()

                elif processModalProcess.get("executionStatus") == ExecutionStatus.NONE:
                    st.session_state[ProcessModalInstruction.EXECUTION_STATUS] = {
                        "status": ExecutionStatus.NONE
                    }

        else:  # Process table does not instruct command modal to appear -> reset instruction to be used again when modal is present
            st.session_state[ProcessTableInstruction.RESET_EDIT_PROCESS] = False
            st.session_state[
                ProcessModalInstruction.CHANGE_UPDATE_PROCESS_TO_CREATE_PROCESS
            ] = None

    # Render commandModal if user intends to create or edit a command
    commandModalData = None
    if processesTableData != None:
        processTableCommand = processesTableData.get("command")

        if processTableCommand != None:

            # Prepare modal parameters
            preparedOperationType = (
                processTableCommand.get("operation").get("type")
                if st.session_state[
                    CommandModalInstruction.CHANGE_UPDATE_COMMAND_TO_CREATE_COMMAND
                ]
                == None
                else OperationType.EDIT
            )
            preparedCommand = processTableCommand.get("command")
            if (
                st.session_state[
                    CommandModalInstruction.CHANGE_UPDATE_COMMAND_TO_CREATE_COMMAND
                ]
                != None
            ):
                preparedCommand[CommandDataProperty.PROCESS_CMD_ID] = st.session_state[
                    CommandModalInstruction.CHANGE_UPDATE_COMMAND_TO_CREATE_COMMAND
                ]

            # Render commandModal
            commandModalData = commandModal(
                key="modal",
                operationType=preparedOperationType,
                process=processTableCommand.get("process"),
                command=preparedCommand,
                instructions={
                    CommandModalInstruction.EXECUTION_STATUS: st.session_state[
                        CommandModalInstruction.EXECUTION_STATUS
                    ],
                },
            )

            # Check for instructions from the modal that require performing activities on the Python side
            if commandModalData != None:
                commandModalCommand = commandModalData.get("command")

                if commandModalCommand == None:
                    st.session_state[ProcessTableInstruction.RESET_COMMAND] = True
                    st.experimental_rerun()

                elif (
                    commandModalCommand.get("executionStatus")
                    == ExecutionStatus.RUNNING
                    and st.session_state[CommandModalInstruction.EXECUTION_STATUS].get(
                        "status"
                    )
                    == ExecutionStatus.NONE
                ):  # Execution of operation has been requested, but Python hasn't started executing it yet -> execute operation
                    result = None
                    if (
                        commandModalCommand.get("operation").get("type")
                        == OperationType.CREATE
                    ):
                        result = _createProcessCommand(
                            processId=commandModalCommand.get("process").get(
                                ProcessDataProperty.PROCESS_ID
                            ),
                            commandData=commandModalCommand.get("command"),
                        )
                    elif (
                        commandModalCommand.get("operation").get("type")
                        == OperationType.EDIT
                    ):
                        result = _updateProcessCommand(
                            processId=commandModalCommand.get("process").get(
                                ProcessDataProperty.PROCESS_ID
                            ),
                            commandId=commandModalCommand.get("command").get(
                                CommandDataProperty.PROCESS_CMD_ID
                            ),
                            updatedData=commandModalCommand.get("command"),
                        )
                    elif (
                        commandModalCommand.get("operation").get("type")
                        == OperationType.DELETE
                    ):
                        result = _deleteProcessCommand(
                            processId=commandModalCommand.get("process").get(
                                ProcessDataProperty.PROCESS_ID
                            ),
                            commandId=commandModalCommand.get("command").get(
                                CommandDataProperty.PROCESS_CMD_ID
                            ),
                        )

                    resultStatus = (
                        result[0] if isinstance(result, tuple) else result
                    )  # A successful create command operation returns a tuple where first element is execution status and second is the ID of the newly-created command
                    newProcessId = result[1] if isinstance(result, tuple) else None
                    st.session_state[CommandModalInstruction.EXECUTION_STATUS] = {
                        "status": resultStatus,
                        "operationType": commandModalCommand.get("operation").get(
                            "type"
                        ),
                    }

                    if newProcessId != None:
                        st.session_state[
                            CommandModalInstruction.CHANGE_UPDATE_COMMAND_TO_CREATE_COMMAND
                        ] = newProcessId

                    st.experimental_rerun()

                elif commandModalCommand.get("executionStatus") == ExecutionStatus.NONE:
                    st.session_state[CommandModalInstruction.EXECUTION_STATUS] = {
                        "status": ExecutionStatus.NONE
                    }

        else:  # Process table does not instruct command modal to appear -> reset instructions to be used again when modal is present
            st.session_state[ProcessTableInstruction.RESET_COMMAND] = False

            # Comand modal is not showing -> reset CHANGE_UPDATE_COMMAND_TO_CREATE_COMMAND instruction
            st.session_state[
                CommandModalInstruction.CHANGE_UPDATE_COMMAND_TO_CREATE_COMMAND
            ] = None


if __name__ == "__main__":
    # tips_project.toml file is needed for next command to run
    # Initialise globals
    globals.initGlobals()
    main()
