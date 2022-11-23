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
        "asn1crypto==1.5.1",
        "black==22.10.0",
        "certifi==2022.9.24",
        "cffi==1.15.1",
        "charset-normalizer==2.1.1",
        "click==8.1.3",
        "colorama==0.4.5",
        "cryptography==36.0.2",
        "filelock==3.8.0",
        "idna==3.4",
        "Jinja2==3.1.2",
        "MarkupSafe==2.1.1",
        "mypy-extensions==0.4.3",
        "oscrypto==1.3.0",
        "pathspec==0.10.2",
        "platformdirs==2.5.4",
        "pycparser==2.21",
        "pycryptodomex==3.15.0",
        "PyJWT==2.5.0",
        "pyOpenSSL==22.0.0",
        "pytz==2022.4",
        "requests==2.28.1",
        "snowflake-connector-python==2.8.0",
        "toml==0.10.2",
        "tomli==2.0.1",
        "typing-extensions",
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
