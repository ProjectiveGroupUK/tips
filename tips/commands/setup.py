import os
from pathlib import Path
import re
import shutil
from typing import Any
import click
from datetime import datetime
import uuid
import toml

from tips.base import BaseTask
from tips.utils.utils import Globals
from tips.framework.db.database_connection import DatabaseConnection
from tips.include.starter_project import PACKAGE_PATH as starterProjectFolder

# Below is to initialise logging
import logging
from tips.utils.logger import Logger

logger = logging.getLogger(Logger.getRootLoggerName())


class SerializableType:
    def _serialize(self):
        raise NotImplementedError

    @classmethod
    def _deserialize(cls, value):
        raise NotImplementedError


class ValidatedStringMixin(str, SerializableType):
    ValidationRegex = ""

    @classmethod
    def _deserialize(cls, value: str) -> "ValidatedStringMixin":
        cls.validate(value)
        return ValidatedStringMixin(value)

    def _serialize(self) -> str:
        return str(self)

    @classmethod
    def validate(cls, value):
        res = re.match(cls.ValidationRegex, value)

        if res is None:
            raise Exception(f"Invalid value: {value}")  # TODO


class ProjectName(ValidatedStringMixin):
    ValidationRegex = r"^[^\d\W]\w*$"

    @classmethod
    def is_valid(cls, value: Any) -> bool:
        if not isinstance(value, str):
            return False

        try:
            cls.validate(value)
        except Exception:
            return False

        return True


