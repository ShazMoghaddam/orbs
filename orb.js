/*!
 * Orbs v1.0.3 · dot-formation animations on <canvas>. Zero dependencies. MIT.
 * https://github.com/ShazMoghaddam/orbs · Shaz Moghaddam
 *
 * Usage:
 *   <canvas data-orb="sphere" aria-hidden="true"></canvas>
 *   <script src="orb.js" defer></script>   (or inline it)
 *
 * Shapes: sphere, wave, spikes, constellation, torus, helix, galaxy, ticks, cube, clusters
 *
 * Attributes (all optional):
 *   data-orb          first shape                     (default sphere)
 *   data-points       number of dots                  (default 180)
 *   data-speed        base rotation, radians/second   (default 0.35)
 *   data-dot          dot radius in CSS px            (default 1.2)
 *   data-cycle        ms between auto-morphs, 0 = off (default 0)
 *   data-shapes       comma list to cycle through     (default all)
 *   data-hover        "morph" to change shape on hover/tap
 *   data-click        "morph" to change shape only on click/tap (put the canvas in a <button> for keyboard users)
 *   data-theme-morph  morph when <body data-theme> changes
 *
 * Colour comes from the canvas's CSS `color` and fades on theme change.
 * JS:  var o = new Orb(canvas, {...}); o.morph('torus'); o.next(); o.destroy();
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

  /* ── Orb ── */
  function Orb(canvas, opts) {
    if (!(this instanceof Orb)) return new Orb(canvas, opts);
    var ds = canvas.dataset;
    opts = opts || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.n = +(opts.points || ds.points || 180);
    this.speed = +(opts.speed != null ? opts.speed : (ds.speed || 0.35));
    this.dot = +(opts.dot || ds.dot || 1.2);
    this.cycle = +(opts.cycle || ds.cycle || 0);
    this.order = (opts.shapes || ds.shapes || Object.keys(SHAPES).join(','))
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
      this.tilt = SHAPES[name].tilt != null ? SHAPES[name].tilt : 0.38;
      this.draw();
    }
    this.wake();
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

  Orb.prototype.frame = function (now) {
    if (!this.visible || document.hidden || reduceMQ.matches) { this.running = false; return; }
    var dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    var def = SHAPES[this.shape];
    var tiltGoal = def.tilt != null ? def.tilt : 0.38, spinGoal = def.spin != null ? def.spin : 1;
    var ease = Math.min(1, dt * 2.5);
    this.tilt += (tiltGoal - this.tilt) * ease;
    this.spinMul += (spinGoal - this.spinMul) * ease;
    this.angle += this.speed * this.spinMul * dt;

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
    var R = Math.min(w, h) * 0.36, cx = w / 2, cy = h / 2;
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

    // 1. positions: base + each shape's live motion, weighted by how far the morph has got
    var proj = [0, 0, 0];
    for (var i = 0; i < n; i++) {
      var base = this.cur[i];
      pos[0] = base[0]; pos[1] = base[1]; pos[2] = base[2];
      blendDeform(T, td, g, i, base);
      project(pos, proj);
      X[i] = proj[0]; Y[i] = proj[1]; F[i] = proj[2];
      this.cur[i]._p = this.cur[i]._p || [0, 0, 0];
      this.cur[i]._p[0] = pos[0]; this.cur[i]._p[1] = pos[1]; this.cur[i]._p[2] = pos[2];
    }

    // 2. connecting lines (constellation, helix rungs, cluster links) fade with the morph
    ctx.lineWidth = Math.max(0.5, dot * 0.45);
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

    // 3. dots and dashes, back to front is not needed: alpha already fades the far side
    var end = [0, 0, 0];
    for (i = 0; i < n; i++) {
      var p = this.cur[i]._p, front = F[i];
      var size = gs * val(S.size, i, sd, t, p) + g * val(T.size, i, td, t, p);
      var alpha = gs * val(S.alpha, i, sd, t, p) + g * val(T.alpha, i, td, t, p);
      var dash = (S.dash ? gs * S.dash(i, sd, t, p) : 0) + (T.dash ? g * T.dash(i, td, t, p) : 0);
      var r = dot * (0.45 + front * 0.85) * size;
      var a2 = Math.max(0, Math.min(1, (0.12 + front * 0.88) * alpha));
      if (dash > 0.004) {
        tmp[0] = p[0] * (1 + dash); tmp[1] = p[1] * (1 + dash); tmp[2] = p[2] * (1 + dash);
        project(tmp, end);
        ctx.strokeStyle = rgb + a2.toFixed(3) + ')';
        ctx.lineWidth = r * 1.4;
        ctx.beginPath(); ctx.moveTo(X[i], Y[i]); ctx.lineTo(end[0], end[1]); ctx.stroke();
      } else {
        ctx.fillStyle = rgb + a2.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(X[i], Y[i], r, 0, TAU); ctx.fill();
      }
    }
  };

  Orb.prototype.destroy = function () {
    this.visible = false;
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
  function init() {
    var els = document.querySelectorAll('canvas[data-orb]');
    for (var i = 0; i < els.length; i++) {
      if (els[i]._orb) continue;
      els[i]._orb = new Orb(els[i]);
      if (els[i].parentElement) els[i].parentElement.classList.add('orb-ready');  // hide fallback glyph only once running
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  global.Orb = Orb;
})(window);
