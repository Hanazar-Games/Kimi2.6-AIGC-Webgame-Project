/* ============================================================
   STELLAR DEFENSE — Bullet Hell Space Shooter
   Pure vanilla JS, zero dependencies.
   ============================================================ */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

/* ---------- Canvas Resize ---------- */
let W = 0, H = 0;
function resize() {
  const container = document.getElementById('game-container');
  W = container.clientWidth;
  H = container.clientHeight;
  canvas.width = W;
  canvas.height = H;
}
window.addEventListener('resize', resize);
resize();

/* ---------- Audio (Web Audio API) ---------- */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let engineOsc = null;
let engineGainNode = null;
function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new AudioCtx();
    musicNextTime = audioCtx.currentTime;
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  // Start engine hum
  if (!engineOsc && audioCtx) {
    engineOsc = audioCtx.createOscillator();
    engineGainNode = audioCtx.createGain();
    engineOsc.type = 'sine';
    engineOsc.frequency.setValueAtTime(55, audioCtx.currentTime);
    engineGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    engineOsc.connect(engineGainNode);
    engineGainNode.connect(audioCtx.destination);
    engineOsc.start();
  }
}

function playTone(freq, type, duration, vol = 0.08) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, audioCtx.currentTime);
  g.gain.setValueAtTime(vol * masterVolume, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + duration);
}

function sfxShoot() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const g = audioCtx.createGain();
  g.connect(audioCtx.destination);

  if (weaponType === 'rapid') {
    // Rapid: short, crisp high-frequency chirp
    const o = audioCtx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(1400, t);
    o.frequency.exponentialRampToValueAtTime(600, t + 0.04);
    g.gain.setValueAtTime(0.03 * masterVolume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.05);
  } else if (weaponType === 'spread') {
    // Spread: thick sawtooth + noise burst, heavy impact
    const o1 = audioCtx.createOscillator();
    o1.type = 'sawtooth';
    o1.frequency.setValueAtTime(500, t);
    o1.frequency.exponentialRampToValueAtTime(150, t + 0.12);
    const o2 = audioCtx.createOscillator();
    o2.type = 'square';
    o2.frequency.setValueAtTime(350, t);
    o2.frequency.exponentialRampToValueAtTime(100, t + 0.12);
    g.gain.setValueAtTime(0.04 * masterVolume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    o1.connect(g);
    o2.connect(g);
    o1.start(t);
    o2.start(t);
    o1.stop(t + 0.15);
    o2.stop(t + 0.15);
    // Add tiny noise burst
    const noiseBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.06, audioCtx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nd.length);
    const ns = audioCtx.createBufferSource();
    ns.buffer = noiseBuf;
    const ng = audioCtx.createGain();
    ng.gain.setValueAtTime(0.02 * masterVolume, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    ns.connect(ng);
    ng.connect(audioCtx.destination);
    ns.start(t);
    ns.stop(t + 0.07);
  } else if (weaponType === 'laser') {
    // Laser: sharp frequency sweep down, piercing
    const o = audioCtx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(3000, t);
    o.frequency.exponentialRampToValueAtTime(400, t + 0.12);
    // Lowpass filter for smoother laser sound
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4000, t);
    filter.frequency.exponentialRampToValueAtTime(600, t + 0.1);
    g.gain.setValueAtTime(0.04 * masterVolume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(filter);
    filter.connect(g);
    o.start(t);
    o.stop(t + 0.13);
  } else if (weaponType === 'ricochet') {
    // Ricochet: metallic ping with slight delay echo
    const o = audioCtx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(1800, t);
    o.frequency.exponentialRampToValueAtTime(800, t + 0.06);
    g.gain.setValueAtTime(0.035 * masterVolume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.09);
    // Echo
    const o2 = audioCtx.createOscillator();
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(1400, t + 0.04);
    o2.frequency.exponentialRampToValueAtTime(600, t + 0.08);
    const g2 = audioCtx.createGain();
    g2.gain.setValueAtTime(0.015 * masterVolume, t + 0.04);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o2.connect(g2);
    g2.connect(audioCtx.destination);
    o2.start(t + 0.04);
    o2.stop(t + 0.1);
  } else if (weaponType === 'homing') {
    // Homing: whistle that sweeps down, missile-like
    const o = audioCtx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(2000, t);
    o.frequency.exponentialRampToValueAtTime(300, t + 0.18);
    g.gain.setValueAtTime(0.035 * masterVolume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.22);
    // Slight sawtooth overtone for grit
    const o2 = audioCtx.createOscillator();
    o2.type = 'sawtooth';
    o2.frequency.setValueAtTime(2000, t);
    o2.frequency.exponentialRampToValueAtTime(300, t + 0.18);
    const g2 = audioCtx.createGain();
    g2.gain.setValueAtTime(0.008 * masterVolume, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o2.connect(g2);
    g2.connect(audioCtx.destination);
    o2.start(t);
    o2.stop(t + 0.22);
  } else if (weaponType === 'explosive') {
    // Explosive: deep thump + low-frequency impact
    const o = audioCtx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.15);
    g.gain.setValueAtTime(0.05 * masterVolume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    o.connect(filter);
    filter.connect(g);
    g.connect(audioCtx.destination);
    o.start(t);
    o.stop(t + 0.22);
  } else {
    // Balanced: clean dual square wave with slight detune
    const o1 = audioCtx.createOscillator();
    o1.type = 'square';
    o1.frequency.setValueAtTime(880, t);
    const o2 = audioCtx.createOscillator();
    o2.type = 'square';
    o2.frequency.setValueAtTime(890, t); // 10Hz detune
    g.gain.setValueAtTime(0.03 * masterVolume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    o1.connect(g);
    o2.connect(g);
    o1.start(t);
    o2.start(t);
    o1.stop(t + 0.08);
    o2.stop(t + 0.08);
  }
}
function sfxPortalOpen() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  // Main drone: sweeping frequency up
  const o1 = audioCtx.createOscillator();
  o1.type = 'sine';
  o1.frequency.setValueAtTime(80, t);
  o1.frequency.exponentialRampToValueAtTime(400, t + 0.25);
  // Overtone for sci-fi texture
  const o2 = audioCtx.createOscillator();
  o2.type = 'sawtooth';
  o2.frequency.setValueAtTime(160, t);
  o2.frequency.exponentialRampToValueAtTime(800, t + 0.25);
  // Lowpass filter to soften
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(600, t);
  filter.frequency.exponentialRampToValueAtTime(2000, t + 0.2);
  // Gain envelope
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.06 * masterVolume, t + 0.08);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  o1.connect(filter);
  o2.connect(filter);
  filter.connect(g);
  g.connect(audioCtx.destination);
  o1.start(t);
  o2.start(t);
  o1.stop(t + 0.4);
  o2.stop(t + 0.4);
}
function sfxBossAlert() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  // Alarm siren: alternating frequencies with square wave
  const o = audioCtx.createOscillator();
  o.type = 'square';
  // Rapid frequency modulation
  for (let i = 0; i < 8; i++) {
    const t0 = t + i * 0.1;
    o.frequency.setValueAtTime(600, t0);
    o.frequency.linearRampToValueAtTime(350, t0 + 0.05);
  }
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.08 * masterVolume, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
  // Lowpass to soften harsh square wave
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1500, t);
  o.connect(filter);
  filter.connect(g);
  g.connect(audioCtx.destination);
  o.start(t);
  o.stop(t + 0.9);
}
function sfxWaveTheme(theme) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  switch (theme) {
    case 'SWARM':
      // Dense buzzing: rapid low chirps
      for (let i = 0; i < 6; i++) {
        const o = audioCtx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(200 + i * 30, t + i * 0.06);
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.02 * masterVolume, t + i * 0.06);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.08);
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start(t + i * 0.06);
        o.stop(t + i * 0.06 + 0.1);
      }
      break;
    case 'ASSAULT':
      // Fast drum-like impacts
      for (let i = 0; i < 4; i++) {
        const o = audioCtx.createOscillator();
        o.type = 'square';
        o.frequency.setValueAtTime(150, t + i * 0.12);
        o.frequency.exponentialRampToValueAtTime(80, t + i * 0.12 + 0.08);
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.04 * masterVolume, t + i * 0.12);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.1);
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start(t + i * 0.12);
        o.stop(t + i * 0.12 + 0.12);
      }
      break;
    case 'FORTRESS':
      // Heavy low drone
      {
        const o = audioCtx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(80, t);
        o.frequency.exponentialRampToValueAtTime(50, t + 0.3);
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.05 * masterVolume, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start(t);
        o.stop(t + 0.45);
      }
      break;
    case 'SNIPER':
      // Electronic tick-tock
      for (let i = 0; i < 5; i++) {
        const o = audioCtx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(1200 - i * 100, t + i * 0.1);
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.025 * masterVolume, t + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.06);
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start(t + i * 0.1);
        o.stop(t + i * 0.1 + 0.08);
      }
      break;
    case 'DIVIDE':
      // Splitting sound: rapid descending chirps
      for (let i = 0; i < 4; i++) {
        const o = audioCtx.createOscillator();
        o.type = 'triangle';
        o.frequency.setValueAtTime(600, t + i * 0.08);
        o.frequency.exponentialRampToValueAtTime(200, t + i * 0.08 + 0.1);
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.03 * masterVolume, t + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.12);
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start(t + i * 0.08);
        o.stop(t + i * 0.08 + 0.14);
      }
      break;
  }
}
function sfxWaveClear() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const notes = [523, 659, 784]; // C5, E5, G5 (major triad arpeggio)
  for (let i = 0; i < notes.length; i++) {
    const o = audioCtx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(notes[i], t + i * 0.08);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.03 * masterVolume, t + i * 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.15);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t + i * 0.08);
    o.stop(t + i * 0.08 + 0.2);
  }
}
function sfxPause() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const notes = [523, 392]; // C5 down to G4
  for (let i = 0; i < notes.length; i++) {
    const o = audioCtx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(notes[i], t + i * 0.06);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.025 * masterVolume, t + i * 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.1);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t + i * 0.06);
    o.stop(t + i * 0.06 + 0.15);
  }
}
function sfxResume() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const notes = [392, 523]; // G4 up to C5
  for (let i = 0; i < notes.length; i++) {
    const o = audioCtx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(notes[i], t + i * 0.06);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.025 * masterVolume, t + i * 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.1);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t + i * 0.06);
    o.stop(t + i * 0.06 + 0.15);
  }
}
function sfxShutter() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  o.type = 'square';
  o.frequency.setValueAtTime(3000, t);
  o.frequency.exponentialRampToValueAtTime(100, t + 0.06);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.035 * masterVolume, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start(t);
  o.stop(t + 0.1);
}
function sfxClick() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  o.type = 'square';
  o.frequency.setValueAtTime(1200, t);
  o.frequency.exponentialRampToValueAtTime(400, t + 0.03);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.015 * masterVolume, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start(t);
  o.stop(t + 0.06);
}
function sfxWeaponSwitch() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(800, t);
  o.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.03 * masterVolume, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start(t);
  o.stop(t + 0.12);
}
function sfxComboChime(currentCombo) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const freq = Math.min(1800, 440 + currentCombo * 15);
  const vol = Math.min(0.05, 0.02 + Math.min(currentCombo, 30) * 0.001);
  const dur = currentCombo % 10 === 0 ? 0.12 : 0.05;
  const o = audioCtx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, t);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(vol * masterVolume, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start(t);
  o.stop(t + dur + 0.01);
}
function sfxEnemyShoot() { playTone(220, 'sawtooth', 0.1, 0.03); }
function sfxHit() { playTone(150, 'sawtooth', 0.15, 0.06); }
function sfxEnemyDeath(type) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  switch (type) {
    case 'drone':
      sfxExplosion();
      break;
    case 'hunter':
      playTone(200, 'sawtooth', 0.12, 0.05);
      setTimeout(() => playTone(100, 'sawtooth', 0.15, 0.04), 40);
      break;
    case 'tank':
      // Heavy low thud
      playTone(80, 'square', 0.2, 0.07);
      setTimeout(() => playTone(60, 'sawtooth', 0.25, 0.06), 60);
      break;
    case 'sniper':
      playTone(600, 'sine', 0.06, 0.03);
      setTimeout(() => playTone(300, 'sine', 0.1, 0.02), 50);
      break;
    case 'swarmer':
      playTone(400, 'triangle', 0.04, 0.025);
      break;
    case 'splitter':
      playTone(300, 'sine', 0.06, 0.03);
      setTimeout(() => playTone(500, 'sine', 0.06, 0.025), 60);
      break;
    case 'bomber':
      sfxExplosion();
      break;
    case 'shielder':
      // Shield shatter: glass-like high break
      playTone(1200, 'sine', 0.05, 0.03);
      setTimeout(() => playTone(800, 'sine', 0.07, 0.025), 40);
      setTimeout(() => playTone(400, 'sine', 0.09, 0.02), 80);
      break;
    case 'medic':
      playTone(700, 'sine', 0.05, 0.025);
      setTimeout(() => playTone(350, 'sine', 0.08, 0.02), 50);
      break;
    case 'divider':
      playTone(280, 'sine', 0.06, 0.03);
      setTimeout(() => playTone(450, 'sine', 0.06, 0.025), 60);
      break;
    case 'mine':
      playTone(500, 'sawtooth', 0.08, 0.04);
      setTimeout(() => playTone(250, 'sawtooth', 0.1, 0.03), 50);
      break;
    case 'turret':
      playTone(350, 'square', 0.08, 0.035);
      setTimeout(() => playTone(180, 'square', 0.1, 0.03), 60);
      break;
    case 'phantom':
      playTone(800, 'sine', 0.05, 0.025);
      setTimeout(() => playTone(400, 'sine', 0.08, 0.02), 50);
      setTimeout(() => playTone(200, 'sine', 0.1, 0.015), 100);
      break;
    case 'boss':
      sfxExplosion();
      break;
    default:
      sfxExplosion();
  }
}
function sfxExplosion() {
  if (!audioCtx) return;
  const bufferSize = audioCtx.sampleRate * 0.3;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.15 * masterVolume, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
  noise.connect(g);
  g.connect(audioCtx.destination);
  noise.start();
}
function sfxPowerup() { playTone(660, 'sine', 0.1, 0.06); playTone(880, 'sine', 0.15, 0.06); }
function sfxPerfectWave() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const notes = [523, 659, 784, 1047];
  for (let i = 0; i < notes.length; i++) {
    const o = audioCtx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(notes[i], t + i * 0.08);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.04 * masterVolume, t + i * 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t + i * 0.08);
    o.stop(t + i * 0.08 + 0.25);
  }
  const o2 = audioCtx.createOscillator();
  o2.type = 'sine';
  o2.frequency.setValueAtTime(262, t);
  const g2 = audioCtx.createGain();
  g2.gain.setValueAtTime(0.03 * masterVolume, t);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  o2.connect(g2);
  g2.connect(audioCtx.destination);
  o2.start(t);
  o2.stop(t + 0.55);
}
function sfxMilestone() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  // Triumphant ascending fanfare
  const notes = [523, 659, 784, 1047, 1319];
  for (let i = 0; i < notes.length; i++) {
    const o = audioCtx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(notes[i], t + i * 0.06);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.05 * masterVolume, t + i * 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.15);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t + i * 0.06);
    o.stop(t + i * 0.06 + 0.2);
  }
}
function sfxComboMilestone(combo) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const baseFreq = combo === 100 ? 523 : combo === 50 ? 440 : combo === 25 ? 349 : 262;
  const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2];
  for (let i = 0; i < notes.length; i++) {
    const o = audioCtx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(notes[i], t + i * 0.07);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.05 * masterVolume, t + i * 0.07);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.2);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t + i * 0.07);
    o.stop(t + i * 0.07 + 0.25);
  }
}
function sfxHurt() { playTone(120, 'sawtooth', 0.25, 0.08); }
function sfxWaveStart() {
  playTone(440, 'square', 0.15, 0.05);
  playTone(554, 'square', 0.15, 0.05);
  playTone(659, 'square', 0.2, 0.05);
}
function sfxPickupEnergy() {
  // Warm healing ascending major triad
  playTone(523, 'sine', 0.08, 0.05);
  setTimeout(() => playTone(659, 'sine', 0.08, 0.05), 60);
  setTimeout(() => playTone(784, 'sine', 0.12, 0.05), 120);
}
function sfxPickupShield() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(440, t);
  o.frequency.exponentialRampToValueAtTime(880, t + 0.15);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.05 * masterVolume, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start(t);
  o.stop(t + 0.35);
}
function sfxPickupTimestop() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  // Reverse-sweep: high to low for time-freeze feel
  const o = audioCtx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(1200, t);
  o.frequency.exponentialRampToValueAtTime(200, t + 0.4);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.05 * masterVolume, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start(t);
  o.stop(t + 0.55);
}
function sfxPickupMagnet() {
  // Rapid metallic chirps
  playTone(1000, 'triangle', 0.04, 0.04);
  setTimeout(() => playTone(1200, 'triangle', 0.04, 0.04), 50);
  setTimeout(() => playTone(1400, 'triangle', 0.06, 0.04), 100);
}
function sfxPickupOverdrive() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(300, t);
  o.frequency.exponentialRampToValueAtTime(900, t + 0.2);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.06 * masterVolume, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start(t);
  o.stop(t + 0.35);
}
function sfxPickupScore() {
  // Coin-like crisp high ping
  playTone(1500, 'sine', 0.06, 0.04);
  setTimeout(() => playTone(2000, 'sine', 0.08, 0.03), 60);
}
function sfxUpgrade() {
  playTone(523, 'sine', 0.1, 0.07);
  playTone(659, 'sine', 0.1, 0.07);
  playTone(784, 'sine', 0.15, 0.07);
  playTone(1047, 'sine', 0.2, 0.07);
}
function sfxComboBreak() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(400, t);
  o.frequency.exponentialRampToValueAtTime(80, t + 0.15);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.04 * masterVolume, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start(t);
  o.stop(t + 0.2);
}
function sfxScoreMilestone(milestone) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const notes = milestone >= 10000 ? [523, 659, 784, 1047] : milestone >= 5000 ? [523, 659, 784] : [523, 659];
  const vol = milestone >= 10000 ? 0.05 : milestone >= 5000 ? 0.04 : 0.03;
  for (let i = 0; i < notes.length; i++) {
    const o = audioCtx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(notes[i], t + i * 0.07);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(vol * masterVolume, t + i * 0.07);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.18);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t + i * 0.07);
    o.stop(t + i * 0.07 + 0.22);
  }
  spawnFloatingText(W / 2, H / 3, `SCORE ${milestone.toLocaleString()}!`, '#ffcc44');
}
function sfxBombThrow() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(600, t);
  o.frequency.exponentialRampToValueAtTime(1800, t + 0.08);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.04 * masterVolume, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start(t);
  o.stop(t + 0.12);
}
function sfxBomb() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(100, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.8);
  g.gain.setValueAtTime(0.2, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + 0.8);
}
function sfxGraze() {
  playTone(1200 + Math.random() * 400, 'sine', 0.04, 0.015);
}
function sfxGrazeMilestone(count) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const freq = Math.min(2000, 800 + count * 8);
  const o = audioCtx.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(freq, t);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.05 * masterVolume, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start(t);
  o.stop(t + 0.18);
}
function sfxDash() {
  playTone(400, 'sawtooth', 0.15, 0.06);
  playTone(600, 'sawtooth', 0.1, 0.04);
}

/* ---------- Background Music ---------- */
let musicEnabled = true;
let musicBeat = 0;
let musicNextTime = 0;
const musicTempo = 0.35; // seconds per beat
const musicBass = [55, 55, 65, 55, 55, 55, 49, 55];
const musicLead = [0, 220, 0, 262, 0, 330, 0, 220];

function playMusicStep() {
  if (!audioCtx || !musicEnabled || state !== STATE.PLAYING) return;
  const now = audioCtx.currentTime;
  if (now >= musicNextTime) {
    const bass = musicBass[musicBeat % musicBass.length];
    const lead = musicLead[musicBeat % musicLead.length];
    if (bass) {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(bass, now);
      g.gain.setValueAtTime(0.04, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(now);
      o.stop(now + 0.2);
    }
    if (lead) {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(lead, now);
      g.gain.setValueAtTime(0.025, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(now);
      o.stop(now + 0.15);
    }
    musicBeat++;
    musicNextTime = now + musicTempo;
  }
}

/* ---------- Input ---------- */
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === ' ' || e.key.toLowerCase() === 'p') e.preventDefault();
  if (e.key === 'F12') {
    e.preventDefault();
    takeScreenshot();
  }
});
window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

function isDown(k) { return !!keys[k]; }

/* ---------- Touch / Virtual Joystick ---------- */
let touchActive = false;
let touchStartX = 0, touchStartY = 0;
let touchCurrentX = 0, touchCurrentY = 0;
let touchShootBtn = false;
let touchFocusBtn = false;

function initTouch() {
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    ensureAudio();
    for (const t of e.changedTouches) {
      const rx = t.clientX - canvas.getBoundingClientRect().left;
      const ry = t.clientY - canvas.getBoundingClientRect().top;
      // right half = shoot, left half = move
      if (rx > W * 0.6) {
        touchShootBtn = true;
      } else if (rx > W * 0.45 && rx <= W * 0.6) {
        touchFocusBtn = true;
      } else {
        touchActive = true;
        touchStartX = rx;
        touchStartY = ry;
        touchCurrentX = rx;
        touchCurrentY = ry;
      }
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const rx = t.clientX - canvas.getBoundingClientRect().left;
      const ry = t.clientY - canvas.getBoundingClientRect().top;
      if (rx <= W * 0.45) {
        touchCurrentX = rx;
        touchCurrentY = ry;
      }
    }
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const rx = t.clientX - canvas.getBoundingClientRect().left;
      if (rx > W * 0.6) touchShootBtn = false;
      else if (rx > W * 0.45 && rx <= W * 0.6) touchFocusBtn = false;
      else touchActive = false;
    }
    if (e.touches.length === 0) {
      touchActive = false;
      touchShootBtn = false;
      touchFocusBtn = false;
    }
  }, { passive: false });
}
initTouch();

/* ---------- Game State ---------- */
const STATE = { MENU: 0, PLAYING: 1, PAUSED: 2, GAMEOVER: 3 };
let state = STATE.MENU;
let score = 0;
let highScore = 0;
let highScoresByDifficulty = { 1: 0, 2: 0, 3: 0, 4: 0 };
let wave = 1;
let combo = 0;
let comboTimer = 0;
let shake = 0;
let shakeDirX = 0;
let shakeDirY = 0;
let slowMo = 0;
let difficulty = 2; // 1=easy, 2=normal, 3=hard
let achievementNotifications = [];
let activeNotification = null;
let notificationTimer = 0;
let waveClearTimer = 0;
let waveClearWave = 0;
let waveClearPerfect = false;
let waveClearIsBoss = false;
let eliteWave = false;
let waveScale = 1;
let lastWave = 0;
let bombCooldown = 0;
let bombAnim = 0;
let grazeCount = 0;
let grazeTimer = 0;
let dashCooldown = 0;
let dashing = 0;
let damageFlash = 0;
let comboBurstFlash = 0;
let waveAlertTimer = 0;
let waveAlertType = null; // 'elite' or 'boss'
let comboGuardFlash = 0;
let comboFlash = 0;
let comboFlashColor = '#ffffff';
let gameStartTime = 0;
let comboGuard = true;
let comboScale = 1;
let particleDensity = 2; // 0=low, 1=medium, 2=high
let colorTheme = 0;
let masterVolume = 1.0;
let showFPS = true;
let waveFlash = 0;
let waveTheme = null;
let timeStopTimer = 0;
let magnetTimer = 0;
let overdriveTimer = 0;
let targetFPS = 60;
let skipFrame = false;
let tutorialActive = false;
let tutorialDismissed = false;
let tutorialStepsShown = new Set();
let asteroids = [];
let meteors = [];
let meteorTimer = 0;
let practiceMode = false;
let autoFire = false;
let planets = [];
let weaponType = 'balanced'; // 'balanced', 'spread', 'rapid', 'laser', 'ricochet', 'homing', 'explosive'
let encounteredTypes = new Set();
let persistentEncountered = new Set();
let enemyKillsLog = {};
let encounterText = null;
let encounterTimer = 0;
const THEMES = [
  { name: 'CYAN', player: '#88ddff', bullet: '#44ffaa', glow: '#44ddff', engine: '#44aaff' },
  { name: 'RED', player: '#ff8888', bullet: '#ff4444', glow: '#ff6666', engine: '#ff3333' },
  { name: 'GREEN', player: '#88ff88', bullet: '#44ff44', glow: '#66ff66', engine: '#33ff33' },
  { name: 'PURPLE', player: '#cc88ff', bullet: '#aa44ff', glow: '#9966ff', engine: '#7733ff' },
];

function loadHighScore() {
  try {
    const v = localStorage.getItem('stellar_defense_highscore');
    if (v) highScore = parseInt(v, 10) || 0;
    const vd = localStorage.getItem('stellar_defense_highscores_diff');
    if (vd) {
      const parsed = JSON.parse(vd);
      highScoresByDifficulty = { ...highScoresByDifficulty, ...parsed };
    }
  } catch (e) {}
}
function saveHighScore() {
  try {
    localStorage.setItem('stellar_defense_highscore', String(highScore));
    localStorage.setItem('stellar_defense_highscores_diff', JSON.stringify(highScoresByDifficulty));
  } catch (e) {}
}
loadHighScore();

/* ---------- Leaderboard ---------- */
let leaderboard = [];
let leaderboardFilter = 0; // 0=all, 1=easy, 2=normal, 3=hard, 4=nightmare
function loadLeaderboard() {
  try {
    const v = localStorage.getItem('stellar_defense_leaderboard');
    if (v) leaderboard = JSON.parse(v);
  } catch (e) {}
}
function saveLeaderboard() {
  try {
    localStorage.setItem('stellar_defense_leaderboard', JSON.stringify(leaderboard));
  } catch (e) {}
}
function addToLeaderboard(score, wave) {
  leaderboard.push({ score, wave, date: new Date().toLocaleDateString(), difficulty });
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 10);
  saveLeaderboard();
}
loadLeaderboard();

/* ---------- Stats ---------- */
let stats = { games: 0, kills: 0, bestWave: 0, deaths: 0, totalGraze: 0, totalTime: 0, highestCombo: 0, bossesDefeated: 0, weaponUses: { balanced: 0, spread: 0, rapid: 0, laser: 0, ricochet: 0, homing: 0, explosive: 0 } };
function loadStats() {
  try {
    const v = localStorage.getItem('stellar_defense_stats');
    if (v) {
      const saved = JSON.parse(v);
      stats = { ...stats, ...saved };
      if (saved.weaponUses) {
        stats.weaponUses = { ...stats.weaponUses, ...saved.weaponUses };
      }
    }
  } catch (e) {}
}
function saveStats() {
  try {
    localStorage.setItem('stellar_defense_stats', JSON.stringify(stats));
  } catch (e) {}
}
function updateStats(onDeath = false) {
  if (onDeath) {
    stats.games++;
    stats.deaths++;
  }
  stats.bestWave = Math.max(stats.bestWave, wave);
  stats.highestCombo = Math.max(stats.highestCombo, combo);
  saveStats();
}
loadStats();

