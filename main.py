#!/usr/bin/env python3
"""
shadoweye-osint - Open Source Intelligence Gathering Framework
Gathers public info on domains, IPs, emails, and usernames
"""
import argparse
from modules.domain_recon import DomainRecon
from modules.email_osint import EmailOSINT
from modules.username_lookup import UsernameLookup
from modules.report import OSINTReport

def main():
    parser = argparse.ArgumentParser(description="ShadowEye OSINT Framework")
    parser.add_argument("--domain", help="Target domain")
    parser.add_argument("--email", help="Target email address")
    parser.add_argument("--username", help="Target username")
    parser.add_argument("--output", default="osint_report.html")
    args = parser.parse_args()

    results = {}

    if args.domain:
        print(f"[*] Domain recon: {args.domain}")
        dr = DomainRecon(args.domain)
        results["domain"] = dr.recon()

    if args.email:
        print(f"[*] Email OSINT: {args.email}")
        eo = EmailOSINT(args.email)
        results["email"] = eo.analyze()

    if args.username:
        print(f"[*] Username lookup: {args.username}")
        ul = UsernameLookup(args.username)
        results["username"] = ul.lookup()

    if not results:
        print("[-] Provide at least one target: --domain, --email, or --username")
        return

    report = OSINTReport(results)
    report.save(args.output)
    print(f"[+] Report saved: {args.output}")

if __name__ == "__main__":
    main()
