import streamlit as st
import logging
# from streamlit_agraph import agraph, Node, Edge, Config
from tips.utils.logger import Logger
from tips.utils.utils import Globals
from tips.app import components
from tips.app.utils.page import page_group

logger = logging.getLogger(Logger.getRootLoggerName())
globals = Globals()
# Initialise globals
globals.initGlobals()

if 'entryPoint' not in st.session_state:
    st.session_state['entryPoint'] = 'ProcessList'

def setupApp():
    st.set_page_config(
        page_title="TIPS",
        page_icon="✨",
        layout="wide",
        initial_sidebar_state="expanded",
    )    

def main():
    setupApp()

    page = page_group("p")

    with st.sidebar:
        st.title("✨ TIPS")

        # with st.expander("✨ APPS", True):
        #     page.item("Streamlit gallery", apps.gallery, default=True)

        with st.expander("📑 **Pages**", True):
            page.item("🎡 **Processes**", components.process, default=True)
            page.item("📝 **Logs**", components.log)

    page.show()
    
if __name__ == "__main__":
    main()

