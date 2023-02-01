import logging

from tips.base import BaseTask
from tips.utils.logger import Logger
from tips.utils.utils import Globals
from tips.webapp.web_app import WebApp

logger = logging.getLogger(Logger.getRootLoggerName())
globals = Globals()

class WebAppTask(BaseTask):
    errorList: list
    def validateArgs(self) -> int:
        logger.debug("Inside validateArgs")
        # """
        # Validation # 1
        # Check that deployment is run in dev only
        # """
        # env = globals.getEnvName()
        # if env.lower() not in ("debug", "dev", "development"):
        #     raise Exception(
        #         "Deploy command can only be run in development environments"
        #     )

        # """
        # Validation # 2
        # Check that project toml file exists
        # """
        # projectIdFile = f"tips_project.toml"
        # workingFolder = Path.cwd()
        # if not Path.joinpath(workingFolder, projectIdFile).exists():
        #     raise Exception(
        #         "Not inside project root folder. Please navigate to project's root folder to run commands"
        #     )

        # """
        # Validation # 3
        # If skip database object flag has been passed, then object type and/or object name fields shouldn't be used
        # """
        # if self.args.skip_db_objects:
        #     if (self.args.object_types is not None) or (
        #         self.args.object_names is not None
        #     ):
        #         raise Exception(
        #             "Object Type or Object Name should not be passed when skip db object flag is used"
        #         )

        return 0

    def run(self):
        """Entry point for app task."""
        logger.debug("WebApp Task initiated..")

        logger.debug(f"Argument server_port: {self.args.server_port}")

        if self.validateArgs() == 0:
            logger.debug(f"Validations succeeded")
        else:
            raise Exception("Validations failed, aborting process!")

        # Initialise globals
        globals.initGlobals()

        # Now call framework
        app = WebApp()
        
        logger.info('Starting TIPS web server...')
        ret = app.startServer(port=self.args.server_port)

        return True

    def interpret_results(self, results):
        return results
