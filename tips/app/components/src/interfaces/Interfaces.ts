// Enums
import { ExecutionStatus, OperationType } from "@/enums/enums";

export interface ProcessDataInterface {
    PROCESS_ID: number;
    PROCESS_NAME: string;
    PROCESS_DESCRIPTION: string | null;
    steps: Array<CommandDataInterface>;
    ACTIVE: 'Y' | 'N' ;
    BIND_VARS: Object;
    EXECUTE_FLAG: 'Y' | 'N' | null;
};

export interface CommandDataInterface {
    PROCESS_CMD_ID: number;
    CMD_TYPE: 'APPEND' | 'COPY_INTO_FILE' | 'DQ_TEST' | 'MERGE' | 'PUBLISH_SCD2_DIM' | 'REFRESH' | 'TRUNCATE';
    CMD_SRC: string | null;
    CMD_TGT: string;
    CMD_WHERE: string | null;
    CMD_BINDS: string | null;
    REFRESH_TYPE: 'DI' | 'TI' | 'OI' | null; // DI - Delete Insert, TI - Truncate Insert, OI - Overwrite Insert
    BUSINESS_KEY: string | null;
    MERGE_ON_FIELDS: string | null;
    GENERATE_MERGE_MATCHED_CLAUSE: 'Y' | null;
    GENERATE_MERGE_NON_MATCHED_CLAUSE: 'Y' | null;
    ADDITIONAL_FIELDS: string | null;
    TEMP_TABLE: 'Y' | null;
    CMD_PIVOT_BY: string | null;
    CMD_PIVOT_FIELD: string | null;
    DQ_TYPE: 'DUPS' | 'SCD2' | null;
    CMD_EXTERNAL_CALL: string | null;
    ACTIVE: 'Y' | 'N' | null;
}

export interface DQDataInterface {
    PROCESS_DQ_TEST_ID: number;
    PROCESS_DQ_TEST_NAME: string;
    PROCESS_DQ_TEST_DESCRIPTION: string | null;
    PROCESS_DQ_TEST_QUERY_TEMPLATE: string | null;
    PROCESS_DQ_TEST_ERROR_MESSAGE: string | null;
    targets: Array<DQTargetDataInterface>;
    ACTIVE: 'Y' | 'N';
};

export interface DQTargetDataInterface {
    PROCESS_CMD_TGT_DQ_TEST_ID: number;
    TGT_NAME: string;
    ATTRIBUTE_NAME: string | null;
    PROCESS_DQ_TEST_NAME: string;
    ACCEPTED_VALUES: string | null;
    QUERY_BINDS: string | null;
    ERROR_AND_ABORT: boolean;
    ACTIVE: 'Y' | 'N';
};

export type ExecutionStatusInterface = {
    status: ExecutionStatus.RUNNING | ExecutionStatus.SUCCESS | ExecutionStatus.FAIL;
    operationType: OperationType;
} | {
    status: ExecutionStatus.NONE;
}