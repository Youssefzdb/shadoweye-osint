#!/usr/bin/env python3
"""OSINT Report Generator"""
import json
from datetime import datetime

class OSINTReport:
    def __init__(self, input_file, output, logger):
        self.input_file = input_file
        self.output = output
        self.logger = logger

    def run(self):
        try:
            with open(self.input_file) as f:
                data = json.load(f)
        except Exception as e:
            self.logger.error(f"Failed to read: {e}")
            return

        html = f"""<!DOCTYPE html>
<html><head><title>ShadowEye OSINT Report</title>
<style>
body{{font-family:monospace;background:#0d1117;color:#58a6ff;padding:2em}}
h1{{color:#ff4444}} h2{{color:#aaa;border-bottom:1px solid #333;padding-bottom:4px}}
pre{{background:#161b22;padding:1em;border-radius:6px;overflow-x:auto}}
.found{{color:#3fb950}} .meta{{color:#8b949e;font-size:.85em}}
</style></head>
<body>
<h1>👁️ ShadowEye OSINT Report</h1>
<p class="meta">Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} | Author: Shadow Core</p>
<h2>Intelligence Data</h2>
<pre>{json.dumps(data, indent=2)}</pre>
<hr><p class="meta">ShadowEye v1.0 — For authorized use only</p>
</body></html>"""

        with open(self.output, "w") as f:
            f.write(html)
        self.logger.success(f"[+] Report saved: {self.output}")
