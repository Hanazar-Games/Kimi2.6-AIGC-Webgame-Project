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
function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new AudioCtx();
    musicNextTime = audioCtx.currentTime;
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
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
  if (weaponType === 'rapid') {
    playTone(1200, 'square', 0.06, 0.03);
  } else if (weaponType === 'spread') {
    playTone(600, 'sawtooth', 0.1, 0.05);
  } else if (weaponType === 'laser') {
    playTone(2000, 'sawtooth', 0.08, 0.06);
  } else {
    playTone(880, 'square', 0.08, 0.04);
  }
}
function sfxEnemyShoot() { playTone(220, 'sawtooth', 0.1, 0.03); }
function sfxHit() { playTone(150, 'sawtooth', 0.15, 0.06); }
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
function sfxHurt() { playTone(120, 'sawtooth', 0.25, 0.08); }
function sfxWaveStart() {
  playTone(440, 'square', 0.15, 0.05);
  playTone(554, 'square', 0.15, 0.05);
  playTone(659, 'square', 0.2, 0.05);
}
function sfxUpgrade() {
  playTone(523, 'sine', 0.1, 0.07);
  playTone(659, 'sine', 0.1, 0.07);
  playTone(784, 'sine', 0.15, 0.07);
  playTone(1047, 'sine', 0.2, 0.07);
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
let wave = 1;
let combo = 0;
let comboTimer = 0;
let shake = 0;
let slowMo = 0;
let difficulty = 2; // 1=easy, 2=normal, 3=hard
let bombCooldown = 0;
let bombAnim = 0;
let grazeCount = 0;
let grazeTimer = 0;
let dashCooldown = 0;
let dashing = 0;
let damageFlash = 0;
let gameStartTime = 0;
let comboGuard = true;
let comboScale = 1;
let particleDensity = 2; // 0=low, 1=medium, 2=high
let colorTheme = 0;
let masterVolume = 1.0;
let showFPS = true;
let waveFlash = 0;
let timeStopTimer = 0;
let targetFPS = 60;
let skipFrame = false;
let tutorialActive = false;
let tutorialDismissed = false;
let weaponType = 'balanced'; // 'balanced', 'spread', 'rapid', 'laser'
let encounteredTypes = new Set();
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
  } catch (e) {}
}
function saveHighScore() {
  try {
    localStorage.setItem('stellar_defense_highscore', String(highScore));
  } catch (e) {}
}
loadHighScore();

/* ---------- Leaderboard ---------- */
let leaderboard = [];
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
  leaderboard.push({ score, wave, date: new Date().toLocaleDateString() });
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 5);
  saveLeaderboard();
}
loadLeaderboard();

