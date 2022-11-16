# TIPS -> Transformation In Python & SQL

Introduction:
=============
**[TIPS]** enables data engineers to write transformation logic for data pipelines broadly using first class database objects, mostly with Database Views as source and Tables are target for a step within the transformation pipeline. DMLs are all generated dynamically using metadata that's stored in the database. For any non-standard function not achievable through standard sql, is supported through python action which can invoke an external python routine and utilise dataframes to return back results to the pipeline.

Getting Started:
===
### Installation:
TIPS can be installed directly from Github. Please follow the below steps to install the package:

1. Python Virtual Environment:
   - Open terminal (mac/VSCode) / powershell (MS Windows). Bash terminal is preferable on Windows
   - Check python version (version >= 3.7.2 is required for installation to work):
        ```
        python --version
        ```
        if you have multiple versions of python installed, then probably you would need to replace "python" with python3 in command above and the next command

   - Create virtual environment:
        ```
        python -m venv venv
        ```
        PS: Above command creates a venv folder in your current working folder. if your current working folder is version controlled in git, make sure to include venv/ in .gitignore file

   - Active virtual enviroment:
        <br>On bash terminal
        ```
        source ./venv/Scripts/activate
        ```
        <br>On windows powershell
        ```
        ./venv/Scripts/activate
        ```
   - Upgrade pip in activated venv
        ```
        pip install --upgrade pip
        ```
2. Install TIPS package from git
   - pip install command
        ```
        pip install git+https://github.com/nitindt2/tips.git
        ```
   - Check that TIPS is installed successfully
        ```
        tips --version
        ```

if above command displays version information, than that indicates that package has been installed correctly.

You can now execute the command you need to run or run command "tips --help" to check all the options available.

