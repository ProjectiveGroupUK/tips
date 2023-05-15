# Python
import logging

# import asyncio

# Streamlit
import streamlit as st

# TIPS
from tips.framework.db.database_connection import DatabaseConnection
from tips.framework.utils.sql_template import SQLTemplate
from tips.utils.logger import Logger
from tips.utils.utils import Globals, escapeValuesForSQL


# Components
from utils import dqTable, dqModal, dqTargetModal

# Enums
from tips.app.enums import StateVariable, DQDataProperty, DQTargetDataProperty
from tips.app.enums import (
    DQTableInstruction,
    DQModalInstruction,
    DQTargetModalInstruction,
    ExecutionStatus,
    OperationType,
)

# Logger initialisation
logger = logging.getLogger(Logger.getRootLoggerName())
globals = Globals()


def _setUpPageLayout():
    st.set_page_config(page_title="TIPS", page_icon="✨", layout="wide")
    st.caption("Home > :blue[DQ Tests]")


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
    if DQTableInstruction.RESET_EDIT_DQ_TEST not in st.session_state:
        st.session_state[DQTableInstruction.RESET_EDIT_DQ_TEST] = False

    if DQTableInstruction.RESET_DQ_TARGET not in st.session_state:
        st.session_state[DQTableInstruction.RESET_DQ_TARGET] = False

    if DQModalInstruction.EXECUTION_STATUS not in st.session_state:
        st.session_state[DQModalInstruction.EXECUTION_STATUS] = {
            "status": ExecutionStatus.NONE
        }

    # if DQModalInstruction.CHANGE_UPDATE_PROCESS_TO_CREATE_DQ not in st.session_state:
    #     st.session_state[DQModalInstruction.CHANGE_UPDATE_PROCESS_TO_CREATE_DQ] = None

    if (
        DQTargetModalInstruction.CHANGE_UPDATE_DQ_TO_CREATE_TARGET
        not in st.session_state
    ):
        st.session_state[
            DQTargetModalInstruction.CHANGE_UPDATE_DQ_TO_CREATE_TARGET
        ] = None

    if DQTargetModalInstruction.EXECUTION_STATUS not in st.session_state:
        st.session_state[DQTargetModalInstruction.EXECUTION_STATUS] = {
            "status": ExecutionStatus.NONE
        }


def _loadListOfDQTest():
    db = DatabaseConnection()
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="dq_metadata",
        parameters={"dq_test_name": "ALL"},
    )

    fetchedDQTestData = (
        []
    )  # Stores list of DQ Test data fetched from SQL query (in results variable). May be a two-dimensional array of

    try:
        results: dict = db.executeSQL(sqlCommand=cmdStr)

        # Iterate through keys in dictionary 'results' and for each unique process name, capture process details in 'fetchedProcessData'
        for row in results:

            indexOfExistingDQ = [
                i
                for i, dqTests in enumerate(fetchedDQTestData)
                if dqTests[DQDataProperty.PROCESS_DQ_TEST_ID]
                == row[DQDataProperty.PROCESS_DQ_TEST_ID]
            ]
            if (
                len(indexOfExistingDQ) == 0
            ):  # If dq id hasn't been captured yet, load whole record as new dq with its target records

                dqHasTargets = (
                    row[DQTargetDataProperty.PROCESS_CMD_TGT_DQ_TEST_ID] is not None
                )
                dqRecord = {
                    DQDataProperty.PROCESS_DQ_TEST_ID: row[
                        DQDataProperty.PROCESS_DQ_TEST_ID
                    ],
                    DQDataProperty.PROCESS_DQ_TEST_NAME: row[
                        DQDataProperty.PROCESS_DQ_TEST_NAME
                    ],
                    DQDataProperty.PROCESS_DQ_TEST_DESCRIPTION: row[
                        DQDataProperty.PROCESS_DQ_TEST_DESCRIPTION
                    ],
                    DQDataProperty.PROCESS_DQ_TEST_QUERY_TEMPLATE: row[
                        DQDataProperty.PROCESS_DQ_TEST_QUERY_TEMPLATE
                    ],
                    DQDataProperty.PROCESS_DQ_TEST_ERROR_MESSAGE: row[
                        DQDataProperty.PROCESS_DQ_TEST_ERROR_MESSAGE
                    ],
                    DQDataProperty.ACTIVE: row["DQ_ACTIVE"],
                }
                if dqHasTargets:
                    dqRecord["targets"] = [_stripTargetDict(row)]
                else:
                    dqRecord["targets"] = []
                fetchedDQTestData.append(dqRecord)
            else:  # If iterating over row for already-captured proces, just capture the command information within the commands array of the already-captured process
                fetchedDQTestData[indexOfExistingDQ[0]]["targets"].append(
                    _stripTargetDict(row)
                )

    except Exception as e:
        logger.error(f"Error loading list of DQ Tests: {e}")

    return fetchedDQTestData


