#!/usr/bin/env python3
"""Domain Reconnaissance - DNS, WHOIS, subdomains"""
import socket
import json
import subprocess

DNS_RECORD_TYPES = ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA"]
COMMON_SUBDOMAINS = ["www", "mail", "ftp", "admin", "api", "dev", "staging", "vpn", "remote", "portal"]

class DomainRecon:
    def __init__(self, domain):
        self.domain = domain

    def get_dns(self):
        records = {}
        try:
            ip = socket.gethostbyname(self.domain)
            records["A"] = ip
            print(f"[+] {self.domain} -> {ip}")
        except:
            pass
        return records

    def enumerate_subdomains(self):
        found = []
        for sub in COMMON_SUBDOMAINS:
            target = f"{sub}.{self.domain}"
            try:
                ip = socket.gethostbyname(target)
                found.append({"subdomain": target, "ip": ip})
                print(f"[+] Subdomain: {target} -> {ip}")
            except:
                pass
        return found

    def get_whois(self):
        try:
            result = subprocess.check_output(["whois", self.domain], timeout=10, stderr=subprocess.DEVNULL).decode()
            lines = [l for l in result.split("\n") if ":" in l and not l.startswith("%")]
            return dict(line.split(":", 1) for line in lines[:20] if len(line.split(":", 1)) == 2)
        except:
            return {"note": "whois not available"}

    def recon(self):
        return {
            "target": self.domain,
            "dns": self.get_dns(),
            "subdomains": self.enumerate_subdomains(),
            "whois": self.get_whois()
        }