/* ---------- Stats ---------- */
let stats = { games: 0, kills: 0, bestWave: 0, deaths: 0, totalGraze: 0, totalTime: 0, highestCombo: 0, bossesDefeated: 0, weaponUses: { balanced: 0, spread: 0, rapid: 0 } };
function loadStats() {
  try {
    const v = localStorage.getItem('stellar_defense_stats');
    if (v) stats = JSON.parse(v);
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
  weapon_master: { name: 'Weapon Master', desc: 'Use all 3 weapons in one run', unlocked: false },
  bomb_saver: { name: 'Bomb Saver', desc: 'Clear a wave without using bombs', unlocked: false },
  graze_king: { name: 'Graze King', desc: 'Graze 200 bullets in one run', unlocked: false },
  marathon: { name: 'Marathon', desc: 'Reach Wave 20', unlocked: false },
  millionaire: { name: 'Millionaire', desc: 'Score 1,000,000 points', unlocked: false },
  piercing_shot: { name: 'Piercing Shot', desc: 'Hit 3 enemies with one laser', unlocked: false },
  boss_hunter: { name: 'Boss Hunter', desc: 'Defeat 5 Bosses', unlocked: false },
  nightmare_survivor: { name: 'Nightmare Survivor', desc: 'Reach Wave 10 on Nightmare', unlocked: false },
};
let noDamageWaves = 0;
let damageTakenThisWave = false;
let usedWeapons = new Set();
let bombsUsedThisWave = 0;

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
function saveAchievements() {
  try {
    const obj = {};
    for (const k in ACHIEVEMENTS) obj[k] = ACHIEVEMENTS[k].unlocked;
    localStorage.setItem('stellar_defense_achievements', JSON.stringify(obj));
  } catch (e) {}
}
function unlockAchievement(key) {
  const a = ACHIEVEMENTS[key];
  if (a && !a.unlocked) {
    a.unlocked = true;
    saveAchievements();
    spawnFloatingText(W / 2, H / 2 - 60, `Achievement: ${a.name}`, '#ffcc44');
    spawnFloatingText(W / 2, H / 2 - 40, a.desc, '#ffee88');
    shake = Math.max(shake, 8);
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
  for (const k in ACHIEVEMENTS) {
    const a = ACHIEVEMENTS[k];
    const el = document.createElement('div');
    el.className = 'achievement' + (a.unlocked ? ' unlocked' : '');
    el.textContent = a.unlocked ? `✓ ${a.name}` : `? ${a.name}`;
    el.title = a.desc;
    list.appendChild(el);
  }
}
function updateLeaderboardUI(highlightIndex = -1) {
  const ids = ['leaderboard-list', 'leaderboard-menu-list'];
  for (const id of ids) {
    const list = document.getElementById(id);
    if (!list) continue;
    list.innerHTML = '';
    if (leaderboard.length === 0) {
      list.innerHTML = '<div style="color:#556688; font-size:11px;">No scores yet</div>';
      continue;
    }
    leaderboard.forEach((entry, i) => {
      const el = document.createElement('div');
      const isHighlight = i === highlightIndex;
      el.style.cssText = `color:${isHighlight ? '#ffcc44' : '#aabbdd'}; font-size:11px; margin:2px 0; font-weight:${isHighlight ? '700' : '400'};`;
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
      el.textContent = `${medal} ${entry.score.toLocaleString()} (W${entry.wave})`;
      list.appendChild(el);
    });
  }
}
loadAchievements();

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
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 2.5 + 0.3,
      speed: Math.random() * 1.5 + 0.1,
      alpha: Math.random() * 0.7 + 0.15,
      layer: Math.random() < 0.3 ? 2 : 1,
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
  texts.push({ x, y, txt, color, life: 45, maxLife: 45, vy: -1 });
}

/* ---------- Bullet Factory ---------- */
function spawnBullet(x, y, angle, speed, color, isEnemy = false, radius = 3) {
  const arr = isEnemy ? enemyBullets : bullets;
  const limit = isEnemy ? 500 : 200;
  if (arr.length >= limit) arr.shift();
  arr.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color, radius, isEnemy });
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
function bomberExplode(e) {
  const radius = 50;
  spawnExplosion(e.x, e.y, '#ff5522', 25, true);
  spawnFloatingText(e.x, e.y - 20, 'BOOM!', '#ff5522');
  shake = Math.max(shake, 8);
  if (player.invincible <= 0 && dist(e, player) < radius + player.radius) {
    player.hp -= practiceMode ? 0 : 12;
    player.invincible = 60;
    damageFlash = 10;
    shake = Math.max(shake, 12);
    damageTakenThisWave = true;
    sfxHurt();
    if (player.hp <= 0) {
      if (combo >= 10 && comboGuard) {
        comboGuard = false;
        player.hp = 1;
        combo = 0;
        comboTimer = 0;
        player.invincible = 120;
        spawnFloatingText(player.x, player.y - 30, 'COMBO GUARD!', '#ff44ff');
        sfxPowerup();
      } else {
        player.hp = 0;
        deathSlowMo = 90;
        state = STATE.GAMEOVER;
        if (score > highScore) { highScore = score; saveHighScore(); }
        stats.totalGraze += grazeCount;
        updateStats(true);
        showGameOver();
      }
    }
  }
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
};
let bossFirstEncounter = { alpha: false, beta: false };

