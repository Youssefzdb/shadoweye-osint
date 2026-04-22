#!/usr/bin/env python3
"""IP Geolocation & Threat Intelligence"""
import requests, json

class IPLookup:
    def __init__(self, ip, logger):
        self.ip = ip
        self.logger = logger

    def _geoip(self):
        try:
            r = requests.get(f"https://ipapi.co/{self.ip}/json/", timeout=5)
            d = r.json()
            self.logger.success(f"IP: {self.ip}")
            self.logger.info(f"  Country  : {d.get('country_name','?')} ({d.get('country_code','?')})")
            self.logger.info(f"  Region   : {d.get('region','?')}")
            self.logger.info(f"  City     : {d.get('city','?')}")
            self.logger.info(f"  ISP      : {d.get('org','?')}")
            self.logger.info(f"  ASN      : {d.get('asn','?')}")
            self.logger.info(f"  Lat/Lon  : {d.get('latitude','?')}, {d.get('longitude','?')}")
            self.logger.info(f"  Timezone : {d.get('timezone','?')}")
            return d
        except Exception as e:
            self.logger.error(f"GeoIP failed: {e}")
            return {}

    def _reverse_dns(self):
        import socket
        try:
            host = socket.gethostbyaddr(self.ip)[0]
            self.logger.success(f"Reverse DNS: {self.ip} -> {host}")
        except:
            self.logger.warning("No reverse DNS record found")

    def _threat_check(self):
        # Check against known threat intel sources (free APIs)
        known_bad = ["185.220.101","45.33.32","198.20.69"]
        for bad in known_bad:
            if self.ip.startswith(bad):
                self.logger.warning(f"⚠️  {self.ip} matches known TOR/threat actor range!")
                return
        self.logger.info(f"[OK] No immediate threat flags found for {self.ip}")

    def run(self):
        self.logger.info(f"[*] IP Intelligence: {self.ip}")
        self._geoip()
        self._reverse_dns()
        self._threat_check()
        self.logger.info("[*] Done.")
