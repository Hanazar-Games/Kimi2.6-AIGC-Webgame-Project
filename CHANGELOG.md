# Changelog

All notable changes to this project will be documented in this file.

## [1.23.0] - 2026-05-13

### Added
- Combo milestone rewards system
- Combo 25: +1 HP recovery
- Combo 50: +2 HP + 1 bomb
- Combo 100: Full HP + 2 bombs
- Three new achievements: Combo Apprentice, Combo Master, Combo God

## [1.22.0] - 2026-05-13

### Added
- Shielder enemy type — teal enemy with regenerating energy shield
- Shield absorbs all damage while active, breaks after sustained fire
- Shield regenerates after 3-second pause with visual ring indicator
- Spawns from wave 8 onwards
- New 'Shield Breaker' achievement

## [1.21.0] - 2026-05-13

### Added
- Bomber enemy type — fast orange enemy that rams directly at the player
- Death explosion deals area damage within 50px radius
- Blinking red warning ring indicator
- Spawns from wave 7 onwards
- New 'Bomber Down' achievement

## [1.20.0] - 2026-05-13

### Added
- Weapon selection system — choose between Balanced, Spread, and Rapid
- Balanced: default power-level progression
- Spread: wider fan of bullets, more per power level
- Rapid: faster fire rate, fewer side bullets
- Weapon choice persists in localStorage

## [1.19.0] - 2026-05-13

### Added
- Elite Boss variant — 15% spawn chance with golden crown icon
- Enhanced attack patterns: more bullets, faster bullet speed, brighter colors
- 'ELITE BOSS ENGAGED!' and 'ELITE ENRAGED!' announcements
- New 'Elite Slayer' achievement
- Splitter enemy type — purple hexagon that splits into 2-3 Swarmers on death
- Spawns from wave 6 with spreading bullet attack
- New 'Splitter Down' achievement

## [1.18.0] - 2026-05-13

### Added
- Boss phase 2 enrage mechanic — triggers at 50% HP
- Faster shooting and movement when enraged
- Color shift to pink/magenta with announcement

## [1.17.0] - 2026-05-13

### Added
- Canvas dimming overlay on pause — 35% black for better menu contrast
- Score counting animation on game over — rolls up from 0 to final value
- Time Stop power-up — freezes enemies and bullets for 3 seconds
- Purple pulse border visual effect during time stop

## [1.16.0] - 2026-05-13

### Added
- URL-based score sharing — game over updates URL with score and wave
- Shared scores displayed on menu when visiting a link

## [1.15.0] - 2026-05-13

### Added
- Highlight new leaderboard entry in gold on game over
- Menu entrance animations — staggered fade-in for title, controls, buttons
- Enhanced achievement unlock — screen shake, gold particles, description text
- Wave start screen flash — brief white overlay on each new wave
- Kills and graze count on game over screen
- FPS counter display toggle — show/hide FPS readout
- Master volume control — 4-step toggle (Mute/33%/66%/100%)

### Fixed
- Reset waveFlash on game restart
- Added explicit declarations for targetFPS, skipFrame, tutorial flags
- Removed unused bombs and maxBombs variables

## [1.14.0] - 2026-05-13

### Added
- First-time tutorial hint — pulsing controls at bottom, auto-dismisses on input
- New high score and top score celebrations with particle effects
- FPS limit toggle (60/30) for performance tuning
- Leaderboard rank announcement on game over (top 5)

## [1.13.0] - 2026-05-13

### Added
- Screenshot button on game over — save canvas as PNG
- Particle density setting (Low/Med/High) for performance tuning
- Practice Mode — no damage, weaker enemies, scores not saved
- Reset All Data button with confirmation dialog
- R key quick restart and ESC return to menu from game over

## [1.12.0] - 2026-05-13

### Added
- Combo Guard — death save when combo >= 10 (one use per run)
- Wave-based screen border color (blue → red as waves increase)
- Local leaderboard — top 5 scores with medals
- Hitstop on enemy hits — brief freeze for impact feel

## [1.11.0] - 2026-05-13

### Added
- Sniper enemy type — high-speed aimed bullets from wave 4
- Elite enemy variant system — 8% spawn chance with enhanced stats
- In-game timer displayed on pause and game over screens
- Pause screen stats overlay (score, wave, kills, combo, graze, time)

## [1.10.0] - 2026-05-13

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

## [1.9.0] - 2026-05-13

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
