import json
from typing import Dict, List
from db.database_connection import DatabaseConnection
from factories.framework_factory import FrameworkFactory
from metadata.column_metadata import ColumnMetadata
from metadata.table_metadata import TableMetaData
from metadata.framework_metadata import FrameworkMetaData
from runners.framework_runner import FrameworkRunner
from utils.logger import Logger

import argparse


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

        logRunner = Logger()
        logger = logRunner.setupLogger()

        sfConnection: DatabaseConnection = DatabaseConnection(logger)
        sfSess = sfConnection.connect()

        framework: FrameworkMetaData = FrameworkFactory().getProcess(self._processName, logger)
        frameworkMetaData: List[Dict] = framework.getMetaData(sfSess)

        columnMetaData: List[Dict] = ColumnMetadata().getData(
            frameworkMetaData=frameworkMetaData, conn=sfSess, logger=logger
        )

        tableMetaData: TableMetaData = TableMetaData(columnMetaData)

        frameworkRunner: FrameworkRunner = FrameworkRunner(
            processName=self._processName,
            bindVariables=self._bindVariables,
            executeFlag=self._executeFlag,
        )

        runFramework: Dict = frameworkRunner.run(
            conn=sfSess,
            tableMetaData=tableMetaData,
            frameworkMetaData=frameworkMetaData,
        )

        logRunner.writeResultJson(runFramework)
        # print(json.dumps(runFramework, indent=4))

        sfConnection.close_connection()


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
