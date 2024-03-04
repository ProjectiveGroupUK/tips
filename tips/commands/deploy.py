import logging
from pathlib import Path
import os

from tips.base import BaseTask
from tips.utils.logger import Logger
from tips.utils.utils import Globals
from tips.utils.database_connection import DatabaseConnection

logger = logging.getLogger(Logger.getRootLoggerName())
globals = Globals()

class DeployTask(BaseTask):
    errorList: list
    def validateArgs(self) -> int:
        logger.debug("Inside validateArgs")
        """
        Validation # 1
        Check that deployment is run in dev only
        """
        env = globals.getEnvName()
        if env.lower() not in ("debug", "dev", "development"):
            raise Exception(
                "Deploy command can only be run in development environments"
            )

        """
        Validation # 2
        Check that project toml file exists
        """
        projectIdFile = f"tips_project.toml"
        workingFolder = Path.cwd()
        if not Path.joinpath(workingFolder, projectIdFile).exists():
            raise Exception(
                "Not inside project root folder. Please navigate to project's root folder to run commands"
            )

        """
        Validation # 3
        If skip database object flag has been passed, then object type and/or object name fields shouldn't be used
        """
        if self.args.skip_db_objects:
            if (self.args.object_types is not None) or (
                self.args.object_names is not None
            ):
                raise Exception(
                    "Object Type or Object Name should not be passed when skip db object flag is used"
                )

        return 0

    def checkDBFolderExists(self) -> bool:
        logger.debug("Inside checkDBFolderExists")
        dbFolder = "db_objects"
        workingFolder = Path.cwd()
        if not Path.joinpath(workingFolder, dbFolder).exists():
            raise Exception(
                "Could not find db_objects folder, which should contain DB Object scripts to be deployed"
            )

        return True

    def checkMDFolderExists(self) -> bool:
        logger.debug("Inside checkMDFolderExists")
        mdFolder = "metadata"
        workingFolder = Path.cwd()
        if not Path.joinpath(workingFolder, mdFolder).exists():
            raise Exception(
                "Could not find metadata folder, which should contain Metadata scripts to be deployed"
            )

        return True

    def walkFolderAndDeployFiles(self, walkFolder, argsNames):
        logger.debug("Inside deployMetaData")
        logger.debug(f"walkFolder: {walkFolder}")
        logger.debug(f"argsNames: {argsNames}")

        db = DatabaseConnection()
        executeThisFile:bool

        for subdir, dirs, files in os.walk(walkFolder):
            for file in sorted(files):
                executeThisFile = False
                if not subdir.endswith('sample'):
                    if file.endswith('.sql'):
                        if argsNames is not None:
                            argsNamesUpper = [os.path.splitext(each)[0].upper() for each in argsNames]
                            head, tail = os.path.split(file)
                            fileNameUpper = os.path.splitext(tail)[0].upper()
                            if fileNameUpper in argsNamesUpper:
                                executeThisFile = True
                        else:
                            executeThisFile = True
                
                if executeThisFile:
                    logger.debug(f"Deploying file {file}")
                    try:
                        db.executeSQLFile(sqlFile=os.path.join(subdir,file))
                    except Exception as ex:
                        self.errorList.append(ex)


    def deployMetaData(self) -> bool:
        logger.debug("Inside deployMetaData")
        if self.args.metadata_script_names is not None:
            logger.debug("Selective Metedata scripts deployment")
        else:
            logger.debug("Deploy all Metadata scripts")

        metaFolder = Path.joinpath(Path.cwd(), "metadata")
        self.errorList = []

        self.walkFolderAndDeployFiles(metaFolder,self.args.metadata_script_names)

        errorMessages = ""
        if len(self.errorList) > 0:
            for exception in self.errorList:
                errorMessages += f"\n\n{exception}"

            raise Exception(f"Error encountered in deployment with following: {errorMessages}")

    def deployDBObjects(self) -> bool:
        logger.debug("Inside deployMetaData")
        logger.debug(f"object_types: {self.args.object_types}")
        logger.debug(f"object_names: {self.args.object_names}")
        if (
            self.args.object_types is not None
            or self.args.object_names is not None
        ):
            logger.debug("Selective DB Object scripts deployment")
        else:
            logger.debug("Deploy all DB Object scripts")

        dboFolder = Path.joinpath(Path.cwd(), "db_objects")
        db = DatabaseConnection()
        errorList = []
        executeThisFile:bool
        if self.args.object_types is None:
            objectTypes = []
        else:
            objectTypes = [e.strip().lower() for e in self.args.object_types]

        ##SCHEMAs
        if (len(objectTypes) == 0) or ("schema" in objectTypes):
            walkFolder = Path.joinpath(dboFolder, "schema")
            self.walkFolderAndDeployFiles(walkFolder,self.args.object_names)


        ##STAGE
        if (len(objectTypes) == 0) or ("stage" in objectTypes):
            walkFolder = Path.joinpath(dboFolder, "stage")
            self.walkFolderAndDeployFiles(walkFolder,self.args.object_names)

        ##FILE FORMAT
        if (len(objectTypes) == 0) or ("fileformat" in objectTypes):
            walkFolder = Path.joinpath(dboFolder, "fileformat")
            self.walkFolderAndDeployFiles(walkFolder,self.args.object_names)

        ##PIPES
        if (len(objectTypes) == 0) or ("pipe" in objectTypes):
            walkFolder = Path.joinpath(dboFolder, "pipe")
            self.walkFolderAndDeployFiles(walkFolder,self.args.object_names)

        ##SEQUENCE
        if (len(objectTypes) == 0) or ("sequence" in objectTypes):
            walkFolder = Path.joinpath(dboFolder, "sequence")
            self.walkFolderAndDeployFiles(walkFolder,self.args.object_names)

        ##TABLE
        if (len(objectTypes) == 0) or ("table" in objectTypes):
            walkFolder = Path.joinpath(dboFolder, "table")
            self.walkFolderAndDeployFiles(walkFolder,self.args.object_names)

        ##FUNCTION
        if (len(objectTypes) == 0) or ("function" in objectTypes):
            walkFolder = Path.joinpath(dboFolder, "function")
            self.walkFolderAndDeployFiles(walkFolder,self.args.object_names)

        ##VIEW
        if (len(objectTypes) == 0) or ("view" in objectTypes):
            walkFolder = Path.joinpath(dboFolder, "view")
            self.walkFolderAndDeployFiles(walkFolder,self.args.object_names)

        ##PROCEDURE
        if (len(objectTypes) == 0) or ("procedure" in objectTypes):
            walkFolder = Path.joinpath(dboFolder, "procedure")
            self.walkFolderAndDeployFiles(walkFolder,self.args.object_names)

        errorMessages = ""
        if len(errorList) > 0:
            for exception in errorList:
                errorMessages += f"\n\n{exception}"

            raise Exception(f"Error encountered in deployment with following: {errorMessages}")

    def run(self):
        """Entry point for deploy task."""
        logger.debug("Deploy Task initiated..")

        logger.debug(f"Argument skip_db_objects: {self.args.skip_db_objects}")
        logger.debug(f"Argument object_types: {self.args.object_types}")
        logger.debug(f"Argument object_names: {self.args.object_names}")
        logger.debug(
            f"Argument metadata_script_names: {self.args.metadata_script_names}"
        )
        logger.debug(f"Argument skip_metadata_setup: {self.args.skip_metadata_setup}")

        if self.validateArgs() == 0:
            logger.debug(f"Validations succeeded")
        else:
            raise Exception("Validations failed, aborting process!")

        # Initialise globals
        globals.initGlobals()

        ##deploy Metadata
        if not self.args.skip_metadata_setup:
            if self.checkMDFolderExists():
                self.deployMetaData()

        ##deploy DB objects
        if not self.args.skip_db_objects:
            if self.checkDBFolderExists():
                self.deployDBObjects()
        return True

    def interpret_results(self, results):
        return results
