#!/usr/bin/env python3
"""DNS Enumeration & Subdomain Discovery Module"""
import socket
import dns.resolver
import dns.zone
import dns.query

COMMON_SUBDOMAINS = [
    "www","mail","ftp","api","dev","staging","test","admin","portal",
    "vpn","remote","smtp","pop","imap","ns1","ns2","cdn","blog","app",
    "secure","login","auth","db","database","mx","backup","git","status"
]

class DNSEnum:
    def __init__(self, target: str, mode: str, logger):
        self.target = target
        self.mode = mode
        self.logger = logger
        self.results = {"target": target, "subdomains": [], "records": {}}

    def get_records(self, rtype: str):
        try:
            answers = dns.resolver.resolve(self.target, rtype)
            recs = [r.to_text() for r in answers]
            self.results["records"][rtype] = recs
            self.logger.success(f"{rtype}: {,