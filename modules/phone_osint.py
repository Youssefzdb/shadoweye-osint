#!/usr/bin/env python3
"""Phone Number OSINT Module"""
import re, json

COUNTRY_CODES = {
    "1": {"country": "USA/Canada", "flag": "🇺🇸"},
    "44": {"country": "United Kingdom", "flag": "🇬🇧"},
    "33": {"country": "France", "flag": "🇫🇷"},
    "49": {"country": "Germany", "flag": "🇩🇪"},
    "7": {"country": "Russia", "flag": "🇷🇺"},
    "86": {"country": "China", "flag": "🇨🇳"},
    "91": {"country": "India", "flag": "🇮🇳"},
    "55": {"country": "Brazil", "flag": "🇧🇷"},
    "34": {"country": "Spain", "flag": "🇪🇸"},
    "39": {"country": "Italy", "flag": "🇮🇹"},
    "966": {"country": "Saudi Arabia", "flag": "🇸🇦"},
    "971": {"country": "UAE", "flag": "🇦🇪"},
    "216": {"country": "Tunisia", "flag": "🇹🇳"},
    "212": {"country": "Morocco", "flag": "🇲🇦"},
    "213": {"country": "Algeria", "flag": "🇩🇿"},
    "20": {"country": "Egypt", "flag": "🇪🇬"},
}

class PhoneOSINT:
    def __init__(self, number, logger):
        self.number = re.sub(r"[\s\-\(\)]", "", number)
        self.logger = logger
        self.results = {"original": number, "cleaned": self.number}

    def parse_number(self):
        num = self.number.lstrip("+")
        for code_len in [3, 2, 1]:
            code = num[:code_len]
            if code in COUNTRY_CODES:
                info = COUNTRY_CODES[code]
                self.results["country_code"] = "+" + code
                self.results["country"] = info["country"]
                self.results["flag"] = info["flag"]
                self.results["local_number"] = num[code_len:]
                self.logger.success(f"Country: {info[flag]} {info[country]}")
                self.logger.success(f"Code: +{code} | Local: {num[code_len:]}")
                return
        self.logger.warning("Country code not found in database")

    def validate_format(self):
        valid = bool(re.match(r"^\+?[1-9]\d{7,14}$", self.number))
        self.results["valid_format"] = valid
        self.logger.info(f"Format valid: {valid}")

    def run(self):
        self.logger.info(f"[*] Phone OSINT on {self.number}")
        self.validate_format()
        self.parse_number()
        print(json.dumps(self.results, indent=2))
        return self.results
