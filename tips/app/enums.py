class StateVariable:
    DISPLAY_JSON = 'display_json'
    PROCESS_LOG_RESULT_1 = 'process_log_result1'
    PROCESS_LOG_RESULT_2 = 'process_log_result2'
    FETCH_BUTTON_CLICKED = 'fetchButtonClicked'
    PROCESS_DATA = 'processData'
    DQ_DATA = 'dqData'
    
class ProcessTableInstruction:
    RESET_EDIT_PROCESS = 'resetProcessTableProcess'
    RESET_COMMAND = 'resetProcessTableCommand'

class ProcessModalInstruction:
    EXECUTION_STATUS = 'processExecutionStatus'
    CHANGE_UPDATE_PROCESS_TO_CREATE_PROCESS = 'changeUpdateProcessToCreateProcess'
    PROCESS_RUN_STATUS = 'processRunStatus'

class CommandModalInstruction:
    EXECUTION_STATUS = 'commandExecutionStatus'
    CHANGE_UPDATE_COMMAND_TO_CREATE_COMMAND = 'changeUpdateCommandToCreateCommand'

class DQTableInstruction:
    RESET_EDIT_DQ_TEST = 'resetDQTableDQTest'
    RESET_DQ_TARGET = 'resetDQTableTarget'

class DQModalInstruction:
    EXECUTION_STATUS = 'dqExecutionStatus'
    CHANGE_UPDATE_PROCESS_TO_CREATE_DQ = 'changeUpdateDQToCreateDQTest'

class DQTargetModalInstruction:
    EXECUTION_STATUS = 'dqTargetExecutionStatus'
    CHANGE_UPDATE_DQ_TO_CREATE_TARGET = 'changeUpdateDQToCreateTarget'

class ExecutionStatus:
    RUNNING = 'running'
    SUCCESS = 'success'
    FAIL = 'fail'
    NONE = 'none'

class ProcessDataProperty:
    PROCESS_ID = 'PROCESS_ID'
    PROCESS_NAME = 'PROCESS_NAME'
    PROCESS_DESCRIPTION = 'PROCESS_DESCRIPTION'
    ACTIVE = 'ACTIVE'
    BIND_VARS = 'BIND_VARS'

class CommandDataProperty:
    PROCESS_ID = 'PROCESS_ID'
    PROCESS_CMD_ID = 'PROCESS_CMD_ID'
    CMD_TYPE = 'CMD_TYPE'
    CMD_SRC = 'CMD_SRC'
    CMD_TGT = 'CMD_TGT'
    CMD_WHERE = 'CMD_WHERE'
    CMD_BINDS = 'CMD_BINDS'
    REFRESH_TYPE = 'REFRESH_TYPE'
    BUSINESS_KEY = 'BUSINESS_KEY'
    MERGE_ON_FIELDS = 'MERGE_ON_FIELDS'
    GENERATE_MERGE_MATCHED_CLAUSE = 'GENERATE_MERGE_MATCHED_CLAUSE'
    GENERATE_MERGE_NON_MATCHED_CLAUSE = 'GENERATE_MERGE_NON_MATCHED_CLAUSE'
    ADDITIONAL_FIELDS = 'ADDITIONAL_FIELDS'
    TEMP_TABLE = 'TEMP_TABLE'
    CMD_PIVOT_BY = 'CMD_PIVOT_BY'
    CMD_PIVOT_FIELD = 'CMD_PIVOT_FIELD'
    DQ_TYPE = 'DQ_TYPE'
    CMD_EXTERNAL_CALL = 'CMD_EXTERNAL_CALL'
    ACTIVE = 'ACTIVE'

class DQDataProperty:
    PROCESS_DQ_TEST_ID = 'PROCESS_DQ_TEST_ID'
    PROCESS_DQ_TEST_NAME = 'PROCESS_DQ_TEST_NAME'
    PROCESS_DQ_TEST_DESCRIPTION = 'PROCESS_DQ_TEST_DESCRIPTION'
    PROCESS_DQ_TEST_QUERY_TEMPLATE = 'PROCESS_DQ_TEST_QUERY_TEMPLATE'
    PROCESS_DQ_TEST_ERROR_MESSAGE = 'PROCESS_DQ_TEST_ERROR_MESSAGE'
    ACTIVE = 'ACTIVE'

class DQTargetDataProperty:
    PROCESS_CMD_TGT_DQ_TEST_ID = 'PROCESS_CMD_TGT_DQ_TEST_ID'
    TGT_NAME = 'TGT_NAME'
    ATTRIBUTE_NAME = 'ATTRIBUTE_NAME'
    PROCESS_DQ_TEST_NAME = 'PROCESS_DQ_TEST_NAME'
    ACCEPTED_VALUES = 'ACCEPTED_VALUES'
    ERROR_AND_ABORT = 'ERROR_AND_ABORT'
    ACTIVE = 'ACTIVE'

class OperationType:
    CREATE = 'create'
    EDIT = 'edit'
    DELETE = 'delete'
    RUN = 'run'
    DOWNLOAD = 'download'

