# Changelog

## 1.1.0 (2026-11-14)

- Six new shapes: `ripple` (listening), `bars` (speaking), `atom`, `infinity` (a loader with a pulse running round a figure of eight), and the status badges `check` and `cross`.
- `check` and `cross` share a dotted ring, so going from one to the other only redraws the mark. They are left out of the default cycle; morph to them yourself or list them in `data-shapes`.
- New shape options for `Orb.define`: `face` turns the orb to face the viewer instead of spinning, for flat marks, and `inCycle: false` leaves a shape out of the default cycle.
- The loader example now runs through listening, thinking, speaking, done and error.
- About 6.5 KB gzipped, up from 5.3 KB. Still one file with no dependencies.

## 1.0.3 (2026-10-26)

- Click mode (`data-click="morph"`), plus fixes to the cube and torus shapes.
