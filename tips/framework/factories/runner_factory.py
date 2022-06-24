from actions.action import Action
from runners.sql_runner import SQLRunner


class RunnerFactory():

    def getRunner(self, action: Action):
        return SQLRunner()
