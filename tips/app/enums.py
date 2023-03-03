class StateVariable:
    DISPLAY_JSON = 'display_json'
    PROCESS_LOG_RESULT_1 = 'process_log_result1'
    PROCESS_LOG_RESULT_2 = 'process_log_result2'
    FETCH_BUTTON_CLICKED = 'fetchButtonClicked'
    PROCESS_DATA = 'processData'
    
class ProcessTableInstruction:
    RESET_SELECTED_COMMAND = 'resetSelectedCommand'
    RESET_CREATE_COMMAND = 'resetCreateCommand'

class CreateCommandModalInstruction:
    RESET_PROCESSING_INDICATOR = 'resetCreateCommandProcessingIndicator'

class EditCommandModalInstruction:
    RESET_UPDATE_COMMAND = 'resetUpdateCommand'

class CommandUpdateProperty:
    CMD_TYPE = 'cmd_type'
    CMD_SRC = 'cmd_src'
    CMD_TGT = 'cmd_tgt'
    CMD_WHERE = 'cmd_where'
    CMD_BINDS = 'cmd_binds'
    REFRESH_TYPE = 'refresh_type'
    BUSINESS_KEY = 'business_key'
    MERGE_ON_FIELDS = 'merge_on_fields'
    GENERATE_MERGE_MATCHED_CLAUSE = 'generate_merge_matched_clause'
    GENERATE_MERGE_NON_MATCHED_CLAUSE = 'generate_merge_non_matched_clause'
    ADDITIONAL_FIELDS = 'additional_fields'
    TEMP_TABLE = 'temp_table'
    CMD_PIVOT_BY = 'cmd_pivot_by'
    CMD_PIVOT_FIELD = 'cmd_pivot_field'
    DQ_TYPE = 'dq_type'
    CMD_EXTERNAL_CALL = 'cmd_external_call'
    ACTIVE = 'active'