import os
import subprocess
import logging
from tips.utils.logger import Logger
from tips.utils.utils import Globals

logger = logging.getLogger(Logger.getRootLoggerName())
globals = Globals()

class AppUtil:

    def runOsCommand(self, commandList: list):
        cmd = commandList
        # try:
        pro = subprocess.Popen(cmd, stdout=subprocess.PIPE)
        for line in pro.stdout:
            logger.info(line.decode("utf-8").strip().replace("Streamlit, ","").replace("Streamlit ","").replace("your ",""))

    def checkStreamlitVersion(self) -> int:
        cmd = ["streamlit", "--version"]
        try:
            self.runOsCommand(commandList=cmd)
            return 0
        except FileNotFoundError:
            logger.error(
                "There seems to be some issue with package installation, please re-install TiPS. If issue persists, log an issue on TiPS Git Repo!"
            )
            return 1
        except KeyboardInterrupt:
            logger.error("Process terminated by user")
            return 1
        except Exception as e:
            logger.error(f"Error Encountered {e}")

    def startServer(self, port=None):
        homeFilePath = os.path.join(os.path.dirname(__file__),'01_Processes.py')
        if port is None:
            cmd = ["streamlit", "run", homeFilePath]
        else:
            cmd = ["streamlit", "run", homeFilePath, "--server.port", port]
        try:
            self.runOsCommand(commandList=cmd)
            return 0
        except FileNotFoundError:
            logger.error(
                "There seems to be some issue with package installation, please re-install TiPS. If issue persists, log an issue on TiPS Git Repo!"
            )
            return 1
        except KeyboardInterrupt:
            logger.error("Process terminated by user")
            return 1
        except Exception as e:
            logger.error(f"Error Encountered {e}")

if __name__ == "__main__":
    globals.setEnvName(os.environ.get("env", "debug"))
    ##logger = Logger().initialize()
    appUtil = AppUtil()
    ret = appUtil.checkStreamlitVersion()
    ret = appUtil.startServer()
