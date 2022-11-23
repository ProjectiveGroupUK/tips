import logging
import shutil
from pathlib import Path

from tips.base import BaseTask
from tips.utils.logger import Logger
from tips.utils.utils import Globals

logger = logging.getLogger(Logger.getRootLoggerName())
globals = Globals()

class DeployTask(BaseTask):

    def validateArgs(self) -> int:
        logger.debug('Inside validateArgs')
        """
        Validation # 1
        """
        # if (self.args.models == None and self.args.select == None and self.args.tags is None):
        #     logger.error('Either models or tags should be mentioned in arguments for DAG to be generated!')
        #     return 1


        """
        Validation # 2
        """
        
        """
        Validation # 3
        """

        """
        Validation # 4
        """

        return 0

    def run(self):
        """Entry point for gendag task."""
        logger.debug("Deploy process initiated..")

        logger.debug(f'Argument object_types: {self.args.object_types}')
        logger.debug(f'Argument object_names: {self.args.object_names}')
        logger.debug(f'Argument skip_metadata_setup: {self.args.skip_metadata_setup}')
        logger.debug(f'Argument insert_sample_metadata: {self.args.insert_sample_metadata}')

        if self.validateArgs() == 0:
            logger.debug(f'Validations succeeded')
        else:
            raise Exception('Validations failed, aborting process!')

        return True

    def interpret_results(self, results):
        return results
    
