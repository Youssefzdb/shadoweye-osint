# 👁️ ShadowEye OSINT Framework

> Open Source Intelligence Gathering Tool | by **Shadow Core**

## Features
- 🔍 **DNS Enumeration** — Subdomain discovery via brute force
- 📧 **Email OSINT** — Validate, MX lookup, SMTP fingerprint
- 👤 **Username Hunt** — Check 15+ platforms (GitHub, Twitter, TikTok...)
- 🌐 **IP Intelligence** — GeoIP, ASN, Threat Intel, Reverse DNS
- 🖥️  **Web Recon** — HTTP headers, tech fingerprinting (WordPress, React, Cloudflare...)

## Usage
```bash
pip install -r requirements.txt

# DNS Enumeration
python main.py dns --domain example.com

# Username Hunt
python main.py user --username shadowcore

# IP Intelligence
python main.py ip --ip 8.8.8.8

# Email OSINT
python main.py email --email target@example.com

# Web Recon
python main.py web --url https://example.com
```

## ⚠️ Disclaimer
For authorized and educational use only.