/* ---------- Achievements ---------- */
const ACHIEVEMENTS = {
  first_blood: { name: 'First Blood', desc: 'Destroy your first enemy', unlocked: false },
  combo_master: { name: 'Combo Master (Legacy)', desc: 'Reach a 25x combo', unlocked: false },
  grazer: { name: 'Grazer', desc: 'Graze 100 bullets', unlocked: false },
  survivor: { name: 'Survivor', desc: 'Reach Wave 10', unlocked: false },
  boss_slayer: { name: 'Boss Slayer', desc: 'Defeat a Boss', unlocked: false },
  elite_slayer: { name: 'Elite Slayer', desc: 'Defeat an Elite Boss', unlocked: false },
  splitter_down: { name: 'Splitter Down', desc: 'Destroy a Splitter enemy', unlocked: false },
  bomber_down: { name: 'Bomber Down', desc: 'Destroy a Bomber enemy', unlocked: false },
  shield_breaker: { name: 'Shield Breaker', desc: 'Destroy a Shielder enemy', unlocked: false },
  medic_down: { name: 'Medic Down', desc: 'Destroy a Medic enemy', unlocked: false },
  combo_25: { name: 'Combo Apprentice', desc: 'Reach a 25x combo', unlocked: false },
  combo_50: { name: 'Combo Master', desc: 'Reach a 50x combo', unlocked: false },
  combo_100: { name: 'Combo God', desc: 'Reach a 100x combo', unlocked: false },
  untouchable: { name: 'Untouchable', desc: 'Clear Wave 5 without taking damage', unlocked: false },
  weapon_master: { name: 'Weapon Master', desc: 'Use all 7 weapons in one run', unlocked: false },
  bomb_saver: { name: 'Bomb Saver', desc: 'Clear a wave without using bombs', unlocked: false },
  graze_king: { name: 'Graze King', desc: 'Graze 200 bullets in one run', unlocked: false },
  marathon: { name: 'Marathon', desc: 'Reach Wave 20', unlocked: false },
  millionaire: { name: 'Millionaire', desc: 'Score 1,000,000 points', unlocked: false },
  piercing_shot: { name: 'Piercing Shot', desc: 'Hit 3 enemies with one laser', unlocked: false },
  divider_down: { name: 'Divider Down', desc: 'Destroy a Divider enemy', unlocked: false },
  boss_hunter: { name: 'Boss Hunter', desc: 'Defeat 5 Bosses', unlocked: false },
  nightmare_survivor: { name: 'Nightmare Survivor', desc: 'Reach Wave 10 on Nightmare', unlocked: false },
  theme_survivor: { name: 'Theme Survivor', desc: 'Clear a Theme wave without taking damage', unlocked: false },
  magnetic_personality: { name: 'Magnetic Personality', desc: 'Pick up a Magnet power-up', unlocked: false },
  ricochet_king: { name: 'Ricochet King', desc: 'Kill an enemy with a bounced bullet', unlocked: false },
  portal_observer: { name: 'Portal Observer', desc: 'Witness 50 enemies spawn through portals', unlocked: false },
  homing_ace: { name: 'Homing Ace', desc: 'Destroy 100 enemies with Homing Missiles', unlocked: false },
  overdrive_killer: { name: 'Overdrive Killer', desc: 'Destroy 30 enemies during Overdrive', unlocked: false },
  elite_wave_survivor: { name: 'Elite Wave Survivor', desc: 'Survive an Elite Wave', unlocked: false },
  combo_burst_master: { name: 'Combo Burst Master', desc: 'Trigger Combo Burst 3 times', unlocked: false },
  demolition_expert: { name: 'Demolition Expert', desc: 'Kill 3 enemies with one explosive shell', unlocked: false },
  explosive_destroyer: { name: 'Explosive Destroyer', desc: 'Destroy 50 enemies with Explosive shells', unlocked: false },
  phantom_slayer: { name: 'Phantom Slayer', desc: 'Destroy a Phantom enemy', unlocked: false },
  phantom_hunter: { name: 'Phantom Hunter', desc: 'Destroy 10 Phantom enemies', unlocked: false },
  chain_reaction: { name: 'Chain Reaction', desc: 'Kill 5 enemies with one explosive shell', unlocked: false },
  century: { name: 'Century', desc: 'Kill 100 enemies in one run', unlocked: false },
};
let noDamageWaves = 0;
let totalPerfectWaves = 0;
let bossesDefeatedThisRun = 0;
let recordBrokenThisRun = false;
let achievementsThisRun = 0;
let volumeDisplayTimer = 0;
let particleDisplayTimer = 0;
let themeDisplayTimer = 0;
let autoFireDisplayTimer = 0;
let musicDisplayTimer = 0;
let fpsDisplayTimer = 0;
let fullscreenDisplayTimer = 0;
let helpOverlayTimer = 0;
let rewardSelectActive = false;
let rewardOptions = [];
let damageMult = 1.0;
let speedMultBonus = 1.0;
let scoreMultBonus = 1.0;
let scoreMultTimer = 0;
let damageTakenThisWave = false;
let usedWeapons = new Set();
let masteredWeapons = new Set();
let bombsUsedThisWave = 0;
let lastScoreMilestone = 0;
let portalSpawnsSeen = 0;
let homingKills = 0;
let overdriveKills = 0;
let eliteWavesSurvived = 0;
let comboBurstsTriggered = 0;
let explosiveBestMultiKill = 0;
let explosiveKills = 0;
let phantomKills = 0;

function loadAchievements() {
  try {
    const v = localStorage.getItem('stellar_defense_achievements');
    if (v) {
      const saved = JSON.parse(v);
      for (const k in saved) {
        if (ACHIEVEMENTS[k]) ACHIEVEMENTS[k].unlocked = !!saved[k];
      }
    }
  } catch (e) {}
}
function loadPersistentEncountered() {
  try {
    const v = localStorage.getItem('stellar_defense_encountered');
    if (v) {
      const arr = JSON.parse(v);
      persistentEncountered = new Set(arr);
    }
    const kv = localStorage.getItem('stellar_defense_kills');
    if (kv) {
      enemyKillsLog = JSON.parse(kv);
    }
  } catch (e) {}
}
function savePersistentEncountered() {
  try {
    localStorage.setItem('stellar_defense_encountered', JSON.stringify([...persistentEncountered]));
    localStorage.setItem('stellar_defense_kills', JSON.stringify(enemyKillsLog));
  } catch (e) {}
}
function saveAchievements() {
  try {
    const obj = {};
    for (const k in ACHIEVEMENTS) obj[k] = ACHIEVEMENTS[k].unlocked;
    localStorage.setItem('stellar_defense_achievements', JSON.stringify(obj));
  } catch (e) {}
}
function sfxNewRecord() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  // Triumphant fanfare: C4-E4-G4-C5-E5-G5 (full major arpeggio)
  const notes = [262, 330, 392, 523, 659, 784];
  for (let i = 0; i < notes.length; i++) {
    const o = audioCtx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(notes[i], t + i * 0.08);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.05 * masterVolume, t + i * 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.25);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t + i * 0.08);
    o.stop(t + i * 0.08 + 0.3);
  }
  // Bass support
  const bass = audioCtx.createOscillator();
  bass.type = 'sine';
  bass.frequency.setValueAtTime(65, t);
  const bg = audioCtx.createGain();
  bg.gain.setValueAtTime(0.06 * masterVolume, t);
  bg.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
  bass.connect(bg);
  bg.connect(audioCtx.destination);
  bass.start(t);
  bass.stop(t + 0.6);
}
function sfxEliteKill() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  // Metallic clang: two sharp tones
  const o1 = audioCtx.createOscillator();
  o1.type = 'triangle';
  o1.frequency.setValueAtTime(600, t);
  o1.frequency.exponentialRampToValueAtTime(300, t + 0.15);
  const g1 = audioCtx.createGain();
  g1.gain.setValueAtTime(0.05 * masterVolume, t);
  g1.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  o1.connect(g1);
  g1.connect(audioCtx.destination);
  o1.start(t);
  o1.stop(t + 0.2);
  const o2 = audioCtx.createOscillator();
  o2.type = 'square';
  o2.frequency.setValueAtTime(900, t);
  o2.frequency.exponentialRampToValueAtTime(450, t + 0.1);
  const g2 = audioCtx.createGain();
  g2.gain.setValueAtTime(0.02 * masterVolume, t);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  o2.connect(g2);
  g2.connect(audioCtx.destination);
  o2.start(t);
  o2.stop(t + 0.15);
}
function sfxBossDefeat() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  // Fanfare: C4-E4-G4-C5-E5 (ascending major triad)
  const notes = [262, 330, 392, 523, 659];
  for (let i = 0; i < notes.length; i++) {
    const o = audioCtx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(notes[i], t + i * 0.1);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.05 * masterVolume, t + i * 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.3);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t + i * 0.1);
    o.stop(t + i * 0.1 + 0.35);
  }
  // Bass drone
  const bass = audioCtx.createOscillator();
  bass.type = 'sine';
  bass.frequency.setValueAtTime(65, t);
  const bg = audioCtx.createGain();
  bg.gain.setValueAtTime(0.06 * masterVolume, t);
  bg.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  bass.connect(bg);
  bg.connect(audioCtx.destination);
  bass.start(t);
  bass.stop(t + 0.7);
}
function sfxAchievementUnlock() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6 (major chord arpeggio)
  for (let i = 0; i < notes.length; i++) {
    const o = audioCtx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(notes[i], t + i * 0.08);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.04 * masterVolume, t + i * 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t + i * 0.08);
    o.stop(t + i * 0.08 + 0.25);
  }
}
function unlockAchievement(key) {
  const a = ACHIEVEMENTS[key];
  if (a && !a.unlocked) {
    a.unlocked = true;
    achievementsThisRun++;
    saveAchievements();
    sfxAchievementUnlock();
    spawnFloatingText(W / 2, H / 2 - 60, `Achievement: ${a.name}`, '#ffcc44');
    spawnFloatingText(W / 2, H / 2 - 40, a.desc, '#ffee88');
    shake = Math.max(shake, 8);
    if (state === STATE.PLAYING) {
      achievementNotifications.push({ name: a.name, desc: a.desc });
    }
    for (let k = 0; k < 20; k++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(2, 5);
      particles.push({
        x: W / 2, y: H / 2 - 50,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rand(30, 60),
        maxLife: 60,
        color: '#ffcc44',
        size: rand(2, 4),
        decay: 0.95,
      });
    }
    sfxUpgrade();
    updateAchievementUI();
  }
}
function checkAchievements() {
  if (grazeCount >= 100) unlockAchievement('grazer');
  if (combo >= 25) unlockAchievement('combo_master');
  if (wave >= 10) unlockAchievement('survivor');
}
function updateAchievementUI() {
  const list = document.getElementById('achievement-list');
  if (!list) return;
  list.innerHTML = '';
  let unlocked = 0;
  let total = 0;
  for (const k in ACHIEVEMENTS) {
    const a = ACHIEVEMENTS[k];
    total++;
    if (a.unlocked) unlocked++;
    const el = document.createElement('div');
    el.className = 'achievement' + (a.unlocked ? ' unlocked' : '');
    el.textContent = a.unlocked ? `✓ ${a.name}` : `? ${a.name}`;
    el.title = a.desc;
    list.appendChild(el);
  }
  const progEl = document.getElementById('achievement-progress');
  if (progEl) {
    progEl.textContent = `${unlocked}/${total}`;
    const pct = unlocked / total;
    progEl.style.color = pct >= 0.8 ? '#44ff88' : pct >= 0.5 ? '#ffcc44' : pct >= 0.25 ? '#ff8844' : '#ff4444';
  }
}
const ENEMY_LOG_DATA = [
  { type: 'drone', name: 'Drone', color: '#ff6666' },
  { type: 'swarmer', name: 'Swarmer', color: '#ff55aa' },
  { type: 'hunter', name: 'Hunter', color: '#ff8844' },
  { type: 'sniper', name: 'Sniper', color: '#ff44ff' },
  { type: 'tank', name: 'Tank', color: '#ffcc44' },
  { type: 'splitter', name: 'Splitter', color: '#cc44ff' },
  { type: 'bomber', name: 'Bomber', color: '#ff5522' },
  { type: 'shielder', name: 'Shielder', color: '#44ddaa' },
  { type: 'medic', name: 'Medic', color: '#44ff88' },
  { type: 'divider', name: 'Divider', color: '#4466ff' },
  { type: 'boss', name: 'Boss', color: '#ff3333' },
  { type: 'mine', name: 'Mine', color: '#aa2222' },
  { type: 'phantom', name: 'Phantom', color: '#aa66ff' },
];
function updateEnemyLogUI() {
  const list = document.getElementById('enemy-log-list');
  if (!list) return;
  list.innerHTML = '';
  for (const entry of ENEMY_LOG_DATA) {
    const discovered = persistentEncountered.has(entry.type);
    const el = document.createElement('div');
    el.style.cssText = `
      padding: 3px 8px; border-radius: 4px; font-size: 10px;
      border: 1px solid ${discovered ? entry.color : '#334455'};
      color: ${discovered ? entry.color : '#334455'};
      background: ${discovered ? entry.color + '15' : 'transparent'};
      opacity: ${discovered ? 1 : 0.6};
      cursor: ${discovered ? 'help' : 'default'};
    `;
    const kills = enemyKillsLog[entry.type] || 0;
    el.textContent = discovered ? `${entry.name} (${kills})` : '???';
    if (discovered) el.title = `${ENEMY_HINTS[entry.type]} — Kills: ${kills}`;
    list.appendChild(el);
  }
}
function updateLeaderboardUI(highlightIndex = -1) {
  const ids = ['leaderboard-list', 'leaderboard-menu-list'];
  const diffNames = { 1: 'E', 2: 'N', 3: 'H', 4: 'X' };
  const diffColors = { 1: '#44ff88', 2: '#aabbdd', 3: '#ff8844', 4: '#ff4444' };
  const filtered = leaderboardFilter === 0 ? leaderboard : leaderboard.filter(e => e.difficulty === leaderboardFilter);
  for (const id of ids) {
    const list = document.getElementById(id);
    if (!list) continue;
    list.innerHTML = '';
    if (filtered.length === 0) {
      list.innerHTML = '<div style="color:#556688; font-size:11px;">No scores yet</div>';
      continue;
    }
    filtered.forEach((entry, i) => {
      const el = document.createElement('div');
      const isHighlight = leaderboardFilter === 0 ? i === highlightIndex : leaderboard.indexOf(entry) === highlightIndex;
      el.style.cssText = `color:${isHighlight ? '#ffcc44' : '#aabbdd'}; font-size:11px; margin:2px 0; font-weight:${isHighlight ? '700' : '400'};`;
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
      const diffLabel = entry.difficulty ? `<span style="color:${diffColors[entry.difficulty] || '#aabbdd'}; font-size:9px;">${diffNames[entry.difficulty] || '?'}</span> ` : '';
      el.innerHTML = `${medal} ${diffLabel}${entry.score.toLocaleString()} (W${entry.wave})`;
      list.appendChild(el);
    });
  }
}
loadAchievements();
loadPersistentEncountered();

/* ---------- Entities ---------- */
const player = {
  x: 0, y: 0,
  vx: 0, vy: 0,
  radius: 10,
  hp: 100, maxHp: 100,
  speed: 5.5,
  focusSpeed: 2.8,
  shootCooldown: 0,
  invincible: 0,
  angle: -Math.PI / 2,
  powerLevel: 1,
  maxPower: 5,
  bombs: 3,
  grazeRadius: 28,
  dashSpeed: 14,
};

const bullets = [];
const enemyBullets = [];
const enemies = [];
const particles = [];
const stars = [];
const texts = [];
const powerups = [];
const warnings = [];

/* ---------- Starfield (parallax) ---------- */
let nebulae = [];
function initStars() {
  stars.length = 0;
  for (let i = 0; i < 180; i++) {
    const roll = Math.random();
    const layer = roll < 0.4 ? 0 : (roll < 0.75 ? 1 : 2);
    const sizeMult = layer === 0 ? 0.6 : layer === 1 ? 1.0 : 1.5;
    const alphaMult = layer === 0 ? 0.6 : layer === 1 ? 1.0 : 1.2;
    const speedMult = layer === 0 ? 0.4 : layer === 1 ? 0.8 : 1.3;
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: (Math.random() * 2.2 + 0.3) * sizeMult,
      speed: (Math.random() * 1.2 + 0.15) * speedMult,
      alpha: Math.min(1, (Math.random() * 0.6 + 0.2) * alphaMult),
      layer,
    });
  }
  nebulae = [];
  const colors = [
    { r: 60, g: 20, b: 80 },   // purple
    { r: 20, g: 40, b: 90 },   // blue
    { r: 80, g: 20, b: 30 },   // red
  ];
  for (let i = 0; i < 3; i++) {
    nebulae.push({
      x: Math.random() * W,
      y: Math.random() * H,
      radius: Math.random() * 150 + 100,
      color: colors[i],
      speed: Math.random() * 0.3 + 0.1,
      alpha: Math.random() * 0.04 + 0.03,
    });
  }
  // background asteroids
  asteroids = [];
  const asteroidCount = particleDensity === 0 ? 3 : particleDensity === 1 ? 5 : 7;
  for (let i = 0; i < asteroidCount; i++) {
    const radius = rand(12, 35);
    const points = [];
    const numPoints = Math.floor(rand(6, 10));
    for (let j = 0; j < numPoints; j++) {
      const a = (j / numPoints) * Math.PI * 2;
      const r = radius * rand(0.7, 1.3);
      points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    asteroids.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: rand(-0.15, 0.15),
      vy: rand(-0.08, 0.08),
      radius,
      points,
      rotation: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.003, 0.003),
      color: `rgba(${Math.floor(rand(40, 70))}, ${Math.floor(rand(35, 60))}, ${Math.floor(rand(45, 75))}, ${rand(0.15, 0.35)})`,
    });
  }
  // background planets
  planets = [];
  const planetCount = particleDensity === 0 ? 1 : 2;
  const planetColors = [
    { base: '#1a2040', highlight: '#2a4070', shadow: '#0a1020' },
    { base: '#301818', highlight: '#603030', shadow: '#180808' },
    { base: '#182818', highlight: '#284828', shadow: '#081008' },
  ];
  for (let i = 0; i < planetCount; i++) {
    const radius = rand(120, 280);
    const stripes = [];
    const stripeCount = Math.floor(rand(3, 6));
    for (let s = 0; s < stripeCount; s++) {
      stripes.push({
        yOffset: rand(-radius * 0.6, radius * 0.6),
        height: rand(10, 30),
        alpha: rand(0.03, 0.08),
      });
    }
    planets.push({
      x: rand(0, W),
      y: rand(-radius * 0.3, H * 0.5),
      vx: rand(-0.02, 0.02),
      vy: rand(-0.005, 0.005),
      radius,
      color: planetColors[i % 3],
      stripes,
      craters: Math.floor(rand(2, 5)),
    });
  }
}

/* ---------- Utility ---------- */
function rand(a, b) { return Math.random() * (b - a) + a; }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function angleTo(from, to) { return Math.atan2(to.y - from.y, to.x - from.x); }
function lightenColor(hex) {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 50);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 50);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 50);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

/* ---------- Particle Spawners ---------- */
function spawnExplosion(x, y, color, count = 12, shockwave = false) {
  const densityMult = particleDensity === 0 ? 0.4 : particleDensity === 1 ? 0.7 : 1.0;
  const maxNew = Math.max(0, 300 - particles.length);
  const actualCount = Math.min(Math.floor(count * densityMult), maxNew);
  for (let i = 0; i < actualCount; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(1, 4);
    particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: rand(20, 55),
      maxLife: 55,
      color,
      size: rand(1.5, 4),
      decay: rand(0.92, 0.98),
    });
  }
  // shockwave pushes nearby enemy bullets
  if (shockwave) {
    for (const b of enemyBullets) {
      const d = Math.hypot(b.x - x, b.y - y);
      if (d < 80 && d > 0) {
        const a = Math.atan2(b.y - y, b.x - x);
        const force = (80 - d) / 80 * 3;
        b.vx += Math.cos(a) * force;
        b.vy += Math.sin(a) * force;
      }
    }
    // visual shockwave ring
    shockwaves.push({ x, y, radius: 5, maxRadius: 60, life: 20, maxLife: 20, color });
  }
}

function spawnPlayerHitParticles() {
  const densityMult = particleDensity === 0 ? 0.5 : particleDensity === 1 ? 0.8 : 1.0;
  const count = Math.floor(10 * densityMult);
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(2, 5);
    particles.push({
      x: player.x, y: player.y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: rand(15, 30),
      maxLife: 30,
      color: '#aaddff',
      size: rand(2, 4),
      decay: 0.92,
    });
  }
}

function spawnHitSparks(x, y, color = '#ffaa44') {
  const densityMult = particleDensity === 0 ? 0.4 : particleDensity === 1 ? 0.7 : 1.0;
  const maxNew = Math.max(0, 300 - particles.length);
  const count = Math.min(Math.floor(6 * densityMult), maxNew);
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(1, 3);
    particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: rand(10, 25),
      maxLife: 25,
      color,
      size: rand(1, 2),
      decay: 0.9,
    });
  }
}

function spawnFloatingText(x, y, txt, color) {
  texts.push({ x, y, txt, color, life: 45, maxLife: 45, vy: -2.2, size: 16, baseScale: 1.5 });
}
function spawnDamageNumber(x, y, dmg) {
  const isCrit = dmg >= 20;
  const color = isCrit ? '#ff4444' : dmg >= 15 ? '#ffee44' : dmg >= 8 ? '#ffffff' : '#aabbcc';
  const size = isCrit ? 16 : 12;
  const baseScale = isCrit ? 1.6 : 1.2;
  const vx = rand(-0.5, 0.5);
  texts.push({ x: x + rand(-8, 8), y, txt: Math.ceil(dmg).toString(), color, life: 30, maxLife: 30, vy: -2, vx, size, baseScale });
}

/* ---------- Bullet Factory ---------- */
function spawnBullet(x, y, angle, speed, color, isEnemy = false, radius = 3, bounces = 0, explosive = false) {
  const arr = isEnemy ? enemyBullets : bullets;
  const limit = isEnemy ? 500 : 200;
  if (arr.length >= limit) arr.shift();
  const b = { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color, radius, isEnemy, bounces, maxBounces: bounces, explosive };
  arr.push(b);
  return b;
}

function spawnLaser(x, y, angle) {
  if (bullets.length >= 200) bullets.shift();
  const speed = 18;
  bullets.push({
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    color: '#ff66ff',
    radius: 4,
    isEnemy: false,
    laser: true,
    life: 12,
    maxLife: 12,
    damage: 8 + player.powerLevel * 2,
  });
}

/* ---------- Power-up Factory ---------- */
function spawnPowerup(x, y) {
  const roll = Math.random();
  let type = 'energy';
  if (roll < 0.15) type = 'power';
  else if (roll < 0.25) type = 'shield';
  else if (roll < 0.30) type = 'timestop';
  else if (roll < 0.35) type = 'magnet';
  else if (roll < 0.40) type = 'overdrive';
  else if (roll < 0.45) type = 'score';
  powerups.push({
    x, y,
    vx: rand(-0.5, 0.5),
    vy: rand(0.5, 1.2),
    type,
    radius: 10,
    life: 600,
    angle: 0,
  });
}

/* ---------- Enemy Factory ---------- */
function checkHighScore() {
  if (score > highScore || score > (highScoresByDifficulty[difficulty] || 0)) {
    recordBrokenThisRun = true;
  }
  if (score > highScore) { highScore = score; }
  if (score > (highScoresByDifficulty[difficulty] || 0)) { highScoresByDifficulty[difficulty] = score; }
  saveHighScore();
}
function bomberExplode(e) {
  const radius = 50;
  spawnExplosion(e.x, e.y, '#ff5522', 25, true);
  spawnFloatingText(e.x, e.y - 20, 'BOOM!', '#ff5522');
  shake = Math.max(shake, 8);
  const boomAngle = Math.atan2(player.y - e.y, player.x - e.x);
  shakeDirX = Math.cos(boomAngle);
  shakeDirY = Math.sin(boomAngle);
  if (player.invincible <= 0 && dist(e, player) < radius + player.radius) {
    player.hp -= practiceMode ? 0 : 12;
    player.invincible = 60;
    damageFlash = 10;
    shake = Math.max(shake, 12);
    damageTakenThisWave = true;
    spawnPlayerHitParticles();
    sfxHurt();
    if (player.hp <= 0) {
      if (combo >= 10 && comboGuard) {
        comboGuard = false;
        player.hp = 1;
        combo = 0;
        comboTimer = 0;
        player.invincible = 120;
        spawnFloatingText(player.x, player.y - 30, 'COMBO GUARD!', '#ff44ff');
        comboGuardFlash = 60;
        sfxPowerup();
      } else {
        player.hp = 0;
        deathSlowMo = 90;
        state = STATE.GAMEOVER;
        if (engineGainNode && audioCtx) engineGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        checkHighScore();
        stats.totalGraze += grazeCount;
        updateStats(true);
        showGameOver();
      }
    }
  }
}

function mineExplode(e) {
  const radius = 35;
  spawnExplosion(e.x, e.y, '#ff4444', 15, true);
  spawnFloatingText(e.x, e.y - 15, 'BOOM!', '#ff4444');
  shake = Math.max(shake, 6);
  const boomAngle = Math.atan2(player.y - e.y, player.x - e.x);
  shakeDirX = Math.cos(boomAngle);
  shakeDirY = Math.sin(boomAngle);
  if (player.invincible <= 0 && dist(e, player) < radius + player.radius) {
    player.hp -= practiceMode ? 0 : 10;
    player.invincible = 60;
    damageFlash = 8;
    shake = Math.max(shake, 10);
    damageTakenThisWave = true;
    spawnPlayerHitParticles();
    sfxHurt();
    if (player.hp <= 0) {
      if (combo >= 10 && comboGuard) {
        comboGuard = false;
        player.hp = 1;
        combo = 0;
        comboTimer = 0;
        player.invincible = 120;
        spawnFloatingText(player.x, player.y - 30, 'COMBO GUARD!', '#ff44ff');
        comboGuardFlash = 60;
        sfxPowerup();
      } else {
        player.hp = 0;
        playerDeathEffect();
        state = STATE.GAMEOVER;
        if (engineGainNode && audioCtx) engineGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        checkHighScore();
        stats.totalGraze += grazeCount;
        updateStats(true);
        showGameOver();
      }
    }
  }
}