def _stripTargetDict(
    targetDict: dict,
):  # Removes process keys from dictionary intended to store data on process's command, since the command dictionary is nested within the process dictionary (which contains the process's details already)
    strippedDict = targetDict.copy()
    strippedDict.pop(DQDataProperty.PROCESS_DQ_TEST_ID)
    # strippedDict.pop(DQDataProperty.PROCESS_DQ_TEST_NAME)
    strippedDict.pop(DQDataProperty.PROCESS_DQ_TEST_DESCRIPTION)
    strippedDict.pop(DQDataProperty.PROCESS_DQ_TEST_QUERY_TEMPLATE)
    strippedDict.pop(DQDataProperty.PROCESS_DQ_TEST_ERROR_MESSAGE)
    strippedDict.pop("DQ_ACTIVE")
    return strippedDict


def _createDQTest(newDQTestData: dict):

    # Validate that newDQTestData has been provided and is a dictionary
    if not isinstance(newDQTestData, dict):
        logger.error(
            f"newDQTestData is not an integer: '{newDQTestData}' (type: {type(newDQTestData).__name__})"
        )
        return ExecutionStatus.FAIL

    # Cleanse newDQTestData dictionary so that it contains only properties which are allowed to be updated
    allowedProperties = [
        propertyKey
        for propertyKey in dir(DQDataProperty)
        if not (
            (propertyKey.startswith("__") and propertyKey.endswith("__"))
            or propertyKey == DQDataProperty.PROCESS_DQ_TEST_ID
        )
    ]
    cleansedDQTestData = {
        key: newDQTestData[key]
        for key in newDQTestData.keys()
        if key in allowedProperties
    }
    if len(allowedProperties) == 0:
        logger.error("No valid updates provided")
        return ExecutionStatus.FAIL

    # Escape values and store None values as NULL
    formattedDQTestData = escapeValuesForSQL(cleansedDQTestData)

    # Construct SQL command to create process command
    kwargs = {"table_name": "tips_md_schema.process_dq_test"}
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="app_metadata_insert_into_values",
        parameters=formattedDQTestData,
        **kwargs,
    )

    # Execute SQL command
    db = DatabaseConnection()
    try:
        db.executeSQL(sqlCommand=cmdStr)

        # Retrieve PROCESS_ID of newly-created process command
        response = db.executeSQL(
            sqlCommand=f"SELECT MAX({DQDataProperty.PROCESS_DQ_TEST_ID}) AS {DQDataProperty.PROCESS_DQ_TEST_ID} FROM tips_md_schema.process_dq_test"
        )
        newProcessDQTestId: int = response[0][DQDataProperty.PROCESS_DQ_TEST_ID]

        # Update PROCESS_DQ_TEST_ID of newly-created dq test in cleansedDQTestData (since it'll be added to the DQ_DATA session state)
        cleansedDQTestData[DQDataProperty.PROCESS_DQ_TEST_ID] = newProcessDQTestId
        cleansedDQTestData["targets"] = []

        # Update process data in session state
        processDQTestData = st.session_state[StateVariable.DQ_DATA]
        processDQTestData.append(cleansedDQTestData)
        st.session_state[StateVariable.DQ_DATA] = processDQTestData

        return (ExecutionStatus.SUCCESS, newProcessDQTestId)

    except Exception as e:
        logger.error(f"Error creating DQ Test: {e}")
        return ExecutionStatus.FAIL


