#!/usr/bin/env python3
"""WHOIS Lookup Module"""
import subprocess
import socket
import re

class WhoisLookup:
    def __init__(self, target: str, logger):
        self.target = target
        self.logger = logger

    def _parse_whois(self, raw: str) -> dict:
        fields = {}
        patterns = {
            "registrar": r"Registrar:\s*(.+)",
            "creation_date": r"Creation Date:\s*(.+)",
            "expiry_date": r"Registry Expiry Date:\s*(.+)",
            "name_servers": r"Name Server:\s*(.+)",
            "registrant_country": r"Registrant Country:\s*(.+)",
            "status": r"Domain Status:\s*(.+)",
        }
        for key, pattern in patterns.items():
            match = re.search(pattern, raw, re.IGNORECASE)
            if match:
                fields[key] = match.group(1).strip()
        return fields

    def run(self) -> dict:
        self.logger.info(f"[*] WHOIS lookup for {self.target}")
        results = {"target": self.target}
        try:
            proc = subprocess.run(["whois", self.target], capture_output=True, text=True, timeout=15)
            raw = proc.stdout
            parsed = self._parse_whois(raw)
            results.update(parsed)
            for k, v in parsed.items():
                self.logger.success(f"{k.replace(_,