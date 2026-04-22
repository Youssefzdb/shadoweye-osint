# 👁️ ShadowEye OSINT Framework

> Open Source Intelligence Gathering & Reconnaissance Toolkit

![Python](https://img.shields.io/badge/Python-3.8+-blue?logo=python) ![License](https://img.shields.io/badge/License-MIT-green) ![Status](https://img.shields.io/badge/Status-Active-brightgreen)

```
███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗    ███████╗██╗   ██╗███████╗
██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║    ██╔════╝╚██╗ ██╔╝██╔════╝
███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║    █████╗   ╚████╔╝ █████╗
╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║    ██╔══╝    ╚██╔╝  ██╔══╝
███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝    ███████╗   ██║   ███████╗
╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝    ╚══════╝   ╚═╝   ╚══════╝
```

## 🔍 Modules

| Module | Description |
|--------|-------------|
| `dns` | DNS enumeration, zone transfer, subdomain discovery |
| `whois` | WHOIS lookup & registrar info |
| `email` | Email OSINT, breach check, header analysis |
| `social` | Social media profile discovery |
| `ip` | IP geolocation, ASN, reverse lookup |
| `phone` | Phone number OSINT & carrier lookup |
| `report` | Generate HTML/JSON reports |

## 🚀 Installation

```bash
git clone https://github.com/Youssefzdb/shadoweye-osint
cd shadoweye-osint
pip install -r requirements.txt
python3 main.py --help
```

## ⚡ Usage

```bash
# DNS enumeration
python3 main.py dns --target example.com --mode full

# WHOIS lookup
python3 main.py whois --target example.com

# Email OSINT
python3 main.py email --target user@example.com

# IP intelligence
python3 main.py ip --target 1.1.1.1

# Phone OSINT
python3 main.py phone --number +1234567890

# Generate report
python3 main.py report --input results.json --output report.html
```

## ⚠️ Disclaimer

> For authorized security research and educational purposes only. Always comply with applicable laws.

## 👤 Author

**Shadow Core** | Cybersecurity Researcher | OSINT Specialist