def _updateDQTest(processDQTestId: int, updatedData: dict):

    # Validate that processId has been provided and is integer
    if not isinstance(processDQTestId, int):
        logger.error(
            f"processDQTestId '{processDQTestId}' ({type(processDQTestId).__name__}) is not an integer"
        )
        return ExecutionStatus.FAIL

    # Validate that updates dictionary has at least one update where the update key is a value in the CommandDataProperty enum
    validPropertyKeys = [
        propertyKey
        for propertyKey in dir(DQDataProperty)
        if not (
            (propertyKey.startswith("__") and propertyKey.endswith("__"))
            or propertyKey == DQDataProperty.PROCESS_DQ_TEST_ID
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
    }

    kwargs = {
        "table_name": "tips_md_schema.process_dq_test",
        "where_clause": f"{DQDataProperty.PROCESS_DQ_TEST_ID} = {processDQTestId}",
        "exclude_keys": f"['{DQDataProperty.PROCESS_DQ_TEST_ID}']",
    }
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="app_metadata_update", parameters=updatesWithIdentifiers, **kwargs
    )

    # Execute SQL command
    db = DatabaseConnection()
    try:
        db.executeSQL(sqlCommand=cmdStr)

        # Update process data in session state
        dqData = st.session_state[StateVariable.DQ_DATA]
        selectedDQTest = [
            dqdata
            for dqdata in dqData
            if dqdata[DQDataProperty.PROCESS_DQ_TEST_ID] == processDQTestId
        ][0]
        for update in cleansedUpdates.keys():
            selectedDQTest[update] = cleansedUpdates[update]

        st.session_state[StateVariable.DQ_DATA] = dqData
        return ExecutionStatus.SUCCESS
    except Exception as e:
        logger.error(f"Error updating DQ Test: {e}")
        return ExecutionStatus.FAIL


def _deleteDQTest(processDQTestId: int, processDQTestName: str):

    # Validate that processDQTestId has been provided and is integer
    if not isinstance(processDQTestId, int):
        logger.error(
            f"processDQTestId '{processDQTestId}' ({type(processDQTestId).__name__}) is not an integer"
        )
        return ExecutionStatus.FAIL

    # Validate that processDQTestName has been provided and is string
    if not isinstance(processDQTestName, str):
        logger.error(
            f"processDQTestName '{processDQTestName}' ({type(processDQTestName).__name__}) is not a string"
        )
        return ExecutionStatus.FAIL

    # Delete all commands within process
    deleteCommandResult = _deleteDQTestTarget(
        dqTestName=processDQTestName, dqTestTargetId="all"
    )

    if deleteCommandResult != ExecutionStatus.SUCCESS:
        logger.error(f"Error deleting DQ test targets within DQ Test {processDQTestId}")
        return ExecutionStatus.FAIL

    # Construct SQL command to delete process
    kwargs = {
        "table_name": "tips_md_schema.process_dq_test",
        "where_clause": f"{DQDataProperty.PROCESS_DQ_TEST_ID} = {processDQTestId}",
    }
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="app_metadata_delete", parameters={}, **kwargs
    )

    # Execute SQL command
    db = DatabaseConnection()
    try:
        db.executeSQL(sqlCommand=cmdStr)

        # Update dq data in session state
        dqTestData = st.session_state[StateVariable.DQ_DATA]
        dqTestDataWithoutDeletedProcess = [
            data
            for data in dqTestData
            if data[DQDataProperty.PROCESS_DQ_TEST_ID] != processDQTestId
        ]
        st.session_state[StateVariable.DQ_DATA] = dqTestDataWithoutDeletedProcess
        return ExecutionStatus.SUCCESS
    except Exception as e:
        logger.error(
            f"Error deleting DQ Test (although targets for dq test have been removed): {e}"
        )
        return ExecutionStatus.FAIL


