import os
import sys
import warnings
import argparse
import tips.commands.setup as SetupCommand
import tips.commands.deploy as DeployCommand
import tips.commands.run as RunCommand
import tips.commands.app as AppCommand
from tips.utils.utils import ExitCodes, Globals
from tips.utils.logger import Logger

VERSION = "1.0.1"

globals = Globals()
globals.setEnvName(os.environ.get("env", "dev"))

logger = Logger().initialize()


class TIPSVersion(argparse.Action):
    """This is very similar to the built-in argparse._Version action,
    except it just calls tips.version.get_version_information().
    """

    def __init__(
        self,
        option_strings,
        version=None,
        dest=argparse.SUPPRESS,
        default=argparse.SUPPRESS,
        help="show program's version number and exit",
    ):
        super().__init__(
            option_strings=option_strings,
            dest=dest,
            default=default,
            nargs=0,
            help=help,
        )

    def __call__(self, parser, namespace, values, option_string=None):
        formatter = argparse.RawTextHelpFormatter(prog=parser.prog)
        formatter.add_text(f"Tips {VERSION}")
        parser.exit(message=formatter.format_help())


class TIPSArgumentParser(argparse.ArgumentParser):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.register("action", "tipsversion", TIPSVersion)

    def add_optional_argument_inverse(
        self,
        name,
        *,
        enable_help=None,
        disable_help=None,
        dest=None,
        no_name=None,
        default=None,
    ):
        mutex_group = self.add_mutually_exclusive_group()
        if not name.startswith("--"):
            raise Exception(
                'cannot handle optional argument without "--" prefix: ' f'got "{name}"'
            )
        if dest is None:
            dest_name = name[2:].replace("-", "_")
        else:
            dest_name = dest

        if no_name is None:
            no_name = f"--no-{name[2:]}"

        mutex_group.add_argument(
            name,
            action="store_const",
            const=True,
            dest=dest_name,
            default=default,
            help=enable_help,
        )

        mutex_group.add_argument(
            f"--no-{name[2:]}",
            action="store_const",
            const=False,
            dest=dest_name,
            default=default,
            help=disable_help,
        )

        return mutex_group


def main(args=None):
    logger.debug(f"Inside main")
    warnings.filterwarnings("ignore", category=DeprecationWarning, module="logbook")
    if args is None:
        args = sys.argv[1:]

    try:
        results, succeeded = handle_and_check(args)
        if succeeded:
            exit_code = ExitCodes.Success.value
        else:
            exit_code = ExitCodes.ModelError.value

    except KeyboardInterrupt:
        # if the logger isn't configured yet, it will use the default logger
        exit_code = ExitCodes.UnhandledError.value

    # This can be thrown by eg. argparse
    except SystemExit as e:
        exit_code = e.code

    except BaseException as e:
        # logger.error(e)
        exit_code = ExitCodes.UnhandledError.value

    sys.exit(exit_code)


def handle_and_check(args):
    parsed = parse_args(args)

    task, res = run_from_args(parsed)
    success = task.interpret_results(res)

    return res, success


def run_from_args(parsed):
    # this will convert DbtConfigErrors into RuntimeExceptions
    # task could be any one of the task objects
    task = parsed.cls.from_args(args=parsed)

    # Set up logging
    log_path = None
    if task.config is not None:
        log_path = getattr(task.config, "log_path", None)

    results = task.run()

    return task, results


def _build_base_subparser():
    logger.debug("Inside _build_base_subparser")
    base_subparser = argparse.ArgumentParser(add_help=False)

    # base_subparser.add_argument(
    #     "--vars",
    #     type=str,
    #     default="{}",
    #     help="""
    #     Supply variables to the project. This argument should be a JSON
    #     string, eg. '{my_variable: my_value}'
    #     """,
    # )

    base_subparser.set_defaults(defer=None, state=None)
    return base_subparser


def _build_setup_subparser(subparsers, base_subparser):
    logger.debug("Inside _build_setup_subparser")
    sub = subparsers.add_parser(
        "setup",
        parents=[base_subparser],
        help="""
        Setup a new TIPS project.
        """,
    )
    sub.add_argument(
        "project_name",
        nargs="?",
        # default="$1invalid_",
        help="""
        Name of the new TIPS project.
        """,
    )
    sub.add_argument(
        "-sc",
        "--skip-connection-setup",
        dest="skip_connection_setup",
        action="store_true",
        help="""
        Skips database connection setup, when this flag is included
        """,
    )
    sub.add_argument(
        "-sm",
        "--skip-metadata-setup",
        dest="skip_metadata_setup",
        action="store_true",
        help="""
        Skips database metadata setup, when this flag is included
        """,
    )
    sub.add_argument(
        "-f",
        "--force-metadata-refresh",
        dest="force_metadata_refresh",
        action="store_true",
        help="""
        Forces Metadata Refresh, resulting in dropping and recreating metadata schema and tables 
        """,
    )
    sub.add_argument(
        "-s",
        "--sample-metadata",
        dest="insert_sample_metadata",
        action="store_true",
        help="""
        Inserts Sample Metadata 
        """,
    )
    sub.set_defaults(cls=SetupCommand.SetupTask, which="setup", rpc_method=None)
    return sub


