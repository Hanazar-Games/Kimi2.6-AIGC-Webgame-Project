# Changelog

All notable changes to this project will be documented in this file.

## [1.10.0] - 2026-05-13

### Added
- Wave start screen flash — brief white overlay on each new wave
- Kills and graze count on game over screen
- FPS counter display toggle — show/hide FPS readout
- Master volume control — 4-step toggle (Mute/33%/66%/100%)

### Fixed
- Added explicit declarations for targetFPS, skipFrame, tutorial flags
- Removed unused bombs and maxBombs variables

## [1.9.0] - 2026-05-13

### Added
- First-time tutorial hint — pulsing controls at bottom, auto-dismisses on input
- New high score and top score celebrations with particle effects

## [1.8.0] - 2026-05-13

### Added
- FPS limit toggle (60/30) for performance tuning
- Leaderboard rank announcement on game over (top 5)

## [1.7.0] - 2026-05-13

### Added
- Screenshot button on game over — save canvas as PNG
- Particle density setting (Low/Med/High) for performance tuning
- Practice Mode — no damage, weaker enemies, scores not saved
- Reset All Data button with confirmation dialog
- R key quick restart and ESC return to menu from game over

## [1.6.0] - 2026-05-13

### Added
- Combo Guard — death save when combo >= 10 (one use per run)
- Wave-based screen border color (blue → red as waves increase)
- Local leaderboard — top 5 scores with medals
- Hitstop on enemy hits — brief freeze for impact feel

## [1.5.0] - 2026-05-13

### Added
- Sniper enemy type — high-speed aimed bullets from wave 4
- Elite enemy variant system — 8% spawn chance with enhanced stats
- In-game timer displayed on pause and game over screens
- Pause screen stats overlay (score, wave, kills, combo, graze, time)

## [1.4.0] - 2026-05-13

### Added
- Dash system — K/X key for invincible burst movement with cooldown
- Wave clear bonuses based on remaining HP
- Perfect wave bonus for no-damage clears
- Combo sustain scoring while combo >= 10
- Boss intro sequence with WARNING overlay
- Top-screen Boss HP bar
- Damage flash effect when player takes hits
- Bullet knockback on enemies
- Enemy death shockwaves push nearby bullets
- Performance caps on particles (300) and bullets (500 enemy / 200 player)

## [1.2.0] - 2026-05-13

### Added
- 5 enemy types: Drone, Hunter, Tank, Swarmer, Boss
- Power-up system: Energy, Power, Shield
- Bomb system with slow-motion effect
- Graze system for bonus points
- 3 difficulty levels (Easy/Normal/Hard)
- Combo scoring with milestone celebrations
- Spawn warnings and danger zone alerts
- Achievement system (6 achievements)
- Stats tracking (games, kills, best wave, graze)
- Local high score persistence
- Touch/mobile virtual controls
- Background music with toggle
- Fullscreen support
- GitHub Actions auto-deploy to Pages

### Infrastructure
- MIT License
- README with full feature list
