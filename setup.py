#!/usr/bin/env python
import os
import sys

if sys.version_info < (3, 7, 2):
    print("Error: TiPS is not supported for this version of Python.")
    print("Please upgrade to Python 3.7.2 or higher.")
    sys.exit(1)


from setuptools import setup

try:
    from setuptools import find_namespace_packages
except ImportError:
    # the user has a downlevel version of setuptools.
    print("Error: TiPS requires setuptools v40.1.0 or higher.")
    print(
        'Please upgrade setuptools with "pip install --upgrade setuptools" '
        "and try again"
    )
    sys.exit(1)


this_directory = os.path.abspath(os.path.dirname(__file__))
with open(os.path.join(this_directory, "README.md")) as f:
    long_description = f.read()


package_name = "tips"
package_version = "1.0.1"
description = """With TiPS, data engineers can build data pipelines \
using first class database objects mainly with Views, Tables and metadata."""


setup(
    name=package_name,
    version=package_version,
    description=description,
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Nitin Garg",
    author_email="nitin.garg@dtsquared.co.uk",
    url="https://github.com/nitindt2/tips",
    packages=find_namespace_packages(include=["tips", "tips.*"]),
    include_package_data=True,
    test_suite="test",
    entry_points={
        "console_scripts": [
            "tips = tips.main:main",
        ],
    },
    install_requires=[
        "altair==4.2.2",
        "asn1crypto==1.5.1",
        "attrs==23.1.0",
        "backports.zoneinfo==0.2.1",
        "blinker==1.6.2",
        "cachetools==5.3.0",
        "certifi==2023.5.7",
        "cffi==1.15.1",
        "charset-normalizer==2.1.1",
        "click==8.1.3",
        "cloudpickle==2.0.0",
        "colorama==0.4.6",
        "cryptography==40.0.2",
        "decorator==5.1.1",
        "entrypoints==0.4",
        "filelock==3.12.0",
        "gitdb==4.0.10",
        "GitPython==3.1.31",
        "idna==3.4",
        "importlib-metadata==6.6.0",
        "importlib-resources==5.12.0",
        "Jinja2==3.1.2",
        "jsonschema==4.17.3",
        "markdown-it-py==2.2.0",
        "MarkupSafe==2.1.2",
        "mdurl==0.1.2",
        "numpy==1.24.3",
        "oscrypto==1.3.0",
        "packaging==23.1",
        "pandas==2.0.1",
        "Pillow==9.5.0",
        "pkgutil_resolve_name==1.3.10",
        "protobuf==3.20.3",
        "pyarrow==10.0.1",
        "pycparser==2.21",
        "pycryptodomex==3.17",
        "pydeck==0.8.1b0",
        "Pygments==2.15.1",
        "PyJWT==2.7.0",
        "Pympler==1.0.1",
        "pyOpenSSL==23.1.1",
        "pyrsistent==0.19.3",
        "python-dateutil==2.8.2",
        "pytz==2023.3",
        "requests==2.30.0",
        "rich==13.3.5",
        "six==1.16.0",
        "smmap==5.0.0",
        "snowflake-connector-python==3.0.3",
        "snowflake-snowpark-python==1.4.0",
        "streamlit==1.22.0",
        "streamlit-elements==0.1.0",
        "tenacity==8.2.2",
        "toml==0.10.2",
        "toolz==0.12.0",
        "tornado==6.3.2",
        "typing_extensions==4.5.0",
        "tzdata==2023.3",
        "tzlocal==5.0.1",
        "urllib3==1.26.15",
        "validators==0.20.0",
        "watchdog==3.0.0",
        "zipp==3.15.0",
    ],
    zip_safe=False,
    classifiers=[
        "Development Status :: 1 - Production/Stable",
        "License :: OSI Approved :: Apache Software License",
        "Operating System :: Microsoft :: Windows",
        "Operating System :: MacOS :: MacOS X",
        "Operating System :: POSIX :: Linux",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
    ],
    python_requires=">=3.7.2",
)
