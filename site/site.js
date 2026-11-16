/* Orbs site: presets, the Studio, the copyable code and the two-tone footer.
   Everything goes through the public Orb API (new Orb, set, morph, listen), so the page
   doubles as a working example of it. */
(function () {
  'use strict';

  var CDN = 'https://cdn.jsdelivr.net/gh/ShazMoghaddam/orbs@1.8.0/orb.min.js';
  var DEFAULTS = {
    shape: 'torus', style: 'dots', color: '#FF7A45', points: null, dot: 1.2, line: 0,
    glow: 0, reflect: 0, size: 320, speed: 0.35, tilt: 0, cycle: 0, shapes: null, audioAmount: 1,
    state: null, follow: false, scrollTilt: false
  };
  var SWATCHES = [
    ['#FF7A45', 'Orange'], ['#EADCC6', 'Sand'], ['#6FD8F2', 'Cyan'], ['#B9A2FF', 'Violet'],
    ['#3ECF8E', 'Green'], ['#FF8FB1', 'Pink'], ['#FFD166', 'Gold'], ['#F2EDE4', 'White'], ['#17140F', 'Ink']
  ];
  var PRESETS = {
    waveform:  { label: 'Waveform', shape: 'bars', style: 'lines', color: '#6FD8F2', glow: 8, reflect: 0.35 },
    assistant: { label: 'AI assistant', shape: 'ripple', color: '#B9A2FF', glow: 6, cycle: 2.6, shapes: 'ripple,ticks,bars' },
    globe:     { label: 'Hero globe', shape: 'sphere', style: 'lines', points: 360, color: '#FF7A45', glow: 10 },
    success:   { label: 'Success', shape: 'check', color: '#3ECF8E', glow: 6 },
    network:   { label: 'Network', shape: 'constellation', color: '#EADCC6', glow: 4, dot: 1.6 },
    loader:    { label: 'Loader', shape: 'infinity', color: '#FF7A45', glow: 6 },
    galaxy:    { label: 'Galaxy', shape: 'galaxy', color: '#FF8FB1', glow: 6 },
    energy:    { label: 'Energy', shape: 'spikes', color: '#FFD166', glow: 4, speed: 0.6 }
  };
  var SHAPE_NAMES = Object.keys(Orb.shapes);
  var STATUS = ['check', 'cross'];

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var state = Object.assign({}, DEFAULTS);
  var orb, canvas;

  // Options for the library, from the Studio's state.
  function orbOptions(s) {
    var o = { shape: s.shape, style: s.style, dot: s.dot, line: s.line, glow: s.glow || false, reflect: s.reflect || false,
              speed: s.speed, tilt: s.tilt, audioAmount: s.audioAmount, cycle: s.cycle ? s.cycle * 1000 : 0,
              follow: s.follow, scrollTilt: s.scrollTilt };
    if (s.points) o.points = s.points;
    if (s.shapes) o.shapes = s.shapes;
    return o;
  }
  function autoPoints() { return state.style === 'lines' ? 320 : 180; }

  /* ── Showcase ── */
  $$('[data-preset]').forEach(function (btn) {
    var p = PRESETS[btn.dataset.preset], c = $('canvas', btn);
    c.style.color = p.color;
    var s = Object.assign({}, DEFAULTS, p);
    new Orb(c, Object.assign(orbOptions(s), { shapes: p.shapes || p.shape }));
    btn.addEventListener('click', function () {
      load(Object.assign({}, DEFAULTS, p));
      note('Loaded the ' + p.label + ' preset. Change anything, then copy the code.');
      $('#studio').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  });

  /* ── Studio orb ── */
  canvas = $('[data-studio-orb]');
  canvas.style.color = state.color;
  orb = new Orb(canvas, orbOptions(state));

  function apply(changed) {
    canvas.style.color = state.color;
    canvas.style.width = canvas.style.height = state.size + 'px';
    var o = {};
    changed.forEach(function (k) {
      if (k === 'points') o.points = state.points || autoPoints();
      else if (k === 'glow') o.glow = state.glow || false;
      else if (k === 'reflect') o.reflect = state.reflect || false;
      else if (k === 'cycle' || k === 'shapes') { o.cycle = state.cycle ? state.cycle * 1000 : 0; o.shapes = state.shapes || SHAPE_NAMES.filter(function (n) { return STATUS.indexOf(n) < 0; }); }
      else if (k === 'style') { o.style = state.style; if (!state.points) o.points = autoPoints(); }
      else if (k !== 'color' && k !== 'size' && k !== 'shape') o[k] = state[k];
    });
    orb.set(o);
    if (changed.indexOf('shape') >= 0) orb.morph(state.shape);
    sync();
  }

  // Load a whole state (preset, shared link, reset or surprise).
  function load(s) {
    state = Object.assign({}, DEFAULTS, s);
    apply(['style', 'points', 'dot', 'line', 'glow', 'reflect', 'speed', 'tilt', 'cycle', 'shapes', 'audioAmount', 'follow', 'scrollTilt', 'color', 'size', 'shape']);
  }

  /* ── Shape picker ── */
  var shapesEl = $('[data-shape-picker]');
  SHAPE_NAMES.forEach(function (name) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'shp'; b.setAttribute('role', 'radio'); b.dataset.shape = name;
    b.innerHTML = '<canvas aria-hidden="true"></canvas><span>' + name + '</span>';
    shapesEl.appendChild(b);
    new Orb($('canvas', b), { shape: name, shapes: name, points: 70, dot: 1.1 });
    b.addEventListener('click', function () { state.shape = name; state.state = null; apply(['shape']); });
  });
  shapesEl.addEventListener('keydown', function (e) {      // arrow keys move through the shapes, as a radio group should
    var keys = { ArrowRight: 1, ArrowDown: 4, ArrowLeft: -1, ArrowUp: -4 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    var i = SHAPE_NAMES.indexOf(state.shape), j = Math.max(0, Math.min(SHAPE_NAMES.length - 1, i + keys[e.key]));
    state.shape = SHAPE_NAMES[j]; state.state = null; apply(['shape']);
    $('[data-shape="' + state.shape + '"]', shapesEl).focus();
  });
  // Keep the picker in step when the orb cycles by itself.
  canvas.addEventListener('orb:morph', function (e) { if (state.cycle) { state.shape = e.detail.shape; syncShapes(); } });

  /* ── State picker ── */
  var statesEl = $('[data-state-picker]');
  Object.keys(Orb.states).forEach(function (name) {
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = name; b.dataset.state = name;
    b.addEventListener('click', function () {
      var st = Orb.states[name];
      state.state = name; state.shape = st.shape; state.cycle = 0;
      state.speed = st.speed != null ? st.speed : DEFAULTS.speed;
      apply(['cycle', 'speed', 'shape']);
    });
    statesEl.appendChild(b);
  });

  /* ── Panel tabs ── */
  var tabs = $$('[data-ptab]');
  function selectTab(t) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
      $('[data-ppanel="' + x.dataset.ptab + '"]').hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      var n = tabs[(i + d + tabs.length) % tabs.length]; selectTab(n); n.focus();
    });
  });

  /* ── Look and motion controls ── */
  var swEl = $('[data-swatches]'), custom = $('.swatch--custom', swEl);
  SWATCHES.forEach(function (sw) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'swatch'; b.style.setProperty('--c', sw[0]);
    b.dataset.color = sw[0]; b.setAttribute('aria-label', sw[1]); b.title = sw[1];
    b.addEventListener('click', function () { state.color = sw[0]; apply(['color']); });
    swEl.insertBefore(b, custom);
  });
  $('[data-input="color"]').addEventListener('input', function (e) { state.color = e.target.value.toUpperCase(); apply(['color']); });

  $$('[data-seg="style"] button').forEach(function (b) {
    b.addEventListener('click', function () { state.style = b.dataset.v; apply(['style']); });
  });

  function range(key, toState) {
    $('[data-input="' + key + '"]').addEventListener('input', function (e) { toState(+e.target.value); });
  }
  range('points', function (v) { state.points = v; apply(['points']); });
  range('dot', function (v) { state.dot = v; apply(['dot']); });
  range('line', function (v) { state.line = v; apply(['line']); });
  range('glow', function (v) { state.glow = v; apply(['glow']); });
  range('reflect', function (v) { state.reflect = v; apply(['reflect']); });
  range('size', function (v) { state.size = v; apply(['size']); });
  range('speed', function (v) { state.speed = v; apply(['speed']); });
  range('tilt', function (v) { state.tilt = v; apply(['tilt']); });
  range('cycle', function (v) { state.cycle = v; apply(['cycle']); });
  range('audioAmount', function (v) { state.audioAmount = v; apply(['audioAmount']); });

  function toggle(key, on, off) {
    $('[data-input="' + key + '-on"]').addEventListener('change', function (e) {
      state[key] = e.target.checked ? on() : off; apply([key]);
    });
  }
  toggle('glow', function () { return +$('[data-input="glow"]').value; }, 0);
  ['follow', 'scrollTilt'].forEach(function (k) {
    $('[data-input="' + k + '"]').addEventListener('change', function (e) { state[k] = e.target.checked; apply([k]); });
  });
  toggle('reflect', function () { return +$('[data-input="reflect"]').value; }, 0);
  toggle('cycle', function () { return +$('[data-input="cycle"]').value; }, 0);

  $$('[data-backdrops] button').forEach(function (b) {
    b.addEventListener('click', function () {
      $('[data-canvas]').dataset.bg = b.dataset.bg;
      $$('[data-backdrops] button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    });
  });

  /* ── Sound ── */
  var beat = demoBeat(), soundOn = false;
  function soundState(which) {
    soundOn = !!which;
    $$('[data-sound]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.sound === which)); });
    var live = $('.canvas__live');
    if (soundOn) live.setAttribute('data-sound', ''); else live.removeAttribute('data-sound');
    $('[data-live-label]').textContent = soundOn ? 'Reacting to sound' : 'Live preview';
    render();
  }
  function stopSound() { beat.stop(); orb.unlisten(); soundState(null); }
  $('[data-sound="beat"]').addEventListener('click', function () {
    if (beat.on) { stopSound(); return; }
    stopSound();
    orb.listen(beat.start()).then(function () { soundState('beat'); });
  });
  $('[data-sound="mic"]').addEventListener('click', function () {
    if (orb.audio && orb.audio.stream) { stopSound(); return; }
    stopSound();
    orb.listen('mic').then(function () { soundState('mic'); }, function () { note('The microphone is blocked or unavailable here.'); });
  });

  /* ── Code ── */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  // Each attribute is [name, value]; a value of null writes a bare attribute.
  function tag(name, attrs, close) {
    var plain = '<' + name, html = '<span class="t">&lt;' + name + '</span>';
    attrs.forEach(function (a, i) {
      var br = name === 'script' ? '\n  ' : (i && attrs.length > 3 ? '\n        ' : ' ');
      plain += br + a[0] + (a[1] == null ? '' : '="' + a[1] + '"');
      html += br + '<span class="a">' + a[0] + '</span>' + (a[1] == null ? '' : '=<span class="v">"' + esc(a[1]) + '"</span>');
    });
    plain += '>' + (close ? '</' + name + '>' : '');
    html += '<span class="t">&gt;' + (close ? '&lt;/' + name + '&gt;' : '') + '</span>';
    return [plain, html];
  }
  function canvasAttrs() {
    var s = state, st = s.state && Orb.states[s.state], usesState = st && st.shape === s.shape;
    var a = usesState ? [['data-orb', null], ['data-state', s.state]] : [['data-orb', s.shape]];
    var stateSpeed = usesState && st.speed != null ? st.speed : DEFAULTS.speed;
    if (s.style === 'lines') a.push(['data-style', 'lines']);
    if (s.points) a.push(['data-points', s.points]);
    if (s.dot !== DEFAULTS.dot) a.push(['data-dot', s.dot]);
    if (s.line) a.push(['data-line', s.line]);
    if (s.glow) a.push(['data-glow', s.glow === 8 ? null : s.glow]);
    if (s.reflect) a.push(['data-reflect', s.reflect === 0.35 ? null : s.reflect]);
    if (s.speed !== stateSpeed) a.push(['data-speed', s.speed]);
    if (s.tilt) a.push(['data-tilt', s.tilt]);
    if (s.follow) a.push(['data-follow', null]);
    if (s.scrollTilt) a.push(['data-scroll-tilt', null]);
    if (s.cycle) { a.push(['data-cycle', Math.round(s.cycle * 1000)]); if (s.shapes) a.push(['data-shapes', s.shapes]); }
    if (soundOn) { a.push(['data-audio', '#player']); if (s.audioAmount !== 1) a.push(['data-audio-amount', s.audioAmount]); }
    a.push(['style', 'width:' + s.size + 'px;height:' + s.size + 'px;color:' + s.color]);
    a.push(['aria-hidden', 'true']);
    return a;
  }
  function snippet() {
    var parts = [tag('script', [['src', CDN], ['defer', null]], true)];
    if (soundOn) parts.push(tag('audio', [['id', 'player'], ['src', 'your-track.mp3'], ['controls', null]], true));
    parts.push(tag('canvas', canvasAttrs(), true));
    return [parts.map(function (p) { return p[0]; }).join('\n\n'), parts.map(function (p) { return p[1]; }).join('\n\n')];
  }
  function optionList() {
    var s = state, o = [], st = s.state && Orb.states[s.state], usesState = st && st.shape === s.shape;
    var stateSpeed = usesState && st.speed != null ? st.speed : DEFAULTS.speed;
    o.push(usesState ? "state: '" + s.state + "'" : "shape: '" + s.shape + "'");
    if (s.style === 'lines') o.push("style: 'lines'");
    if (s.points) o.push('points: ' + s.points);
    if (s.dot !== DEFAULTS.dot) o.push('dot: ' + s.dot);
    if (s.line) o.push('line: ' + s.line);
    if (s.glow) o.push('glow: ' + s.glow);
    if (s.reflect) o.push('reflect: ' + s.reflect);
    if (s.speed !== stateSpeed) o.push('speed: ' + s.speed);
    if (s.tilt) o.push('tilt: ' + s.tilt);
    if (s.cycle) { o.push('cycle: ' + Math.round(s.cycle * 1000)); if (s.shapes) o.push("shapes: '" + s.shapes + "'"); }
    if (s.follow) o.push('follow: true');
    if (s.scrollTilt) o.push('scrollTilt: true');
    return o;
  }
  // One pass over the text, so a span added for a comment is never re-read as a string.
  function highlight(plain) {
    return esc(plain).replace(/(\/\/[^\n]*)|('[^'\n]*'|"[^"\n]*")|\b(const|let|import|from|export|function|return|new)\b/g,
      function (m, comment, str, kw) {
        return comment ? '<span class="c">' + comment + '</span>' : str ? '<span class="v">' + str + '</span>' : '<span class="t">' + kw + '</span>';
      });
  }
  // For React and Vue the state comes from a prop, so the starting shape or state stays out of the options.
  function frameworkOptions() {
    return optionList().filter(function (x) { return x.indexOf('state:') !== 0 && x.indexOf('shape:') !== 0; });
  }
  function startState() { return state.state && Orb.states[state.state] && Orb.states[state.state].shape === state.shape ? state.state : null; }
  function reactSnippet() {
    var extra = frameworkOptions(), st = startState();
    var opts = st ? '{ state' + (extra.length ? ', ' + extra.join(', ') : '') + ' }' : "{ shape: '" + state.shape + "'" + (extra.length ? ', ' + extra.join(', ') : '') + ' }';
    var plain = "import { useEffect, useRef } from 'react';\nimport Orb from '@shazmoghaddam/orbs';\n\n" +
      "export function MyOrb({ state = '" + (st || 'idle') + "' }) {\n" +
      "  const canvas = useRef(null);\n  const orb = useRef(null);\n" +
      "  useEffect(() => {\n    orb.current = new Orb(canvas.current, " + opts + ");\n    return () => orb.current.destroy();\n  }, []);\n" +
      (st ? "  useEffect(() => { orb.current?.state(state); }, [state]);   // 'listening', 'thinking', 'success'...\n" : '') +
      "  return <canvas ref={canvas} style={{ width: " + state.size + ", height: " + state.size + ", color: '" + state.color + "' }} aria-hidden=\"true\" />;\n}";
    return [plain, highlight(plain)];
  }
  function vueSnippet() {
    var extra = frameworkOptions(), st = startState();
    var opts = st ? '{ state: props.state' + (extra.length ? ', ' + extra.join(', ') : '') + ' }' : "{ shape: '" + state.shape + "'" + (extra.length ? ', ' + extra.join(', ') : '') + ' }';
    var plain = "<script setup>\nimport { ref, watch, onMounted, onBeforeUnmount } from 'vue';\nimport Orb from '@shazmoghaddam/orbs';\n\n" +
      "const props = defineProps({ state: { type: String, default: '" + (st || 'idle') + "' } });\n" +
      "const canvas = ref(null);\nlet orb;\n" +
      "onMounted(() => { orb = new Orb(canvas.value, " + opts + "); });\n" +
      (st ? "watch(() => props.state, (s) => orb?.state(s));   // 'listening', 'thinking', 'success'...\n" : '') +
      "onBeforeUnmount(() => orb?.destroy());\n<\/script>\n\n<template>\n" +
      "  <canvas ref=\"canvas\" style=\"width: " + state.size + "px; height: " + state.size + "px; color: " + state.color + "\" aria-hidden=\"true\" />\n</template>";
    return [plain, highlight(plain)];
  }
  function jsSnippet() {
    var o = optionList();
    var opts = o.length > 2 ? '{\n  ' + o.join(',\n  ') + '\n}' : '{ ' + o.join(', ') + ' }';
    var plain = 'const orb = new Orb(canvas, ' + opts + ');\n\n' +
      "orb.state('thinking');           // named states: idle, listening, thinking, speaking, success...\n" +
      "orb.morph('check');              // or go to any shape\n" +
      "orb.set({ glow: 12, speed: 0.6 }); // change settings live\n" +
      "button.onclick = () => orb.listen('mic'); // react to sound\n\n" +
      "canvas.addEventListener('orb:morph', e => console.log(e.detail.shape));";
    return [plain, highlight(plain)];
  }
  function render() {
    var sn = snippet(), js = jsSnippet();
    $('[data-snippet]').innerHTML = sn[1];
    $('[data-code="js"]').innerHTML = js[1];
    render.snippet = sn[0]; render.js = js[0];
    var re = reactSnippet(), vu = vueSnippet();
    $('[data-code="react"]').innerHTML = re[1]; $('[data-code="vue"]').innerHTML = vu[1];
    render.react = re[0]; render.vue = vu[0];
    if (typeof deskUrl === 'function') {
      render.desk = deskUrl();
      $('[data-code="desk-url"]').textContent = render.desk;
      $('[data-desk-open]').href = render.desk;
    }
  }

  /* ── Keep every control in step with the state ── */
  function syncShapes() {
    $$('.shp', shapesEl).forEach(function (b) {
      var on = b.dataset.shape === state.shape;
      b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1;
    });
  }
  function out(k, v) { var o = $('[data-out="' + k + '"]'); if (o) o.textContent = v; }
  function setInput(k, v) { var i = $('[data-input="' + k + '"]'); if (i) { if (i.type === 'checkbox') i.checked = !!v; else i.value = v; } }
  function sync() {
    var s = state;
    syncShapes();
    $$('button', statesEl).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.state === s.state)); });
    setInput('follow', s.follow); setInput('scrollTilt', s.scrollTilt);
    $$('[data-seg="style"] button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === s.style)); });
    var known = false;
    $$('.swatch[data-color]').forEach(function (b) { var on = b.dataset.color === s.color.toUpperCase(); known = known || on; b.setAttribute('aria-pressed', String(on)); });
    if (known) custom.removeAttribute('data-on'); else custom.setAttribute('data-on', '');
    setInput('color', s.color); out('color', s.color.toUpperCase());
    var pts = s.points || autoPoints();
    setInput('points', pts); out('points', pts + (s.points ? '' : ' (auto)'));
    setInput('dot', s.dot); out('dot', s.dot);
    setInput('line', s.line); out('line', s.line ? s.line + ' px' : 'Auto');
    setInput('glow-on', s.glow); if (s.glow) setInput('glow', s.glow); out('glow', (s.glow || +$('[data-input="glow"]').value) + ' px');
    setInput('reflect-on', s.reflect); if (s.reflect) setInput('reflect', s.reflect); out('reflect', s.reflect || +$('[data-input="reflect"]').value);
    setInput('size', s.size); out('size', s.size + ' px'); $('[data-size-label]').textContent = s.size + ' px';
    setInput('speed', s.speed); out('speed', s.speed);
    setInput('tilt', s.tilt); out('tilt', s.tilt + '°');
    setInput('cycle-on', s.cycle); if (s.cycle) setInput('cycle', s.cycle); out('cycle', (s.cycle || +$('[data-input="cycle"]').value) + ' s');
    setInput('audioAmount', s.audioAmount); out('audioAmount', s.audioAmount);
    $$('[data-when]').forEach(function (el) { el.hidden = !$('[data-input="' + el.dataset.when + '"]').checked; });
    render();
  }

  /* ── Copy, share, reset, surprise ── */
  var noteTimer;
  function note(msg, where) {
    var el = where || $('[data-note]');
    el.textContent = msg;
    clearTimeout(noteTimer); noteTimer = setTimeout(function () { el.textContent = ''; }, 4000);
  }
  function copy(text, btn, where) {
    var done = function () {
      btn.setAttribute('data-copied', ''); var t = btn.textContent; btn.textContent = 'Copied';
      setTimeout(function () { btn.removeAttribute('data-copied'); btn.textContent = t; }, 1600);
      note('Copied to your clipboard.', where);
    };
    var fallback = function () {
      var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) { /* not allowed */ }
      document.body.removeChild(ta);
      if (ok) done(); else note('Copying is blocked here. Select the code and copy it by hand.', where);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var where = b.closest('.install') ? $('[data-copy-note]') : $('[data-note]');
      var which = { js: render.js, 'desk-url': render.desk, react: render.react, vue: render.vue }[b.dataset.copy];
      copy(which || render.snippet, b, where);
    });
  });

  // Shared links carry only the settings that differ from the defaults.
  var KEYS = ['shape', 'style', 'color', 'points', 'dot', 'line', 'glow', 'reflect', 'size', 'speed', 'tilt', 'cycle', 'shapes', 'audioAmount', 'state', 'follow', 'scrollTilt'];
  function settingsQuery(skip) {
    var q = new URLSearchParams();
    KEYS.forEach(function (k) {
      if (skip && skip.indexOf(k) >= 0) return;
      if (state[k] !== DEFAULTS[k] && state[k] != null) q.set(k, k === 'color' ? state[k].replace('#', '') : state[k]);
    });
    return q;
  }
  $('[data-share]').addEventListener('click', function (e) {
    var q = settingsQuery();
    var url = location.origin + location.pathname + (q.toString() ? '?' + q : '') + '#studio';
    copy(url, e.currentTarget);
  });
  // The display link always names the shape, so it still opens the same orb if the defaults ever change.
  function deskUrl() {
    var q = settingsQuery(['size', 'shape', 'state', 'follow', 'scrollTilt']);
    var all = new URLSearchParams('shape=' + state.shape + (q.toString() ? '&' + q : ''));
    if ($('[data-desk-mic]').checked) all.set('sound', 'mic');
    return location.origin + location.pathname.replace(/[^/]*$/, '') + 'display.html?' + all;
  }
  $('[data-desk-mic]').addEventListener('change', render);
  function fromQuery() {
    var q = new URLSearchParams(location.search), s = {}, any = false;
    KEYS.forEach(function (k) {
      if (!q.has(k)) return;
      var v = q.get(k); any = true;
      if (k === 'color') s[k] = /^[0-9a-f]{6}$/i.test(v) ? '#' + v.toUpperCase() : DEFAULTS.color;
      else if (k === 'shape') s[k] = Orb.shapes[v] ? v : DEFAULTS.shape;
      else if (k === 'style') s[k] = v === 'lines' ? 'lines' : 'dots';
      else if (k === 'shapes') s[k] = v.split(',').filter(function (n) { return Orb.shapes[n]; }).join(',') || null;
      else if (k === 'state') s[k] = Orb.states[v] ? v : null;
      else if (k === 'follow' || k === 'scrollTilt') s[k] = v === 'true' || v === '1';
      else s[k] = isFinite(+v) ? +v : DEFAULTS[k];
    });
    return any ? s : null;
  }

  $('[data-reset]').addEventListener('click', function () { stopSound(); load({}); note('Back to the defaults.'); });
  $('[data-surprise]').addEventListener('click', function () {
    var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
    var shapes = SHAPE_NAMES.filter(function (n) { return STATUS.indexOf(n) < 0; });
    load({
      shape: pick(shapes), style: Math.random() < 0.5 ? 'lines' : 'dots', color: pick(SWATCHES.slice(0, 7))[0],
      glow: Math.random() < 0.7 ? pick([6, 8, 12]) : 0, reflect: Math.random() < 0.3 ? 0.35 : 0,
      speed: pick([0.2, 0.35, 0.6]), tilt: pick([0, 0, -20, 20]), size: state.size
    });
  });

  /* ── Export: the Studio orb as a video, GIF or still image ── */
  var EX = {
    sizes: {
      video: { square: [1080, 1080], wide: [1920, 1080], tall: [1080, 1920] },
      gif:   { square: [600, 600],   wide: [800, 450],   tall: [450, 800] },
      image: { square: [1600, 1600], wide: [1920, 1080], tall: [1080, 1920] }
    },
    hints: {
      video: 'Sharp, at 1080 px and 30 frames a second. MP4 where your browser can make it, otherwise WebM.',
      gif: 'Plays anywhere, including slides and chat apps. 20 frames a second, kept small.',
      image: 'A still of the current moment, at high resolution. Choose Clear for a transparent background.'
    },
    pick: { format: 'video', frame: 'square', bg: '#0E0F0B', len: 5 },
    busy: false, cancel: false
  };
  var exDialog = $('[data-export]');
  function videoType() {
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return null;
    var c = ['video/mp4;codecs=avc1.640028', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
    for (var i = 0; i < c.length; i++) if (MediaRecorder.isTypeSupported(c[i])) return c[i];
    return null;
  }
  function exSync() {
    var p = EX.pick;
    if (p.format !== 'image' && p.bg === 'transparent') p.bg = '#0E0F0B';
    $$('[data-ex]', exDialog).forEach(function (g) {
      $$('button', g).forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.v === p[g.dataset.ex]));
        if (b.hasAttribute('data-image-only')) b.disabled = p.format !== 'image';
      });
    });
    $('[data-ex-length]', exDialog).hidden = p.format === 'image';
    $('[data-ex-out="len"]', exDialog).textContent = p.len + ' s';
    var noVideo = p.format === 'video' && !videoType();
    $('[data-ex-hint]', exDialog).textContent = noVideo ? 'This browser can’t record video. Try GIF instead, or another browser.' : EX.hints[p.format];
    var go = $('[data-export-go]', exDialog);
    go.textContent = EX.busy ? 'Exporting…' : 'Export ' + (p.format === 'gif' ? 'GIF' : p.format);
    go.disabled = EX.busy || noVideo;
  }
  $$('[data-ex]', exDialog).forEach(function (g) {
    $$('button', g).forEach(function (b) {
      b.addEventListener('click', function () { if (!EX.busy) { EX.pick[g.dataset.ex] = b.dataset.v; exSync(); } });
    });
  });
  $('[data-ex-input="len"]', exDialog).addEventListener('input', function (e) { EX.pick.len = +e.target.value; exSync(); });
  $('[data-export-open]').addEventListener('click', function () {
    $('[data-ex-status]', exDialog).textContent = '';
    exSync();
    if (exDialog.showModal) exDialog.showModal(); else exDialog.setAttribute('open', '');
  });
  exDialog.addEventListener('close', function () { EX.cancel = true; });

  function hexRGB(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function saveBlob(blob, name) {
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    var st = $('[data-ex-status]', exDialog);
    st.innerHTML = 'Saved <b>' + esc(name) + '</b> (' + (blob.size / 1048576).toFixed(1) + ' MB). <a href="' + url + '" download="' + esc(name) + '">Download again</a>';
  }

  // Render the orb out of sight at the export size, then paint each frame onto the chosen background.
  function exStage(W, H, bg) {
    var side = Math.round(Math.min(W, H) * 0.94), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var wrap = document.createElement('div'); wrap.className = 'export-stage'; wrap.setAttribute('aria-hidden', 'true');
    var oc = document.createElement('canvas');
    oc.style.width = oc.style.height = side / dpr + 'px'; oc.style.color = state.color;
    wrap.appendChild(oc); document.body.appendChild(wrap);
    var eo = new Orb(oc, orbOptions(state));
    if (orb.audio) eo.listen(orb.audio.stream || orb.audio.node);   // keep reacting to what's playing
    var rec = document.createElement('canvas'); rec.width = W; rec.height = H;
    var rc = rec.getContext('2d');
    return {
      rec: rec, rc: rc,
      paint: function () {
        if (bg === 'transparent') rc.clearRect(0, 0, W, H); else { rc.fillStyle = bg; rc.fillRect(0, 0, W, H); }
        rc.drawImage(oc, (W - side) / 2, (H - side) / 2, side, side);
      },
      done: function () { eo.destroy(); wrap.remove(); }
    };
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function progress(f) {
    var bar = $('[data-ex-bar]', exDialog); bar.hidden = f == null;
    if (f != null) $('[data-ex-fill]', exDialog).style.width = Math.round(f * 100) + '%';
  }
  // Run a paint loop for a set time, calling each() on every animation frame.
  function runFor(seconds, each) {
    return new Promise(function (resolve) {
      var start = performance.now();
      (function tick(now) {
        if (EX.cancel) return resolve(false);
        var t = (now - start) / 1000;
        each(t);
        if (t >= seconds) return resolve(true);
        requestAnimationFrame(tick);
      })(start);
    });
  }

  $('[data-export-go]', exDialog).addEventListener('click', function () {
    if (EX.busy) return;
    var p = EX.pick, size = EX.sizes[p.format][p.frame], W = size[0], H = size[1];
    var name = 'orbs-' + (state.state || state.shape) + '-' + p.frame;
    var st = $('[data-ex-status]', exDialog);
    EX.busy = true; EX.cancel = false; exSync();
    var stage = exStage(W, H, p.bg);
    var finish = function (msg) { stage.done(); EX.busy = false; progress(null); exSync(); if (msg) st.textContent = msg; };

    st.textContent = 'Getting ready…';
    wait(1800).then(function () {                 // let the intro morph finish first
      if (EX.cancel) return finish();
      if (p.format === 'image') {
        stage.paint();
        stage.rec.toBlob(function (b) { finish(); if (b) saveBlob(b, name + '.png'); else st.textContent = 'Couldn’t make the image.'; }, 'image/png');
        return;
      }
      if (p.format === 'video') {
        var type = videoType(), chunks = [];
        var mr = new MediaRecorder(stage.rec.captureStream(30), { mimeType: type, videoBitsPerSecond: 12e6 });
        mr.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
        mr.onstop = function () {
          if (EX.cancel) return finish('Export cancelled.');
          finish();
          saveBlob(new Blob(chunks, { type: type.split(';')[0] }), name + (type.indexOf('mp4') >= 0 ? '.mp4' : '.webm'));
        };
        stage.paint(); mr.start();
        st.textContent = 'Recording ' + p.len + ' seconds…';
        runFor(p.len, function (t) { stage.paint(); progress(Math.min(1, t / p.len)); }).then(function () { mr.stop(); });
        return;
      }
      // GIF: capture 20 frames a second as palette indices, then encode.
      var bg = hexRGB(p.bg), fg = hexRGB(state.color), d = [fg[0] - bg[0], fg[1] - bg[1], fg[2] - bg[2]];
      var dd = d[0] * d[0] + d[1] * d[1] + d[2] * d[2] || 1, pal = new Uint8Array(768), frames = [], fps = 20, next = 0;
      for (var i = 0; i < 256; i++) for (var c = 0; c < 3; c++) pal[i * 3 + c] = Math.round(bg[c] + d[c] * i / 255);
      st.textContent = 'Capturing ' + p.len + ' seconds…';
      runFor(p.len, function (t) {
        if (t < next || frames.length >= p.len * fps) return;
        next += 1 / fps;
        stage.paint();
        var px = stage.rc.getImageData(0, 0, W, H).data, idx = new Uint8Array(W * H);
        for (var j = 0, k = 0; j < idx.length; j++, k += 4) {     // where each pixel sits between background and orb colour
          var v = ((px[k] - bg[0]) * d[0] + (px[k + 1] - bg[1]) * d[1] + (px[k + 2] - bg[2]) * d[2]) / dd;
          idx[j] = v <= 0 ? 0 : v >= 1 ? 255 : Math.round(v * 255);
        }
        frames.push(idx);
        progress(0.5 * Math.min(1, t / p.len));
      }).then(function (ok) {
        if (!ok) return finish('Export cancelled.');
        st.textContent = 'Encoding ' + frames.length + ' frames…';
        encodeGif(frames, W, H, pal, Math.round(100 / fps), function (f) { progress(0.5 + f / 2); }).then(function (blob) {
          finish(); saveBlob(blob, name + '.gif');
        });
      });
    });
  });

  /* ── Desk mode: the Studio orb, full screen ── */
  var desk = { orb: null, lock: null, idle: 0, shift: 0 };
  function deskOpen() {
    var overlay = $('[data-desk-overlay]'), c = $('[data-desk-orb]');
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    c.style.color = state.color;
    desk.orb = new Orb(c, orbOptions(state));
    if (orb.audio) desk.orb.listen(orb.audio.stream || orb.audio.node);     // keep reacting to whatever is playing
    $('[data-desk-exit]').focus();
    if (overlay.requestFullscreen) overlay.requestFullscreen().catch(function () {});
    if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { desk.lock = l; }, function () {});
    var wake = function () {
      overlay.removeAttribute('data-idle');
      clearTimeout(desk.idle);
      desk.idle = setTimeout(function () { overlay.setAttribute('data-idle', ''); }, 2500);
    };
    overlay.onpointermove = wake; overlay.onpointerdown = wake; wake();
    desk.shift = setInterval(function () {                                    // drift a few pixels each minute against burn-in
      $('[data-desk-stage]').style.transform = 'translate(' + Math.round((Math.random() - 0.5) * 12) + 'px, ' + Math.round((Math.random() - 0.5) * 12) + 'px)';
    }, 60000);
  }
  function deskClose() {
    var overlay = $('[data-desk-overlay]');
    if (overlay.hidden) return;
    overlay.hidden = true;
    document.body.style.overflow = '';
    if (desk.orb) { desk.orb.destroy(); desk.orb = null; }
    clearInterval(desk.shift); clearTimeout(desk.idle);
    if (desk.lock) { desk.lock.release().catch(function () {}); desk.lock = null; }
    // Leaving full screen resets focus, so hand it back to the button once that has finished.
    var refocus = function () { $('[data-desk]').focus({ preventScroll: true }); };
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().then(refocus, refocus);
    else setTimeout(refocus, 50);
  }
  $('[data-desk]').addEventListener('click', deskOpen);
  $('[data-desk-exit]').addEventListener('click', deskClose);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') deskClose(); });
  document.addEventListener('fullscreenchange', function () { if (!document.fullscreenElement) deskClose(); });

  /* ── Footer: draw the content a second time for the orange half ── */
  var layer = $('.foot__layer');
  if (layer) {
    var copyLayer = layer.cloneNode(true);
    copyLayer.classList.add('foot__layer--sun');
    copyLayer.setAttribute('aria-hidden', 'true');
    $$('a, button', copyLayer).forEach(function (a) { a.tabIndex = -1; });
    layer.parentNode.appendChild(copyLayer);
    $$('[data-foot-orb]').forEach(function (c) { new Orb(c, { shape: 'sphere', shapes: 'sphere', points: 44, dot: 1.1 }); });
  }

  /* ── Demo beat, made in the browser: kick, hats, bass and a soft chord ── */
  function demoBeat() {
    var timer = null, out = null, step = 0, next = 0;
    var bassNotes = [55, 55, 65.4, 49], chords = [[220, 277.2, 329.6], [196, 246.9, 293.7], [174.6, 220, 261.6], [164.8, 207.7, 246.9]];
    function env(g, t, peak, len) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + len); }
    function play(ctx, s, t) {
      var bar = Math.floor(s / 16) % 4, i = s % 16, o, g, f;
      if (i % 4 === 0) {
        o = ctx.createOscillator(); g = ctx.createGain();
        o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.25);
        env(g, t, 0.9, 0.35); o.connect(g).connect(out); o.start(t); o.stop(t + 0.4);
      }
      if (i % 2 === 1) {
        var n = ctx.createBufferSource(), b = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate), d = b.getChannelData(0);
        for (var k = 0; k < d.length; k++) d[k] = Math.random() * 2 - 1;
        n.buffer = b; f = ctx.createBiquadFilter(); g = ctx.createGain(); f.type = 'highpass'; f.frequency.value = 7000;
        env(g, t, i % 4 === 3 ? 0.18 : 0.08, 0.06); n.connect(f).connect(g).connect(out); n.start(t); n.stop(t + 0.1);
      }
      if (i % 4 === 2 || i === 0) {
        o = ctx.createOscillator(); f = ctx.createBiquadFilter(); g = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = bassNotes[bar]; f.type = 'lowpass'; f.frequency.value = 600;
        env(g, t, 0.35, 0.22); o.connect(f).connect(g).connect(out); o.start(t); o.stop(t + 0.3);
      }
      if (i === 0) chords[bar].forEach(function (fr) {
        var o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.type = 'triangle'; o2.frequency.value = fr; env(g2, t, 0.08, 1.9); o2.connect(g2).connect(out); o2.start(t); o2.stop(t + 2);
      });
    }
    return {
      start: function () {
        var ctx = Orb.audioContext(); ctx.resume();
        out = ctx.createGain(); out.gain.value = 0.6; out.connect(ctx.destination);
        step = 0; next = ctx.currentTime + 0.05;
        timer = setInterval(function () { while (next < ctx.currentTime + 0.12) { play(ctx, step++, next); next += 60 / 118 / 4; } }, 25);
        return out;
      },
      stop: function () { clearInterval(timer); timer = null; if (out) { out.disconnect(); out = null; } },
      get on() { return !!timer; }
    };
  }

  /* ── Start ── */
  var shared = fromQuery();
  load(shared || {});
  if (shared) note('Loaded a shared orb.');
})();
