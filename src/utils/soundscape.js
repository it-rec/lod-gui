// Procedural ambient soundscape — no audio files, just Web Audio nodes
// shaped per scene. Each scene is a function that takes an AudioContext
// and a destination GainNode (the master) and returns a `dispose()` that
// cleanly stops every source it spawned.
//
// The synthesis here is intentionally crude. The goal is "something
// suggestive at low volume," not realistic foley — and shipping no audio
// assets means there's nothing to fetch, nothing to license, nothing to
// keep the bundle small around.

// ---- Noise generators ------------------------------------------------

const NOISE_SECONDS = 4;

const fillWhite = (data) => {
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
};

const fillPink = (data) => {
  // Paul Kellet's economy pink-noise approximation.
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
};

const fillBrown = (data) => {
  let last = 0;
  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
};

const makeNoiseBuffer = (ctx, kind) => {
  const buffer = ctx.createBuffer(1, Math.floor(NOISE_SECONDS * ctx.sampleRate), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  if (kind === 'pink') fillPink(data);
  else if (kind === 'brown') fillBrown(data);
  else fillWhite(data);
  return buffer;
};

const noiseSource = (ctx, kind) => {
  const src = ctx.createBufferSource();
  src.buffer = makeNoiseBuffer(ctx, kind);
  src.loop = true;
  src.start();
  return src;
};

// ---- Tiny helpers ----------------------------------------------------

const gain = (ctx, value = 1) => {
  const g = ctx.createGain();
  g.gain.value = value;
  return g;
};

const filter = (ctx, type, freq, q = 1) => {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
};

const connect = (...nodes) => {
  for (let i = 0; i < nodes.length - 1; i += 1) nodes[i].connect(nodes[i + 1]);
};

// ---- Scenes ----------------------------------------------------------

const tavern = (ctx, dest) => {
  const src = noiseSource(ctx, 'brown');
  const bandpass = filter(ctx, 'bandpass', 360, 0.7);
  const g = gain(ctx, 0.7);
  connect(src, bandpass, g, dest);

  // Slow LFO on the band-pass centre frequency to imitate the swell of a
  // crowded room rather than a flat hum.
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.18;
  const lfoGain = gain(ctx, 90);
  connect(lfo, lfoGain);
  lfoGain.connect(bandpass.frequency);
  lfo.start();

  return () => {
    try { src.stop(); } catch { /* already stopped */ }
    try { lfo.stop(); } catch { /* already stopped */ }
  };
};

const forest = (ctx, dest) => {
  const src = noiseSource(ctx, 'pink');
  const lp = filter(ctx, 'lowpass', 2400, 0.6);
  const g = gain(ctx, 0.5);
  connect(src, lp, g, dest);
  // Occasional high chirp via a sine sweep on a schedule.
  const interval = window.setInterval(() => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const og = gain(ctx, 0);
    osc.frequency.setValueAtTime(2400 + Math.random() * 1800, now);
    osc.frequency.exponentialRampToValueAtTime(900 + Math.random() * 400, now + 0.18);
    og.gain.setValueAtTime(0, now);
    og.gain.linearRampToValueAtTime(0.12, now + 0.02);
    og.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    connect(osc, og, dest);
    osc.start(now);
    osc.stop(now + 0.3);
  }, 4500 + Math.random() * 4000);
  return () => {
    try { src.stop(); } catch { /* already stopped */ }
    window.clearInterval(interval);
  };
};

const dungeon = (ctx, dest) => {
  const src = noiseSource(ctx, 'brown');
  const lp = filter(ctx, 'lowpass', 220, 0.7);
  const g = gain(ctx, 0.55);
  connect(src, lp, g, dest);
  // Occasional drip — a short low-pass click followed by a quick echo.
  const interval = window.setInterval(() => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);
    const og = gain(ctx, 0);
    og.gain.setValueAtTime(0, now);
    og.gain.linearRampToValueAtTime(0.18, now + 0.005);
    og.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    connect(osc, og, dest);
    osc.start(now);
    osc.stop(now + 0.22);
  }, 3000 + Math.random() * 4000);
  return () => {
    try { src.stop(); } catch { /* already stopped */ }
    window.clearInterval(interval);
  };
};

