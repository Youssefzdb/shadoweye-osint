# ShadowEye — OSINT Intelligence Framework

> Open Source Intelligence gathering and target reconnaissance tool

![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue) ![Next.js](https://img.shields.io/badge/Next.js-14+-black) ![License](https://img.shields.io/badge/License-MIT-green)

## Overview

ShadowEye is a web-based OSINT framework built for security researchers and penetration testers. It aggregates data from multiple public sources to build comprehensive intelligence profiles on domains, IPs, emails, and individuals.

## Features

- 🌐 **Domain Recon** — WHOIS, DNS records, subdomains enumeration
- 📧 **Email OSINT** — Breach detection, account discovery
- 🗺️ **IP Intelligence** — Geolocation, ASN, open ports, threat score
- 👤 **Person Search** — Social media footprint analysis
- 📸 **Metadata Extraction** — Image & document metadata analysis
- 🔗 **Link Graph** — Visual relationship mapping between entities

## Installation

```bash
git clone https://github.com/Youssefzdb/v0-claw-code-gemini
cd v0-claw-code-gemini
npm install
npm run dev
```

## Usage

Open `http://localhost:3000` and enter your target (domain, IP, email, or username).

## Modules

| Module | Sources Used |
|--------|--------------|
| Domain | Shodan, VirusTotal, WHOIS |
| Email | HaveIBeenPwned, Hunter.io |
| IP | AbuseIPDB, Shodan, MaxMind |
| Person | LinkedIn, Twitter, GitHub |

## Disclaimer

> For authorized research and educational purposes only.

## Author

**Shadow Core** — OSINT Specialist | Cybersecurity Researcher