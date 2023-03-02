import streamlit as st
from streamlit_elements import elements, mui, html, dashboard
from tips.framework.db.database_connection import DatabaseConnection
from tips.framework.utils.sql_template import SQLTemplate
from contextlib import contextmanager
from tips.app.components.process.steps_graph import StepsGraph

DG_COLUMNS = [
    {
        "field": "id",
        "headerName": "ID",
        "type": "number",
        "width": 30,
    },
    {
        "field": "name",
        "headerName": "Process Name",
        "width": 300,
        "editable": False,
    },
    {
        "field": "description",
        "headerName": "Description",
        "width": 300,
        "editable": False,
    },
    {
        "field": "status",
        "headerName": "Status",
        "width": 100,
        "editable": False,
    },
]

STEPS_DG_COLUMNS = [
    {
        "field": "id",
        "headerName": "ID",
        "type": "number",
        "width": 30,
    },
    {
        "field": "cmd_type",
        "headerName": "Type",
        "width": 100,
        "editable": False,
    },
    {
        "field": "source",
        "headerName": "Source",
        "width": 300,
        "editable": False,
    },
    {
        "field": "target",
        "headerName": "Target",
        "width": 300,
        "editable": False,
    },
    {
        "field": "active",
        "headerName": "Active",
        "width": 100,
        "editable": False,
    },
]

selectProcessName = ""
selectedRowSteps = []
selectRowButtonDisabled = True
selectStepRowButtonDisabled = True
selectedStepsRow= []


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


def _handle_edit(params):
    st.info(params)


def _handleRowClick(params):
    global selectProcessName
    selectProcessName = params['row']['name']
    global selectedRowSteps
    selectedRowSteps = []
    for row in params["row"]["steps"]:
        selectedRowSteps.append(
            {
                "id": row["PROCESS_CMD_ID"],
                "cmd_type": row["CMD_TYPE"],
                "source": row["CMD_SRC"],
                "target": row["CMD_TGT"],
                "active": row["ACTIVE"],
            }
        )

    global selectRowButtonDisabled
    selectRowButtonDisabled = False

def _handleStepRowClick(params):
    global selectedStepsRow
    # st.info(params)
    # selectedStepsRow = []
    # for row in params["row"]["steps"]:
    #     selectedRowSteps.append(
    #         {
    #             "id": row["PROCESS_CMD_ID"],
    #             "cmd_type": row["CMD_TYPE"],
    #             "source": row["CMD_SRC"],
    #             "target": row["CMD_TGT"],
    #             "active": row["ACTIVE"],
    #         }
    #     )

    global selectStepRowButtonDisabled
    selectStepRowButtonDisabled = False

def _handleAddButtonClick(params):
    st.info(f"Add Button Clicked: {params}")


def _handleEditButtonClick(params):
    st.info(f"Edit Button Clicked: {params}")


def _handleDeleteButtonClick(params):
    st.info(f"Delete Button Clicked: {params}")


def _handleStepsButtonClick(params):
    stepGraph = StepsGraph()
    stepGraph.modalWindow(selectProcessName=selectProcessName,selectedRowSteps=selectedRowSteps)
    # st.info(f"Steps Button Clicked: {params}")


