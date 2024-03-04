import sys
import logging
import os
from streamlit.web.cli import main
from streamlit.web import cli as stcli

from tips.base import BaseTask
from tips.utils.logger import Logger
from tips.utils.utils import Globals

logger = logging.getLogger(Logger.getRootLoggerName())
globals = Globals()

class AppTask(BaseTask):
    errorList: list
    def validateArgs(self) -> int:
        logger.debug("Inside validateArgs")
        return 0

    def run(self):
        """Entry point for app task."""
        logger.debug("App Task initiated..")

        logger.debug(f"Argument server_port: {self.args.server_port}")

        if self.validateArgs() == 0:
            logger.debug(f"Validations succeeded")
        else:
            raise Exception("Validations failed, aborting process!")

        # Initialise globals
        globals.initGlobals()

        logger.info('Starting web server powered by Streamlit...')

        stHomeFilePath = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app', '01_Processes.py')
        if self.args.server_port is None:
            cmd = ["streamlit", "run", stHomeFilePath]
        else:
            cmd = ["streamlit", "run", stHomeFilePath, "--server.port", self.args.server_port]
        sys.argv = cmd
        sys.exit(stcli.main())
        sys.argv.remove('app')
        sys.argv.extend(cmd)
        main(prog_name="streamlit")            

        return True

    def interpret_results(self, results):
        return results