function spawnEnemy(type) {
  const side = Math.floor(rand(0, 3));
  let x, y;
  if (side === 0) { x = rand(30, W - 30); y = -20; }
  else if (side === 1) { x = W + 20; y = rand(30, H * 0.6); }
  else { x = -20; y = rand(30, H * 0.6); }

  const eliteRate = difficulty === 4 ? 0.15 : 0.08;
  const isElite = type !== 'swarmer' && Math.random() < (type === 'boss' ? 0.15 : eliteRate);

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
  };

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
  if (usedWeapons.size >= 3) unlockAchievement('weapon_master');
  if (bombsUsedThisWave === 0 && wave > 1) unlockAchievement('bomb_saver');
  if (grazeCount >= 200) unlockAchievement('graze_king');
  if (wave >= 20) unlockAchievement('marathon');
  if (score >= 1000000) unlockAchievement('millionaire');
  if (difficulty === 4 && wave >= 10) unlockAchievement('nightmare_survivor');
}

function startWave() {
  waveFlash = 20;
  bombsUsedThisWave = 0;
  // check no-damage streak for Untouchable achievement
  if (wave > 1 && !damageTakenThisWave) {
    noDamageWaves++;
    if (noDamageWaves >= 5) unlockAchievement('untouchable');
    const perfectBonus = 500 + wave * 100;
    score += perfectBonus;
    spawnFloatingText(W / 2, H / 2 + 30, `PERFECT! +${perfectBonus}`, '#ffcc44');
    sfxPowerup();
  } else if (damageTakenThisWave) {
    noDamageWaves = 0;
    // wave clear bonus based on remaining HP
    const hpBonus = Math.floor((player.hp / player.maxHp) * (100 + wave * 20));
    if (hpBonus > 0) {
      score += hpBonus;
      spawnFloatingText(W / 2, H / 2 + 30, `Wave Clear +${hpBonus}`, '#44aaff');
    }
  }
  waveTimer = 0;
  bossSpawned = false;
  const count = 4 + Math.floor(wave * 1.6);
  enemiesToSpawn = count;
  spawnTimer = 0;
  warnings.length = 0;
  damageTakenThisWave = false;
  sfxWaveStart();
  spawnFloatingText(W / 2, H / 2, `WAVE ${wave}`, '#44aaff');
  checkAchievements();
}

function useBomb() {
  player.bombs--;
  bombsUsedThisWave++;
  bombCooldown = 30;
  bombAnim = 40;
  shake = 20;
  slowMo = 45;
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
    e.hp -= 40;
    spawnHitSparks(e.x, e.y, e.color);
    if (e.hp <= 0) {
      const pts = Math.floor(e.score * (1 + combo * 0.1));
      score += pts;
      combo++;
      comboTimer = 180;
      comboScale = 1.4;
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
      const warnColor = type === 'bomber' ? '#ff4444' : type === 'shielder' ? '#44ddaa' : type === 'medic' ? '#44ff88' : type === 'splitter' ? '#cc44ff' : '#ffcc44';
      warnings.push({ x: wx, y: wy, angle: wa, life: 45, color: warnColor });
    }
    if (spawnTimer <= 0) {
      spawnTimer = Math.max(18, 55 - wave * 3);
      const roll = Math.random();
      let type = 'drone';
      if (wave >= 2 && roll < 0.20) type = 'swarmer';
      if (wave >= 3 && roll < 0.28) type = 'hunter';
      if (wave >= 4 && roll < 0.12) type = 'sniper';
      if (wave >= 5 && roll < 0.18) type = 'tank';
      if (wave >= 6 && roll < 0.25) type = 'splitter';
      if (wave >= 7 && roll < 0.30) type = 'bomber';
      if (wave >= 8 && roll < 0.22) type = 'shielder';
      if (wave >= 9 && roll < 0.28) type = 'medic';
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
      wave++;
      checkWaveAchievements();
      startWave();
    }
  } else if (bossSpawned && enemies.length === 0) {
    wave++;
    checkWaveAchievements();
    startWave();
  }
}

