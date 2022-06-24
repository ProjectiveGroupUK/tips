import abc
from typing import Dict, List

from db.database_connection import DatabaseConnection
from actions.action import Action

class Runner(abc.ABC):

    @abc.abstractclassmethod
    def execute(action: Action, conn: DatabaseConnection, frameworkRunner):
        pass