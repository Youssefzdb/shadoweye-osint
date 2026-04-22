#!/usr/bin/env python3
"""IP Intelligence Module"""
import json, socket, urllib.request

class IPIntel:
    def __init__(self, target, logger):
        self.target = target
        self.logger = logger
        self.results = {"ip": target}

    def geolocate(self):
        self.logger.info(f"[GEO] Locating {self.target}...")
        try:
            with urllib.request.urlopen(
                f"http://ip-api.com/json/{self.target}?fields=status,country,regionName,city,isp,org,as,lat,lon,timezone,proxy,hosting",
                timeout=5) as r:
                data = json.loads(r.read())
                if data.get("status") == "success":
                    for k in ["country","regionName","city","isp","org","as","lat","lon","timezone","proxy","hosting"]:
                        self.results[k] = data.get(k)
                        self.logger.success(f"  {k}: {data.get(k)}")
        except Exception as e:
            self.logger.error(f"Geolocation failed: {e}")

    def rdns(self):
        try:
            host = socket.gethostbyaddr(self.target)[0]
            self.results["hostname"] = host
            self.logger.success(f"  rDNS: {host}")
        except:
            self.results["hostname"] = None

    def run(self):
        self.logger.info(f"[*] IP Intel on {self.target}")
        self.geolocate()
        self.rdns()
        print(json.dumps(self.results, indent=2))
        return self.results
