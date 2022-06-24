import json
import re
from typing import List, Dict
from db.database_connection import DatabaseConnection
from snowflake.connector import DictCursor
import os
from dotenv import load_dotenv
from itertools import groupby
from operator import itemgetter

from metadata.column_info import ColumnInfo

class ColumnMetadata():
  
    def getData(self, frameworkMetaData: List[Dict], conn: DatabaseConnection, logger) -> List[Dict]:

        try:    

            def key_func(k):
                return k['schema_name']+'.'+k['table_name']

            logger.info('Fetching Column Metadata...')
            
            load_dotenv()
            databaseName = os.getenv('SF_DATABASE')

            schemas = set()
            data: List[Dict] = list()
            returnColumnMetaData: Dict[str, List[ColumnInfo]] = dict()

            pkData: Dict[str, List[str]] = dict()
            seqData: List = list()

            for val in frameworkMetaData:
                # For all cmd_src
                schemaName = val['CMD_SRC'].split(".",1)[0]
                ## Schema name start with alpha or underscore and only contains alphanumeric, underscore or dollar
                if re.match("^[a-zA-Z_]+.",schemaName) and re.match("^[\w_$]+$",schemaName):
                    schemas.add(schemaName)

                # For all cmd_tgt
                schemaName = val['CMD_TGT'].split(".",1)[0]
                ## Schema name start with alpha or underscore and only contains alphanumeric, underscore or dollar
                if re.match("^[a-zA-Z_]+.",schemaName) and re.match("^[\w_$]+$",schemaName):
                    schemas.add(schemaName)

            for schemaName in schemas:
                sql_text = f"SHOW COLUMNS IN SCHEMA {databaseName}.{schemaName}"
                results = conn.cursor(DictCursor).execute(sql_text).fetchall()

                for result in results:
                    data.append(result)

                ## Also fetch table_names on these schemas, if they have primary key defined
                sql_text = f"""SELECT table_schema||'.'||table_name AS table_name
                                FROM information_schema.table_constraints 
                                WHERE table_catalog = '{databaseName}'
                                AND table_schema = '{schemaName}'
                                AND constraint_type = 'PRIMARY KEY'"""
                results = conn.cursor(DictCursor).execute(sql_text).fetchall()

                if len(results) > 0:
                    for result in results:
                        pkData[result['TABLE_NAME']] = list()

                ## And also fetch sequences in the schema
                sql_text = f"""SELECT sequence_schema||'.'||sequence_name AS sequence_name
                                FROM information_schema.sequences 
                                WHERE sequence_catalog = '{databaseName}'
                                AND sequence_schema = '{schemaName}'"""
                results = conn.cursor(DictCursor).execute(sql_text).fetchall()

                if len(results) > 0:
                    for result in results:
                        seqData.append(result['SEQUENCE_NAME'])


            # Now loop through PK data and populate column list. This has to be done in 2 passes, as column information is only available in 
            # DESC table command
            for key in pkData:
                sql_text = f"DESC TABLE {key}"

                qid = conn.cursor().execute(sql_text).sfqid
                sql_text = f"""SELECT "name" as column_name
                                FROM table(result_scan('{qid}'))
                            WHERE "kind" = 'COLUMN'
                                AND "primary key" = 'Y'"""
                
                results = conn.cursor(DictCursor).execute(sql_text).fetchall()

                for result in results:
                    pkData[key].append(result['COLUMN_NAME'])

            data = sorted(data, key=key_func)

            for key, value in groupby(data, key=key_func):
                tbl: List[ColumnInfo] = list()

                schemaName = key.split(".",1)[0]
                tableName = key.split(".",1)[1]
                # print(key)
                for row in value:
                    columnName = row['column_name']
                    dataType = json.loads(row['data_type'])['type']
                    isVirtual = row['kind'] == 'VIRTUAL_COLUMN'

                    if key in pkData and columnName in pkData[key]:
                        isPK = True
                    else:
                        isPK = False

                    if columnName.endswith('_KEY') or columnName.endswith('_ID')  or columnName.endswith('_SEQ'):
                        if f'{schemaName}.SEQ_{tableName}' in seqData:
                            sequenceName = f'{schemaName}.SEQ_{tableName}'
                        else:
                            sequenceName = None
                    else:
                        sequenceName = None

                    tbl.append(ColumnInfo(columnName, dataType, isVirtual, isPK, sequenceName))

                returnColumnMetaData[key] = tbl

            logger.info('Fetched Column Metadata!')

            return returnColumnMetaData

        except Exception as ex:
            err = f"Error: Fetching Column Metadata - {ex}"
            logger.error(err)
            raise Exception(err)
        
