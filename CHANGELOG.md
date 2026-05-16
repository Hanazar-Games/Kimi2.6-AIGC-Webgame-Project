# Changelog

All notable changes to this project will be documented in this file.

## [1.67.2] - 2026-05-13

### Added
- Enemy spawn portal effects
  - Enemies now materialize through a rotating portal ring (0.5s delay)
  - Portal color matches enemy type
  - Inner rotating arc + orbiting glow dots for visual flair
  - Enemies are invulnerable and intangible during spawn delay
  - Gives players extra reaction time and makes spawns more visually interesting

## [1.67.1] - 2026-05-13

### Added
- Wave clear celebration effects
  - "WAVE X CLEARED!" animated text with scale + fade animation (3 seconds)
  - Color-coded: blue for normal, red for boss defeat, gold for perfect
  - Particle burst from center on clear
  - Screen shake scaled to clear type (boss = 10, perfect = 6, normal = 3)
  - Draws over all game states (hitstop, reward select, 30fps skip)

## [1.67.0] - 2026-05-13

### Added
- In-game achievement unlock notifications
  - Slide-in banner at top of screen when achievement unlocked during gameplay
  - Shows achievement name and description with gold border
  - Smooth fade in / hold / fade out animation (5 seconds total)
  - Queued notifications so multiple unlocks don't overlap
- Achievement progress counter in menu
  - Shows "X/25" next to ACHIEVEMENTS heading
  - Color-coded by progress: red → orange → yellow → green
  - Gives players a clear sense of completion

## [1.66.5] - 2026-05-13

### Improved
- Screen shake scales with damage dealt
  - < 5 dmg: light shake (2)
  - 5-9 dmg: medium shake (4)
  - 10-19 dmg: strong shake (6)
  - 20+ dmg: intense shake (10)
  - Makes combat feel more impactful and responsive

## [1.66.4] - 2026-05-13

### Added
- Weapon proficiency now grants damage bonus
  - Each mastery level (+1 per 50 uses) gives +2% damage
  - Max level 5 = +10% damage for that weapon
  - Bonus applies to bullet damage only
  - Encourages weapon variety and long-term investment

## [1.66.3] - 2026-05-13

### Improved
- Weapon proficiency display in menu
  - Stars (★/☆) show mastery level (1 per 50 uses, max 5)
  - Gives players a long-term goal for each weapon
  - More visually appealing than raw numbers alone

## [1.66.2] - 2026-05-13

### Improved
- Game Over screen shows accumulated rewards
  - Displays Damage/Speed/Score multipliers from the run
  - Hidden if no rewards were collected
  - Gives players a sense of power progression

## [1.66.1] - 2026-05-13

### Improved
- Pause screen now shows active reward bonuses
  - Damage multiplier, Speed multiplier, Score multiplier
  - Only shows when rewards are active
  - Helps players track their accumulated power

## [1.66.0] - 2026-05-13

### Added
- Wave Reward Selection system
  - Triggered after 3 consecutive no-damage waves
  - 3 random rewards to choose from (press 1/2/3)
  - 5 reward types: +10% Damage, +10% Speed, +20 HP, +1 Bomb, +5% Score
  - Rewards stack and persist for the entire run
  - Visual card selection interface with color-coded options
  - Golden particle celebration on selection
  - Resets perfect streak after reward (prevents infinite stacking)

## [1.65.2] - 2026-05-13

### Improved
- Enhanced Time Stop visual effect
  - Darker purple screen overlay
  - Double border: outer pulsing + inner subtle
  - Clock icon with countdown hand at top center
  - Hand rotates as time stop duration decreases
  - More immersive "time frozen" atmosphere

## [1.65.1] - 2026-05-13

### Added
- Combo Burst at x100 combo
  - Clears all enemy bullets on screen
  - Deals 25 damage to all non-Boss enemies
  - Golden hit sparks and slow-motion effect
  - Massive reward for reaching the ultimate combo milestone

## [1.65.0] - 2026-05-13

### Added
- Leaderboard difficulty filter
  - Filter buttons: ALL / E (Easy) / N (Normal) / H (Hard) / X (Nightmare)
  - Each entry shows difficulty letter with color coding
  - Leaderboard now stores difficulty with each entry
  - Expanded to top 10 entries (was 5)
  - Backward compatible with old entries (no difficulty label)

