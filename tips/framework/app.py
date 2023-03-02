import json
from typing import Dict, List
from tips.framework.db.database_connection import DatabaseConnection
from tips.framework.factories.framework_factory import FrameworkFactory
from tips.framework.metadata.column_metadata import ColumnMetadata
from tips.framework.metadata.table_metadata import TableMetaData
from tips.framework.metadata.framework_metadata import FrameworkMetaData
from tips.framework.runners.framework_runner import FrameworkRunner

# from tips.framework.utils.logger import Logger
from datetime import datetime
import argparse

# Below is to initialise logging
import logging
from tips.utils.logger import Logger

logger = logging.getLogger(Logger.getRootLoggerName())


class App:
    _processName: str
    _bindVariables: Dict
    _executeFlag: str

    def __init__(self, processName: str, bindVariables: str, executeFlag: str) -> None:
        self._processName = processName
        self._bindVariables = (
            dict() if bindVariables is None else json.loads(bindVariables)
        )
        self._executeFlag = executeFlag

    def main(self) -> None:
        logger.debug("Inside framework app main")
        logInstance = Logger()
        logInstance.addFileHandler()

        dbConnection: DatabaseConnection = DatabaseConnection()
        logger.debug("DB Connection established!")

        start_dt = datetime.now()
        framework: FrameworkMetaData = FrameworkFactory().getProcess(self._processName)
        frameworkMetaData: List[Dict] = framework.getMetaData(dbConnection)

        if len(frameworkMetaData) <= 0:
            logger.error(
                "Could not fetch Metadata. Please make sure correct process name is passed and metadata setup has been done correctly first!"
            )
        else:
            logger.info("Fetched Framework Metadata!")
            processStartTime = start_dt

            columnMetaData: List[Dict] = ColumnMetadata().getData(
                frameworkMetaData=frameworkMetaData, conn=dbConnection
            )

            tableMetaData: TableMetaData = TableMetaData(columnMetaData)

            frameworkRunner: FrameworkRunner = FrameworkRunner(
                processName=self._processName,
                bindVariables=self._bindVariables,
                executeFlag=self._executeFlag,
            )

            runFramework: Dict = frameworkRunner.run(
                conn=dbConnection,
                tableMetaData=tableMetaData,
                frameworkMetaData=frameworkMetaData,
            )

            logInstance.writeResultJson(runFramework)

            # Now insert process run log to database
            processEndTime = datetime.now()
            sqlCommand = f"""
INSERT INTO tips_md_schema.process_log (process_name, process_start_time, process_end_time, process_elapsed_time_in_seconds, execute_flag, status, error_message, log_json)
SELECT '{self._processName}','{processStartTime}','{processEndTime}',{round((processEndTime - processStartTime).total_seconds(),2)},'{self._executeFlag}','{runFramework["status"]}','{runFramework["error_message"]}',PARSE_JSON('{json.dumps(runFramework).replace("'","''")}')
            """
            logger.info(sqlCommand)
            results = dbConnection.executeSQL(sqlCommand=sqlCommand)

            if runFramework.get("status") == "ERROR":
                error_message = runFramework.get("error_message")
                logger.error(error_message)

        dbConnection.closeConnection()
        logInstance.removeFileHandler()
        end_dt = datetime.now()
        logger.info(f"Start DateTime: {start_dt}")
        logger.info(f"End DateTime: {end_dt}")
        logger.info(
            f"Total Elapsed Time (secs): {round((end_dt - start_dt).total_seconds(),2)}"
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        usage="python app.py -p Process Name -v Variables in Dictionary Format -e Execute?(Y/N)",
        description="""E.g.: python app.py -p PUBLISH_CUSTOMER -v "{'MARKET_SEGMENT':'FURNITURE', 'COBID':'20210401'}" -e N""",
    )

    parser.add_argument(
        "-p",
        "--process",
        metavar="Process Name",
        dest="PROCESS_NAME",
        required=True,
        help="Process Name to run",
    )
    parser.add_argument(
        "-v",
        "--var",
        metavar="Bind Variables Dictionary",
        dest="VARS",
        help="Bind Variables to use in the run",
    )
    parser.add_argument(
        "-e",
        "--exec",
        metavar="Execute=Y/N",
        dest="EXEC",
        choices=["y", "Y", "n", "N"],
        required=True,
        help="Y - Execute pipeline, N - Run in Debug Mode",
    )

    args = parser.parse_args()

    v_process_name = args.PROCESS_NAME.upper()

    v_vars = args.VARS
    if v_vars is not None:
        if v_vars.startswith("{") == False or v_vars.endswith("}") == False:
            raise ValueError(
                "Invalid value for argument Bind Variable. Should be in form of Dictionary!"
            )
        v_vars = v_vars.replace("'", '"')

    v_exec = args.EXEC.upper()

    app = App(processName=v_process_name, bindVariables=v_vars, executeFlag=v_exec)

    app.main()

    exit(0)