def _createDQTestTarget(dqTestName: str, dqTargetData: dict):

    # Validate that processId has been provided and is integer
    if not isinstance(dqTestName, str):
        logger.error(
            f"dqTestName is not a string: '{dqTestName}' (type: {type(dqTestName).__name__})"
        )
        return ExecutionStatus.FAIL

    # Cleanse commandData dictionary so that it contains only properties which are allowed to be updated
    allowedProperties = [
        propertyKey
        for propertyKey in dir(DQTargetDataProperty)
        if not (
            (propertyKey.startswith("__") and propertyKey.endswith("__"))
            or propertyKey == DQTargetDataProperty.PROCESS_CMD_TGT_DQ_TEST_ID
            or propertyKey == DQTargetDataProperty.PROCESS_DQ_TEST_NAME
        )
    ]
    cleansedDQTargetData = {
        key: dqTargetData[key]
        for key in dqTargetData.keys()
        if key in allowedProperties
    }
    if len(allowedProperties) == 0:
        logger.error("No valid updates provided")
        return ExecutionStatus.FAIL

    # Escape values and store None values as NULL
    formattedDQTargetData = escapeValuesForSQL(cleansedDQTargetData)

    # Construct SQL command to create process command
    dqTargetDataWithIdentifiers = {
        **formattedDQTargetData,
        DQTargetDataProperty.PROCESS_DQ_TEST_NAME: f"'{dqTestName}'",
    }

    kwargs = {"table_name": "tips_md_schema.process_cmd_tgt_dq_test"}
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="app_metadata_insert_into_values",
        parameters=dqTargetDataWithIdentifiers,
        **kwargs,
    )

    # Execute SQL command
    db = DatabaseConnection()
    try:
        db.executeSQL(sqlCommand=cmdStr)

        # Retrieve PROCESS_CMD_ID of newly-created process command
        response = db.executeSQL(
            sqlCommand=f"SELECT MAX({DQTargetDataProperty.PROCESS_CMD_TGT_DQ_TEST_ID}) AS {DQTargetDataProperty.PROCESS_CMD_TGT_DQ_TEST_ID} FROM tips_md_schema.process_cmd_tgt_dq_test WHERE {DQTargetDataProperty.PROCESS_DQ_TEST_NAME} = '{dqTestName}'"
        )

        newDQTargetId: int = response[0][
            DQTargetDataProperty.PROCESS_CMD_TGT_DQ_TEST_ID
        ]

        # # Update PROCESS_CMD_TGT_DQ_TEST_ID of newly-created command in dqTargetDataWithIdentifiers (since it'll be added to the DQ_DATA session state)
        # dqTargetDataWithIdentifiers[
        #     DQTargetDataProperty.PROCESS_CMD_TGT_DQ_TEST_ID
        # ] = newDQTargetId

        # cleansedDQTargetData[
        #     DQTargetDataProperty.PROCESS_CMD_TGT_DQ_TEST_ID
        # ] = newDQTargetId
        # cleansedDQTargetData[
        #     DQTargetDataProperty.PROCESS_DQ_TEST_NAME
        # ] = dqTestName

        # # Update dq data in session state
        # dqData = st.session_state[StateVariable.DQ_DATA]
        # selectedDQTest = [
        #     dqdata
        #     for dqdata in dqData
        #     if dqdata[DQTargetDataProperty.PROCESS_DQ_TEST_NAME] == dqTestName
        # ][0]
        # selectedDQTest["targets"].append(
        #     {
        #         propertyName: propertyValue
        #         # (
        #         #     dqTestName
        #         #     if propertyName == DQTargetDataProperty.PROCESS_DQ_TEST_NAME
        #         #     else newDQTargetId
        #         #     if propertyName == DQTargetDataProperty.PROCESS_CMD_TGT_DQ_TEST_ID
        #         #     else propertyValue
        #         # )
        #         for propertyName, propertyValue in cleansedDQTargetData.items()
        #     }
        # )  # Insert command data prior to when it was escaped (i.e., cleansedCommandData), and add process and command Ids

        # st.session_state[StateVariable.DQ_DATA] = dqData

        st.session_state[StateVariable.DQ_DATA] = _loadListOfDQTest()

        return (ExecutionStatus.SUCCESS, newDQTargetId)

    except Exception as e:
        logger.error(f"Error creating DQ Test Target: {e}")
        return ExecutionStatus.FAIL