function splitDivider(e) {
  if (e.splitCount >= e.maxSplits) return;
  const newRadius = e.radius * 0.7;
  const newHp = Math.max(1, Math.floor(e.hp / 2));
  const colors = ['#4466ff', '#6688ff', '#88aaff'];
  for (let k = -1; k <= 2; k += 2) {
    const child = {
      x: e.x + k * newRadius,
      y: e.y,
      vx: k * 1.5,
      vy: e.vy,
      hp: newHp,
      maxHp: newHp,
      radius: newRadius,
      color: colors[Math.min(e.splitCount + 1, 2)],
      speed: e.speed * 1.2,
      shootInterval: 99999,
      type: 'divider',
      angle: 0,
      phase: e.phase + k * 50,
      elite: e.elite,
      score: Math.floor(e.score * 1.2),
      splitCount: e.splitCount + 1,
      maxSplits: e.maxSplits,
      hitFlash: 0,
    };
    enemies.push(child);
  }
  spawnFloatingText(e.x, e.y, 'DIVIDE!', '#88aaff');
  spawnExplosion(e.x, e.y, e.color, 12, true);
}

function splitEnemy(x, y, elite) {
  const count = Math.floor(rand(2, 4));
  for (let k = 0; k < count; k++) {
    const s = {
      x: x + rand(-15, 15),
      y: y + rand(-15, 15),
      vx: 0, vy: 0,
      hp: Math.floor((6 + wave) * (practiceMode ? 0.5 : (difficulty === 1 ? 0.7 : difficulty === 3 ? 1.4 : 1.0))),
      maxHp: 0,
      radius: 7,
      color: '#ff55aa',
      speed: rand(3.0, 4.5) * (practiceMode ? 0.6 : (difficulty === 1 ? 0.75 : difficulty === 3 ? 1.25 : 1.0)),
      shootInterval: 99999,
      type: 'swarmer',
      angle: 0,
      phase: rand(0, 100),
      elite: false,
      score: 50,
    };
    s.maxHp = s.hp;
    enemies.push(s);
  }
  spawnFloatingText(x, y - 20, 'SPLIT!', '#cc44ff');
}

const ENEMY_HINTS = {
  drone: 'Basic enemy — moves and shoots',
  hunter: 'Fast enemy — shoots 3-way bullets',
  tank: 'Slow but tough — shoots shotgun spread',
  sniper: 'Stationary — fires high-speed aimed shots',
  swarmer: 'Tiny but fast — rushes directly at you',
  boss: 'BOSS — massive health, complex bullet patterns',
  splitter: 'Splits into Swarmers on death!',
  bomber: 'Rams at you — explodes on death!',
  shielder: 'Has regenerating shield — break it fast!',
  medic: 'Heals nearby enemies — take it out first!',
  divider: 'Splits when hit — destroy all parts!',
  mine: 'Proximity mine — explodes when you get too close!',
  phantom: 'Cloaked enemy — phases in and out of visibility!',
};
let bossFirstEncounter = { alpha: false, beta: false };

function spawnEnemy(type) {
  const side = Math.floor(rand(0, 3));
  let x, y;
  if (side === 0) { x = rand(30, W - 30); y = -20; }
  else if (side === 1) { x = W + 20; y = rand(30, H * 0.6); }
  else { x = -20; y = rand(30, H * 0.6); }

  const eliteRate = difficulty === 4 ? 0.15 : 0.08;
  let isElite = type !== 'swarmer' && Math.random() < (type === 'boss' ? 0.15 : eliteRate);
  if (eliteWave && type !== 'boss' && type !== 'swarmer') isElite = true;
  if (type !== 'boss') {
    portalSpawnsSeen++;
    if (portalSpawnsSeen >= 50) unlockAchievement('portal_observer');
  }

  const base = {
    x, y, vx: 0, vy: 0,
    hp: 10, maxHp: 10,
    radius: 14,
    color: '#ff6666',
    shootTimer: rand(30, 90),
    shootInterval: 90,
    type,
    angle: 0,
    phase: 0,
    elite: isElite,
    hitFlash: 0,
    spawnDelay: type === 'boss' ? 0 : 30,
  };
  if (type !== 'boss') sfxPortalOpen();

  const diffMult = practiceMode ? 0.5 : (difficulty === 1 ? 0.7 : difficulty === 3 ? 1.4 : difficulty === 4 ? 2.0 : 1.0);
  const spdMult = practiceMode ? 0.6 : (difficulty === 1 ? 0.75 : difficulty === 3 ? 1.25 : difficulty === 4 ? 1.75 : 1.0);
  if (type === 'drone') {
    base.hp = base.maxHp = Math.floor((14 + wave * 2) * diffMult);
    base.radius = 12;
    base.color = '#ff7777';
    base.speed = rand(1.2, 2.0) * spdMult;
    base.shootInterval = Math.floor(70 / spdMult);
    base.score = 100;
  } else if (type === 'hunter') {
    base.hp = base.maxHp = Math.floor((22 + wave * 3) * diffMult);
    base.radius = 14;
    base.color = '#ff44aa';
    base.speed = rand(1.8, 2.6) * spdMult;
    base.shootInterval = Math.floor(50 / spdMult);
    base.score = 200;
  } else if (type === 'tank') {
    base.hp = base.maxHp = Math.floor((50 + wave * 6) * diffMult);
    base.radius = 20;
    base.color = '#ffaa44';
    base.speed = rand(0.6, 1.2) * spdMult;
    base.shootInterval = Math.floor(110 / spdMult);
    base.score = 400;
  } else if (type === 'sniper') {
    base.hp = base.maxHp = Math.floor((16 + wave * 2) * diffMult);
    base.radius = 11;
    base.color = '#ff88ff';
    base.speed = 0;
    base.shootInterval = Math.floor(100 / spdMult);
    base.score = 300;
    base.aimTimer = 0;
  } else if (type === 'boss') {
    const bossType = (Math.floor(wave / 5) % 2 === 0) ? 'alpha' : 'beta';
    base.bossType = bossType;
    base.hp = base.maxHp = Math.floor((350 + wave * 60) * diffMult);
    base.radius = 38;
    if (bossType === 'beta') {
      base.color = isElite ? '#ffaa00' : '#3366ff';
      base.speed = 1.0;
      base.shootInterval = Math.floor(14 / spdMult);
    } else {
      base.color = isElite ? '#ffaa00' : '#ff3333';
      base.speed = 0.8;
      base.shootInterval = Math.floor(18 / spdMult);
    }
    base.score = 5000;
    base.x = W / 2;
    base.y = -60;
    base.targetY = 70;
    base.vx = rand(0, 1) < 0.5 ? 1.8 : -1.8;
    base.introTimer = 90;
    sfxBossAlert();
  } else if (type === 'swarmer') {
    base.hp = base.maxHp = Math.floor((6 + wave) * diffMult);
    base.radius = 7;
    base.color = '#ff55aa';
    base.speed = rand(3.0, 4.5) * spdMult;
    base.shootInterval = 99999; // doesn't shoot
    base.score = 50;
  } else if (type === 'splitter') {
    base.hp = base.maxHp = Math.floor((28 + wave * 4) * diffMult);
    base.radius = 16;
    base.color = '#cc44ff';
    base.speed = rand(0.5, 1.0) * spdMult;
    base.shootInterval = Math.floor(120 / spdMult);
    base.score = 350;
  } else if (type === 'bomber') {
    base.hp = base.maxHp = Math.floor((10 + wave * 2) * diffMult);
    base.radius = 10;
    base.color = '#ff5522';
    base.speed = rand(4.0, 5.5) * spdMult;
    base.shootInterval = 99999;
    base.score = 150;
  } else if (type === 'shielder') {
    base.hp = base.maxHp = Math.floor((20 + wave * 3) * diffMult);
    base.radius = 18;
    base.color = '#44ddaa';
    base.speed = rand(0.8, 1.4) * spdMult;
    base.shootInterval = Math.floor(80 / spdMult);
    base.score = 500;
    base.shield = Math.floor((15 + wave * 2) * diffMult);
    base.maxShield = base.shield;
    base.shieldRegenTimer = 0;
  } else if (type === 'medic') {
    base.hp = base.maxHp = Math.floor((18 + wave * 2) * diffMult);
    base.radius = 14;
    base.color = '#44ff88';
    base.speed = rand(1.0, 1.6) * spdMult;
    base.shootInterval = 90;
    base.score = 300;
    base.healTimer = 0;
  } else if (type === 'divider') {
    base.hp = base.maxHp = Math.floor((40 + wave * 5) * diffMult);
    base.radius = 22;
    base.color = '#4466ff';
    base.speed = rand(0.4, 0.8) * spdMult;
    base.shootInterval = 99999;
    base.score = 400;
    base.splitCount = 0;
    base.maxSplits = 2;
  } else if (type === 'mine') {
    base.hp = base.maxHp = Math.floor((20 + wave * 3) * diffMult);
    base.radius = 10;
    base.color = '#aa2222';
    base.speed = 0;
    base.shootInterval = 99999;
    base.score = 250;
    base.armTimer = 60; // 1 second to arm
    base.armed = false;
  } else if (type === 'phantom') {
    base.hp = base.maxHp = Math.floor((14 + wave * 2) * diffMult);
    base.radius = 11;
    base.color = '#aa66ff';
    base.speed = rand(2.5, 3.5) * spdMult;
    base.shootInterval = Math.floor(55 / spdMult);
    base.score = 350;
    base.phantomTimer = 0;
    base.phantomVisible = true;
  }

  if (base.elite) {
    base.hp = base.maxHp = Math.floor(base.hp * 1.5);
    base.radius *= 1.2;
    base.speed *= 1.15;
    base.shootInterval = Math.floor(base.shootInterval * 0.75);
    base.score = Math.floor(base.score * 2.5);
    base.color = lightenColor(base.color);
  }

  // first encounter hint
  if (!encounteredTypes.has(type)) {
    encounteredTypes.add(type);
    if (!persistentEncountered.has(type)) {
      persistentEncountered.add(type);
      savePersistentEncountered();
    }
    let hint = ENEMY_HINTS[type];
    if (type === 'boss') {
      const bt = base.bossType;
      if (!bossFirstEncounter[bt]) {
        bossFirstEncounter[bt] = true;
        hint = bt === 'beta' ? 'BETA BOSS — faster movement, denser bullet patterns!' : 'ALPHA BOSS — massive health, complex bullet patterns!';
      } else {
        hint = null;
      }
    }
    if (hint) {
      encounterText = hint;
      encounterTimer = 180; // 3 seconds
      sfxEnemyDiscovered();
    }
  }

  enemies.push(base);
}

/* ---------- Wave Manager ---------- */
let waveTimer = 0;
let enemiesToSpawn = 0;
let spawnTimer = 0;
let bossSpawned = false;

function checkWaveAchievements() {
  if (usedWeapons.size >= 7) unlockAchievement('weapon_master');
  if (bombsUsedThisWave === 0 && wave > 1) unlockAchievement('bomb_saver');
  if (grazeCount >= 200) unlockAchievement('graze_king');
  if (wave >= 20) unlockAchievement('marathon');
  if (score >= 1000000) unlockAchievement('millionaire');
  if (difficulty === 4 && wave >= 10) unlockAchievement('nightmare_survivor');
}

function startWave() {
  waveFlash = 20;
  if (wave > 1) sfxWaveClear();
  bombsUsedThisWave = 0;
  eliteWave = (wave % 10 === 0) && (wave > 0);
  if (eliteWave) {
    spawnFloatingText(W / 2, H / 2 - 50, 'ELITE WAVE!', '#ffaa00');
    shake = Math.max(shake, 6);
    sfxHurt();
    waveAlertTimer = 90;
    waveAlertType = 'elite';
  }
  if (wave % 5 === 0) {
    waveAlertTimer = 120;
    waveAlertType = 'boss';
  }
  // check no-damage streak for Untouchable achievement
  if (wave > 1 && !damageTakenThisWave) {
    noDamageWaves++;
    totalPerfectWaves++;
    if (noDamageWaves >= 5) unlockAchievement('untouchable');
    if (waveTheme) unlockAchievement('theme_survivor');
    const perfectBonus = 500 + wave * 100;
    score += Math.floor(perfectBonus * scoreMultBonus);
    spawnFloatingText(W / 2, H / 2 + 30, `PERFECT! +${perfectBonus}`, '#ffcc44');
    sfxPerfectWave();
  } else if (damageTakenThisWave) {
    noDamageWaves = 0;
    // wave clear bonus based on remaining HP
    const hpBonus = Math.floor((player.hp / player.maxHp) * (100 + wave * 20));
    if (hpBonus > 0) {
      score += Math.floor(hpBonus * scoreMultBonus);
      spawnFloatingText(W / 2, H / 2 + 30, `Wave Clear +${hpBonus}`, '#44aaff');
    }
  }
  // reward selection after 3 perfect waves
  if (noDamageWaves >= 3 && !rewardSelectActive) {
    rewardSelectActive = true;
    generateRewardOptions();
    sfxRewardAppear();
    spawnFloatingText(W / 2, H / 2 - 30, 'CHOOSE YOUR REWARD!', '#ffee44');
    shake = Math.max(shake, 4);
    shakeDirX = 0;
    shakeDirY = -1;
  }
  waveTimer = 0;
  bossSpawned = false;
  const count = 4 + Math.floor(wave * 1.6);
  enemiesToSpawn = count;
  spawnTimer = 0;
  warnings.length = 0;
  damageTakenThisWave = false;
  // wave theme (every 3rd non-boss wave)
  waveTheme = null;
  if (wave % 5 !== 0 && wave % 3 === 0 && wave >= 3) {
    const themes = ['SWARM', 'ASSAULT', 'FORTRESS', 'SNIPER', 'DIVIDE'];
    waveTheme = themes[Math.floor(Math.random() * themes.length)];
    const themeColors = { SWARM: '#ff55aa', ASSAULT: '#ff8844', FORTRESS: '#44ddaa', SNIPER: '#ff44ff', DIVIDE: '#4466ff' };
    spawnFloatingText(W / 2, H / 2 + 30, `${waveTheme} WAVE!`, themeColors[waveTheme] || '#ffcc44');
    sfxWaveTheme(waveTheme);
  }
  if (!rewardSelectActive) {
    sfxWaveStart();
    spawnFloatingText(W / 2, H / 2, `WAVE ${wave}`, '#44aaff');
  }
  checkAchievements();
}

function generateRewardOptions() {
  const pool = [
    { id: 'damage', name: '+10% Damage', desc: 'Bullet damage up', color: '#ff4444', apply: () => { damageMult += 0.1; } },
    { id: 'speed', name: '+10% Speed', desc: 'Movement faster', color: '#44aaff', apply: () => { speedMultBonus += 0.1; } },
    { id: 'hp', name: '+20 HP', desc: 'Max HP + heal', color: '#44ff88', apply: () => { player.maxHp += 20; player.hp = Math.min(player.maxHp, player.hp + 20); } },
    { id: 'bomb', name: '+1 Bomb', desc: 'Extra bomb', color: '#ff8844', apply: () => { player.bombs = Math.min(5, player.bombs + 1); } },
    { id: 'score', name: '+5% Score', desc: 'Score multiplier', color: '#ffcc44', apply: () => { scoreMultBonus += 0.05; } },
  ];
  rewardOptions = [];
  const used = new Set();
  while (rewardOptions.length < 3 && used.size < pool.length) {
    const r = pool[Math.floor(Math.random() * pool.length)];
    if (!used.has(r.id)) {
      used.add(r.id);
      rewardOptions.push(r);
    }
  }
}
function sfxRewardAppear() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const notes = [440, 554, 659]; // A4, C#5, E5 (bright major triad)
  for (let i = 0; i < notes.length; i++) {
    const o = audioCtx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(notes[i], t + i * 0.06);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.035 * masterVolume, t + i * 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.15);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t + i * 0.06);
    o.stop(t + i * 0.06 + 0.2);
  }
}
function sfxRewardSelect() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6 (celebratory arpeggio)
  for (let i = 0; i < notes.length; i++) {
    const o = audioCtx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(notes[i], t + i * 0.05);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.04 * masterVolume, t + i * 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.12);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t + i * 0.05);
    o.stop(t + i * 0.05 + 0.18);
  }
}
function sfxEnemyDiscovered() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  // Discovery chime: rising minor third
  const notes = [440, 523]; // A4, C5
  for (let i = 0; i < notes.length; i++) {
    const o = audioCtx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(notes[i], t + i * 0.06);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.03 * masterVolume, t + i * 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.12);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t + i * 0.06);
    o.stop(t + i * 0.06 + 0.15);
  }
}
function applyReward(idx) {
  if (idx >= 0 && idx < rewardOptions.length) {
    const r = rewardOptions[idx];
    r.apply();
    spawnFloatingText(W / 2, H / 2 + 80, r.name, r.color);
    sfxRewardSelect();
    shake = Math.max(shake, 6);
    shakeDirX = 0;
    shakeDirY = -1;
    // milestone particles
    const count = particleDensity === 0 ? 15 : particleDensity === 1 ? 25 : 35;
    for (let k = 0; k < count; k++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(2, 6);
      particles.push({
        x: W / 2, y: H / 2 + 80,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: rand(30, 60),
        maxLife: 60,
        color: r.color,
        size: rand(2, 4),
        decay: 0.95,
      });
    }
  }
  rewardSelectActive = false;
  rewardOptions = [];
  noDamageWaves = 0; // reset streak after reward
}
function drawRewardSelect() {
  if (!rewardSelectActive) return;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffee44';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CHOOSE YOUR REWARD', W / 2, H / 2 - 100);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#aabbdd';
  ctx.fillText('Press 1, 2, or 3', W / 2, H / 2 - 75);
  const cardW = 140;
  const cardH = 100;
  const gap = 20;
  const startX = (W - (cardW * 3 + gap * 2)) / 2;
  rewardOptions.forEach((r, i) => {
    const x = startX + i * (cardW + gap);
    const y = H / 2 - 30;
    // card bg
    ctx.fillStyle = 'rgba(20,30,50,0.85)';
    ctx.fillRect(x, y, cardW, cardH);
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cardW, cardH);
    // number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`${i + 1}`, x + cardW / 2, y + 28);
    // name
    ctx.fillStyle = r.color;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(r.name, x + cardW / 2, y + 55);
    // desc
    ctx.fillStyle = '#8899bb';
    ctx.font = '11px sans-serif';
    ctx.fillText(r.desc, x + cardW / 2, y + 75);
  });
  ctx.restore();
}
function useBomb() {
  player.bombs--;
  bombsUsedThisWave++;
  bombCooldown = 30;
  bombAnim = 40;
  shake = 20;
  shakeDirX = 0;
  shakeDirY = 0;
  slowMo = 45;
  sfxBombThrow();
  sfxBomb();
  // clear enemy bullets
  const bombParticles = particleDensity === 0 ? 2 : particleDensity === 1 ? 3 : 4;
  for (const b of enemyBullets) {
    spawnExplosion(b.x, b.y, '#ff8844', bombParticles);
  }
  enemyBullets.length = 0;
  // damage enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.hp -= 40 * damageMult;
    spawnHitSparks(e.x, e.y, e.color);
    if (e.hp <= 0) {
      const pts = Math.floor(e.score * (1 + combo * 0.1));
      score += Math.floor(pts * scoreMultBonus);
      combo++;
      sfxComboChime(combo);
      comboTimer = 180;
      comboScale = 1.4;
      comboFlash = 15;
      comboFlashColor = combo >= 30 ? '#ffcc44' : combo >= 16 ? '#ff4444' : combo >= 6 ? '#ff8844' : '#ffffff';
      spawnExplosion(e.x, e.y, e.color, 20);
      spawnFloatingText(e.x, e.y, `+${pts}`, '#ffcc44');
      if (Math.random() < 0.15) spawnPowerup(e.x, e.y);
      enemies.splice(i, 1);
    }
  }
  spawnFloatingText(player.x, player.y - 30, 'BOMB!!', '#ff8844');
  player.invincible = Math.max(player.invincible, 120);
}

function waveLogic() {
  if (enemiesToSpawn > 0) {
    spawnTimer--;
    // spawn warning
    if (spawnTimer === 45 && enemiesToSpawn > 0) {
      const side = Math.floor(rand(0, 3));
      let wx, wy, wa;
      if (side === 0) { wx = rand(30, W - 30); wy = 8; wa = Math.PI / 2; }
      else if (side === 1) { wx = W - 8; wy = rand(30, H * 0.6); wa = Math.PI; }
      else { wx = 8; wy = rand(30, H * 0.6); wa = 0; }
      const warnColor = type === 'bomber' ? '#ff4444' : type === 'shielder' ? '#44ddaa' : type === 'medic' ? '#44ff88' : type === 'splitter' ? '#cc44ff' : type === 'divider' ? '#4466ff' : '#ffcc44';
      warnings.push({ x: wx, y: wy, angle: wa, life: 45, color: warnColor });
    }
    if (spawnTimer <= 0) {
      spawnTimer = Math.max(18, 55 - wave * 3);
      const roll = Math.random();
      let type = 'drone';
      // theme-based spawn bias
      if (waveTheme === 'SWARM') {
        if (wave >= 2 && roll < 0.45) type = 'swarmer';
        else if (wave >= 6 && roll < 0.70) type = 'splitter';
      } else if (waveTheme === 'ASSAULT') {
        if (wave >= 3 && roll < 0.35) type = 'hunter';
        else if (wave >= 7 && roll < 0.60) type = 'bomber';
      } else if (waveTheme === 'FORTRESS') {
        if (wave >= 5 && roll < 0.30) type = 'tank';
        else if (wave >= 8 && roll < 0.55) type = 'shielder';
        else if (wave >= 11 && roll < 0.70) type = 'mine';
      } else if (waveTheme === 'SNIPER') {
        if (wave >= 4 && roll < 0.30) type = 'sniper';
        else if (wave >= 9 && roll < 0.50) type = 'medic';
      } else if (waveTheme === 'DIVIDE') {
        if (wave >= 10 && roll < 0.45) type = 'divider';
      } else {
        // normal spawn rates
        if (wave >= 2 && roll < 0.20) type = 'swarmer';
        if (wave >= 3 && roll < 0.28) type = 'hunter';
        if (wave >= 4 && roll < 0.12) type = 'sniper';
        if (wave >= 5 && roll < 0.18) type = 'tank';
        if (wave >= 6 && roll < 0.25) type = 'splitter';
        if (wave >= 7 && roll < 0.30) type = 'bomber';
        if (wave >= 8 && roll < 0.22) type = 'shielder';
        if (wave >= 9 && roll < 0.28) type = 'medic';
        if (wave >= 10 && roll < 0.20) type = 'divider';
        if (wave >= 11 && roll < 0.15) type = 'mine';
        if (wave >= 12 && roll < 0.18) type = 'phantom';
      }
      spawnEnemy(type);
      enemiesToSpawn--;
    }
  } else if (enemies.length === 0 && !bossSpawned) {
    if (wave % 5 === 0) {
      spawnEnemy('boss');
      bossSpawned = true;
    } else {
      if (!damageTakenThisWave && wave > 1) {
        spawnFloatingText(W / 2, H / 2 - 40, 'PERFECT WAVE!', '#ffee44');
        shake = Math.max(shake, 8);
        shakeDirX = 0;
        shakeDirY = -1;
        const perfectCount = particleDensity === 0 ? 15 : particleDensity === 1 ? 25 : 35;
        for (let k = 0; k < perfectCount; k++) {
          const a = rand(0, Math.PI * 2);
          const s = rand(2, 5);
          particles.push({
            x: W / 2, y: H / 2 - 40,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            life: rand(30, 60),
            maxLife: 60,
            color: '#ffee44',
            size: rand(2, 4),
            decay: 0.95,
          });
        }
      }
      waveClearTimer = 180;
      waveClearWave = wave;
      waveClearPerfect = !damageTakenThisWave && wave > 1;
      waveClearIsBoss = false;
      // wave clear particle burst
      const burstColor = waveClearPerfect ? '#ffee44' : '#44aaff';
      const burstCount = particleDensity === 0 ? 20 : particleDensity === 1 ? 35 : 50;
      for (let k = 0; k < burstCount; k++) {
        const angle = rand(0, Math.PI * 2);
        const speed = rand(2, 6);
        particles.push({
          x: W / 2, y: H / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: rand(30, 60),
          maxLife: 60,
          color: burstColor,
          size: rand(2, 4),
          decay: 0.95,
        });
      }
      if (eliteWave) {
        eliteWavesSurvived++;
        unlockAchievement('elite_wave_survivor');
      }
      wave++;
      checkWaveAchievements();
      startWave();
    }
  } else if (bossSpawned && enemies.length === 0) {
    waveClearTimer = 180;
    waveClearWave = wave;
    waveClearPerfect = false;
    waveClearIsBoss = true;
    // boss defeat particle burst
    const bossBurstCount = particleDensity === 0 ? 30 : particleDensity === 1 ? 50 : 70;
    for (let k = 0; k < bossBurstCount; k++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(3, 8);
      particles.push({
        x: W / 2, y: H / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rand(40, 80),
        maxLife: 80,
        color: k % 3 === 0 ? '#ff4444' : k % 3 === 1 ? '#ffee44' : '#ff8844',
        size: rand(2, 5),
        decay: 0.96,
      });
    }
    wave++;
    checkWaveAchievements();
    startWave();
  }
}

