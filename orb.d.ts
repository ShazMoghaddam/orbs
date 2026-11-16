// Type definitions for Orbs 1.8
// https://github.com/ShazMoghaddam/orbs · Shaz Moghaddam · MIT

declare namespace Orb {
  /** The built-in shapes. Custom shapes added with Orb.define work too. */
  type ShapeName =
    | 'sphere' | 'wave' | 'spikes' | 'constellation' | 'torus' | 'helix' | 'galaxy' | 'ticks'
    | 'cube' | 'layers' | 'clusters' | 'ripple' | 'bars' | 'atom' | 'infinity' | 'vortex'
    | 'blob' | 'iris' | 'orbit' | 'check' | 'cross';

  /** The built-in named states. Add your own to Orb.states. */
  type StateName =
    | 'idle' | 'listening' | 'thinking' | 'working' | 'speaking'
    | 'active' | 'loading' | 'success' | 'error';

  type Vec3 = [number, number, number];
  /** A number, or a function of (dot index, shape data, seconds, position). */
  type PerDot = number | ((i: number, data: any, t: number, p: Vec3) => number);

  interface Options {
    /** First shape. Defaults to the first shape in `shapes`. */
    shape?: ShapeName | (string & {});
    /** A named state, which picks the shape and pace. */
    state?: StateName | (string & {});
    /** Shapes to cycle through, as an array or a comma-separated string. Defaults to all except check and cross. */
    shapes?: Array<ShapeName | (string & {})> | string;
    /** Number of dots. Default 180, or 320 with the lines style. */
    points?: number;
    /** Base rotation in radians per second. Default 0.35. */
    speed?: number;
    /** Dot radius in CSS pixels. Default 1.2. */
    dot?: number;
    /** Milliseconds between automatic morphs; 0 turns cycling off. Default 0. */
    cycle?: number;
    /** 'dots' (default) or 'lines', which draws glowing vertical slices. */
    style?: 'dots' | 'lines';
    /** Line thickness in CSS pixels for slices and connecting lines; 0 is automatic. */
    line?: number;
    /** A soft glow behind the shape: true for 8 px, or a size in pixels. */
    glow?: boolean | number;
    /** A faded mirror image underneath: true for 0.35, or a strength from 0 to 1. */
    reflect?: boolean | number;
    /** Extra tilt in degrees, added to each shape's own angle. */
    tilt?: number;
    /** Lean gently towards the pointer. */
    follow?: boolean;
    /** Tilt as the orb scrolls through the page. */
    scrollTilt?: boolean;
    /** 'morph' changes shape on hover or tap. */
    hover?: 'morph';
    /** 'morph' changes shape on click or tap only. */
    click?: 'morph';
    /** Morph when <body>'s data-theme or class changes. */
    themeMorph?: boolean;
    /** An <audio> or <video> (or a selector for one) to react to once it plays. */
    audio?: HTMLMediaElement | string;
    /** How strongly the orb reacts to sound. Default 1. */
    audioAmount?: number;
  }

  /** Settings that can change on a running orb with orb.set(). */
  type Settings = Omit<Options, 'hover' | 'click' | 'themeMorph' | 'audio'>;

  interface Audio {
    /** Overall loudness, 0 to 1. */
    level: number;
    /** Sixteen values from bass to treble, each 0 to 1. */
    bands: Float32Array;
    /** Set when listening to a microphone. */
    stream?: MediaStream;
  }

  interface Shape {
    /** Return n points inside the unit sphere, plus any data the other hooks need. */
    build(n: number): { pts: Vec3[]; edges?: Array<[number, number]>; [key: string]: any };
    /** Camera tilt in radians. */
    tilt?: number;
    /** Rotation multiplier. */
    spin?: number;
    /** Live motion: write a moved copy of p into out. */
    deform?(i: number, data: any, t: number, p: Vec3, out: Vec3): void;
    /** Greater than 0 draws a radial stroke of that length instead of a dot. */
    dash?(i: number, data: any, t: number, p: Vec3): number;
    /** React to sound: write a moved copy of p into out. */
    audio?(i: number, data: any, A: Audio, p: Vec3, out: Vec3): void;
    size?: PerDot;
    alpha?: PerDot;
    edgeAlpha?: PerDot;
    /** Turn to face the viewer instead of spinning, for flat marks. */
    face?: boolean;
    /** false leaves the shape out of the default cycle. */
    inCycle?: boolean;
    /** Lines style: the widest gap, in radii, still joined into one line. Default 0.45. */
    lineGap?: number;
    /** Size dots as a percentage of the orb's radius instead of pixels. */
    bigDots?: boolean;
  }

  interface State {
    shape: ShapeName | (string & {});
    speed?: number;
  }

  /** Detail of the 'orb:morph' event. */
  interface MorphDetail { shape: string }
  /** Detail of the 'orb:state' event. */
  interface StateDetail { state: string; shape: string }
}

declare class Orb {
  constructor(canvas: HTMLCanvasElement, options?: Orb.Options);

  /** The current shape. */
  readonly shape: string;
  /** The current named state, if one was set. */
  readonly stateName?: string;
  /** Sound analysis while listening, otherwise null. */
  readonly audio: Orb.Audio | null;

  /** Morph to a shape. */
  morph(shape: Orb.ShapeName | (string & {})): this;
  /** Morph to the next shape in the cycle. */
  next(): this;
  /** Switch to a named state: its shape and pace together. */
  state(name: Orb.StateName | (string & {})): this;
  /** Change settings while the orb runs. */
  set(settings: Orb.Settings): this;
  /** React to sound: an <audio> or <video>, a MediaStream, any Web Audio node, or 'mic'. Call it from a click. */
  listen(source: HTMLMediaElement | MediaStream | AudioNode | 'mic'): Promise<this>;
  /** Stop reacting to sound. A microphone this orb opened is closed. */
  unlisten(): this;
  /** Re-read the canvas's CSS colour, after changing it from script. */
  refreshColor(): void;
  /** Stop the orb and remove its listeners. */
  destroy(): void;

  /** Every registered shape. */
  static shapes: Record<string, Orb.Shape>;
  /** Every named state. Add your own: Orb.states.reviewing = { shape: 'helix', speed: 0.6 }. */
  static states: Record<string, Orb.State>;
  /** Register a custom shape. */
  static define(name: string, shape: Orb.Shape): void;
  /** Start any <canvas data-orb> inside root (default: the whole page) that isn't running yet. */
  static init(root?: ParentNode): void;
  /** The shared Web Audio context, for building your own audio nodes. */
  static audioContext(): AudioContext | null;
}

declare global {
  interface Window { Orb: typeof Orb }
  interface HTMLElementEventMap {
    'orb:morph': CustomEvent<Orb.MorphDetail>;
    'orb:state': CustomEvent<Orb.StateDetail>;
  }
}

export = Orb;
