# 👁️ ShadowEye OSINT Framework

> Open Source Intelligence Gathering Tool

![Python](https://img.shields.io/badge/Python-3.8+-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Status](https://img.shields.io/badge/Status-Active-brightgreen)

## Features

- 🌐 **Domain Recon** — DNS records, WHOIS, subdomain enumeration
- 📍 **IP Intelligence** — Geolocation, reverse DNS, ISP info
- 📧 **Email OSINT** — Validation, MX lookup, breach indicators
- 👤 **Username Search** — 15+ platforms (GitHub, Twitter, Reddit, HackerOne...)
- 📄 **Report Generator** — HTML reports

## Installation

```bash
git clone https://github.com/Youssefzdb/shadoweye-osint
cd shadoweye-osint
pip install -r requirements.txt
```

## Usage

```bash
# Domain recon
python3 main.py domain --target example.com --full

# IP intelligence
python3 main.py ip --target 8.8.8.8

# Email OSINT
python3 main.py email --target user@example.com

# Username search across 15+ platforms
python3 main.py person --username shadowcore

# Generate HTML report
python3 main.py report --input results.json --output report.html
```

## Disclaimer

> For authorized use only. Always obtain permission before targeting systems or individuals.

## Author

**Shadow Core** — Cybersecurity Specialist | OSINT Researcher
