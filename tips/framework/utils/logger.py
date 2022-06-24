from typing import Dict
import yaml
import logging.config
import os, datetime
from slack_logger import SlackHandler, SlackFormatter
import configparser
from dotenv import load_dotenv
import json

class Logger():
    _logDir: str
    _logger: str

    def __init__(self) -> None:
        load_dotenv()
        self._logger = logging.Logger.root
        self._logDir = os.getcwd()

    def setupLogger(self):
        config = configparser.ConfigParser()
        config.read(os.path.join(os.getcwd(),'config','config.ini'))
        path = os.path.join(os.getcwd(),'config','logger_config.yml')
        with open(path, 'rt') as f:
            log_config = yaml.safe_load(f.read())
        
        ##If LOGS_TO_FILE parameter is set to Y, then only create logs\<subfolders> and write logging to files, otherwise just output logging on console
        if (config['logger']['logToFile'].upper() == 'Y'):
            subfldrts = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
            self._logDir = os.path.join(os.getcwd(),'logs',subfldrts)
            os.makedirs(self._logDir)


            log_config['handlers']['info_file_handler']['filename'] = os.path.join(self._logDir,log_config['handlers']['info_file_handler']['filename'])
            log_config['handlers']['error_file_handler']['filename'] = os.path.join(self._logDir,log_config['handlers']['error_file_handler']['filename'])
        
            log_config['root']['handlers'].append('info_file_handler')
            log_config['root']['handlers'].append('error_file_handler')

        logging.config.dictConfig(log_config)
        
        ## Set logger for snowflake connector warnings and higher
        logging.getLogger('snowflake.connector').setLevel(logging.WARNING)

        self._logger = logging.getLogger(config['logger']['loggerName'])

        ## Check slack flag, and if yes than post logging messages to slack
        if (config['slack']['logToSlack'].upper() == 'Y'):
            sh = SlackHandler(url=os.getenv('SLACK_URL'))
            sh.setLevel(logging.INFO)
            f = SlackFormatter()
            sh.setFormatter(f)
            self._logger.addHandler(sh)


        return self._logger

    def writeResultJson(self, resultJson: Dict) -> None:
        self._logger.info('Writing log output to file...')

        out_filename = os.path.join(self._logDir,'result.json')

        with open(out_filename, 'w') as outfile:
            json.dump(resultJson, outfile, indent=4)

        self._logger.info('Output written to file!!')