def _build_deploy_subparser(subparsers, base_subparser):
    logger.debug("Inside _build_deploy_subparser")
    sub = subparsers.add_parser(
        "deploy",
        parents=[base_subparser],
        help="""
        Deploy database objects.
        """,
    )

    sub.add_argument(
        "-sd",
        "--skip-db-objects",
        dest="skip_db_objects",
        action="store_true",
        help="""
        Skips database objects deployment, when this flag is included
        """,
        required=False,
    )


    sub.add_argument(
        "-ot",
        "--object-types",
        dest="object_types",
        nargs="+",
        choices=[
            "table",
            "view",
            "sequence",
            "procedure",
            "function",
            "schema",
            "stage",
            "pipe",
            "fileformat",
            "TABLE",
            "VIEW",
            "SEQUENCE",
            "PROCEDURE",
            "FUNCTION",
            "SCHEMA",
            "STAGE",
            "PIPE",
            "FILEFORMAT",
        ],
        help="""
        Specify the type of objects that you want to deploy.
        All files in folders related to specified object would be deployed
        """,
        metavar="OBJECT TYPE",
        required=False,
    )

    sub.add_argument(
        "-on",
        "--object-names",
        dest="object_names",
        nargs="+",
        help="""
        Specify names of objects that you want to be deployed, if only certain objects are to be deployed.
        Object names should match filenames. File extension is not required. 
        """,
        metavar="OBJECT NAME",
        required=False,
    )

    sub.add_argument(
        "-mn",
        "--metadata-script-names",
        dest="metadata_script_names",
        nargs="+",
        help="""
        Specify names of scripts for Metadata that you want to be deployed, if only certain metadata scripts are to be deployed.
        Names should match filenames. File extension is not required. 
        """,
        metavar="METADATA NAME",
        required=False,
    )

    sub.add_argument(
        "-sm",
        "--skip-metadata-setup",
        dest="skip_metadata_setup",
        action="store_true",
        help="""
        Skips database metadata setup, when this flag is included
        """,
    )

    sub.set_defaults(cls=DeployCommand.DeployTask, which="deploy", rpc_method=None)
    return sub

def _build_run_subparser(subparsers, base_subparser):
    logger.debug("Inside _build_run_subparser")
    sub = subparsers.add_parser(
        "run",
        parents=[base_subparser],
        help="""
        Run data pipeline.
        """,
    )

    sub.add_argument(
        "-p",
        "--process",
        dest="process_name",
        help="""
        Process Name to run.
        """,
        metavar="Process Name",
        required=True,
    )

    sub.add_argument(
        "-v",
        "--var",
        dest="variables_dict",
        help="""
        Enter bind variables to be used by the process
        Needs to be in dictionary format. E.g. "{'VAR1': 'VALUE1','VAR2':'VALUE2'}" 
        """,
        metavar="Variables Dict",
        required=False,
    )

    sub.add_argument(
        "-ne",
        "--no-execute",
        dest="no_execute_mode",
        action="store_true",
        help="""
        When this option is used, it would run the process in no execute mode,
        i.e. sqls would be generated and listed in output file, but would not be run
        """,
    )

    sub.set_defaults(cls=RunCommand.RunTask, which="run", rpc_method=None)
    return sub

def _build_app_subparser(subparsers, base_subparser):
    logger.debug("Inside _build_app_subparser")
    sub = subparsers.add_parser(
        "app",
        parents=[base_subparser],
        help="""
        Start TIPS app server.
        """,
    )

    sub.add_argument(
        "-p",
        "--port",
        dest="server_port",
        help="""
        Specify port on which web server should run. Default is 8501   
        """,
        metavar="Port",
        required=False,
    )

    sub.set_defaults(cls=AppCommand.AppTask, which="app", rpc_method=None)
    return sub

def parse_args(args, cls=TIPSArgumentParser):
    logger.debug("Inside parse_args")

    p = cls(
        prog="tips",
        description="""
        TIPS -> Transformation in Python & SQL:
        An ELT framework for managing your SQL transformations datapipelines.
        For more documentation on these commands, visit: http://localhost:8080/documentation
        """,
        epilog="""
        Specify one of these sub-commands and you can find more help from
        there.
        """,
    )

    p.add_argument(
        "--version",
        action="tipsversion",
        help="""
        Show version information
        """,
    )

    subs = p.add_subparsers(title="Available sub-commands")

    base_subparser = _build_base_subparser()

    _build_setup_subparser(subs, base_subparser)
    _build_deploy_subparser(subs, base_subparser)
    _build_run_subparser(subs, base_subparser)
    _build_app_subparser(subs, base_subparser)

    if len(args) == 0:
        p.print_help()
        sys.exit(1)

    parsed = p.parse_args(args)

    if not hasattr(parsed, "which"):
        p.print_help()
        p.exit(1)

    return parsed


if __name__ == "__main__":
    main()
