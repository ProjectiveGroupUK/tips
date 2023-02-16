export declare interface ProcessDataInterface extends Array <{
    id: number;
    name: string;
    description: string;
    steps: Array<CommandDataInterface>;
    status: 'active' | 'inactive';
}> {};

export declare interface CommandDataInterface {
    PROCESS_CMD_ID: number;
    CMD_TYPE: 'APPEND' | 'COPY_INTO_FILE' | 'DELETE'| 'DI' | 'MERGE' | 'OI' | 'PUBLISH_SCD2_DIM' | 'REFRESH' | 'TI' | 'TRUNCATE';
    CMD_SRC: string;
    CMD_TGT: string;
    CMD_WHERE: string;
    CMD_BINDS: string;
    REFRESH_TYPE: 'DI' | null;
    BUSINESS_KEY: string;
    MERGE_ON_FIELDS: string;
    GENERATE_MERGE_MATCHED_CLAUSE: 'Y' | '';
    GENERATE_MERGE_NON_MATCHED_CLAUSE: 'Y' | '';
    ADDITIONAL_FIELDS: string;
    TEMP_TABLE: 'Y' | null;
    CMD_PIVOT_BY: string | null;
    CMD_PIVOT_FIELD: string | null;
    DQ_TYPE: 'DUPS' | 'SCD2' | '';
    CMD_EXTERNAL_CALL: string;
    ACTIVE: 'Y' | 'N';
}

type ArrayElement<ArrayType extends readonly unknown[]> = 
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;