#!/usr/bin/env python3
"""DNS Enumeration & Subdomain Discovery"""
import socket, subprocess, json, concurrent.futures

SUBDOMAINS = [
    "www","mail","ftp","api","dev","staging","admin","portal","vpn",
    "ns1","ns2","smtp","cdn","app","blog","shop","test","remote","git",
    "ssh","cloud","mx","beta","auth","login","panel","dashboard","secure",
    "server","monitor","status","assets","static","media","img","files"
]

class DNSEnum:
    def __init__(self, target, mode, logger):
        self.target = target
        self.mode = mode
        self.logger = logger
        self.results = {"domain": target, "records": {}, "subdomains": []}

    def get_records(self):
        self.logger.info(f"[DNS] Enumerating records for {self.target}")
        for rtype in ["A","AAAA","MX","NS","TXT","CNAME","SOA"]:
            try:
                out = subprocess.run(["dig","+short",rtype,self.target],
                    capture_output=True, text=True, timeout=5).stdout.strip()
                if out:
                    self.results["records"][rtype] = out.splitlines()
                    self.logger.success(f"[{rtype}] {out[:80]}")
            except Exception:
                pass

    def check_sub(self, sub):
        host = f"{sub}.{self.target}"
        try:
            ip = socket.gethostbyname(host)
            self.results["subdomains"].append({"host": host, "ip": ip})
            self.logger.success(f"[SUB] {host} -> {ip}")
        except:
            pass

    def run(self):
        self.logger.info(f"[*] DNS mode: {self.mode}")
        self.get_records()
        if self.mode in ["full","brute"]:
            self.logger.info(f"[*] Probing {len(SUBDOMAINS)} subdomains...")
            with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:
                ex.map(self.check_sub, SUBDOMAINS)
        self.logger.info(f"[+] Found {len(self.results[\"subdomains\"])} subdomains")
        print(json.dumps(self.results, indent=2))
        return self.results
