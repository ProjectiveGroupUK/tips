Welcome to your new **TIPS** project!

`Introduction`:
=============
**TIPS** enables data engineers to write transformation logic for data pipelines broadly using first class database objects, mostly with Database Views as source and Tables are target for a step within the transformation pipeline. DMLs are all generated dynamically using metadata that's stored in the database. For any non-standard function not achievable through standard sql, is supported through python action which can invoke an external python routine and utilise dataframes to return back results to the pipeline.

# `Directories`
## `db_objects`
This is the folder where you keep your sql scripts for all type of DB objects.

## `metadata`
This folder holds sql scripts related to process metadata.

## `Using the starter project`

Try running the following commands:
- tips test connection
- tips run -p <<proccess name>>


`Getting Started`
=================

### `Commands`
Commands available in TIPS, along with their usage are given below:

1. Version:
   You can check the version of TIPS installed by running command 
    ```
    tips --version
    ```
2. Setup New Project:
   You can run the following command to setup a new project. This would create a starter project folder structure. It would also ask you to input your snowflake db credentials that it would use to connect to the database to setup metadata and also while running data pipelines from your local install.
    ```
    tips setup
    ```
    A project folder would be created in your current working directory with the name same as the project name that you pass in to the above command

You can now execute the command you need to run or run command "tips --help" to check all the options available.


## Resources:
- Learn more about tips [in the docs](htts://localhost:3000/introduction)
