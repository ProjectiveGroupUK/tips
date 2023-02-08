from streamlit.source_util import get_pages, _on_pages_changed

def deletePage(page_name):

    current_pages = get_pages('home.py')

    for key, value in current_pages.items():
        if value['page_name'] == page_name:
            del current_pages[key]
            break
        else:
            pass
    _on_pages_changed.send()