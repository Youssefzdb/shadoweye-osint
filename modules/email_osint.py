#!/usr/bin/env python3
"""Email OSINT Module"""
import re, socket

class EmailOSINT:
    def __init__(self, email, logger):
        self.email = email
        self.logger = logger

    def _validate(self):
        pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        return re.match(pattern, self.email) is not None

    def _extract_domain(self):
        return self.email.split("@")[1]

    def _mx_lookup(self, domain):
        try:
            import subprocess
            r = subprocess.run(["nslookup","-type=MX", domain], capture_output=True, text=True, timeout=5)
            lines = [l for l in r.stdout.splitlines() if "mail exchanger" in l.lower()]
            self.logger.success(f"MX Records ({domain}): {len(lines)} found")
            for l in lines:
                self.logger.info(f"  {l.strip()}")
        except Exception as e:
            self.logger.warning(f"MX lookup failed: {e}")

    def _check_disposable(self, domain):
        disposable = ["mailinator.com","guerrillamail.com","tempmail.com","throwam.com","yopmail.com"]
        if domain in disposable:
            self.logger.warning(f"⚠️  {domain} is a known DISPOSABLE email provider!")
        else:
            self.logger.info(f"[OK] {domain} is not a known disposable provider")

    def _smtp_verify(self, domain):
        try:
            ip = socket.gethostbyname(domain)
            sock = socket.socket()
            sock.settimeout(3)
            sock.connect((ip, 25))
            banner = sock.recv(1024).decode(errors="ignore")
            sock.close()
            self.logger.success(f"SMTP Banner: {banner[:80].strip()}")
        except Exception as e:
            self.logger.warning(f"SMTP check failed: {e}")

    def run(self):
        self.logger.info(f"[*] Email OSINT: {self.email}")
        if not self._validate():
            self.logger.error("Invalid email format"); return
        domain = self._extract_domain()
        self.logger.success(f"Format valid ✓ | Domain: {domain}")
        self._check_disposable(domain)
        self._mx_lookup(domain)
        self._smtp_verify(domain)
        self.logger.info("[*] Done.")
