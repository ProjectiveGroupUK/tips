import streamlit as st
import graphviz
from streamlit_modal import Modal

class StepsGraph():

    def modalWindow(self, selectProcessName, selectedRowSteps):
        st.info(selectProcessName)
        st.info(selectedRowSteps)
        modal = Modal(selectProcessName,"graph_modal")
        with modal.container():
            graph = graphviz.Digraph()
            # loopCnt = 0
            prevTGT = ""
            for row in selectedRowSteps:
                # if prevTGT != "":
                #     graph.edge(tail_name=prevTGT, head_name=row['source'], label="Next Step")    

                curr = graph.edge(tail_name=row['source'], head_name=row['target'], label=row['cmd_type'])
                # if loopCnt > 0:
                #     graph.edge(tail_name=prev,head_name=curr,label="Next Step")

                # prev = curr
                # loopCnt += 1
                prevTGT = row['target']

            st.graphviz_chart(graph, use_container_width=True)
        modal.open()
