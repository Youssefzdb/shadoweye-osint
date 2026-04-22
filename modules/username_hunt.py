#!/usr/bin/env python3
"""Username Hunter — Check presence across platforms"""
import requests, threading
from queue import Queue

PLATFORMS = {
    "GitHub":       "https://github.com/{}",
    "Twitter/X":    "https://twitter.com/{}",
    "Instagram":    "https://www.instagram.com/{}",
    "Reddit":       "https://www.reddit.com/user/{}",
    "TikTok":       "https://www.tiktok.com/@{}",
    "LinkedIn":     "https://www.linkedin.com/in/{}",
    "HackerNews":   "https://news.ycombinator.com/user?id={}",
    "Medium":       "https://medium.com/@{}",
    "Dev.to":       "https://dev.to/{}",
    "Telegram":     "https://t.me/{}",
    "GitLab":       "https://gitlab.com/{}",
    "Pinterest":    "https://www.pinterest.com/{}",
    "YouTube":      "https://www.youtube.com/@{}",
    "Twitch":       "https://www.twitch.tv/{}",
    "Keybase":      "https://keybase.io/{}",
}

class UsernameHunt:
    def __init__(self, username, logger):
        self.username = username
        self.logger = logger
        self.found = []
        self.queue = Queue()

    def _check(self, platform, url):
        try:
            r = requests.get(url, timeout=5, allow_redirects=True,
                           headers={"User-Agent": "Mozilla/5.0"})
            if r.status_code == 200:
                self.found.append((platform, url))
                self.logger.success(f"[FOUND] {platform}: {url}")
            else:
                self.logger.info(f"[MISS]  {platform}: {r.status_code}")
        except Exception as e:
            self.logger.warning(f"[ERR]   {platform}: {e}")

    def _worker(self):
        while not self.queue.empty():
            platform, url = self.queue.get()
            self._check(platform, url)
            self.queue.task_done()

    def run(self):
        self.logger.info(f"[*] Hunting username: {self.username}")
        for platform, url_tpl in PLATFORMS.items():
            self.queue.put((platform, url_tpl.format(self.username)))
        threads = [threading.Thread(target=self._worker) for _ in range(10)]
        for t in threads: t.daemon=True; t.start()
        self.queue.join()
        self.logger.info(f"[*] Done. Found on {len(self.found)}/{len(PLATFORMS)} platforms.")
        return self.found
