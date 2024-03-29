# Python
import json
import logging
from pathlib import Path

# import asyncio

# Streamlit
import streamlit as st

# TIPS
from tips.utils.database_connection import DatabaseConnection
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

# Logger initialisation
logger = logging.getLogger(Logger.getRootLoggerName())
globals = Globals()


def _setUpPageLayout():
    st.set_page_config(page_title="TiPS", page_icon="✨", layout="wide")
    st.caption("Home > :blue[Processes]")


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
                if (
                    isinstance(row["BIND_VARS"], str)
                    and row["BIND_VARS"][0].strip() in "{["
                ):
                    bindVars = json.loads(row["BIND_VARS"])
                else:
                    bindVars = row["BIND_VARS"]

                bindVarsDict = {}
                for var in bindVars:
                    bindVarsDict[var] = ""

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
                    ProcessDataProperty.BIND_VARS: bindVarsDict,
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
            or propertyKey == ProcessDataProperty.BIND_VARS
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
    kwargs = {"table_name": "tips_md_schema.process"}
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="app_metadata_insert_into_values",
        parameters=formattedCommandData,
        **kwargs,
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
            or propertyKey == ProcessDataProperty.PROCESS_ID
            or propertyKey == ProcessDataProperty.BIND_VARS
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
        ProcessDataProperty.PROCESS_ID: processId,
    }

    kwargs = {
        "table_name": "tips_md_schema.process",
        "where_clause": f"process_id = {processId}",
        "exclude_keys": "['PROCESS_ID']",
    }
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="app_metadata_update", parameters=updatesWithIdentifiers, **kwargs
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
    kwargs = {
        "table_name": "tips_md_schema.process",
        "where_clause": f"process_id = {processId}",
    }
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="app_metadata_delete", parameters={}, **kwargs
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


def _runProcess(ProcessData: dict):

    v_process_name = ProcessData.get("PROCESS_NAME")
    v_exec = ProcessData.get("EXECUTE_FLAG")

    v_vars = {k: v for k, v in ProcessData.get("BIND_VARS").items() if v}
    if v_vars == {}:
        v_vars = None

    try:
        # Create snowflake snowpark session
        db = DatabaseConnection()
        session = db.getSession()

        # Now call framework
        app = App(
            session=session,
            processName=v_process_name,
            bindVariables=v_vars,
            executeFlag=v_exec,
            addLogFileHandler=True,
        )

        # app = App(
        #     processName=v_process_name,
        #     bindVariables=v_vars,
        #     executeFlag=v_exec,
        # )
        app.main()
        return ExecutionStatus.SUCCESS
    except Exception as err:
        logger.error(f"Error occured {err}")
        return ExecutionStatus.FAIL


