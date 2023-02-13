import os
import streamlit.components.v1 as components

_RELEASE = False

if not _RELEASE:
    _component_func = components.declare_component(
        "react_component",
        url = "http://localhost:3001",
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "dist")
    _component_func = components.declare_component("react_component", path=build_dir)

def processesTable(key: str, data: list):
    return _component_func(
        key = key,
        data = data,
        component = 'processTable'
    )