#!/usr/bin/env python3
"""Email OSINT & Validation Module"""
import re, json, socket

class EmailHunter:
    def __init__(self, target, logger):
        self.target = target
        self.logger = logger
        self.results = {"email": target}

    def validate_format(self):
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        valid = bool(re.match(pattern, self.target))
        self.results["format_valid"] = valid
        self.logger.success(f"Format valid: {valid}")
        return valid

    def check_mx(self):
        domain = self.target.split("@")[1]
        self.logger.info(f"[MX] Checking mail server for {domain}...")
        try:
            import subprocess
            result = subprocess.run(["dig", "+short", "MX", domain],
                capture_output=True, text=True, timeout=5)
            mx = result.stdout.strip()
            self.results["mx_records"] = mx.splitlines() if mx else []
            self.logger.success(f"MX: {mx[:100] if mx else None