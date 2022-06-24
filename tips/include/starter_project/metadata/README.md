# TIPS -> Transformation In Plain SQL

**[metadata folder]** In this folder you store DML SQL script files related to the data pipelines. The scripts should be written in declarative way i.e. one script per data pipeline and should have delete statements followed by inserts. This is so that scripts are re-runnable. No need to include schema, by default TIPS_MD_SCHEMA would be used.
