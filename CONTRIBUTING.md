# Contributing to Orbs

Thanks for helping. Bug reports, new shapes, new states and Studio ideas are all welcome.

## Setup

```sh
npm install
npm run serve   # then open http://localhost:4173/
npm run check   # build, tests and the size budget
```

There's no build step for development: the site and examples load `orb.js` directly. Run `npm run build` before you commit, so `orb.min.js` matches `orb.js`. CI checks this.

## Adding a shape

1. Add it with `define('name', { ... })` in `orb.js`, next to shapes with a similar job. `build(n)` must return exactly `n` points inside the unit sphere, for any `n`, including very small ones.
2. Give it live motion with `deform`, and set `tilt`, `spin`, `face`, `size` and `alpha` as it needs. The list of hooks is at the top of the Shapes section in `orb.js`.
3. Check it as dots and as lines, with glow on and off, at 56 px and at 400 px, and morph into and out of it from a few very different shapes.
4. Add its name to the `ShapeName` type in `orb.d.ts`, a row to the Shapes table in the README, and a line to the CHANGELOG. The tests check that every shape builds correctly and is listed in the types.

## Adding a named state

Add an entry to `STATES` in `orb.js` with a `shape` and, if it needs one, a `speed`. Add it to the `StateName` type in `orb.d.ts`, the Named states table in the README, and the list in `test/orb.test.js`.

## The website

`index.html` with `site/site.css` and `site/site.js` is the Studio and demo; `display.html` is the desk display. Both use only the public API (`new Orb`, `set`, `morph`, `state`, `listen`), so they double as working examples of it. Anything the Studio can do should show up in its copyable code.

## Guidelines

- No runtime dependencies. The library stays one file.
- Respect `prefers-reduced-motion`: a still frame, instant morphs, no sound reactions and no cursor lean.
- Orbs are decorative. Keep `aria-hidden="true"` on the canvas in examples, with any status text beside it.
- Treat anything from a link or an attribute as untrusted: check it against what it may be before using it.
- Check new work at phone, tablet and desktop widths.
- Keep `orb.min.js` within the gzip budget in `scripts/size.mjs`.
- Run `npm run check` before opening a pull request.
