#!/usr/bin/env python3
"""Empacota index.html + src/ em um único arquivo: dist/claudilife.html.

A ordem de carregamento vem das tags <script src> e <link rel=stylesheet>
de index.html (fonte única da verdade). Recursos externos (http/https)
ficam como estão. Uso:  python3 tools/build.py
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "index.html")
OUT = os.path.join(ROOT, "dist", "claudilife.html")


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read()


def main():
    html = read("index.html")

    def css(m):
        href = m.group(1)
        if href.startswith("http"):
            return m.group(0)
        return f"<style>/* {href} */\n{read(href)}</style>"

    def js(m):
        src = m.group(1)
        # "</script" dentro do código quebraria o HTML; escapamos por segurança
        code = read(src).replace("</script", "<\\/script")
        return f"<script>/* {src} */\n{code}</script>"

    html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', css, html)
    html = re.sub(r'<script src="([^"]+)"></script>', js, html)
    html = re.sub(r"<!-- Entrada de DESENVOLVIMENTO.*?-->", "<!-- ClaudiLife — build de arquivo único (gerado por tools/build.py) -->", html, flags=re.S)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"ok: {os.path.relpath(OUT, ROOT)} ({len(html)//1024} KB)")


if __name__ == "__main__":
    main()
