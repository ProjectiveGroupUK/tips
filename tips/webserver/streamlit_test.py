import subprocess

streamlit_cli = ["streamlit", "run", "Home.py"]
pro = subprocess.Popen(streamlit_cli, stdout=subprocess.PIPE) 
try:
    for line in pro.stdout:
        print(line.decode("utf-8").strip().replace('You can now view your Streamlit app in your browser.','TIPS Webserver is now up and running.'))
except KeyboardInterrupt:
    pro.terminate()