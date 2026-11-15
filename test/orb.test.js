// Run with: npm test (Node's built-in test runner, no extra packages).
// Orbs draws in the browser, so these tests give it a minimal window and check the parts that
// don't need a screen: every shape, every state, the server fallback and the TypeScript names.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const src = fs.readFileSync(path.join(__dirname, '..', 'orb.js'), 'utf8');

// Load orb.js in a fresh context, with or without a browser-like window.
function load(withWindow) {
  const module = { exports: {} };
  const ctx = { module, Math, Object, Array, Float32Array, Uint8Array, Map, Promise, isNaN, Error, String, Number };
  if (withWindow) {
    const document = { readyState: 'complete', querySelectorAll: () => [], addEventListener() {}, documentElement: { addEventListener() {} } };
    ctx.window = { document, matchMedia: () => ({ matches: false }), addEventListener() {} };
    ctx.document = document;
  }
  vm.runInNewContext(src, ctx);
  return module.exports;
}

const Orb = load(true);
const shapes = Object.keys(Orb.shapes);

test('there are twenty shapes', () => {
  assert.strictEqual(shapes.length, 20);
});

test('every shape builds exactly n finite points, near the unit sphere', () => {
  for (const name of shapes) {
    for (const n of [8, 40, 70, 180, 320, 600]) {
      const d = Orb.shapes[name].build(n);
      assert.strictEqual(d.pts.length, n, `${name} with ${n} points`);
      for (const p of d.pts) {
        assert.ok(p.every(Number.isFinite), `${name}: a point is not a number`);
        assert.ok(Math.hypot(...p) < 1.2, `${name}: a point sits far outside the orb`);
      }
    }
  }
});

test('live motion stays finite over time', () => {
  for (const name of shapes) {
    const s = Orb.shapes[name], d = s.build(180), out = [0, 0, 0];
    if (!s.deform) continue;
    for (const t of [0, 0.37, 2.5, 11, 60]) {
      for (let i = 0; i < 180; i += 7) {
        s.deform(i, d, t, d.pts[i], out);
        assert.ok(out.every(Number.isFinite), `${name} at t=${t}`);
      }
    }
  }
});

test('every named state points at a real shape', () => {
  const states = Object.keys(Orb.states);
  assert.deepStrictEqual(states, ['idle', 'listening', 'thinking', 'working', 'speaking', 'active', 'loading', 'success', 'error']);
  for (const k of states) assert.ok(Orb.shapes[Orb.states[k].shape], `${k} -> ${Orb.states[k].shape}`);
});

test('the status badges stay out of the default cycle', () => {
  assert.strictEqual(Orb.shapes.check.inCycle, false);
  assert.strictEqual(Orb.shapes.cross.inCycle, false);
});

test('importing on a server gives a safe stand-in', () => {
  const Stub = load(false);
  assert.strictEqual(typeof Stub, 'function');
  assert.deepStrictEqual(Object.keys(Stub.shapes), []);
  assert.throws(() => new Stub(), /browser/);
});

test('the TypeScript types list every shape and state', () => {
  const dts = fs.readFileSync(path.join(__dirname, '..', 'orb.d.ts'), 'utf8');
  for (const name of shapes) assert.ok(dts.includes(`'${name}'`), `orb.d.ts is missing the shape ${name}`);
  for (const name of Object.keys(Orb.states)) assert.ok(dts.includes(`'${name}'`), `orb.d.ts is missing the state ${name}`);
});