const storm = (ctx, dest) => {
  const src = noiseSource(ctx, 'pink');
  const lp = filter(ctx, 'lowpass', 1400, 0.4);
  const hp = filter(ctx, 'highpass', 90, 0.6);
  const g = gain(ctx, 0.9);
  connect(src, hp, lp, g, dest);
  // LFO on the lowpass cutoff so the rain breathes.
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.09;
  const lfoGain = gain(ctx, 700);
  connect(lfo, lfoGain);
  lfoGain.connect(lp.frequency);
  lfo.start();
  return () => {
    try { src.stop(); } catch { /* already stopped */ }
    try { lfo.stop(); } catch { /* already stopped */ }
  };
};

const sea = (ctx, dest) => {
  const src = noiseSource(ctx, 'brown');
  const lp = filter(ctx, 'lowpass', 800, 0.6);
  const swell = gain(ctx, 0.4);
  connect(src, lp, swell, dest);
  // Slow swell with an LFO on the swell gain so waves rise and fall.
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.12;
  const lfoGain = gain(ctx, 0.35);
  connect(lfo, lfoGain);
  lfoGain.connect(swell.gain);
  lfo.start();
  return () => {
    try { src.stop(); } catch { /* already stopped */ }
    try { lfo.stop(); } catch { /* already stopped */ }
  };
};

export const SCENES = [
  { id: 'silence', label: 'Silence', build: null },
  { id: 'tavern',  label: 'Tavern',  build: tavern },
  { id: 'forest',  label: 'Forest',  build: forest },
  { id: 'dungeon', label: 'Dungeon', build: dungeon },
  { id: 'storm',   label: 'Storm',   build: storm },
  { id: 'sea',     label: 'Sea',     build: sea },
];

const SCENE_BY_ID = Object.fromEntries(SCENES.map((s) => [s.id, s]));

// Player factory. One AudioContext per app, lazily created on first play
// so a browser-suspended context doesn't get created unprompted. setScene
// is fade-safe — switching scenes crossfades over ~1s.
export const createSoundscapePlayer = ({ AudioContextImpl } = {}) => {
  const Ctx = AudioContextImpl
    || (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext));
  let ctx = null;
  let master = null;
  let current = null; // { id, dispose, gainNode }
  let volume = 0.4;

  const ensureContext = () => {
    if (ctx) return ctx;
    if (!Ctx) throw new Error('Web Audio API unavailable.');
    ctx = new Ctx();
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    return ctx;
  };

  const setVolume = (next) => {
    volume = Math.max(0, Math.min(1, Number(next) || 0));
    if (master) master.gain.value = volume;
  };

  const stop = () => {
    if (current) {
      const { dispose, gainNode } = current;
      if (gainNode && ctx) {
        const t = ctx.currentTime;
        gainNode.gain.cancelScheduledValues(t);
        gainNode.gain.setValueAtTime(gainNode.gain.value, t);
        gainNode.gain.linearRampToValueAtTime(0.0001, t + 0.6);
        window.setTimeout(() => dispose(), 700);
      } else {
        dispose();
      }
      current = null;
    }
  };

  const setScene = (id) => {
    const scene = SCENE_BY_ID[id];
    if (!scene) return;
    if (current && current.id === id) return;
    if (!scene.build) {
      stop();
      return;
    }
    ensureContext();
    if (ctx.state === 'suspended') ctx.resume();
    // Fade out the previous, fade in the new through its own gain.
    stop();
    const sceneGain = gain(ctx, 0);
    sceneGain.connect(master);
    const dispose = scene.build(ctx, sceneGain);
    const t = ctx.currentTime;
    sceneGain.gain.setValueAtTime(0, t);
    sceneGain.gain.linearRampToValueAtTime(1, t + 0.8);
    current = { id, dispose, gainNode: sceneGain };
  };

  const currentScene = () => (current ? current.id : 'silence');

  return { setScene, setVolume, stop, currentScene };
};
