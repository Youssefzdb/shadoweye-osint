#!/usr/bin/env python3
"""
ShadowEye OSINT Framework v1.0
Open Source Intelligence Gathering Tool
Author: Shadow Core
"""
import argparse, sys
from modules.dns_enum import DNSEnum
from modules.email_osint import EmailOSINT
from modules.username_hunt import UsernameHunt
from modules.ip_lookup import IPLookup
from modules.web_recon import WebRecon
from utils.banner import banner
from utils.logger import Logger

def main():
    banner()
    p = argparse.ArgumentParser(description="ShadowEye OSINT Framework")
    sub = p.add_subparsers(dest="module")

    d = sub.add_parser("dns", help="DNS Enumeration & Subdomain Discovery")
    d.add_argument("--domain", required=True)
    d.add_argument("--wordlist", default="wordlists/subdomains.txt")

    e = sub.add_parser("email", help="Email OSINT & Breach Check")
    e.add_argument("--email", required=True)

    u = sub.add_parser("user", help="Username Hunt across platforms")
    u.add_argument("--username", required=True)

    i = sub.add_parser("ip", help="IP Geolocation & Threat Intel")
    i.add_argument("--ip", required=True)

    w = sub.add_parser("web", help="Web Recon & Tech Fingerprint")
    w.add_argument("--url", required=True)

    p.add_argument("--verbose", "-v", action="store_true")
    args = p.parse_args()

    if not args.module:
        p.print_help(); sys.exit(0)

    log = Logger(args.verbose if hasattr(args, "verbose") else False)

    if args.module == "dns":
        DNSEnum(args.domain, args.wordlist, log).run()
    elif args.module == "email":
        EmailOSINT(args.email, log).run()
    elif args.module == "user":
        UsernameHunt(args.username, log).run()
    elif args.module == "ip":
        IPLookup(args.ip, log).run()
    elif args.module == "web":
        WebRecon(args.url, log).run()

if __name__ == "__main__":
    main()
