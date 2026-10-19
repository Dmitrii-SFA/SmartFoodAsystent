import { SoundMelodyId, SoundSettingsConfig } from '../types/config';

export const SOUND_SETTINGS_STORAGE_KEY = 'sfa_sound_settings_v1';

export const DEFAULT_SOUND_SETTINGS: SoundSettingsConfig = {
  cookingSoundId: 'beep_classic',
  mealSoundId: 'music_marimba',
  volume: 0.85,
  vibrate: true,
};

export interface SoundMelodyMetadata {
  id: SoundMelodyId;
  category: 'music' | 'beep' | 'gong' | 'pot';
  icon: string;
  name: {
    ru: string;
    en: string;
    pl: string;
  };
  description: {
    ru: string;
    en: string;
    pl: string;
  };
}

export const SOUND_MELODIES: SoundMelodyMetadata[] = [
  {
    id: 'music_marimba',
    category: 'music',
    icon: '🎵',
    name: {
      ru: 'Музыка 1: Утренняя маримба',
      en: 'Music 1: Morning Marimba',
      pl: 'Muzyka 1: Poranna marimba',
    },
    description: {
      ru: 'Мягкий мелодичный перелив деревянных клавиш',
      en: 'Warm melodic wooden marimba arpeggio',
      pl: 'Ciepłe melodyjne arpeggio marimby',
    },
  },
  {
    id: 'music_waltz',
    category: 'music',
    icon: '🎶',
    name: {
      ru: 'Музыка 2: Кулинарный вальс',
      en: 'Music 2: Culinary Waltz',
      pl: 'Muzyka 2: Kulinarny walc',
    },
    description: {
      ru: 'Бодрая музыкальная фраза в ритме вальса',
      en: 'Cheerful musical phrase in waltz rhythm',
      pl: 'Radosna fraza muzyczna w rytmie walca',
    },
  },
  {
    id: 'music_zen',
    category: 'music',
    icon: '🎐',
    name: {
      ru: 'Музыка 3: Гармония и колокольчики',
      en: 'Music 3: Zen Chime Harmony',
      pl: 'Muzyka 3: Harmonia dzwonków Zen',
    },
    description: {
      ru: 'Спокойный переливчатый аккорд арфы и колокольчиков',
      en: 'Soothing harmonic chord with gentle chimes',
      pl: 'Spokojny akord harfy i dzwonków',
    },
  },
  {
    id: 'beep_classic',
    category: 'beep',
    icon: '⏰',
    name: {
      ru: 'Пищание 1: Классический таймер',
      en: 'Beep 1: Classic Kitchen Timer',
      pl: 'Sygnał 1: Klasyczny minutnik',
    },
    description: {
      ru: 'Чёткое тройное пищание кухонного таймера',
      en: 'Clear triple beep of a classic kitchen timer',
      pl: 'Wyraźny potrójny sygnał minutnika kuchennego',
    },
  },
  {
    id: 'beep_rapid',
    category: 'beep',
    icon: '📟',
    name: {
      ru: 'Пищание 2: Быстрый цифровой пульс',
      en: 'Beep 2: Rapid Digital Pulse',
      pl: 'Sygnał 2: Szybki impuls cyfrowy',
    },
    description: {
      ru: 'Энергичное двойное пищание электронных часов',
      en: 'Energetic double-pulse digital watch alarm',
      pl: 'Energiczny podwójny sygnał zegarka cyfrowego',
    },
  },
  {
    id: 'beep_soft',
    category: 'beep',
    icon: '🔔',
    name: {
      ru: 'Пищание 3: Мягкий звуковой маячок',
      en: 'Beep 3: Soft Beacon Ping',
      pl: 'Sygnał 3: Delikatny sygnał dźwiękowy',
    },
    description: {
      ru: 'Деликатное пищание с плавным затуханием',
      en: 'Delicate high-clarity ping with smooth decay',
      pl: 'Delikatny sygnał z płynnym wyciszeniem',
    },
  },
  {
    id: 'gong_strike',
    category: 'gong',
    icon: '🥁',
    name: {
      ru: 'Удар в гонг',
      en: 'Bronze Gong Strike',
      pl: 'Uderzenie w gong',
    },
    description: {
      ru: 'Глубокий объёмный удар в бронзовый гонг с долгим эхом',
      en: 'Deep resonant bronze gong strike with long shimmer',
      pl: 'Głębokie uderzenie w brązowy gong z długim echem',
    },
  },
  {
    id: 'spoon_pot',
    category: 'pot',
    icon: '🥄',
    name: {
      ru: 'Ложка по кастрюле',
      en: 'Spoon Tapping on Pot',
      pl: 'Stukanie łyżką o garnek',
    },
    description: {
      ru: 'Звонкий ритмичный стук металлической ложкой по кастрюле',
      en: 'Rhythmic metallic clanking of a spoon against a cooking pot',
      pl: 'Dźwięczne rytmiczne stukanie metalową łyżką o garnek',
    },
  },
];

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Unlocks Web Audio API on mobile browsers upon first user interaction
 */
