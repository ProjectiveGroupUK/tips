from contextlib import contextmanager

import streamlit as st
import streamlit.components.v1 as components


class Modal:

    def __init__(self, title, key, padding=20):
        self.title = title
        self.padding = padding
        self.key = key

    def is_open(self):
        return st.session_state.get(f'{self.key}-opened', False)

    def open(self):
        st.session_state[f'{self.key}-opened'] = True
        st.experimental_rerun()

    def close(self, rerun=True):
        st.session_state[f'{self.key}-opened'] = False
        if rerun:
            st.experimental_rerun()

    @contextmanager
    def container(self):
        st.markdown(
            f"""
            <style>
                div[data-modal-container='true'][key='{self.key}'] {{
                    position: fixed;
                    width: 100vw !important;
                    height: 100vh !important;
                    top: 0;
                    left: 0;
                    z-index: 999992;
                }}
            </style>
            """,
            unsafe_allow_html=True
        )
        with st.container():
            _container = st.container()

        components.html(
            f"""
            <script>

            var getSiblings = function (elem) {{

                // Setup siblings array and get the first sibling
                var siblings = [];
                var sibling = elem.parentNode.firstChild;

                // Loop through each sibling and push to the array
                while (sibling) {{
                    if (sibling.nodeType === 1 && sibling !== elem) {{
                        if(sibling.className === '') siblings.push(sibling); // After testing, it appears that the sibling element with no classes is the one that needs to be stretchd to full screen for the modal to work
                    }}
                    sibling = sibling.nextSibling
                }}

                return siblings;

            }};

            // STREAMLIT-MODAL-IFRAME-{self.key} <- Don't remove this comment. It's used to find our iframe
            const iframes = parent.document.body.getElementsByTagName('iframe');
            let container
            for(const iframe of iframes){{
                if (iframe.srcdoc.indexOf("STREAMLIT-MODAL-IFRAME-{self.key}") !== -1) {{
                    container = getSiblings(iframe.parentNode)[0];
                    container.setAttribute('data-modal-container', 'true');
                    container.setAttribute('key', '{self.key}');
                }}
            }}
            </script>
            """,
            height=0, width=0
        )

        with _container:
            yield _container