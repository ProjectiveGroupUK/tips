from pathlib import Path
import os
import snowflake.connector
from snowflake.connector import DictCursor
from snowflake.snowpark import Session
import toml
from tips.utils.utils import Globals
# Below is to initialise logging
import logging
from tips.utils.logger import Logger
logger = logging.getLogger(Logger.getRootLoggerName())

logging.getLogger('snowflake.connector').setLevel(logging.ERROR)

class DatabaseConnection():

    _sfUser: str
    _sfPassword: str
    _sfAccount: str
    _sfWarehouse: str
    _sfDatabase: str
    _sfSchema: str
    _sfRole: str
    _sfAuthenticator: str
    _sfConnection: snowflake.connector.SnowflakeConnection = None
    _sfSession: Session

    def __new__(cls, *args, **kwargs):
        if not hasattr(cls, 'instance') or not cls.instance:
            cls.instance = super().__new__(cls)          

            logger.debug('New Instance of DatabaseConnection Class created')

            configFile = os.path.join(os.path.expanduser("~"), ".tips",f"config.toml")
            config = toml.load(configFile)
            if config is None or len(config) <= 0:
                raise ValueError('Config file with connection details not found. Please run command "tips setup" to setup connections file!!')

            globals = Globals()
            projectID = globals.getProjectID()

            dbCredentials = config[projectID]

            if dbCredentials is None or len(dbCredentials) <= 0:
                raise ValueError('DB Credentials not found in Config file. Please run command "tips setup" to setup connections file!!')

            cls._sfAccount = dbCredentials.get('account')
            cls._sfUser = dbCredentials.get('user')
            cls._sfRole = dbCredentials.get('role')
            cls._sfPassword = dbCredentials.get('password')
            cls._sfDatabase = dbCredentials.get('database')
            cls._sfWarehouse = dbCredentials.get('warehouse')
            cls._sfSchema = dbCredentials.get('schema')
            cls._sfAuthenticator = dbCredentials.get('authentication_method')

            try:
                if cls._sfConnection is None:
                    if cls._sfAuthenticator == "password":                    
                        cls._sfConnection = snowflake.connector.connect(
                            user=cls._sfUser,
                            password=cls._sfPassword,
                            account=cls._sfAccount,
                            warehouse=cls._sfWarehouse,
                            database=cls._sfDatabase,
                            schema=cls._sfSchema,
                            role=cls._sfRole
                            )
                        
                        ## Also create a snowpark session from already established connection
                        cls._sfSession = Session.builder.configs({"connection": cls._sfConnection}).create()
                        
                    else:
                        cls._sfConnection = snowflake.connector.connect(
                            user=cls._sfUser,
                            authenticator=cls._sfAuthenticator,
                            account=cls._sfAccount,
                            warehouse=cls._sfWarehouse,
                            database=cls._sfDatabase,
                            schema=cls._sfSchema,
                            role=cls._sfRole
                            )
                        ## Also create a snowpark session from already established connection
                        cls._sfSession = Session.builder.configs({"connection": cls._sfConnection}).create()
                        
                    logger.info('Connected to SF Database!!')
                
            except:
                logger.error(f"Error (Connect): Couldn't connect to SF Database")
                raise

        return cls.instance

    def getSession(self):
        return self._sfSession

    def getConnection(self):
        return self._sfConnection

    def getDatabase(self):
        if self._sfDatabase is not None:
            return self._sfDatabase.upper()
        return self._sfDatabase

    def executeSQL(self, sqlCommand:str):
        conn = self._sfConnection

        try:
            results = conn.cursor(DictCursor).execute(sqlCommand).fetchall() 
            if type(results) == list and len(results) > 0:

                for val in results:
                    if "number of rows deleted" in val:
                        logger.info(f'(Execute SQL): Rows Deletes = {val["number of rows deleted"]}')
                        # sqlJson["cmd_status"]["ROWS_DELETED"] = val["number of rows deleted"]

                    if "number of rows inserted" in val:
                        logger.info(f'(Execute SQL): Rows Inserted = {val["number of rows inserted"]}')

                    if "number of rows updated" in val:
                        logger.info(f'(Execute SQL): Rows Updated = {val["number of rows updated"]}')

                    if "rows_loaded" in val:
                        logger.info(f'(Execute SQL): Rows Loaded = {val["rows_loaded"]}')

                    if "rows_unloaded" in val:
                        logger.info(f'(Execute SQL): Rows Unloaded = {val["rows_unloaded"]}')

                    if "status" in val:
                        logger.info(f'(Execute SQL): Status = {val["status"]}')

            return results
        except:
            logger.error(f"Error (Execute SQL): While executing SQL")
            raise

    def executeSQLFile(self, sqlFile:Path):
        conn = self._sfConnection

        try:
            with open(sqlFile,'r') as f:
                for cur in conn.execute_stream(f):
                    for ret in cur:
                        logger.info(f'(Execute SQLFile):  {sqlFile}\nRows affected = {ret[0]}')
        except:
            logger.error(f"Error (Execute SQLFile): {sqlFile}")
            raise

    def executeSQLReturnQID(self, sqlCommand:str):
        conn = self._sfConnection

        try:
            qid = conn.cursor(DictCursor).execute(sqlCommand).sfqid
            return qid
        except:
            logger.error(f"Error (Execute SQL): While executing SQL")
            raise

    def closeConnection(self):
        try:
            self._sfConnection.close()
            logger.info('Closed connection to SF Database!!')
        except:
            logger.error(f"Error: Couldn't close connecttion to SF Database")
            raise