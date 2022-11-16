import abc
from typing import List, Dict
from tips.framework.db.database_connection import DatabaseConnection


class FrameworkMetaData(abc.ABC):

    @abc.abstractclassmethod
    def getMetaData(self, conn: DatabaseConnection) -> List[Dict]:
        pass