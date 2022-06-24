from pathlib import Path
import snowflake.connector
from snowflake.connector import DictCursor
import os
# from dotenv import load_dotenv
import toml

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

    def __new__(cls, *args, **kwargs):
        if not hasattr(cls, 'instance') or not cls.instance:
          cls.instance = super().__new__(cls)
        return cls.instance

    def __init__(self, configFile:Path) -> None:

        
        config = toml.load(configFile)

        if config is None or len(config) <= 0:
            raise ValueError('Config file with connection details not found. Please run command [tips init] to setup connections file!!')

        dbCredentials = config['db_credentials']

        if dbCredentials is None or len(dbCredentials) <= 0:
            raise ValueError('DB Credentials not found in Config file. Please run command [tips init] to setup connections file!!')

        self._sfAccount = dbCredentials['account']
        self._sfUser = dbCredentials['user']
        self._sfRole = dbCredentials['role']
        self._sfPassword = dbCredentials['password']
        self._sfDatabase = dbCredentials['database']
        self._sfWarehouse = dbCredentials['warehouse']
        self._sfSchema = dbCredentials['schema']
        self._sfAuthenticator = dbCredentials['authentication_method']

        try:
            if self._sfConnection is None:
                if self._sfAuthenticator == "password":                    
                    self._sfConnection = snowflake.connector.connect(
                        user=self._sfUser,
                        password=self._sfPassword,
                        account=self._sfAccount,
                        warehouse=self._sfWarehouse,
                        database=self._sfDatabase,
                        schema=self._sfSchema,
                        role=self._sfRole
                        )
                else:
                    self._sfConnection = snowflake.connector.connect(
                        user=self._sfUser,
                        authenticator=self._sfAuthenticator,
                        account=self._sfAccount,
                        warehouse=self._sfWarehouse,
                        database=self._sfDatabase,
                        schema=self._sfSchema,
                        role=self._sfRole
                        )
                    
                # print('Connected to SF Database!!')
                print('Info (Connect): Connected to SF Database!!')
            
            # return self._sfConnection

        except Exception as ex:
            err = f"Error (Connect): Couldn't connect to SF Database. {ex}"
            print(err)
            raise Exception(err)

    def getConnection(self):
        return self._sfConnection

    def executeSQL(self, sqlCommand:str):
        conn = self._sfConnection

        try:
            results = conn.cursor(DictCursor).execute(sqlCommand).fetchall() 
            if type(results) == list and len(results) > 0:
                # print(results)

                for val in results:
                    if "number of rows deleted" in val:
                        print(f'Info (Execute SQL): Rows Deletes = {val["number of rows deleted"]}')
                        # sqlJson["cmd_status"]["ROWS_DELETED"] = val["number of rows deleted"]

                    if "number of rows inserted" in val:
                        print(f'Info (Execute SQL): Rows Inserted = {val["number of rows inserted"]}')

                    if "number of rows updated" in val:
                        print(f'Info (Execute SQL): Rows Updated = {val["number of rows updated"]}')

                    if "rows_loaded" in val:
                        print(f'Info (Execute SQL): Rows Loaded = {val["rows_loaded"]}')

                    if "rows_unloaded" in val:
                        print(f'Info (Execute SQL): Rows Unloaded = {val["rows_unloaded"]}')

                    if "status" in val:
                        print(f'Info (Execute SQL): Status = {val["status"]}')

            return results
        except Exception as ex:
            err = f"Error (Execute SQL): While executing SQL {ex}"
            print(err)
            raise Exception(err)

    def closeConnection(self):
        try:
            self.conn.close()
            self.logger.info('Closed connection to SF Database!!')
        except Exception as ex:
            err = f"Error: Couldn't close connecttion to SF Database. {ex}"
            self.logger.error(err)
            raise Exception(err)

