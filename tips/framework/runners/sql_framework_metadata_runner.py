from snowflake.connector import DictCursor
from typing import List, Dict
from tips.framework.db.database_connection import DatabaseConnection
from tips.framework.metadata.framework_metadata import FrameworkMetaData
from tips.framework.utils.sql_template import SQLTemplate


class SQLFrameworkMetaDataRunner(FrameworkMetaData):

    _processName: str

    def __init__(self, processName, logger) -> None:
        self._processName = processName
        self.logger = logger

    def getMetaData(self, conn: DatabaseConnection) -> List[Dict]:

        try:

            self.logger.info('Fetching Framework Metadata...')

            cmdStr: str = SQLTemplate().getTemplate(
                sqlAction="framework_metadata",
                parameters={"process_name": self._processName},
            )

            results: List[Dict] = conn.cursor(DictCursor).execute(cmdStr).fetchall()

            self.logger.info('Fetched Framework Metadata!')

            return results

        except Exception as ex:
            err = f"Error: Fetching Framework Metadata - {ex}"
            self.logger.error(err)
            raise Exception(err)

