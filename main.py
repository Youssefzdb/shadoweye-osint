#!/usr/bin/env python3
"""
ShadowEye OSINT Framework v1.0
Open Source Intelligence Gathering Tool
Author: Shadow Core
"""
import argparse, sys
from modules.domain import DomainRecon
from modules.person import PersonLookup
from modules.ip import IPRecon
from modules.email import EmailHunter
from modules.report import OSINTReport
from utils.banner import print_banner
from utils.logger import Logger

def main():
    print_banner()
    parser = argparse.ArgumentParser(description="ShadowEye — OSINT Intelligence Framework")
    sub = parser.add_subparsers(dest="module")

    d = sub.add_parser("domain", help="Domain & DNS intelligence")
    d.add_argument("--target", required=True, help="Target domain")
    d.add_argument("--full", action="store_true", help="Full scan (subdomains + WHOIS + DNS)")

    i = sub.add_parser("ip", help="IP Geolocation & Reputation")
    i.add_argument("--target", required=True, help="Target IP")

    e = sub.add_parser("email", help="Email OSINT & Breach Check")
    e.add_argument("--target", required=True, help="Target email")

    p = sub.add_parser("person", help="Person OSINT (username search)")
    p.add_argument("--username", required=True)

    r = sub.add_parser("report", help="Generate OSINT report")
    r.add_argument("--input", required=True)
    r.add_argument("--output", default="osint_report.html")

    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args()

    if not args.module:
        parser.print_help()
        sys.exit(0)

    log = Logger(getattr(args, "verbose", False))

    if args.module == "domain":
        DomainRecon(args.target, args.full, log).run()
    elif args.module == "ip":
        IPRecon(args.target, log).run()
    elif args.module == "email":
        EmailHunter(args.target, log).run()
    elif args.module == "person":
        PersonLookup(args.username, log).run()
    elif args.module == "report":
        OSINTReport(args.input, args.output, log).run()

if __name__ == "__main__":
    main()