/* ---------- Player Logic ---------- */
function updatePlayer() {
  if (overdriveTimer > 0) overdriveTimer--;
  if (scoreMultTimer > 0) {
    scoreMultTimer--;
    if (scoreMultTimer <= 0) scoreMultBonus = Math.max(1.0, scoreMultBonus - 0.5);
  }
  const focus = isDown('shift') || touchFocusBtn;
  const speed = (focus ? player.focusSpeed : player.speed) * speedMultBonus;

  let mx = 0, my = 0;
  if (isDown('a') || isDown('arrowleft')) mx -= 1;
  if (isDown('d') || isDown('arrowright')) mx += 1;
  if (isDown('w') || isDown('arrowup')) my -= 1;
  if (isDown('s') || isDown('arrowdown')) my += 1;

  // touch joystick
  if (touchActive) {
    const dx = touchCurrentX - touchStartX;
    const dy = touchCurrentY - touchStartY;
    const d = Math.hypot(dx, dy);
    if (d > 5) {
      mx = clamp(dx / 40, -1, 1);
      my = clamp(dy / 40, -1, 1);
    }
  }

  if (mx !== 0 && my !== 0) {
    const f = 1 / Math.sqrt(2);
    mx *= f; my *= f;
  }

  // dismiss tutorial on input
  if (tutorialActive && (mx !== 0 || my !== 0 || isDown(' ') || isDown('j'))) {
    tutorialActive = false;
  }

  // dash trigger
  if ((isDown('k') || isDown('x')) && dashCooldown <= 0 && dashing <= 0 && (mx !== 0 || my !== 0)) {
    keys['k'] = false;
    keys['x'] = false;
    dashing = 18;
    dashCooldown = 120;
    player.vx = mx * player.dashSpeed;
    player.vy = my * player.dashSpeed;
    sfxDash();
    spawnFloatingText(player.x, player.y - 20, 'DASH!', '#aaddff');
  }

  player.vx += (mx * speed - player.vx) * 0.2;
  player.vy += (my * speed - player.vy) * 0.2;
  player.x += player.vx;
  player.y += player.vy;
  player.x = clamp(player.x, player.radius, W - player.radius);
  player.y = clamp(player.y, player.radius, H - player.radius);

  // engine hum volume scales with movement speed
  if (engineGainNode && audioCtx) {
    const spd = Math.hypot(player.vx, player.vy);
    const baseVol = 0.008;
    const maxExtra = 0.025;
    const targetVol = (baseVol + Math.min(spd / player.speed, 1) * maxExtra) * masterVolume;
    engineGainNode.gain.setTargetAtTime(targetVol, audioCtx.currentTime, 0.1);
  }

  if (mx !== 0 || my !== 0) {
    player.angle = Math.atan2(my, mx);
    // engine trail particles
    if (Math.random() < 0.5) {
      const theme = THEMES[colorTheme];
      const backAngle = player.angle + Math.PI;
      const engineColors = {
        balanced: '#44ffaa',
        spread: '#44ff88',
        rapid: '#ffaa44',
        laser: '#ff66ff',
        ricochet: '#ffcc66',
        homing: '#ff66cc',
        explosive: '#ff6633',
      };
      particles.push({
        x: player.x + Math.cos(backAngle) * 8 + rand(-3, 3),
        y: player.y + Math.sin(backAngle) * 8 + rand(-3, 3),
        vx: Math.cos(backAngle) * rand(0.5, 1.5) + rand(-0.3, 0.3),
        vy: Math.sin(backAngle) * rand(0.5, 1.5) + rand(-0.3, 0.3),
        life: rand(6, 14),
        maxLife: 14,
        color: engineColors[weaponType] || theme.engine,
        size: rand(1.5, 3),
        decay: 0.9,
      });
    }
  }

  // shooting
  // dash
  if (dashCooldown > 0) dashCooldown--;
  if (dashing > 0) {
    dashing--;
    player.invincible = Math.max(player.invincible, 1);
    // dash trail
    particles.push({
      x: player.x + rand(-4, 4),
      y: player.y + rand(-4, 4),
      vx: rand(-0.5, 0.5),
      vy: rand(-0.5, 0.5),
      life: rand(8, 16),
      maxLife: 16,
      color: '#aaddff',
      size: rand(2, 4),
      decay: 0.88,
    });
  }

  // bomb
  if (bombCooldown > 0) bombCooldown--;
  if (bombAnim > 0) bombAnim--;
  if ((isDown('b') || (touchActive && touchShootBtn && touchFocusBtn)) && bombCooldown <= 0 && player.bombs > 0) {
    keys['b'] = false;
    useBomb();
  }

  player.shootCooldown -= overdriveTimer > 0 ? 2 : 1;
  const shooting = isDown(' ') || isDown('j') || touchShootBtn || autoFire;
  if (shooting && player.shootCooldown <= 0) {
    const pl = player.powerLevel;
    const bSpeed = 10;
    const baseAngle = -Math.PI / 2;
    if (weaponType === 'rapid') {
      player.shootCooldown = 3;
      spawnBullet(player.x, player.y - 10, baseAngle, bSpeed, '#44ffaa');
      if (pl >= 3) {
        spawnBullet(player.x - 8, player.y - 6, baseAngle - 0.12, bSpeed, '#66ffcc');
        spawnBullet(player.x + 8, player.y - 6, baseAngle + 0.12, bSpeed, '#66ffcc');
      }
      if (pl >= 5) {
        spawnBullet(player.x, player.y - 14, baseAngle, bSpeed * 1.1, '#aaffee');
      }
    } else if (weaponType === 'spread') {
      player.shootCooldown = 8;
      const count = 3 + pl;
      const spread = 0.15 + pl * 0.06;
      for (let k = 0; k < count; k++) {
        const a = baseAngle - spread / 2 + (spread / (count - 1)) * k;
        spawnBullet(player.x, player.y - 10, a, bSpeed * (0.9 + Math.random() * 0.15), '#44ffaa');
      }
    } else if (weaponType === 'laser') {
      player.shootCooldown = 10;
      const laserCount = 1 + Math.floor(pl / 2);
      for (let k = 0; k < laserCount; k++) {
        const offsetX = (k - (laserCount - 1) / 2) * 14;
        spawnLaser(player.x + offsetX, player.y - 10, baseAngle);
      }
    } else if (weaponType === 'ricochet') {
      player.shootCooldown = 7;
      const rCount = 1 + Math.floor(pl / 2);
      for (let k = 0; k < rCount; k++) {
        const offsetX = (k - (rCount - 1) / 2) * 10;
        spawnBullet(player.x + offsetX, player.y - 10, baseAngle, bSpeed * 0.95, '#ffcc66', false, 4, 2);
      }
    } else if (weaponType === 'homing') {
      player.shootCooldown = 10;
      const hCount = 1 + Math.floor(pl / 2);
      for (let k = 0; k < hCount; k++) {
        const offsetX = (k - (hCount - 1) / 2) * 12;
        const b = spawnBullet(player.x + offsetX, player.y - 10, baseAngle, bSpeed * 0.85, '#ff66cc', false, 5);
        if (b) { b.homing = true; b.homingTurn = 0.04 + pl * 0.01; }
      }
    } else if (weaponType === 'explosive') {
      player.shootCooldown = 14;
      const exCount = 1 + Math.floor(pl / 3);
      for (let k = 0; k < exCount; k++) {
        const offsetX = (k - (exCount - 1) / 2) * 14;
        const spread = exCount > 1 ? (k - (exCount - 1) / 2) * 0.06 : 0;
        const b = spawnBullet(player.x + offsetX, player.y - 10, baseAngle + spread, bSpeed * 0.8, '#ff6633', false, 5, 0, true);
      }
    } else {
      // balanced
      player.shootCooldown = 6;
      spawnBullet(player.x, player.y - 10, baseAngle, bSpeed, '#44ffaa');
      if (pl >= 2) {
        spawnBullet(player.x - 6, player.y - 6, baseAngle - 0.08, bSpeed, '#44ffaa');
        spawnBullet(player.x + 6, player.y - 6, baseAngle + 0.08, bSpeed, '#44ffaa');
      }
      if (pl >= 3) {
        spawnBullet(player.x - 14, player.y - 2, baseAngle - 0.22, bSpeed * 0.95, '#66ffcc');
        spawnBullet(player.x + 14, player.y - 2, baseAngle + 0.22, bSpeed * 0.95, '#66ffcc');
      }
      if (pl >= 4) {
        spawnBullet(player.x, player.y - 14, baseAngle, bSpeed * 1.1, '#aaffee');
      }
      if (pl >= 5) {
        spawnBullet(player.x - 20, player.y + 2, baseAngle - 0.35, bSpeed * 0.9, '#88ffdd');
        spawnBullet(player.x + 20, player.y + 2, baseAngle + 0.35, bSpeed * 0.9, '#88ffdd');
      }
    }
    usedWeapons.add(weaponType);
    stats.weaponUses[weaponType] = (stats.weaponUses[weaponType] || 0) + 1;
    const newUses = stats.weaponUses[weaponType];
    if (newUses >= 250 && !masteredWeapons.has(weaponType)) {
      masteredWeapons.add(weaponType);
      player.hp = Math.min(player.maxHp, player.hp + 2);
      player.bombs = Math.min(5, player.bombs + 1);
      spawnFloatingText(player.x, player.y - 50, `${WEAPON_DESCS[weaponType].name} MASTERED!`, '#ffee44');
      spawnFloatingText(player.x, player.y - 30, '+2 HP + BOMB', '#44ff88');
      shake = Math.max(shake, 10);
      sfxPerfectWave();
    }
    sfxShoot();
  }

  // trail particles
  if (Math.random() < 0.4) {
    particles.push({
      x: player.x + rand(-4, 4),
      y: player.y + 10,
      vx: rand(-0.3, 0.3),
      vy: rand(1, 2.5),
      life: rand(10, 20),
      maxLife: 20,
      color: '#44ddff',
      size: rand(1, 2.5),
      decay: 0.92,
    });
  }

  if (player.invincible > 0) player.invincible--;
}

