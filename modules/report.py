#!/usr/bin/env python3
"""OSINT Report Generator"""
import json
from datetime import datetime

class ReportGenerator:
    def __init__(self, input_file, output, logger):
        self.input_file = input_file
        self.output = output
        self.logger = logger

    def run(self):
        try:
            with open(self.input_file) as f:
                data = json.load(f)
        except Exception as e:
            self.logger.error(f"Read failed: {e}"); return

        html = f"""<!DOCTYPE html>
<html><head><title>ShadowEye OSINT Report</title>
<style>
  body{{font-family:monospace;background:#0d1117;color:#c9d1d9;padding:2em}}
  h1{{color:#58a6ff}} h2{{color:#8b949e;border-bottom:1px solid #21262d;padding-bottom:6px}}
  pre{{background:#161b22;padding:1.2em;border-radius:8px;overflow-x:auto;color:#3fb950}}
  .badge{{background:#21262d;border-radius:12px;padding:2px 10px;font-size:.8em;margin:2px}}
  footer{{margin-top:2em;color:#484f58;font-size:.8em}}
</style></head>
<body>
<h1>👁️ ShadowEye OSINT Report</h1>
<p><span class="badge">Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</span>
<span class="badge">Author: Shadow Core</span></p>
<h2>Intelligence Data</h2>
<pre>{json.dumps(data, indent=2)}</pre>
<footer>ShadowEye v1.0 — For authorized security research only</footer>
</body></html>"""

        with open(self.output, "w") as f:
            f.write(html)
        self.logger.success(f"Report saved: {self.output}")
