#!/usr/bin/env python3
"""Email OSINT Module"""
import re
import socket
import smtplib

class EmailOSINT:
    def __init__(self, email: str, logger):
        self.email = email
        self.logger = logger
        self.results = {"email": email}

    def validate_format(self) -> bool:
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        valid = bool(re.match(pattern, self.email))
        self.results["format_valid"] = valid
        self.logger.success(f"Format: {valid if valid else invalid}")
        return valid

    def extract_domain(self) -> str:
        domain = self.email.split("@")[1]
        self.results["domain"] = domain
        self.logger.info(f"Domain: {domain}")
        return domain

    def check_mx(self, domain: str) -> list:
        try:
            import dns.resolver
            mx = dns.resolver.resolve(domain, "MX")
            records = [r.exchange.to_text() for r in mx]
            self.results["mx_records"] = records
            for r in records:
                self.logger.success(f"MX: {r}")
            return records
        except Exception as e:
            self.logger.warning(f"MX lookup failed: {e}")
            return []

    def smtp_verify(self, domain: str) -> bool:
        self.logger.info(f"[*] SMTP verification for {self.email}...")
        try:
            mx_host = socket.gethostbyname(domain)
            server = smtplib.SMTP(timeout=10)
            server.connect(mx_host)
            server.helo("shadoweye.local")
            server.mail("test@shadoweye.local")
            code, msg = server.rcpt(self.email)
            server.quit()
            exists = code == 250
            self.results["smtp_exists"] = exists
            self.logger.success(f"SMTP verify: {exists if exists else not