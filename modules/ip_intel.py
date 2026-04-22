#!/usr/bin/env python3
"""IP Intelligence & Geolocation Module"""
import socket
import urllib.request
import json

class IPIntel:
    def __init__(self, target: str, logger):
        self.target = target
        self.logger = logger
        self.results = {"target": target}

    def resolve(self) -> str:
        try:
            ip = socket.gethostbyname(self.target)
            self.results["resolved_ip"] = ip
            self.logger.success(f"Resolved: {self.target} -> {ip}")
            return ip
        except Exception:
            return self.target

    def geolocate(self, ip: str):
        self.logger.info(f"[*] Geolocating {ip}...")
        try:
            url = f"http://ip-api.com/json/{ip}?fields=status,country,regionName,city,isp,org,as,lat,lon,timezone,query"
            with urllib.request.urlopen(url, timeout=10) as resp:
                data = json.loads(resp.read().decode())
            if data.get("status") == "success":
                geo = {
                    "country": data.get("country"),
                    "region": data.get("regionName"),
                    "city": data.get("city"),
                    "isp": data.get("isp"),
                    "org": data.get("org"),
                    "asn": data.get("as"),
                    "lat": data.get("lat"),
                    "lon": data.get("lon"),
                    "timezone": data.get("timezone"),
                }
                self.results["geolocation"] = geo
                for k, v in geo.items():
                    if v:
                        self.logger.success(f"{k.title()}: {v}")
        except Exception as e:
            self.logger.warning(f"Geolocation failed: {e}")

    def reverse_dns(self, ip: str):
        try:
            hostname = socket.gethostbyaddr(ip)[0]
            self.results["reverse_dns"] = hostname
            self.logger.success(f"Reverse DNS: {hostname}")
        except:
            self.logger.warning("No reverse DNS record")

    def port_check(self, ip: str):
        common_ports = [21, 22, 23, 25, 53, 80, 110, 143, 443, 3306, 3389, 8080]
        open_ports = []
        self.logger.info(f"[*] Quick port check on {ip}...")
        for port in common_ports:
            try:
                s = socket.socket()
                s.settimeout(0.8)
                if s.connect_ex((ip, port)) == 0:
                    open_ports.append(port)
                    self.logger.success(f"Port {port} OPEN")
                s.close()
            except:
                pass
        self.results["open_ports"] = open_ports
        return open_ports

    def run(self) -> dict:
        self.logger.info(f"[*] IP Intelligence: {self.target}")
        ip = self.resolve()
        self.geolocate(ip)
        self.reverse_dns(ip)
        self.port_check(ip)
        self.logger.info("[+] IP Intel complete")
        return self.results
