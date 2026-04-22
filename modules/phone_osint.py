#!/usr/bin/env python3
"""Phone Number OSINT Module"""
import re

COUNTRY_CODES = {
    "+1": {"country": "USA/Canada", "format": "+1 (XXX) XXX-XXXX"},
    "+44": {"country": "United Kingdom", "format": "+44 XXXX XXXXXX"},
    "+33": {"country": "France", "format": "+33 X XX XX XX XX"},
    "+49": {"country": "Germany", "format": "+49 XXXX XXXXXXX"},
    "+966": {"country": "Saudi Arabia", "format": "+966 XX XXX XXXX"},
    "+971": {"country": "UAE", "format": "+971 XX XXX XXXX"},
    "+216": {"country": "Tunisia", "format": "+216 XX XXX XXX"},
    "+212": {"country": "Morocco", "format": "+212 XX XXX XXXX"},
    "+213": {"country": "Algeria", "format": "+213 XXX XXXXXXX"},
    "+20": {"country": "Egypt", "format": "+20 XX XXXX XXXX"},
    "+90": {"country": "Turkey", "format": "+90 XXX XXX XXXX"},
    "+86": {"country": "China", "format": "+86 XXX XXXX XXXX"},
    "+91": {"country": "India", "format": "+91 XXXXX XXXXX"},
}

class PhoneOSINT:
    def __init__(self, number: str, logger):
        self.number = number.strip()
        self.logger = logger
        self.results = {"number": self.number}

    def validate(self) -> bool:
        clean = re.sub(r"[\s\-\(\)]", "", self.number)
        valid = bool(re.match(r"^\+?[1-9]\d{6,14}$", clean))
        self.results["valid"] = valid
        self.logger.success(f"Format: {valid if valid else invalid}")
        return valid

    def get_country(self) -> dict:
        for code, info in sorted(COUNTRY_CODES.items(), key=lambda x: -len(x[0])):
            if self.number.startswith(code):
                self.results["country"] = info["country"]
                self.results["country_code"] = code
                self.logger.success(f"Country: {info[country]} ({code})")
                return info
        self.logger.warning("Country code not identified")
        return {}

    def analyze_number(self):
        clean = re.sub(r"[\s\-\(\)\+]", "", self.number)
        self.results["digits"] = len(clean)
        self.results["cleaned"] = clean
        if clean.startswith("1") and len(clean) == 11:
            self.results["number_type"] = "Mobile/Landline (North America)"
        elif len(clean) == 10:
            self.results["number_type"] = "Standard 10-digit"
        else:
            self.results["number_type"] = "International format"
        self.logger.success(f"Type: {self.results[number_type]}")
        self.logger.success(f"Digits: {self.results[digits]}")

    def run(self) -> dict:
        self.logger.info(f"[*] Phone OSINT: {self.number}")
        if not self.validate():
            return self.results
        self.get_country()
        self.analyze_number()
        self.logger.info("[+] Phone OSINT complete")
        return self.results
