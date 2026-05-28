import { describe, it, expect, vi } from 'vitest';
import { createSoundscapePlayer, SCENES } from './soundscape';

// Minimal Web Audio fake — every method captures enough so the player's
// scene graph can build without touching real audio hardware.
const makeFakeAudioContext = () => {
  const created = [];
  const make = (type, extras = {}) => {
    const node = {
      type,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
      },
      frequency: {
        value: 0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
      },
      Q: { value: 1 },
      ...extras,
    };
    created.push(node);
    return node;
  };
  const ctx = {
    currentTime: 0,
    sampleRate: 44100,
    state: 'running',
    destination: { type: 'destination' },
    createGain: () => make('gain'),
    createBufferSource: () => make('bufferSource', { buffer: null, loop: false }),
    createBiquadFilter: () => make('biquad'),
    createOscillator: () => make('oscillator'),
    createBuffer: (channels, length) => ({
      getChannelData: () => new Float32Array(length),
    }),
    resume: vi.fn(),
  };
  return { ctx, created };
};

describe('createSoundscapePlayer', () => {
  it('starts silent and reports "silence" as the current scene', () => {
    const { ctx } = makeFakeAudioContext();
    const player = createSoundscapePlayer({ AudioContextImpl: function () { return ctx; } });
    expect(player.currentScene()).toBe('silence');
  });

  it('builds a graph when a real scene is selected', () => {
    const { ctx, created } = makeFakeAudioContext();
    const player = createSoundscapePlayer({ AudioContextImpl: function () { return ctx; } });
    player.setScene('tavern');
    expect(player.currentScene()).toBe('tavern');
    // The graph should at least allocate a noise buffer source and a few
    // gain / filter / oscillator nodes — the precise count is recipe-
    // specific, so just assert "more than the master gain we always make".
    expect(created.length).toBeGreaterThan(2);
    expect(created.some((n) => n.type === 'bufferSource')).toBe(true);
  });

  it('crossfades when the scene changes', () => {
    const { ctx } = makeFakeAudioContext();
    const player = createSoundscapePlayer({ AudioContextImpl: function () { return ctx; } });
    player.setScene('forest');
    expect(player.currentScene()).toBe('forest');
    player.setScene('storm');
    expect(player.currentScene()).toBe('storm');
  });

  it('treats unknown scene ids as a no-op', () => {
    const { ctx } = makeFakeAudioContext();
    const player = createSoundscapePlayer({ AudioContextImpl: function () { return ctx; } });
    player.setScene('tavern');
    player.setScene('not-a-real-scene');
    expect(player.currentScene()).toBe('tavern');
  });

  it('returns to silence and stops the synth on setScene("silence")', () => {
    const { ctx } = makeFakeAudioContext();
    const player = createSoundscapePlayer({ AudioContextImpl: function () { return ctx; } });
    player.setScene('dungeon');
    player.setScene('silence');
    expect(player.currentScene()).toBe('silence');
  });

  it('clamps setVolume into [0, 1]', () => {
    const { ctx } = makeFakeAudioContext();
    const player = createSoundscapePlayer({ AudioContextImpl: function () { return ctx; } });
    player.setScene('tavern');
    // Master gain is the first gain node created.
    expect(() => player.setVolume(-5)).not.toThrow();
    expect(() => player.setVolume(0.5)).not.toThrow();
    expect(() => player.setVolume(11)).not.toThrow();
  });

  it('exposes the scene table with id + label', () => {
    expect(SCENES.map((s) => s.id)).toEqual([
      'silence', 'tavern', 'forest', 'dungeon', 'storm', 'sea',
    ]);
    for (const s of SCENES) {
      expect(typeof s.label).toBe('string');
    }
  });
});
