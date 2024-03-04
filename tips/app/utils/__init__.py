import os
import streamlit.components.v1 as components

# Streamlit modal
from utils.modal import Modal

_RELEASE = False

def _getComponent(key: str, **kwargs):
    _component_func = None
    if not _RELEASE:
        _component_func = components.declare_component(
            f"react_component_{key}",
            url = "http://localhost:3001"
        )
    else:
        ## C:\GitHub\tips\tips\app
        parent_dir = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
        build_dir = os.path.join(parent_dir, "frontend")
        _component_func = components.declare_component(
            "tips-ui-reaction-component",
            # f"react_component_{key}", 
            path=build_dir
        )
    
    return _component_func(key = key, **kwargs)

def processesTable(key: str, processData: list, instructions: dict):
    return _getComponent(
        key = key,
        component = 'ProcessTable',
        processData = processData,
        instructions = instructions
    )

def processModal(key: str, operationType: str, process: dict, instructions: dict):
    modal = Modal(title="Edit Process Modal", key="editProcessModal")
    with modal.container():
        return _getComponent(
            key = key,
            component = 'ProcessModal',
            process = {
                'operation': {
                    'type': operationType # // From OperationType enum
                },
                'process': process
            },
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
                    'type': operationType # // From OperationType enum
                },
                'process': process,
                'command': command
            },
            instructions = instructions
        )
    
def dqTable(key: str, dqdata: list, instructions: dict):
    return _getComponent(
        key = key,
        component = 'DQTable',
        dqdata = dqdata,
        instructions = instructions
    )

def dqModal(key: str, operationType: str, dqdata: dict, instructions: dict):
    # modal = Modal(title="Edit Process Modal", key="editProcessModal")
    modal = Modal(title="Edit DQ Test Modal", key="editDQTestModal")
    with modal.container():
        return _getComponent(
            key = key,
            component = 'DQModal',
            dqdata = {
                'operation': {
                    'type': operationType # // From OperationType enum
                },
                'dqdata': dqdata
            },
            instructions = instructions
        )

def dqTargetModal(key: str, operationType: str, dqdata: dict, dqtarget: dict, instructions: dict):
    # modal = Modal(title="Edit Comand Modal", key="editCommandModal")
    modal = Modal(title="Edit DQ Test Target Modal", key="editDQTargetModal")
    with modal.container():
        return _getComponent(
            key = key,
            component = 'DQTargetModal',
            dqtargetdata = {
                'operation': {
                    'type': operationType # // From OperationType enum
                },
                'dqdata': dqdata,
                'dqtarget': dqtarget
            },
            instructions = instructions
        )
