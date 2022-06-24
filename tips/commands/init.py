# import copy
import os
from pathlib import Path
import re
import shutil
from typing import Any

# import yaml
import click
from datetime import datetime
import toml
from tips.utils import Globals


from tips.framework.db.database_connection import DatabaseConnection

# import dbt.config
# import dbt.clients.system
# from tips import flags
# from dbt.version import _get_adapter_plugin_names
# from dbt.adapters.factory import load_plugin, get_include_paths

# from dbt.contracts.project import Name as ProjectName

# from dbt.events.functions import fire_event
# from dbt.events.types import (
#     StarterProjectPath,
#     ConfigFolderDirectory,
#     NoSampleProfileFound,
#     ProfileWrittenWithSample,
#     ProfileWrittenWithTargetTemplateYAML,
#     ProfileWrittenWithProjectTemplateYAML,
#     SettingUpProfile,
#     InvalidProfileTemplateYAML,
#     ProjectNameAlreadyExists,
#     GetAddendum,
# )

from tips.include.starter_project import PACKAGE_PATH as starterProjectFolder  ##TBC

# from dbt.task.base import BaseTask, move_to_nearest_project_dir
from tips.base import BaseTask ##TBC

# DOCS_URL = "https://docs.getdbt.com/docs/configure-your-profile"
# SLACK_URL = "https://community.getdbt.com/"

# This file is not needed for the starter project but exists for finding the resource path
IGNORE_FILES = ["__init__.py", "__pycache__"]

# ON_COMPLETE_MESSAGE = """
# Your new dbt project "{project_name}" was created!

# For more information on how to configure the profiles.yml file,
# please consult the dbt documentation here:

#   {docs_url}

# One more thing:

# Need help? Don't hesitate to reach out to us via GitHub issues or on Slack:

#   {slack_url}

# Happy modeling!
# """

# # https://click.palletsprojects.com/en/8.0.x/api/#types
# # click v7.0 has UNPROCESSED, STRING, INT, FLOAT, BOOL, and UUID available.
# click_type_mapping = {
#     "string": click.STRING,
#     "int": click.INT,
#     "float": click.FLOAT,
#     "bool": click.BOOL,
#     None: None,
# }

class SerializableType:
    def _serialize(self):
        raise NotImplementedError

    @classmethod
    def _deserialize(cls, value):
        raise NotImplementedError

class ValidatedStringMixin(str, SerializableType):
    ValidationRegex = ''

    @classmethod
    def _deserialize(cls, value: str) -> 'ValidatedStringMixin':
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
    ValidationRegex = r'^[^\d\W]\w*$'

    @classmethod
    def is_valid(cls, value: Any) -> bool:
        if not isinstance(value, str):
            return False

        try:
            cls.validate(value)
        except Exception:
            return False

        return True