def main():

    # with elements("button1"):

    #     mui.Button(
    #         mui.icon.Add,
    #         "Add Process",
    #         variant="contained",
    #         color="primary",
    #         sx={"ml": 1},
    #         onClick=_handleAddButtonClick,
    #     )
    st.caption('Home > :blue[Process]')
    db = DatabaseConnection()

    cmdStr: str = SQLTemplate().getTemplate(
        sqlAction="framework_metadata",
        parameters={"process_name": "ALL"},
    )

    with st.spinner("Fetching Metadata from DB..."):
        results = db.executeSQL(sqlCommand=cmdStr)

        newList = []
        if len(results) > 0:
            prevVal = ""
            for row in results:
                processID = row["PROCESS_ID"]
                processName = row["PROCESS_NAME"]
                processDescription = row["PROCESS_DESCRIPTION"]
                processStatus = "Active"
                if processName != prevVal:
                    newList.append(
                        {
                            "id": processID,
                            "name": processName,
                            "description": processDescription,
                            "steps": [row],
                            "status": processStatus,
                        }
                    )
                else:
                    newList[len(newList) - 1]["steps"].append(row)

                prevVal = processName

        with elements("process_dashboard"):

            layout = [
                # Parameters: element_identifier, x_pos, y_pos, width, height, [item properties...]
                dashboard.Item(
                    "process_dg_table", 0, 0, 12, 2, isDraggable=False, moved=False
                ),
            ]

            with dashboard.Grid(layout):
                with mui.Paper(
                    key="process_dg_table",
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
                        mui.Typography("Processes")
                        mui.Button(
                            mui.icon.Add,
                            # "Add Process",
                            variant="contained",
                            color="primary",
                            sx={"ml": 1},
                            onClick=_handleAddButtonClick,
                        )
                        mui.Button(
                            mui.icon.Edit,
                            # "Edit",
                            variant="contained",
                            color="primary",
                            sx={"ml": 1},
                            disabled=selectRowButtonDisabled,
                            onClick=_handleEditButtonClick,
                        )
                        mui.Button(
                            mui.icon.Delete,
                            # "Delete",
                            variant="contained",
                            color="primary",
                            sx={"ml": 1},
                            disabled=selectRowButtonDisabled,
                            onClick=_handleDeleteButtonClick,
                        )
                        mui.Button(
                            mui.icon.Insights,
                            # "Steps Graph",
                            variant="contained",
                            color="primary",
                            sx={"ml": 1},
                            disabled=selectRowButtonDisabled,
                            onClick=_handleStepsButtonClick,
                        )

                    with mui.Box(sx={"flex": 1, "minHeight": 0}):
                        mui.DataGrid(
                            columns=DG_COLUMNS,
                            rows=newList,
                            pageSize=2,
                            rowsPerPageOptions=[2],
                            # checkboxSelection=True,
                            disableSelectionOnClick=False,
                            autoHeight=True,
                            onRowClick=_handleRowClick,
                            onCellEditCommit=_handle_edit,
                        )

        with elements("process_steps_dashboard"):

            layout = [
                # Parameters: element_identifier, x_pos, y_pos, width, height, [item properties...]
                dashboard.Item(
                    "process_steps_dg_table",
                    0,
                    0,
                    12,
                    3,
                    isDraggable=False,
                    moved=False,
                ),
            ]

            with dashboard.Grid(layout):
                with mui.Paper(
                    key="process_steps_dg_table",
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
                        mui.Typography("Process Steps")
                        mui.Button(
                            mui.icon.Add,
                            # "Add Step",
                            variant="contained",
                            color="primary",
                            sx={"ml": 1},
                            disabled=True if len(selectedRowSteps) <= 0 else False,
                            onClick=_handleStepsButtonClick,
                        )
                        mui.Button(
                            mui.icon.Edit,
                            # "Edit",
                            variant="contained",
                            color="primary",
                            sx={"ml": 1},
                            disabled=selectStepRowButtonDisabled,
                            onClick=_handleEditButtonClick,
                            align="right",
                        )
                        mui.Button(
                            mui.icon.Delete,
                            # "Delete",
                            variant="contained",
                            color="primary",
                            sx={"ml": 1},
                            disabled=selectStepRowButtonDisabled,
                            onClick=_handleDeleteButtonClick,
                        )

                    with mui.Box(sx={"flex": 1, "minHeight": 0}):
                        if len(selectedRowSteps) <= 0:
                            mui.Typography(
                                "Select row in Process Header Table to display detail content",
                                sx={"p": 1},
                                align="center",
                                color="error",
                            )
                        else:
                            mui.DataGrid(
                                columns=STEPS_DG_COLUMNS,
                                rows=selectedRowSteps,
                                pageSize=5,
                                rowsPerPageOptions=[5],
                                # checkboxSelection=True,
                                disableSelectionOnClick=False,
                                autoHeight=True,
                                onRowClick=_handleStepRowClick,
                                # onCellEditCommit=_handle_edit,
                            )
        # if len(selectedRowSteps) <= 0:
        #     st.info("Select a row to display steps")


if __name__ == "__main__":
    main()