def _downloadProcess(ProcessData: dict):

    try:
        db = DatabaseConnection()
        metadataFolder = Path.joinpath(globals.getProjectDir(), "metadata")
        if not metadataFolder.exists():
            Path.mkdir(metadataFolder)

        processName = ProcessData.get("PROCESS_NAME")

        scriptFile = Path.joinpath(metadataFolder, f"{processName.lower()}.sql")

        with open(scriptFile, "w") as f:
            ## SQL to Delete from Process Command table
            cmd = f"""
--Delete existing records for {processName}, if any already exist
DELETE 
  FROM process_cmd 
 WHERE process_id = (SELECT process_id 
                       FROM process
                      WHERE process_name = '{processName}')
;            
            """
            f.write(cmd)

            ## SQL to Delete from Process table
            cmd = f"""
DELETE 
  FROM process
 WHERE process_name = '{processName}'
;            
            """
            f.write(cmd)

            ##Fetch PROCESS table columns from database
            sqlCommand = f"select LISTAGG(column_name,',') WITHIN GROUP(order by ordinal_position) AS COLUMN_LIST from information_schema.columns where table_catalog = '{db.getDatabase()}' and table_schema = 'TIPS_MD_SCHEMA' and table_name = 'PROCESS' and column_name != 'PROCESS_ID'"
            result = db.executeSQL(sqlCommand=sqlCommand)
            columnList = result[0].get("COLUMN_LIST")

            ##Fetch PROCESS table rows using column list
            sqlCommand = f"select {columnList} from {db.getDatabase()}.tips_md_schema.process where process_name = '{processName}'"
            rows = db.executeSQL(sqlCommand=sqlCommand)
            for row in rows:
                valList = ""
                cnt = 0
                for value in row.values():
                    if cnt == 0:
                        valList += f"'{value}'"
                    else:
                        valList += f", '{value}'"
                    cnt += 1

                ## SQL for INSERT into Process table
                cmd = f"""
--Add records to process table
INSERT INTO process ({columnList})
VALUES ({valList})
;            
                """
                f.write(cmd)

            ## SQL to set bind variable for process_id, to be used in subsequent commands
            cmd = f"""
--set bind variable for generated process_id, to be used in insert statement on process command            
SET process_id = (SELECT process_id FROM process WHERE process_name = '{processName}');
"""
            f.write(cmd)

            ##Fetch PROCESS_CMD table columns from database
            sqlCommand = f"select LISTAGG(column_name,',') WITHIN GROUP(order by ordinal_position) AS COLUMN_LIST from information_schema.columns where table_catalog = '{db.getDatabase()}' and table_schema = 'TIPS_MD_SCHEMA' and table_name = 'PROCESS_CMD'"
            result = db.executeSQL(sqlCommand=sqlCommand)
            columnList = result[0].get("COLUMN_LIST")

            ##Fetch PROCESS table rows using column list
            sqlCommand = f"select {columnList} from {db.getDatabase()}.tips_md_schema.process_cmd where process_id = (select process_id from {db.getDatabase()}.tips_md_schema.process where process_name = '{processName}') order by process_cmd_id"
            rows = db.executeSQL(sqlCommand=sqlCommand)
            valuesClause = ""
            loopCnt = 0
            for row in rows:
                valList = "\n("
                cnt = 0
                for key, value in row.items():
                    if cnt == 0:
                        valList += (
                            "$process_id"
                            if key == "PROCESS_ID"
                            else "NULL"
                            if value is None
                            else f"'{value}'"
                        )
                    else:
                        valList += (
                            ", $process_id"
                            if key == "PROCESS_ID"
                            else ", NULL"
                            if value is None
                            else f", '{value}'"
                        )
                    cnt += 1

                valList += ")"

                if loopCnt == 0:
                    valuesClause += valList
                else:
                    valuesClause += f", {valList}"

                loopCnt += 1

            if valuesClause != "":
                ## SQL for INSERT into Process table
                cmd = f"""
--Add records in process_cmd table
INSERT INTO process_cmd ({columnList})
VALUES {valuesClause}
;            
                """
                f.write(cmd)

        return ExecutionStatus.SUCCESS
    except Exception as err:
        logger.error(f"Error occured {err}")
        return ExecutionStatus.FAIL


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

    kwargs = {
        "table_name": "tips_md_schema.process_cmd",
        "from_table_name": "tips_md_schema.process_cmd",
        "where_clause": f"process_id = {processId}",
    }
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="app_metadata_insert_as_select",
        parameters=commandDataWithIdentifiers,
        **kwargs,
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

    kwargs = {
        "table_name": "tips_md_schema.process_cmd",
        "where_clause": f"process_id = {processId} AND PROCESS_CMD_ID = {commandId}",
        "exclude_keys": "['PROCESS_ID', 'PROCESS_CMD_ID']",
    }
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="app_metadata_update", parameters=updatesWithIdentifiers, **kwargs
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
    if commandId == "all":
        kwargs = {
            "table_name": "tips_md_schema.process_cmd",
            "where_clause": f"process_id = {processId}",
        }
    else:
        kwargs = {
            "table_name": "tips_md_schema.process_cmd",
            "where_clause": f"process_id = {processId} AND PROCESS_CMD_ID = {commandId}",
        }

    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="app_metadata_delete", parameters={}, **kwargs
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
                OperationType.DOWNLOAD
                if processTableProcess.get("operation").get("type")
                == OperationType.DOWNLOAD
                else OperationType.RUN
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

                    elif (
                        processModalProcess.get("operation").get("type")
                        == OperationType.DOWNLOAD
                    ):
                        result = _downloadProcess(
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