def _updateDQTestTarget(dqTestName: str, dqTestTargetId: int, updatedData: dict):

    # Validate that both processId and commandId have been provided and are integers
    if not isinstance(dqTestName, str) or not isinstance(dqTestTargetId, int):
        logger.error(
            f"dqTestName ('{dqTestName}' {type(dqTestName).__name__}) is not a string and/or dqTestTargetId ('{dqTestTargetId}' {type(dqTestTargetId).__name__}) is not an integer"
        )
        return ExecutionStatus.FAIL

    # Validate that updates dictionary has at least one update where the update key is a value in the CommandDataProperty enum
    validPropertyKeys = [
        propertyKey
        for propertyKey in dir(DQTargetDataProperty)
        if not (
            (propertyKey.startswith("__") and propertyKey.endswith("__"))
            or (
                propertyKey == DQTargetDataProperty.PROCESS_DQ_TEST_NAME
                or propertyKey == DQTargetDataProperty.PROCESS_CMD_TGT_DQ_TEST_ID
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
        DQTargetDataProperty.PROCESS_DQ_TEST_NAME: dqTestName,
        DQTargetDataProperty.PROCESS_CMD_TGT_DQ_TEST_ID: dqTestTargetId,
    }

    kwargs = {
        "table_name": "tips_md_schema.process_cmd_tgt_dq_test",
        "where_clause": f"{DQTargetDataProperty.PROCESS_DQ_TEST_NAME} = '{dqTestName}' AND {DQTargetDataProperty.PROCESS_CMD_TGT_DQ_TEST_ID} = {dqTestTargetId}",
        "exclude_keys": f"['{DQTargetDataProperty.PROCESS_DQ_TEST_NAME}', '{DQTargetDataProperty.PROCESS_CMD_TGT_DQ_TEST_ID}']",
    }
    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="app_metadata_update", parameters=updatesWithIdentifiers, **kwargs
    )

    # Execute SQL command
    db = DatabaseConnection()
    try:
        db.executeSQL(sqlCommand=cmdStr)

        # Update process data in session state
        dqData = st.session_state[StateVariable.DQ_DATA]
        selectedDQTest = [
            dqdata
            for dqdata in dqData
            if dqdata[DQTargetDataProperty.PROCESS_DQ_TEST_NAME] == dqTestName
        ][0]
        selectedDQTestTarget = [
            target
            for target in selectedDQTest["targets"]
            if target[DQTargetDataProperty.PROCESS_CMD_TGT_DQ_TEST_ID] == dqTestTargetId
        ][0]
        for update in cleansedUpdates.keys():
            selectedDQTestTarget[update] = cleansedUpdates[update]
        st.session_state[StateVariable.PROCESS_DATA] = dqData

        return ExecutionStatus.SUCCESS
    except Exception as e:
        logger.error(f"Error updating dqt test target: {e}")
        return ExecutionStatus.FAIL


def _deleteDQTestTarget(
    dqTestName: str, dqTestTargetId
):  # dqTestName: str, dqTestTargetId: int | 'all'

    # Validate that processId has been provided and is integer
    if not isinstance(dqTestName, str):
        logger.error(
            f"dqTestName ('{dqTestName}' {type(dqTestName).__name__}) is not a string"
        )
        return ExecutionStatus.FAIL

    # Validate that dqTestTargetId has been provided and is integer or 'all'
    if not isinstance(dqTestTargetId, int) and dqTestTargetId != "all":
        logger.error(
            f"dqTestTargetId ('{dqTestTargetId}' {type(dqTestTargetId).__name__}) is not an integer or string literal 'all'"
        )
        return ExecutionStatus.FAIL

    # Construct SQL command to delete process command
    if dqTestTargetId == "all":
        kwargs = {
            "table_name": "tips_md_schema.process_cmd_tgt_dq_test",
            "where_clause": f"{DQTargetDataProperty.PROCESS_DQ_TEST_NAME} = '{dqTestName}'",
        }
    else:
        kwargs = {
            "table_name": "tips_md_schema.process_cmd_tgt_dq_test",
            "where_clause": f"{DQTargetDataProperty.PROCESS_DQ_TEST_NAME} = '{dqTestName}' AND {DQTargetDataProperty.PROCESS_CMD_TGT_DQ_TEST_ID} = {dqTestTargetId}",
        }

    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="app_metadata_delete", parameters={}, **kwargs
    )

    # Execute SQL command
    db = DatabaseConnection()
    try:
        db.executeSQL(sqlCommand=cmdStr)

        # Update process data in session state
        dqData = st.session_state[StateVariable.DQ_DATA]
        selectedDQTest = [
            dqdata
            for dqdata in dqData
            if dqdata[DQTargetDataProperty.PROCESS_DQ_TEST_NAME] == dqTestName
        ][0]
        dqTestTargetWithoutRemovedCommand = (
            []
            if dqTestTargetId == "all"
            else [
                target
                for target in selectedDQTest["targets"]
                if target[DQTargetDataProperty.PROCESS_CMD_TGT_DQ_TEST_ID]
                != dqTestTargetId
            ]
        )
        selectedDQTest["targets"] = dqTestTargetWithoutRemovedCommand
        st.session_state[StateVariable.DQ_DATA] = dqData

        return ExecutionStatus.SUCCESS
    except Exception as e:
        logger.error(f"Error delete DQ Test target: {e}")
        return ExecutionStatus.FAIL


