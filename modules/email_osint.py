#!/usr/bin/env python3
"""Email OSINT Module"""
import re, json, subprocess, socket

class EmailOSINT:
    def __init__(self, target, logger):
        self.target = target
        self.logger = logger
        self.results = {"email": target}

    def validate(self):
        valid = bool(re.match(r"^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}$", self.target))
        self.results["valid_format"] = valid
        self.logger.info(f"Format valid: {valid}")
        return valid

    def mx_check(self):
        domain = self.target.split("@")[1]
        self.results["domain"] = domain
        try:
            out = subprocess.run(["dig","+short","MX",domain],
                capture_output=True, text=True, timeout=5).stdout.strip()
            self.results["mx"] = out.splitlines() if out else []
            self.logger.success(f"MX: {out[:100] if out else None}")
        except:
            self.logger.warning("MX lookup failed")

    def smtp_verify(self):
        domain = self.target.split("@")[1]
        try:
            ip = socket.gethostbyname(domain)
            self.results["domain_ip"] = ip
            self.logger.success(f"Domain IP: {ip}")
        except:
            pass

    def pattern_analysis(self):
        user = self.target.split("@")[0]
        patterns = []
        if re.match(r"^[a-z]+\.[a-z]+$", user): patterns.append("firstname.lastname")
        if re.match(r"^[a-z]+[0-9]+$", user): patterns.append("name+number")
        if re.match(r"^[a-z]{1,3}\.[a-z]+$", user): patterns.append("initial.lastname")
        self.results["username"] = user
        self.results["patterns"] = patterns
        self.logger.info(f"Username patterns: {patterns}")

    def run(self):
        self.logger.info(f"[*] Email OSINT on {self.target}")
        if not self.validate():
            self.logger.error("Invalid email format")
            return {}
        self.mx_check()
        self.smtp_verify()
        self.pattern_analysis()
        print(json.dumps(self.results, indent=2))
        return self.results
