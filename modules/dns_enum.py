#!/usr/bin/env python3
"""DNS Enumeration & Subdomain Discovery"""
import socket, threading
from queue import Queue

class DNSEnum:
    def __init__(self, domain, wordlist, logger):
        self.domain = domain
        self.wordlist = wordlist
        self.logger = logger
        self.found = []
        self.queue = Queue()

    def _load_wordlist(self):
        defaults = ["www","mail","ftp","admin","api","dev","staging","vpn","remote",
                    "portal","blog","shop","app","test","beta","cdn","ns1","ns2"]
        try:
            with open(self.wordlist) as f:
                return [l.strip() for l in f if l.strip()]
        except:
            self.logger.warning(f"Wordlist not found, using defaults ({len(defaults)} words)")
            return defaults

    def _resolve(self, sub):
        host = f"{sub}.{self.domain}"
        try:
            ip = socket.gethostbyname(host)
            self.found.append((host, ip))
            self.logger.success(f"[FOUND] {host} -> {ip}")
        except:
            pass

    def _worker(self):
        while not self.queue.empty():
            sub = self.queue.get()
            self._resolve(sub)
            self.queue.task_done()

    def run(self):
        self.logger.info(f"[*] DNS Enumeration: {self.domain}")
        subs = self._load_wordlist()
        for s in subs:
            self.queue.put(s)
        threads = [threading.Thread(target=self._worker) for _ in range(30)]
        for t in threads: t.daemon=True; t.start()
        self.queue.join()
        self.logger.info(f"[*] Done. {len(self.found)} subdomains found.")
        return self.found