def main():
    _setUpPageLayout()
    _loadCustomCSS()
    _setUpStateInstructions()

    # Fetch process data if it hasn't been fetched previously
    dqTableData = None
    if StateVariable.DQ_DATA not in st.session_state:
        with st.spinner("Fetching Metadata from DB..."):
            st.session_state[StateVariable.DQ_DATA] = _loadListOfDQTest()

    # Render processes table component
    dqTableData = dqTable(
        key="dqTable",
        dqdata=st.session_state[StateVariable.DQ_DATA],
        instructions={
            DQTableInstruction.RESET_EDIT_DQ_TEST: st.session_state[
                DQTableInstruction.RESET_EDIT_DQ_TEST
            ],
            DQTableInstruction.RESET_DQ_TARGET: st.session_state[
                DQTableInstruction.RESET_DQ_TARGET
            ],
        },
    )

    # Render processModal if user intends to create or edit a process
    dqModalData = None
    if dqTableData != None:
        dqTableProcess = dqTableData.get("editedDQData")

        if dqTableProcess != None:

            # Prepare modal parameters
            preparedOperationType = (
                OperationType.CREATE
                if (
                    dqTableProcess.get("operation").get("type") == OperationType.CREATE
                    and st.session_state[
                        DQModalInstruction.CHANGE_UPDATE_PROCESS_TO_CREATE_DQ
                    ]
                    == None
                )
                else OperationType.EDIT
            )            
            preparedDQ = dqTableProcess.get("dqdata")
            if (
                st.session_state[DQModalInstruction.CHANGE_UPDATE_PROCESS_TO_CREATE_DQ]
                != None
            ):
                preparedDQ[DQDataProperty.PROCESS_DQ_TEST_ID] = st.session_state[
                    DQModalInstruction.CHANGE_UPDATE_PROCESS_TO_CREATE_DQ
                ]

            # Render processModal
            dqModalData = dqModal(
                key="modal",
                operationType=preparedOperationType,
                dqdata=preparedDQ,
                instructions={
                    DQModalInstruction.EXECUTION_STATUS: st.session_state[
                        DQModalInstruction.EXECUTION_STATUS
                    ]
                },
            )

            # Check for instructions from the modal that require performing activities on the Python side
            if dqModalData != None:
                dqModalDQData = dqModalData.get("dqdata")

                if dqModalDQData == None:
                    st.session_state[DQTableInstruction.RESET_EDIT_DQ_TEST] = True
                    st.experimental_rerun()

                elif (
                    dqModalDQData.get("executionStatus") == ExecutionStatus.RUNNING
                    and st.session_state[DQModalInstruction.EXECUTION_STATUS].get(
                        "status"
                    )
                    == ExecutionStatus.NONE
                ):  # Execution of operation has been requested, but Python hasn't started executing it yet -> execute operation
                    result = None
                    if (
                        dqModalDQData.get("operation").get("type")
                        == OperationType.CREATE
                    ):
                        result = _createDQTest(
                            newDQTestData=dqModalDQData.get("dqdata")
                        )
                    elif (
                        dqModalDQData.get("operation").get("type") == OperationType.EDIT
                    ):
                        result = _updateDQTest(
                            processDQTestId=dqModalDQData.get("dqdata").get(
                                DQDataProperty.PROCESS_DQ_TEST_ID
                            ),
                            updatedData=dqModalDQData.get("dqdata"),
                        )
                    elif (
                        dqModalDQData.get("operation").get("type")
                        == OperationType.DELETE
                    ):
                        result = _deleteDQTest(
                            processDQTestId=dqModalDQData.get("dqdata").get(
                                DQDataProperty.PROCESS_DQ_TEST_ID
                            ),
                            processDQTestName=dqModalDQData.get("dqdata").get(
                                DQDataProperty.PROCESS_DQ_TEST_NAME
                            ),
                        )

                    resultStatus = (
                        result[0] if isinstance(result, tuple) else result
                    )  # A successful update process operation returns a tuple where first element is execution status and second is the ID of the newly-created process
                    newProcessDQTestId = (
                        result[1] if isinstance(result, tuple) else None
                    )
                    st.session_state[DQModalInstruction.EXECUTION_STATUS] = {
                        "status": resultStatus,
                        "operationType": dqModalDQData.get("operation").get("type"),
                    }

                    if newProcessDQTestId != None:
                        st.session_state[
                            DQModalInstruction.CHANGE_UPDATE_PROCESS_TO_CREATE_DQ
                        ] = newProcessDQTestId

                    st.experimental_rerun()

                elif dqModalDQData.get("executionStatus") == ExecutionStatus.NONE:
                    st.session_state[DQModalInstruction.EXECUTION_STATUS] = {
                        "status": ExecutionStatus.NONE
                    }

        else:  # Process table does not instruct command modal to appear -> reset instruction to be used again when modal is present
            st.session_state[DQTableInstruction.RESET_EDIT_DQ_TEST] = False
            st.session_state[
                DQModalInstruction.CHANGE_UPDATE_PROCESS_TO_CREATE_DQ
            ] = None

    # Render commandModal if user intends to create or edit a command
    dqTargetModalData = None
    if dqTableData != None:
        dqTableTarget = dqTableData.get("dqTargetData")

        print(f"dqTableTarget=\n{dqTableTarget}")

        if dqTableTarget != None:

            # Prepare modal parameters
            preparedOperationType = (
                dqTableTarget.get("operation").get("type")
                if st.session_state[
                    DQTargetModalInstruction.CHANGE_UPDATE_DQ_TO_CREATE_TARGET
                ]
                == None
                else OperationType.EDIT
            )
            preparedTarget = dqTableTarget.get("dqtarget")
            if (
                st.session_state[
                    DQTargetModalInstruction.CHANGE_UPDATE_DQ_TO_CREATE_TARGET
                ]
                != None
            ):
                preparedTarget[
                    DQTargetDataProperty.PROCESS_CMD_TGT_DQ_TEST_ID
                ] = st.session_state[
                    DQTargetModalInstruction.CHANGE_UPDATE_DQ_TO_CREATE_TARGET
                ]

            # Render commandModal
            dqTargetModalData = dqTargetModal(
                key="modal",
                operationType=preparedOperationType,
                dqdata=dqTableTarget.get("dqdata"),
                dqtarget=preparedTarget,
                instructions={
                    DQTargetModalInstruction.EXECUTION_STATUS: st.session_state[
                        DQTargetModalInstruction.EXECUTION_STATUS
                    ],
                },
            )

            print(f"dqTargetModalData=\n{dqTargetModalData}")
            # Check for instructions from the modal that require performing activities on the Python side
            if dqTargetModalData != None:
                dqTargetModalTarget = dqTargetModalData.get("dqtarget")

                if dqTargetModalTarget == None:
                    st.session_state[DQTableInstruction.RESET_DQ_TARGET] = True
                    st.experimental_rerun()

                elif (
                    dqTargetModalTarget.get("executionStatus")
                    == ExecutionStatus.RUNNING
                    and st.session_state[DQTargetModalInstruction.EXECUTION_STATUS].get(
                        "status"
                    )
                    == ExecutionStatus.NONE
                ):  # Execution of operation has been requested, but Python hasn't started executing it yet -> execute operation
                    result = None
                    if (
                        dqTargetModalTarget.get("operation").get("type")
                        == OperationType.CREATE
                    ):
                        result = _createDQTestTarget(
                            dqTestName=dqTargetModalTarget.get("dqdata").get(
                                DQDataProperty.PROCESS_DQ_TEST_NAME
                            ),
                            dqTargetData=dqTargetModalTarget.get("dqtarget"),
                        )
                    elif (
                        dqTargetModalTarget.get("operation").get("type")
                        == OperationType.EDIT
                    ):
                        result = _updateDQTestTarget(
                            dqTestName=dqTargetModalTarget.get("dqdata").get(
                                DQDataProperty.PROCESS_DQ_TEST_NAME
                            ),
                            dqTestTargetId=dqTargetModalTarget.get("dqtarget").get(
                                DQTargetDataProperty.PROCESS_CMD_TGT_DQ_TEST_ID
                            ),
                            updatedData=dqTargetModalTarget.get("dqtarget"),
                        )
                    elif (
                        dqTargetModalTarget.get("operation").get("type")
                        == OperationType.DELETE
                    ):
                        result = _deleteDQTestTarget(
                            dqTestName=dqTargetModalTarget.get("dqdata").get(
                                DQDataProperty.PROCESS_DQ_TEST_NAME
                            ),
                            dqTestTargetId=dqTargetModalTarget.get("dqtarget").get(
                                DQTargetDataProperty.PROCESS_CMD_TGT_DQ_TEST_ID
                            ),
                        )

                    resultStatus = (
                        result[0] if isinstance(result, tuple) else result
                    )  # A successful create command operation returns a tuple where first element is execution status and second is the ID of the newly-created command
                    newDQTargetId = result[1] if isinstance(result, tuple) else None
                    st.session_state[DQTargetModalInstruction.EXECUTION_STATUS] = {
                        "status": resultStatus,
                        "operationType": dqTargetModalTarget.get("operation").get(
                            "type"
                        ),
                    }

                    if newDQTargetId != None:
                        st.session_state[
                            DQTargetModalInstruction.CHANGE_UPDATE_DQ_TO_CREATE_TARGET
                        ] = newDQTargetId
                    st.experimental_rerun()

                elif dqTargetModalTarget.get("executionStatus") == ExecutionStatus.NONE:
                    st.session_state[DQTargetModalInstruction.EXECUTION_STATUS] = {
                        "status": ExecutionStatus.NONE
                    }

        else:  # Process table does not instruct command modal to appear -> reset instructions to be used again when modal is present
            st.session_state[DQTableInstruction.RESET_DQ_TARGET] = False

            # Comand modal is not showing -> reset CHANGE_UPDATE_COMMAND_TO_CREATE_COMMAND instruction
            st.session_state[
                DQTargetModalInstruction.CHANGE_UPDATE_DQ_TO_CREATE_TARGET
            ] = None


if __name__ == "__main__":
    # tips_project.toml file is needed for next command to run
    # Initialise globals
    globals.initGlobals()
    main()
