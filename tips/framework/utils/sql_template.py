from jinja2 import Environment, FileSystemLoader
from pathlib import Path
import os
from typing import Dict
import re


class SQLTemplate:

    _templatePath = os.path.join(
        os.path.dirname(os.path.dirname(os.path.realpath(__file__))), "templates"
    )

    def getTemplate(self, sqlAction: str, parameters: Dict) -> str:
        templateName = f"{sqlAction.lower().strip()}.j2"
        templateEnv = Environment(
            loader=FileSystemLoader(self._templatePath), trim_blocks=True
        )
        cmd = (
            templateEnv.get_template(templateName)
            .render(parameters=parameters)
            .strip()
            .replace("\n", " ")
        )
        return re.sub("  +", " ", cmd)
