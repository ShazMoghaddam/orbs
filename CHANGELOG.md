# Changelog

## Unreleased

Site only. `orb.js` and the npm package are unchanged.

- **Desk displays stay awake.** The display page and desk mode now ask again for the screen to stay on if the browser or the computer lets go (after sleep, on low battery), checking every 20 seconds. Before, they only asked when the page opened or the tab came back, so the screensaver could take over on a long run. Desk mode also asks again after you switch tabs and come back, and still lets go when you close it.

## 1.8.0 (2026-11-16)

- New shape, twenty-one in all: `layers`, four tall, slanted diamonds packed tightly so they overlap like stacked sheets. It faces you and rocks gently rather than spinning, so it always reads as drawn. A slow wave lights each layer in turn, and with sound each layer swells to its own part of the music, low notes first. Works in dots and lines, and joins the default cycle.
- The first release published to npm by GitHub Actions with trusted publishing, with a provenance statement linking it to its commit.
- Fix: `package-lock.json` now carries the package's real version.
- About 11.5 KB gzipped (up from 11.3 KB).

## 1.7.0 (2026-11-15)

- On npm: `npm install @shazmoghaddam/orbs`, then `import Orb from '@shazmoghaddam/orbs'`. Script tags and jsDelivr work as before.
- TypeScript types (`orb.d.ts`) for every option, shape, state, method and event.
- Safe to import during server rendering (Next.js, Nuxt and the like): the server gets a stand-in, and orbs are created in the browser.
- Studio: React and Vue cards in Get the code, filled in with your settings, plus Export, which saves your orb as a video (MP4 or WebM, 1080 px), an animated GIF, or a high-resolution PNG with an optional transparent background, in square, wide or tall frames.
- Fix: a shape asked for a single point no longer produces an invalid position.
- Repo: tests, a 12 KB gzip size budget and a built-file check in CI on every pull request; npm publishing from GitHub releases with trusted publishing; weekly Dependabot; SECURITY.md and CONTRIBUTING.md.
- About 11 KB gzipped, unchanged.

## 1.6.0 (2026-11-14)

- Named states: `orb.state('thinking')` picks a shape and pace together. Built in: `idle`, `listening`, `thinking`, `working`, `speaking`, `active`, `loading`, `success` and `error`. Add your own to `Orb.states`.
- New `data-state` attribute. Changing it later switches state, so React and Vue only need to set an attribute.
- New `orb:state` event, with the state and shape in `e.detail`.
- New `data-follow`: the orb leans gently towards the pointer.
- New `data-scroll-tilt`: the orb tilts as it scrolls through the page.
- Studio: state buttons on the Shape tab, and cursor and scroll switches on the Motion tab.
- About 11 KB gzipped (up from 10.5 KB).

## 1.5.0 (2026-11-14)

- Four new shapes, twenty in all: `vortex` (three arms spiralling into a funnel, for thinking), `blob` (a sphere that wobbles like liquid), `iris` (an eye with a breathing pupil, a glance and a blink, for listening) and `orbit` (four large, soft dots circling, for calm moments).
- New desk display: `display.html` shows one orb full screen on a spare iPad or monitor, keeps the screen awake, hides the cursor and drifts against burn-in. It takes the Studio's share settings, plus `sound=mic` to react to the room.
- Studio: "Preview in desk mode" opens your orb full screen, and Get the code has a Desk display card with a copyable link.
- New shape option `bigDots`, which sizes dots as a share of the orb's radius so large dots scale with it.
- About 10.5 KB gzipped (up from 9.5 KB).

## 1.4.0 (2026-11-14)

- New Studio on the demo site: pick a shape, style, colour, points, dot size, line thickness, glow, reflection, size, speed, tilt and cycling, try it with sound, then copy the HTML or JavaScript. Includes eight presets, a share link and Surprise me.
- New site design to match Bezel: Geist and Fraunces fonts and an orange and sand footer, signed "Designed by Shaz Moghaddam".
- New `orb.set({...})`: change any setting on a running orb without restarting it.
- New `data-tilt` (degrees), added to each shape's own tilt.
- New `orb:morph` event on the canvas after every morph, with the shape in `e.detail.shape`.
- New `Orb.init(root)` to start canvases added after the page loaded, for React, Vue and similar.
- New animated README preview (`docs/preview.webp`, 0.8 MB), replacing the 4.8 MB GIF of the old ten shapes.
- About 9.5 KB gzipped (up from 9 KB).

## 1.3.0 (2026-11-14)

- Orbs can now react to sound. `orb.listen()` takes an `<audio>` or `<video>`, a MediaStream, any Web Audio node, or `'mic'`; `orb.unlisten()` stops.
- New `data-audio="#player"`: react to a media element on the page once it plays, with no JavaScript.
- New `data-audio-amount`: how strongly an orb reacts.
- `bars` follows the actual frequencies, bass in the middle. Other shapes pulse with the volume and push out on the beat; flat marks only pulse.
- `orb.audio.level` and `orb.audio.bands` (16 values from bass to treble), plus `Orb.audioContext()`.
- New shape hook `audio(i, data, A, p, out)` for custom shapes.
- The microphone is analysed in the browser only, never played back, recorded or sent.
- Reduced motion turns sound reactions off.
- New example: `examples/audio.html`, with a demo beat made in the browser, a microphone button and a file picker.
- About 9 KB gzipped (up from 8 KB).

## 1.2.0 (2026-11-14)

- New lines style: `data-style="lines"` draws any shape as glowing vertical slices instead of dots. Solid shapes become sliced silhouettes, `bars` becomes a waveform, and rings, holes and marks keep their gaps.
- New `data-glow`: a soft glow behind the shape, blurred at quarter size to keep it cheap.
- New `data-reflect`: a faded mirror image that sits just under the shape.
- New `data-line`: line thickness for slices and connecting lines.
- New shape option `lineGap`, for tuning how the lines style joins dots.
- With the lines style, orbs use 320 points by default for fuller silhouettes.
- New example: `examples/lines.html`.
- About 8 KB gzipped (up from 6.5 KB). Glow and reflection are off unless you ask for them.

## 1.1.0 (2026-11-14)

- Six new shapes: `ripple` (listening), `bars` (speaking), `atom`, `infinity` (a loader with a pulse running round a figure of eight), and the status badges `check` and `cross`.
- `check` and `cross` share a dotted ring, so going from one to the other only redraws the mark. They are left out of the default cycle; morph to them yourself or list them in `data-shapes`.
- New shape options for `Orb.define`: `face` turns the orb to face the viewer instead of spinning, for flat marks, and `inCycle: false` leaves a shape out of the default cycle.
- The loader example now runs through listening, thinking, speaking, done and error.
- About 6.5 KB gzipped, up from 5.3 KB. Still one file with no dependencies.

## 1.0.3 (2026-10-26)

- Click mode (`data-click="morph"`), plus fixes to the cube and torus shapes.
