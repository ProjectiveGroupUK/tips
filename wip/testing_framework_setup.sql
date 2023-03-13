USE DATABASE elt_framework;
USE SCHEMA tips_md_schema;
USE WAREHOUSE demo_wh;

DROP TABLE IF EXISTS tips_md_schema.process_dq_log;
DROP TABLE IF EXISTS tips_md_schema.process_cmd_tgt_dq_test;
DROP TABLE IF EXISTS tips_md_schema.process_dq_test;
DROP TABLE IF EXISTS tips_md_schema.process_dq_test_group;

CREATE TABLE IF NOT EXISTS tips_md_schema.process_dq_test_group (
    process_dq_test_group_id                NUMBER(38,0) IDENTITY NOT NULL PRIMARY KEY,
    process_dq_test_group_name              VARCHAR(100) NOT NULL UNIQUE,
    process_dq_test_group_description       VARCHAR,
    active                                  BOOLEAN NOT NULL DEFAULT true
);

MERGE INTO tips_md_schema.process_dq_test_group a
USING (
  SELECT 'COL_UNIQUE' process_dq_test_group_name
       , 'Check Uniqueness of a column in the table' process_dq_test_group_description
  UNION ALL
  SELECT 'COL_NOT_NULL' process_dq_test_group_name
       , 'Check that column value in the table are not null for any record' process_dq_test_group_description
  UNION ALL
  SELECT 'COL_ACCEPTED_VALUES' process_dq_test_group_name
       , 'Check that column in the table contains only one of the accepted values' process_dq_test_group_description
) b
ON a.process_dq_test_group_name = b.process_dq_test_group_name
WHEN NOT MATCHED THEN
INSERT (
    process_dq_test_group_name
  , process_dq_test_group_description
) 
VALUES (
    b.process_dq_test_group_name
  , b.process_dq_test_group_description
);


CREATE TABLE IF NOT EXISTS tips_md_schema.process_dq_test (
    process_dq_test_id                      NUMBER(38,0) IDENTITY NOT NULL PRIMARY KEY,
    process_dq_test_group_id                NUMBER(38,0) NOT NULL FOREIGN KEY REFERENCES tips_md_schema.process_dq_test_group(process_dq_test_group_id),
    process_dq_test_group_name              VARCHAR(100) NOT NULL FOREIGN KEY REFERENCES tips_md_schema.process_dq_test_group(process_dq_test_group_name),
    process_dq_test_name                    VARCHAR(100) NOT NULL UNIQUE,
    process_dq_test_description             VARCHAR,
    process_dq_test_query_template          VARCHAR NOT NULL,
    process_dq_test_error_message           VARCHAR NOT NULL,
    active                                  BOOLEAN NOT NULL DEFAULT true
);

MERGE INTO tips_md_schema.process_dq_test a
USING (
  SELECT grp.process_dq_test_group_id
       , grp.process_dq_test_group_name
       , 'UNIQUE' process_dq_test_name
       , grp.process_dq_test_group_description process_dq_test_description
       , 'SELECT {COL_NAME}, COUNT(*) FROM {TAB_NAME} GROUP BY {COL_NAME} HAVING COUNT(*) > 1' process_dq_test_query_template
       , 'Non Unique Values found in {TAB_NAME}.{COL_NAME}' process_dq_test_error_message
    FROM tips_md_schema.process_dq_test_group grp
   WHERE grp.process_dq_test_group_name = 'COL_UNIQUE'
  UNION ALL
  SELECT grp.process_dq_test_group_id
       , grp.process_dq_test_group_name
       , 'NOT_NULL' process_dq_test_name
       , grp.process_dq_test_group_description process_dq_test_description
       , 'SELECT {COL_NAME} FROM {TAB_NAME} WHERE {COL_NAME} IS NULL' process_dq_test_query_template
       , 'NULL Values found in {TAB_NAME}.{COL_NAME}' process_dq_test_error_message
    FROM tips_md_schema.process_dq_test_group grp
   WHERE grp.process_dq_test_group_name = 'COL_NOT_NULL'
  UNION ALL
  SELECT grp.process_dq_test_group_id
       , grp.process_dq_test_group_name
       , 'ACCEPTED_VALUES' process_dq_test_name
       , grp.process_dq_test_group_description process_dq_test_description
       , 'SELECT {COL_NAME} FROM {TAB_NAME} WHERE {COL_NAME} NOT IN ({ACCEPTED_VALUES})' process_dq_test_query_template
       , 'Values other than {ACCEPTED_VALUES} found in {TAB_NAME}.{COL_NAME}' process_dq_test_error_message
    FROM tips_md_schema.process_dq_test_group grp
   WHERE grp.process_dq_test_group_name = 'COL_ACCEPTED_VALUES'
) b
ON a.process_dq_test_name = b.process_dq_test_name
WHEN NOT MATCHED THEN
INSERT (
    process_dq_test_group_id
  , process_dq_test_group_name
  , process_dq_test_name
  , process_dq_test_description
  , process_dq_test_query_template
  , process_dq_test_error_message
) 
VALUES (
    b.process_dq_test_group_id
  , b.process_dq_test_group_name
  , b.process_dq_test_name
  , b.process_dq_test_description
  , b.process_dq_test_query_template
  , b.process_dq_test_error_message
);

CREATE TABLE IF NOT EXISTS tips_md_schema.process_cmd_tgt_dq_test (
    process_cmd_tgt_dq_test_id              NUMBER(38,0) IDENTITY NOT NULL PRIMARY KEY,
    tgt_name                                VARCHAR(100) NOT NULL,
    attribute_name                          VARCHAR(100),
    process_dq_test_name                    VARCHAR(100) NOT NULL FOREIGN KEY REFERENCES tips_md_schema.process_dq_test(process_dq_test_name),
    accepted_values                         VARCHAR,
    error_and_abort                         BOOLEAN NOT NULL DEFAULT true,
    active                                  BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS tips_md_schema.process_dq_log (
    process_dq_log_id                       NUMBER(38,0) IDENTITY NOT NULL,
    process_log_id                          NUMBER(38,0) NOT NULL FOREIGN KEY REFERENCES tips_md_schema.process_log(process_log_id),
    tgt_name                                VARCHAR(100) NOT NULL,
    attribute_name                          VARCHAR(100),
    dq_test_name                            VARCHAR(100) NOT NULL,
    dq_test_query                           VARCHAR,  
    dq_test_result                          VARIANT,
    start_time                              TIMESTAMP,
    end_time                                TIMESTAMP,
    elapsed_time_in_seconds                 INTEGER,
    status                                  VARCHAR2(100) NOT NULL,
    status_message                          VARCHAR
);