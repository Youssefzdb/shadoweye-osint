#!/usr/bin/env python3
"""Web Recon & Technology Fingerprinting"""
import requests, re
from urllib.parse import urlparse

class WebRecon:
    def __init__(self, url, logger):
        self.url = url if url.startswith("http") else "https://" + url
        self.logger = logger
        self.headers = {}

    def _fetch(self):
        try:
            r = requests.get(self.url, timeout=10,
                           headers={"User-Agent": "Mozilla/5.0 (ShadowEye OSINT)"},
                           allow_redirects=True)
            self.headers = dict(r.headers)
            self.html = r.text
            self.logger.success(f"Connected [{r.status_code}] -> {r.url}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to fetch {self.url}: {e}")
            return False

    def _analyze_headers(self):
        interesting = ["Server","X-Powered-By","X-Generator","CF-RAY",
                      "X-AspNet-Version","X-Frame-Options","Content-Security-Policy",
                      "Strict-Transport-Security","X-Content-Type-Options"]
        self.logger.info("--- HTTP Headers ---")
        for h in interesting:
            if h in self.headers:
                self.logger.success(f"  {h}: {self.headers[h]}")

    def _fingerprint_tech(self):
        tech = []
        checks = {
            "WordPress":  r"wp-content|wp-includes",
            "React":      r"__react|ReactDOM|react.min.js",
            "Angular":    r"ng-version|angular.min.js",
            "Vue.js":     r"vue.min.js|__vue__",
            "jQuery":     r"jquery[-\./]",
            "Bootstrap":  r"bootstrap.min.css|bootstrap.min.js",
            "Laravel":    r"laravel_session|Laravel",
            "Django":     r"csrfmiddlewaretoken|django",
            "Next.js":    r"__NEXT_DATA__|_next/static",
            "Cloudflare": r"CF-RAY|__cf_bm",
        }
        for tech_name, pattern in checks.items():
            text = self.html + str(self.headers)
            if re.search(pattern, text, re.IGNORECASE):
                tech.append(tech_name)
                self.logger.success(f"  [DETECTED] {tech_name}")
        if not tech:
            self.logger.info("  No common frameworks detected")

    def run(self):
        self.logger.info(f"[*] Web Recon: {self.url}")
        if not self._fetch(): return
        self._analyze_headers()
        self.logger.info("--- Technology Fingerprint ---")
        self._fingerprint_tech()
        self.logger.info("[*] Done.")