## [1.64.0] - 2026-05-13

### Added
- Per-difficulty high scores
  - Separate high score tracked for each difficulty (Easy/Normal/Hard/Nightmare)
  - Menu shows global high score + current difficulty's best
  - Game Over shows current difficulty's high score alongside global
  - Backward compatible with existing save data

## [1.63.9] - 2026-05-13

### Improved
- Game Over screen shows more detailed stats
  - Perfect Waves: total no-damage waves this run
  - Bosses: bosses defeated this run
  - Tracks per-run stats separately from lifetime stats

## [1.63.8] - 2026-05-13

### Added
- Perfect streak HUD indicator
  - Fire emoji (🔥) + consecutive no-damage wave count
  - Color tiers: yellow (1-2), orange (3-4), red (5+)
  - Hidden when streak is broken
  - Appears in top bar next to Graze counter

## [1.63.7] - 2026-05-13

### Improved
- Screenshot now includes watermark
  - Game name, version, score, and wave in bottom-right corner
  - Semi-transparent black background for readability
  - Helps with brand recognition when sharing

## [1.63.6] - 2026-05-13

### Added
- Damage number pop-ups on enemy hits
  - White numbers for normal damage, yellow for high damage (15+)
  - Float upward and fade out over 25 frames
  - Disabled on Low particle density to reduce clutter
  - Smaller font (12px) than regular floating text

## [1.63.5] - 2026-05-13

### Improved
- Game Over screen now shows all weapons used in the run
  - If multiple weapons were used, lists them all (e.g. "Weapons: Balanced, Laser, Ricochet")
  - Single weapon still shows as "Weapon: X"

## [1.63.4] - 2026-05-13

### Improved
- Enhanced pause screen with more status info
  - Current weapon and difficulty display
  - Active wave theme (if any) with matching color
  - Active buffs list: Shield, Time Stop, Magnet with remaining duration
  - Cleaner layout with separator line

## [1.63.3] - 2026-05-13

### Added
- Background planets
  - 1-2 massive planets rendered at the deepest layer
  - Radial gradient with highlight, base, and shadow tones
  - Subtle atmospheric stripes and crater details
  - Extremely slow drift for parallax depth
  - Low opacity (0.12) to avoid gameplay interference
  - Respects particle density setting (1-2 planets)

## [1.63.2] - 2026-05-13

### Added
- Auto Fire toggle in menu
  - OFF by default, persists via localStorage
  - When ON, ship fires continuously without holding shoot key
  - Great for casual play and touch screen users
  - Blue highlight when active

## [1.63.1] - 2026-05-13

### Added
- New achievement: `Theme Survivor` — Clear a Theme wave without taking damage

## [1.63.0] - 2026-05-13

### Added
- Wave Theme system
  - Every 3rd non-boss wave gets a special theme
  - 5 themes: SWARM (pink), ASSAULT (orange), FORTRESS (teal), SNIPER (magenta), DIVIDE (blue)
  - Theme waves heavily bias spawn rates toward themed enemy types
  - Theme name displayed below wave number with unique color
  - Adds strategic variety and preparation incentive

## [1.62.2] - 2026-05-13

### Improved
- Enhanced player invincibility flash effect
  - Faster blink rate (every 3 frames vs 4)
  - Lower alpha during blink (0.25 vs 0.4) for clearer visibility
  - White outline ring around ship when visible during i-frames
  - Makes it much easier to tell when you're safe after taking damage

## [1.62.1] - 2026-05-13

### Added
- 3 new achievements (total: 24)
  - `magnetic_personality` — Pick up a Magnet power-up
  - `ricochet_king` — Kill an enemy with a bounced bullet
- Updated `weapon_master` achievement: now requires all 5 weapons (was 3)

## [1.62.0] - 2026-05-13

### Added
- Background asteroids
  - 3-7 irregular polygon asteroids floating in the background
  - Slowly drift and rotate for depth effect
  - Semi-transparent gray/brown tones, respecting particle density setting
  - Wrap around screen edges for continuous motion
  - Rendered behind player/enemies, above nebulae

## [1.61.0] - 2026-05-13

