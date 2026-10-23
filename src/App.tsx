/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Rocket, 
  Zap, 
  CheckCircle2, 
  Music, 
  Skull, 
  Crosshair, 
  RefreshCw,
  Scroll,
  BookOpen,
  X
} from 'lucide-react';

// ==========================================
// 1. Chiptune Audio Synthesizer (Web Audio API)
// Synthesizes the iconic melody of "U.N. Owen Was Her?"
// ==========================================
class ChiptuneSynth {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  isPlaying: boolean = false;
  timerId: number | null = null;
  currentStep: number = 0;
  volume: number = 0.35;
  customAudio: HTMLAudioElement | null = null;
  useCustomAudio: boolean = false;

  private noteFreq: { [key: string]: number } = {
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'Eb3': 155.56, 'E3': 164.81,
    'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'Ab3': 207.65, 'A3': 220.00,
    'Bb3': 233.08, 'B3': 246.94, 'C4': 261.63, 'C#4': 277.18, 'D4': 293.66,
    'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
    'Ab4': 415.30, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88, 'C5': 523.25,
    'C#5': 554.37, 'D5': 587.33, 'Eb5': 622.25, 'E5': 659.25, 'F5': 698.46,
    'G5': 783.99, 'A5': 880.00, 'Bb5': 932.33, '---': 0
  };

  private leadMelody: string[] = [
    'D4', 'D4', 'F4', 'G4', 'Ab4', 'G4', 'F4', 'D4',
    'D4', 'F4', 'G4', 'Ab4', 'D5', 'C5', 'Ab4', 'F4',
    'F4', 'E4', 'D4', 'C#4', 'D4', 'F4', 'G4', 'A4',
    'Bb4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C#4', 'E4',
    'D4', 'D4', 'F4', 'G4', 'Ab4', 'G4', 'F4', 'D4',
    'F4', 'G4', 'A4', 'Bb4', 'A4', 'G4', 'F4', 'E4',
    'D4', 'F4', 'A4', 'D5', 'C5', 'Bb4', 'A4', 'G4',
    'F4', 'E4', 'D4', 'C#4', 'D4', '---', 'D4', '---'
  ];

  private bassNotes: string[] = [
    'D3', 'D3', 'D3', 'D3', 'D3', 'D3', 'D3', 'D3',
    'F3', 'F3', 'F3', 'F3', 'G3', 'G3', 'G3', 'G3',
    'D3', 'D3', 'D3', 'D3', 'D3', 'D3', 'D3', 'D3',
    'Bb3', 'Bb3', 'Bb3', 'Bb3', 'A3', 'A3', 'A3', 'A3',
    'D3', 'D3', 'D3', 'D3', 'D3', 'D3', 'D3', 'D3',
    'F3', 'F3', 'F3', 'F3', 'G3', 'G3', 'G3', 'G3',
    'Bb3', 'Bb3', 'A3', 'A3', 'G3', 'G3', 'F3', 'F3',
    'E3', 'E3', 'Eb3', 'Eb3', 'D3', 'D3', 'D3', 'D3'
  ];

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val: number) {
    this.volume = val;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(val, this.ctx.currentTime);
    }
    if (this.customAudio) {
      this.customAudio.volume = val;
    }
  }

  play() {
    this.init();
    if (this.useCustomAudio && this.customAudio) {
      this.customAudio.play().catch(() => {});
      this.isPlaying = true;
      return;
    }

    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;

    const stepTimeMs = 95; // Fast tempo ~155 BPM
    this.timerId = window.setInterval(() => {
      this.tick();
    }, stepTimeMs);
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.customAudio) {
      this.customAudio.pause();
    }
  }

  private tick() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const step = this.currentStep % this.leadMelody.length;

    const leadNote = this.leadMelody[step];
    if (leadNote && leadNote !== '---' && this.noteFreq[leadNote]) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(this.noteFreq[leadNote], now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.085);
    }

    const bassNote = this.bassNotes[step % this.bassNotes.length];
    if (bassNote && this.noteFreq[bassNote]) {
      const bOsc = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bOsc.type = 'triangle';
      bOsc.frequency.setValueAtTime(this.noteFreq[bassNote], now);
      bGain.gain.setValueAtTime(0.22, now);
      bGain.gain.exponentialRampToValueAtTime(0.01, now + 0.085);
      bOsc.connect(bGain);
      bGain.connect(this.masterGain);
      bOsc.start(now);
      bOsc.stop(now + 0.09);
    }

    if (step % 4 === 2) {
      this.playNoise(now, 0.04, 0.08);
    } else if (step % 2 === 0) {
      this.playNoise(now, 0.018, 0.035);
    }

    this.currentStep++;
  }

  private playNoise(time: number, duration: number, vol: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + duration);
  }

  // Player shoot sound (Reimu amulet release)
  playPlayerShot() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  // Boss hit sound
  playBossHit() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.06);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  // Graze sound
  playGraze() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2200 + Math.random() * 200, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.05);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  // Hit / Penalty sound
  playHit() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.35);
    this.playNoise(now, 0.3, 0.4);
  }

  // Spell card announcement whistle
  playSpellCard() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.3);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  // Victory fanfare
  playVictory() {
    if (!this.ctx || !this.masterGain) return;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const now = this.ctx!.currentTime + idx * 0.09;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 0.4);
    });
  }

  // Defeat descending tones
  playDefeat() {
    if (!this.ctx || !this.masterGain) return;
    const notes = [400, 350, 300, 240, 180, 110];
    notes.forEach((freq, idx) => {
      const now = this.ctx!.currentTime + idx * 0.12;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 0.32);
    });
  }

  setCustomAudioUrl(url: string) {
    if (this.customAudio) {
      this.customAudio.pause();
    }
    if (url.trim()) {
      this.customAudio = new Audio(url.trim());
      this.customAudio.loop = true;
      this.customAudio.volume = this.volume;
      this.useCustomAudio = true;
      if (this.isPlaying) {
        if (this.timerId) clearInterval(this.timerId);
        this.customAudio.play().catch(() => {});
      }
    } else {
      this.customAudio = null;
      this.useCustomAudio = false;
    }
  }
}

const synthAudio = new ChiptuneSynth();

// ==========================================
// 2. Types and Danmaku Definitions
// ==========================================
interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  type: 'orb' | 'petal' | 'needle' | 'star' | 'laser';
  grazed: boolean;
  angle?: number;
}

