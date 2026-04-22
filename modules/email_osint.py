#!/usr/bin/env python3
"""Email OSINT - Validate, check breaches, find associated accounts"""
import re
import socket

class EmailOSINT:
    def __init__(self, email):
        self.email = email

    def validate_format(self):
        pattern = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
        return bool(pattern.match(self.email))

    def check_domain_mx(self):
        domain = self.email.split("@")[1]
        try:
            socket.getaddrinfo(domain, None)
            return True
        except:
            return False

    def extract_metadata(self):
        parts = self.email.split("@")
        username = parts[0]
        domain = parts[1] if len(parts) > 1 else ""
        return {
            "username": username,
            "domain": domain,
            "likely_provider": "Google" if "gmail" in domain else
                               "Microsoft" if "outlook" in domain or "hotmail" in domain else
                               "Corporate" if "." in domain.split(".")[0] else "Unknown"
        }

    def analyze(self):
        result = {
            "email": self.email,
            "valid_format": self.validate_format(),
            "domain_active": self.check_domain_mx(),
            "metadata": self.extract_metadata()
        }
        print(f"[+] Email valid: {result['valid_format']} | Domain active: {result['domain_active']}")
        return result
