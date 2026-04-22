#!/usr/bin/env python3
"""OSINT Report Generator"""
from datetime import datetime

class OSINTReport:
    def __init__(self, results):
        self.results = results

    def save(self, filename):
        domain_html = ""
        if "domain" in self.results:
            d = self.results["domain"]
            subs = "".join(f"<li>{s['subdomain']} -> {s['ip']}</li>" for s in d.get("subdomains", []))
            domain_html = f"<div class='card'><h2>Domain: {d.get('target','')}</h2><p>DNS: {d.get('dns',{})}</p><ul>{subs}</ul></div>"

        username_html = ""
        if "username" in self.results:
            rows = "".join(
                f"<tr><td>{p['platform']}</td><td><a href='{p['url']}'>{p['url']}</a></td><td class='{'found' if p['status']=='FOUND' else ''}'>{p['status']}</td></tr>"
                for p in self.results["username"]
            )
            username_html = f"<div class='card'><h2>Username Lookup</h2><table><tr><th>Platform</th><th>URL</th><th>Status</th></tr>{rows}</table></div>"

        html = f"""<!DOCTYPE html>
<html><head><title>ShadowEye OSINT Report</title>
<style>
body{{font-family:Arial;background:#0d1117;color:#c9d1d9;padding:20px}}
h1{{color:#58a6ff}} h2{{color:#79c0ff}}
.card{{background:#161b22;border-radius:8px;padding:15px;margin:10px 0;border:1px solid #30363d}}
table{{width:100%;border-collapse:collapse}} td,th{{padding:8px;border:1px solid #30363d}}
th{{background:#21262d}} .found{{color:#3fb950}} a{{color:#58a6ff}}
</style></head>
<body>
<h1>ShadowEye OSINT Report</h1>
<p>{datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
{domain_html}
{username_html}
</body></html>"""
        with open(filename, "w") as f:
            f.write(html)
        print(f"[+] Report: {filename}")
