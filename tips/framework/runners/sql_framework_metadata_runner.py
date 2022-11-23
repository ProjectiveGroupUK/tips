from typing import List, Dict
from tips.framework.db.database_connection import DatabaseConnection
from tips.framework.metadata.framework_metadata import FrameworkMetaData
from tips.framework.utils.sql_template import SQLTemplate
# Below is to initialise logging
import logging
from tips.utils.logger import Logger
logger = logging.getLogger(Logger.getRootLoggerName())


class SQLFrameworkMetaDataRunner(FrameworkMetaData):

    _processName: str

    def __init__(self, processName) -> None:
        self._processName = processName

    def getMetaData(self, conn: DatabaseConnection) -> List[Dict]:

        logger.info('Fetching Framework Metadata...')

        cmdStr: str = SQLTemplate().getTemplate(
            sqlAction="framework_metadata",
            parameters={"process_name": self._processName},
        )

        results: List[Dict] = conn.executeSQL(sqlCommand=cmdStr)
        logger.info('Fetched Framework Metadata!')

        return results
