import os
import streamlit.components.v1 as components

# Streamlit modal
from utils.modal import Modal

# Enums
from enums import ExecutionStatus

_RELEASE = False

def _getComponent(key: str, **kwargs):
    _component_func = None
    if not _RELEASE:
        _component_func = components.declare_component(
            f"react_component_{key}",
            url = "http://localhost:3001"
        )
    else:
        parent_dir = os.path.dirname(os.path.abspath(__file__))
        build_dir = os.path.join(parent_dir, "dist")
        _component_func = components.declare_component(
            f"react_component_{key}", 
            path=build_dir
        )
    
    return _component_func(key = key, **kwargs)

def processesTable(key: str, processData: list, instructions = {}):
    return _getComponent(
        key = key,
        processData = processData,
        component = 'ProcessTable',
        instructions = instructions
    )

def commandModal(key: str, operationType: str, process: dict, command: dict, instructions: dict):
    modal = Modal(title="Edit Comand Modal", key="editCommandModal")
    with modal.container():
        return _getComponent(
            key = key,
            component = 'CommandModal',
            commandData = {
                'operation': {
                    'type': operationType # 'create' or 'edit'
                },
                'process': process,
                'command': command,
                'executionStatus': {
                    'status': ExecutionStatus.NONE
                }
            },
            instructions = instructions
        )