export function unlockMobileAudio(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {
    // ignore
  }
}

export function loadSoundSettings(fromConfig?: SoundSettingsConfig): SoundSettingsConfig {
  if (fromConfig && fromConfig.cookingSoundId && fromConfig.mealSoundId) {
    return {
      cookingSoundId: fromConfig.cookingSoundId,
      mealSoundId: fromConfig.mealSoundId,
      volume: typeof fromConfig.volume === 'number' ? fromConfig.volume : 0.85,
      vibrate: typeof fromConfig.vibrate === 'boolean' ? fromConfig.vibrate : true,
    };
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(SOUND_SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          cookingSoundId: parsed.cookingSoundId || DEFAULT_SOUND_SETTINGS.cookingSoundId,
          mealSoundId: parsed.mealSoundId || DEFAULT_SOUND_SETTINGS.mealSoundId,
          volume: typeof parsed.volume === 'number' ? Math.min(1, Math.max(0, parsed.volume)) : 0.85,
          vibrate: typeof parsed.vibrate === 'boolean' ? parsed.vibrate : true,
        };
      }
    } catch {
      // ignore
    }
  }
  return DEFAULT_SOUND_SETTINGS;
}

export function saveSoundSettings(settings: SoundSettingsConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SOUND_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

/**
 * Synthesizes and plays any of the 8 sound melodies using Web Audio API
 */
export function playSoundMelody(
  melodyId: SoundMelodyId,
  options?: { volume?: number; vibrate?: boolean }
): void {
  try {
    const saved = loadSoundSettings();
    const volume =
      typeof options?.volume === 'number'
        ? Math.min(1, Math.max(0.01, options.volume))
        : Math.min(1, Math.max(0.01, saved.volume));
    const shouldVibrate =
      typeof options?.vibrate === 'boolean' ? options.vibrate : saved.vibrate;

    if (shouldVibrate && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        if (melodyId === 'gong_strike') {
          navigator.vibrate([450, 100, 250]);
        } else if (melodyId === 'spoon_pot') {
          navigator.vibrate([90, 70, 90, 140, 90, 70, 90, 70, 150]);
        } else {
          navigator.vibrate([220, 100, 220]);
        }
      } catch {
        // ignore vibration restriction
      }
    }

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, now);
    masterGain.connect(ctx.destination);

    // Helper for clean pitched tone
    const playTone = (
      freq: number,
      startOffset: number,
      duration: number,
      wave: OscillatorType = 'sine',
      peakGain = 0.35
    ) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, now + startOffset);

      g.gain.setValueAtTime(0.0001, now + startOffset);
      g.gain.exponentialRampToValueAtTime(peakGain, now + startOffset + 0.018);
      g.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);

      osc.connect(g);
      g.connect(masterGain);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.02);
    };

    switch (melodyId) {
      case 'music_marimba': {
        // Warm wooden marimba arpeggio: C5, E5, G5, B5, C6, G5, C6
        const notes = [
          { f: 523.25, t: 0.0, d: 0.22 },
          { f: 659.25, t: 0.14, d: 0.22 },
          { f: 783.99, t: 0.28, d: 0.22 },
          { f: 987.77, t: 0.42, d: 0.24 },
          { f: 1046.5, t: 0.56, d: 0.38 },
          { f: 783.99, t: 0.78, d: 0.2 },
          { f: 1046.5, t: 0.94, d: 0.5 },
        ];
        notes.forEach((n) => {
          playTone(n.f, n.t, n.d, 'sine', 0.38);
          // 4th harmonic gives authentic wooden marimba timbre
          playTone(n.f * 4, n.t, n.d * 0.35, 'sine', 0.08);
        });
        break;
      }

      case 'music_waltz': {
        // Cheerful culinary waltz phrase (G4 - B4 - D5 - G5 - F#5 - G5)
        const notes = [
          { f: 392.0, t: 0.0, d: 0.22 },
          { f: 493.88, t: 0.18, d: 0.18 },
          { f: 587.33, t: 0.36, d: 0.18 },
          { f: 783.99, t: 0.54, d: 0.32 },
          { f: 739.99, t: 0.84, d: 0.16 },
          { f: 783.99, t: 1.0, d: 0.48 },
        ];
        notes.forEach((n) => {
          playTone(n.f, n.t, n.d, 'triangle', 0.34);
          playTone(n.f * 2, n.t, n.d * 0.6, 'sine', 0.12);
        });
        break;
      }

      case 'music_zen': {
        // Soothing Zen harp & chime chord (F4 - A4 - C5 - E5 - G5 - C6)
        const notes = [
          { f: 349.23, t: 0.0, d: 1.3 },
          { f: 440.0, t: 0.1, d: 1.2 },
          { f: 523.25, t: 0.2, d: 1.15 },
          { f: 659.25, t: 0.3, d: 1.1 },
          { f: 783.99, t: 0.4, d: 1.05 },
          { f: 1046.5, t: 0.52, d: 1.1 },
        ];
        notes.forEach((n) => {
          playTone(n.f, n.t, n.d, 'sine', 0.24);
          playTone(n.f * 2.756, n.t, n.d * 0.45, 'sine', 0.05);
        });
        break;
      }

      case 'beep_classic': {
        // Classic triple kitchen timer beep
        playTone(1046.5, 0.0, 0.15, 'sine', 0.4);
        playTone(1318.5, 0.19, 0.15, 'sine', 0.4);
        playTone(1567.98, 0.38, 0.28, 'sine', 0.45);
        playTone(1046.5, 0.78, 0.15, 'sine', 0.4);
        playTone(1318.5, 0.97, 0.15, 'sine', 0.4);
        playTone(1567.98, 1.16, 0.32, 'sine', 0.45);
        break;
      }

      case 'beep_rapid': {
        // Rapid digital watch double-pulse beep-beep
        const offsets = [0.0, 0.11, 0.38, 0.49, 0.76, 0.87];
        offsets.forEach((t, idx) => {
          playTone(idx % 2 === 0 ? 1760 : 2093, t, 0.085, 'square', 0.22);
          playTone(idx % 2 === 0 ? 1760 : 2093, t, 0.085, 'sine', 0.3);
        });
        break;
      }

      case 'beep_soft': {
        // Soft beacon ping sequence
        playTone(880, 0.0, 0.28, 'sine', 0.35);
        playTone(1174.66, 0.32, 0.38, 'sine', 0.38);
        playTone(880, 0.82, 0.28, 'sine', 0.35);
        playTone(1318.5, 1.14, 0.45, 'sine', 0.4);
        break;
      }

      case 'gong_strike': {
        // Deep bronze gong strike with inharmonic metallic partials and shimmer
        const partials = [
          { f: 110.0, g: 0.42, d: 2.3 },
          { f: 164.8, g: 0.3, d: 2.0 },
          { f: 233.1, g: 0.25, d: 1.85 },
          { f: 342.0, g: 0.18, d: 1.6 },
          { f: 487.5, g: 0.14, d: 1.35 },
          { f: 718.0, g: 0.1, d: 1.05 },
          { f: 1085.0, g: 0.06, d: 0.75 },
        ];
        partials.forEach((p) => {
          playTone(p.f, 0.0, p.d, 'sine', p.g);
        });

        // Subtle metallic mallet strike wash
        const bufferSize = Math.floor(ctx.sampleRate * 0.25);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(520, now);
        filter.Q.setValueAtTime(2.5, now);
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.35, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(masterGain);
        noise.start(now);
        break;
      }

      case 'spoon_pot': {
        // Rhythmic metallic clanking of a spoon hitting a stainless steel pot:
        // "tink-clank ... tink-clank-clank!"
        const hits = [
          { t: 0.0, pitchScale: 1.0, strength: 0.45 },
          { t: 0.18, pitchScale: 1.08, strength: 0.5 },
          { t: 0.5, pitchScale: 0.96, strength: 0.42 },
          { t: 0.68, pitchScale: 1.05, strength: 0.48 },
          { t: 0.85, pitchScale: 1.12, strength: 0.55 },
        ];

        hits.forEach((hit) => {
          // Metallic pot & spoon modal frequencies
          const modes = [
            { f: 690 * hit.pitchScale, d: 0.19, g: hit.strength * 0.65 },
            { f: 1185 * hit.pitchScale, d: 0.14, g: hit.strength * 0.85 },
            { f: 1940 * hit.pitchScale, d: 0.11, g: hit.strength * 0.7 },
            { f: 2890 * hit.pitchScale, d: 0.08, g: hit.strength * 0.5 },
            { f: 4250 * hit.pitchScale, d: 0.055, g: hit.strength * 0.35 },
          ];

          modes.forEach((m) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(m.f, now + hit.t);

            g.gain.setValueAtTime(0.0001, now + hit.t);
            g.gain.linearRampToValueAtTime(m.g, now + hit.t + 0.004);
            g.gain.exponentialRampToValueAtTime(0.0001, now + hit.t + m.d);

            osc.connect(g);
            g.connect(masterGain);
            osc.start(now + hit.t);
            osc.stop(now + hit.t + m.d + 0.01);
          });

          // Short crisp metal impact click
          const clickLen = Math.floor(ctx.sampleRate * 0.03);
          const clickBuf = ctx.createBuffer(1, clickLen, ctx.sampleRate);
          const ch = clickBuf.getChannelData(0);
          for (let i = 0; i < clickLen; i++) {
            ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.006));
          }
          const src = ctx.createBufferSource();
          src.buffer = clickBuf;
          const hp = ctx.createBiquadFilter();
          hp.type = 'highpass';
          hp.frequency.setValueAtTime(1600, now + hit.t);
          const cg = ctx.createGain();
          cg.gain.setValueAtTime(hit.strength * 0.6, now + hit.t);
          src.connect(hp);
          hp.connect(cg);
          cg.connect(masterGain);
          src.start(now + hit.t);
        });
        break;
      }
    }
  } catch (e) {
    console.warn('Sound synthesis error:', e);
  }
}
