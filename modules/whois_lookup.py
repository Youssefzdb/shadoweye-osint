#!/usr/bin/env python3
"""WHOIS Lookup Module"""
import subprocess, json, re

class WhoisLookup:
    def __init__(self, target, logger):
        self.target = target
        self.logger = logger

    def parse_whois(self, raw):
        result = {}
        patterns = {
            "registrar": r"Registrar:\s*(.+)",
            "created": r"Creation Date:\s*(.+)",
            "expires": r"Registry Expiry Date:\s*(.+)",
            "updated": r"Updated Date:\s*(.+)",
            "status": r"Domain Status:\s*(.+)",
            "name_servers": r"Name Server:\s*(.+)",
            "org": r"Registrant Organization:\s*(.+)",
            "country": r"Registrant Country:\s*(.+)",
        }
        for key, pattern in patterns.items():
            matches = re.findall(pattern, raw, re.IGNORECASE)
            if matches:
                result[key] = matches[0].strip() if len(matches)==1 else [m.strip() for m in matches]
        return result

    def run(self):
        self.logger.info(f"[WHOIS] Looking up {self.target}...")
        try:
            out = subprocess.run(["whois", self.target],
                capture_output=True, text=True, timeout=15).stdout
            parsed = self.parse_whois(out)
            for k, v in parsed.items():
                self.logger.success(f"  {k}: {v}")
            print(json.dumps(parsed, indent=2))
            return parsed
        except Exception as e:
            self.logger.error(f"WHOIS failed: {e}")
            return {}
