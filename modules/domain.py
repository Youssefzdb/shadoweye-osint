#!/usr/bin/env python3
"""Domain & DNS Reconnaissance Module"""
import socket, json, subprocess

class DomainRecon:
    def __init__(self, target, full, logger):
        self.target = target
        self.full = full
        self.logger = logger
        self.results = {"domain": target}

    def dns_records(self):
        self.logger.info(f"[DNS] Resolving {self.target}...")
        for rtype in ["A", "AAAA", "MX", "NS", "TXT", "CNAME"]:
            try:
                result = subprocess.run(["dig", "+short", rtype, self.target],
                    capture_output=True, text=True, timeout=5)
                if result.stdout.strip():
                    self.results[rtype] = result.stdout.strip().splitlines()
                    self.logger.success(f"[{rtype}] {result.stdout.strip()[:100]}")
            except Exception:
                pass

    def whois(self):
        self.logger.info(f"[WHOIS] Querying {self.target}...")
        try:
            result = subprocess.run(["whois", self.target],
                capture_output=True, text=True, timeout=10)
            lines = [l for l in result.stdout.splitlines() if ":" in l and not l.startswith("%")][:15]
            self.results["whois"] = lines
            for l in lines:
                self.logger.info(f"  {l}")
        except Exception as e:
            self.logger.warning(f"WHOIS failed: {e}")

    def subdomains(self):
        self.logger.info(f"[SUBDOMAINS] Probing common subdomains...")
        common = ["www", "mail", "ftp", "vpn", "api", "dev", "staging",
                  "admin", "portal", "remote", "ns1", "ns2", "smtp", "cdn"]
        found = []
        for sub in common:
            host = f"{sub}.{self.target}"
            try:
                ip = socket.gethostbyname(host)
                found.append(f"{host} -> {ip}")
                self.logger.success(f"[FOUND] {host} -> {ip}")
            except:
                pass
        self.results["subdomains"] = found

    def run(self):
        self.logger.info(f"[*] Starting domain recon on {self.target}")
        self.dns_records()
        self.whois()
        if self.full:
            self.subdomains()
        print("\n[+] Results:")
        print(json.dumps(self.results, indent=2))
        return self.results
