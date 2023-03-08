class StateVariable:
    DISPLAY_JSON = 'display_json'
    PROCESS_LOG_RESULT_1 = 'process_log_result1'
    PROCESS_LOG_RESULT_2 = 'process_log_result2'
    FETCH_BUTTON_CLICKED = 'fetchButtonClicked'
    PROCESS_DATA = 'processData'
    
class ProcessTableInstruction:
    RESET_SELECTED_COMMAND = 'resetSelectedCommand'
    RESET_CREATE_COMMAND = 'resetCreateCommand'

class CommandModalInstruction:
    EXECUTION_STATUS = 'commandExecutionStatus'

class ExecutionStatus:
    RUNNING = 'running'
    SUCCESS = 'success'
    FAIL = 'fail'
    NONE = 'none'

class ProcessDataProperty:
    PROCESS_ID = 'PROCESS_ID'
    PROCESS_NAME = 'PROCESS_NAME'
    PROCESS_DESCRIPTION = 'PROCESS_DESCRIPTION'
    PROCESS_ACTIVE = 'PROCESS_ACTIVE'

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