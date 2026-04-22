from setuptools import setup, find_packages
setup(
    name="shadoweye-osint",
    version="1.0.0",
    author="Shadow Core",
    description="Open Source Intelligence Gathering & Reconnaissance Toolkit",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=["dnspython","requests","colorama","python-whois","phonenumbers"],
    entry_points={"console_scripts": ["shadoweye=main:main"]},
)
