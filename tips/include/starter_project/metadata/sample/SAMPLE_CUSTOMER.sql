--Delete existing records for PUBLISH CUSTOMER, if any
DELETE 
  FROM process_cmd 
 WHERE process_id = (SELECT process_id 
                       FROM process
					  WHERE process_name = 'SAMPLE_CUSTOMER')
;
					  
DELETE 
  FROM process
 WHERE process_name = 'SAMPLE_CUSTOMER'
;

--Now Insert Records

--Add records in process table
INSERT INTO process (process_name, process_description)
VALUES ('SAMPLE_CUSTOMER','This is a sample pipeline for demostration purposes which uses different types of command types available in the framework');

SET process_id = (SELECT process_id FROM process WHERE process_name = 'SAMPLE_CUSTOMER');

--Add records in process_cmd table
INSERT INTO process_cmd 
(	
	process_id
,   process_cmd_id
,	cmd_type
,	cmd_src
,	cmd_tgt
,	cmd_where
,	cmd_binds
,	refresh_type
,	business_key
,	merge_on_fields
,	generate_merge_matched_clause
,	generate_merge_non_matched_clause
,	additional_fields
,	temp_table
,	cmd_pivot_by
,	cmd_pivot_field
,	dq_type
)	
VALUES 
(	
	$process_id 												--process_id
,   10															--process_cmd_id
,	'REFRESH'													--cmd_type
,	'TRANSFORM.VW_CUSTOMER'										--cmd_src
,	'TRANSFORM.CUSTOMER'										--cmd_tgt
,	'C_MKTSEGMENT = :2 AND COBID = :1'							--cmd_where
,	'COBID|MARKET_SEGMENT'										--cmd_binds
,	'DI'														--refresh_type
,	NULL														--business_key
,	NULL														--merge_on_fields
,	NULL														--generate_merge_matched_clause
,	NULL														--generate_merge_non_matched_clause
,	'TO_NUMBER(:1) COBID'										--additional_fields
,	NULL														--temp_table
,	NULL														--cmd_pivot_by
,	NULL														--cmd_pivot_field
,	NULL														--dq_type
),
(	
	$process_id													--process_id
,   20															--process_cmd_id
,	'APPEND'													--cmd_type
,	'TRANSFORM.VW_CUSTOMER_WITH_LOOKUPS'						--cmd_src
,	'TRANSFORM.CUSTOMER_WITH_LOOKUPS'							--cmd_tgt
,	'C_MKTSEGMENT = :2 AND COBID = :1'							--cmd_where
,	'COBID|MARKET_SEGMENT'										--cmd_binds
,	NULL														--refresh_type
,	NULL														--business_key
,	NULL														--merge_on_fields
,	NULL														--generate_merge_matched_clause
,	NULL														--generate_merge_non_matched_clause
,	NULL														--additional_fields
,	'Y'															--temp_table
,	NULL														--cmd_pivot_by
,	NULL														--cmd_pivot_field
,	NULL														--dq_type
),
(	
	$process_id													--process_id
,   30															--process_cmd_id
,	'PUBLISH_SCD2_DIM'											--cmd_type
,	'TRANSFORM.VW_SRC_CUSTOMER_HISTORY'							--cmd_src
,	'DIMENSION.CUSTOMER_HISTORY'								--cmd_tgt
,	NULL														--cmd_where
,	'COBID'														--cmd_binds
,	NULL														--refresh_type
,	'CUSTOMER_NAME'												--business_key
,	NULL														--merge_on_fields
,	NULL														--generate_merge_matched_clause
,	NULL														--generate_merge_non_matched_clause
,	NULL														--additional_fields
,	NULL														--temp_table
,	NULL														--cmd_pivot_by
,	NULL														--cmd_pivot_field
,	'SCD2'														--dq_type
),
(	
	$process_id													--process_id
,   40															--process_cmd_id
,	'MERGE'														--cmd_type
,	'TRANSFORM.VW_SRC_CUSTOMER'									--cmd_src
,	'DIMENSION.CUSTOMER'										--cmd_tgt
,	NULL														--cmd_where
,	NULL														--cmd_binds
,	NULL														--refresh_type
,	'CUSTOMER_NAME'												--business_key
,	'CUSTOMER_NAME'												--merge_on_fields
,	'Y'															--generate_merge_matched_clause
,	'Y'															--generate_merge_non_matched_clause
,	NULL														--additional_fields
,	NULL														--temp_table
,	NULL														--cmd_pivot_by
,	NULL														--cmd_pivot_field
,	'DUPS'														--dq_type
),
(	
	$process_id													--process_id
,   50															--process_cmd_id
,	'COPY_INTO_FILE'											--cmd_type
,	'DIMENSION.CUSTOMER'										--cmd_src
,	'@~/EXTRACTS/:1/PUBLISH_CUSTOMER/CUSTOMER.csv.gz'			--cmd_tgt
,	NULL														--cmd_where
,	'COBID'														--cmd_binds
,	NULL														--refresh_type
,	NULL														--business_key
,	NULL														--merge_on_fields
,	NULL														--generate_merge_matched_clause
,	NULL														--generate_merge_non_matched_clause
,	NULL														--additional_fields
,	NULL														--temp_table
,	NULL														--cmd_pivot_by
,	NULL														--cmd_pivot_field
,	NULL														--dq_type
)
;
