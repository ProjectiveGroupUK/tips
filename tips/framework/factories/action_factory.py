from typing import Dict
from actions.action import Action
from actions.append_action import AppendAction
from actions.copy_into_file_action import CopyIntoFileAction
from actions.default_action import DefaultAction
from actions.delete_action import DeleteAction
from actions.di_refresh_action import DIRefreshAction
from actions.merge_action import MergeAction
from actions.oi_refresh_action import OIRefreshAction
from actions.scd2_publish_action import SCD2PublishAction
from actions.ti_refresh_action import TIRefreshAction
from actions.truncate_action import TruncateAction
from metadata.action_metadata import ActionMetadata
from metadata.table_metadata import TableMetaData


class ActionFactory:
    def getAction(
        self, actionMetaData: ActionMetadata, metadata: TableMetaData, frameworkRunner
    ) -> Action:
        action: Action

        actionJson: Dict = {
            "status": "SKIPPED"
            if actionMetaData.isActive() == False
            else "NO EXECUTE"
            if frameworkRunner.isExecute() == False
            else "SUCCESS",
            "error_message": "",
            "action": actionMetaData.getCmdType(),
            "parameters": {
                "source": actionMetaData.getSource(),
                "target": actionMetaData.getTarget(),
                "where_clause": actionMetaData.getWhereClause(),
                "binds": actionMetaData.getBinds(),
                "temp_table": actionMetaData.isCreateTempTable(),
                "active": actionMetaData.isActive(),
            },
            "commands": [],
        }

        if actionMetaData.isActive():

            if actionMetaData.getCmdType() == "APPEND":
                action = AppendAction(
                    source=actionMetaData.getSource(),
                    target=actionMetaData.getTarget(),
                    whereClause=actionMetaData.getWhereClause(),
                    metadata=metadata,
                    binds=actionMetaData.getBinds(),
                    additionalFields=actionMetaData.getAdditionalFields(),
                    isOverwrite=False,
                    isCreateTempTable=actionMetaData.isCreateTempTable(),
                )
            elif actionMetaData.getCmdType() == "COPY_INTO_FILE":
                action = CopyIntoFileAction(
                    actionMetaData.getSource(),
                    actionMetaData.getTarget(),
                    actionMetaData.getWhereClause(),
                    actionMetaData.getBinds(),
                )
            elif actionMetaData.getCmdType() == "DELETE":
                action = DeleteAction(
                    actionMetaData.getSource(),
                    actionMetaData.getWhereClause(),
                    actionMetaData.getBinds(),
                )
            elif actionMetaData.getCmdType() == "MERGE":
                action = MergeAction(
                    source=actionMetaData.getSource(),
                    target=actionMetaData.getTarget(),
                    whereClause=actionMetaData.getWhereClause(),
                    metadata=metadata,
                    binds=actionMetaData.getBinds(),
                    additionalFields=actionMetaData.getAdditionalFields(),
                    mergeOnFields=actionMetaData.getMergeOnFields(),
                    generateMergeMatchedClause=actionMetaData.isGenerateMergeMatchedClause(),
                    generateMergeWhenNotMatchedClause=actionMetaData.isGenerateMergeWhenNotMatchedClause,
                    isCreateTempTable=actionMetaData.isCreateTempTable(),
                )
            elif actionMetaData.getCmdType() == "PUBLISH_SCD2_DIM":
                action = SCD2PublishAction(
                    source=actionMetaData.getSource(),
                    target=actionMetaData.getTarget(),
                    whereClause=actionMetaData.getWhereClause(),
                    businessKey=actionMetaData.getBusinessKey(),
                    metadata=metadata,
                    binds=actionMetaData.getBinds(),
                    additionalFields=actionMetaData.getAdditionalFields(),
                    isCreateTempTable=actionMetaData.isCreateTempTable(),
                )
            elif actionMetaData.getCmdType() == "REFRESH":
                if actionMetaData.getRefreshType() == "DI":
                    action = DIRefreshAction(
                        actionMetaData.getSource(),
                        actionMetaData.getTarget(),
                        actionMetaData.getWhereClause(),
                        metadata,
                        actionMetaData.getBinds(),
                        actionMetaData.getAdditionalFields(),
                        isCreateTempTable=actionMetaData.isCreateTempTable(),
                    )
                elif actionMetaData.getRefreshType() == "OI":
                    action = OIRefreshAction(
                        actionMetaData.getSource(),
                        actionMetaData.getTarget(),
                        actionMetaData.getWhereClause(),
                        metadata,
                        actionMetaData.getBinds(),
                        actionMetaData.getAdditionalFields(),
                        isCreateTempTable=actionMetaData.isCreateTempTable(),
                    )
                elif actionMetaData.getRefreshType() == "TI":
                    action = TIRefreshAction(
                        actionMetaData.getSource(),
                        actionMetaData.getTarget(),
                        actionMetaData.getWhereClause(),
                        metadata,
                        actionMetaData.getBinds(),
                        actionMetaData.getAdditionalFields(),
                        isCreateTempTable=actionMetaData.isCreateTempTable(),
                    )
                else:
                    action = DefaultAction()
            elif actionMetaData.getCmdType() == "TRUNCATE":
                action = TruncateAction(actionMetaData.getTarget())
            else:
                action = DefaultAction()
        else:
            action = DefaultAction()

        frameworkRunner.returnJson["steps"].append(actionJson)

        return action
