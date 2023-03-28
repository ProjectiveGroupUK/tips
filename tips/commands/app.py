import logging

from tips.base import BaseTask
from tips.utils.logger import Logger
from tips.utils.utils import Globals
from tips.app.app_util import AppUtil

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

        # Now call framework
        app = AppUtil()

        logger.info('Starting web server powered by Streamlit...')
        if app.checkStreamlitVersion() == 0:
            ret = app.startServer(port=self.args.server_port)

        return True

    def interpret_results(self, results):
        return results
