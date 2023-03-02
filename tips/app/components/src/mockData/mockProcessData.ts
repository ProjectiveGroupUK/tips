// Interfaces
import { ProcessDataInterface } from "@/interfaces/Interfaces"

const mockDataSet: ProcessDataInterface = [
    {
        id: 1,
        name: 'Process 1',
        description: 'This is process 1',
        steps: [
            {
                PROCESS_CMD_ID: 10,
                CMD_TYPE: 'REFRESH',
                CMD_SRC: 'TRANSFORM.VW_CUSTOMER',
                CMD_TGT: 'TRANSFORM.CUSTOMER',
                CMD_WHERE: 'C_MKTSEGMENT = :2 AND COBID = :1',
                CMD_BINDS: 'COBID|MARKET_SEGMENT',
                REFRESH_TYPE: 'DI',
                BUSINESS_KEY: '',
                MERGE_ON_FIELDS: '',
                GENERATE_MERGE_MATCHED_CLAUSE: '',
                GENERATE_MERGE_NON_MATCHED_CLAUSE: '',
                ADDITIONAL_FIELDS: 'TO_NUMBER(:1) COBID',
                TEMP_TABLE: null,
                CMD_PIVOT_BY: null,
                CMD_PIVOT_FIELD: null,
                DQ_TYPE: '',
                CMD_EXTERNAL_CALL: '',
                ACTIVE: 'Y'
            },
            {
                PROCESS_CMD_ID: 20,
                CMD_TYPE: "APPEND",
                CMD_SRC: 'TRANSFORM.VW_CUSTOMER',
                CMD_TGT: 'TRANSFORM.CUSTOMER',
                CMD_WHERE: 'C_MKTSEGMENT = :2 AND COBID = :1',
                CMD_BINDS: 'COBID|MARKET_SEGMENT',
                REFRESH_TYPE: 'DI',
                BUSINESS_KEY: '',
                MERGE_ON_FIELDS: '',
                GENERATE_MERGE_MATCHED_CLAUSE: '',
                GENERATE_MERGE_NON_MATCHED_CLAUSE: '',
                ADDITIONAL_FIELDS: 'TO_NUMBER(:1) COBID',
                TEMP_TABLE: null,
                CMD_PIVOT_BY: null,
                CMD_PIVOT_FIELD: null,
                DQ_TYPE: '',
                CMD_EXTERNAL_CALL: '',
                ACTIVE: 'N'
            }
        ],
        status: 'active'
    },
    {
        id: 2,
        name: 'Process 2',
        description: 'This is process 2',
        steps: [
            {
                PROCESS_CMD_ID: 10,
                CMD_TYPE: 'REFRESH',
                CMD_SRC: 'TRANSFORM.VW_CUSTOMER',
                CMD_TGT: 'TRANSFORM.CUSTOMER',
                CMD_WHERE: 'C_MKTSEGMENT = :2 AND COBID = :1',
                CMD_BINDS: 'COBID|MARKET_SEGMENT',
                REFRESH_TYPE: 'DI',
                BUSINESS_KEY: '',
                MERGE_ON_FIELDS: '',
                GENERATE_MERGE_MATCHED_CLAUSE: '',
                GENERATE_MERGE_NON_MATCHED_CLAUSE: '',
                ADDITIONAL_FIELDS: 'TO_NUMBER(:1) COBID',
                TEMP_TABLE: null,
                CMD_PIVOT_BY: null,
                CMD_PIVOT_FIELD: null,
                DQ_TYPE: '',
                CMD_EXTERNAL_CALL: '',
                ACTIVE: 'Y'
            }
        ],
        status: 'active'
    },
    {
        id: 3,
        name: 'Process 3',
        description: 'This is process 3',
        steps: [
            {
                PROCESS_CMD_ID: 10,
                CMD_TYPE: 'REFRESH',
                CMD_SRC: 'TRANSFORM.VW_CUSTOMER',
                CMD_TGT: 'TRANSFORM.CUSTOMER',
                CMD_WHERE: 'C_MKTSEGMENT = :2 AND COBID = :1',
                CMD_BINDS: 'COBID|MARKET_SEGMENT',
                REFRESH_TYPE: 'DI',
                BUSINESS_KEY: '',
                MERGE_ON_FIELDS: '',
                GENERATE_MERGE_MATCHED_CLAUSE: '',
                GENERATE_MERGE_NON_MATCHED_CLAUSE: '',
                ADDITIONAL_FIELDS: 'TO_NUMBER(:1) COBID',
                TEMP_TABLE: null,
                CMD_PIVOT_BY: null,
                CMD_PIVOT_FIELD: null,
                DQ_TYPE: '',
                CMD_EXTERNAL_CALL: '',
                ACTIVE: 'Y'
            }
        ],
        status: 'active'
    }
    ,{
        id: 4,
        name: 'Process 4',
        description: 'This is process 4',
        steps: [
            {
                PROCESS_CMD_ID: 10,
                CMD_TYPE: 'REFRESH',
                CMD_SRC: 'TRANSFORM.VW_CUSTOMER',
                CMD_TGT: 'TRANSFORM.CUSTOMER',
                CMD_WHERE: 'C_MKTSEGMENT = :2 AND COBID = :1',
                CMD_BINDS: 'COBID|MARKET_SEGMENT',
                REFRESH_TYPE: 'DI',
                BUSINESS_KEY: '',
                MERGE_ON_FIELDS: '',
                GENERATE_MERGE_MATCHED_CLAUSE: '',
                GENERATE_MERGE_NON_MATCHED_CLAUSE: '',
                ADDITIONAL_FIELDS: 'TO_NUMBER(:1) COBID',
                TEMP_TABLE: null,
                CMD_PIVOT_BY: null,
                CMD_PIVOT_FIELD: null,
                DQ_TYPE: '',
                CMD_EXTERNAL_CALL: '',
                ACTIVE: 'Y'
            }
        ],
        status: 'active'
    }
]

export default mockDataSet;