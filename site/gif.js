/* A small animated GIF encoder for the Studio's export. No dependencies.
   Frames arrive as palette indices (one byte per pixel), so the caller decides the palette:
   for an orb, every pixel is a blend of the background and the orb colour, so a 256-step
   ramp between the two is exact. Encoding yields between frames to keep the page responsive. */
(function (global) {
  'use strict';

  function ByteWriter() { this.buf = new Uint8Array(1 << 20); this.n = 0; }
  ByteWriter.prototype.grow = function (k) {
    if (this.n + k <= this.buf.length) return;
    var b = new Uint8Array(Math.max(this.buf.length * 2, this.n + k)); b.set(this.buf); this.buf = b;
  };
  ByteWriter.prototype.byte = function (v) { this.grow(1); this.buf[this.n++] = v; };
  ByteWriter.prototype.word = function (v) { this.byte(v & 255); this.byte((v >> 8) & 255); };
  ByteWriter.prototype.bytes = function (a) { this.grow(a.length); this.buf.set(a, this.n); this.n += a.length; };
  ByteWriter.prototype.text = function (s) { for (var i = 0; i < s.length; i++) this.byte(s.charCodeAt(i)); };

  // LZW-compress one frame of 8-bit indices into GIF data sub-blocks.
  function lzw(out, pixels) {
    var minCode = 8, clear = 256, eoi = 257;
    var dict = new Map(), next = 258, size = 9;
    var block = new Uint8Array(255), bn = 0, acc = 0, bits = 0;
    function emit(code) {
      acc |= code << bits; bits += size;
      while (bits >= 8) {
        block[bn++] = acc & 255; acc >>>= 8; bits -= 8;
        if (bn === 255) { out.byte(255); out.bytes(block); bn = 0; }
      }
    }
    out.byte(minCode);
    emit(clear);
    var prefix = pixels[0];
    for (var i = 1; i < pixels.length; i++) {
      var k = pixels[i], key = (prefix << 8) | k, code = dict.get(key);
      if (code !== undefined) { prefix = code; continue; }
      emit(prefix);
      if (next < 4096) {
        dict.set(key, next++);
        if (next > (1 << size) && size < 12) size++;
      } else {                                      // table full: start afresh
        emit(clear); dict.clear(); next = 258; size = 9;
      }
      prefix = k;
    }
    emit(prefix); emit(eoi);
    if (bits > 0) { block[bn++] = acc & 255; if (bn === 255) { out.byte(255); out.bytes(block); bn = 0; } }
    if (bn) { out.byte(bn); out.bytes(block.subarray(0, bn)); }
    out.byte(0);
  }

  // frames: array of Uint8Array (w * h indices); palette: Uint8Array(768); delay in hundredths of a second.
  function encodeGif(frames, w, h, palette, delay, onProgress) {
    var out = new ByteWriter();
    out.text('GIF89a'); out.word(w); out.word(h);
    out.byte(0xF7); out.byte(0); out.byte(0);       // global colour table, 256 entries
    out.bytes(palette);
    out.byte(0x21); out.byte(0xFF); out.byte(11); out.text('NETSCAPE2.0');   // loop forever
    out.byte(3); out.byte(1); out.word(0); out.byte(0);
    var i = 0;
    return new Promise(function (resolve) {
      (function step() {
        var until = performance.now() + 30;
        while (i < frames.length && performance.now() < until) {
          out.byte(0x21); out.byte(0xF9); out.byte(4); out.byte(0x04); out.word(delay); out.byte(0); out.byte(0);
          out.byte(0x2C); out.word(0); out.word(0); out.word(w); out.word(h); out.byte(0);
          lzw(out, frames[i++]);
        }
        if (onProgress) onProgress(i / frames.length);
        if (i < frames.length) setTimeout(step, 0);
        else { out.byte(0x3B); resolve(new Blob([out.buf.subarray(0, out.n)], { type: 'image/gif' })); }
      })();
    });
  }

  global.encodeGif = encodeGif;
})(window);
