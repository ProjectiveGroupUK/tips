# Python
import datetime
from contextlib import contextmanager

# Streamlit
import streamlit as st
from streamlit_elements import elements, mui, html, dashboard

# Pandas
import pandas as pd

# TIPS
from tips.framework.db.database_connection import DatabaseConnection
from utils.navigation import deletePage

# Enums
from enums import StateVariable, EntryPoint

DG_COLUMNS = [
    {
        "field": "id",
        "headerName": "ID",
        "type": "number",
        "width": 80,
    },
    {
        "field": "start_time",
        "headerName": "Start Time",
        "width": 200,
        "editable": False,
    },
    {
        "field": "end_time",
        "headerName": "End Time",
        "width": 200,
        "editable": False,
    },
    {
        "field": "elapsed_time",
        "headerName": "Elapsed Time (in Secs)",
        "width": 200,
        "editable": False,
    },
    {
        "field": "status",
        "headerName": "Status",
        "width": 150,
        "editable": False,
    },
    {
        "field": "error",
        "headerName": "Error",
        "width": 500,
        "editable": False,
    },
]


logJSON:dict = {}
if StateVariable.DISPLAY_JSON not in st.session_state:
    st.session_state.display_json = logJSON

if StateVariable.PROCESS_LOG_RESULT_1 not in st.session_state:
    st.session_state.process_log_result1 = []

if StateVariable.PROCESS_LOG_RESULT_2 not in st.session_state:
    st.session_state.process_log_result2 = []

if StateVariable.FETCH_BUTTON_CLICKED not in st.session_state:
    st.session_state.fetchButtonClicked = False

@contextmanager
def title_bar(padding="5px 15px 5px 15px", dark_switcher=True):
    with mui.Stack(
        # className=self._draggable_class,
        alignItems="center",
        direction="row",
        spacing=1,
        sx={
            "padding": padding,
            "borderBottom": 1,
            "borderColor": "divider",
        },
    ):
        yield

def _setUpPageLayout():
    st.set_page_config(
        page_title="TIPS",
        page_icon="✨",
        layout="wide"
    ) 

    deletePage('home') # Hide homepage from navigation panel

def _fetchButtonClicked():
    st.session_state[StateVariable.DISPLAY_JSON] = logJSON
    st.session_state[StateVariable.PROCESS_LOG_RESULT_2] = []
    st.session_state[StateVariable.FETCH_BUTTON_CLICKED] = True

def _handleSelectChange():
    st.session_state[StateVariable.DISPLAY_JSON] = logJSON
    st.session_state[StateVariable.PROCESS_LOG_RESULT_2] = []
    st.session_state[StateVariable.FETCH_BUTTON_CLICKED] = False

def _handleRowClick(params):
    # st.info(params)
    logID = params["row"]["id"]

    db = DatabaseConnection()
    cmdStr: str = f'SELECT log_json as "log_json" FROM process_log WHERE process_log_id = {logID}'
    with st.spinner("Fetching process names from DB..."):
        results = db.executeSQL(sqlCommand=cmdStr)
        if len(results) > 0:
            # global logJSON
            st.session_state[StateVariable.DISPLAY_JSON] = results[0]['log_json']

def main():

    _setUpPageLayout()

    # Initialize 'display_table' to False (if needed)

    st.caption("Home > :blue[Logs]")

    db = DatabaseConnection()

    cmdStr: str = "SELECT DISTINCT process_name FROM process_log ORDER BY 1"

    with st.spinner("Fetching process names from DB..."):
        result = db.executeSQL(sqlCommand=cmdStr)

    if len(result) > 0:
        result.insert(0, {"PROCESS_NAME": ""})
        df = pd.DataFrame(result)
        col1, col2, col3, col4, col5 = st.columns([2, 1, 1, 1, 1])
        option = ""
        with col1:
            option = st.selectbox("Select Process Name:", df, on_change=_handleSelectChange)

        if option != "" and option is not None:
            fromDate = col2.date_input("Date From:", datetime.date.today())
            fromTime = col3.time_input("Time From", datetime.time(0, 0))

            toDate = col4.date_input("Date To:", datetime.date.today())
            toTime = col5.time_input("Time To", datetime.time(23, 59))
            st.button("Fetch Logs", on_click=_fetchButtonClicked, key='fetch_button')
            if st.session_state[StateVariable.FETCH_BUTTON_CLICKED]:

                cmdStr: str = f"""
                SELECT process_log_id as "id", to_varchar(process_start_time,'DD/MM/YYYY HH24:MI:SS') as "start_time", to_varchar(process_end_time,'DD/MM/YYYY HH24:MI:SS') as "end_time", process_elapsed_time_in_seconds as "elapsed_time", execute_flag as "execute_flag", status as "status", error_message as "error" 
                FROM process_log 
                WHERE process_name = '{option}'
                AND process_start_time BETWEEN '{fromDate} {fromTime}' AND '{toDate} {toTime}'
                ORDER BY process_start_time DESC
                """
                st.session_state[StateVariable.PROCESS_LOG_RESULT_2] = db.executeSQL(sqlCommand=cmdStr)

            if len(st.session_state[StateVariable.PROCESS_LOG_RESULT_2]) > 0:
                with elements("process_log_dashboard"):
                    layout = [
                        # Parameters: element_identifier, x_pos, y_pos, width, height, [item properties...]
                        dashboard.Item(
                            "process_log_table",
                            0,
                            0,
                            12,
                            2,
                            isDraggable=False,
                            moved=False,
                        ),
                    ]
                    with dashboard.Grid(layout):
                        with mui.Paper(
                            key="process_log_table",
                            sx={
                                "display": "flex",
                                "flexDirection": "column",
                                "borderRadius": 2,
                                "overflow": "hidden",
                            },
                            elevation=1,
                        ):
                            with title_bar(padding="10px 15px 10px 15px", dark_switcher=False):
                                mui.icon.ViewCompact()
                                mui.Typography(f"Process Logs ({option})")

                            with mui.Box(sx={"flex": 1, "minHeight": 0}):
                                mui.DataGrid(
                                    columns=DG_COLUMNS,
                                    rows=st.session_state[StateVariable.PROCESS_LOG_RESULT_2],
                                    pageSize=10,
                                    rowsPerPageOptions=[10],
                                    disableSelectionOnClick=False,
                                    autoHeight=True,
                                    onRowClick=_handleRowClick,
                                )
                if len(st.session_state[StateVariable.DISPLAY_JSON]) > 0: ## != {}:
                    st.json(st.session_state[StateVariable.DISPLAY_JSON])
                else:
                    st.subheader("Select row in Process Log Table to display Log JSON")

    else:
        st.subheader(":red[No Rows returned...]")



if __name__ == "__main__":
    main()