### Added
- New weapon: Ricochet
  - Bullets bounce off screen edges (up to 2 bounces)
  - Can hit enemies behind cover / around corners
  - Bounce sparks on wall contact
  - White dot indicators show remaining bounces
  - 2 bullets at power level 1, up to 3 at max power
  - Unique triangle-wave shooting SFX
  - Color: amber/gold (#ffcc66)

## [1.60.0] - 2026-05-13

### Added
- Magnet power-up
  - Orange 'M' item, 5% drop rate from enemies
  - 5-second duration, attracts all nearby power-ups to player
  - Attraction range: 250px, strength scales with distance
  - HUD timer shows remaining duration
  - Plays power-up SFX on pickup

## [1.59.1] - 2026-05-13

### Fixed
- Laser weapon missing from `weaponUses` statistics
- `loadStats()` now properly merges missing fields from defaults
- Menu now displays weapon usage counts (B/S/R/L abbreviations)

## [1.59.0] - 2026-05-13

### Added
- Enemy Log (Bestiary) in main menu
  - Tracks all enemy types encountered across runs (persistent)
  - Discovered enemies shown with color-coded name and tooltip description
  - Undiscovered enemies shown as "???" in muted gray
  - Cleared when resetting all data

## [1.58.0] - 2026-05-13

### Added
- New enemy type: Divider
  - Large blue enemy that splits when hit (up to 2 splits)
  - Each split creates 2 smaller, faster children
  - Children have higher score value (+20% per generation)
  - Appears starting from Wave 10
  - 25% split chance per hit
- Divider-related achievement: "Divider Down"
- Unique visual: diamond shape with inner cross, glows by split generation
- Warning indicator colored blue for Divider spawns

## [1.57.0] - 2026-05-13

### Added
- Bomb cooldown color indicator
- Gray when on cooldown, orange when ready
- Clear visual feedback for bomb availability

## [1.56.0] - 2026-05-13

### Added
- Difficulty indicator on HUD
- Color-coded: Easy=green, Normal=blue, Hard=orange, Nightmare=red
- Updates in real-time when difficulty changes

## [1.55.0] - 2026-05-13

### Added
- Player hit particle effects
- Blue particles burst from player on all damage sources
- Respects particle density setting

## [1.54.0] - 2026-05-13

### Added
- Color-coded FPS indicator
- Green: 55+ FPS, Yellow: 30-54 FPS, Red: <30 FPS
- Helps identify performance issues at a glance

## [1.53.0] - 2026-05-13

### Added
- Enhanced damage flash with red screen border
- More visually noticeable hit feedback
- Border intensity 1.5x the overlay alpha

## [1.52.0] - 2026-05-13

### Added
- Wave progress percentage on HUD
- Shows current wave completion percentage
- Format: WAVE: 3 (45%)

## [1.51.0] - 2026-05-13

### Added
- Combo timer progress bar on HUD
- Visual bar showing remaining combo time
- Color shifts: purple → pink → yellow as combo increases

## [1.50.0] - 2026-05-13

### Added
- Perfect wave celebration effect
- 'PERFECT WAVE!' text and golden particles on no-damage clear
- Screen shake and particle burst

## [1.49.0] - 2026-05-13

### Added
- Score multiplier display on HUD
- Shows current combo multiplier next to score
- Format: SCORE: 12,345 (x1.5)

## [1.48.0] - 2026-05-13

### Added
- Death slow-motion effect
- Game slows to 0.15x speed for 1.5 seconds on player death
- Dramatic bullet-time before game over screen

## [1.47.0] - 2026-05-13

### Added
- Nightmare difficulty (4th level)
- 2x enemy HP, 1.75x enemy speed
- Player has only 1 HP and 1 bomb
- Elite spawn rate increased to 15%
- New 'Nightmare Survivor' achievement (reach Wave 10)

## [1.46.0] - 2026-05-13

### Added
- Medic enemy type
- Heals nearby enemies (+5 HP every 90 frames)
- Green heal particles and +HEAL floating text
- Pulse ring indicator when ready to heal
- Spawns from wave 9 onwards
- New 'Medic Down' achievement

## [1.45.0] - 2026-05-13

### Added
- 2 new achievements:
  - Piercing Shot: hit 3 enemies with one laser beam
  - Boss Hunter: defeat 5 Bosses total

## [1.44.0] - 2026-05-13

### Added
- Boss defeat spectacle effects
- Double explosion with 65 total particles
- 'BOSS DEFEATED!' announcement
- Strong screen shake and damage flash

## [1.43.0] - 2026-05-13

### Added
- Laser weapon type
- Penetrating beams that pass through multiple enemies
- Higher damage with 10-frame cooldown
- Power level increases beam count (up to 3)
- Magenta beam with white core visual
- Unique 2000Hz sawtooth shoot sound

## [1.42.0] - 2026-05-13

### Added
- Engine exhaust particle trail
- Particles emit from ship rear while moving
- Color matches current theme

## [1.41.0] - 2026-05-13

### Added
- In-game timer display on HUD (MM:SS format)
- Real-time elapsed time during gameplay

## [1.40.0] - 2026-05-13

### Added
- Enhanced pause screen with vignette effect
- Darker overlay (45%) with radial gradient
- Focuses attention toward screen center

## [1.39.0] - 2026-05-13

### Added
- Low HP heartbeat sound effect
- Subtle 120Hz pulse when HP below 30%
- Enhances tension during critical health situations

## [1.38.0] - 2026-05-13

### Added
- Improved danger zone visuals
- Always-visible dashed danger line at bottom 100px
- Pulsing warning text when enemies approach bottom

## [1.37.0] - 2026-05-13

### Changed
- Balanced special enemy spawn rates for smoother difficulty curve
- Splitter: 35% → 25% (wave 6+)
- Bomber: 42% → 30% (wave 7+)
- Shielder: 48% → 22% (wave 8+)

## [1.36.0] - 2026-05-13

### Added
- Visual shockwave ring effect on enemy death
- Expanding ring matching enemy color
- 20-frame lifetime with smooth fade-out
- Layered behind floating text

## [1.35.0] - 2026-05-13

### Added
- Improved floating text animation with scale pulse effect
- Text grows then shrinks smoothly during lifetime
- Enhanced visual feedback for scores, combos, and power-ups

## [1.34.0] - 2026-05-13

### Added
- Combo counter scale animation
- Text briefly scales to 1.4x when combo increases
- Smooth decay for clear visual feedback

## [1.33.0] - 2026-05-13

### Added
- Color-coded spawn warnings by enemy type
- Bomber: red, Shielder: cyan, Splitter: purple, Standard: yellow
- Warning arrows now have glow effects

## [1.32.0] - 2026-05-13

### Added
- Improved bullet trail visuals
- Line-based trails scaling with bullet velocity
- Thicker, more visible trails with rounded caps

## [1.31.0] - 2026-05-13

### Added
- Nebula background effect — 3 drifting radial-gradient clouds
- Colors: purple, blue, red for visual depth
- Slow parallax movement behind all game elements

## [1.30.0] - 2026-05-13

### Added
- Expanded game over screen statistics
- Best Combo and Weapon Used displays
- Time format MM:SS

## [1.29.0] - 2026-05-13

### Added
- Expanded statistics tracking:
  - Total play time (minutes)
  - Highest combo ever achieved
  - Bosses defeated count
  - Weapon usage counters
- Updated menu stats display with 6 fields

## [1.28.0] - 2026-05-13

### Added
- 5 new achievements:
  - Weapon Master: use all 3 weapons in one run
  - Bomb Saver: clear a wave without using bombs
  - Graze King: graze 200 bullets in one run
  - Marathon: reach Wave 20
  - Millionaire: score 1,000,000 points

## [1.27.0] - 2026-05-13

### Added
- Enemy hit flash effect — white overlay when hit by player bullets
- 4-frame duration with fade-out for clear hit feedback
- Applies to all enemy types including Bosses

## [1.26.0] - 2026-05-13

### Added
- Weapon-specific shoot sound effects
- Balanced: original 880Hz square wave
- Rapid: higher 1200Hz square wave (sharper, faster feel)
- Spread: lower 600Hz sawtooth wave (heavier, scatter feel)

## [1.25.0] - 2026-05-13

### Added
- Boss type Beta — alternate Boss variant appearing every 10 waves
- Blue Beta Boss: faster movement, denser bullet patterns, angular shape with side fins
- Red Alpha Boss: original patterns (wave 5, 15, 25...)
- Independent first-encounter hints for each Boss type
- Boss HP bar color matches Boss type (red/blue)

## [1.24.0] - 2026-05-13

### Added
- First-encounter hint system — displays tooltip when new enemy type appears
- Includes description for all 9 enemy types
- Auto-dismisses after 3 seconds with fade-out
- Resets on each new game run

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
