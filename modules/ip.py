#!/usr/bin/env python3
"""IP Geolocation & Reputation Module"""
import json
try:
    import urllib.request
except:
    pass

class IPRecon:
    def __init__(self, target, logger):
        self.target = target
        self.logger = logger
        self.results = {"ip": target}

    def geolocate(self):
        self.logger.info(f"[GEO] Geolocating {self.target}...")
        try:
            with urllib.request.urlopen(f"http://ip-api.com/json/{self.target}", timeout=5) as r:
                data = json.loads(r.read())
                if data.get("status") == "success":
                    for k in ["country","regionName","city","isp","org","as","lat","lon"]:
                        self.results[k] = data.get(k, "N/A")
                        self.logger.success(f"  {k}: {data.get(k,N/A)}")
        except Exception as e:
            self.logger.error(f"Geolocation failed: {e}")

    def reverse_dns(self):
        import socket
        self.logger.info(f"[RDNS] Reverse DNS lookup...")
        try:
            hostname = socket.gethostbyaddr(self.target)[0]
            self.results["hostname"] = hostname
            self.logger.success(f"  Hostname: {hostname}")
        except:
            self.logger.warning("  No reverse DNS found")

    def run(self):
        self.logger.info(f"[*] Starting IP recon on {self.target}")
        self.geolocate()
        self.reverse_dns()
        print("\n[+] Results:")
        print(json.dumps(self.results, indent=2))
        return self.results
