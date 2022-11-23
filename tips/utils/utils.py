from pathlib import Path
import os
from enum import Enum


class ExitCodes(int, Enum):
    Success = 0
    ModelError = 1
    UnhandledError = 2


class Globals:
    _instance = None
    _projectDir: Path
    _projectID: str

    """
    This is singleton class, hence on instantiation, it returns the same instance
    if already instantiated, otherwise creates a new instance.
    This is to enable reusing setter and getter methods across the project
    """

    def __new__(self):
        if self._instance is None:
            self._instance = super(Globals, self).__new__(self)
            # Put any initialization here.
            self._projectDir = None
            self._projectID = None
        return self._instance

    def setProjectID(self, projectID: str) -> None:
        self._projectID = projectID

    def getProjectID(self) -> str:
        return self._projectID

    def setProjectDir(self, projectDir: Path) -> None:
        self._projectDir = projectDir

    def getProjectDir(self) -> Path:
        return Path(self._projectDir)

    def getConfigDir(self) -> Path:
        return Path(os.path.join(Path.home(), ".tips"))

    def getConfigFilePath(self) -> Path:
        return Path(os.path.join(self.getConfigDir(), "config.toml"))
