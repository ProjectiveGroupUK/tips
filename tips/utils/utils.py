from pathlib import Path
import os
import toml
from enum import Enum


class ExitCodes(int, Enum):
    Success = 0
    ModelError = 1
    UnhandledError = 2


class Globals:
    _instance = None
    _projectDir: Path
    _projectID: str
    _projectName: str
    _envName: str

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
            self._projectName = None
            self._envName = None
        return self._instance

    def setEnvName(self, envName: str) -> None:
        self._envName = envName

    def getEnvName(self) -> str:
        return self._envName

    def setProjectName(self, projectName: str) -> None:
        self._projectName = projectName

    def getProjectName(self) -> str:
        return self._projectName

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
    
    def initGlobals(self):
        # Initialise globals
        projectIdFile = f"tips_project.toml"
        workingFolder = Path.cwd()
        config = toml.load(Path.joinpath(workingFolder, projectIdFile))
        projectID = config.get('project').get('project_id')
        if projectID is None:
            raise Exception('Project config file seems to be corrupted, please run setup again to recreate the file!')

        self.setProjectDir(Path.cwd())
        self.setProjectID(projectID=projectID)

def escapeValuesForSQL(dataDict: dict, fieldsToSkip: list = []) -> dict: # Python 3.9+ parameter types: dataDict: dict[str, int | str | None], fieldsToSkip: list[str]
    formattedUpdates = {}
    for update in dataDict.keys():
        if update in fieldsToSkip:
            formattedUpdates[update] = dataDict[update]
            continue

        if isinstance(dataDict[update], int) or isinstance(dataDict[update], bool):
            formattedUpdates[update] = dataDict[update]
        elif dataDict[update] == None:
            formattedUpdates[update] = 'null'
        elif isinstance(dataDict[update], str):
            escapedValue = dataDict[update].replace("'", "''")
            formattedUpdates[update] = f"'{escapedValue}'"
        else:
            raise Exception(f'Unexpected type for update value: {type(dataDict[update])}')
    
    return formattedUpdates

