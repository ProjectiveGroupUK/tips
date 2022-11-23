import logging
import json
import toml
from pathlib import Path

from tips.base import BaseTask
from tips.utils.logger import Logger
from tips.utils.utils import Globals
from tips.framework.app import App

logger = logging.getLogger(Logger.getRootLoggerName())
globals = Globals()


class RunTask(BaseTask):
    def validateArgs(self) -> int:
        logger.debug("Inside validateArgs")
        """
        Validation # 1
        Check that project toml file exists
        """
        projectIdFile = f"tips_project.toml"
        workingFolder = Path.cwd()
        if not Path.joinpath(workingFolder, projectIdFile).exists():
            raise Exception(
                "Not inside project root folder. Please navigate to project's root folder to run commands"
            )

        """
        Validation # 2
        if variable is passed, check that it is in valid dictionary format
        """
        if self.args.variables_dict is not None:
            if (
                self.args.variables_dict.startswith("{") == False
                or self.args.variables_dict.endswith("}") == False
            ):
                raise Exception(
                    "Invalid value for argument Bind Variable. Should be in form of Dictionary!"
                )
            try:
                self.args.variables_dict = self.args.variables_dict.replace("'", '"')
                # now check that it is in valid json format
                json.loads(self.args.variables_dict)
            except Exception as e:
                raise Exception(f"Error encounted with variable dict, {e}")

        return 0

    def run(self):
        """Entry point for gendag task."""
        logger.debug("Generate DAG process initiated..")

        logger.debug(f"Argument process_name: {self.args.process_name}")
        logger.debug(f"Argument variables_dict: {self.args.variables_dict}")
        logger.debug(f"Argument no_execute_mode: {self.args.no_execute_mode}")

        if self.validateArgs() == 0:
            logger.debug(f"Validations succeeded")
        else:
            raise Exception("Validations failed, aborting process!")

        self.args.process_name = self.args.process_name.upper()

        if self.args.variables_dict is not None:
            self.args.variables_dict = self.args.variables_dict.upper()

        if self.args.no_execute_mode:
            executeFlag = "N"
        else:
            executeFlag = "Y"

        # Initialise globals
        projectIdFile = f"tips_project.toml"
        workingFolder = Path.cwd()
        config = toml.load(Path.joinpath(workingFolder, projectIdFile))
        projectID = config.get('project').get('project_id')
        if projectID is None:
            raise Exception('Project config file seems to be corrupted, please run setup again to recreate the file!')

        globals.setProjectDir(Path.cwd())
        globals.setProjectID(projectID=projectID)
        
        # Now call framework
        app = App(
            processName=self.args.process_name,
            bindVariables=self.args.variables_dict,
            executeFlag=executeFlag,
        )
        
        app.main()
        
        return True

    def interpret_results(self, results):
        return results