/* ---------- Player Logic ---------- */
function updatePlayer() {
  const focus = isDown('shift') || touchFocusBtn;
  const speed = focus ? player.focusSpeed : player.speed;

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

  if (mx !== 0 || my !== 0) {
    player.angle = Math.atan2(my, mx);
    // engine trail particles
    if (Math.random() < 0.5) {
      const theme = THEMES[colorTheme];
      const backAngle = player.angle + Math.PI;
      particles.push({
        x: player.x + Math.cos(backAngle) * 8 + rand(-3, 3),
        y: player.y + Math.sin(backAngle) * 8 + rand(-3, 3),
        vx: Math.cos(backAngle) * rand(0.5, 1.5) + rand(-0.3, 0.3),
        vy: Math.sin(backAngle) * rand(0.5, 1.5) + rand(-0.3, 0.3),
        life: rand(6, 14),
        maxLife: 14,
        color: theme.engine,
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

  player.shootCooldown--;
  const shooting = isDown(' ') || isDown('j') || touchShootBtn;
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
    if (b.laser) {
      b.life -= timeScale;
      if (b.life <= 0) {
        arr.splice(i, 1);
        continue;
      }
    }
    if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) {
      arr.splice(i, 1);
    }
  }
}

/* ---------- Power-up Logic ---------- */
function updatePowerups(timeScale = 1) {
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    p.x += p.vx * timeScale;
    p.y += p.vy * timeScale;
    p.angle += 0.04 * timeScale;
    p.life -= timeScale;

    if (p.life <= 0 || p.y > H + 30) {
      powerups.splice(i, 1);
      continue;
    }

    if (dist(p, player) < p.radius + player.radius + 6) {
      if (p.type === 'energy') {
        player.hp = clamp(player.hp + 20, 0, player.maxHp);
        spawnFloatingText(player.x, player.y - 20, '+HP', '#44ff66');
        sfxPowerup();
      } else if (p.type === 'power') {
        player.powerLevel = clamp(player.powerLevel + 1, 1, player.maxPower);
        spawnFloatingText(player.x, player.y - 20, 'POWER UP!', '#ffcc44');
        sfxUpgrade();
      } else if (p.type === 'shield') {
        player.invincible = Math.max(player.invincible, 300);
        spawnFloatingText(player.x, player.y - 20, 'SHIELD!', '#44aaff');
        sfxPowerup();
      } else if (p.type === 'timestop') {
        timeStopTimer = 180;
        spawnFloatingText(player.x, player.y - 20, 'TIME STOP!', '#ff88ff');
        sfxUpgrade();
      }
      powerups.splice(i, 1);
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
      if (dist(b, e) < e.radius + b.radius) {
        if (b.laser && b.hitTimer > 0) continue;
        if (!b.laser) bullets.splice(i, 1);
        if (b.laser) {
          b.hitTimer = 4;
          b.hitCount = (b.hitCount || 0) + 1;
          if (b.hitCount >= 3) unlockAchievement('piercing_shot');
        }
        let dmg = b.laser ? (b.damage || 10) : (5 + player.powerLevel);
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
        // knockback
        const kbAngle = Math.atan2(b.vy, b.vx);
        const kbForce = 0.8;
        e.vx += Math.cos(kbAngle) * kbForce;
        e.vy += Math.sin(kbAngle) * kbForce;
        spawnHitSparks(b.x, b.y, e.color);
        e.hitFlash = 4;
        shake = Math.max(shake, 2);
        hitstop = 3;
        if (e.hp <= 0) {
          const pts = Math.floor(e.score * (1 + combo * 0.1));
          score += pts;
          combo++;
          comboTimer = 180;
          if (combo === 10 || combo === 25 || combo === 50 || combo === 100) {
            spawnFloatingText(W / 2, H / 2 - 40, `COMBO x${combo}!`, '#ff44ff');
            shake = Math.max(shake, 6);
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
              sfxPowerup();
            }
          }
          spawnExplosion(e.x, e.y, e.color, 20, true);
          if (e.elite) spawnFloatingText(e.x, e.y - 15, 'ELITE!', '#ffee88');
          spawnFloatingText(e.x, e.y, `+${pts}`, '#ffcc44');
          sfxExplosion();
          // drop powerup chance
          if (Math.random() < 0.12) spawnPowerup(e.x, e.y);
          unlockAchievement('first_blood');
          if (e.type === 'boss') {
            unlockAchievement('boss_slayer');
            if (e.elite) unlockAchievement('elite_slayer');
            stats.bossesDefeated++;
            if (stats.bossesDefeated >= 5) unlockAchievement('boss_hunter');
            // boss defeat spectacle
            spawnExplosion(e.x, e.y, e.color, 40, true);
            spawnExplosion(e.x, e.y, '#ffee88', 25, true);
            spawnFloatingText(W / 2, H / 2 - 60, 'BOSS DEFEATED!', '#ffee44');
            shake = Math.max(shake, 20);
            damageFlash = 10;
            sfxExplosion();
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
          stats.kills++;
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
          }
          sfxGraze();
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
        damageFlash = 15;
        damageTakenThisWave = true;
        spawnExplosion(player.x, player.y, '#44aaff', 16);
        sfxHurt();
        if (player.hp <= 0) {
          if (combo >= 10 && comboGuard) {
            comboGuard = false;
            player.hp = 1;
            combo = 0;
            comboTimer = 0;
            player.invincible = 120;
            spawnFloatingText(player.x, player.y - 30, 'COMBO GUARD!', '#ff44ff');
            sfxPowerup();
          } else {
            player.hp = 0;
            state = STATE.GAMEOVER;
            if (score > highScore) { highScore = score; saveHighScore(); }
            stats.totalGraze += grazeCount;
            updateStats(true);
            showGameOver();
          }
        }
      }
    }
  }

  // enemies vs player (collision)
  if (player.invincible <= 0) {
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (dist(e, player) < e.radius + player.radius) {
        player.hp -= practiceMode ? 0 : 15;
        combo = Math.max(0, combo - 3);
        comboTimer = 0;
        player.invincible = 90;
        shake = 14;
        damageFlash = 15;
        damageTakenThisWave = true;
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
            sfxPowerup();
          } else {
            player.hp = 0;
            state = STATE.GAMEOVER;
            if (score > highScore) { highScore = score; saveHighScore(); }
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
    s.y += s.speed * (s.layer === 2 ? 0.5 : 1);
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

function drawPlayer() {
  const theme = THEMES[colorTheme];
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle + Math.PI / 2);

  const flash = player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 0;
  ctx.globalAlpha = flash ? 0.4 : 1;

  // shield ring
  if (player.invincible > 120) {
    ctx.strokeStyle = `rgba(68,170,255,${0.3 + Math.sin(Date.now() * 0.01) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  // glow
  ctx.shadowBlur = 15;
  ctx.shadowColor = theme.glow;

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
    ctx.shadowBlur = 10;
    ctx.shadowColor = e.color;

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

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

function drawBullets(arr) {
  for (const b of arr) {
    ctx.save();
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
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.rotate(w.angle);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = w.color || '#ffcc44';
    ctx.shadowBlur = 8;
    ctx.shadowColor = w.color || '#ffcc44';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(6, 4);
    ctx.lineTo(0, 2);
    ctx.lineTo(-6, 4);
    ctx.closePath();
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
}

function drawDamageFlash() {
  if (damageFlash > 0) {
    const alpha = (damageFlash / 15) * 0.3;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // red border flash
    ctx.save();
    ctx.globalAlpha = alpha * 1.5;
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, W - 4, H - 4);
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
    ctx.save();
    ctx.strokeStyle = `rgba(255,136,255,${pulse})`;
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, W - 8, H - 8);
    ctx.fillStyle = `rgba(200,100,255,${pulse * 0.15})`;
    ctx.fillRect(0, 0, W, H);
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
    // heartbeat sound
    lowHPTimer++;
    if (lowHPTimer >= 60) {
      lowHPTimer = 0;
      playTone(120, 'sine', 0.12, 0.08);
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
    const scale = 1 + Math.sin(progress * Math.PI) * 0.3;
    ctx.globalAlpha = t.life / t.maxLife;
    ctx.fillStyle = t.color;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.scale(scale, scale);
    ctx.fillText(t.txt, 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'start';
}

function drawBossUI() {
  const boss = enemies.find(e => e.type === 'boss');
  if (!boss || boss.introTimer > 0) return;
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
  document.getElementById('score').textContent = `SCORE: ${score.toLocaleString()} (x${mult})`;
  const totalSpawned = enemiesToSpawn + enemies.length;
  const waveProgress = totalSpawned > 0 ? Math.floor(((totalSpawned - enemiesToSpawn) / totalSpawned) * 100) : 0;
  document.getElementById('wave').textContent = `WAVE: ${wave} (${waveProgress}%)`;
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
  const grazeEl = document.getElementById('graze');
  if (grazeEl) {
    grazeEl.textContent = `GRAZE: ${grazeCount}`;
    grazeEl.style.color = grazeTimer > 0 ? '#ff88ff' : '#e0e0ff';
  }
  document.getElementById('health-text').textContent = `HP: ${Math.max(0, player.hp)}/${player.maxHp}`;
  const hpPct = Math.max(0, player.hp) / player.maxHp * 100;
  document.getElementById('health-fill').style.width = hpPct + '%';
  const bombEl = document.getElementById('bomb-count');
  if (bombEl) bombEl.textContent = `BOMB: ${player.bombs}`;
  const dashEl = document.getElementById('dash-status');
  if (dashEl) {
    if (dashing > 0) {
      dashEl.textContent = 'DASHING';
      dashEl.style.color = '#aaddff';
    } else if (dashCooldown > 0) {
      dashEl.textContent = `DASH: ${Math.ceil(dashCooldown / 60)}s`;
      dashEl.style.color = '#556688';
    } else {
      dashEl.textContent = 'DASH READY';
      dashEl.style.color = '#88aaff';
    }
  }
}

/* ---------- Screens ---------- */
function showMenu() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('menu-screen').classList.add('active');
  const el = document.getElementById('menu-highscore');
  if (el) el.textContent = `High Score: ${highScore.toLocaleString()}`;
  updateAchievementUI();
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
  if (killsEl) killsEl.textContent = `Kills: ${stats.kills}`;
  if (grazeEl) grazeEl.textContent = `Graze: ${grazeCount}`;
}

function showGameOver() {
  document.getElementById('gameover-screen').classList.add('active');
  animateGameOverStats();
  document.getElementById('final-wave').textContent = `Wave: ${wave}`;
  const hsEl = document.getElementById('final-highscore');
  if (hsEl) hsEl.textContent = `High Score: ${highScore.toLocaleString()}`;
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
  const fwEl = document.getElementById('final-weapon');
  if (fwEl) {
    const wname = weaponType.charAt(0).toUpperCase() + weaponType.slice(1);
    fwEl.textContent = `Weapon: ${wname}`;
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
  damageFlash = 0;
  hitstop = 0;
  waveFlash = 0;
  timeStopTimer = 0;
  deathSlowMo = 0;

  score = 0;
  wave = 1;
  combo = 0;
  comboTimer = 0;
  shake = 0;
  grazeCount = 0;
  grazeTimer = 0;
  noDamageWaves = 0;
  damageTakenThisWave = false;
  musicBeat = 0;
  if (audioCtx) musicNextTime = audioCtx.currentTime;
  encounteredTypes.clear();
  encounterText = null;
  encounterTimer = 0;
  bossFirstEncounter = { alpha: false, beta: false };
  usedWeapons.clear();
  bombsUsedThisWave = 0;
  gameStartTime = Date.now();
  comboGuard = true;
  tutorialActive = !tutorialDismissed;
  tutorialDismissed = true;

  initStars();
  startWave();
}

/* ---------- Difficulty Selection ---------- */
document.querySelectorAll('#difficulty-select .diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#difficulty-select .diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    difficulty = parseInt(btn.dataset.diff, 10);
  });
});

/* ---------- Weapon Selection ---------- */
document.querySelectorAll('#weapon-select .weapon-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#weapon-select .weapon-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    weaponType = btn.dataset.weapon;
    try { localStorage.setItem('stellar_defense_weapon', weaponType); } catch (e) {}
  });
});
function loadWeapon() {
  try {
    const v = localStorage.getItem('stellar_defense_weapon');
    if (v && ['balanced', 'spread', 'rapid', 'laser'].includes(v)) {
      weaponType = v;
      document.querySelectorAll('#weapon-select .weapon-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.weapon === v);
      });
    }
  } catch (e) {}
}
loadWeapon();

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
      } catch (e) {}
      highScore = 0;
      stats = { games: 0, kills: 0, bestWave: 0, deaths: 0, totalGraze: 0, totalTime: 0, highestCombo: 0, bossesDefeated: 0, weaponUses: { balanced: 0, spread: 0, rapid: 0 } };
      leaderboard = [];
      for (const k in ACHIEVEMENTS) ACHIEVEMENTS[k].unlocked = false;
      showMenu();
    }
  });
}

/* ---------- Screenshot ---------- */
const screenshotBtn = document.getElementById('screenshot-btn');
if (screenshotBtn) {
  screenshotBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `stellar-defense-w${wave}-${score}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}

/* ---------- Event Listeners ---------- */
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
    if (fpsEl) fpsEl.textContent = showFPS ? `FPS: ${frameCount}` : '';
    frameCount = 0;
    fpsTime = timestamp;
  }

  // Input for pause
  if (isDown('p') && state === STATE.PLAYING) {
    keys['p'] = false;
    state = STATE.PAUSED;
    showPause();
  } else if (isDown('p') && state === STATE.PAUSED) {
    keys['p'] = false;
    state = STATE.PLAYING;
    hideScreens();
  }
  // Quick restart from game over
  if (isDown('r') && state === STATE.GAMEOVER) {
    keys['r'] = false;
    resetGame();
    state = STATE.PLAYING;
    hideScreens();
  }
  // Return to menu from game over
  if (isDown('escape') && state === STATE.GAMEOVER) {
    keys['escape'] = false;
    state = STATE.MENU;
    showMenu();
  }

  // clear
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  // shake
  ctx.save();
  if (shake > 0) {
    const sx = (Math.random() - 0.5) * shake;
    const sy = (Math.random() - 0.5) * shake;
    ctx.translate(sx, sy);
    shake *= 0.9;
    if (shake < 0.5) shake = 0;
  }

  drawStars();
  drawNebulae();

  const timeScale = deathSlowMo > 0 ? 0.15 : (slowMo > 0 ? 0.4 : 1.0);
  // frame skip for 30fps mode
  if (targetFPS === 30) {
    skipFrame = !skipFrame;
    if (skipFrame) {
      drawStars();
      drawNebulae();
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
      drawDamageFlash();
      drawLowHPWarning();
      drawBossWarning();
      if (bombAnim > 0) drawBombEffect();
      drawBossUI();
      ctx.restore();
      drawUI();
      requestAnimationFrame(loop);
      return;
    }
  }

  if (state === STATE.PLAYING) {
    if (hitstop > 0) {
      hitstop -= timeScale;
      drawStars();
      drawNebulae();
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
      drawDamageFlash();
      drawLowHPWarning();
      drawBossWarning();
      if (bombAnim > 0) drawBombEffect();
      drawBossUI();
      ctx.restore();
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
    updateParticles();
    updateShockwaves(timeScale);
    waveLogic();

    if (comboTimer > 0) {
      comboTimer -= timeScale;
      if (comboTimer <= 0) combo = 0;
    }
    if (grazeTimer > 0) grazeTimer -= timeScale;
    if (damageFlash > 0) damageFlash -= timeScale;
    if (encounterTimer > 0) encounterTimer -= timeScale;
    // combo sustain bonus
    if (combo >= 10 && state === STATE.PLAYING) {
      score += Math.floor(combo * 0.05 * timeScale);
    }
  }

  playMusicStep();

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

  drawUI();

  requestAnimationFrame(loop);
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

/* ---------- Start ---------- */
initStars();
parseSharedScore();
showMenu();
requestAnimationFrame(loop);