class InitTask(BaseTask):
    PROJECT_NAME: str
    PROJECT_CREATED_AT: datetime
    PROJECT_DIR: Path
    globalVals = Globals()

    def copyStarterRepo(self, tgtProjectFolder):
        # print('#####Inside copyStarterRepo####')
        # print(starterProjectFolder)
        # print(tgtProjectFolder)
        shutil.copytree(
            src=starterProjectFolder, dst=tgtProjectFolder, ignore=shutil.ignore_patterns(*IGNORE_FILES), dirs_exist_ok=True
        )

    def createProjectDir(self, projectName: str) -> Path:
        """Create the user's profiles directory if it doesn't already exist."""
        projectName = Path(projectName)
        projectIdFile = f'tips_{projectName}.id'
        workingFolder = Path(os.getcwd())
        # print(f'workingFolder={workingFolder}')
        workingFolderName = Path(os.path.split(workingFolder)[-1])
        # print(f'workingFolderName={workingFolderName}')

        workingSubFolder = Path(os.path.join(workingFolder,projectName))

        """Check if the current working directory is project directory
        i.e. project name matches and identifier file also exists"""
        try:
            if (workingFolderName == projectName) and Path(os.path.join(workingFolder,projectIdFile)).exists():          
                print('Already in Project Working Folder')
                return workingFolder
            # elif not workingSubFolder.exists():
            #     Path.mkdir(workingSubFolder)
            else:
                return workingSubFolder
            
        except Exception as e:
            print(f'Error occured while setting up project folder {e}')
            return None    
    
    def setupConfig(self):
        # print('#############INSIDE setupConfig->')
        configFile = self.globalVals.getConfigFilePath()

        with open(configFile, "w") as cf:
            cf.write(f"""[base]
package_name = "tips"
package_version = "1.0.1"
description = "With TIPS, data engineers can build data pipelines using Standard SQL Views and Tables."

[project]
project_name = "{self.PROJECT_NAME}"
last_initialised_at = {self.PROJECT_CREATED_AT}

""")

            sfAccount = ""
            while not len(sfAccount) > 0:
                if sfAccount:
                    click.echo(sfAccount + " is not a valid account.")
                sfAccount = click.prompt("Enter snowflake account name (https://<this_value>.snowflakecomputing.com)")
                
            cf.write(f'[db_credentials]\n')
            cf.write(f'type = "snowflake"\n')
            cf.write(f'account = "{sfAccount}"\n')

            sfUser = ""
            while not len(sfUser) > 0:
                if sfUser:
                    click.echo(sfUser + " is not a valid user.")
                sfUser = click.prompt("Enter snowflake username (user)")
            cf.write(f'user = "{sfUser}"\n')

            click.echo('[1] password')
            click.echo('[2] externalbrowser')

            sfAuthenticationMethod = 0
            while sfAuthenticationMethod not in ('1','2','3'):
                if sfAuthenticationMethod:
                    click.echo('Enter valid authentication method ([1] password / [2] externalbrowser)')
                sfAuthenticationMethod = click.prompt("Desired authentication type option (enter a number)")

            if sfAuthenticationMethod == '1':
                cf.write(f'authentication_method = "password"\n')
                sfPassword = ""
                while not len(sfPassword) > 0:
                    if sfPassword:
                        click.echo(sfPassword + " is not a valid password.")
                    sfPassword = click.prompt(f"Enter snowflake password for user [{sfUser}]", hide_input=True)
                cf.write(f'password = "{sfPassword}"\n')
            else:
                cf.write(f'authentication_method = "externalbrowser"\n')

            sfRole = ""
            while not len(sfRole) > 0:
                if sfRole:
                    click.echo(sfRole + " is not a valid role.")
                sfRole = click.prompt("Enter snowflake role to use")
            cf.write(f'role = "{sfRole}"\n')

            sfWarehouse = ""
            while not len(sfWarehouse) > 0:
                if sfWarehouse:
                    click.echo(sfWarehouse + " is not a valid warehouse.")
                sfWarehouse = click.prompt("Enter snowflake warehouse to use (warehouse name)")
            cf.write(f'warehouse = "{sfWarehouse}"\n')

            sfDatabase = ""
            while not len(sfDatabase) > 0:
                if sfDatabase:
                    click.echo(sfDatabase + " is not a valid database.")
                sfDatabase = click.prompt("Enter snowflake database to use (when ommited in object definition)")
            cf.write(f'database = "{sfDatabase}"\n')

            sfSchema = ""
            while not len(sfSchema) > 0:
                if sfSchema:
                    click.echo(sfSchema + " is not a valid schema.")
                sfSchema = click.prompt("Enter snowflake schema to use (when ommited in object definition)")
            cf.write(f'schema = "{sfSchema}"\n')

    def createMetaStore(self, dropSchema:bool=False, insertSampleMetaData:bool=False):
        configFile = self.globalVals.getConfigFilePath()
        db = DatabaseConnection(configFile)
        # print(conn)
        # print(self.PROJECT_DIR)

        if dropSchema:
            sqlCommand = 'DROP SCHEMA IF EXISTS TIPS_MD_SCHEMA CASCADE;'
            # metadataSchemaFile = os.path.join(self.PROJECT_DIR,'metadata','schema','TIPS_MD_SCHEMA_DROP.sql')
            # ## Now run schema creation script
            # with open(metadataSchemaFile, "r") as f:
            #     sqlCommand = f.read()
            results = db.executeSQL(sqlCommand=sqlCommand)

        sqlCommand = """CREATE SCHEMA IF NOT EXISTS TIPS_MD_SCHEMA
COMMENT = 'This Schema holds Metadata for TIPS (Transformation In Plain SQL) tool'
;"""
        results = db.executeSQL(sqlCommand=sqlCommand)
        # metadataSchemaFile = os.path.join(self.PROJECT_DIR,'metadata','schema','TIPS_MD_SCHEMA.sql')
        # ## Now run schema creation script
        # with open(metadataSchemaFile, "r") as f:
        #     sqlCommand = f.read()
        #     results = db.executeSQL(sqlCommand=sqlCommand)

        sqlCommand = """CREATE TABLE IF NOT EXISTS TIPS_MD_SCHEMA.PROCESS (
    PROCESS_ID      NUMBER(38,0) IDENTITY NOT NULL,
    PROCESS_CODE    VARCHAR(100) NOT NULL,
    DESCRIPTION     VARCHAR
);"""
        results = db.executeSQL(sqlCommand=sqlCommand)

        sqlCommand = """CREATE TABLE IF NOT EXISTS TIPS_MD_SCHEMA.PROCESS_CMD (
    PROCESS_ID                          NUMBER(38,0) NOT NULL,
    PROCESS_CMD_ID                      NUMBER(38,0) NOT NULL,
    CMD_TYPE                            VARCHAR(20) NOT NULL,
    CMD_SRC                             VARCHAR(1000),
    CMD_TGT                             VARCHAR(1000) NOT NULL,
    CMD_WHERE                           VARCHAR(1000),
    CMD_BINDS                           VARCHAR(1000),
    REFRESH_TYPE                        VARCHAR(10),
    BUSINESS_KEY                        VARCHAR(100),
    ACTIVE                              VARCHAR(1),
    MERGE_ON_FIELDS                     VARCHAR(1000),
    GENERATE_MERGE_MATCHED_CLAUSE       VARCHAR(1),
    GENERATE_MERGE_NON_MATCHED_CLAUSE   VARCHAR(1),
    ADDITIONAL_FIELDS                   VARCHAR(1000),
    TEMP_TABLE                          VARCHAR(1),
    CMD_PIVOT_BY                        VARCHAR,
    CMD_PIVOT_FIELD                     VARCHAR,
    DQ_TYPE                             VARCHAR(100),
    CMD_EXTERNAL_CALL                   VARCHAR(1000)
);"""
        results = db.executeSQL(sqlCommand=sqlCommand)   

        sqlCommand = 'USE SCHEMA TIPS_MD_SCHEMA;'     
        results = db.executeSQL(sqlCommand=sqlCommand)

        for path, subdirs, files in os.walk(os.path.join(self.PROJECT_DIR,'metadata')): 
            files.sort()
            print(path)
            pathEnds = os.path.basename(os.path.normpath(path))
            if (pathEnds != 'sample') or (pathEnds == 'sample' and insertSampleMetaData):
                for fileName in files:
                    if fileName.endswith(".sql"):
                        print(fileName)
                        with open(os.path.join(path,fileName), "r") as f:
                            sqlCommand = ''
                            for line in f:
                                sqlCommand += line
                                if line.strip().startswith(";") or line.strip().endswith(";"):
                                    results = db.executeSQL(sqlCommand=sqlCommand)
                                    sqlCommand = ''
                            # sqlCommands = f.read()
                            # print(sqlCommands)
                            # sqlCommandList = sqlCommands.split(';').trim()
                            # print(sqlCommandList)
                            # results = db.executeSQL(sqlCommand=sqlCommand)

    def run(self):
        """Entry point for the init task."""
        print("Initialising Project...")
        # global_vals = Globals()

        projectName = self.args.project_name
        while not ProjectName.is_valid(projectName):
            if projectName:
                click.echo(projectName + " is not a valid project name.")
            projectName = click.prompt("Enter a name for your project (letters, digits, underscore)")
        
        self.PROJECT_NAME = projectName
        self.PROJECT_CREATED_AT = datetime.now()

        projectDir = self.createProjectDir(self.PROJECT_NAME)
        self.PROJECT_DIR = projectDir

        if projectDir is not None:
            self.globalVals.setProjectDir(projectDir=projectDir)
            self.copyStarterRepo(projectDir)
            os.chdir(projectDir)
            projectIdFile = f'tips_{self.PROJECT_NAME}.id'
            with open(projectIdFile, "w") as f:
                f.write(f'Project {self.PROJECT_NAME} last initialized on {self.PROJECT_CREATED_AT.strftime("%d %b %Y %H:%M:%S")}')

            # Now generate DB Connection information

            # print(f'self.args.skip_connection_setup->{self.args.skip_connection_setup}')
            # print(f'self.args.skip_metadata_setup->{self.args.skip_metadata_setup}')
            # print(f'self.args.force_metadata_refresh->{self.args.force_metadata_refresh}')
            configDir = os.path.join(projectDir,'.tips')
            configFileName = 'config.toml'
            configFilePath = os.path.join(configDir,configFileName)
            self.globalVals.setConfigDir(configDir=configDir)
            self.globalVals.setConfigFilePath(configFilePath=configFilePath)

            if not self.args.skip_connection_setup:
                self.setupConfig()
                        
            # # Now run metadata setup in database
            if not self.args.skip_metadata_setup:
                self.createMetaStore(dropSchema=self.args.force_metadata_refresh,insertSampleMetaData=self.args.insert_sample_metadata)

    def interpret_results(self, results):
        return True