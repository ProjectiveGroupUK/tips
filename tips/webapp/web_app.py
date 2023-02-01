from flask import Flask  # Import flask
from flask_restful import Api, Resource
from flask_cors import CORS
import threading, webbrowser, sys, click
import os
import logging
from tips.utils.logger import Logger
from tips.utils.utils import Globals
from tips.framework.db.database_connection import DatabaseConnection
from tips.framework.utils.sql_template import SQLTemplate

logger = logging.getLogger(Logger.getRootLoggerName())
globals = Globals()


class DBOperations(Resource):
    def get(self, id: int):
        if id == 10:
            db = DatabaseConnection()

            cmdStr: str = SQLTemplate().getTemplate(
                sqlAction="framework_metadata",
                parameters={"process_name": "ALL"},
            )
            results = db.executeSQL(sqlCommand=cmdStr)

            newList = []
            if len(results) > 0:
                prevVal = ""
                for row in results:
                    processID = row["PROCESS_ID"]
                    processName = row["PROCESS_NAME"]
                    processDescription = row["PROCESS_DESCRIPTION"]
                    processStatus = "active"
                    if processName != prevVal:
                        newList.append(
                            {
                                "id": processID,
                                "name": processName,
                                "description": processDescription,
                                "steps": [row],
                                "status": processStatus,
                            }
                        )
                    else:
                        newList[len(newList) - 1]["steps"].append(row)

                    prevVal = processName

            return newList
        else:
            return {"Error": "Invalid Request"}


class WebApp:
    def startServer(self, port=None):
        cli = sys.modules["flask.cli"]
        # put your own message here
        cli.show_server_banner = lambda *x: click.echo("TIPS Web Server version 1.0")

        app = Flask(
            __name__, static_url_path=""
        )  # Setup the flask app by creating an instance of Flask

        CORS(app)
        cors = CORS(app, resources={r"/*": {"origins": "*"}})
        api = Api(app)

        @app.route(
            "/"
        )  # When someone goes to / on the server, execute the following function
        def home():
            return app.send_static_file("index.html")

        api.add_resource(DBOperations, "/dbo/<int:id>")

        if port is None:
            hostPort = 5080  ##+ random.randint(0, 99)
        else:
            hostPort = port
        url = "http://127.0.0.1:{0}".format(hostPort)

        threading.Timer(1.25, lambda: webbrowser.open(url)).start()

        app.run(port=hostPort, debug=False)


if __name__ == "__main__":
    globals.setEnvName(os.environ.get("env", "debug"))
    logger = Logger().initialize()
    webApp = WebApp()
    ret = webApp.startServer()
