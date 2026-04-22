#!/usr/bin/env python3
"""Username Lookup - Check username across major platforms"""
import requests

PLATFORMS = {
    "GitHub": "https://github.com/{username}",
    "Twitter/X": "https://twitter.com/{username}",
    "Instagram": "https://instagram.com/{username}",
    "Reddit": "https://reddit.com/user/{username}",
    "LinkedIn": "https://linkedin.com/in/{username}",
    "HackerNews": "https://news.ycombinator.com/user?id={username}",
    "Dev.to": "https://dev.to/{username}",
    "Medium": "https://medium.com/@{username}",
}

class UsernameLookup:
    def __init__(self, username):
        self.username = username

    def lookup(self):
        results = []
        headers = {"User-Agent": "Mozilla/5.0"}
        for platform, url_template in PLATFORMS.items():
            url = url_template.format(username=self.username)
            try:
                r = requests.get(url, headers=headers, timeout=5, allow_redirects=True)
                if r.status_code == 200:
                    results.append({"platform": platform, "url": url, "status": "FOUND"})
                    print(f"[+] Found on {platform}: {url}")
                else:
                    results.append({"platform": platform, "url": url, "status": "NOT FOUND"})
            except:
                results.append({"platform": platform, "url": url, "status": "ERROR"})
        return results
