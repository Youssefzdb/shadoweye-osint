#!/usr/bin/env python3
"""Username OSINT — Social Media Presence Detection"""
import json
try:
    import urllib.request
    import urllib.error
except:
    pass

PLATFORMS = {
    "GitHub":       "https://github.com/{}",
    "Twitter/X":    "https://twitter.com/{}",
    "Instagram":    "https://www.instagram.com/{}",
    "Reddit":       "https://www.reddit.com/user/{}",
    "TikTok":       "https://www.tiktok.com/@{}",
    "LinkedIn":     "https://www.linkedin.com/in/{}",
    "HackerNews":   "https://news.ycombinator.com/user?id={}",
    "Keybase":      "https://keybase.io/{}",
    "Dev.to":       "https://dev.to/{}",
    "Medium":       "https://medium.com/@{}",
    "Pastebin":     "https://pastebin.com/u/{}",
    "GitLab":       "https://gitlab.com/{}",
    "Bugcrowd":     "https://bugcrowd.com/{}",
    "HackerOne":    "https://hackerone.com/{}",
    "Tryhackme":    "https://tryhackme.com/p/{}",
}

class PersonLookup:
    def __init__(self, username, logger):
        self.username = username
        self.logger = logger
        self.found = []
        self.not_found = []

    def check_platform(self, name, url_template):
        url = url_template.format(self.username)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=5) as r:
                if r.status == 200:
                    self.found.append({"platform": name, "url": url})
                    self.logger.success(f"[FOUND] {name}: {url}")
        except urllib.error.HTTPError as e:
            if e.code != 404:
                self.logger.warning(f"[{name}] HTTP {e.code}")
        except Exception:
            pass

    def run(self):
        self.logger.info(f"[*] Searching username: {self.username} across {len(PLATFORMS)} platforms...")
        for name, url in PLATFORMS.items():
            self.check_platform(name, url)
        print(f"\n[+] Found {len(self.found)} profiles:")
        for p in self.found:
            print(f"  ✅ {p[platform]}: {p[url]}")
        return self.found
