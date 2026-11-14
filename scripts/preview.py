"""Dev helper: record docs/preview.html as docs/preview.webp, the animated preview in the README.
Usage (from the repo root, with a local server running: python3 -m http.server 4173):
  python3 scripts/preview.py
A fake clock steps the page exactly one frame at a time, so playback is smooth however slow the
machine is. Animated WebP is about a third the size of a GIF and keeps the glow smooth.
Needs Playwright and Pillow: pip install playwright pillow && python3 -m playwright install chromium"""
import io
from PIL import Image
from playwright.sync_api import sync_playwright

URL, OUT = 'http://localhost:4173/docs/preview.html', 'docs/preview.webp'
FPS, SECONDS, WARMUP = 15, 4, 2500        # skip the intro, then record a loop of the steady state

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 960, 'height': 500})
    pg.clock.install()
    pg.goto(URL)
    pg.evaluate('document.fonts.ready')
    pg.clock.run_for(WARMUP)
    frames = []
    for _ in range(FPS * SECONDS):
        pg.clock.run_for(1000 // FPS)
        frames.append(Image.open(io.BytesIO(pg.screenshot())).convert('RGB'))
    b.close()

frames[0].save(OUT, save_all=True, append_images=frames[1:], duration=1000 // FPS, loop=0, quality=75, method=6)
print('wrote', OUT)
