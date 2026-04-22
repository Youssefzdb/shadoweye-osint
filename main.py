#!/usr/bin/env python3
"""
ShadowEye OSINT Framework v1.0
Open Source Intelligence Gathering & Reconnaissance Toolkit
Author: Shadow Core
"""

import argparse
import sys
from modules.dns_enum import DNSEnum
from modules.whois_lookup import WhoisLookup
from modules.email_osint import EmailOSINT
from modules.ip_intel import IPIntel
from modules.phone_osint import PhoneOSINT
from modules.report import ReportGenerator
from utils.banner import print_banner
from utils.logger import Logger

def main():
    print_banner()
    parser = argparse.ArgumentParser(
        description="ShadowEye OSINT Framework",
        formatter_class=argparse.RawTextHelpFormatter
    )
    subparsers = parser.add_subparsers(dest="module")

    # DNS
    dns = subparsers.add_parser("dns", help="DNS Enumeration & Subdomain Discovery")
    dns.add_argument("--target", required=True, help="Target domain")
    dns.add_argument("--mode", choices=["basic","full","brute"], default="basic")

    # WHOIS
    w = subparsers.add_parser("whois", help="WHOIS Lookup")
    w.add_argument("--target", required=True, help="Domain or IP")

    # Email
    e = subparsers.add_parser("email", help="Email OSINT")
    e.add_argument("--target", required=True, help="Email address")

    # IP
    ip = subparsers.add_parser("ip", help="IP Intelligence")
    ip.add_argument("--target", required=True, help="IP address")

    # Phone
    ph = subparsers.add_parser("phone", help="Phone Number OSINT")
    ph.add_argument("--number", required=True, help="Phone number (e.g. +1234567890)")

    # Report
    rp = subparsers.add_parser("report", help="Generate Report")
    rp.add_argument("--input", required=True, help="JSON results file")
    rp.add_argument("--output", default="report.html")

    parser.add_argument("--verbose", "-v", action="store_true")
    parser.add_argument("--save", "-s", help="Save results to JSON file")

    args = parser.parse_args()
    if not args.module:
        parser.print_help()
        sys.exit(0)

    log = Logger(getattr(args, "verbose", False))

    results = {}
    if args.module == "dns":
        results = DNSEnum(args.target, args.mode, log).run()
    elif args.module == "whois":
        results = WhoisLookup(args.target, log).run()
    elif args.module == "email":
        results = EmailOSINT(args.target, log).run()
    elif args.module == "ip":
        results = IPIntel(args.target, log).run()
    elif args.module == "phone":
        results = PhoneOSINT(args.number, log).run()
    elif args.module == "report":
        ReportGenerator(args.input, args.output, log).run()

    if getattr(args, "save", None) and results:
        import json
        with open(args.save, "w") as f:
            json.dump(results, f, indent=2)
        log.success(f"Results saved to {args.save}")

if __name__ == "__main__":
    main()