class SetupTask(BaseTask):
    _projectName: str = None
    _projectID: str = None
    _projectCreatedAt: datetime = None
    _projectDir: Path = None
    globalVals = Globals()

    def copyStarterRepo(self, tgtProjectFolder):
        """This function copies over template structure to starter project folder"""
        logger.debug("Inside copyStarterRepo")

        # These files are to be ignored while setting up starter project, if present in template
        ignoreFiles = ["__init__.py", "__pycache__"]

        logger.debug(f"Creating starter project at location {tgtProjectFolder}")

        shutil.copytree(
            src=starterProjectFolder,
            dst=tgtProjectFolder,
            ignore=shutil.ignore_patterns(*ignoreFiles),
            dirs_exist_ok=True,
        )
        logger.debug("Starter project created!")

    def getProjectDir(self, projectName: str) -> Path:
        """This function creates directory where user's profiles is stored, if it doesn't already exist."""
        logger.debug("Inside createProjectDir")

        projectName = Path(projectName)
        projectIdFile = f"tips_project.toml"
        workingFolder = Path(os.getcwd())
        workingFolderName = Path(os.path.split(workingFolder)[-1])
        workingSubFolder = Path(os.path.join(workingFolder, projectName))

        """Check if the current working directory is project directory
        i.e. project name matches and identifier file also exists"""
        try:
            if (workingFolderName == projectName) and Path(
                os.path.join(workingFolder, projectIdFile)
            ).exists():
                logger.info("Already inside Project Working Folder")
                return workingFolder
            else:
                return workingSubFolder

        except Exception as e:
            raise Exception(f"Error occured while setting up project folder {e}")

    def setupConfig(self):
        """This function sets up project config i.e. db credentials etc."""
        logger.debug("Inside setupConfig")

        config = {}

        configFile = self.globalVals.getConfigFilePath()
        if configFile.exists():
            config = toml.load(configFile)

        config[self._projectID] = {}
 
        config[self._projectID]["type"] = "snowflake"
 
        sfAccount = ""
        while not len(sfAccount) > 0:
            if sfAccount:
                click.echo(sfAccount + " is not a valid account.")
            sfAccount = click.prompt(
                "Enter snowflake account name (https://<this_value>.snowflakecomputing.com)"
            )

        config[self._projectID]["account"] = f"{sfAccount}"

        sfUser = ""
        while not len(sfUser) > 0:
            if sfUser:
                click.echo(sfUser + " is not a valid user.")
            sfUser = click.prompt("Enter snowflake username (user)")

        config[self._projectID]["user"] = f"{sfUser}"

        click.echo("[1] password")
        click.echo("[2] externalbrowser")

        sfAuthenticationMethod = 0
        while sfAuthenticationMethod not in ("1", "2"):
            if sfAuthenticationMethod:
                click.echo(
                    "Enter valid authentication method ([1] password / [2] externalbrowser)"
                )
            sfAuthenticationMethod = click.prompt(
                "Desired authentication type option (enter a number)"
            )

        if sfAuthenticationMethod == "1":
            config[self._projectID]["authentication_method"] = "password"
            sfPassword = ""
            while not len(sfPassword) > 0:
                if sfPassword:
                    click.echo(sfPassword + " is not a valid password.")
                sfPassword = click.prompt(
                    f"Enter snowflake password for user [{sfUser}]", hide_input=True
                )
            config[self._projectID]["password"] = f"{sfPassword}"
        else:
            config[self._projectID]["authentication_method"] = "externalbrowser"

        sfRole = ""
        while not len(sfRole) > 0:
            if sfRole:
                click.echo(sfRole + " is not a valid role.")
            sfRole = click.prompt("Enter snowflake role to use")
        config[self._projectID]["role"] = f"{sfRole}"

        sfWarehouse = ""
        while not len(sfWarehouse) > 0:
            if sfWarehouse:
                click.echo(sfWarehouse + " is not a valid warehouse.")
            sfWarehouse = click.prompt(
                "Enter snowflake warehouse to use (warehouse name)"
            )
        config[self._projectID]["warehouse"] = f"{sfWarehouse}"

        sfDatabase = ""
        while not len(sfDatabase) > 0:
            if sfDatabase:
                click.echo(sfDatabase + " is not a valid database.")
            sfDatabase = click.prompt(
                "Enter snowflake database to use (when ommited in object definition)"
            )
        config[self._projectID]["database"] = f"{sfDatabase}"

        # sfSchema = ""
        # while not len(sfSchema) > 0:
        #     if sfSchema:
        #         click.echo(sfSchema + " is not a valid schema.")
        #     sfSchema = click.prompt(
        #         "Enter snowflake schema to use (when ommited in object definition)"
        #     )
        # config[self._projectID]["schema"] = f"{sfSchema}"

        sfSchema = "TIPS_MD_SCHEMA"
        config[self._projectID]["schema"] = f"{sfSchema}"

        with open(configFile, "w") as cf:
            toml.dump(config, cf)

            logger.info("Config setup completed!")

    def createMetaStore(
        self, dropSchema: bool = False, insertSampleMetaData: bool = False
    ):
        """This function creates schema and tables for storing data pipeline metadata"""

        logger.debug("Inside createMetaStore")
        configFile = self.globalVals.getConfigFilePath()
        logger.debug(f"Config file location is {configFile}")

        db = DatabaseConnection()

        if dropSchema:
            sqlCommand = "DROP SCHEMA IF EXISTS TIPS_MD_SCHEMA CASCADE;"
            results = db.executeSQL(sqlCommand=sqlCommand)

        sqlCommand = """
CREATE SCHEMA IF NOT EXISTS TIPS_MD_SCHEMA
COMMENT = 'This Schema holds Metadata for TIPS (Transformation In Plain SQL) tool'
;
"""
        results = db.executeSQL(sqlCommand=sqlCommand)

        sqlCommand = """
CREATE TABLE IF NOT EXISTS TIPS_MD_SCHEMA.PROCESS (
    PROCESS_ID      NUMBER(38,0) IDENTITY NOT NULL,
    PROCESS_NAME    VARCHAR(100) NOT NULL,
    PROCESS_DESCRIPTION     VARCHAR,
    ACTIVE       VARCHAR(1) DEFAULT 'Y'
);
"""
        results = db.executeSQL(sqlCommand=sqlCommand)

        sqlCommand = """
CREATE TABLE IF NOT EXISTS TIPS_MD_SCHEMA.PROCESS_CMD (
    PROCESS_ID                          NUMBER(38,0) NOT NULL,
    PROCESS_CMD_ID                      NUMBER(38,0) NOT NULL,
    CMD_TYPE                            VARCHAR(20) NOT NULL,
    CMD_SRC                             VARCHAR,
    CMD_TGT                             VARCHAR NOT NULL,
    CMD_WHERE                           VARCHAR,
    CMD_BINDS                           VARCHAR,
    REFRESH_TYPE                        VARCHAR(10),
    BUSINESS_KEY                        VARCHAR(100),
    MERGE_ON_FIELDS                     VARCHAR,
    GENERATE_MERGE_MATCHED_CLAUSE       VARCHAR(1),
    GENERATE_MERGE_NON_MATCHED_CLAUSE   VARCHAR(1),
    ADDITIONAL_FIELDS                   VARCHAR,
    TEMP_TABLE                          VARCHAR(1),
    CMD_PIVOT_BY                        VARCHAR,
    CMD_PIVOT_FIELD                     VARCHAR,
    DQ_TYPE                             VARCHAR(100),
    CMD_EXTERNAL_CALL                   VARCHAR,
    ACTIVE                              VARCHAR(1) DEFAULT 'Y'
);
"""
        results = db.executeSQL(sqlCommand=sqlCommand)

        sqlCommand = "CREATE SEQUENCE IF NOT EXISTS TIPS_MD_SCHEMA.PROCESS_LOG_SEQ;"
        results = db.executeSQL(sqlCommand=sqlCommand)

        sqlCommand = """
CREATE TABLE IF NOT EXISTS TIPS_MD_SCHEMA.PROCESS_LOG (
    PROCESS_LOG_ID                      NUMBER(38,0) NOT NULL PRIMARY KEY DEFAULT TIPS_MD_SCHEMA.PROCESS_LOG_SEQ.NEXTVAL,
    PROCESS_NAME                        VARCHAR(100) NOT NULL,
    PROCESS_LOG_CREATED_AT              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    PROCESS_START_TIME                  TIMESTAMP,
    PROCESS_END_TIME                    TIMESTAMP,
    PROCESS_ELAPSED_TIME_IN_SECONDS     INTEGER,
    EXECUTE_FLAG                        VARCHAR2(1) NOT NULL DEFAULT 'Y',
    STATUS                              VARCHAR2(100) NOT NULL,
    ERROR_MESSAGE                       VARCHAR,
    LOG_JSON                            VARIANT NOT NULL
);
"""
        results = db.executeSQL(sqlCommand=sqlCommand)

        sqlCommand = """
CREATE TABLE IF NOT EXISTS tips_md_schema.process_dq_test_group (
    process_dq_test_group_id                NUMBER(38,0) IDENTITY NOT NULL PRIMARY KEY,
    process_dq_test_group_name              VARCHAR(100) NOT NULL UNIQUE,
    process_dq_test_group_description       VARCHAR,
    active                                  BOOLEAN NOT NULL DEFAULT true
);
"""
        results = db.executeSQL(sqlCommand=sqlCommand)

        sqlCommand = """
MERGE INTO tips_md_schema.process_dq_test_group a
USING (
  SELECT 'COL_UNIQUE' process_dq_test_group_name
       , 'Check Uniqueness of a column in the table' process_dq_test_group_description
  UNION ALL
  SELECT 'COL_NOT_NULL' process_dq_test_group_name
       , 'Check that column value in the table are not null for any record' process_dq_test_group_description
  UNION ALL
  SELECT 'COL_ACCEPTED_VALUES' process_dq_test_group_name
       , 'Check that column in the table contains only one of the accepted values' process_dq_test_group_description
) b
ON a.process_dq_test_group_name = b.process_dq_test_group_name
WHEN NOT MATCHED THEN
INSERT (
    process_dq_test_group_name
  , process_dq_test_group_description
) 
VALUES (
    b.process_dq_test_group_name
  , b.process_dq_test_group_description
);
"""
        results = db.executeSQL(sqlCommand=sqlCommand)

        sqlCommand = """
CREATE TABLE IF NOT EXISTS tips_md_schema.process_dq_test (
    process_dq_test_id                      NUMBER(38,0) IDENTITY NOT NULL PRIMARY KEY,
    process_dq_test_group_id                NUMBER(38,0) NOT NULL FOREIGN KEY REFERENCES tips_md_schema.process_dq_test_group(process_dq_test_group_id),
    process_dq_test_group_name              VARCHAR(100) NOT NULL FOREIGN KEY REFERENCES tips_md_schema.process_dq_test_group(process_dq_test_group_name),
    process_dq_test_name                    VARCHAR(100) NOT NULL UNIQUE,
    process_dq_test_description             VARCHAR,
    process_dq_test_query_template          VARCHAR NOT NULL,
    process_dq_test_error_message           VARCHAR NOT NULL,
    active                                  BOOLEAN NOT NULL DEFAULT true
);
"""
        results = db.executeSQL(sqlCommand=sqlCommand)

        sqlCommand = """
MERGE INTO tips_md_schema.process_dq_test a
USING (
  SELECT grp.process_dq_test_group_id
       , grp.process_dq_test_group_name
       , 'UNIQUE' process_dq_test_name
       , grp.process_dq_test_group_description process_dq_test_description
       , 'SELECT {COL_NAME}, COUNT(*) FROM {TAB_NAME} GROUP BY {COL_NAME} HAVING COUNT(*) > 1' process_dq_test_query_template
       , 'Non Unique Values found in {TAB_NAME}.{COL_NAME}' process_dq_test_error_message
    FROM tips_md_schema.process_dq_test_group grp
   WHERE grp.process_dq_test_group_name = 'COL_UNIQUE'
  UNION ALL
  SELECT grp.process_dq_test_group_id
       , grp.process_dq_test_group_name
       , 'NOT_NULL' process_dq_test_name
       , grp.process_dq_test_group_description process_dq_test_description
       , 'SELECT {COL_NAME} FROM {TAB_NAME} WHERE {COL_NAME} IS NULL' process_dq_test_query_template
       , 'NULL Values found in {TAB_NAME}.{COL_NAME}' process_dq_test_error_message
    FROM tips_md_schema.process_dq_test_group grp
   WHERE grp.process_dq_test_group_name = 'COL_NOT_NULL'
  UNION ALL
  SELECT grp.process_dq_test_group_id
       , grp.process_dq_test_group_name
       , 'ACCEPTED_VALUES' process_dq_test_name
       , grp.process_dq_test_group_description process_dq_test_description
       , 'SELECT {COL_NAME} FROM {TAB_NAME} WHERE {COL_NAME} NOT IN ({ACCEPTED_VALUES})' process_dq_test_query_template
       , 'Values other than {ACCEPTED_VALUES} found in {TAB_NAME}.{COL_NAME}' process_dq_test_error_message
    FROM tips_md_schema.process_dq_test_group grp
   WHERE grp.process_dq_test_group_name = 'COL_ACCEPTED_VALUES'
) b
ON a.process_dq_test_name = b.process_dq_test_name
WHEN NOT MATCHED THEN
INSERT (
    process_dq_test_group_id
  , process_dq_test_group_name
  , process_dq_test_name
  , process_dq_test_description
  , process_dq_test_query_template
  , process_dq_test_error_message
) 
VALUES (
    b.process_dq_test_group_id
  , b.process_dq_test_group_name
  , b.process_dq_test_name
  , b.process_dq_test_description
  , b.process_dq_test_query_template
  , b.process_dq_test_error_message
);
"""
        results = db.executeSQL(sqlCommand=sqlCommand)

        sqlCommand = """
CREATE TABLE IF NOT EXISTS tips_md_schema.process_cmd_tgt_dq_test (
    process_cmd_tgt_dq_test_id              NUMBER(38,0) IDENTITY NOT NULL PRIMARY KEY,
    tgt_name                                VARCHAR(100) NOT NULL,
    attribute_name                          VARCHAR(100),
    process_dq_test_name                    VARCHAR(100) NOT NULL FOREIGN KEY REFERENCES tips_md_schema.process_dq_test(process_dq_test_name),
    accepted_values                         VARCHAR,
    error_and_abort                         BOOLEAN NOT NULL DEFAULT true,
    active                                  BOOLEAN NOT NULL DEFAULT true
);
"""
        results = db.executeSQL(sqlCommand=sqlCommand)

        sqlCommand = """
CREATE TABLE IF NOT EXISTS tips_md_schema.process_dq_log (
    process_dq_log_id                       NUMBER(38,0) IDENTITY NOT NULL,
    process_log_id                          NUMBER(38,0) NOT NULL FOREIGN KEY REFERENCES tips_md_schema.process_log(process_log_id),
    tgt_name                                VARCHAR(100) NOT NULL,
    attribute_name                          VARCHAR(100),
    dq_test_name                            VARCHAR(100) NOT NULL,
    dq_test_query                           VARCHAR,  
    dq_test_result                          VARIANT,
    start_time                              TIMESTAMP,
    end_time                                TIMESTAMP,
    elapsed_time_in_seconds                 INTEGER,
    status                                  VARCHAR2(100) NOT NULL,
    status_message                          VARCHAR
);
"""
        results = db.executeSQL(sqlCommand=sqlCommand)

        sqlCommand = "USE SCHEMA TIPS_MD_SCHEMA;"
        results = db.executeSQL(sqlCommand=sqlCommand)

        for path, subdirs, files in os.walk(os.path.join(self._projectDir, "metadata")):
            files.sort()
            pathEnds = os.path.basename(os.path.normpath(path))
            if (pathEnds != "sample") or (
                pathEnds == "sample" and insertSampleMetaData
            ):
                for fileName in files:
                    if fileName.endswith(".sql"):
                        with open(os.path.join(path, fileName), "r") as f:
                            sqlCommand = ""
                            for line in f:
                                sqlCommand += line
                                if line.strip().startswith(
                                    ";"
                                ) or line.strip().endswith(";"):
                                    results = db.executeSQL(sqlCommand=sqlCommand)
                                    logger.info(
                                        f"Metadata created from file {fileName}"
                                    )
                                    sqlCommand = ""

    def run(self):
        """Entry point for the setup task."""
        logger.info("Setting up Project...")
        projectName: str

        actionOption = 0
        # check if already in project folder
        if Path.cwd().joinpath("tips_project.toml").exists():
            click.echo("You are already in TIPS Project folder, what do you want to do?")
            click.echo("[1] Reconfigure DB Credentials")
            click.echo("[2] Re-initialise whole project")
            click.echo("[3] Exit")

            while actionOption not in ("1", "2", "3"):
                if actionOption:
                    click.echo(
                        "Enter valid option ([1] Reconfigure DB Credentials / [2] Re-initialise whole project) / [3] Exit"
                    )
                actionOption = click.prompt("Desired option (enter a number)")

            # Exit silently
            if actionOption == "3":
                return True
            else:
                projectFile = toml.load(Path.cwd().joinpath("tips_project.toml"))
                self._projectName = projectFile.get("project").get("project_name")
                self._projectID = projectFile.get("project").get("project_id")

        if self._projectName is None:
            projectName = self.args.project_name
            while not ProjectName.is_valid(projectName):
                if projectName:
                    click.echo(projectName + " is not a valid project name.")
                projectName = click.prompt(
                    "Enter a name for your project (letters, digits, underscore)"
                )

            self._projectName = projectName

        self.globalVals.setProjectName(self._projectName)

        self._projectCreatedAt = datetime.now()

        self._projectDir = self.getProjectDir(self._projectName)

        if self._projectDir is not None:
            self.globalVals.setProjectDir(projectDir=self._projectDir)
            if actionOption != "1":
                self.copyStarterRepo(self._projectDir)
                os.chdir(self._projectDir)

            projectIdFile = f"tips_project.toml"

            # Create a unique project ID and set it to globals
            if self._projectID is None:
                self._projectID = str(uuid.uuid1())
            self.globalVals.setProjectID(self._projectID)

            with open(projectIdFile, "w") as f:
                f.write(
                    f"""[project]
project_id = "{self._projectID}"
project_name = "{self._projectName}"
last_initialised_at = {self._projectCreatedAt}

"""
                )

            # Now generate DB Connection information
            if (self.args.skip_connection_setup) and (actionOption not in ("1", "2")):
                logger.info("Skipping connection setup")
            else:
                logger.info("Starting to setup config")
                # Create directory if it doesn't already exists
                Path(self.globalVals.getConfigDir()).mkdir(parents=True, exist_ok=True)
                self.setupConfig()
            
            # # Now run metadata setup in database
            if actionOption == "1":
                logger.info("Skipping Metadata Setup")
            elif self.args.skip_metadata_setup:
                logger.info("Skipping Metadata Setup")
            else:
                logger.info("Starting setting up metadata")
                self.createMetaStore(
                    dropSchema=self.args.force_metadata_refresh,
                    insertSampleMetaData=self.args.insert_sample_metadata,
                )

        logger.info("Project setup completed!")
        return True

    def interpret_results(self, results):
        return results
