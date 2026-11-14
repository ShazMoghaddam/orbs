/*!
 * Orbs v1.5.0 · dot-formation animations on <canvas>. Zero dependencies. MIT.
 * https://github.com/ShazMoghaddam/orbs · Shaz Moghaddam
 *
 * Usage:
 *   <canvas data-orb="sphere" aria-hidden="true"></canvas>
 *   <script src="orb.js" defer></script>   (or inline it)
 *
 * Shapes: sphere, wave, spikes, constellation, torus, helix, galaxy, ticks, cube, clusters,
 *         ripple, bars, atom, infinity, vortex, blob, iris, orbit, check, cross
 *
 * Attributes (all optional):
 *   data-orb          first shape                     (default sphere)
 *   data-points       number of dots                  (default 180, or 320 with lines)
 *   data-speed        base rotation, radians/second   (default 0.35)
 *   data-dot          dot radius in CSS px            (default 1.2)
 *   data-cycle        ms between auto-morphs, 0 = off (default 0)
 *   data-shapes       comma list to cycle through     (default all except check and cross)
 *   data-hover        "morph" to change shape on hover/tap
 *   data-click        "morph" to change shape only on click/tap (put the canvas in a <button> for keyboard users)
 *   data-theme-morph  morph when <body data-theme> changes
 *   data-style        "dots" or "lines" (glowing vertical slices) (default dots)
 *   data-line         line thickness in CSS px, for slices and connecting lines
 *   data-glow         soft glow behind the shape; a number sets its size in px (default 8)
 *   data-reflect      faded mirror image underneath; a number sets its opacity (default 0.35)
 *   data-audio        CSS selector of an <audio> or <video> to react to once it plays
 *   data-audio-amount how strongly it reacts                 (default 1)
 *   data-tilt         extra tilt in degrees, -90 to 90            (default 0)
 *
 * Colour comes from the canvas's CSS `color` and fades on theme change.
 * JS:  var o = new Orb(canvas, {...}); o.morph('torus'); o.next(); o.destroy();
 *      o.listen(audioEl | mediaStream | audioNode | 'mic'); o.unlisten();
 *      o.set({ style: 'lines', glow: 10, speed: 0.6 });   change settings while it runs
 *      canvas.addEventListener('orb:morph', e => e.detail.shape);   fires on every morph
 *      Orb.init(root);   start any <canvas data-orb> added after the page loaded
 *      Orb.define('myshape', { build: function (n) { return { pts: [...] }; } });
 */
