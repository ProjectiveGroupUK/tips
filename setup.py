#!/usr/bin/env python
import os
import sys

if sys.version_info < (3, 7, 2):
    print("Error: TIPS is not supported for this version of Python.")
    print("Please upgrade to Python 3.7.2 or higher.")
    sys.exit(1)


from setuptools import setup

try:
    from setuptools import find_namespace_packages
except ImportError:
    # the user has a downlevel version of setuptools.
    print("Error: tips requires setuptools v40.1.0 or higher.")
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
description = """With TIPS, data engineers can build data pipelines \
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
        "attrs==22.2.0",
        "backports.zoneinfo==0.2.1",
        "blinker==1.5",
        "cachetools==5.3.0",
        "certifi==2022.12.7",
        "cffi==1.15.1",
        "charset-normalizer==2.1.1",
        "click==8.1.3",
        "colorama==0.4.5",
        "cryptography==36.0.2",
        "decorator==5.1.1",
        "entrypoints==0.4",
        "filelock==3.9.0",
        "gitdb==4.0.10",
        "GitPython==3.1.30",
        "graphviz==0.20.1",
        "idna==3.4",
        "importlib-metadata==6.0.0",
        "importlib-resources==5.10.2",
        "Jinja2==3.1.2",
        "jsonschema==4.17.3",
        "markdown-it-py==2.1.0",
        "MarkupSafe==2.1.2",
        "mdurl==0.1.2",
        "numpy==1.24.2",
        "oscrypto==1.3.0",
        "packaging==23.0",
        "pandas==1.5.3",
        "Pillow==9.4.0",
        "pkgutil-resolve-name==1.3.10",
        "protobuf==3.20.3",
        "pyarrow==8.0.0",
        "pycparser==2.21",
        "pycryptodomex==3.17",
        "pydeck==0.8.0",
        "Pygments==2.14.0",
        "PyJWT==2.6.0",
        "Pympler==1.0.1",
        "pyOpenSSL==22.0.0",
        "pyrsistent==0.19.3",
        "python-dateutil==2.8.2",
        "pytz==2022.7.1",
        "pytz-deprecation-shim==0.1.0.post0",
        "requests==2.28.2",
        "rich==13.3.1",
        "semver==2.13.0",
        "six==1.16.0",
        "smmap==5.0.0",
        "snowflake-connector-python==2.8.0",
        "streamlit==1.22.0",
        "toml==0.10.2",
        "toolz==0.12.0",
        "tornado==6.2",
        "typing-extensions==4.4.0",
        "tzdata==2022.7",
        "tzlocal==4.2",
        "urllib3==1.26.14",
        "validators==0.20.0",
        "watchdog==2.2.1",
        "zipp==3.12.1",
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