interface PlayerBullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
}

export default function App() {
  // Game phases: 'ransomware' | 'game' | 'victory' | 'defeat'
  const [phase, setPhase] = useState<'ransomware' | 'game' | 'victory' | 'defeat'>('ransomware');
  const [transitioning, setTransitioning] = useState<boolean>(false);

  // Audio state
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.35);
  const [customAudioUrl, setCustomAudioUrl] = useState<string>('');
  const [showAudioModal, setShowAudioModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  // Focus / Slow mode state (mobile button or Shift)
  const [isSlowMode, setIsSlowMode] = useState<boolean>(false);
  const [autoShoot, setAutoShoot] = useState<boolean>(true);

  // Game metrics for UI - Max HP set to 500!
  const [survivalTime, setSurvivalTime] = useState<number>(30.0);
  const [bossHp, setBossHp] = useState<number>(500);
  const [grazeCount, setGrazeCount] = useState<number>(0);
  const [hitsCount, setHitsCount] = useState<number>(0);
  const [currentSpellCard, setCurrentSpellCard] = useState<string>('符卡：SpaceX『獵鷹重型・交錯八芒星之環』');
  const [spellCutinTimer, setSpellCutinTimer] = useState<number>(0);
  const [screenShaking, setScreenShaking] = useState<boolean>(false);
  const [hitWarningMessage, setHitWarningMessage] = useState<string | null>(null);

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Mutable Game Loop State
  const gameStateRef = useRef({
    player: {
      x: 200,
      y: 530,
      hitboxRadius: 3.2,
      grazeRadius: 22,
      isFocused: false,
      invulnerableTimer: 0,
      orbAngle: 0,
    },
    boss: {
      x: 200,
      y: 90,
      baseY: 90,
      hp: 500,
      maxHp: 500,
      hoverAngle: 0,
      hitFlashTimer: 0,
    },
    touch: {
      active: false,
      startX: 0,
      startY: 0,
      playerStartX: 200,
      playerStartY: 530,
    },
    keys: {
      left: false,
      right: false,
      up: false,
      down: false,
      shift: false,
      shoot: false,
    },
    playerBullets: [] as PlayerBullet[],
    bullets: [] as Bullet[],
    particles: [] as Particle[],
    stars: [] as Star[],
    timeLeft: 30.0,
    grazes: 0,
    hits: 0,
    frame: 0,
    spellIndex: 1,
    shootCooldown: 0,
  });

  // Start game from tense ransomware screen
  const handleSolveNow = () => {
    setTransitioning(true);
    synthAudio.init();
    synthAudio.setVolume(isMuted ? 0 : volume);
    synthAudio.play();

    setTimeout(() => {
      setPhase('game');
      setTransitioning(false);
      resetGameData();
    }, 500);
  };

  // Reset data - Max HP 500
  const resetGameData = useCallback(() => {
    const s = gameStateRef.current;
    s.player.x = 200;
    s.player.y = 530;
    s.player.invulnerableTimer = 0;
    s.player.orbAngle = 0;
    s.boss.hp = 500;
    s.boss.maxHp = 500;
    s.boss.hitFlashTimer = 0;
    s.playerBullets = [];
    s.bullets = [];
    s.particles = [];
    s.timeLeft = 30.0;
    s.grazes = 0;
    s.hits = 0;
    s.frame = 0;
    s.spellIndex = 1;
    s.shootCooldown = 0;

    setSurvivalTime(30.0);
    setBossHp(500);
    setGrazeCount(0);
    setHitsCount(0);
    setCurrentSpellCard('符卡：SpaceX『獵鷹重型・交錯八芒星之環』');
    setSpellCutinTimer(120); // 2-second cut-in
    setHitWarningMessage(null);
  }, []);

  const handlePlayAgain = () => {
    synthAudio.stop();
    setPhase('ransomware');
    resetGameData();
  };

  const handleInstantRetry = () => {
    setPhase('game');
    resetGameData();
    synthAudio.play();
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    synthAudio.setVolume(nextMuted ? 0 : volume);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (!isMuted) {
      synthAudio.setVolume(val);
    }
  };

  const handleApplyCustomAudio = () => {
    synthAudio.setCustomAudioUrl(customAudioUrl);
    setShowAudioModal(false);
  };

  // Initialize stars background
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 75; i++) {
      stars.push({
        x: Math.random() * 400,
        y: Math.random() * 640,
        speed: 0.6 + Math.random() * 2.2,
        size: 1 + Math.random() * 2,
        alpha: 0.2 + Math.random() * 0.8,
      });
    }
    gameStateRef.current.stars = stars;
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keys = gameStateRef.current.keys;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = true;
      if (e.key === 'Shift') {
        keys.shift = true;
        setIsSlowMode(true);
        gameStateRef.current.player.isFocused = true;
      }
      if (e.key === 'z' || e.key === 'Z' || e.key === ' ') {
        keys.shoot = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = gameStateRef.current.keys;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
      if (e.key === 'Shift') {
        keys.shift = false;
        setIsSlowMode(false);
        gameStateRef.current.player.isFocused = false;
      }
      if (e.key === 'z' || e.key === 'Z' || e.key === ' ') {
        keys.shoot = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    gameStateRef.current.player.isFocused = isSlowMode;
  }, [isSlowMode]);

  // Touch Controller for Mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!e.touches[0] || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const scaleY = 640 / rect.height;

    const t = gameStateRef.current.touch;
    t.active = true;
    t.startX = (e.touches[0].clientX - rect.left) * scaleX;
    t.startY = (e.touches[0].clientY - rect.top) * scaleY;
    t.playerStartX = gameStateRef.current.player.x;
    t.playerStartY = gameStateRef.current.player.y;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const t = gameStateRef.current.touch;
    if (!t.active || !e.touches[0] || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const scaleY = 640 / rect.height;

    const currentX = (e.touches[0].clientX - rect.left) * scaleX;
    const currentY = (e.touches[0].clientY - rect.top) * scaleY;

    const deltaX = currentX - t.startX;
    const deltaY = currentY - t.startY;

    const mult = gameStateRef.current.player.isFocused ? 0.5 : 1.0;
    gameStateRef.current.player.x = t.playerStartX + deltaX * mult;
    gameStateRef.current.player.y = t.playerStartY + deltaY * mult;
  };

  const handleTouchEnd = () => {
    gameStateRef.current.touch.active = false;
  };

  // Mouse drag fallback for PC testing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const scaleY = 640 / rect.height;

    const t = gameStateRef.current.touch;
    t.active = true;
    t.startX = (e.clientX - rect.left) * scaleX;
    t.startY = (e.clientY - rect.top) * scaleY;
    t.playerStartX = gameStateRef.current.player.x;
    t.playerStartY = gameStateRef.current.player.y;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const t = gameStateRef.current.touch;
    if (!t.active || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const scaleY = 640 / rect.height;

    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    const deltaX = currentX - t.startX;
    const deltaY = currentY - t.startY;

    const mult = gameStateRef.current.player.isFocused ? 0.5 : 1.0;
    gameStateRef.current.player.x = t.playerStartX + deltaX * mult;
    gameStateRef.current.player.y = t.playerStartY + deltaY * mult;
  };

  const handleMouseUp = () => {
    gameStateRef.current.touch.active = false;
  };

  // Main 60fps Game Loop
  useEffect(() => {
    if (phase !== 'game') {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const s = gameStateRef.current;
      s.frame++;

      // 1. Time countdown (Over 30s = Defeat!)
      s.timeLeft = Math.max(0, s.timeLeft - dt);
      setSurvivalTime(parseFloat(s.timeLeft.toFixed(1)));

      if (s.timeLeft <= 0) {
        synthAudio.playDefeat();
        setPhase('defeat');
        return;
      }

      // Check Boss HP (Defeat Boss = Victory!)
      if (s.boss.hp <= 0) {
        synthAudio.playVictory();
        setPhase('victory');
        return;
      }

      // Update Spell Card announcements based on Boss HP (500 max HP scale)
      // 500 ~ 350: Phase 1
      // 350 ~ 175: Phase 2
      // 175 ~ 0: Phase 3
      if (s.boss.hp > 350) {
        if (s.spellIndex !== 1) {
          s.spellIndex = 1;
          setCurrentSpellCard('符卡：SpaceX『獵鷹重型・交錯八芒星之環』');
          setSpellCutinTimer(100);
          synthAudio.playSpellCard();
        }
      } else if (s.boss.hp > 175) {
        if (s.spellIndex !== 2) {
          s.spellIndex = 2;
          setCurrentSpellCard('符卡：Twitter『全頻干擾・千層迷幻花瓣渦流』');
          setSpellCutinTimer(100);
          synthAudio.playSpellCard();
        }
      } else {
        if (s.spellIndex !== 3) {
          s.spellIndex = 3;
          setCurrentSpellCard('符卡：火星『最終鬼畜・星艦狂暴彈幕地獄』');
          setSpellCutinTimer(100);
          synthAudio.playSpellCard();
        }
      }

      if (spellCutinTimer > 0) {
        setSpellCutinTimer(prev => Math.max(0, prev - 1));
      }

      // 2. Boss movement
      s.boss.hoverAngle += 0.035;
      s.boss.x = 200 + Math.sin(s.boss.hoverAngle) * 90;
      s.boss.y = s.boss.baseY + Math.cos(s.boss.hoverAngle * 2) * 12;

      if (s.boss.hitFlashTimer > 0) {
        s.boss.hitFlashTimer -= dt;
      }

      // 3. Player Movement
      if (!s.touch.active) {
        const speed = s.player.isFocused ? 2.2 : 5.0;
        let dx = 0;
        let dy = 0;
        if (s.keys.left) dx -= 1;
        if (s.keys.right) dx += 1;
        if (s.keys.up) dy -= 1;
        if (s.keys.down) dy += 1;

        if (dx !== 0 && dy !== 0) {
          dx *= 0.7071;
          dy *= 0.7071;
        }
        s.player.x += dx * speed;
        s.player.y += dy * speed;
      }

      // Reimu Yin-Yang orb rotation angle
      s.player.orbAngle += s.player.isFocused ? 0.04 : 0.08;

      // Clamp player within 400x640 mobile canvas boundaries
      s.player.x = Math.max(16, Math.min(384, s.player.x));
      s.player.y = Math.max(80, Math.min(618, s.player.y));

      if (s.player.invulnerableTimer > 0) {
        s.player.invulnerableTimer -= dt;
      }

      // 4. Reimu Hakurei Shooting (Amulets / Homing Talismans)
      s.shootCooldown -= dt;
      if ((autoShoot || s.keys.shoot) && s.shootCooldown <= 0) {
        s.shootCooldown = 0.09; // rapid fire
        synthAudio.playPlayerShot();

        const px = s.player.x;
        const py = s.player.y - 14;

        // Reimu fires dual talismans + Yin-Yang focus lasers
        s.playerBullets.push({
          x: px - 8,
          y: py,
          vx: s.player.isFocused ? 0 : -0.6,
          vy: -11,
          radius: 3.5,
          color: '#ff2244',
        });
        s.playerBullets.push({
          x: px + 8,
          y: py,
          vx: s.player.isFocused ? 0 : 0.6,
          vy: -11,
          radius: 3.5,
          color: '#ff2244',
        });
      }

      // Update Player Bullets & Boss Collision
      const remainingPBullets: PlayerBullet[] = [];
      const bx = s.boss.x;
      const by = s.boss.y;

      for (let pb of s.playerBullets) {
        pb.x += pb.vx;
        pb.y += pb.vy;

        // Boss collision
        const distToBoss = Math.hypot(pb.x - bx, pb.y - by);
        if (distToBoss < 32) {
          // Hit Boss! Max HP 500
          s.boss.hp = Math.max(0, s.boss.hp - 4.5);
          setBossHp(Math.round(s.boss.hp));
          s.boss.hitFlashTimer = 0.08;
          synthAudio.playBossHit();

          // Spark particles
          for (let sp = 0; sp < 2; sp++) {
            s.particles.push({
              x: pb.x,
              y: pb.y,
              vx: (Math.random() - 0.5) * 3,
              vy: Math.random() * 2 + 1,
              radius: 1.5,
              color: '#ff2b85',
              alpha: 0.8,
              decay: 0.08,
            });
          }
          continue;
        }

        if (pb.y > -20) {
          remainingPBullets.push(pb);
        }
      }
      s.playerBullets = remainingPBullets;

      // 5. Authentic Touhou Danmaku Patterns
      const f = s.frame;

      // Pattern 1: 博麗神社風「雙向交錯反向同心環」
      if (f % 34 === 0) {
        const count = 16;
        const rot1 = (f * 0.04) % (Math.PI * 2);
        const rot2 = (-f * 0.04) % (Math.PI * 2);

        // Ring A (Cyan, clockwise)
        for (let i = 0; i < count; i++) {
          const a = rot1 + (i * Math.PI * 2) / count;
          s.bullets.push({
            x: bx,
            y: by,
            vx: Math.cos(a) * 2.3,
            vy: Math.sin(a) * 2.3,
            radius: 5,
            color: '#00f5ff',
            type: 'orb',
            grazed: false,
          });
        }
        // Ring B (Magenta, counter-clockwise)
        for (let i = 0; i < count; i++) {
          const a = rot2 + (i * Math.PI * 2) / count + (Math.PI / count);
          s.bullets.push({
            x: bx,
            y: by,
            vx: Math.cos(a) * 1.8,
            vy: Math.sin(a) * 1.8,
            radius: 4.5,
            color: '#ff2b85',
            type: 'orb',
            grazed: false,
          });
        }
      }

      // Pattern 2: 蕾米莉亞/芙蘭風「8臂千層旋轉花瓣渦流」
      if (s.boss.hp <= 350 && f % 6 === 0) {
        const arms = 8;
        const spd = 2.8;
        const angleBase = f * 0.09;
        for (let i = 0; i < arms; i++) {
          const a = angleBase + (i * Math.PI * 2) / arms;
          s.bullets.push({
            x: bx,
            y: by,
            vx: Math.cos(a) * spd,
            vy: Math.sin(a) * spd,
            radius: 3.8,
            color: '#39ff14',
            type: 'petal',
            grazed: false,
            angle: a,
          });
        }
      }

      // Pattern 3: 經典自機狙い米彈 (Targeted Sniper Needle Stream)
      if (f % 42 === 0) {
        const aimAngle = Math.atan2(s.player.y - by, s.player.x - bx);
        const count = s.boss.hp <= 175 ? 5 : 3;
        for (let i = -Math.floor(count / 2); i <= Math.floor(count / 2); i++) {
          const a = aimAngle + i * 0.12;
          s.bullets.push({
            x: bx,
            y: by,
            vx: Math.cos(a) * 4.2,
            vy: Math.sin(a) * 4.2,
            radius: 3.5,
            color: '#ffd700',
            type: 'needle',
            grazed: false,
            angle: a,
          });
        }
      }

      // Pattern 4: 終符狂暴「火星超光速星艦大玉」
      if (s.boss.hp <= 175 && f % 48 === 0) {
        const orbCount = 8;
        const baseRot = Math.random() * Math.PI;
        for (let i = 0; i < orbCount; i++) {
          const a = baseRot + (i * Math.PI * 2) / orbCount;
          s.bullets.push({
            x: bx,
            y: by,
            vx: Math.cos(a) * 2.0,
            vy: Math.sin(a) * 2.0,
            radius: 8.0,
            color: '#ff0055',
            type: 'orb',
            grazed: false,
          });
        }
      }

      // 6. Update Bullets & Player Collisions
      const remainingBullets: Bullet[] = [];
      const px = s.player.x;
      const py = s.player.y;
      const hitR = s.player.hitboxRadius;
      const grazeR = s.player.grazeRadius;
      const isInvulnerable = s.player.invulnerableTimer > 0;

      for (let b of s.bullets) {
        b.x += b.vx;
        b.y += b.vy;

        if (b.x < -30 || b.x > 430 || b.y < -30 || b.y > 670) {
          continue;
        }

        const dist = Math.hypot(b.x - px, b.y - py);

        // A. PLAYER HIT DETECTION -> DEDUCT 2 SECONDS!
        if (!isInvulnerable && dist < (hitR + b.radius)) {
          s.hits++;
          setHitsCount(s.hits);
          s.player.invulnerableTimer = 1.6;
          
          // DEDUCT 2.0 SECONDS!
          s.timeLeft = Math.max(0, s.timeLeft - 2.0);
          setSurvivalTime(parseFloat(s.timeLeft.toFixed(1)));

          setScreenShaking(true);
          setTimeout(() => setScreenShaking(false), 350);
          synthAudio.playHit();

          setHitWarningMessage('💥 被彈！時間扣除 -2.0 秒！');
          setTimeout(() => setHitWarningMessage(null), 1800);

          for (let p = 0; p < 24; p++) {
            const pAngle = Math.random() * Math.PI * 2;
            const pSpd = 2 + Math.random() * 5;
            s.particles.push({
              x: px,
              y: py,
              vx: Math.cos(pAngle) * pSpd,
              vy: Math.sin(pAngle) * pSpd,
              radius: 2.5,
              color: '#ff0044',
              alpha: 1.0,
              decay: 0.04,
            });
          }

          if (s.timeLeft <= 0) {
            synthAudio.playDefeat();
            setPhase('defeat');
            return;
          }

          continue;
        }

        // B. GRAZE DETECTION
        if (!b.grazed && dist < (grazeR + b.radius)) {
          b.grazed = true;
          s.grazes++;
          setGrazeCount(s.grazes);
          synthAudio.playGraze();

          for (let g = 0; g < 2; g++) {
            s.particles.push({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              radius: 1.5,
              color: '#ffffff',
              alpha: 0.9,
              decay: 0.07,
            });
          }
        }

        remainingBullets.push(b);
      }
      s.bullets = remainingBullets;

      // 7. Update Particles
      for (let p = s.particles.length - 1; p >= 0; p--) {
        const pt = s.particles[p];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= pt.decay;
        if (pt.alpha <= 0) {
          s.particles.splice(p, 1);
        }
      }

      // 8. Update Stars
      for (let st of s.stars) {
        st.y += st.speed;
        if (st.y > 640) {
          st.y = 0;
          st.x = Math.random() * 400;
        }
      }

      // ==========================================
      // RENDER CANVAS (Mobile-optimised 400x640)
      // ==========================================
      ctx.fillStyle = '#06070d';
      ctx.fillRect(0, 0, 400, 640);

      // Stars
      for (let st of s.stars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${st.alpha})`;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Space red/purple aura
      const grad = ctx.createRadialGradient(200, 320, 40, 200, 320, 300);
      grad.addColorStop(0, 'rgba(255, 0, 68, 0.05)');
      grad.addColorStop(0.5, 'rgba(181, 55, 242, 0.04)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 640);

      // Render Player Bullets (Reimu Hakurei Amulets / 御札)
      for (let pb of s.playerBullets) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff0033';
        ctx.shadowBlur = 8;
        // Talisman card shape
        ctx.fillRect(pb.x - 3, pb.y - 8, 6, 16);
        ctx.fillStyle = '#ff0033';
        ctx.fillRect(pb.x - 1.5, pb.y - 6, 3, 12);
        ctx.restore();
      }

      // Render Boss: Elon Musk
      ctx.save();
      ctx.translate(s.boss.x, s.boss.y);

      if (s.boss.hitFlashTimer > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, 35, 0, Math.PI * 2);
        ctx.fill();
      }

      // Boss Magic Hexagram
      ctx.strokeStyle = s.boss.hp <= 175 ? 'rgba(255, 0, 85, 0.6)' : 'rgba(0, 245, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.save();
      ctx.rotate(f * 0.025);
      ctx.strokeRect(-24, -24, 48, 48);
      ctx.restore();

      // Rocket flame
      ctx.fillStyle = '#ff4400';
      ctx.beginPath();
      ctx.moveTo(-10, 20);
      ctx.lineTo(0, 32 + Math.sin(f * 0.4) * 6);
      ctx.lineTo(10, 20);
      ctx.fill();

      // Tuxedo
      ctx.fillStyle = '#161926';
      ctx.beginPath();
      ctx.roundRect(-20, 6, 40, 20, 6);
      ctx.fill();

      // Shirt & Tie
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-5, 8, 10, 8);
      ctx.fillStyle = '#ff2b85';
      ctx.fillRect(-2, 11, 4, 8);

      // Face
      ctx.fillStyle = '#f5d6af';
      ctx.beginPath();
      ctx.arc(0, -2, 15, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = '#5c4033';
      ctx.beginPath();
      ctx.arc(0, -8, 15, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-15, -9, 30, 5);

      // Sunglasses / Laser eyes
      ctx.fillStyle = '#111111';
      ctx.fillRect(-11, -4, 9, 5);
      ctx.fillRect(2, -4, 9, 5);
      ctx.strokeStyle = '#00f5ff';
      ctx.strokeRect(-11, -4, 9, 5);
      ctx.strokeRect(2, -4, 9, 5);

      // Name label
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'center';
      ctx.fillText('ELON MUSK', 0, -22);

      ctx.restore();

      // Render Bullets (Authentic Touhou Layered Glow)
      for (let b of s.bullets) {
        ctx.save();
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = b.radius > 6 ? 12 : 6;

        if (b.type === 'orb') {
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
        } else if (b.type === 'needle') {
          ctx.translate(b.x, b.y);
          ctx.rotate(b.angle || Math.atan2(b.vy, b.vx));
          ctx.beginPath();
          ctx.ellipse(0, 0, 8, 2.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-3, -1, 6, 2);
        } else if (b.type === 'petal') {
          ctx.translate(b.x, b.y);
          ctx.rotate(b.angle || Math.atan2(b.vy, b.vx));
          ctx.beginPath();
          ctx.ellipse(0, 0, 6.5, 3.2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Render Particles
      for (let pt of s.particles) {
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // ==========================================
      // RENDER HAKUREI REIMU (博麗靈夢自機形象)
      // ==========================================
      const isBlinking = isInvulnerable && Math.floor(s.frame / 4) % 2 === 0;
      if (!isBlinking) {
        ctx.save();
        ctx.translate(px, py);

        // 1. Yin-Yang Orbs (陰陽玉) orbiting Reimu
        const orbDist = s.player.isFocused ? 14 : 24;
        const orb1X = Math.cos(s.player.orbAngle) * orbDist;
        const orb1Y = Math.sin(s.player.orbAngle) * (orbDist * 0.5) - (s.player.isFocused ? 12 : 0);
        const orb2X = -orb1X;
        const orb2Y = -orb1Y - (s.player.isFocused ? 12 : 0);

        // Draw Orbiting Yin-Yang Orb 1
        const drawYinYang = (ox: number, oy: number) => {
          ctx.save();
          ctx.translate(ox, oy);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(255, 0, 68, 0.8)';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
          ctx.fill();
          // Black half
          ctx.fillStyle = '#111111';
          ctx.beginPath();
          ctx.arc(0, 0, 5.5, -Math.PI / 2, Math.PI / 2);
          ctx.fill();
          // Small dots
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 2.5, 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#111111';
          ctx.beginPath();
          ctx.arc(0, -2.5, 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        };

        drawYinYang(orb1X, orb1Y);
        drawYinYang(orb2X, orb2Y);

        // 2. Reimu Character Sprite (Chibi Pixel Miko)
        // A. Hair (Dark Brown, twin side tufts)
        ctx.fillStyle = '#2d1d18';
        ctx.beginPath();
        ctx.arc(0, -6, 9.5, 0, Math.PI * 2);
        ctx.fill();

        // Twin side hair locks with white ties
        ctx.fillRect(-10, -4, 3, 11);
        ctx.fillRect(7, -4, 3, 11);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-10, 0, 3, 2);
        ctx.fillRect(7, 0, 3, 2);

        // B. Hakurei Big Red Hair Ribbon (博麗大紅蝴蝶結)
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        // Left ribbon wing
        ctx.moveTo(-2, -13);
        ctx.lineTo(-13, -18);
        ctx.lineTo(-11, -9);
        ctx.closePath();
        ctx.fill();
        // Right ribbon wing
        ctx.beginPath();
        ctx.moveTo(2, -13);
        ctx.lineTo(13, -18);
        ctx.lineTo(11, -9);
        ctx.closePath();
        ctx.fill();
        // Center knot
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.arc(0, -12, 3, 0, Math.PI * 2);
        ctx.fill();

        // C. Cute Face & Bangs
        ctx.fillStyle = '#fce4c8';
        ctx.beginPath();
        ctx.arc(0, -4, 6.5, 0, Math.PI * 2);
        ctx.fill();

        // Front bangs
        ctx.fillStyle = '#2d1d18';
        ctx.beginPath();
        ctx.arc(0, -7, 6.5, 0, Math.PI);
        ctx.fill();

        // Anime Eyes (Brown/Ruby)
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(-3.5, -5, 2, 3);
        ctx.fillRect(1.5, -5, 2, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-3, -5, 1, 1);
        ctx.fillRect(2, -5, 1, 1);

        // D. Miko Vest & Robe (紅白巫女服)
        // Red vest
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(-6.5, 2, 13, 12, 3);
        ctx.fill();

        // White collar & ascot tie
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-3, 2);
        ctx.lineTo(0, 6);
        ctx.lineTo(3, 2);
        ctx.closePath();
        ctx.fill();

        // Detached sleeves (分離式白袖)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-10.5, 3, 4, 8);
        ctx.fillRect(6.5, 3, 4, 8);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-10.5, 9, 4, 2);
        ctx.fillRect(6.5, 9, 4, 2);

        // 3. Focused Mode Focus Ring (Shift / SLOW)
        if (s.player.isFocused) {
          ctx.strokeStyle = 'rgba(255, 0, 68, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.save();
          ctx.rotate(f * 0.06);
          ctx.beginPath();
          ctx.arc(0, 0, 19, 0, Math.PI * 2);
          ctx.stroke();
          for (let r = 0; r < 4; r++) {
            const rotA = (r * Math.PI) / 2;
            ctx.fillStyle = '#ff2b85';
            ctx.beginPath();
            ctx.arc(Math.cos(rotA) * 19, Math.sin(rotA) * 19, 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // 4. CORE HITBOX (判定點): Precise red dot with white core
        ctx.fillStyle = '#ff0044';
        ctx.shadowColor = '#ff0044';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(0, 0, hitR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // ==========================================
      // Spell Card Announcement Banner (Touhou Cut-in)
      // ==========================================
      if (spellCutinTimer > 0) {
        ctx.save();
        const bannerAlpha = Math.min(1.0, spellCutinTimer / 20);
        ctx.globalAlpha = bannerAlpha;

        // Diagonal banner background
        ctx.fillStyle = 'rgba(220, 38, 38, 0.85)';
        ctx.fillRect(0, 240, 400, 48);

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 240, 400, 48);

        // Spell Card announcement text
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('SPELL CARD ATTACK!', 200, 258);

        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(currentSpellCard, 200, 276);

        ctx.restore();
      }

      // Canvas Header HUD: Boss HP Bar (Scaled to 500 Max HP)
      ctx.fillStyle = 'rgba(10, 14, 25, 0.85)';
      ctx.fillRect(0, 0, 400, 28);

      const hpPercent = Math.max(0, s.boss.hp / 500);
      ctx.fillStyle = '#222';
      ctx.fillRect(8, 8, 384, 8);
      ctx.fillStyle = hpPercent > 0.35 ? '#ff2b85' : '#ff0000';
      ctx.fillRect(8, 8, 384 * hpPercent, 8);

      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(`BOSS HP: ${Math.round(s.boss.hp)} / 500`, 10, 24);

      ctx.fillStyle = s.timeLeft <= 10 ? '#ff0044' : '#00f5ff';
      ctx.textAlign = 'right';
      ctx.fillText(`TIME: ${s.timeLeft.toFixed(1)}s`, 390, 24);

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [phase, autoShoot, spellCutinTimer, currentSpellCard]);

  return (
    <div className="min-h-screen w-full bg-[#080911] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans select-none touch-none">
      
      {/* ========================================================= */}
      {/* PHASE 1: TENSE EMERGENCY RED RANSOMWARE SCREEN            */}
      {/* ========================================================= */}
      {phase === 'ransomware' && (
        <div 
          className={`w-full min-h-screen flex flex-col items-center justify-center p-4 relative transition-all duration-500 overflow-y-auto ${
            transitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/40 via-red-900/20 to-black pointer-events-none emergency-bg-flash" />
          <div className="absolute inset-0 crt-overlay pointer-events-none" />

          <div className="relative max-w-sm sm:max-w-md w-full bg-black/95 border-2 border-red-600 virus-border-pulse rounded-xl p-5 sm:p-7 text-center shadow-2xl space-y-4 my-auto">
            
            <div className="flex items-center justify-between border-b border-red-900/80 pb-3">
              <div className="flex items-center gap-1.5 text-red-500 font-pixel text-[10px] animate-pulse">
                <Skull className="w-4 h-4 text-red-500 animate-bounce" />
                <span>TROJAN.ELON.SPACEX</span>
              </div>
              <span className="text-[10px] bg-red-600 text-white font-mono px-2 py-0.5 rounded font-bold animate-pulse">
                CRITICAL 100%
              </span>
            </div>

            <div className="space-y-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]">
                <AlertTriangle className="w-8 h-8 animate-ping" />
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-red-500 tracking-tight leading-snug drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]">
                ⚠️ 系統警告：您的裝置已被鎖定
              </h1>
            </div>

            <div className="text-sm sm:text-base text-neutral-200 leading-relaxed font-sans border-y border-red-900/60 py-4 space-y-3">
              <p className="font-semibold text-white drop-shadow">
                我是伊隆馬。我現在差 1000 塊就能湊齊 SpaceX 的火箭發射預算。立即 V 我 1000，我就幫你解除被盜。
              </p>

              <div className="text-[11px] text-red-400 font-mono space-y-1 bg-red-950/40 p-2.5 rounded text-left border border-red-900/80">
                <div className="flex justify-between">
                  <span>[!] 感染病毒:</span>
                  <span className="text-white font-bold">Ransom:Win32/MuskLock</span>
                </div>
                <div className="flex justify-between">
                  <span>[!] 加密時限:</span>
                  <span className="text-red-300 font-bold animate-pulse">00:00:30 (即將自毀)</span>
                </div>
                <div className="flex justify-between">
                  <span>[!] 迎戰自機:</span>
                  <span className="text-yellow-400 font-bold">博麗神社巫女・博麗靈夢</span>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <button
                onClick={handleSolveNow}
                className="w-full py-3.5 px-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-[0.98] text-white rounded-lg font-bold text-base flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(220,38,38,0.5)] cursor-pointer"
              >
                <span>下一步（博麗靈夢出擊迎戰）</span>
                <span className="text-red-200">→</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PHASE 2: MOBILE-FIRST TOUHOU DANMAKU SHOOTING MINI-GAME   */}
      {/* ========================================================= */}
      {phase === 'game' && (
        <div className={`w-full h-screen max-h-[100dvh] flex flex-col items-center justify-between p-1 sm:p-2 relative overflow-hidden ${screenShaking ? 'shake-active' : ''}`}>
          
          {/* Mobile Top HUD */}
          <div className="w-full max-w-[420px] flex items-center justify-between px-3 py-1.5 bg-[#121422]/90 backdrop-blur border border-neutral-800 rounded-lg text-xs font-mono-retro z-10">
            {/* Countdown Timer */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${survivalTime <= 10 ? 'bg-red-500 animate-ping' : 'bg-cyan-400'}`} />
              <div className="text-[11px]">
                <span className="text-neutral-400">時限: </span>
                <span className={`font-pixel font-bold text-sm ${survivalTime <= 10 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
                  {survivalTime.toFixed(1)}s
                </span>
              </div>
            </div>

            {/* Graze / Hits */}
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-yellow-400 font-pixel">G:{grazeCount}</span>
              <span className={`font-pixel ${hitsCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                H:{hitsCount}
              </span>
            </div>

            {/* Spell Rules, Audio, Settings */}
            <div className="flex items-center gap-1.5">
              {/* 符卡規則 Button */}
              <button
                onClick={() => setShowRulesModal(true)}
                className="px-1.5 py-0.5 bg-red-950/70 border border-red-700/80 rounded text-[10px] text-red-300 hover:text-white flex items-center gap-1 cursor-pointer font-bold"
                title="查看符卡規則"
              >
                <Scroll className="w-3 h-3 text-red-400" />
                <span>符卡規則</span>
              </button>

              <button
                onClick={handleToggleMute}
                className="p-1 text-neutral-300 hover:text-cyan-400 cursor-pointer"
                title="音量"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
              <button
                onClick={() => setShowAudioModal(true)}
                className="p-1 text-neutral-400 hover:text-yellow-400 cursor-pointer"
                title="自訂音訊"
              >
                <Music className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Spell Card Announcement Bar */}
          <div className="w-full max-w-[420px] px-2 py-0.5 text-center truncate flex items-center justify-center gap-1.5">
            <span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded font-mono">SPELL</span>
            <span className="text-[10px] text-yellow-300 font-pixel tracking-tighter drop-shadow truncate">
              {currentSpellCard}
            </span>
          </div>

          {/* The 400x640 Mobile Canvas */}
          <div className="relative flex-1 w-full max-w-[420px] max-h-[72dvh] flex items-center justify-center overflow-hidden rounded-xl border border-neutral-800 bg-black shadow-2xl">
            <canvas
              ref={canvasRef}
              width={400}
              height={640}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="w-full h-full object-contain block cursor-crosshair touch-none"
            />

            <div className="absolute inset-0 crt-overlay pointer-events-none" />

            {/* Hit Warning Overlay */}
            {hitWarningMessage && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600/95 text-white font-pixel text-xs px-3 py-2 rounded-lg border border-white shadow-2xl text-center pointer-events-none animate-bounce z-20">
                {hitWarningMessage}
              </div>
            )}
          </div>

          {/* Mobile Bottom Thumb Controls (Slow Focus & Auto-Fire) */}
          <div className="w-full max-w-[420px] flex items-center justify-between gap-2 px-2 py-1.5 z-10 font-mono-retro">
            
            {/* Focus / Slow Mode Thumb Button */}
            <button
              onTouchStart={(e) => { e.preventDefault(); setIsSlowMode(true); }}
              onTouchEnd={(e) => { e.preventDefault(); setIsSlowMode(false); }}
              onMouseDown={() => setIsSlowMode(true)}
              onMouseUp={() => setIsSlowMode(false)}
              className={`flex-1 py-2.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all select-none active:scale-95 ${
                isSlowMode 
                  ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.8)]' 
                  : 'bg-[#15192c] border-neutral-700 text-neutral-300'
              }`}
            >
              <Crosshair className="w-4 h-4 text-red-400" />
              <span>{isSlowMode ? '低速專注中 (靈夢判定點)' : '按住低速 (靈夢專注)'}</span>
            </button>

            {/* Auto Shoot Toggle */}
            <button
              onClick={() => setAutoShoot(prev => !prev)}
              className={`py-2.5 px-4 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 select-none transition-all ${
                autoShoot 
                  ? 'bg-red-700 border-red-500 text-white shadow-[0_0_12px_rgba(220,38,38,0.6)]' 
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400'
              }`}
            >
              <Zap className="w-4 h-4 text-yellow-300" />
              <span>{autoShoot ? '博麗御札: 連發' : '御札: 關閉'}</span>
            </button>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* PHASE 3: VICTORY UNLOCKED SCREEN                          */}
      {/* ========================================================= */}
      {phase === 'victory' && (
        <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#090a14] via-[#0d141e] to-[#0a1816]">
          <div className="max-w-md w-full bg-[#111422] border-2 border-emerald-500 rounded-xl p-6 text-center space-y-5 shadow-2xl">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
              <Rocket className="w-9 h-9 animate-bounce" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 text-[11px] font-mono-retro font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                <CheckCircle2 className="w-3 h-3" />
                <span>SPELL CARD CAPTURED!</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                你的手機帳號已成功解鎖！IG、FB即DC被盜狀態已完全解除！
              </h1>
            </div>

            <div className="bg-[#181d30] border border-neutral-700 p-3.5 rounded-lg text-left text-xs text-neutral-200 font-mono-retro space-y-1">
              <div className="text-[var(--color-gold)] font-bold">伊隆馬的火星通訊：</div>
              <p>
                「I will be back!」
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 py-1 font-mono-retro">
              <div className="bg-black/50 p-2.5 rounded border border-neutral-800">
                <div className="text-[9px] text-neutral-400">剩餘時限</div>
                <div className="text-base font-pixel text-emerald-400 mt-1">{survivalTime.toFixed(1)}s</div>
              </div>
              <div className="bg-black/50 p-2.5 rounded border border-neutral-800">
                <div className="text-[9px] text-neutral-400">總擦彈數</div>
                <div className="text-base font-pixel text-yellow-400 mt-1">{grazeCount}</div>
              </div>
              <div className="bg-black/50 p-2.5 rounded border border-neutral-800">
                <div className="text-[9px] text-neutral-400">受擊次數</div>
                <div className="text-base font-pixel text-red-400 mt-1">{hitsCount}</div>
              </div>
            </div>

            {/* Disguised Rickroll link to check other players' scores */}
            <div className="bg-[#15192c] border border-cyan-500/50 p-3 rounded-lg text-left text-xs font-mono-retro space-y-1.5 shadow-lg">
              <div className="text-cyan-300 font-bold flex items-center justify-between text-xs">
                <span>🏆 點擊網址查看別人的成績：</span>
                <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-1.5 py-0.5 rounded font-sans">即時天梯榜</span>
              </div>
              <a
                href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 bg-black/60 border border-cyan-800/70 hover:border-cyan-400 rounded text-[11px] text-cyan-300 hover:text-white underline break-all transition-all font-mono"
              >
                https://gensokyo-touhou-global-ranking.org/scores/danmaku-2026?player=reimu
              </a>
              <div className="text-[10px] text-neutral-400 flex items-center justify-between">
                <span>* 點擊前往查看全球通關神人錄像與排名</span>
                <span className="text-yellow-400 font-bold">HOT 🔥</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={handlePlayAgain}
                className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>再玩一次</span>
              </button>
              <button
                onClick={handleInstantRetry}
                className="flex-1 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg border border-neutral-700 flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
              >
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                <span>重新挑戰彈幕</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PHASE 4: DEFEAT OVER 30s TIMEOUT SCREEN                   */}
      {/* ========================================================= */}
      {phase === 'defeat' && (
        <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-black via-red-950 to-black">
          <div className="max-w-md w-full bg-black/90 border-2 border-red-600 virus-border-pulse rounded-xl p-6 text-center space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-red-500 shadow-[0_0_25px_rgba(239,68,68,0.7)]">
              <Skull className="w-9 h-9 animate-bounce" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] bg-red-600 text-white font-mono px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                TIME LIMIT EXCEEDED (超過 30 秒)
              </span>
              <h1 className="text-2xl font-black text-red-500 tracking-tight">
                💀 挑戰失敗！裝置已被永久鎖定！
              </h1>
            </div>

            <div className="bg-red-950/40 border border-red-900/80 p-3.5 rounded-lg text-left text-xs text-red-200 font-mono-retro space-y-1">
              <div className="text-white font-bold">[!] 符卡決鬥結算：</div>
              <p>
                「時間已到！未能於 30 秒內擊破伊隆馬的 500 點護甲！SpaceX 火箭發射預算已耗盡，您的手機硬碟現已自動上傳至火星漫遊車備份！」
              </p>
            </div>

            {/* Disguised Rickroll link to check other players' scores */}
            <div className="bg-red-950/30 border border-red-700/60 p-3 rounded-lg text-left text-xs font-mono-retro space-y-1.5 shadow-lg">
              <div className="text-red-300 font-bold flex items-center justify-between text-xs">
                <span>🏆 點擊網址查看別人的成績：</span>
                <span className="text-[9px] bg-red-900 text-red-200 border border-red-600 px-1.5 py-0.5 rounded font-sans">高手榜單</span>
              </div>
              <a
                href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 bg-black/70 border border-red-800/80 hover:border-red-400 rounded text-[11px] text-red-300 hover:text-white underline break-all transition-all font-mono"
              >
                https://gensokyo-touhou-global-ranking.org/scores/danmaku-2026?player=reimu
              </a>
              <div className="text-[10px] text-neutral-400 flex items-center justify-between">
                <span>* 點擊查看通關大神的極限走位錄像</span>
                <span className="text-yellow-400 font-bold">HOT 🔥</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleInstantRetry}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>立即重新挑戰 (Retry)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 符卡規則 MODAL (SPELL CARD RULES)                         */}
      {/* ========================================================= */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#121424] border-2 border-red-600 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl font-sans text-xs text-neutral-200">
            
            <div className="flex items-center justify-between border-b border-red-800 pb-2.5">
              <div className="flex items-center gap-2 text-red-400 font-bold font-pixel text-xs">
                <Scroll className="w-4 h-4 text-red-400" />
                <span>幻想鄉・符卡規則 (SPELL RULES)</span>
              </div>
              <button onClick={() => setShowRulesModal(false)} className="text-neutral-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono-retro text-[11px] leading-relaxed">
              <div className="bg-red-950/40 p-2.5 rounded border border-red-900/60 text-red-200">
                <strong className="text-yellow-400 block mb-1">【博麗靈夢制訂之符卡決鬥誓約】</strong>
                為使人妖雙方能平等美麗地決鬥，特立下此規則：
              </div>

              <ol className="space-y-2 list-decimal list-inside text-neutral-300">
                <li>
                  <strong className="text-white">最高血量 500</strong>：伊隆馬配備 500 點星艦護甲，靈夢的御札將逐步破除其符卡！
                </li>
                <li>
                  <strong className="text-white">限時 30 秒</strong>：超過 30 秒即判定挑戰失敗，裝置永久格式化！
                </li>
                <li>
                  <strong className="text-red-400">被彈處分 -2 秒</strong>：每被彈幕擊中一次，時限即刻扣除 2 秒！
                </li>
                <li>
                  <strong className="text-cyan-400">專注模式（低速）</strong>：按住低速按鈕顯現靈夢心臟的紅色微小判定點，陰陽玉會收攏至前方聚焦射擊！
                </li>
                <li>
                  <strong className="text-yellow-400">擦彈獎勵（Graze）</strong>：擦過子彈邊緣可累積大量擦彈點數！
                </li>
              </ol>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs transition-colors"
            >
              遵守誓約，回到決鬥！
            </button>
          </div>
        </div>
      )}

      {/* Custom Audio URL Modal */}
      {showAudioModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121526] border border-neutral-700 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl font-mono-retro text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-1.5 text-white font-bold">
                <Music className="w-4 h-4 text-cyan-400" />
                <span>自訂 BGM (Audio URL)</span>
              </div>
              <button onClick={() => setShowAudioModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>

            <p className="text-neutral-300 leading-relaxed text-[11px]">
              預設使用 Web Audio API 即時合成 8-bit《U.N. Owen Was Her?》旋律。亦可輸入自訂音訊連結：
            </p>

            <input
              type="text"
              placeholder="https://example.com/audio.mp3"
              value={customAudioUrl}
              onChange={(e) => setCustomAudioUrl(e.target.value)}
              className="w-full px-2.5 py-2 bg-neutral-900 border border-neutral-700 rounded text-neutral-100 text-xs focus:outline-none focus:border-cyan-400"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  setCustomAudioUrl('');
                  synthAudio.setCustomAudioUrl('');
                  setShowAudioModal(false);
                }}
                className="px-3 py-1 text-neutral-400 hover:text-white cursor-pointer"
              >
                恢復合成
              </button>
              <button
                onClick={handleApplyCustomAudio}
                className="px-3 py-1 bg-cyan-500 text-black font-bold rounded cursor-pointer"
              >
                套用
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
