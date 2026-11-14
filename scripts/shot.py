"""Dev helper: screenshot a local page with headless Chromium, at 2x for sharp images.
Usage (from the repo root, with a local server running: python3 -m http.server 4173):
  python3 scripts/shot.py http://localhost:4173/docs/social.html docs/social-preview.png 1280 640
  python3 scripts/shot.py http://localhost:4173/docs/banner.html docs/banner.png 1280 400
Needs Playwright: pip install playwright && python3 -m playwright install chromium"""
import sys
from playwright.sync_api import sync_playwright

url, out = sys.argv[1], sys.argv[2]
w = int(sys.argv[3]) if len(sys.argv) > 3 else 1280
h = int(sys.argv[4]) if len(sys.argv) > 4 else 640
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=2)
    logs = []
    pg.on('pageerror', lambda e: logs.append(f'pageerror: {e}'))
    pg.goto(url)
    pg.evaluate('document.fonts.ready')
    pg.wait_for_timeout(3500)   # let the orbs finish their intro morph
    pg.screenshot(path=out)
    for l in logs: print(l)
    b.close()