/* ---------- Enemy Logic ---------- */
function updateEnemies(timeScale = 1) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.spawnDelay > 0) {
      e.spawnDelay -= timeScale;
      continue;
    }
    e.phase++;

    if (e.type === 'drone') {
      e.vy += 0.05 * timeScale;
      e.vx *= 1 - (0.02 * timeScale);
      e.vy *= 1 - (0.01 * timeScale);
      if (e.y < H * 0.25) e.vy += 0.02 * timeScale;
      if (e.y > H * 0.55) e.vy -= 0.03 * timeScale;
      e.x += e.vx * timeScale;
      e.y += e.vy * timeScale;
    } else if (e.type === 'hunter') {
      const a = angleTo(e, player);
      e.vx += Math.cos(a) * 0.12 * timeScale;
      e.vy += Math.sin(a) * 0.12 * timeScale;
      const spd = Math.hypot(e.vx, e.vy);
      if (spd > e.speed) { e.vx = (e.vx / spd) * e.speed; e.vy = (e.vy / spd) * e.speed; }
      e.x += e.vx * timeScale;
      e.y += e.vy * timeScale;
    } else if (e.type === 'tank') {
      e.vy += 0.02 * timeScale;
      e.vy *= 1 - (0.005 * timeScale);
      e.x += Math.sin(e.phase * 0.02) * 0.8 * timeScale;
      e.y += e.vy * timeScale;
    } else if (e.type === 'boss') {
      if (e.introTimer > 0) {
        e.introTimer -= timeScale;
        e.y += (e.targetY - e.y) * 0.03 * timeScale;
        if (e.introTimer <= 0) {
          const isBeta = e.bossType === 'beta';
          spawnFloatingText(W / 2, H / 2 - 50, e.elite ? 'ELITE BOSS ENGAGED!' : 'BOSS ENGAGED!', e.elite ? '#ffaa00' : (isBeta ? '#3366ff' : '#ff3333'));
        }
      } else {
        e.x += e.vx * timeScale;
        if (e.x < 70 || e.x > W - 70) e.vx *= -1;
        e.y += Math.sin(e.phase * 0.03) * 0.5 * timeScale;
        // boss phase 2
        if (e.hp < e.maxHp * 0.5 && !e.enraged) {
          e.enraged = true;
          e.shootInterval = Math.floor(e.shootInterval * 0.6);
          e.vx *= 1.5;
          e.color = e.bossType === 'beta' ? '#00aaff' : '#ff00aa';
          spawnFloatingText(e.x, e.y - 50, e.elite ? 'ELITE ENRAGED!' : 'ENRAGED!', e.elite ? '#ffaa00' : (e.bossType === 'beta' ? '#00aaff' : '#ff00aa'));
          shake = Math.max(shake, 10);
          const enrageAngle = Math.atan2(player.y - e.y, player.x - e.x);
          shakeDirX = Math.cos(enrageAngle);
          shakeDirY = Math.sin(enrageAngle);
          sfxHurt();
        }
      }
    } else if (e.type === 'swarmer') {
      const a = angleTo(e, player);
      e.vx += Math.cos(a) * 0.25 * timeScale;
      e.vy += Math.sin(a) * 0.25 * timeScale;
      const spd = Math.hypot(e.vx, e.vy);
      if (spd > e.speed) { e.vx = (e.vx / spd) * e.speed; e.vy = (e.vy / spd) * e.speed; }
      e.x += e.vx * timeScale;
      e.y += e.vy * timeScale;
    } else if (e.type === 'splitter') {
      e.vy += 0.03 * timeScale;
      if (e.vy > e.speed) e.vy = e.speed;
      e.x += Math.sin(e.phase * 0.02) * 0.6 * timeScale;
      e.y += e.vy * timeScale;
    } else if (e.type === 'bomber') {
      const a = angleTo(e, player);
      e.vx = Math.cos(a) * e.speed;
      e.vy = Math.sin(a) * e.speed;
      e.x += e.vx * timeScale;
      e.y += e.vy * timeScale;
    } else if (e.type === 'shielder') {
      e.vy += 0.015 * timeScale;
      if (e.vy > e.speed) e.vy = e.speed;
      e.x += Math.sin(e.phase * 0.015) * 0.5 * timeScale;
      e.y += e.vy * timeScale;
      // shield regen
      if (e.shield <= 0) {
        e.shieldRegenTimer -= timeScale;
        if (e.shieldRegenTimer <= 0) {
          e.shield = Math.min(e.maxShield, e.shield + 1);
          e.shieldRegenTimer = 30;
        }
      }
    } else if (e.type === 'medic') {
      e.vy += 0.012 * timeScale;
      if (e.vy > e.speed) e.vy = e.speed;
      e.x += Math.sin(e.phase * 0.01) * 0.4 * timeScale;
      e.y += e.vy * timeScale;
      // heal nearby enemies
      e.healTimer -= timeScale;
      if (e.healTimer <= 0) {
        e.healTimer = e.shootInterval;
        let healed = false;
        for (const other of enemies) {
          if (other === e || other.type === 'boss') continue;
          if (other.hp < other.maxHp && dist(e, other) < 80) {
            other.hp = Math.min(other.maxHp, other.hp + 5);
            healed = true;
            // heal particle
            particles.push({
              x: other.x, y: other.y,
              vx: rand(-1, 1), vy: rand(-2, -0.5),
              life: 20, maxLife: 20,
              color: '#44ff88', size: 2, decay: 0.92,
            });
          }
        }
        if (healed) {
          spawnFloatingText(e.x, e.y - 20, '+HEAL', '#44ff88');
        }
      }
    } else if (e.type === 'divider') {
      e.vy += 0.01 * timeScale;
      if (e.vy > e.speed) e.vy = e.speed;
      e.x += Math.sin(e.phase * 0.02 + e.splitCount) * 0.8 * timeScale;
      e.y += e.vy * timeScale;
    } else if (e.type === 'mine') {
      if (e.armTimer > 0) {
        e.armTimer -= timeScale;
        if (e.armTimer <= 0) e.armed = true;
      }
      if (e.armed) {
        const d = dist(e, player);
        if (d < 30) {
          // Explode
          mineExplode(e);
          enemies.splice(i, 1);
          continue;
        }
      }
    } else if (e.type === 'phantom') {
      // Phantom: fast hunter-like movement with phase in/out
      e.phantomTimer += timeScale;
      const cycle = e.phantomTimer % 270;
      e.phantomVisible = cycle < 180;
      const a = angleTo(e, player);
      e.vx += Math.cos(a) * 0.18 * timeScale;
      e.vy += Math.sin(a) * 0.18 * timeScale;
      const spd = Math.hypot(e.vx, e.vy);
      if (spd > e.speed) { e.vx = (e.vx / spd) * e.speed; e.vy = (e.vy / spd) * e.speed; }
      e.x += Math.sin(e.phase * 0.03) * 0.5 * timeScale;
      e.x += e.vx * timeScale;
      e.y += e.vy * timeScale;
      // phantom doesn't shoot while invisible
      if (!e.phantomVisible) e.shootTimer = Math.max(e.shootTimer, 10);
    }

    // bounds
    if (e.x < -50 || e.x > W + 50 || e.y < -50 || e.y > H + 50) {
      enemies.splice(i, 1);
      continue;
    }

    // shoot
    if (e.hitFlash > 0) e.hitFlash -= timeScale;
    e.shootTimer -= timeScale;
    if (e.shootTimer <= 0) {
      e.shootTimer = e.shootInterval;
      if (e.type === 'boss' && e.introTimer > 0) {
        // boss doesn't shoot during intro
      } else if (e.type === 'drone') {
        const a = angleTo(e, player);
        spawnBullet(e.x, e.y, a, 3.5, '#ff6666', true, 4);
      } else if (e.type === 'hunter') {
        const a = angleTo(e, player);
        spawnBullet(e.x, e.y, a, 4.5, '#ff44aa', true, 3);
        spawnBullet(e.x, e.y, a + 0.2, 4.0, '#ff44aa', true, 3);
        spawnBullet(e.x, e.y, a - 0.2, 4.0, '#ff44aa', true, 3);
      } else if (e.type === 'tank') {
        for (let k = 0; k < 5; k++) {
          const a = angleTo(e, player) + rand(-0.4, 0.4);
          spawnBullet(e.x, e.y, a, rand(2.5, 3.5), '#ffaa44', true, 5);
        }
      } else if (e.type === 'medic') {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();
      // white cross
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, -8, 6, 16);
      ctx.fillRect(-8, -3, 16, 6);
      // heal pulse ring
      if (e.healTimer <= 15) {
        const pulse = 1 - e.healTimer / 15;
        ctx.strokeStyle = `rgba(68, 255, 136, ${pulse * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius + 8 + pulse * 10, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (e.type === 'divider') {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();
      // inner pattern
      ctx.fillStyle = '#88aaff';
      ctx.beginPath();
      ctx.arc(0, 0, e.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
      // split count indicator
      if (e.splitCount > 0) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (e.type === 'sniper') {
        const a = angleTo(e, player);
        spawnBullet(e.x, e.y, a, 7, '#ff88ff', true, 3);
        e.aimTimer = 20;
      } else if (e.type === 'splitter') {
        const a = angleTo(e, player);
        for (let k = -1; k <= 1; k++) {
          spawnBullet(e.x, e.y, a + k * 0.25, 2.5, '#cc44ff', true, 4);
        }
      } else if (e.type === 'boss') {
        const mode = (Math.floor(e.phase / 180) % 3);
        const elite = e.elite;
        const isBeta = e.bossType === 'beta';
        if (mode === 0) {
          const base = e.phase * 0.08;
          const count = elite ? 8 : (isBeta ? 8 : 6);
          const spd = elite ? 3.6 : (isBeta ? 3.4 : 3);
          const col = elite ? '#ff8800' : (isBeta ? '#3366ff' : '#ff3333');
          for (let k = 0; k < count; k++) {
            const a = base + (Math.PI * 2 / count) * k;
            spawnBullet(e.x, e.y, a, spd, col, true, 5);
          }
        } else if (mode === 1) {
          const a = angleTo(e, player);
          const spread = elite ? 3 : (isBeta ? 4 : 2);
          const spd = elite ? 4.2 : (isBeta ? 4.0 : 3.5);
          const col = elite ? '#ffaa33' : (isBeta ? '#5588ff' : '#ff5533');
          for (let k = -spread; k <= spread; k++) {
            spawnBullet(e.x, e.y, a + k * 0.1, spd, col, true, 4);
          }
        } else {
          const count = elite ? 16 : (isBeta ? 18 : 12);
          const spd = elite ? 3.2 : (isBeta ? 3.0 : 2.5);
          const col = elite ? '#ffcc66' : (isBeta ? '#88aaff' : '#ff7777');
          const a0 = rand(0, Math.PI * 2);
          for (let k = 0; k < count; k++) {
            spawnBullet(e.x, e.y, a0 + (Math.PI * 2 / count) * k, spd, col, true, 4);
          }
        }
        e.shootTimer = e.shootInterval;
      }
      if (e.type !== 'boss') sfxEnemyShoot();
    }
  }
}

/* ---------- Bullet Logic ---------- */
function updateBullets(arr, timeScale = 1) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const b = arr[i];
    b.x += b.vx * timeScale;
    b.y += b.vy * timeScale;
    // homing tracking
    if (!b.isEnemy && b.homing) {
      let closest = null;
      let closestDist = Infinity;
      for (const e of enemies) {
        if (e.spawnDelay > 0) continue;
        const d = dist(b, e);
        if (d < closestDist) { closestDist = d; closest = e; }
      }
      if (closest && closestDist < 400) {
        const targetAngle = Math.atan2(closest.y - b.y, closest.x - b.x);
        const currentAngle = Math.atan2(b.vy, b.vx);
        let diff = targetAngle - currentAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const turn = Math.min(Math.abs(diff), b.homingTurn || 0.04) * Math.sign(diff);
        const newAngle = currentAngle + turn;
        const spd = Math.hypot(b.vx, b.vy);
        b.vx = Math.cos(newAngle) * spd;
        b.vy = Math.sin(newAngle) * spd;
      }
    }
    if (b.laser) {
      b.life -= timeScale;
      if (b.life <= 0) {
        arr.splice(i, 1);
        continue;
      }
    }
    // ricochet bounce
    if (!b.isEnemy && b.maxBounces > 0) {
      let bounced = false;
      if (b.x < b.radius) { b.x = b.radius; b.vx = Math.abs(b.vx); bounced = true; }
      else if (b.x > W - b.radius) { b.x = W - b.radius; b.vx = -Math.abs(b.vx); bounced = true; }
      if (b.y < b.radius) { b.y = b.radius; b.vy = Math.abs(b.vy); bounced = true; }
      else if (b.y > H - b.radius) { b.y = H - b.radius; b.vy = -Math.abs(b.vy); bounced = true; }
      if (bounced) {
        b.bounces--;
        spawnHitSparks(b.x, b.y, '#ffcc66');
        if (b.bounces < 0) {
          arr.splice(i, 1);
          continue;
        }
      }
    }
    if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) {
      arr.splice(i, 1);
    }
  }
}

/* ---------- Power-up Logic ---------- */
function updatePowerups(timeScale = 1) {
  if (magnetTimer > 0) magnetTimer -= timeScale;
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    // magnet attraction
    if (magnetTimer > 0) {
      const d = dist(p, player);
      if (d > 20 && d < 250) {
        const a = angleTo(p, player);
        const pull = 3.5 * (1 - d / 250);
        p.vx += Math.cos(a) * pull * 0.1;
        p.vy += Math.sin(a) * pull * 0.1;
        p.vx *= 0.92;
        p.vy *= 0.92;
      }
    }
    p.x += p.vx * timeScale;
    p.y += p.vy * timeScale;
    p.angle += 0.04 * timeScale;
    p.life -= timeScale;

    if (p.life <= 0 || p.y > H + 30) {
      powerups.splice(i, 1);
      continue;
    }

    const pickupDist = p.radius + player.radius + 6;
    const d = dist(p, player);
    if (d < pickupDist) {
      // Fly toward player before collecting
      if (d > 5) {
        const a = angleTo(p, player);
        p.vx += Math.cos(a) * 2;
        p.vy += Math.sin(a) * 2;
        p.vx *= 0.8;
        p.vy *= 0.8;
      } else {
        // Collected
        if (p.type === 'energy') {
          player.hp = clamp(player.hp + 20, 0, player.maxHp);
          spawnFloatingText(player.x, player.y - 20, '+HP', '#44ff66');
          sfxPickupEnergy();
        } else if (p.type === 'power') {
          player.powerLevel = clamp(player.powerLevel + 1, 1, player.maxPower);
          spawnFloatingText(player.x, player.y - 20, 'POWER UP!', '#ffcc44');
          sfxUpgrade();
        } else if (p.type === 'shield') {
          player.invincible = Math.max(player.invincible, 300);
          spawnFloatingText(player.x, player.y - 20, 'SHIELD!', '#44aaff');
          sfxPickupShield();
        } else if (p.type === 'timestop') {
          timeStopTimer = 180;
          spawnFloatingText(player.x, player.y - 20, 'TIME STOP!', '#ff88ff');
          sfxPickupTimestop();
        } else if (p.type === 'magnet') {
          magnetTimer = 300;
          spawnFloatingText(player.x, player.y - 20, 'MAGNET!', '#ffaa44');
          sfxPickupMagnet();
          unlockAchievement('magnetic_personality');
        } else if (p.type === 'overdrive') {
          overdriveTimer = 300;
          spawnFloatingText(player.x, player.y - 20, 'OVERDRIVE!', '#ff4444');
          sfxPickupOverdrive();
        } else if (p.type === 'score') {
          scoreMultTimer = 600;
          scoreMultBonus += 0.5;
          spawnFloatingText(player.x, player.y - 20, 'SCORE x1.5!', '#ffee44');
          sfxPickupScore();
        }
        powerups.splice(i, 1);
      }
    }
  }
}

/* ---------- Collision ---------- */
function checkCollisions() {
  // player bullets vs enemies
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (e.spawnDelay > 0) continue;
      if (e.type === 'phantom' && !e.phantomVisible) continue;
      if (dist(b, e) < e.radius + b.radius) {
        if (b.laser && b.hitTimer > 0) continue;
        if (!b.laser) bullets.splice(i, 1);
        // explosive AOE
        let explosiveKillsThisHit = 0;
        if (b.explosive) {
          const aoeRadius = 60 + pl * 5;
          const aoeDmg = dmg * 0.5;
          spawnExplosion(e.x, e.y, '#ff6633', aoeRadius * 0.4, true);
          for (const other of enemies) {
            if (other === e || other.spawnDelay > 0) continue;
            if (dist({x: e.x, y: e.y}, other) < aoeRadius + other.radius) {
              other.hp -= aoeDmg;
              other.hitFlash = 3;
              spawnFloatingText(other.x, other.y - other.radius - 5, Math.floor(aoeDmg), '#ff8844');
              if (other.hp <= 0) explosiveKillsThisHit++;
            }
          }
        }
        if (b.laser) {
          b.hitTimer = 4;
          b.hitCount = (b.hitCount || 0) + 1;
          if (b.hitCount >= 3) unlockAchievement('piercing_shot');
        }
        const profLevel = Math.min(5, Math.floor((stats.weaponUses[weaponType] || 0) / 50));
        const profMult = 1 + profLevel * 0.02;
        let dmg = (b.laser ? (b.damage || 10) : (5 + player.powerLevel)) * damageMult * profMult;
        if (e.shield > 0) {
          e.shield -= dmg;
          e.shieldRegenTimer = 90; // pause regen for 1.5s after hit
          if (e.shield <= 0) {
            spawnFloatingText(e.x, e.y - e.radius - 8, 'SHIELD BREAK!', '#44ddaa');
            sfxExplosion();
          }
        } else {
          e.hp -= dmg;
        }
        // divider split logic
        if (e.type === 'divider' && e.splitCount < e.maxSplits && e.hp > 0 && Math.random() < 0.25) {
          splitDivider(e);
          enemies.splice(j, 1);
          continue;
        }
        // knockback scaled by enemy type and damage
        const kbAngle = Math.atan2(b.vy, b.vx);
        let kbMult = 1.0;
        if (e.type === 'swarmer' || e.type === 'bomber') kbMult = 1.3;
        else if (e.type === 'tank' || e.type === 'shielder' || e.type === 'divider') kbMult = 0.4;
        else if (e.type === 'boss') kbMult = 0.15;
        const kbForce = (0.5 + dmg * 0.06) * kbMult;
        e.vx += Math.cos(kbAngle) * kbForce;
        e.vy += Math.sin(kbAngle) * kbForce;
        spawnDamageNumber(e.x, e.y - e.radius - 5, dmg);
        spawnHitSparks(b.x, b.y, e.color);
        e.hitFlash = 4;
        const shakeAmt = dmg >= 20 ? 10 : dmg >= 10 ? 6 : dmg >= 5 ? 4 : 2;
        shake = Math.max(shake, shakeAmt);
        const bAngle = Math.atan2(b.vy, b.vx);
        shakeDirX = Math.cos(bAngle);
        shakeDirY = Math.sin(bAngle);
        hitstop = 3;
        if (e.hp <= 0) {
          const pts = Math.floor(e.score * (1 + combo * 0.1));
          score += Math.floor(pts * scoreMultBonus);
          combo++;
          sfxComboChime(combo);
          comboTimer = 180;
          comboFlash = 15;
          comboFlashColor = combo >= 30 ? '#ffcc44' : combo >= 16 ? '#ff4444' : combo >= 6 ? '#ff8844' : '#ffffff';
          if (combo === 10 || combo === 25 || combo === 50 || combo === 100) {
            spawnFloatingText(W / 2, H / 2 - 40, `COMBO x${combo}!`, '#ff44ff');
            sfxComboMilestone(combo);
            shake = Math.max(shake, 6);
            shakeDirX = 0;
            shakeDirY = -1;
            const milestoneCount = particleDensity === 0 ? 12 : particleDensity === 1 ? 20 : 30;
            for (let k = 0; k < milestoneCount; k++) {
              const a = rand(0, Math.PI * 2);
              const s = rand(2, 6);
              particles.push({
                x: W / 2, y: H / 2 - 40,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                life: rand(30, 60),
                maxLife: 60,
                color: '#ff88ff',
                size: rand(2, 4),
                decay: 0.95,
              });
            }
            // combo milestone rewards
            if (combo === 25) {
              player.hp = Math.min(player.maxHp, player.hp + 1);
              spawnFloatingText(player.x, player.y - 40, '+1 HP', '#44ff88');
            }
            if (combo === 50) {
              player.hp = Math.min(player.maxHp, player.hp + 2);
              player.bombs = Math.min(5, player.bombs + 1);
              spawnFloatingText(player.x, player.y - 40, '+2 HP + BOMB', '#44ff88');
              sfxPowerup();
            }
            if (combo === 25) unlockAchievement('combo_25');
            if (combo === 50) unlockAchievement('combo_50');
            if (combo === 100) {
              unlockAchievement('combo_100');
              player.hp = player.maxHp;
              player.bombs = Math.min(5, player.bombs + 2);
              spawnFloatingText(player.x, player.y - 50, 'MAX HP + 2 BOMBS!', '#ffee44');
              shake = Math.max(shake, 12);
              shakeDirX = 0;
              shakeDirY = -1;
              sfxPowerup();
              // combo burst: clear bullets and damage all enemies
              spawnFloatingText(W / 2, H / 2 + 50, 'COMBO BURST!', '#ffee44');
              comboBurstFlash = 30;
              comboBurstsTriggered++;
              if (comboBurstsTriggered >= 3) unlockAchievement('combo_burst_master');
              for (const b of enemyBullets) {
                spawnExplosion(b.x, b.y, '#ffee88', 3);
              }
              enemyBullets.length = 0;
              for (const e of enemies) {
                if (e.type === 'boss') continue;
                e.hp -= 25;
                e.hitFlash = 6;
                spawnHitSparks(e.x, e.y, '#ffee44');
              }
              slowMo = 30;
            }
          }
          spawnExplosion(e.x, e.y, e.color, 20, true);
          if (e.type === 'mine') mineExplode(e);
          if (e.elite) {
            spawnFloatingText(e.x, e.y - 15, 'ELITE!', '#ffee88');
            scoreMultBonus += 0.1;
            scoreMultTimer = 300; // 5 seconds
            spawnFloatingText(W / 2, H / 2 - 80, 'ELITE KILL BONUS! +0.1x SCORE', '#ffee44');
            sfxEliteKill();
          }
          spawnFloatingText(e.x, e.y, `+${pts}`, '#ffcc44');
          sfxEnemyDeath(e.type);
          if (weaponType === 'explosive') {
            // Extra explosive impact sound
            playTone(100, 'sawtooth', 0.1, 0.04);
            playTone(60, 'square', 0.15, 0.03);
          }
          // explosive multi-kill tracking
          if (b.explosive && explosiveKillsThisHit > 0) {
            const totalKills = explosiveKillsThisHit + 1; // +1 for primary target
            if (totalKills > explosiveBestMultiKill) explosiveBestMultiKill = totalKills;
            if (totalKills >= 3) unlockAchievement('demolition_expert');
            if (totalKills >= 5) unlockAchievement('chain_reaction');
          }
          // drop powerup chance
          if (Math.random() < 0.12) spawnPowerup(e.x, e.y);
          unlockAchievement('first_blood');
          if (e.type === 'boss') {
            unlockAchievement('boss_slayer');
            if (e.elite) unlockAchievement('elite_slayer');
            stats.bossesDefeated++;
            bossesDefeatedThisRun++;
            if (stats.bossesDefeated >= 5) unlockAchievement('boss_hunter');
            // boss defeat spectacle
            spawnExplosion(e.x, e.y, e.color, 40, true);
            spawnExplosion(e.x, e.y, '#ffee88', 25, true);
            spawnFloatingText(W / 2, H / 2 - 60, 'BOSS DEFEATED!', '#ffee44');
            shake = Math.max(shake, 20);
            const bossDefeatAngle = Math.atan2(player.y - e.y, player.x - e.x);
            shakeDirX = Math.cos(bossDefeatAngle);
            shakeDirY = Math.sin(bossDefeatAngle);
            damageFlash = 10;
            sfxBossDefeat();
            sfxEnemyDeath('boss');
          }
          if (e.type === 'splitter') {
            splitEnemy(e.x, e.y, e.elite);
            unlockAchievement('splitter_down');
          }
          if (e.type === 'bomber') {
            bomberExplode(e);
            unlockAchievement('bomber_down');
          }
          if (e.type === 'shielder') unlockAchievement('shield_breaker');
          if (e.type === 'medic') unlockAchievement('medic_down');
          if (e.type === 'divider') unlockAchievement('divider_down');
          if (e.type === 'phantom') {
            unlockAchievement('phantom_slayer');
            phantomKills++;
            if (phantomKills >= 10) unlockAchievement('phantom_hunter');
          }
          if (b.maxBounces > 0 && b.bounces < b.maxBounces) unlockAchievement('ricochet_king');
          if (weaponType === 'homing') {
            homingKills++;
            if (homingKills >= 100) unlockAchievement('homing_ace');
          }
          if (weaponType === 'explosive') {
            explosiveKills++;
            if (explosiveKills >= 50) unlockAchievement('explosive_destroyer');
          }
          if (overdriveTimer > 0) {
            overdriveKills++;
            if (overdriveKills >= 30) unlockAchievement('overdrive_killer');
          }
          enemyKillsLog[e.type] = (enemyKillsLog[e.type] || 0) + 1;
          stats.kills++;
          if (stats.kills >= 100) unlockAchievement('century');
          if ([50, 100, 200, 500].includes(stats.kills)) {
            spawnFloatingText(W / 2, H / 2 - 60, `KILL MILESTONE: ${stats.kills}!`, '#ffee44');
            shake = Math.max(shake, 8);
            sfxMilestone();
            // kill milestone particle burst
            const kmCount = particleDensity === 0 ? 15 : particleDensity === 1 ? 25 : 40;
            for (let k = 0; k < kmCount; k++) {
              const angle = rand(0, Math.PI * 2);
              const speed = rand(2, 7);
              particles.push({
                x: W / 2, y: H / 2 - 60,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: rand(30, 70),
                maxLife: 70,
                color: '#ffee44',
                size: rand(2, 5),
                decay: 0.95,
              });
            }
          }
          enemies.splice(j, 1);
        } else {
          sfxHit();
        }
        break;
      }
    }
  }

  // graze (near miss)
  if (player.invincible <= 0) {
    for (const b of enemyBullets) {
      const d = dist(b, player);
      if (d < player.grazeRadius && d > player.radius + b.radius) {
        if (!b.grazed) {
          b.grazed = true;
          grazeCount++;
          grazeTimer = 10;
          score += 5;
          if (grazeCount % 10 === 0) {
            spawnFloatingText(player.x, player.y - 25, `GRAZE x${grazeCount}`, '#ff88ff');
            sfxGrazeMilestone(grazeCount);
          } else {
            sfxGraze();
          }
        }
      }
    }
  }

  // enemy bullets vs player
  if (player.invincible <= 0) {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const b = enemyBullets[i];
      if (dist(b, player) < player.radius + b.radius - 2) {
        enemyBullets.splice(i, 1);
        player.hp -= practiceMode ? 0 : 10;
        combo = Math.max(0, combo - 2);
        comboTimer = 0;
        player.invincible = 90;
        shake = 12;
        const bAngle2 = Math.atan2(player.y - b.y, player.x - b.x);
        shakeDirX = Math.cos(bAngle2);
        shakeDirY = Math.sin(bAngle2);
        damageFlash = 15;
        damageTakenThisWave = true;
        spawnExplosion(player.x, player.y, '#44aaff', 16);
        spawnPlayerHitParticles();
        sfxHurt();
        if (player.hp <= 0) {
          if (combo >= 10 && comboGuard) {
            comboGuard = false;
            player.hp = 1;
            combo = 0;
            comboTimer = 0;
            player.invincible = 120;
            spawnFloatingText(player.x, player.y - 30, 'COMBO GUARD!', '#ff44ff');
            comboGuardFlash = 60;
            sfxPowerup();
          } else {
            player.hp = 0;
            playerDeathEffect();
            state = STATE.GAMEOVER;
            if (engineGainNode && audioCtx) engineGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
            checkHighScore();
            stats.totalGraze += grazeCount;
            updateStats(true);
            showGameOver();
          }
        }
      }
    }
  }

function playerDeathEffect() {
  deathSlowMo = 90;
  shake = 25;
  shakeDirX = 0;
  shakeDirY = 0;
  damageFlash = 30;
  // Chain explosions
  const colors = ['#ff4444', '#ff8844', '#ffcc44', '#ffffff'];
  for (let k = 0; k < 5; k++) {
    const ox = player.x + rand(-20, 20);
    const oy = player.y + rand(-20, 20);
    spawnExplosion(ox, oy, colors[k % colors.length], 20 + k * 3);
  }
  // Energy shards
  const shardCount = particleDensity === 0 ? 30 : particleDensity === 1 ? 50 : 70;
  for (let k = 0; k < shardCount; k++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(3, 8);
    particles.push({
      x: player.x, y: player.y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: rand(40, 90),
      maxLife: 90,
      color: k % 3 === 0 ? '#ffffff' : (k % 3 === 1 ? '#ff8844' : '#ff4444'),
      size: rand(2, 5),
      decay: 0.95,
    });
  }
  // Shockwave
  shockwaves.push({ x: player.x, y: player.y, radius: 5, maxRadius: 120, life: 40, color: '#ff8844' });
  sfxExplosion();
}

  // enemies vs player (collision)
  if (player.invincible <= 0) {
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (e.spawnDelay > 0) continue;
      if (dist(e, player) < e.radius + player.radius) {
        player.hp -= practiceMode ? 0 : 15;
        combo = Math.max(0, combo - 3);
        comboTimer = 0;
        player.invincible = 90;
        shake = 14;
        const eAngle = Math.atan2(player.y - e.y, player.x - e.x);
        shakeDirX = Math.cos(eAngle);
        shakeDirY = Math.sin(eAngle);
        damageFlash = 15;
        damageTakenThisWave = true;
        spawnPlayerHitParticles();
        e.hp -= 20;
        spawnExplosion((player.x + e.x) / 2, (player.y + e.y) / 2, '#ff4444', 18);
        sfxHurt();
        if (e.hp <= 0) {
          spawnExplosion(e.x, e.y, e.color, 20);
          if (e.type === 'splitter') splitEnemy(e.x, e.y, e.elite);
          if (e.type === 'bomber') bomberExplode(e);
          enemies.splice(j, 1);
        }
        if (player.hp <= 0) {
          if (combo >= 10 && comboGuard) {
            comboGuard = false;
            player.hp = 1;
            combo = 0;
            comboTimer = 0;
            player.invincible = 120;
            spawnFloatingText(player.x, player.y - 30, 'COMBO GUARD!', '#ff44ff');
            comboGuardFlash = 60;
            sfxPowerup();
          } else {
            player.hp = 0;
            playerDeathEffect();
            state = STATE.GAMEOVER;
            if (engineGainNode && audioCtx) engineGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
            checkHighScore();
            stats.totalGraze += grazeCount;
            updateStats(true);
            showGameOver();
          }
        }
      }
    }
  }
}

/* ---------- Particles & Texts ---------- */
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= p.decay;
    p.vy *= p.decay;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (let i = texts.length - 1; i >= 0; i--) {
    const t = texts[i];
    t.y += t.vy;
    t.vy *= 0.92; // air resistance
    t.life--;
    if (t.life <= 0) texts.splice(i, 1);
  }
}

/* ---------- Rendering ---------- */
function drawStars() {
  for (const s of stars) {
    ctx.globalAlpha = s.alpha;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
    s.y += s.speed;
    if (s.y > H) { s.y = 0; s.x = rand(0, W); }
  }
  ctx.globalAlpha = 1;
}

function drawNebulae() {
  for (const n of nebulae) {
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
    g.addColorStop(0, `rgba(${n.color.r},${n.color.g},${n.color.b},${n.alpha})`);
    g.addColorStop(1, `rgba(${n.color.r},${n.color.g},${n.color.b},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
    ctx.fill();
    n.y += n.speed;
    if (n.y > H + n.radius) { n.y = -n.radius; n.x = rand(0, W); }
  }
}
function updatePlanets(timeScale = 1) {
  for (const p of planets) {
    p.x += p.vx * timeScale;
    p.y += p.vy * timeScale;
    if (p.x < -p.radius * 2) p.x = W + p.radius * 2;
    if (p.x > W + p.radius * 2) p.x = -p.radius * 2;
    if (p.y < -p.radius * 2) p.y = H + p.radius * 2;
    if (p.y > H + p.radius * 2) p.y = -p.radius * 2;
  }
}
function drawPlanets() {
  for (const p of planets) {
    ctx.save();
    ctx.globalAlpha = 0.12;
    // planet body
    const g = ctx.createRadialGradient(p.x - p.radius * 0.2, p.y - p.radius * 0.2, 0, p.x, p.y, p.radius);
    g.addColorStop(0, p.color.highlight);
    g.addColorStop(0.6, p.color.base);
    g.addColorStop(1, p.color.shadow);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    // stripes
    for (const s of p.stripes) {
      ctx.fillStyle = `rgba(0,0,0,${s.alpha})`;
      ctx.fillRect(p.x - p.radius, p.y + s.yOffset - s.height / 2, p.radius * 2, s.height);
    }
    // craters
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#000';
    for (let c = 0; c < p.craters; c++) {
      const ca = (c / p.craters) * Math.PI * 2 + p.radius * 0.1;
      const cr = p.radius * 0.5 + Math.sin(ca * 3) * p.radius * 0.2;
      ctx.beginPath();
      ctx.arc(p.x + Math.cos(ca) * cr, p.y + Math.sin(ca) * cr, rand(8, 18), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
function updateAsteroids(timeScale = 1) {
  for (const a of asteroids) {
    a.x += a.vx * timeScale;
    a.y += a.vy * timeScale;
    a.rotation += a.rotSpeed * timeScale;
    if (a.x < -a.radius * 2) a.x = W + a.radius * 2;
    if (a.x > W + a.radius * 2) a.x = -a.radius * 2;
    if (a.y < -a.radius * 2) a.y = H + a.radius * 2;
    if (a.y > H + a.radius * 2) a.y = -a.radius * 2;
  }
}
function drawAsteroids() {
  for (const a of asteroids) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rotation);
    ctx.fillStyle = a.color;
    ctx.strokeStyle = a.color.slice(0, a.color.lastIndexOf(',')) + ',0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(a.points[0].x, a.points[0].y);
    for (let i = 1; i < a.points.length; i++) {
      ctx.lineTo(a.points[i].x, a.points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function updateMeteors(timeScale = 1) {
  if (meteorTimer <= 0 && Math.random() < 0.008) {
    meteorTimer = rand(300, 600);
    const side = Math.floor(rand(0, 2));
    let mx, my, mvx, mvy;
    if (side === 0) {
      mx = rand(0, W); my = -10;
      mvx = rand(-0.5, 0.5); mvy = rand(3, 6);
    } else {
      mx = -10; my = rand(0, H * 0.5);
      mvx = rand(3, 6); mvy = rand(0.5, 2);
    }
    meteors.push({ x: mx, y: my, vx: mvx, vy: mvy, life: rand(40, 70), maxLife: 70, size: rand(1.5, 3.5) });
  }
  if (meteorTimer > 0) meteorTimer -= timeScale;
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.x += m.vx * timeScale;
    m.y += m.vy * timeScale;
    m.life -= timeScale;
    if (m.life <= 0 || m.x > W + 20 || m.y > H + 20) meteors.splice(i, 1);
  }
}

function drawMeteors() {
  for (const m of meteors) {
    const alpha = m.life / m.maxLife;
    const trailLen = Math.min(40, Math.hypot(m.vx, m.vy) * 6);
    const tx = m.x - (m.vx / Math.hypot(m.vx, m.vy || 1)) * trailLen;
    const ty = m.y - (m.vy / Math.hypot(m.vx, m.vy || 1)) * trailLen;
    ctx.save();
    ctx.globalAlpha = alpha * 0.6;
    ctx.strokeStyle = '#aaddff';
    ctx.lineWidth = m.size;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(m.x, m.y);
    ctx.stroke();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.size * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawPlayer() {
  const theme = THEMES[colorTheme];
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle + Math.PI / 2);

  const flash = player.invincible > 0 && Math.floor(player.invincible / 3) % 2 === 0;
  ctx.globalAlpha = flash ? 0.25 : 1;

  // shield ring
  if (player.invincible > 120) {
    ctx.strokeStyle = `rgba(68,170,255,${0.3 + Math.sin(Date.now() * 0.01) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  // overdrive aura
  if (overdriveTimer > 0) {
    const odPulse = 0.4 + 0.3 * Math.sin(Date.now() * 0.008);
    ctx.strokeStyle = `rgba(255, 68, 68, ${odPulse})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(255, 68, 68, ${odPulse * 0.2})`;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // glow
  ctx.shadowBlur = 15;
  ctx.shadowColor = theme.glow;

  // invincibility outline
  if (player.invincible > 0 && !flash) {
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(-12, 14);
    ctx.lineTo(0, 10);
    ctx.lineTo(12, 14);
    ctx.closePath();
    ctx.stroke();
  }

  // ship body
  ctx.fillStyle = theme.player;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(-10, 12);
  ctx.lineTo(0, 8);
  ctx.lineTo(10, 12);
  ctx.closePath();
  ctx.fill();

  // engine
  ctx.fillStyle = theme.engine;
  ctx.beginPath();
  ctx.moveTo(-6, 10);
  ctx.lineTo(0, 20 + Math.random() * 6);
  ctx.lineTo(6, 10);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawEnemies() {
  for (const e of enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);

    if (e.spawnDelay > 0) {
      const progress = 1 - (e.spawnDelay / 30);
      const pulse = 0.8 + 0.2 * Math.sin(Date.now() * 0.01);
      const r = e.radius * (0.5 + progress * 0.5) * pulse;
      // Portal ring
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6 + progress * 0.4;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      // Inner rotating arc
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.7, Date.now() * 0.005, Date.now() * 0.005 + Math.PI);
      ctx.stroke();
      // Glow dots
      for (let k = 0; k < 4; k++) {
        const a = Date.now() * 0.003 + k * (Math.PI / 2);
        ctx.fillStyle = e.color;
        ctx.globalAlpha = 0.5 + progress * 0.5;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      continue;
    }

    ctx.shadowBlur = 10;
    ctx.shadowColor = e.color;

    // Low HP flash effect
    const hpPct = e.hp / e.maxHp;
    if (hpPct < 0.3 && hpPct > 0) {
      const urgency = 1 - hpPct / 0.3; // 0→1 as HP drops
      const flashSpeed = 60 + (1 - urgency) * 100;
      const pulse = Math.sin(Date.now() / flashSpeed);
      const flashAlpha = 0.1 + 0.2 * (pulse > 0 ? 1 : 0.3);
      const pulseScale = 1 + urgency * 0.15 * pulse;
      ctx.save();
      ctx.scale(pulseScale, pulseScale);
      ctx.fillStyle = `rgba(255, 0, 0, ${flashAlpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius * 1.4, 0, Math.PI * 2);
      ctx.fill();
      // Red glow ring
      ctx.strokeStyle = `rgba(255, 40, 40, ${0.3 + 0.3 * pulse})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 8 * urgency;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius * 1.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // HP bar for bosses and elite enemies
    if (e.type === 'boss' || e.elite) {
      const barW = e.radius * 2.2;
      const barH = 3;
      const barY = -e.radius - 8;
      const hpPct = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-barW / 2, barY, barW, barH);
      const hpColor = hpPct > 0.6 ? '#44ff88' : hpPct > 0.3 ? '#ffcc44' : '#ff4444';
      ctx.fillStyle = hpColor;
      ctx.fillRect(-barW / 2, barY, barW * hpPct, barH);
    }

    if (e.type === 'drone') {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(-10, -8);
      ctx.lineTo(0, -4);
      ctx.lineTo(10, -8);
      ctx.closePath();
      ctx.fill();
    } else if (e.type === 'hunter') {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.lineTo(-12, -10);
      ctx.lineTo(0, -6);
      ctx.lineTo(12, -10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ff88cc';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === 'tank') {
      ctx.fillStyle = e.color;
      ctx.fillRect(-16, -12, 32, 24);
      ctx.fillStyle = '#ffcc66';
      ctx.fillRect(-8, -18, 16, 6);
    } else if (e.type === 'boss') {
      ctx.fillStyle = e.color;
      if (e.bossType === 'beta') {
        // Beta boss: sharper, more angular shape
        ctx.beginPath();
        ctx.moveTo(0, 34);
        ctx.lineTo(-26, -6);
        ctx.lineTo(-20, -28);
        ctx.lineTo(0, -20);
        ctx.lineTo(20, -28);
        ctx.lineTo(26, -6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = e.elite ? '#ffee88' : '#66aaff';
        ctx.beginPath();
        ctx.arc(0, 0, e.elite ? 14 : 10, 0, Math.PI * 2);
        ctx.fill();
        // side fins
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(-20, -6);
        ctx.lineTo(-32, 4);
        ctx.lineTo(-22, 10);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(20, -6);
        ctx.lineTo(32, 4);
        ctx.lineTo(22, 10);
        ctx.closePath();
        ctx.fill();
      } else {
        // Alpha boss: original shape
        ctx.beginPath();
        ctx.moveTo(0, 30);
        ctx.lineTo(-28, -10);
        ctx.lineTo(-16, -24);
        ctx.lineTo(0, -16);
        ctx.lineTo(16, -24);
        ctx.lineTo(28, -10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = e.elite ? '#ffee88' : '#ffaa00';
        ctx.beginPath();
        ctx.arc(0, 0, e.elite ? 14 : 10, 0, Math.PI * 2);
        ctx.fill();
      }
      // elite crown
      if (e.elite) {
        ctx.fillStyle = '#ffee88';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('👑', 0, -e.radius - 10);
      }
    } else if (e.type === 'swarmer') {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(-5, 4);
      ctx.lineTo(0, 2);
      ctx.lineTo(5, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === 'splitter') {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(-12, 0);
      ctx.lineTo(-8, 10);
      ctx.lineTo(0, 6);
      ctx.lineTo(8, 10);
      ctx.lineTo(12, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffccff';
      ctx.beginPath();
      ctx.arc(0, -2, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === 'bomber') {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(-8, 4);
      ctx.lineTo(0, 10);
      ctx.lineTo(8, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffaa66';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      // blink warning
      if (Math.floor(e.phase / 10) % 2 === 0) {
        ctx.strokeStyle = '#ff3300';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (e.type === 'shielder') {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#88ffcc';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      // shield ring
      if (e.shield > 0) {
        const shieldPct = e.shield / e.maxShield;
        ctx.strokeStyle = `rgba(68, 221, 170, ${0.3 + shieldPct * 0.7})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#44ddaa';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🛡', 0, -e.radius - 10);
      }
    } else if (e.type === 'sniper') {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(-8, 0);
      ctx.lineTo(0, 10);
      ctx.lineTo(8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffccff';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      // aim line
      if (e.aimTimer > 0) {
        const a = angleTo(e, player);
        ctx.strokeStyle = `rgba(255,136,255,${e.aimTimer / 20})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * 120, Math.sin(a) * 120);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else if (e.type === 'mine') {
      const armPulse = e.armed ? 0.5 + 0.5 * Math.sin(Date.now() * 0.01) : 0.3;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();
      // Inner glow
      ctx.fillStyle = `rgba(255, 100, 100, ${armPulse})`;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
      // Spikes
      for (let k = 0; k < 8; k++) {
        const a = k * (Math.PI / 4);
        const spikeLen = e.radius * (0.3 + armPulse * 0.3);
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * e.radius * 0.7, Math.sin(a) * e.radius * 0.7);
        ctx.lineTo(Math.cos(a) * (e.radius + spikeLen), Math.sin(a) * (e.radius + spikeLen));
        ctx.stroke();
      }
      // Warning ring when player is close
      if (e.armed) {
        const d = dist(e, player);
        if (d < 60) {
          const warnAlpha = (1 - d / 60) * 0.4;
          ctx.strokeStyle = `rgba(255, 68, 68, ${warnAlpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, e.radius + 10 + (1 - d / 60) * 8, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    } else if (e.type === 'phantom') {
      const vis = e.phantomVisible ? 1 : 0.15;
      ctx.globalAlpha = vis;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();
      // Phase ring
      const phasePulse = 0.5 + 0.5 * Math.sin(e.phase * 0.1);
      ctx.strokeStyle = `rgba(170, 102, 255, ${0.4 * phasePulse * vis})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius + 4 + phasePulse * 4, 0, Math.PI * 2);
      ctx.stroke();
      // Ghost trail effect
      if (e.phantomVisible) {
        ctx.fillStyle = `rgba(170, 102, 255, ${0.2 * phasePulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // elite glow
    if (e.elite) {
      ctx.strokeStyle = '#ffee88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffee88';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★', 0, -e.radius - 8);
    }

    // hp bar
    if (e.hp < e.maxHp) {
      const bw = e.type === 'boss' ? 60 : 30;
      const bh = 3;
      const pct = e.hp / e.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-bw / 2, -e.radius - 10, bw, bh);
      ctx.fillStyle = pct > 0.5 ? '#44ff66' : pct > 0.25 ? '#ffcc44' : '#ff4444';
      ctx.fillRect(-bw / 2, -e.radius - 10, bw * pct, bh);
    }

    // hit flash
    if (e.hitFlash > 0) {
      ctx.globalAlpha = e.hitFlash / 4 * 0.6;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, e.radius + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // elite aura
    if (e.elite) {
      const auraPulse = 1 + 0.15 * Math.sin(Date.now() * 0.004 + e.x * 0.01);
      const auraR = (e.radius + 8) * auraPulse;
      ctx.strokeStyle = 'rgba(255, 238, 136, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, auraR, 0, Math.PI * 2);
      ctx.stroke();
      // Rotating triangle markers
      const triCount = 3;
      ctx.fillStyle = 'rgba(255, 238, 136, 0.5)';
      for (let t = 0; t < triCount; t++) {
        const ta = Date.now() * 0.002 + t * (Math.PI * 2 / triCount);
        const tx = Math.cos(ta) * auraR;
        const ty = Math.sin(ta) * auraR;
        ctx.beginPath();
        ctx.arc(tx, ty, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

function drawBullets(arr) {
  for (const b of arr) {
    ctx.save();
    if (!b.isEnemy && b.homing) {
      const angle = Math.atan2(b.vy, b.vx);
      ctx.translate(b.x, b.y);
      ctx.rotate(angle + Math.PI / 2);
      ctx.shadowBlur = 8;
      ctx.shadowColor = b.color;
      // Rocket body
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(-3, 4);
      ctx.lineTo(0, 2);
      ctx.lineTo(3, 4);
      ctx.closePath();
      ctx.fill();
      // White tip
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(-1.5, -2);
      ctx.lineTo(1.5, -2);
      ctx.closePath();
      ctx.fill();
      // Engine glow
      ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.02) * 0.3;
      ctx.fillStyle = '#ff88cc';
      ctx.beginPath();
      ctx.arc(0, 5, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      continue;
    }
    if (b.laser) {
      // laser beam effect
      const lifePct = b.life / b.maxLife;
      const beamLen = 30;
      const bx = b.x - (b.vx / Math.hypot(b.vx, b.vy || 1)) * beamLen;
      const by = b.y - (b.vy / Math.hypot(b.vx, b.vy || 1)) * beamLen;
      ctx.shadowBlur = 12;
      ctx.shadowColor = b.color;
      ctx.globalAlpha = lifePct * 0.8;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.radius * 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(bx, by);
      ctx.stroke();
      // bright core
      ctx.globalAlpha = lifePct;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = b.radius * 0.8;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(bx, by);
      ctx.stroke();
    } else {
      ctx.shadowBlur = 6;
      ctx.shadowColor = b.color;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      // trail
      const trailLen = Math.min(18, Math.hypot(b.vx, b.vy) * 2.5);
      const tx = b.x - (b.vx / Math.hypot(b.vx, b.vy || 1)) * trailLen;
      const ty = b.y - (b.vy / Math.hypot(b.vx, b.vy || 1)) * trailLen;
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.radius * 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      // ricochet bounce dots
      if (b.maxBounces > 0 && b.bounces >= 0) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#ffffff';
        const dots = b.bounces + 1;
        for (let d = 0; d < dots; d++) {
          const dx = Math.cos(b.phase || 0 + d * 2) * (b.radius + 3);
          const dy = Math.sin(b.phase || 0 + d * 2) * (b.radius + 3);
          ctx.beginPath();
          ctx.arc(b.x + dx, b.y + dy, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }
}

function drawPowerups() {
  for (const p of powerups) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.shadowBlur = 10;
    let color = '#44ff66';
    let label = '+';
    if (p.type === 'power') { color = '#ffcc44'; label = 'P'; }
    if (p.type === 'shield') { color = '#44aaff'; label = 'S'; }
    if (p.type === 'timestop') { color = '#ff88ff'; label = 'T'; }
    if (p.type === 'magnet') { color = '#ffaa44'; label = 'M'; }
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(8, -3);
    ctx.lineTo(5, 9);
    ctx.lineTo(-5, 9);
    ctx.lineTo(-8, -3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 1);
    ctx.restore();
  }
}

function drawTouchControls() {
  if (!('ontouchstart' in window)) return;
  ctx.save();
  ctx.globalAlpha = 0.15;
  // shoot button area hint
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(W - 60, H - 60, 35, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W - 140, H - 60, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#000';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FIRE', W - 60, H - 60);
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('SLOW', W - 140, H - 60);
  ctx.restore();
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawWarnings() {
  for (let i = warnings.length - 1; i >= 0; i--) {
    const w = warnings[i];
    w.life--;
    if (w.life <= 0) { warnings.splice(i, 1); continue; }
    const alpha = Math.abs(Math.sin(w.life * 0.25)) * 0.8 + 0.2;
    const progress = 1 - w.life / 45;
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.rotate(w.angle);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = w.color || '#ffcc44';
    ctx.shadowBlur = 10;
    ctx.shadowColor = w.color || '#ffcc44';
    // Pulsing ring
    ctx.strokeStyle = w.color || '#ffcc44';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = alpha * (1 - progress);
    ctx.beginPath();
    ctx.arc(0, 0, 10 + progress * 20, 0, Math.PI * 2);
    ctx.stroke();
    // Arrow
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(7, 5);
    ctx.lineTo(0, 2);
    ctx.lineTo(-7, 5);
    ctx.closePath();
    ctx.fill();
    // Inner dot
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = alpha * 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawDangerZone() {
  const dangerY = H - 100;
  // always draw faint danger line
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 60, 60, 0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, dangerY);
  ctx.lineTo(W, dangerY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  // player in danger zone
  if (player.y > dangerY) {
    const intensity = (player.y - dangerY) / 100;
    ctx.save();
    ctx.globalAlpha = intensity * 0.25;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, dangerY, W, H - dangerY);
    ctx.restore();
  }
  // enemies approaching bottom
  const enemiesInDanger = enemies.filter(e => e.y > dangerY && e.type !== 'boss');
  if (enemiesInDanger.length > 0) {
    const pulse = Math.abs(Math.sin(Date.now() * 0.008)) * 0.5 + 0.5;
    ctx.save();
    ctx.globalAlpha = pulse * 0.6;
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ ENEMIES APPROACHING BOTTOM', W / 2, H - 16);
    ctx.restore();
  }
  // Proximity warning for bombers and armed mines
  for (const e of enemies) {
    if (e.spawnDelay > 0) continue;
    if (e.type === 'bomber' || (e.type === 'mine' && e.armed)) {
      const d = dist(e, player);
      if (d < 120) {
        const warnPulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.012);
        const alpha = (1 - d / 120) * 0.5 * warnPulse;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 60, 60, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius + 15 + warnPulse * 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }
  }
}

function drawComboGuardFlash() {
  if (comboGuardFlash > 0) {
    const t = comboGuardFlash / 60;
    const pulse = 0.5 + 0.5 * Math.sin(comboGuardFlash * 0.3);
    const alpha = t * 0.35 * pulse;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 68, 255, ${alpha})`;
    ctx.lineWidth = 3 + pulse * 4;
    ctx.shadowColor = '#ff44ff';
    ctx.shadowBlur = 15 * pulse;
    ctx.strokeRect(8, 8, W - 16, H - 16);
    ctx.restore();
    comboGuardFlash--;
  }
}
function drawComboFlash() {
  if (comboFlash > 0) {
    const alpha = (comboFlash / 15) * 0.15;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = comboFlashColor;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    comboFlash--;
  }
}
function drawDamageFlash() {
  if (damageFlash > 0) {
    const t = damageFlash / 15;
    const alpha = t * 0.35;
    ctx.save();
    // Vignette-style radial gradient from edges
    const maxDim = Math.max(W, H);
    const grad = ctx.createRadialGradient(W / 2, H / 2, maxDim * 0.3, W / 2, H / 2, maxDim * 0.75);
    grad.addColorStop(0, 'rgba(255, 0, 0, 0)');
    grad.addColorStop(0.5, `rgba(180, 0, 0, ${alpha * 0.3})`);
    grad.addColorStop(0.85, `rgba(220, 20, 20, ${alpha * 0.7})`);
    grad.addColorStop(1, `rgba(255, 40, 40, ${alpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // Pulsing border glow
    const pulse = 1 + Math.sin(damageFlash * 0.8) * 0.3;
    ctx.globalAlpha = alpha * 1.8 * pulse;
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 3 * pulse;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 12 * pulse;
    ctx.strokeRect(4, 4, W - 8, H - 8);
    ctx.restore();
  }
}

function drawTutorialHint() {
  ctx.save();
  ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.005) * 0.3;
  ctx.fillStyle = '#aabbdd';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD / Arrows to move · Space to shoot · P to pause', W / 2, H - 24);
  ctx.restore();
}

function drawTimeStopEffect() {
  if (timeStopTimer > 0) {
    const pulse = 0.2 + Math.sin(Date.now() * 0.02) * 0.15;
    const pct = timeStopTimer / 180;
    ctx.save();
    // dark purple overlay
    ctx.fillStyle = `rgba(60,20,80,${0.25 + pulse * 0.15})`;
    ctx.fillRect(0, 0, W, H);
    // pulsing border
    ctx.strokeStyle = `rgba(255,136,255,${pulse})`;
    ctx.lineWidth = 4 + pulse * 3;
    ctx.strokeRect(4, 4, W - 8, H - 8);
    // inner border
    ctx.strokeStyle = `rgba(200,100,255,${pulse * 0.5})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, W - 24, H - 24);
    // clock icon at top center
    ctx.translate(W / 2, 30);
    ctx.strokeStyle = `rgba(255,200,255,${0.6 + pulse * 0.3})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.stroke();
    const handAngle = -Math.PI / 2 + (1 - pct) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(handAngle) * 10, Math.sin(handAngle) * 10);
    ctx.stroke();
    ctx.restore();
  }
}

function drawWaveBorder() {
  const intensity = Math.min(1, (wave - 1) / 15);
  const r = Math.floor(50 + intensity * 150);
  const g = Math.floor(100 + intensity * 20);
  const b = Math.floor(200 - intensity * 150);
  const alpha = 0.15 + intensity * 0.25;
  ctx.save();
  ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
  ctx.lineWidth = 2 + intensity * 3;
  ctx.strokeRect(2, 2, W - 4, H - 4);
  ctx.restore();
}

let lowHPTimer = 0;
let deathSlowMo = 0;
function drawLowHPWarning() {
  const hpRatio = player.hp / player.maxHp;
  if (hpRatio < 0.3 && player.hp > 0) {
    const flash = Math.abs(Math.sin(Date.now() * 0.008)) * 0.3 + 0.1;
    ctx.save();
    ctx.globalAlpha = flash;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOW HP WARNING', W / 2, H / 2 + 60);
    ctx.restore();
    // heartbeat sound (double beat: lub-dub)
    const heartbeatInterval = hpRatio < 0.15 ? 40 : 55;
    lowHPTimer++;
    if (lowHPTimer >= heartbeatInterval) {
      lowHPTimer = 0;
      const vol = hpRatio < 0.15 ? 0.1 : 0.07;
      const t = audioCtx.currentTime;
      // lub
      const o1 = audioCtx.createOscillator();
      o1.type = 'sine';
      o1.frequency.setValueAtTime(80, t);
      o1.frequency.exponentialRampToValueAtTime(55, t + 0.1);
      const g1 = audioCtx.createGain();
      g1.gain.setValueAtTime(vol * masterVolume, t);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o1.connect(g1);
      g1.connect(audioCtx.destination);
      o1.start(t);
      o1.stop(t + 0.15);
      // dub
      const o2 = audioCtx.createOscillator();
      o2.type = 'sine';
      o2.frequency.setValueAtTime(100, t + 0.15);
      o2.frequency.exponentialRampToValueAtTime(70, t + 0.25);
      const g2 = audioCtx.createGain();
      g2.gain.setValueAtTime(vol * 0.7 * masterVolume, t + 0.15);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.27);
      o2.connect(g2);
      g2.connect(audioCtx.destination);
      o2.start(t + 0.15);
      o2.stop(t + 0.3);
    }
  } else {
    lowHPTimer = 0;
  }
}

function drawBossWarning() {
  for (const e of enemies) {
    if (e.type === 'boss' && e.introTimer > 0) {
      const flash = Math.abs(Math.sin(e.introTimer * 0.15)) * 0.8 + 0.2;
      ctx.save();
      ctx.globalAlpha = flash;
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('WARNING', W / 2, H / 2 - 60);
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('BOSS APPROACHING', W / 2, H / 2 - 20);
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.strokeRect(W * 0.1, H * 0.25, W * 0.8, H * 0.5);
      ctx.restore();
    }
  }
}

function drawBombEffect() {
  const r = (40 - bombAnim) * 18;
  ctx.save();
  ctx.globalAlpha = bombAnim / 40 * 0.35;
  ctx.fillStyle = '#ffaa44';
  ctx.beginPath();
  ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffcc66';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(player.x, player.y, r * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function updateShockwaves(timeScale = 1) {
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const s = shockwaves[i];
    s.life -= timeScale;
    s.radius = s.maxRadius * (1 - s.life / s.maxLife);
    if (s.life <= 0) shockwaves.splice(i, 1);
  }
}

function drawShockwaves() {
  for (const s of shockwaves) {
    const alpha = s.life / s.maxLife * 0.5;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawTexts() {
  for (const t of texts) {
    const progress = 1 - t.life / t.maxLife;
    const popScale = t.baseScale ? (t.baseScale - (t.baseScale - 1) * progress) : 1;
    const breathe = 1 + Math.sin(progress * Math.PI) * 0.15;
    const scale = popScale * breathe;
    ctx.globalAlpha = Math.min(1, t.life / t.maxLife);
    ctx.fillStyle = t.color;
    ctx.font = `bold ${t.size || 16}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.scale(scale, scale);
    // subtle shadow for depth
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillText(t.txt, 1, 1);
    ctx.fillStyle = t.color;
    ctx.fillText(t.txt, 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'start';
}

function drawBossUI() {
  const boss = enemies.find(e => e.type === 'boss');
  if (!boss || boss.introTimer > 0) return;
  // Boss presence screen edge effect
  const isBeta = boss.bossType === 'beta';
  const bossPct = boss.hp / boss.maxHp;
  const edgeAlpha = bossPct > 0.5 ? 0.08 : 0.15;
  const pulse = 1 + 0.1 * Math.sin(Date.now() * 0.003);
  ctx.save();
  const edgeGradient = ctx.createRadialGradient(W / 2, H / 2, W * 0.35, W / 2, H / 2, W * 0.75);
  edgeGradient.addColorStop(0, 'rgba(0,0,0,0)');
  edgeGradient.addColorStop(1, isBeta ? `rgba(50,100,255,${edgeAlpha * pulse})` : `rgba(255,50,50,${edgeAlpha * pulse})`);
  ctx.fillStyle = edgeGradient;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const bw = W * 0.6;
  const bh = 10;
  const bx = (W - bw) / 2;
  const by = 36;
  const pct = boss.hp / boss.maxHp;
  const isBeta = boss.bossType === 'beta';
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(bx, by, bw, bh);
  if (isBeta) {
    ctx.fillStyle = pct > 0.5 ? '#3366ff' : pct > 0.25 ? '#5588ff' : '#0022ff';
  } else {
    ctx.fillStyle = pct > 0.5 ? '#ff4444' : pct > 0.25 ? '#ff8844' : '#ff0000';
  }
  ctx.fillRect(bx, by, bw * pct, bh);
  ctx.strokeStyle = isBeta ? 'rgba(100,150,255,0.6)' : 'rgba(255,100,100,0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = isBeta ? '#aabbff' : '#ffaaaa';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`BOSS  HP: ${Math.ceil(pct * 100)}%`, W / 2, by - 6);
  ctx.restore();
}

function drawUI() {
  const mult = (1 + combo * 0.1).toFixed(1);
  const scoreEl = document.getElementById('score');
  if (scoreEl) {
    scoreEl.textContent = `SCORE: ${score.toLocaleString()} (x${mult})`;
    scoreEl.style.color = score >= 100000 ? '#ffcc44' : score >= 50000 ? '#ffee88' : '#e0e0ff';
    scoreEl.style.textShadow = score >= 50000 ? '0 0 10px rgba(255, 204, 68, 0.5)' : 'none';
  }
  const totalSpawned = enemiesToSpawn + enemies.length;
  const killed = totalSpawned - enemiesToSpawn;
  const waveEl = document.getElementById('wave');
  if (waveEl) {
    waveEl.textContent = `WAVE: ${wave} (${killed}/${totalSpawned})`;
    const isBossWave = wave % 5 === 0;
    const isEliteWave = wave % 10 === 0 && wave > 0;
    const waveColor = isEliteWave ? '#ffaa00' : isBossWave ? '#ff4444' : wave >= 20 ? '#ff66ff' : '#e0e0ff';
    waveEl.style.color = waveColor;
    waveEl.style.textShadow = isBossWave || isEliteWave ? `0 0 10px ${waveColor}` : 'none';
    if (lastWave !== wave) {
      lastWave = wave;
      waveScale = 1.5;
    }
    if (waveScale > 1) {
      waveScale -= 0.04;
      waveEl.style.transform = `scale(${waveScale})`;
      waveEl.style.display = 'inline-block';
    } else {
      waveScale = 1;
      waveEl.style.transform = 'scale(1)';
    }
  }
  const waveFill = document.getElementById('wave-fill');
  if (waveFill) {
    const totalSpawned = enemiesToSpawn + enemies.length;
    const killed = totalSpawned - enemiesToSpawn;
    const pct = totalSpawned > 0 ? Math.floor((killed / totalSpawned) * 100) : 0;
    waveFill.style.width = `${pct}%`;
  }
  const timerEl = document.getElementById('timer');
  if (timerEl && gameStartTime > 0) {
    const sec = Math.floor((Date.now() - gameStartTime) / 1000);
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    timerEl.textContent = `${m}:${s}`;
  }
  const comboEl = document.getElementById('combo');
  const comboFill = document.getElementById('combo-fill');
  const comboBar = document.getElementById('combo-bar');
  if (comboEl) {
    comboEl.textContent = `COMBO: x${combo}`;
    const comboColor = combo >= 50 ? '#ffcc44' : combo >= 25 ? '#ff8844' : combo >= 10 ? '#ff66ff' : '#e0e0ff';
    comboEl.style.color = comboColor;
    comboEl.style.textShadow = combo >= 10 ? `0 0 8px ${comboColor}` : 'none';
    if (comboScale > 1) {
      comboEl.style.transform = `scale(${comboScale})`;
      comboEl.style.display = 'inline-block';
      comboScale -= 0.04;
      if (comboScale <= 1) {
        comboScale = 1;
        comboEl.style.transform = 'scale(1)';
      }
    }
  }
  const comboBonusEl = document.getElementById('combo-bonus');
  if (comboBonusEl) {
    const bonus = Math.floor(combo * 10);
    comboBonusEl.textContent = `+${bonus}%`;
    comboBonusEl.style.display = combo > 0 ? 'inline' : 'none';
  }
  if (comboFill && comboBar) {
    if (combo > 0 && comboTimer > 0) {
      comboBar.style.display = 'inline-block';
      comboFill.style.width = `${(comboTimer / 180) * 100}%`;
      comboFill.style.background = combo >= 25 ? '#ffee44' : combo >= 10 ? '#ff88ff' : '#aa88ff';
    } else {
      comboBar.style.display = 'none';
    }
  }
  const practiceInd = document.getElementById('practice-indicator');
  if (practiceInd) practiceInd.style.display = practiceMode ? 'inline' : 'none';
  const diffInd = document.getElementById('difficulty-indicator');
  if (diffInd) {
    const diffNames = { 1: 'EASY', 2: 'NORMAL', 3: 'HARD', 4: 'NIGHTMARE' };
    const diffColors = { 1: '#44ff88', 2: '#aabbdd', 3: '#ff8844', 4: '#ff4444' };
    diffInd.textContent = diffNames[difficulty] || 'NORMAL';
    diffInd.style.color = diffColors[difficulty] || '#aabbdd';
  }
  const weaponInd = document.getElementById('weapon-indicator');
  if (weaponInd) {
    const weaponNames = {
      balanced: 'BALANCED', spread: 'SPREAD', rapid: 'RAPID',
      laser: 'LASER', ricochet: 'RICOCHET', homing: 'HOMING', explosive: 'EXPLOSIVE'
    };
    const weaponColors = {
      balanced: '#44ffaa', spread: '#44ff88', rapid: '#ffaa44',
      laser: '#ff66ff', ricochet: '#ffcc66', homing: '#ff66cc', explosive: '#ff6633'
    };
    weaponInd.textContent = weaponNames[weaponType] || 'BALANCED';
    weaponInd.style.color = weaponColors[weaponType] || '#44ffaa';
  }
  const killsEl = document.getElementById('kills');
  if (killsEl) {
    killsEl.textContent = `KILLS: ${stats.kills}`;
    const k = stats.kills;
    killsEl.style.color = k >= 500 ? '#ffcc44' : k >= 200 ? '#ffee88' : k >= 100 ? '#aaffaa' : '#e0e0ff';
    killsEl.style.textShadow = k >= 100 ? '0 0 8px rgba(255, 238, 136, 0.4)' : 'none';
  }
  const scoreMultEl = document.getElementById('score-mult');
  if (scoreMultEl) {
    scoreMultEl.textContent = `x${scoreMultBonus.toFixed(1)}`;
    scoreMultEl.style.display = scoreMultBonus > 1 ? 'inline' : 'none';
  }
  const grazeEl = document.getElementById('graze');
  if (grazeEl) {
    grazeEl.textContent = `GRAZE: ${grazeCount}`;
    const isGrazing = grazeTimer > 0;
    grazeEl.style.color = isGrazing ? '#ff88ff' : grazeCount >= 100 ? '#ffccff' : '#e0e0ff';
    grazeEl.style.textShadow = isGrazing ? '0 0 10px rgba(255, 136, 255, 0.6)' : grazeCount >= 100 ? '0 0 8px rgba(255, 204, 255, 0.3)' : 'none';
  }
  const streakEl = document.getElementById('perfect-streak');
  if (streakEl) {
    if (noDamageWaves > 0) {
      streakEl.style.display = 'inline';
      streakEl.textContent = `🔥 x${noDamageWaves}`;
      const streakColor = noDamageWaves >= 5 ? '#ff4444' : noDamageWaves >= 3 ? '#ff8844' : '#ffcc44';
      streakEl.style.color = streakColor;
      streakEl.style.textShadow = noDamageWaves >= 3 ? `0 0 10px ${streakColor}` : 'none';
    } else {
      streakEl.style.display = 'none';
    }
  }
  const achCountEl = document.getElementById('achievement-count');
  if (achCountEl) {
    if (achievementsThisRun > 0) {
      achCountEl.style.display = 'inline';
      achCountEl.textContent = `🏆 ${achievementsThisRun}`;
    } else {
      achCountEl.style.display = 'none';
    }
  }
  document.getElementById('health-text').textContent = `HP: ${Math.max(0, player.hp)}/${player.maxHp}`;
  const hpPct = Math.max(0, player.hp) / player.maxHp * 100;
  const hpFill = document.getElementById('health-fill');
  if (hpFill) {
    hpFill.style.width = hpPct + '%';
    const hpColor = hpPct > 60 ? '#44ff88' : hpPct > 30 ? '#ffcc44' : '#ff4444';
    hpFill.style.background = hpColor;
    hpFill.style.boxShadow = hpPct <= 30 ? `0 0 8px ${hpColor}` : 'none';
  }
  const bombEl = document.getElementById('bomb-count');
  if (bombEl) {
    bombEl.textContent = `BOMB: ${player.bombs}`;
    const bombReady = bombCooldown <= 0 && player.bombs > 0;
    const bombColor = player.bombs === 0 ? '#ff4444' : bombReady ? '#ffcc44' : '#556688';
    bombEl.style.color = bombColor;
    bombEl.style.textShadow = bombReady ? '0 0 8px rgba(255, 204, 68, 0.5)' : 'none';
  }
  const magnetEl = document.getElementById('magnet-status');
  if (magnetEl) {
    if (magnetTimer > 0) {
      magnetEl.textContent = `MAGNET: ${Math.ceil(magnetTimer / 60)}s`;
      magnetEl.style.display = 'inline';
      magnetEl.style.color = '#ff88ff';
      magnetEl.style.textShadow = '0 0 8px rgba(255, 136, 255, 0.6)';
    } else {
      magnetEl.textContent = '';
      magnetEl.style.display = 'none';
    }
  }
  const dashEl = document.getElementById('dash-status');
  if (dashEl) {
    if (dashing > 0) {
      dashEl.textContent = 'DASHING';
      dashEl.style.color = '#aaddff';
      dashEl.style.textShadow = '0 0 8px rgba(170, 221, 255, 0.6)';
    } else if (dashCooldown > 0) {
      dashEl.textContent = `DASH: ${Math.ceil(dashCooldown / 60)}s`;
      dashEl.style.color = '#556688';
      dashEl.style.textShadow = 'none';
    } else {
      dashEl.textContent = 'DASH READY';
      dashEl.style.color = '#88aaff';
      dashEl.style.textShadow = '0 0 6px rgba(136, 170, 255, 0.4)';
    }
  }
  const odEl = document.getElementById('overdrive-status');
  if (odEl) {
    if (overdriveTimer > 0) {
      odEl.textContent = `OVERDRIVE: ${Math.ceil(overdriveTimer / 60)}s`;
      odEl.style.display = 'inline';
      odEl.style.color = '#ff4444';
      odEl.style.textShadow = '0 0 8px rgba(255, 68, 68, 0.6)';
    } else {
      odEl.style.display = 'none';
    }
  }
  const smEl = document.getElementById('score-mult-status');
  if (smEl) {
    if (scoreMultTimer > 0) {
      smEl.textContent = `SCORE x${scoreMultBonus.toFixed(1)}`;
      smEl.style.display = 'inline';
      smEl.style.color = '#ffcc44';
      smEl.style.textShadow = '0 0 8px rgba(255, 204, 68, 0.5)';
    } else {
      smEl.style.display = 'none';
    }
  }
  if (activeNotification && state === STATE.PLAYING) {
    drawAchievementNotification();
  }
  // Volume indicator overlay
  if (volumeDisplayTimer > 0) {
    volumeDisplayTimer--;
    const alpha = Math.min(1, volumeDisplayTimer / 30);
    ctx.save();
    ctx.globalAlpha = alpha;
    const vx = W - 120;
    const vy = H - 40;
    ctx.fillStyle = 'rgba(20, 30, 60, 0.85)';
    ctx.fillRect(vx, vy, 110, 22);
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(vx, vy, 110, 22);
    ctx.fillStyle = '#aaccff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`VOL: ${volumeLabels[volumeIndex]}`, vx + 6, vy + 15);
    ctx.restore();
  }
  // Particle density indicator overlay
  if (particleDisplayTimer > 0) {
    particleDisplayTimer--;
    const alpha = Math.min(1, particleDisplayTimer / 30);
    ctx.save();
    ctx.globalAlpha = alpha;
    const px = W - 120;
    const py = H - 66;
    ctx.fillStyle = 'rgba(20, 30, 60, 0.85)';
    ctx.fillRect(px, py, 110, 22);
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, 110, 22);
    ctx.fillStyle = '#aaccff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`PARTICLES: ${particleLabels[particleDensity]}`, px + 6, py + 15);
    ctx.restore();
  }
  // Color theme indicator overlay
  if (themeDisplayTimer > 0) {
    themeDisplayTimer--;
    const alpha = Math.min(1, themeDisplayTimer / 30);
    ctx.save();
    ctx.globalAlpha = alpha;
    const tx = W - 120;
    const ty = H - 92;
    const theme = THEMES[colorTheme];
    ctx.fillStyle = 'rgba(20, 30, 60, 0.85)';
    ctx.fillRect(tx, ty, 110, 22);
    ctx.strokeStyle = theme.glow;
    ctx.lineWidth = 1;
    ctx.strokeRect(tx, ty, 110, 22);
    ctx.fillStyle = theme.player;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`THEME: ${theme.name}`, tx + 6, ty + 15);
    ctx.restore();
  }
  // Auto fire indicator overlay
  if (autoFireDisplayTimer > 0) {
    autoFireDisplayTimer--;
    const alpha = Math.min(1, autoFireDisplayTimer / 30);
    ctx.save();
    ctx.globalAlpha = alpha;
    const ax = W - 120;
    const ay = H - 118;
    ctx.fillStyle = 'rgba(20, 30, 60, 0.85)';
    ctx.fillRect(ax, ay, 110, 22);
    ctx.strokeStyle = autoFire ? 'rgba(100, 255, 100, 0.5)' : 'rgba(255, 100, 100, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(ax, ay, 110, 22);
    ctx.fillStyle = autoFire ? '#88ffaa' : '#ff8888';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`AUTO FIRE: ${autoFire ? 'ON' : 'OFF'}`, ax + 6, ay + 15);
    ctx.restore();
  }
  // Music indicator overlay
  if (musicDisplayTimer > 0) {
    musicDisplayTimer--;
    const alpha = Math.min(1, musicDisplayTimer / 30);
    ctx.save();
    ctx.globalAlpha = alpha;
    const mx = W - 120;
    const my = H - 144;
    ctx.fillStyle = 'rgba(20, 30, 60, 0.85)';
    ctx.fillRect(mx, my, 110, 22);
    ctx.strokeStyle = musicEnabled ? 'rgba(100, 200, 255, 0.5)' : 'rgba(150, 150, 150, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, 110, 22);
    ctx.fillStyle = musicEnabled ? '#88ccff' : '#8899aa';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`MUSIC: ${musicEnabled ? 'ON' : 'OFF'}`, mx + 6, my + 15);
    ctx.restore();
  }
  // FPS display indicator overlay
  if (fpsDisplayTimer > 0) {
    fpsDisplayTimer--;
    const alpha = Math.min(1, fpsDisplayTimer / 30);
    ctx.save();
    ctx.globalAlpha = alpha;
    const fx = W - 120;
    const fy = H - 170;
    ctx.fillStyle = 'rgba(20, 30, 60, 0.85)';
    ctx.fillRect(fx, fy, 110, 22);
    ctx.strokeStyle = showFPS ? 'rgba(100, 255, 150, 0.5)' : 'rgba(150, 150, 150, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(fx, fy, 110, 22);
    ctx.fillStyle = showFPS ? '#88ffaa' : '#8899aa';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`FPS: ${showFPS ? 'ON' : 'OFF'}`, fx + 6, fy + 15);
    ctx.restore();
  }
  // Fullscreen indicator overlay
  if (fullscreenDisplayTimer > 0) {
    fullscreenDisplayTimer--;
    const alpha = Math.min(1, fullscreenDisplayTimer / 30);
    ctx.save();
    ctx.globalAlpha = alpha;
    const fsx = W - 120;
    const fsy = H - 196;
    const isFullscreen = !!document.fullscreenElement;
    ctx.fillStyle = 'rgba(20, 30, 60, 0.85)';
    ctx.fillRect(fsx, fsy, 110, 22);
    ctx.strokeStyle = isFullscreen ? 'rgba(100, 255, 150, 0.5)' : 'rgba(150, 150, 150, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(fsx, fsy, 110, 22);
    ctx.fillStyle = isFullscreen ? '#88ffaa' : '#8899aa';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`FULLSCREEN: ${isFullscreen ? 'ON' : 'OFF'}`, fsx + 6, fsy + 15);
    ctx.restore();
  }
  // Help overlay
  if (helpOverlayTimer > 0) {
    helpOverlayTimer--;
    const alpha = Math.min(1, helpOverlayTimer / 30);
    ctx.save();
    ctx.globalAlpha = alpha * 0.92;
    ctx.fillStyle = 'rgba(10, 15, 30, 0.9)';
    ctx.fillRect(W / 2 - 160, H / 2 - 140, 320, 280);
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(W / 2 - 160, H / 2 - 140, 320, 280);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#aaccff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CONTROLS', W / 2, H / 2 - 115);
    ctx.font = '12px sans-serif';
    const controls = [
      'WASD / Arrows — Move',
      'Space / J — Shoot',
      'B — Bomb (clear screen)',
      'K / X — Dash (while moving)',
      'Shift — Focus (Slow movement)',
      'P — Pause',
      'H — Show/Hide this help',
      '',
      '[ / ] — Volume',
      '- / = — Particle density',
      'T — Color theme',
      'A — Auto fire',
      'M — Music',
      'F2 — Screenshot',
      'F3 — FPS display',
      'F4 — Fullscreen',
    ];
    controls.forEach((line, i) => {
      ctx.fillStyle = line.includes('—') ? '#aabbdd' : '#88aadd';
      ctx.fillText(line, W / 2, H / 2 - 90 + i * 16);
    });
    ctx.restore();
  }
  // Version watermark
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#556688';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('v1.81.7', W - 6, H - 6);
  ctx.restore();
}

function drawAchievementNotification() {
  const maxTimer = 300;
  const fadeIn = 20;
  const fadeOut = 40;
  let alpha = 1;
  if (notificationTimer > maxTimer - fadeIn) {
    alpha = (maxTimer - notificationTimer) / fadeIn;
  } else if (notificationTimer < fadeOut) {
    alpha = notificationTimer / fadeOut;
  }
  alpha = Math.max(0, Math.min(1, alpha));
  const yOffset = (1 - alpha) * -30;

  const notifW = 360;
  const notifH = 56;
  const nx = W / 2 - notifW / 2;
  const ny = 18 + yOffset;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Background
  ctx.fillStyle = 'rgba(10, 10, 20, 0.88)';
  ctx.beginPath();
  ctx.roundRect(nx, ny, notifW, notifH, 8);
  ctx.fill();

  // Gold border
  ctx.strokeStyle = '#ffcc44';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(nx, ny, notifW, notifH, 8);
  ctx.stroke();

  // Glow line
  ctx.strokeStyle = 'rgba(255, 204, 68, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(nx + 12, ny + notifH - 6);
  ctx.lineTo(nx + notifW - 12, ny + notifH - 6);
  ctx.stroke();

  // Title
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = '#ffcc44';
  ctx.textAlign = 'center';
  ctx.fillText('★ ACHIEVEMENT UNLOCKED ★', W / 2, ny + 18);

  // Name
  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(activeNotification.name, W / 2, ny + 38);

  // Description
  ctx.font = '11px monospace';
  ctx.fillStyle = '#aabbdd';
  ctx.fillText(activeNotification.desc, W / 2, ny + 52);

  ctx.restore();
}

/* ---------- Screens ---------- */
function showMenu() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('menu-screen').classList.add('active');
  const el = document.getElementById('menu-highscore');
  if (el) {
    const diffNames = { 1: 'Easy', 2: 'Normal', 3: 'Hard', 4: 'Nightmare' };
    const diffHigh = highScoresByDifficulty[difficulty] || 0;
    el.innerHTML = `High Score: ${highScore.toLocaleString()} <span style="color:#88aaff; font-size:11px;">(${diffNames[difficulty]}: ${diffHigh.toLocaleString()})</span>`;
  }
  updateAchievementUI();
  updateEnemyLogUI();
  updateLeaderboardUI();
  const sg = document.getElementById('stat-games');
  const sk = document.getElementById('stat-kills');
  const sb = document.getElementById('stat-bestwave');
  const st = document.getElementById('stat-time');
  const sc = document.getElementById('stat-combo');
  const sbs = document.getElementById('stat-bosses');
  if (sg) sg.textContent = `Games: ${stats.games}`;
  if (sk) sk.textContent = `Kills: ${stats.kills}`;
  if (sb) sb.textContent = `Best Wave: ${stats.bestWave}`;
  if (st) st.textContent = `Time: ${Math.floor(stats.totalTime / 60)}m`;
  if (sc) sc.textContent = `Best Combo: ${stats.highestCombo}`;
  if (sbs) sbs.textContent = `Bosses: ${stats.bossesDefeated}`;
  const sw = document.getElementById('stat-weapons');
  if (sw) {
    const w = stats.weaponUses;
    const names = { balanced: 'B', spread: 'S', rapid: 'R', laser: 'L', ricochet: 'Rc' };
    const parts = [];
    for (const key in names) {
      const count = w[key] || 0;
      if (count > 0) {
        const level = Math.min(5, Math.floor(count / 50));
        const stars = '★'.repeat(level) + '☆'.repeat(5 - level);
        parts.push(`${names[key]}:${count} ${stars}`);
      }
    }
    sw.innerHTML = parts.length ? `Weapons: ${parts.join(' · ')}` : 'Weapons: —';
  }
  updateGameTip();
}

const GAME_TIPS = [
  "Tip: Hold Shift to focus and slow down for precise dodging.",
  "Tip: Dash (K/X) gives brief invincibility — use it to escape tight spots!",
  "Tip: Higher combos give score multipliers. Don't let it drop!",
  "Tip: Elite enemies have 1.5x HP and stronger attacks. Prioritize them!",
  "Tip: The Laser weapon pierces through multiple enemies in a line.",
  "Tip: Ricochet bullets bounce off walls twice — great for tight spaces.",
  "Tip: Homing missiles track enemies automatically but move slower.",
  "Tip: Bombs clear all enemy bullets and damage every enemy on screen.",
  "Tip: Perfect Waves (no damage taken) build up reward choices every 3 waves.",
  "Tip: Grazing enemy bullets (near misses) builds graze count for bonus score.",
  "Tip: Shielders regenerate shield over time — burst them down quickly!",
  "Tip: Medics heal nearby enemies — take them out first.",
  "Tip: Dividers split when hit. Be ready for multiple smaller targets!",
  "Tip: Bombers explode on death — keep your distance when they fall.",
  "Tip: Weapon proficiency increases damage by +2% per star (max +10%).",
  "Tip: Combo Guard saves you from death once if combo is 10 or higher.",
  "Tip: Time Stop freezes all enemies for 3 seconds — perfect for escapes.",
  "Tip: The Magnet power-up attracts all nearby pickups for 5 seconds.",
  "Tip: Bosses enrage at 50% HP with faster attacks and new colors!",
  "Tip: Every 3rd non-boss wave has a theme (Swarm/Assault/Fortress/etc).",
  "Tip: Explosive shells deal 50% splash damage in a radius — great for crowds!",
  "Tip: Phantom enemies phase in and out. Time your shots when they're visible!",
  "Tip: Elite Waves (every 10th) force all enemies to be elite. Brace yourself!",
  "Tip: Kill milestones at 50/100/200/500 grant bonus score celebrations!",
];
function updateGameTip() {
  const el = document.getElementById('game-tip');
  if (!el) return;
  const tip = GAME_TIPS[Math.floor(Math.random() * GAME_TIPS.length)];
  el.textContent = tip;
}

function hideScreens() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
}

function showPause() {
  document.getElementById('pause-screen').classList.add('active');
  const ps = document.getElementById('pause-score');
  const pw = document.getElementById('pause-wave');
  const pk = document.getElementById('pause-kills');
  const pc = document.getElementById('pause-combo');
  const pg = document.getElementById('pause-graze');
  const pt = document.getElementById('pause-time');
  if (ps) ps.textContent = score.toLocaleString();
  if (pw) pw.textContent = wave;
  if (pk) pk.textContent = stats.kills;
  if (pc) pc.textContent = combo;
  if (pg) pg.textContent = grazeCount;
  if (pt && gameStartTime > 0) {
    const sec = Math.floor((Date.now() - gameStartTime) / 1000);
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    pt.textContent = `${m}:${s}`;
  }
  const pp = document.getElementById('pause-perfect');
  if (pp) pp.textContent = totalPerfectWaves;
  const pb = document.getElementById('pause-bosses');
  if (pb) pb.textContent = bossesDefeatedThisRun;
  const pWeapon = document.getElementById('pause-weapon');
  if (pWeapon) pWeapon.textContent = weaponType.charAt(0).toUpperCase() + weaponType.slice(1);
  const pDiff = document.getElementById('pause-diff');
  if (pDiff) {
    const diffNames = { 1: 'Easy', 2: 'Normal', 3: 'Hard', 4: 'Nightmare' };
    pDiff.textContent = diffNames[difficulty] || 'Normal';
  }
  const pThemeRow = document.getElementById('pause-theme-row');
  const pTheme = document.getElementById('pause-theme');
  if (pThemeRow && pTheme) {
    if (waveTheme) {
      pThemeRow.style.display = 'block';
      pTheme.textContent = waveTheme;
      const themeColors = { SWARM: '#ff55aa', ASSAULT: '#ff8844', FORTRESS: '#44ddaa', SNIPER: '#ff44ff', DIVIDE: '#4466ff' };
      pTheme.style.color = themeColors[waveTheme] || '#ff88ff';
    } else {
      pThemeRow.style.display = 'none';
    }
  }
  const pBuffsRow = document.getElementById('pause-buffs-row');
  const pBuffs = document.getElementById('pause-buffs');
  if (pBuffsRow && pBuffs) {
    const buffs = [];
    if (player.invincible > 0) buffs.push(`Shield ${Math.ceil(player.invincible / 60)}s`);
    if (timeStopTimer > 0) buffs.push(`Time Stop ${Math.ceil(timeStopTimer / 60)}s`);
    if (magnetTimer > 0) buffs.push(`Magnet ${Math.ceil(magnetTimer / 60)}s`);
    if (overdriveTimer > 0) buffs.push(`Overdrive ${Math.ceil(overdriveTimer / 60)}s`);
    if (scoreMultTimer > 0) buffs.push(`Score Mult ${Math.ceil(scoreMultTimer / 60)}s`);
    if (comboGuard) buffs.push('Combo Guard');
    if (buffs.length) {
      pBuffsRow.style.display = 'block';
      pBuffs.textContent = buffs.join(' · ');
    } else {
      pBuffsRow.style.display = 'none';
    }
  }
  // reward bonuses
  const pRewards = document.getElementById('pause-rewards');
  if (pRewards) {
    const rewards = [];
    if (damageMult > 1) rewards.push(`Dmg x${damageMult.toFixed(1)}`);
    if (speedMultBonus > 1) rewards.push(`Spd x${speedMultBonus.toFixed(1)}`);
    if (scoreMultBonus > 1) rewards.push(`Score x${scoreMultBonus.toFixed(2)}`);
    if (rewards.length) {
      pRewards.style.display = 'block';
      pRewards.innerHTML = `Rewards: <span style="color:#ffcc44;">${rewards.join(' · ')}</span>`;
    } else {
      pRewards.style.display = 'none';
    }
  }
  const pEnemies = document.getElementById('pause-enemies');
  if (pEnemies) pEnemies.textContent = enemies.length + enemiesToSpawn;
  const pStreak = document.getElementById('pause-streak');
  if (pStreak) pStreak.textContent = noDamageWaves;
  const pBosses = document.getElementById('pause-bosses');
  if (pBosses) pBosses.textContent = bossesDefeatedThisRun;
}

function animateGameOverStats() {
  const scoreEl = document.getElementById('final-score');
  const killsEl = document.getElementById('final-kills');
  const grazeEl = document.getElementById('final-graze');
  let current = 0;
  const step = Math.max(1, Math.floor(score / 40));
  const interval = setInterval(() => {
    current += step;
    if (current >= score) {
      current = score;
      clearInterval(interval);
    }
    if (scoreEl) scoreEl.textContent = `Score: ${current.toLocaleString()}`;
  }, 25);
  // Animate kills counter
  let killCurrent = 0;
  const killTarget = stats.kills;
  const killStep = Math.max(1, Math.floor(killTarget / 30));
  const killInterval = setInterval(() => {
    killCurrent += killStep;
    if (killCurrent >= killTarget) {
      killCurrent = killTarget;
      clearInterval(killInterval);
    }
    if (killsEl) killsEl.textContent = `Kills: ${killCurrent}`;
  }, 30);
  if (grazeEl) grazeEl.textContent = `Graze: ${grazeCount}`;
}

function showGameOver() {
  if (recordBrokenThisRun) sfxNewRecord();
  document.getElementById('gameover-screen').classList.add('active');
  animateGameOverStats();
  document.getElementById('final-wave').textContent = `Wave: ${wave}`;
  const hsEl = document.getElementById('final-highscore');
  if (hsEl) {
    const diffNames = { 1: 'Easy', 2: 'Normal', 3: 'Hard', 4: 'Nightmare' };
    const diffHigh = highScoresByDifficulty[difficulty] || 0;
    hsEl.innerHTML = `High Score: ${highScore.toLocaleString()} <span style="color:#88aaff; font-size:12px;">(${diffNames[difficulty]}: ${diffHigh.toLocaleString()})</span>`;
  }
  const fkEl = document.getElementById('final-kills');
  if (fkEl) fkEl.textContent = `Kills: ${stats.kills}`;
  const fgEl = document.getElementById('final-graze');
  if (fgEl) fgEl.textContent = `Graze: ${grazeCount}`;
  const ftEl = document.getElementById('final-time');
  if (ftEl && gameStartTime > 0) {
    const sec = Math.floor((Date.now() - gameStartTime) / 1000);
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    ftEl.textContent = `Time: ${m}:${s}`;
  }
  const fcEl = document.getElementById('final-combo');
  if (fcEl) fcEl.textContent = `Best Combo: ${combo}`;
  const fpEl = document.getElementById('final-perfect');
  if (fpEl) fpEl.textContent = `Perfect Waves: ${totalPerfectWaves}`;
  const fbEl = document.getElementById('final-bosses');
  if (fbEl) fbEl.textContent = `Bosses: ${bossesDefeatedThisRun}`;
  const fwEl = document.getElementById('final-weapon');
  if (fwEl) {
    if (usedWeapons.size > 0) {
      const lines = [...usedWeapons].map(w => {
        const uses = stats.weaponUses[w] || 0;
        const stars = Math.min(5, Math.floor(uses / 50));
        const starStr = '★'.repeat(stars) + '☆'.repeat(5 - stars);
        return `${w.charAt(0).toUpperCase() + w.slice(1)} ${starStr}`;
      });
      fwEl.innerHTML = `Weapons:<br><span style="font-size:11px; color:#88aadd;">${lines.join(' · ')}</span>`;
    } else {
      const wname = weaponType.charAt(0).toUpperCase() + weaponType.slice(1);
      fwEl.textContent = `Weapon: ${wname}`;
    }
  }
  const frEl = document.getElementById('final-rewards');
  if (frEl) {
    const rewards = [];
    if (damageMult > 1) rewards.push(`Dmg x${damageMult.toFixed(1)}`);
    if (speedMultBonus > 1) rewards.push(`Spd x${speedMultBonus.toFixed(1)}`);
    if (scoreMultBonus > 1) rewards.push(`Score x${scoreMultBonus.toFixed(2)}`);
    if (rewards.length) {
      frEl.style.display = 'block';
      frEl.textContent = `Rewards: ${rewards.join(' · ')}`;
    } else {
      frEl.style.display = 'none';
    }
  }
  if (!practiceMode) {
    const oldRank = leaderboard.findIndex(e => e.score === score && e.wave === wave);
    addToLeaderboard(score, wave);
    const newRank = leaderboard.findIndex(e => e.score === score && e.wave === wave);
    updateLeaderboardUI(newRank);
    if (newRank < 5 && (oldRank === -1 || newRank < oldRank)) {
      spawnFloatingText(W / 2, H / 2 + 80, `RANK #${newRank + 1}!`, '#ffcc44');
      if (newRank === 0) {
        spawnFloatingText(W / 2, H / 2 + 100, 'TOP SCORE!', '#ffee44');
        for (let k = 0; k < 40; k++) {
          const a = rand(0, Math.PI * 2);
          const s = rand(3, 7);
          particles.push({
            x: W / 2, y: H / 2 + 90,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            life: rand(40, 80),
            maxLife: 80,
            color: '#ffee44',
            size: rand(2, 5),
            decay: 0.95,
          });
        }
      }
    }
    if (score >= highScore) {
      spawnFloatingText(W / 2, H / 2 + 60, 'NEW HIGH SCORE!', '#44ff66');
    }
    setSharedScore(score, wave);
  }
}

/* ---------- Init & Reset ---------- */
function resetGame() {
  player.x = W / 2;
  player.y = H - 80;
  player.vx = 0;
  player.vy = 0;
  player.maxHp = difficulty === 4 ? 1 : 100;
  player.hp = player.maxHp;
  player.invincible = 0;
  player.angle = -Math.PI / 2;
  player.shootCooldown = 0;
  player.powerLevel = 1;
  player.bombs = difficulty === 1 ? 5 : difficulty === 3 ? 2 : difficulty === 4 ? 1 : 3;

  bullets.length = 0;
  enemyBullets.length = 0;
  enemies.length = 0;
  particles.length = 0;
  texts.length = 0;
  shockwaves.length = 0;
  powerups.length = 0;
  warnings.length = 0;
  bombCooldown = 0;
  bombAnim = 0;
  dashCooldown = 0;
  dashing = 0;
  overdriveTimer = 0;
  damageFlash = 0;
  hitstop = 0;
  waveFlash = 0;
  waveAlertTimer = 0;
  waveAlertType = null;
  comboGuardFlash = 0;
  comboFlash = 0;
  waveTheme = null;
  timeStopTimer = 0;
  magnetTimer = 0;
  deathSlowMo = 0;
  portalSpawnsSeen = 0;
  lastScoreMilestone = 0;
  homingKills = 0;
  overdriveKills = 0;
  eliteWavesSurvived = 0;
  comboBurstsTriggered = 0;
  explosiveBestMultiKill = 0;
  explosiveKills = 0;
  phantomKills = 0;

  score = 0;
  wave = 1;
  combo = 0;
  comboTimer = 0;
  shake = 0;
  shakeDirX = 0;
  shakeDirY = 0;
  grazeCount = 0;
  grazeTimer = 0;
  noDamageWaves = 0;
  totalPerfectWaves = 0;
  bossesDefeatedThisRun = 0;
  recordBrokenThisRun = false;
  achievementsThisRun = 0;
  volumeDisplayTimer = 0;
  particleDisplayTimer = 0;
  themeDisplayTimer = 0;
  autoFireDisplayTimer = 0;
  musicDisplayTimer = 0;
  fpsDisplayTimer = 0;
  fullscreenDisplayTimer = 0;
  helpOverlayTimer = 0;
  rewardSelectActive = false;
  rewardOptions = [];
  damageMult = 1.0;
  speedMultBonus = 1.0;
  scoreMultBonus = 1.0;
  scoreMultTimer = 0;
  damageTakenThisWave = false;
  musicBeat = 0;
  if (audioCtx) musicNextTime = audioCtx.currentTime;
  encounteredTypes.clear();
  encounterText = null;
  encounterTimer = 0;
  bossFirstEncounter = { alpha: false, beta: false };
  usedWeapons.clear();
  masteredWeapons.clear();
  bombsUsedThisWave = 0;
  gameStartTime = Date.now();
  comboGuard = true;
  tutorialActive = !tutorialDismissed;
  tutorialDismissed = true;
  tutorialStepsShown.clear();

  initStars();
  startWave();
}

/* ---------- Difficulty Selection ---------- */
const DIFFICULTY_COLORS = {
  1: { bg: 'linear-gradient(180deg, #44ff88 0%, #22aa44 100%)', shadow: 'rgba(60, 255, 130, 0.5)', border: 'rgba(80, 255, 150, 0.5)' },
  2: { bg: 'linear-gradient(180deg, #4488ff 0%, #2244aa 100%)', shadow: 'rgba(60, 130, 255, 0.5)', border: 'rgba(100, 150, 255, 0.5)' },
  3: { bg: 'linear-gradient(180deg, #ff8844 0%, #aa4422 100%)', shadow: 'rgba(255, 130, 60, 0.5)', border: 'rgba(255, 150, 80, 0.5)' },
  4: { bg: 'linear-gradient(180deg, #ff4444 0%, #aa2222 100%)', shadow: 'rgba(255, 60, 60, 0.6)', border: 'rgba(255, 100, 100, 0.5)' },
};
function updateDifficultyStyles() {
  document.querySelectorAll('#difficulty-select .diff-btn').forEach(b => {
    const d = parseInt(b.dataset.diff, 10);
    const colors = DIFFICULTY_COLORS[d];
    if (b.classList.contains('active')) {
      b.style.background = colors.bg;
      b.style.boxShadow = `0 0 16px ${colors.shadow}`;
      b.style.borderColor = colors.border;
    } else {
      b.style.background = '';
      b.style.boxShadow = '';
      b.style.borderColor = '';
    }
  });
}
document.querySelectorAll('#difficulty-select .diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#difficulty-select .diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    difficulty = parseInt(btn.dataset.diff, 10);
    updateDifficultyStyles();
  });
});
updateDifficultyStyles();

/* ---------- Weapon Selection ---------- */
const WEAPON_DESCS = {
  balanced: { name: 'Balanced', desc: 'Reliable all-rounder. Moderate damage and fire rate. Gains extra side shots at higher power levels.', color: '#44ffaa' },
  spread: { name: 'Spread', desc: 'Wide cone of projectiles. Great for crowds. More pellets and wider arc as power increases.', color: '#44ff88' },
  rapid: { name: 'Rapid', desc: 'Extremely fast fire rate with lower per-shot damage. Melts enemies at close range.', color: '#ffaa44' },
  laser: { name: 'Laser', desc: 'Piercing beams that hit up to 3 enemies in a line. High damage, medium cooldown.', color: '#ff66ff' },
  ricochet: { name: 'Ricochet', desc: 'Bouncing projectiles that hit walls twice. Excellent for tight spaces and angles.', color: '#ffcc66' },
  homing: { name: 'Homing', desc: 'Auto-tracking missiles seek the nearest enemy. Lower speed but guaranteed hits.', color: '#ff66cc' },
  explosive: { name: 'Explosive', desc: 'Heavy shells explode on impact, dealing 50% splash damage in a radius. Slower fire rate but devastating crowds.', color: '#ff6633' },
};
function updateWeaponDesc() {
  const el = document.getElementById('weapon-desc');
  if (!el) return;
  const info = WEAPON_DESCS[weaponType];
  if (!info) { el.innerHTML = ''; return; }
  const uses = stats.weaponUses[weaponType] || 0;
  const stars = Math.min(5, Math.floor(uses / 50));
  const starStr = '★'.repeat(stars) + '☆'.repeat(5 - stars);
  const bonus = Math.floor(stars * 2);
  const nextThreshold = Math.min(250, (stars + 1) * 50);
  const progress = stars >= 5 ? 100 : Math.min(100, Math.floor((uses % 50) / 50 * 100));
  const progressBar = `<div style="display:inline-block; width:60px; height:4px; background:rgba(100,100,150,0.3); border-radius:2px; overflow:hidden; vertical-align:middle; margin:0 4px;"><div style="width:${progress}%; height:100%; background:${info.color};"></div></div>`;
  el.innerHTML = `<span style="color:${info.color}; font-weight:bold;">${info.name}</span> — ${info.desc}<br><span style="color:#ffcc44; font-size:10px;">${starStr}</span> ${progressBar} <span style="color:#88aadd; font-size:10px;">Mastery: +${bonus}% dmg (${uses} uses)</span>`;
}
document.querySelectorAll('#weapon-select .weapon-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#weapon-select .weapon-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    weaponType = btn.dataset.weapon;
    try { localStorage.setItem('stellar_defense_weapon', weaponType); } catch (e) {}
    updateWeaponDesc();
    sfxWeaponSwitch();
  });
});
function loadWeapon() {
  try {
    const v = localStorage.getItem('stellar_defense_weapon');
    if (v && ['balanced', 'spread', 'rapid', 'laser', 'ricochet', 'homing', 'explosive'].includes(v)) {
      weaponType = v;
      document.querySelectorAll('#weapon-select .weapon-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.weapon === v);
      });
    }
  } catch (e) {}
}
loadWeapon();
updateWeaponDesc();

/* ---------- Music Toggle ---------- */
const musicToggleBtn = document.getElementById('music-toggle');
if (musicToggleBtn) {
  musicToggleBtn.addEventListener('click', () => {
    musicEnabled = !musicEnabled;
    musicToggleBtn.textContent = musicEnabled ? 'MUSIC: ON' : 'MUSIC: OFF';
    musicToggleBtn.classList.toggle('active', musicEnabled);
  });
}

/* ---------- Particle Density Toggle ---------- */
const particleToggleBtn = document.getElementById('particle-toggle');
const particleLabels = ['PARTICLES: LOW', 'PARTICLES: MED', 'PARTICLES: HIGH'];
if (particleToggleBtn) {
  particleToggleBtn.addEventListener('click', () => {
    particleDensity = (particleDensity + 1) % 3;
    particleToggleBtn.textContent = particleLabels[particleDensity];
    particleToggleBtn.classList.toggle('active', particleDensity === 2);
  });
}

/* ---------- FPS Toggle ---------- */
const fpsToggleBtn = document.getElementById('fps-toggle');
if (fpsToggleBtn) {
  fpsToggleBtn.addEventListener('click', () => {
    targetFPS = targetFPS === 60 ? 30 : 60;
    fpsToggleBtn.textContent = `FPS: ${targetFPS}`;
    fpsToggleBtn.classList.toggle('active', targetFPS === 60);
  });
}

/* ---------- Volume Toggle ---------- */
const volumeToggleBtn = document.getElementById('volume-toggle');
const volumeLevels = [0, 0.33, 0.66, 1.0];
const volumeLabels = ['VOL: MUTE', 'VOL: 33%', 'VOL: 66%', 'VOL: 100%'];
let volumeIndex = 3;
if (volumeToggleBtn) {
  volumeToggleBtn.addEventListener('click', () => {
    volumeIndex = (volumeIndex + 1) % 4;
    masterVolume = volumeLevels[volumeIndex];
    volumeToggleBtn.textContent = volumeLabels[volumeIndex];
    volumeToggleBtn.classList.toggle('active', volumeIndex === 3);
  });
}

/* ---------- FPS Display Toggle ---------- */
const fpsDisplayToggleBtn = document.getElementById('fps-toggle-display');
if (fpsDisplayToggleBtn) {
  fpsDisplayToggleBtn.addEventListener('click', () => {
    showFPS = !showFPS;
    fpsDisplayToggleBtn.textContent = showFPS ? 'FPS: ON' : 'FPS: OFF';
    fpsDisplayToggleBtn.classList.toggle('active', showFPS);
  });
}

/* ---------- Fullscreen ---------- */
const fullscreenBtn = document.getElementById('fullscreen-btn');
if (fullscreenBtn) {
  fullscreenBtn.addEventListener('click', () => {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      elem.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  });
}

/* ---------- Practice Mode Toggle ---------- */
const practiceToggleBtn = document.getElementById('practice-toggle');
if (practiceToggleBtn) {
  practiceToggleBtn.addEventListener('click', () => {
    practiceMode = !practiceMode;
    practiceToggleBtn.textContent = practiceMode ? 'PRACTICE: ON' : 'PRACTICE: OFF';
    practiceToggleBtn.classList.toggle('active', practiceMode);
    practiceToggleBtn.style.background = practiceMode ? 'rgba(80,160,80,0.25)' : '';
    practiceToggleBtn.style.borderColor = practiceMode ? 'rgba(100,220,100,0.4)' : '';
    practiceToggleBtn.style.color = practiceMode ? '#88ffaa' : '';
  });
}

/* ---------- Auto Fire Toggle ---------- */
const autoFireToggleBtn = document.getElementById('autofire-toggle');
if (autoFireToggleBtn) {
  // load saved preference
  try {
    const saved = localStorage.getItem('stellar_defense_autofire');
    if (saved === 'true') {
      autoFire = true;
      autoFireToggleBtn.textContent = 'AUTO FIRE: ON';
      autoFireToggleBtn.classList.add('active');
      autoFireToggleBtn.style.background = 'rgba(80,120,160,0.25)';
      autoFireToggleBtn.style.borderColor = 'rgba(100,180,255,0.4)';
      autoFireToggleBtn.style.color = '#88ccff';
    }
  } catch (e) {}
  autoFireToggleBtn.addEventListener('click', () => {
    autoFire = !autoFire;
    autoFireToggleBtn.textContent = autoFire ? 'AUTO FIRE: ON' : 'AUTO FIRE: OFF';
    autoFireToggleBtn.classList.toggle('active', autoFire);
    autoFireToggleBtn.style.background = autoFire ? 'rgba(80,120,160,0.25)' : '';
    autoFireToggleBtn.style.borderColor = autoFire ? 'rgba(100,180,255,0.4)' : '';
    autoFireToggleBtn.style.color = autoFire ? '#88ccff' : '';
    try { localStorage.setItem('stellar_defense_autofire', autoFire); } catch (e) {}
  });
}

/* ---------- Reset Data ---------- */
const resetDataBtn = document.getElementById('reset-data-btn');
if (resetDataBtn) {
  resetDataBtn.addEventListener('click', () => {
    if (confirm('Reset all saved data? (high scores, achievements, stats, leaderboard)')) {
      try {
        localStorage.removeItem('stellar_defense_highscore');
        localStorage.removeItem('stellar_defense_achievements');
        localStorage.removeItem('stellar_defense_stats');
        localStorage.removeItem('stellar_defense_leaderboard');
        localStorage.removeItem('stellar_defense_encountered');
      } catch (e) {}
      highScore = 0;
      stats = { games: 0, kills: 0, bestWave: 0, deaths: 0, totalGraze: 0, totalTime: 0, highestCombo: 0, bossesDefeated: 0, weaponUses: { balanced: 0, spread: 0, rapid: 0, laser: 0, ricochet: 0 } };
      leaderboard = [];
      persistentEncountered = new Set();
      for (const k in ACHIEVEMENTS) ACHIEVEMENTS[k].unlocked = false;
      showMenu();
    }
  });
}

/* ---------- Screenshot ---------- */
function takeScreenshot() {
  sfxShutter();
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(W - 420, H - 30, 415, 24);
  ctx.fillStyle = '#aabbdd';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'right';
  const diffNames = { 1: 'Easy', 2: 'Normal', 3: 'Hard', 4: 'Nightmare' };
  ctx.fillText(`Stellar Defense v1.81.6 | ${diffNames[difficulty] || 'Normal'} | ${weaponType.charAt(0).toUpperCase() + weaponType.slice(1)} | Score: ${score.toLocaleString()} | Kills: ${stats.kills} | Wave: ${wave}`, W - 8, H - 14);
  ctx.restore();
  const link = document.createElement('a');
  link.download = `stellar-defense-w${wave}-${score}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
const screenshotBtn = document.getElementById('screenshot-btn');
if (screenshotBtn) {
  screenshotBtn.addEventListener('click', takeScreenshot);
}

/* ---------- Event Listeners ---------- */
// Global button click sound (excludes buttons with their own sfx)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  if (btn.closest('#weapon-select')) return; // has sfxWeaponSwitch
  if (btn.id === 'screenshot-btn') return; // has sfxShutter
  sfxClick();
});

document.getElementById('start-btn').addEventListener('click', () => {
  ensureAudio();
  resetGame();
  state = STATE.PLAYING;
  hideScreens();
});

document.getElementById('resume-btn').addEventListener('click', () => {
  state = STATE.PLAYING;
  hideScreens();
});

document.getElementById('restart-btn').addEventListener('click', () => {
  resetGame();
  state = STATE.PLAYING;
  hideScreens();
});

/* ---------- Main Loop ---------- */
let lastTime = 0;
let frameCount = 0;
let fpsTime = 0;

function loop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  frameCount++;
  if (timestamp - fpsTime >= 1000) {
    const fpsEl = document.getElementById('fps');
    if (fpsEl) {
      if (showFPS) {
        fpsEl.textContent = `FPS: ${frameCount}`;
        fpsEl.style.color = frameCount >= 55 ? '#44ff88' : frameCount >= 30 ? '#ffcc44' : '#ff4444';
      } else {
        fpsEl.textContent = '';
      }
    }
    frameCount = 0;
    fpsTime = timestamp;
  }

  // Score milestone check
  if (state === STATE.PLAYING) {
    const milestones = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
    for (const m of milestones) {
      if (score >= m && lastScoreMilestone < m) {
        lastScoreMilestone = m;
        sfxScoreMilestone(m);
        // score milestone particle burst
        const smColor = m >= 100000 ? '#ffcc44' : m >= 10000 ? '#ff88ff' : '#44aaff';
        const smCount = particleDensity === 0 ? 12 : particleDensity === 1 ? 20 : 30;
        for (let k = 0; k < smCount; k++) {
          const angle = rand(0, Math.PI * 2);
          const speed = rand(2, 6);
          particles.push({
            x: W / 2, y: H / 3,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: rand(25, 55),
            maxLife: 55,
            color: smColor,
            size: rand(2, 4),
            decay: 0.95,
          });
        }
        break;
      }
    }
  }

  // Volume shortcuts
  if (isDown('BracketLeft')) {
    keys['BracketLeft'] = false;
    volumeIndex = Math.max(0, volumeIndex - 1);
    masterVolume = volumeLevels[volumeIndex];
    volumeDisplayTimer = 120;
    sfxClick();
  }
  if (isDown('BracketRight')) {
    keys['BracketRight'] = false;
    volumeIndex = Math.min(3, volumeIndex + 1);
    masterVolume = volumeLevels[volumeIndex];
    volumeDisplayTimer = 120;
    sfxClick();
  }

  // Screenshot shortcut
  if (isDown('F2')) {
    keys['F2'] = false;
    takeScreenshot();
  }

  // Particle density shortcut
  if (isDown('Minus')) {
    keys['Minus'] = false;
    particleDensity = Math.max(0, particleDensity - 1);
    particleDisplayTimer = 120;
    sfxClick();
  }
  if (isDown('Equal')) {
    keys['Equal'] = false;
    particleDensity = Math.min(2, particleDensity + 1);
    particleDisplayTimer = 120;
    sfxClick();
  }

  // Color theme shortcut
  if (isDown('t') && state === STATE.PLAYING) {
    keys['t'] = false;
    colorTheme = (colorTheme + 1) % THEMES.length;
    themeDisplayTimer = 120;
    sfxClick();
  }

  // Auto fire toggle shortcut
  if (isDown('a') && state === STATE.PLAYING) {
    keys['a'] = false;
    autoFire = !autoFire;
    autoFireDisplayTimer = 120;
    sfxClick();
    try { localStorage.setItem('stellar_defense_autofire', autoFire); } catch (e) {}
  }

  // Music toggle shortcut
  if (isDown('m') && state === STATE.PLAYING) {
    keys['m'] = false;
    musicEnabled = !musicEnabled;
    musicDisplayTimer = 120;
    sfxClick();
  }

  // FPS display toggle shortcut
  if (isDown('F3')) {
    keys['F3'] = false;
    showFPS = !showFPS;
    fpsDisplayTimer = 120;
    sfxClick();
  }

  // Fullscreen toggle shortcut
  if (isDown('F4')) {
    keys['F4'] = false;
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      elem.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    fullscreenDisplayTimer = 120;
    sfxClick();
  }

  // Help overlay shortcut
  if (isDown('h') && state === STATE.PLAYING && helpOverlayTimer <= 0) {
    keys['h'] = false;
    helpOverlayTimer = 300; // 5 seconds
    sfxClick();
  } else if (isDown('h') && state === STATE.PLAYING && helpOverlayTimer > 0) {
    keys['h'] = false;
    helpOverlayTimer = 0;
  }

  // Input for pause
  if (isDown('p') && state === STATE.PLAYING) {
    keys['p'] = false;
    state = STATE.PAUSED;
    sfxPause();
    showPause();
  } else if (isDown('p') && state === STATE.PAUSED) {
    keys['p'] = false;
    state = STATE.PLAYING;
    sfxResume();
    hideScreens();
  }
  // Quick restart from game over
  if (isDown('r') && state === STATE.GAMEOVER) {
    keys['r'] = false;
    resetGame();
    state = STATE.PLAYING;
    hideScreens();
  }
  // Reward selection input
  if (rewardSelectActive && state === STATE.PLAYING) {
    if (isDown('1')) { keys['1'] = false; applyReward(0); }
    if (isDown('2')) { keys['2'] = false; applyReward(1); }
    if (isDown('3')) { keys['3'] = false; applyReward(2); }
  }
  // Return to menu from game over
  if (isDown('escape') && state === STATE.GAMEOVER) {
    keys['escape'] = false;
    state = STATE.MENU;
    if (engineGainNode && audioCtx) engineGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
    showMenu();
  }

  // clear
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  // shake
  ctx.save();
  if (shake > 0) {
    const directed = 0.7;
    const randomAmt = 0.3;
    const sx = shakeDirX * shake * directed + (Math.random() - 0.5) * shake * randomAmt;
    const sy = shakeDirY * shake * directed + (Math.random() - 0.5) * shake * randomAmt;
    ctx.translate(sx, sy);
    shake *= 0.9;
    if (shake < 0.5) {
      shake = 0;
      shakeDirX = 0;
      shakeDirY = 0;
    }
  }

  drawPlanets();
  drawStars();
  drawNebulae();
  drawAsteroids();
  drawMeteors();

  const timeScale = deathSlowMo > 0 ? 0.15 : (slowMo > 0 ? 0.4 : 1.0);
  // frame skip for 30fps mode
  if (targetFPS === 30) {
    skipFrame = !skipFrame;
    if (skipFrame) {
      drawPlanets();
      drawPlanets();
      drawStars();
      drawNebulae();
      drawAsteroids();
      drawPlayer();
      drawEnemies();
      drawBullets(bullets);
      drawBullets(enemyBullets);
      drawPowerups();
      drawTouchControls();
      drawParticles();
      drawShockwaves();
      drawTexts();
      drawWaveBorder();
      drawWarnings();
      drawDangerZone();
      drawComboGuardFlash();
      drawComboFlash();
      drawDamageFlash();
      drawLowHPWarning();
      drawBossWarning();
      if (bombAnim > 0) drawBombEffect();
      drawBossUI();
      ctx.restore();
      drawWaveClear();
      drawUI();
      requestAnimationFrame(loop);
      return;
    }
  }

  if (state === STATE.PLAYING) {
    if (rewardSelectActive) {
      drawStars();
      drawNebulae();
      drawPlanets();
      drawAsteroids();
      drawPlayer();
      drawEnemies();
      drawBullets(bullets);
      drawBullets(enemyBullets);
      drawPowerups();
      drawTouchControls();
      drawParticles();
      drawShockwaves();
      drawTexts();
      drawWaveBorder();
      drawWarnings();
      drawDangerZone();
      drawComboGuardFlash();
      drawComboFlash();
      drawDamageFlash();
      drawLowHPWarning();
      drawBossWarning();
      if (bombAnim > 0) drawBombEffect();
      drawBossUI();
      drawRewardSelect();
      ctx.restore();
      drawWaveClear();
      drawUI();
      requestAnimationFrame(loop);
      return;
    }
    if (hitstop > 0) {
      hitstop -= timeScale;
      drawStars();
      drawNebulae();
      drawAsteroids();
      drawPlayer();
      drawEnemies();
      drawBullets(bullets);
      drawBullets(enemyBullets);
      drawPowerups();
      drawTouchControls();
      drawParticles();
      drawShockwaves();
      drawTexts();
      drawWaveBorder();
      drawWarnings();
      drawDangerZone();
      drawComboGuardFlash();
      drawComboFlash();
      drawDamageFlash();
      drawLowHPWarning();
      drawBossWarning();
      if (bombAnim > 0) drawBombEffect();
      drawBossUI();
      ctx.restore();
      drawWaveClear();
      drawUI();
      requestAnimationFrame(loop);
      return;
    }
    if (slowMo > 0) slowMo -= timeScale;
    if (deathSlowMo > 0) {
      deathSlowMo -= 1;
      if (deathSlowMo <= 0) deathSlowMo = 0;
    }
    if (timeStopTimer > 0) timeStopTimer -= timeScale;
    stats.totalTime += dt / 1000;
    updatePlayer();
    if (timeStopTimer <= 0) {
      updateEnemies(timeScale);
      updateBullets(bullets, timeScale);
      updateBullets(enemyBullets, timeScale);
      updatePowerups(timeScale);
      checkCollisions();
    }
    updatePlanets(timeScale);
    updateAsteroids(timeScale);
    updateMeteors(timeScale);
    updateParticles();
    updateShockwaves(timeScale);
    waveLogic();

    // Achievement notifications
    if (!activeNotification && achievementNotifications.length > 0) {
      activeNotification = achievementNotifications.shift();
      notificationTimer = 300; // 5 seconds @ 60fps
    }
    if (activeNotification) {
      notificationTimer -= timeScale;
      if (notificationTimer <= 0) activeNotification = null;
    }

    if (waveClearTimer > 0) waveClearTimer -= timeScale;

    if (comboTimer > 0) {
      comboTimer -= timeScale;
      if (comboTimer <= 0) {
        if (combo > 1) sfxComboBreak();
        combo = 0;
      }
    }
    if (grazeTimer > 0) grazeTimer -= timeScale;
    if (damageFlash > 0) damageFlash -= timeScale;
    if (encounterTimer > 0) encounterTimer -= timeScale;
    // combo sustain bonus
    if (combo >= 10 && state === STATE.PLAYING) {
      score += Math.floor(combo * 0.05 * timeScale * scoreMultBonus);
    }
  }

  playMusicStep();

  if (state === STATE.MENU) {
    updatePlanets(1);
    updateAsteroids(1);
    updateMeteors(1);
    drawPlanets();
    drawStars();
    drawNebulae();
    drawAsteroids();
    drawMeteors();
  }

  if (state === STATE.PAUSED) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, W, H);
    // vignette effect
    const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  if (waveFlash > 0) {
    ctx.save();
    ctx.globalAlpha = (waveFlash / 20) * 0.15;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    waveFlash--;
  }
  if (comboBurstFlash > 0) {
    ctx.save();
    ctx.globalAlpha = (comboBurstFlash / 30) * 0.25;
    ctx.fillStyle = '#ffee88';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    comboBurstFlash--;
  }
  // Wave alert border pulse
  if (waveAlertTimer > 0) {
    ctx.save();
    const alertProgress = 1 - waveAlertTimer / (waveAlertType === 'boss' ? 120 : 90);
    const pulse = 0.5 + 0.5 * Math.sin(waveAlertTimer * 0.2);
    const alpha = (1 - alertProgress) * 0.4 * pulse;
    const color = waveAlertType === 'boss' ? '#3366ff' : '#ff3333';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 + pulse * 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15 * pulse;
    ctx.globalAlpha = alpha;
    ctx.strokeRect(6, 6, W - 12, H - 12);
    ctx.restore();
    waveAlertTimer--;
  }
  if (tutorialActive) drawTutorialHint();
  if (encounterText && encounterTimer > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, encounterTimer / 30);
    ctx.fillStyle = '#ffee88';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FIRST ENCOUNTER', W / 2, H / 2 - 30);
    ctx.fillStyle = '#aabbdd';
    ctx.font = '14px sans-serif';
    ctx.fillText(encounterText, W / 2, H / 2);
    ctx.restore();
  }
  drawTimeStopEffect();
  drawWaveBorder();
  drawWarnings();
  drawDangerZone();
  drawDamageFlash();
  drawLowHPWarning();
  drawBossWarning();
  if (bombAnim > 0) drawBombEffect();
  drawBossUI();
  drawPlayer();
  drawEnemies();
  drawBullets(bullets);
  drawBullets(enemyBullets);
  drawPowerups();
  drawTouchControls();
  drawParticles();
  drawShockwaves();
  drawTexts();

  ctx.restore();

  drawWaveClear();
  drawUI();
  drawTutorial();

  requestAnimationFrame(loop);
}

function drawTutorial() {
  if (state !== STATE.PLAYING) return;
  const tips = {
    1: 'WASD / Arrows to move  ·  Space to shoot',
    2: 'Press B to use Bomb (clear screen)',
    3: 'Graze enemy bullets for bonus points!',
    4: 'Build combo for score multiplier!',
    5: 'Press K or X to Dash while moving',
  };
  const tip = tips[wave];
  if (!tip || tutorialStepsShown.has(wave)) return;
  // show tip
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = 'rgba(20, 30, 60, 0.8)';
  ctx.fillRect(W / 2 - 200, H - 70, 400, 28);
  ctx.strokeStyle = 'rgba(100, 150, 255, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(W / 2 - 200, H - 70, 400, 28);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#aaccff';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(tip, W / 2, H - 51);
  ctx.restore();
  // dismiss on input
  if (isDown(' ') || isDown('j') || isDown('b') || isDown('k') || isDown('x')) {
    tutorialStepsShown.add(wave);
  }
}
function drawWaveClear() {
  if (waveClearTimer <= 0) return;
  const t = waveClearTimer;
  const maxT = 180;
  let alpha = 1;
  let scale = 1;
  if (t > maxT - 20) {
    alpha = (maxT - t) / 20;
    scale = 0.7 + 0.3 * alpha;
  } else if (t < 40) {
    alpha = t / 40;
    scale = 1 + (1 - alpha) * 0.2;
  }
  alpha = Math.max(0, Math.min(1, alpha));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';

  const cy = H / 2 - 30;

  // Main text
  ctx.font = `bold ${Math.floor(28 * scale)}px monospace`;
  ctx.fillStyle = waveClearIsBoss ? '#ff4444' : '#44aaff';
  const label = waveClearIsBoss ? 'BOSS DEFEATED!' : `WAVE ${waveClearWave} CLEARED!`;
  ctx.fillText(label, W / 2, cy);

  // Glow outline
  ctx.lineWidth = 2;
  ctx.strokeStyle = waveClearIsBoss ? 'rgba(255,68,68,0.4)' : 'rgba(68,170,255,0.4)';
  ctx.strokeText(label, W / 2, cy);

  // Perfect subtext
  if (waveClearPerfect) {
    ctx.font = `bold ${Math.floor(16 * scale)}px monospace`;
    ctx.fillStyle = '#ffee44';
    ctx.fillText('PERFECT!', W / 2, cy + 26);
    ctx.strokeStyle = 'rgba(255,238,68,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeText('PERFECT!', W / 2, cy + 26);
  }

  // Bonus particles on first frame
  if (t >= maxT - 1 && t <= maxT) {
    const count = particleDensity === 0 ? 20 : particleDensity === 1 ? 35 : 50;
    const baseColor = waveClearIsBoss ? '#ff4444' : waveClearPerfect ? '#ffee44' : '#44aaff';
    for (let k = 0; k < count; k++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(2, 6);
      particles.push({
        x: W / 2, y: cy,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: rand(40, 80),
        maxLife: 80,
        color: k % 3 === 0 ? '#ffffff' : baseColor,
        size: rand(2, 5),
        decay: 0.96,
      });
    }
    shake = Math.max(shake, waveClearIsBoss ? 10 : waveClearPerfect ? 6 : 3);
    shakeDirX = 0;
    shakeDirY = -1;
  }

  ctx.restore();
}

/* ---------- URL Score Sharing ---------- */
function parseSharedScore() {
  const params = new URLSearchParams(window.location.search);
  const s = parseInt(params.get('score'), 10);
  const w = parseInt(params.get('wave'), 10);
  if (s && w) {
    const el = document.getElementById('menu-highscore');
    if (el) {
      el.innerHTML = `High Score: ${highScore.toLocaleString()} <span style="color:#88aaff; font-size:12px;">(Shared: ${s.toLocaleString()} W${w})</span>`;
    }
  }
}
function setSharedScore(score, wave) {
  const url = new URL(window.location.href);
  url.searchParams.set('score', score);
  url.searchParams.set('wave', wave);
  window.history.replaceState({}, '', url);
}

/* ---------- Leaderboard Filter ---------- */
document.querySelectorAll('.lb-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lb-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    leaderboardFilter = parseInt(btn.dataset.filter, 10);
    updateLeaderboardUI();
  });
});

/* ---------- Start ---------- */
initStars();
parseSharedScore();
showMenu();
requestAnimationFrame(loop);
