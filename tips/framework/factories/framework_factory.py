from tips.framework.runners.sql_framework_metadata_runner import SQLFrameworkMetaDataRunner


class FrameworkFactory():

    def getProcess(self, processName:str, logger):
        return SQLFrameworkMetaDataRunner(processName=processName, logger=logger)