(function (global) {
  'use strict';

  var TAU = Math.PI * 2;
  var GOLDEN = Math.PI * (3 - Math.sqrt(5));
  var reduceMQ = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  /* ── Small helpers ── */
  function sample(pts, n) {                       // n evenly spaced items, so every shape has the same count
    var out = [];
    for (var i = 0; i < n; i++) out.push(pts[Math.floor(i * pts.length / n)].slice());
    return out;
  }
  function rng(seed) {                            // seeded, so shapes look the same on every load
    var s = seed;
    return function () { s = (s * 16807) % 2147483647; return s / 2147483647; };
  }
  function gauss(r) { return (r() + r() + r() - 1.5) / 1.5; }   // soft bell, range -1..1
  function fib(n) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      var y = 1 - (i / (n - 1)) * 2, k = Math.sqrt(1 - y * y), t = GOLDEN * i;
      pts.push([Math.cos(t) * k, y, Math.sin(t) * k]);
    }
    return pts;
  }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function parseRGB(str) {
    var m = str && str.match(/[\d.]+/g);
    return m ? [+m[0], +m[1], +m[2]] : [222, 218, 210];
  }
  function amount(v, def) {                       // attribute present or true -> def; a number -> that; absent, false or 0 -> off
    if (v == null || v === false || v === 'false') return 0;
    if (v === true || v === '') return def;
    return isNaN(+v) ? def : +v;
  }
  function val(v, i, d, t, p) { return typeof v === 'function' ? v(i, d, t, p) : (v == null ? 1 : v); }

  /*
   * ── Shapes ──
   * build(n)  -> { pts:[[x,y,z]...], meta?, edges?:[[i,j]...], ... }   positions inside the unit sphere
   * Optional per-shape character:
   *   tilt, spin        camera tilt (rad) and rotation multiplier
   *   deform(i,d,t,p,o) live motion: write a displaced copy of p into o
   *   dash(i,d,t,p)     >0 draws a radial stroke of that length instead of a dot
   *   size, alpha       number or function(i,d,t,p) multiplier per dot
   *   edgeAlpha         opacity of the lines listed in edges
   *   face              turn to face the viewer instead of spinning (for flat marks)
   *   inCycle           false keeps the shape out of the default cycle
   *   audio(i,d,A,p,o)  react to sound: write a moved copy of p into o. A has bands[16] and level, 0..1
   *   bigDots           size is a percentage of the orb's radius rather than pixels, for large soft dots
   *   lineGap           in the lines style, the widest gap (in radii) still joined into one line (default 0.45)
   */
  var SHAPES = {};
  function define(name, def) { SHAPES[name] = def; }

  // The classic: even dots on a sphere.
  define('sphere', { build: function (n) { return { pts: fib(n) }; } });

  // Liquid surface, like a voice assistant listening.
  define('wave', {
    build: function (n) { return { pts: fib(n) }; },
    deform: function (i, d, t, p, o) {
      var k = 1 + 0.17 * Math.sin(p[1] * 3.2 + t * 2.1) * Math.cos(3 * Math.atan2(p[2], p[0]) + t * 1.3)
                + 0.04 * Math.sin(t * 1.8);
      o[0] = p[0] * k; o[1] = p[1] * k; o[2] = p[2] * k;
    },
    alpha: function (i, d, t, p) {
      return 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(p[1] * 3.2 + t * 2.1) * Math.cos(3 * Math.atan2(p[2], p[0]) + t * 1.3));
    }
  });

  // Every dot becomes a spike whose length ripples across the surface.
  define('spikes', {
    build: function (n) { return { pts: fib(n) }; },
    size: 0.75,
    dash: function (i, d, t, p) {
      var s = (Math.sin(p[0] * 3.1 + t * 2.3) + Math.sin(p[1] * 4.3 - t * 1.7) + Math.sin(p[2] * 3.7 + t * 1.1)) / 3;
      var v = (s + 1) / 2;
      return 0.02 + 0.22 * v * v * v;
    }
  });

  // A network graph: bright nodes, each linked to its two nearest neighbours, twinkling.
  define('constellation', {
    build: function (n) {
      var r = rng(11), slots = Math.max(16, Math.round(n / 7)), nodes = [], pts = [], meta = [], rep = [];
      for (var s = 0; s < slots; s++) {
        var u = r() * 2 - 1, a = r() * TAU, k = Math.sqrt(1 - u * u), rad = 0.62 + r() * 0.38;
        nodes.push([Math.cos(a) * k * rad, u * rad, Math.sin(a) * k * rad]);
        meta.push(r() * TAU);
      }
      for (var i = 0; i < n; i++) {               // several dots stack on each node, so nodes read as stars
        var q = Math.floor(i * slots / n);
        if (rep[q] === undefined) rep[q] = i;
        pts.push(nodes[q].slice());
      }
      var edges = [], seen = {};
      for (s = 0; s < slots; s++) {
        var dist = [];
        for (var j = 0; j < slots; j++) if (j !== s) {
          var dx = nodes[s][0] - nodes[j][0], dy = nodes[s][1] - nodes[j][1], dz = nodes[s][2] - nodes[j][2];
          dist.push([dx * dx + dy * dy + dz * dz, j]);
        }
        dist.sort(function (a, b) { return a[0] - b[0]; });
        for (var e = 0; e < 2; e++) {
          var o = dist[e][1], key = Math.min(s, o) + '-' + Math.max(s, o);
          if (!seen[key]) { seen[key] = 1; edges.push([rep[s], rep[o]]); }
        }
      }
      return { pts: pts, edges: edges, phase: meta, slots: slots, n: n };
    },
    size: 1.25,
    edgeAlpha: 0.4,
    alpha: function (i, d, t) { return 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.2 + d.phase[Math.floor(i * d.slots / d.n)])); }
  });

  // A donut seen almost face-on, so in the hero it still reads as an "o". Its surface rolls.
  define('torus', {
    tilt: 1.1,
    spin: 0.6,
    build: function (n) {
      // Full rings only, so the surface has no gaps; spare dots double up on the first ring.
      var rows = Math.max(6, Math.round(Math.sqrt(n / 4))), cols = Math.max(3, Math.floor(n / rows)), pts = [];
      for (var a = 0; a < cols; a++) for (var b = 0; b < rows; b++) {
        var u = a / cols * TAU, v = b / rows * TAU + a * 0.25;
        pts.push([(0.68 + 0.27 * Math.cos(v)) * Math.cos(u), 0.27 * Math.sin(v), (0.68 + 0.27 * Math.cos(v)) * Math.sin(u)]);
      }
      for (var i = 0; pts.length < n; i++) pts.push(pts[i % rows].slice());
      return { pts: pts.slice(0, n) };
    },
    deform: function (i, d, t, p, o) {            // rotate each dot around the tube, so the surface flows inside-out
      var u = Math.atan2(p[2], p[0]), cu = Math.cos(u), su = Math.sin(u);
      var rad = p[0] * cu + p[2] * su - 0.68, a = t * 1.1, ca = Math.cos(a), sa = Math.sin(a);
      var r2 = rad * ca - p[1] * sa, y2 = rad * sa + p[1] * ca;
      o[0] = (0.68 + r2) * cu; o[1] = y2; o[2] = (0.68 + r2) * su;
    }
  });

  // Double helix with rungs, side-on and turning faster.
  define('helix', {
    tilt: 0.12,
    spin: 1.7,
    edgeAlpha: 0.5,
    build: function (n) {
      var pts = [], edges = [], half = Math.max(2, Math.floor(n / 2));
      for (var i = 0; i < n; i++) {
        var k = Math.floor(i / 2), s = i % 2, f = Math.min(1, k / (half - 1));
        var a = f * TAU * 1.6 + s * Math.PI;
        pts.push([Math.cos(a) * 0.42, f * 1.8 - 0.9, Math.sin(a) * 0.42]);
        if (s === 1 && k % 3 === 0) edges.push([i - 1, i]);
      }
      return { pts: pts, edges: edges };
    }
  });

  // Three spiral arms, dense bright core, arms gently swaying.
  define('galaxy', {
    tilt: 1.0,
    spin: 0.7,
    build: function (n) {
      var r = rng(5), pts = [], dist = [];
      for (var i = 0; i < n; i++) {
        var d = Math.pow(r(), 0.65) * 0.95, a = (i % 3) * TAU / 3 + d * 4.2 + gauss(r) * 0.4 * (1 - d * 0.4);
        pts.push([Math.cos(a) * d, gauss(r) * 0.07 * (1 - d), Math.sin(a) * d]);
        dist.push(d);
      }
      return { pts: pts, dist: dist };
    },
    size: function (i, d) { return 1.5 - d.dist[i] * 0.9; },
    deform: function (i, d, t, p, o) {
      var a = 0.35 * Math.sin(t * 0.8) * (1 - d.dist[i]), c = Math.cos(a), s = Math.sin(a);
      o[0] = p[0] * c - p[2] * s; o[1] = p[1]; o[2] = p[0] * s + p[2] * c;
    }
  });

  // Loader ring: short radial dashes, a bright pulse chasing round.
  define('ticks', {
    tilt: 1.42,
    spin: 0.25,
    build: function (n) {
      var slots = Math.max(36, Math.min(64, Math.round(n / 3))), pts = [], ang = [];
      for (var i = 0; i < n; i++) {
        var a = Math.floor(i * slots / n) / slots * TAU;
        pts.push([Math.cos(a) * 0.8, 0, Math.sin(a) * 0.8]);
        ang.push(a);
      }
      return { pts: pts, ang: ang };
    },
    size: 0.7,
    dash: function (i, d, t) { var w = 0.5 + 0.5 * Math.sin(d.ang[i] * 2 - t * 3); return 0.05 + 0.2 * w * w * w * w; },
    alpha: function (i, d, t) { var w = 0.5 + 0.5 * Math.sin(d.ang[i] * 2 - t * 3); return 0.3 + 0.7 * w; }
  });

  // Wireframe cube made of dots: the one hard-edged shape, which makes the morphs into it satisfying.
  // Every edge gets the same number of evenly spaced dots; any spare dots double up on the corners.
  define('cube', {
    tilt: 0.62,
    spin: 0.8,
    build: function (n) {
      var c = 0.55, V = [], E = [], pts = [];
      for (var x = -1; x <= 1; x += 2) for (var y = -1; y <= 1; y += 2) for (var z = -1; z <= 1; z += 2) V.push([x * c, y * c, z * c]);
      for (var a = 0; a < 8; a++) for (var b = a + 1; b < 8; b++) {
        var diff = (V[a][0] !== V[b][0]) + (V[a][1] !== V[b][1]) + (V[a][2] !== V[b][2]);
        if (diff === 1) E.push([V[a], V[b]]);
      }
      var k = Math.max(1, Math.floor((n - 8) / 12));      // dots between corners on each edge
      for (var i = 0; i < 8; i++) pts.push(V[i].slice());
      E.forEach(function (e) {
        for (var j = 1; j <= k; j++) {
          var f = j / (k + 1);
          pts.push([e[0][0] + (e[1][0] - e[0][0]) * f, e[0][1] + (e[1][1] - e[0][1]) * f, e[0][2] + (e[1][2] - e[0][2]) * f]);
        }
      });
      for (i = 0; pts.length < n; i++) pts.push(V[i % 8].slice());
      return { pts: pts.slice(0, n) };
    }
  });

  // k-means, literally: four clusters breathing, members linked to their centroid.
  define('clusters', {
    spin: 0.6,
    edgeAlpha: 0.24,
    build: function (n) {
      var r = rng(23), C = [[0.55, 0.42, 0.1], [-0.6, 0.28, -0.25], [0.08, -0.58, 0.45], [-0.15, -0.2, -0.65]];
      var pts = [], cl = [], edges = [];
      for (var i = 0; i < n; i++) {
        var c = i % 4, q = C[c];
        if (i < 4) pts.push(q.slice());
        else {
          pts.push([q[0] + gauss(r) * 0.42, q[1] + gauss(r) * 0.42, q[2] + gauss(r) * 0.42]);
          if (i % 2 === 0) edges.push([c, i]);
        }
        cl.push(c);
      }
      return { pts: pts, edges: edges, cl: cl, C: C };
    },
    size: function (i) { return i < 4 ? 2.3 : 0.9; },
    deform: function (i, d, t, p, o) {
      var c = d.C[d.cl[i]], k = 1 + 0.22 * Math.sin(t * 1.6 + d.cl[i] * 1.7);
      o[0] = c[0] + (p[0] - c[0]) * k; o[1] = c[1] + (p[1] - c[1]) * k; o[2] = c[2] + (p[2] - c[2]) * k;
    }
  });

  // Listening: rings spread out from the centre and fade at the edge, like sound on water.
  define('ripple', {
    tilt: 1.05,
    spin: 0.15,
    build: function (n) {
      var rings = 6, per = n / rings, pts = [], f = [], a = [];
      for (var i = 0; i < n; i++) {
        var r = Math.floor(i / per), ang = (i - r * per) / per * TAU + r, fr = r / rings;
        pts.push([Math.cos(ang) * fr * 0.95, 0, Math.sin(ang) * fr * 0.95]);
        f.push(fr); a.push(ang);
      }
      return { pts: pts, f: f, a: a };
    },
    deform: function (i, d, t, p, o) {
      var r = ((d.f[i] + t * 0.16) % 1) * 0.95;
      o[0] = Math.cos(d.a[i]) * r; o[1] = 0; o[2] = Math.sin(d.a[i]) * r;
    },
    alpha: function (i, d, t) { return 1.1 * Math.sin(((d.f[i] + t * 0.16) % 1) * Math.PI); },
    size: function (i, d, t) { return 0.7 + 0.6 * ((d.f[i] + t * 0.16) % 1); }
  });

  // Speaking: columns of dots rising and falling, tallest in the middle.
  define('bars', {
    face: true,
    tilt: 0,
    alpha: 1.6,
    build: function (n) {
      var B = 11, pts = [], bar = [], fy = [];
      for (var i = 0; i < n; i++) {                // spread dots evenly across bars, so none double up
        var b = Math.floor(i * B / n), first = Math.ceil(b * n / B), count = Math.ceil((b + 1) * n / B) - first;
        var y = count > 1 ? (i - first) / (count - 1) * 2 - 1 : 0;
        pts.push([(b - (B - 1) / 2) * 0.15, y * 0.6, 0]);
        bar.push(b); fy.push(y);
      }
      return { pts: pts, bar: bar, fy: fy, mid: (B - 1) / 2 };
    },
    deform: function (i, d, t, p, o) {
      var b = d.bar[i], v = 0.5 + 0.5 * Math.sin(t * 3.3 + b * 1.9) * Math.sin(t * 1.4 + b * 0.7);
      var h = 0.1 + 0.7 * v * (1 - Math.abs(b - d.mid) / (d.mid + 2));
      o[0] = p[0]; o[1] = d.fy[i] * h; o[2] = p[2];
    },
    audio: function (i, d, A, p, o) {             // low notes in the middle, high notes at the edges
      var b = d.bar[i], k = Math.round(Math.abs(b - d.mid) / d.mid * 11);
      var h = 0.06 + 0.86 * A.bands[k] * (1 - Math.abs(b - d.mid) / (d.mid * 4));
      o[0] = p[0]; o[1] = d.fy[i] * h; o[2] = p[2];
    }
  });

  // Atom: a small nucleus with three tilted orbits, each carrying a bright electron.
  define('atom', {
    tilt: 0.45,
    spin: 0.5,
    build: function (n) {
      var core = Math.max(8, Math.round(n * 0.14)), rest = n - core, per = Math.ceil(rest / 3), phi = 1.2;
      var pts = fib(core).map(function (p) { return [p[0] * 0.13, p[1] * 0.13, p[2] * 0.13]; });
      var orbit = pts.map(function () { return -1; }), ang = pts.map(function () { return 0; });
      for (var i = 0; i < rest; i++) {
        var o = i % 3, a = Math.floor(i / 3) / per * TAU, rot = o * Math.PI / 3;
        var ux = Math.cos(rot), uz = -Math.sin(rot);                                           // orbit axes,
        var vx = Math.sin(phi) * Math.sin(rot), vy = Math.cos(phi), vz = Math.sin(phi) * Math.cos(rot); // turned 60° apart
        pts.push([(Math.cos(a) * ux + Math.sin(a) * vx) * 0.88, Math.sin(a) * vy * 0.88, (Math.cos(a) * uz + Math.sin(a) * vz) * 0.88]);
        orbit.push(o); ang.push(a);
      }
      return { pts: pts, orbit: orbit, ang: ang };
    },
    size: function (i, d, t) {
      if (d.orbit[i] < 0) return 1.5;
      return 0.6 + 1.6 * Math.pow(0.5 + 0.5 * Math.cos(d.ang[i] - t * 2.2 - d.orbit[i] * 2.1), 14);
    },
    alpha: function (i, d, t) {
      if (d.orbit[i] < 0) return 1;
      return 0.5 + 0.9 * Math.pow(0.5 + 0.5 * Math.cos(d.ang[i] - t * 2.2 - d.orbit[i] * 2.1), 8);
    }
  });

  // Flat marks (infinity, check, cross) are drawn as clean single strokes of evenly spaced dots.
  // stroke() spreads n dots along a path of [x, y] points by length; y runs down the screen.
  function stroke(path, n) {
    var lens = [], total = 0, pts = [], u = [], i;
    for (i = 1; i < path.length; i++) {
      var l = Math.sqrt(Math.pow(path[i][0] - path[i - 1][0], 2) + Math.pow(path[i][1] - path[i - 1][1], 2));
      lens.push(l); total += l;
    }
    for (i = 0; i < n; i++) {
      var f = n > 1 ? i / (n - 1) : 0, d = f * total, s = 0;
      while (s < lens.length - 1 && d > lens[s]) { d -= lens[s]; s++; }
      var a = path[s], b = path[s + 1], q = lens[s] ? Math.min(1, d / lens[s]) : 0;
      pts.push([a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q, 0]);
      u.push(f);
    }
    return { pts: pts, u: u };
  }
  function sway(i, d, t, p, o) {                  // a slight turn, so flat marks still feel alive
    var a = 0.12 * Math.sin(t * 1.1), c = Math.cos(a), s = Math.sin(a);
    o[0] = p[0] * c - p[2] * s; o[1] = p[1]; o[2] = p[0] * s + p[2] * c;
  }

  // Loader: a figure of eight with a bright pulse running round it.
  define('infinity', {
    face: true,
    tilt: 0,
    build: function (n) {
      var path = [];
      for (var j = 0; j <= 160; j++) {
        var s = j / 160 * TAU, den = 1 + Math.sin(s) * Math.sin(s);
        path.push([0.9 * Math.cos(s) / den, 0.9 * Math.sin(s) * Math.cos(s) / den]);
      }
      return stroke(path, n);
    },
    deform: sway,
    size: function (i, d, t) { return 0.8 + 0.9 * Math.pow(0.5 + 0.5 * Math.cos((d.u[i] - t * 0.35) * TAU), 6); },
    alpha: function (i, d, t) { return 0.5 + 1.2 * Math.pow(0.5 + 0.5 * Math.cos((d.u[i] - t * 0.35) * TAU), 6); }
  });

  // Thinking: dots spiral inwards and down a funnel, turning faster near the centre.
  define('vortex', {
    tilt: 0.75,
    spin: 0.15,
    build: function (n) {
      var pts = [], f = [], a = [];
      for (var i = 0; i < n; i++) {
        var fr = (i * 0.618034) % 1, arm = i % 3;
        f.push(fr); a.push(arm * TAU / 3 + fr * TAU * 1.6);
        var r = 0.95 * (1 - fr) + 0.05;
        pts.push([Math.cos(a[i]) * r, fr * fr * 0.7 - 0.25, Math.sin(a[i]) * r]);
      }
      return { pts: pts, f: f, a: a };
    },
    deform: function (i, d, t, p, o) {
      var fr = (d.f[i] + t * 0.11) % 1, r = 0.95 * (1 - fr) + 0.05;
      var ang = d.a[i] + (fr - d.f[i]) * TAU * 1.6 + t * 0.9;   // three arms turn together; dots slide inwards along them
      o[0] = Math.cos(ang) * r; o[1] = fr * fr * 0.7 - 0.25; o[2] = Math.sin(ang) * r;
    },
    alpha: function (i, d, t) { return 1.15 * Math.sin(((d.f[i] + t * 0.11) % 1) * Math.PI); },
    size: function (i, d, t) { return 1.25 - 0.55 * ((d.f[i] + t * 0.11) % 1); }
  });

  // Active: a sphere whose surface wobbles slowly, like a drop of liquid.
  define('blob', {
    spin: 0.6,
    build: function (n) { return { pts: fib(n) }; },
    deform: function (i, d, t, p, o) {
      var x = p[0], y = p[1], z = p[2], l = Math.sqrt(x * x + y * y + z * z) || 1;
      x /= l; y /= l; z /= l;
      var w = Math.sin(x * 2.1 + t * 1.1) + Math.sin(y * 2.4 - t * 0.9) + Math.sin(z * 1.8 + t * 0.75) + Math.sin((x - z) * 1.5 + t * 0.55);
      var k = 0.78 + 0.11 * w;
      o[0] = x * k; o[1] = y * k; o[2] = z * k;
    }
  });

  // Listening: an eye that faces you. Radial fibres, a pupil that widens and narrows,
  // a slow glance around and a blink now and then.
  define('iris', {
    face: true,
    tilt: 0,
    alpha: 1.5,
    lineGap: 0.3,
    build: function (n) {
      var rim = Math.round(n * 0.22), pupil = Math.round(n * 0.18), fibres = n - rim - pupil;
      var spokes = Math.max(6, Math.round(Math.sqrt(fibres * 4))), per = fibres / spokes;
      var pts = [], kind = [], ang = [], f = [], i;
      for (i = 0; i < rim; i++) { var a = i / rim * TAU; pts.push([Math.cos(a) * 0.86, Math.sin(a) * 0.86, 0]); kind.push(0); ang.push(a); f.push(1); }
      for (i = 0; i < pupil; i++) { var b = i / pupil * TAU; pts.push([Math.cos(b) * 0.24, Math.sin(b) * 0.24, 0]); kind.push(1); ang.push(b); f.push(0); }
      for (i = 0; i < fibres; i++) {
        var s = Math.floor(i / per), c = s / spokes * TAU + (s % 2) * 0.08, q = (i - s * per) / per;
        var r = 0.3 + q * 0.46;
        pts.push([Math.cos(c) * r, Math.sin(c) * r, 0]); kind.push(2); ang.push(c); f.push(q);
      }
      return { pts: pts, kind: kind, ang: ang, f: f };
    },
    deform: function (i, d, t, p, o) {
      var pr = 0.24 + 0.07 * Math.sin(t * 0.9) + 0.03 * Math.sin(t * 2.3);   // pupil breathes
      var r = d.kind[i] === 0 ? 0.86 : d.kind[i] === 1 ? pr : pr + 0.06 + d.f[i] * (0.76 - pr - 0.06);
      var lx = d.kind[i] === 0 ? 0 : 0.07 * Math.sin(t * 0.37) + 0.03 * Math.sin(t * 1.1);   // glance
      var ly = d.kind[i] === 0 ? 0 : 0.04 * Math.sin(t * 0.29 + 1);
      var ph = t % 5.5, lid = ph > 5.2 ? 1 - 0.92 * Math.sin((ph - 5.2) / 0.3 * Math.PI) : 1;  // blink
      o[0] = Math.cos(d.ang[i]) * r + lx; o[1] = (Math.sin(d.ang[i]) * r + ly) * lid; o[2] = 0;
    },
    size: function (i, d) { return d.kind[i] === 1 ? 1.25 : d.kind[i] === 0 ? 0.85 : 0.75 + 0.35 * (1 - d.f[i]); }
  });

  // Ambient: four soft, large dots of different sizes, each circling on its own tilted path.
  define('orbit', {
    tilt: 0.5,
    spin: 0.25,
    build: function (n) {
      var B = [[0.13, 0.5, 0.0, 0.55, 0.0], [0.1, 0.62, 0.9, -0.42, 2.1], [0.08, 0.38, -0.6, 0.8, 4.0], [0.06, 0.72, 0.4, 0.33, 1.0]];
      var pts = [], body = [], i;
      var share = [0.4, 0.27, 0.2, 0.13];
      for (i = 0; i < n; i++) {
        var u = (i + 0.5) / n, b = 0, acc = share[0];
        while (b < 3 && u > acc) { b++; acc += share[b]; }
        body.push(b);
      }
      var count = [0, 0, 0, 0], seen = [0, 0, 0, 0];
      body.forEach(function (b) { count[b]++; });
      var balls = count.map(function (c) { return fib(Math.max(1, c)); });
      for (i = 0; i < n; i++) {
        var bb = body[i], q = balls[bb][seen[bb]++ % balls[bb].length], sz = B[bb][0] * 0.45;
        pts.push([q[0] * sz, q[1] * sz, q[2] * sz]);
      }
      return { pts: pts, body: body, B: B };
    },
    deform: function (i, d, t, p, o) {
      var b = d.B[d.body[i]], a = b[4] + t * b[3];
      var cx = Math.cos(a) * b[1], cz = Math.sin(a) * b[1];
      var cy = Math.sin(a) * b[1] * Math.sin(b[2]) * 0.6;       // each path tilted its own way
      o[0] = p[0] + cx; o[1] = p[1] + cy; o[2] = p[2] + cz;
    },
    bigDots: true,
    alpha: 0.32,                                  // many overlapping circles build up a soft, bright core
    size: function (i, d) { return d.B[d.body[i]][0] * 55; }
  });

  // Status badges: a dotted ring with a mark inside. Check and cross share the ring,
  // so going from one to the other only redraws the mark. Kept out of the default cycle.
  function badge(marks) {
    return function (n) {
      var ring = Math.round(n * 0.6), rest = n - ring, pts = [], u = [], k = [], i;
      for (i = 0; i < ring; i++) {
        var a = i / ring * TAU - Math.PI / 2;
        pts.push([Math.cos(a) * 0.86, Math.sin(a) * 0.86, 0]); u.push(i / ring); k.push(0);
      }
      for (var m = 0; m < marks.length; m++) {
        var c = m === marks.length - 1 ? rest - Math.floor(rest / marks.length) * m : Math.floor(rest / marks.length);
        var s = stroke(marks[m], c);
        for (i = 0; i < c; i++) { pts.push(s.pts[i]); u.push(s.u[i]); k.push(1); }
      }
      return { pts: pts, u: u, k: k };
    };
  }
  var badgeLook = {
    face: true,
    tilt: 0,
    inCycle: false,
    lineGap: 0.28,
    deform: sway,
    size: function (i, d) { return d.k[i] ? 1.35 : 0.85; },
    alpha: function (i, d, t) {
      if (d.k[i]) return 1.8;
      return 0.9 + 0.5 * Math.pow(0.5 + 0.5 * Math.cos((d.u[i] - t * 0.25) * TAU), 4);   // a soft light circling the ring
    }
  };
  function look(build) { var o = { build: build }; for (var key in badgeLook) o[key] = badgeLook[key]; return o; }

  define('check', look(badge([[[-0.4, 0.03], [-0.12, 0.31], [0.42, -0.27]]])));
  define('cross', look(badge([[[-0.3, -0.3], [0.3, 0.3]], [[0.3, -0.3], [-0.3, 0.3]]])));

  /* ── Sound ── */
  var AC = null;
  function audioContext() {                       // one shared context for every orb
    if (!AC) { var C = global.AudioContext || global.webkitAudioContext; if (C) AC = new C(); }
    return AC;
  }

  /* ── Orb ── */
  function Orb(canvas, opts) {
    if (!(this instanceof Orb)) return new Orb(canvas, opts);
    var ds = canvas.dataset;
    opts = opts || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.style = (opts.style || ds.style) === 'lines' ? 'lines' : 'dots';
    this.autoPoints = !(opts.points || ds.points);
    this.n = +(opts.points || ds.points || (this.style === 'lines' ? 320 : 180));
    this.line = +(opts.line || ds.line || 0);
    this.glow = amount(opts.glow != null ? opts.glow : ds.glow, 8);
    this.reflect = Math.min(1, amount(opts.reflect != null ? opts.reflect : ds.reflect, 0.35));
    this.audioAmount = +(opts.audioAmount != null ? opts.audioAmount : (ds.audioAmount || 1));
    this.audio = null;
    this.speed = +(opts.speed != null ? opts.speed : (ds.speed || 0.35));
    this.tiltAdd = (+(opts.tilt != null ? opts.tilt : (ds.tilt || 0)) || 0) * Math.PI / 180;
    this.dot = +(opts.dot || ds.dot || 1.2);
    this.cycle = +(opts.cycle || ds.cycle || 0);
    this.order = (opts.shapes || ds.shapes || Object.keys(SHAPES).filter(function (s) { return SHAPES[s].inCycle !== false; }).join(','))
      .split(',').map(function (s) { return s.trim(); }).filter(function (s) { return SHAPES[s]; });
    var first = opts.shape || ds.orb;
    this.shape = SHAPES[first] ? first : this.order[0];
    if (this.order.indexOf(this.shape) < 0) this.order.unshift(this.shape);

    this.cache = {};
    this.src = this.shape;
    this.cur = this.data(this.shape).pts.map(function () { return [0, 0, 0]; }); // collapsed, for the intro
    this.from = this.cur;
    this.g = 1;
    this.X = new Float32Array(this.n); this.Y = new Float32Array(this.n); this.F = new Float32Array(this.n);
    this.tmp = [0, 0, 0]; this.pos = [0, 0, 0];
    this.angle = 0.6; this.tilt = 0.38; this.spinMul = 1;
    this.color = parseRGB(getComputedStyle(canvas).color);
    this.colorWatchUntil = 0;
    // With IntersectionObserver available, stay idle until it confirms we're on screen.
    this.visible = !global.IntersectionObserver; this.running = false; this.last = 0; this.lastCycle = 0; this.t0 = performance.now();

    this._frame = this.frame.bind(this);
    this._resize = this.resize.bind(this);
    this._vis = this.onVisibility.bind(this);
    this.resize();
    this.observe(opts, ds);
    this.morph(this.shape, { intro: true });
  }

  Orb.define = define;
  Orb.shapes = SHAPES;
  Orb.audioContext = audioContext;

  Orb.prototype.data = function (name) {
    return this.cache[name] || (this.cache[name] = SHAPES[name].build(this.n));
  };

  Orb.prototype.observe = function (opts, ds) {
    var self = this;
    if (global.ResizeObserver) { this.ro = new ResizeObserver(this._resize); this.ro.observe(this.canvas); }
    else global.addEventListener('resize', this._resize);

    if (global.IntersectionObserver) {            // only animate while on screen
      this.io = new IntersectionObserver(function (e) { self.visible = e[0].isIntersecting; self.wake(); });
      this.io.observe(this.canvas);
    }
    document.addEventListener('visibilitychange', this._vis);

    if ((opts.hover || ds.hover) === 'morph') {
      var lastHover = 0;
      this._hover = function () {
        var now = performance.now();
        if (now - lastHover > self.morphDur + 150) { lastHover = now; self.next(); }
      };
      var el = this.canvas.parentElement || this.canvas;
      el.addEventListener('pointerenter', this._hover);
      el.addEventListener('click', this._hover);
    }

    if ((opts.click || ds.click) === 'morph') {
      this._click = function () { self.next(); };
      (this.canvas.parentElement || this.canvas).addEventListener('click', this._click);
    }

    var media = opts.audio || ds.audio;
    if (media) {                                  // react to a media element once it plays (a play is a user gesture)
      var el2 = typeof media === 'string' ? document.querySelector(media) : media;
      if (el2) {
        this._play = function () { if (!self.audio) self.listen(el2); };
        el2.addEventListener('play', this._play);
        this._media = el2;
        if (!el2.paused) this._play();
      }
    }

    var themeMorph = opts.themeMorph || ds.themeMorph !== undefined;
    this.mo = new MutationObserver(function () {
      self.refreshColor();
      if (themeMorph) self.next();
    });
    this.mo.observe(document.body, { attributes: true, attributeFilter: ['data-theme', 'class'] });
  };

  Orb.prototype.resize = function () {
    var r = this.canvas.getBoundingClientRect(), dpr = Math.min(global.devicePixelRatio || 1, 2);
    this.w = r.width; this.h = r.height;
    this.canvas.width = Math.max(1, Math.round(r.width * dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.dpr = dpr;
    this.fx = null;                                   // effect canvases are rebuilt at the new size
    this.draw();
  };

  // Follow the canvas's computed colour for a moment after a theme change. That way the dots
  // track whatever CSS transition the page uses, instead of guessing one.
  Orb.prototype.refreshColor = function () {
    this.colorWatchUntil = performance.now() + 1500;
    this.color = parseRGB(getComputedStyle(this.canvas).color);
    this.wake();
    if (reduceMQ.matches) { var self = this; setTimeout(function () { self.color = parseRGB(getComputedStyle(self.canvas).color); self.draw(); }, 1000); }
  };

  Orb.prototype.morph = function (name, o) {
    if (!SHAPES[name]) return this;
    o = o || {};
    if (!o.intro && name === this.shape) return this;
    // Interrupted mid-morph? Fade out whichever shape is currently dominant on screen.
    if (!o.intro) this.src = (this.morphStart && this.g < 0.5) ? this.src : this.shape;
    else this.src = name;
    this.shape = name;
    // Start every morph from exactly what is drawn right now, motion included, so nothing jumps.
    this.from = this.cur.map(function (p) { return (p._p || p).slice(); });
    this.cur = this.from.map(function (p) { return p.slice(); });
    this.morphStart = performance.now();
    this.morphDur = o.intro ? 1400 : 1100;
    this.pendingIntro = !!o.intro;   // the intro waits until the orb is first on screen
    this.g = 0;
    if (reduceMQ.matches) {
      var t = this.data(name).pts;
      this.cur = t.map(function (p) { return p.slice(); });
      this.src = name; this.g = 1; this.morphStart = 0;
      this.tilt = (SHAPES[name].tilt != null ? SHAPES[name].tilt : 0.38) + this.tiltAdd;
      if (SHAPES[name].face) this.angle = Math.round(this.angle / TAU) * TAU;
      this.draw();
    }
    this.wake();
    if (!o.intro && global.CustomEvent) this.canvas.dispatchEvent(new CustomEvent('orb:morph', { detail: { shape: name } }));
    return this;
  };

  // Change settings on a running orb. Changing the number of points (or the style, when no
  // point count was given) rebuilds the shape in place, without the intro.
  Orb.prototype.set = function (o) {
    o = o || {};
    var rebuild = false;
    if (o.style != null) {
      var st = o.style === 'lines' ? 'lines' : 'dots';
      if (st !== this.style && o.points == null && this.autoPoints) { o.points = st === 'lines' ? 320 : 180; }
      this.style = st;
    }
    if (o.points != null && +o.points !== this.n) { this.n = Math.max(8, +o.points | 0); this.autoPoints = false; rebuild = true; }
    if (o.speed != null) this.speed = +o.speed;
    if (o.dot != null) this.dot = +o.dot;
    if (o.line != null) this.line = +o.line;
    if (o.glow != null) this.glow = amount(o.glow, 8);
    if (o.reflect != null) this.reflect = Math.min(1, amount(o.reflect, 0.35));
    if (o.tilt != null) this.tiltAdd = (+o.tilt || 0) * Math.PI / 180;
    if (o.audioAmount != null) this.audioAmount = +o.audioAmount;
    if (o.cycle != null) { this.cycle = +o.cycle; this.lastCycle = 0; }
    if (o.shapes != null) {
      var list = (Array.isArray(o.shapes) ? o.shapes : String(o.shapes).split(',')).map(function (x) { return String(x).trim(); }).filter(function (x) { return SHAPES[x]; });
      if (list.length) { this.order = list; if (list.indexOf(this.shape) < 0) this.order.unshift(this.shape); }
    }
    if (o.glow != null || o.reflect != null) { this.fx = null; this.floor = null; }
    if (rebuild) {
      this.cache = {};
      this.X = new Float32Array(this.n); this.Y = new Float32Array(this.n); this.F = new Float32Array(this.n);
      this.cur = this.data(this.shape).pts.map(function (p) { return p.slice(); });
      this.from = this.cur; this.src = this.shape; this.g = 1; this.morphStart = 0;
    }
    if (o.shape != null && o.shape !== this.shape) this.morph(o.shape);
    if (reduceMQ.matches) {
      var def = SHAPES[this.shape];
      this.tilt = (def.tilt != null ? def.tilt : 0.38) + this.tiltAdd;
    }
    this.refreshColor();
    this.draw();
    return this;
  };

  Orb.prototype.next = function () {
    var i = this.order.indexOf(this.shape);
    return this.morph(this.order[(i + 1) % this.order.length]);
  };

  Orb.prototype.onVisibility = function () { if (!document.hidden) this.wake(); };

  Orb.prototype.wake = function () {
    if (this.running || !this.visible || document.hidden) return;
    if (reduceMQ.matches) { this.draw(); return; }
    this.running = true; this.last = performance.now();
    this.color = parseRGB(getComputedStyle(this.canvas).color);   // catch theme changes made while off screen
    if (this.pendingIntro) { this.pendingIntro = false; this.morphStart = this.last; }
    requestAnimationFrame(this._frame);
  };

  // Sound: pass an <audio> or <video>, a MediaStream, any Web Audio node, or 'mic'. Returns a promise.
  // Media elements play through as normal; a microphone is analysed only, never played back.
  Orb.prototype.listen = function (src) {
    var self = this, ctx = audioContext();
    this.unlisten();
    if (!ctx) return Promise.reject(new Error('Web Audio is not supported'));
    if (src === 'mic') {
      if (!global.navigator || !navigator.mediaDevices) return Promise.reject(new Error('Microphone is not available'));
      return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        return self.listen(stream).then(function () { self.audio.stream = stream; return self; });
      });
    }
    var node;
    if (global.MediaStream && src instanceof MediaStream) node = ctx.createMediaStreamSource(src);
    else if (src && /^(AUDIO|VIDEO)$/.test(src.nodeName)) {
      // An element can only be wired into Web Audio once, so the source is kept on the element.
      if (!src._orbNode) { src._orbNode = ctx.createMediaElementSource(src); src._orbNode.connect(ctx.destination); }
      node = src._orbNode;
    } else if (src && src.connect) node = src;
    else return Promise.reject(new Error('Unsupported audio source'));
    if (ctx.state === 'suspended') ctx.resume();
    var an = ctx.createAnalyser();
    an.fftSize = 256; an.smoothingTimeConstant = 0.55;
    node.connect(an);
    this.audio = { node: node, an: an, bins: new Uint8Array(an.frequencyBinCount), bands: new Float32Array(16), level: 0 };
    this.wake();
    return Promise.resolve(this);
  };

  Orb.prototype.unlisten = function () {
    var A = this.audio;
    if (!A) return this;
    try { A.node.disconnect(A.an); } catch (e) { /* already disconnected */ }
    if (A.stream) A.stream.getTracks().forEach(function (tr) { tr.stop(); });
    this.audio = null;
    return this;
  };

  // 16 bands, spaced like hearing (more detail in the lows), with a quick rise and a slower fall.
  Orb.prototype.sampleAudio = function () {
    var A = this.audio, bins = A.bins, B = A.bands, sum = 0;
    A.an.getByteFrequencyData(bins);
    for (var k = 0; k < 16; k++) {
      var lo = Math.floor(1 + Math.pow(k / 16, 2) * 90), hi = Math.max(lo + 1, Math.floor(1 + Math.pow((k + 1) / 16, 2) * 90));
      var v = 0;
      for (var j = lo; j < hi; j++) v += bins[j];
      v = Math.min(1, Math.pow(v / (hi - lo) / 255, 1.3) * (1 + k * 0.06) * this.audioAmount);   // lift the quieter highs
      B[k] += (v - B[k]) * (v > B[k] ? 0.6 : 0.15);
      sum += B[k];
    }
    A.level += (sum / 16 - A.level) * 0.3;
  };

  Orb.prototype.frame = function (now) {
    if (!this.visible || document.hidden || reduceMQ.matches) { this.running = false; return; }
    var dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    if (this.audio) this.sampleAudio();
    var def = SHAPES[this.shape];
    var tiltGoal = (def.tilt != null ? def.tilt : 0.38) + this.tiltAdd, spinGoal = def.spin != null ? def.spin : 1;
    var ease = Math.min(1, dt * 2.5);
    this.tilt += (tiltGoal - this.tilt) * ease;
    this.spinMul += (spinGoal - this.spinMul) * ease;
    if (def.face) { var home = Math.round(this.angle / TAU) * TAU; this.angle += (home - this.angle) * ease; }   // turn to face the viewer
    else this.angle += this.speed * this.spinMul * dt;

    // Morph: dots leave top to bottom in a soft cascade, with a slight outward swell mid-flight.
    if (this.morphStart) {
      var raw = (now - this.morphStart) / this.morphDur, tgt = this.data(this.shape).pts, done = true;
      for (var i = 0; i < this.n; i++) {
        var b = tgt[i], a = this.from[i], c = this.cur[i];
        var delay = (1 - (Math.max(-1, Math.min(1, b[1])) + 1) / 2) * 0.25;
        var t = Math.min(1, Math.max(0, (raw - delay) / 0.75));
        if (t < 1) done = false;
        var e = easeInOut(t), swell = 1 + Math.sin(e * Math.PI) * 0.08;
        c[0] = (a[0] + (b[0] - a[0]) * e) * swell;
        c[1] = (a[1] + (b[1] - a[1]) * e) * swell;
        c[2] = (a[2] + (b[2] - a[2]) * e) * swell;
      }
      this.g = easeInOut(Math.min(1, raw));
      if (done) { this.morphStart = 0; this.g = 1; this.src = this.shape; }
    }

    if (this.colorWatchUntil && now < this.colorWatchUntil) this.color = parseRGB(getComputedStyle(this.canvas).color);

    if (this.cycle && now - this.lastCycle > this.cycle && !this.morphStart) {
      if (this.lastCycle) this.next();
      this.lastCycle = now;
    }

    this.draw(now);
    requestAnimationFrame(this._frame);
  };

  Orb.prototype.draw = function (now) {
    var ctx = this.ctx, w = this.w, h = this.h;
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);

    var t = reduceMQ.matches ? 0 : ((now || performance.now()) - this.t0) / 1000;
    var S = SHAPES[this.src], T = SHAPES[this.shape], sd = this.data(this.src), td = this.data(this.shape);
    var g = this.g, gs = 1 - g;
    var R = Math.min(w, h) * (this.reflect ? 0.33 : 0.36), cx = w / 2, cy = this.reflect ? h * 0.4 : h / 2;
    var ca = Math.cos(this.angle), sa = Math.sin(this.angle), ct = Math.cos(this.tilt), st = Math.sin(this.tilt);
    var col = this.color, rgb = 'rgba(' + (col[0] | 0) + ',' + (col[1] | 0) + ',' + (col[2] | 0) + ',';
    var dot = this.dot * (0.5 + 0.5 * Math.min(1, Math.min(w, h) / 90));  // airier on small canvases
    var X = this.X, Y = this.Y, F = this.F, pos = this.pos, tmp = this.tmp, n = this.n;

    function project(p, out) {
      var x = p[0] * ca - p[2] * sa, z = p[0] * sa + p[2] * ca;      // spin around Y
      var y = p[1] * ct - z * st; z = p[1] * st + z * ct;             // tilt around X
      var persp = 1 / (1 - z * 0.12);
      out[0] = cx + x * R * persp; out[1] = cy + y * R * persp; out[2] = (z + 1) / 2;
    }
    function blendDeform(def, d, weight, i, base) {
      if (!def.deform || weight <= 0) return;
      def.deform(i, d, t, base, tmp);
      pos[0] += (tmp[0] - base[0]) * weight; pos[1] += (tmp[1] - base[1]) * weight; pos[2] += (tmp[2] - base[2]) * weight;
    }

    // Sound: shapes with their own audio() use it; flat marks only pulse; the rest also push out on the beat.
    var A = this.audio && !reduceMQ.matches ? this.audio : null, amt = this.audioAmount;
    var pulse = A ? 1 + A.level * 0.1 : 1;
    function react(i, def, d, weight) {
      if (def.audio) {
        tmp[0] = pos[0]; tmp[1] = pos[1]; tmp[2] = pos[2];
        def.audio(i, d, A, tmp, tmp);
        pos[0] += (tmp[0] - pos[0]) * weight; pos[1] += (tmp[1] - pos[1]) * weight; pos[2] += (tmp[2] - pos[2]) * weight;
        return;
      }
      var k = pulse;
      if (!def.face) {
        var u = Math.atan2(pos[2], pos[0]) / TAU + 0.5;          // low notes one side, high notes the other
        k += A.bands[Math.min(15, Math.floor((1 - Math.abs(2 * u - 1)) * 16))] * 0.22 * Math.min(1, amt);
      }
      k = 1 + (k - 1) * weight;
      pos[0] *= k; pos[1] *= k; pos[2] *= k;
    }

    // 1. positions: base + each shape's live motion, weighted by how far the morph has got
    var proj = [0, 0, 0];
    for (var i = 0; i < n; i++) {
      var base = this.cur[i];
      pos[0] = base[0]; pos[1] = base[1]; pos[2] = base[2];
      blendDeform(T, td, g, i, base);
      if (A) react(i, T, td, 1);
      project(pos, proj);
      X[i] = proj[0]; Y[i] = proj[1]; F[i] = proj[2];
      this.cur[i]._p = this.cur[i]._p || [0, 0, 0];
      this.cur[i]._p[0] = pos[0]; this.cur[i]._p[1] = pos[1]; this.cur[i]._p[2] = pos[2];
    }

    if (this.style === 'lines') { this.effects(this.slices(t, S, T, sd, td, g, R, dot)); return; }

    // 2. connecting lines (constellation, helix rungs, cluster links) fade with the morph
    ctx.lineWidth = this.line || Math.max(0.5, dot * 0.45);
    ctx.lineCap = 'round';
    function edges(d, def, weight) {
      if (!d.edges || weight <= 0.01) return;
      var ea = (def.edgeAlpha != null ? def.edgeAlpha : 0.3) * weight;
      for (var e = 0; e < d.edges.length; e++) {
        var a = d.edges[e][0], b = d.edges[e][1];
        ctx.strokeStyle = rgb + (ea * (0.25 + 0.75 * (F[a] + F[b]) / 2)).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(X[a], Y[a]); ctx.lineTo(X[b], Y[b]); ctx.stroke();
      }
    }
    edges(sd, S, gs);
    edges(td, T, g);

    function dotR(def, d, i, t, p, front) {
      var sz = val(def.size, i, d, t, p);
      return def.bigDots ? R * 0.01 * sz * (0.75 + front * 0.25) : dot * (0.45 + front * 0.85) * sz;
    }

    // 3. dots and dashes, back to front is not needed: alpha already fades the far side
    var end = [0, 0, 0], low = -1e9, lift = A ? 0.8 + A.level * 0.6 : 1;
    for (i = 0; i < n; i++) {
      var p = this.cur[i]._p, front = F[i];
      var alpha = gs * val(S.alpha, i, sd, t, p) + g * val(T.alpha, i, td, t, p);
      var dash = (S.dash ? gs * S.dash(i, sd, t, p) : 0) + (T.dash ? g * T.dash(i, td, t, p) : 0);
      // Most shapes size dots in pixels; bigDots shapes size them as a share of the orb, so they scale with it.
      var r = gs * dotR(S, sd, i, t, p, front) + g * dotR(T, td, i, t, p, front);
      var a2 = Math.max(0, Math.min(1, (0.12 + front * 0.88) * alpha * lift));
      if (dash > 0.004) {
        tmp[0] = p[0] * (1 + dash); tmp[1] = p[1] * (1 + dash); tmp[2] = p[2] * (1 + dash);
        project(tmp, end);
        ctx.strokeStyle = rgb + a2.toFixed(3) + ')';
        ctx.lineWidth = r * 1.4;
        ctx.beginPath(); ctx.moveTo(X[i], Y[i]); ctx.lineTo(end[0], end[1]); ctx.stroke();
      } else {
        ctx.fillStyle = rgb + a2.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(X[i], Y[i], r, 0, TAU); ctx.fill();
        if (a2 > 0.08 && Y[i] + r > low) low = Y[i] + r;
      }
    }
    this.effects(low);
  };

  // Lines style: sort the projected dots into vertical columns, then join dots that sit close
  // together in a column into one line, lit by the dots along it. Solid shapes become sliced
  // silhouettes; rings, holes and marks keep their gaps.
  Orb.prototype.slices = function (t, S, T, sd, td, g, R, dot) {
    var ctx = this.ctx, n = this.n, X = this.X, Y = this.Y, F = this.F, gs = 1 - g;
    var cols = Math.max(20, Math.min(90, Math.round(n / 5)));
    var sp = Math.max(3, 2.3 * R / cols), lw = this.line || Math.max(1, sp * 0.46);
    var gap = R * (g < 0.5 ? (S.lineGap || 0.45) : (T.lineGap || 0.45)), cap = Math.max(lw, R * 0.025), low = -1e9;
    var col = this.color, rgb = 'rgba(' + (col[0] | 0) + ',' + (col[1] | 0) + ',' + (col[2] | 0) + ',';
    var C = this.sC || (this.sC = []), Ys = this.sY || (this.sY = []), A = this.sA || (this.sA = []), idx = [], m = 0;
    for (var i = 0; i < n; i++) {
      var p = this.cur[i]._p;
      var alpha = gs * val(S.alpha, i, sd, t, p) + g * val(T.alpha, i, td, t, p);
      var a = Math.max(0, Math.min(1, (0.2 + F[i] * 0.8) * alpha * 1.5 * (this.audio ? 0.8 + this.audio.level * 0.6 : 1)));   // lines are thinner than dots, so lift them
      if (a < 0.02) continue;
      if (a > 0.08 && Y[i] > low) low = Y[i];
      var fx = X[i] / sp, c0 = Math.floor(fx), fr = fx - c0;         // share each dot between its two nearest
      if (fr < 0.97) { C[m] = c0; Ys[m] = Y[i]; A[m] = a * (1 - fr); idx.push(m++); }   // columns, so motion stays smooth
      if (fr > 0.03) { C[m] = c0 + 1; Ys[m] = Y[i]; A[m] = a * fr; idx.push(m++); }
    }
    idx.sort(function (u, v) { return C[u] - C[v] || Ys[u] - Ys[v]; });
    ctx.lineWidth = lw; ctx.lineCap = 'round';
    for (var s = 0; s < idx.length;) {
      var e = s;                                                      // grow a run of close dots in one column
      while (e + 1 < idx.length && C[idx[e + 1]] === C[idx[s]] && Ys[idx[e + 1]] - Ys[idx[e]] < gap) e++;
      var x = C[idx[s]] * sp, y0 = Ys[idx[s]] - cap, y1 = Ys[idx[e]] + cap;
      if (e === s) ctx.strokeStyle = rgb + A[idx[s]].toFixed(3) + ')';
      else {
        var grad = ctx.createLinearGradient(0, y0, 0, y1);
        for (var k = s; k <= e; k++) grad.addColorStop((Ys[idx[k]] - y0) / (y1 - y0), rgb + A[idx[k]].toFixed(3) + ')');
        ctx.strokeStyle = grad;
      }
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
      s = e + 1;
    }
    return low + cap;
  };

  // Glow and reflection, drawn from a copy of the finished frame. Both are off unless asked for.
  Orb.prototype.effects = function (low) {
    if (!this.glow && !this.reflect) return;
    // The reflection sits just under the shape's lowest point, eased so it glides rather than jitters.
    if (low > -1e8) this.floor = this.floor == null || reduceMQ.matches ? low : this.floor + (low - this.floor) * 0.08;
    var floor = (this.floor || this.h * 0.75) + 4;
    var ctx = this.ctx, cv = this.canvas, W = cv.width, H = cv.height, dpr = this.dpr || 1;
    if (!this.fx) {
      var mk = function (k) { var c = document.createElement('canvas'); c.width = Math.ceil(W / k); c.height = Math.ceil(H / k); return c; };
      this.fx = { copy: mk(1), mirror: mk(1), small: mk(4) };
    }
    var copy = this.fx.copy, cc = copy.getContext('2d');
    cc.clearRect(0, 0, W, H); cc.drawImage(cv, 0, 0);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.glow && 'filter' in ctx) {                    // blur a quarter-size copy (cheap), then lay it behind
      var sm = this.fx.small, sc = sm.getContext('2d');
      sc.clearRect(0, 0, sm.width, sm.height);
      sc.filter = 'blur(' + (this.glow * dpr / 4).toFixed(2) + 'px)';
      sc.drawImage(copy, 0, 0, sm.width, sm.height);
      sc.filter = 'none';
      ctx.globalCompositeOperation = 'destination-over';
      ctx.drawImage(sm, 0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (this.reflect) {                                    // flip about the floor, squash, then fade out downwards
      var mir = this.fx.mirror, mc = mir.getContext('2d'), fy = floor * dpr, sq = 0.55;
      mc.setTransform(1, 0, 0, 1, 0, 0); mc.globalCompositeOperation = 'source-over';
      mc.clearRect(0, 0, W, H);
      mc.setTransform(1, 0, 0, -sq, 0, fy * (1 + sq));
      mc.drawImage(copy, 0, 0);
      mc.setTransform(1, 0, 0, 1, 0, 0);
      mc.globalCompositeOperation = 'destination-in';
      var fade = mc.createLinearGradient(0, fy, 0, Math.min(H, fy + (H - fy) * 0.95));
      fade.addColorStop(0, 'rgba(0,0,0,' + this.reflect + ')'); fade.addColorStop(1, 'rgba(0,0,0,0)');
      mc.fillStyle = fade; mc.fillRect(0, fy, W, H - fy);
      mc.clearRect(0, 0, W, fy);
      ctx.drawImage(mir, 0, 0);
    }
    ctx.restore();
  };

  Orb.prototype.destroy = function () {
    this.visible = false;
    this.unlisten();
    if (this._play) this._media.removeEventListener('play', this._play);
    if (this.ro) this.ro.disconnect(); else global.removeEventListener('resize', this._resize);
    if (this.io) this.io.disconnect();
    if (this.mo) this.mo.disconnect();
    document.removeEventListener('visibilitychange', this._vis);
    if (this._hover) {
      var el = this.canvas.parentElement || this.canvas;
      el.removeEventListener('pointerenter', this._hover); el.removeEventListener('click', this._hover);
    }
    if (this._click) (this.canvas.parentElement || this.canvas).removeEventListener('click', this._click);
  };

  /* ── Auto-init every <canvas data-orb> ── */
  function init(root) {
    var els = (root && root.querySelectorAll ? root : document).querySelectorAll('canvas[data-orb]');
    for (var i = 0; i < els.length; i++) {
      if (els[i]._orb) continue;
      els[i]._orb = new Orb(els[i]);
      if (els[i].parentElement) els[i].parentElement.classList.add('orb-ready');  // hide fallback glyph only once running
    }
  }
  Orb.init = init;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();

  global.Orb = Orb;
})(window);
