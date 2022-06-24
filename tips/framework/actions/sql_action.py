from typing import Dict, List
from actions.action import Action
import abc


class SqlAction(Action):

    @abc.abstractclassmethod
    def getCommands() -> List[object]:
        pass

    @abc.abstractclassmethod
    def getBinds() -> List[str]:
        pass
      