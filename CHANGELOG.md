# Changelog

All notable changes to this project will be documented in this file.

## [1.89.0] - 2026-06-07

### Fixed — CRITICAL: Post-v1.88 Review Fixes
- **rewardSelectActive branch duplicate draw calls**: `drawTimeStopEffect`/`drawDeathEffect`/`drawPickupFlash`/`drawDamageIndicators`/`drawOffscreenIndicators` were accidentally added twice, causing alpha stacking and over-bright effects
- **hitstop branch missing overlay draws**: Same 5 overlay functions absent in hitstop freeze path; now restored
- **`useBomb()` special death behaviors not applied**: Previous patch failed to insert splitter/bomber/mine/boss/phantom/shielder/medic/divider handling and achievement unlocks; now correctly added

### Fixed — Audio & SFX
- **`sfxShoot` explosive branch double-connect**: `g.connect(audioCtx.destination)` called twice in explosive weapon branch, doubling perceived volume
- **`sfxBomb()` ignored `masterVolume`**: Bomb explosion played at fixed 0.2 gain regardless of volume setting; now multiplied by `masterVolume`
- **BGM did not respond to volume changes**: `[`/`]` shortcuts and volume button only updated SFX/Engine; `updateMusicTrackVolumes()` now called on every volume change
- **`sfxEnemyDeath` setTimeout safety**: All delayed `playTone` callbacks now guard with `if (audioCtx)` to prevent crashes if audio context is destroyed

### Fixed — CSS & HTML Polish
- **Media query 768px boundary overlap**: `(max-width: 768px)` overlapped with tablet `(min-width: 768px)` at exactly 768px; changed to 767px
- **Merged duplicate 481–767px media queries**: Responsive HUD rules merged into single small-tablet query to eliminate redundancy
- **Restored `.diff-btn`/`.weapon-btn` transition rules**: Removing "duplicate" rules actually regressed `:active` scale from 0.94→0.97/0.95 and transition timing; restored with proper placement
- **Additional low-contrast colors missed**: `.splash-status`, `.enemy-desc`, `.splash-products`, and inline pause-screen hint color updated to `#88aacc`
- **`boss-warning-overlay` z-index revision**: Raised to 14 (equal with bomb-flash) to avoid遮挡 wave-announcer (15)

### Fixed — Input & Help
- **Help overlay showed old shortcuts**: Still displayed `W — Weapon info` and `A — Auto fire` after rebinding to `V` and `U`; corrected
- **`showMenu()` null check**: Added defensive check for `#menu-screen` before `classList.add('active')`

## [1.88.0] - 2026-06-07

### Fixed — CRITICAL: Game Logic & Rendering
- **`showGameOver()` stats variable shadowing**: Local `stats` (NodeList) shadowed global `stats` object, causing `final-kills` to display `undefined` and weapon stars to always show 0
- **Explosive AOE ghost enemies**: AOE damage reduced HP but never removed killed enemies from array; they continued moving/shooting until off-screen. Now dead AOE targets are immediately spliced out
- **`useBomb()` missing special death behaviors**: Bomber killed by bomb didn't explode, splitter didn't split, and achievements (`first_blood`, `bomber_down`, `splitter_down`, `mine_sweeper`) were unreachable via bomb
- **Divider bullet piercing bug**: `continue` after `splitDivider()` let the same bullet hit additional enemies; changed to `break`
- **Phantom invisible collision**: Invisible phantoms could still collide with and damage player; now skipped in enemy-vs-player collision
- **Sniper `aimTimer` never decremented**: Aim line stayed visible forever; now decrements in `updateEnemies()`
- **Boss `enraged` uninitialized**: Added explicit `enraged: false` in `spawnEnemy()` boss branch

### Fixed — Input & Controls
- **Shortcut key clear used wrong key names**: `keys['F2']`, `keys['Tab']`, `keys['BracketLeft']` etc. cleared non-existent keys, causing continuous triggering. Fixed to lowercase (`f2`, `tab`, `[`)
- **WASD `a`/`w` key conflicts**: `a` (auto-fire toggle) blocked left movement; `w` (weapon info) blocked up movement. Rebound to `u` and `v`
- **Tab key default not prevented**: Browser focus could leave canvas; now `e.preventDefault()` on Tab
- **Virtual joystick stuck on finger slide-out**: `touchActive` remained true when finger slid out of move zone; now deactivates on slide-out
- **Touch `getBoundingClientRect()` uncached**: Forced reflow on every touch event; now cached with `resize`/`scroll` listeners
- **`keys` object memory leak**: `keyup` set `false` but never deleted properties; now uses `delete`

### Fixed — Rendering Pipeline
- **30fps skipFrame double background draw**: `drawPlanets/Meteors/Stars/Nebulae/Asteroids` drawn twice per skip frame; removed duplicate draw calls
- **30fps/hitstop/rewardSelect missing draw calls**: Added `drawTimeStopEffect`, `drawDeathEffect`, `drawPickupFlash`, `drawDamageIndicators`, `drawOffscreenIndicators`
- **COUNTDOWN missing `updateShockwaves`**: Shockwaves frozen during countdown; now updated
- **Particle/shockwave cap bypasses**: `playerDeathEffect()`, score milestone burst, and `drawWaveClear()` particles could exceed 300 limit; now capped
- **`drawDamageFlash` alpha overflow**: `globalAlpha` could reach 1.26; now clamped to 1.0
- **Offscreen indicator filter incomplete**: Added `phantom`, `divider`, `turret`, `mine` to high-threat whitelist

### Fixed — UI/UX & CSS
- **CSS `@media (max-width: 768px)` overrode 480px rules**: Mobile styles broken on ≤480px screens; changed to `(min-width: 481px) and (max-width: 768px)`
- **Color contrast too low**: `.version-text` (#556688 → #88aacc) and `.touch-hint` (#6688aa → #88aacc) for WCAG AA compliance
- **Missing `prefers-reduced-motion`**: Added media query to disable animations for accessibility
- **z-index layering conflict**: `boss-warning-overlay` (13) was below `bomb-flash-overlay` (14); raised to 16
- **CSS duplicate transition rules**: Removed redundant `.diff-btn`/`.weapon-btn` transition declarations
- **HTML buttons missing `type="button"`**: All `<button>` elements now explicitly typed
- **Version number inconsistency**: Unified to `v1.88.0` across `index.html` and `game.js`

### Fixed — State & Persistence
- **`resetGame()` missing array clears**: `damageIndicators` and `meteors` not reset between runs; added
- **`resetGame()` missing `comboScale` reset**: UI could start with wrong scale; added
- **`loadStats()` shallow merge data pollution**: `saved` fields could inject unexpected keys; now uses whitelist merge
- **`showGameOver()` `goScreen` null check**: Added defensive check before DOM manipulation
- **`pause-bosses` duplicate assignment**: Removed redundant second assignment

## [1.87.3] - 2026-05-22

### Fixed — CRITICAL: Laser Bullet & Achievement Logic
- **`b.hitTimer` never decremented**: Laser bullets permanently blocked after first hit; fixed by adding `b.hitTimer -= timeScale` in `updateBullets()`
- **`piercing_shot` achievement impossible**: Required 3 laser hits, but `hitTimer` freeze prevented any follow-up hits — now unlockable
- **`elite_wave_survivor` impossible on wave 10/20/30...**: Elite waves overlap with boss waves; boss-clear branch now checks `eliteWave` and increments counter
- **`century` achievement used lifetime kills**: Described "100 enemies in one run" but checked `stats.kills` (persistent across all runs); now tracks `runKills` (per-run counter)

### Fixed — Canvas Rendering Paths
- **30fps skip-frame**: `drawPlanets()` was called twice instead of `drawPlanets()` + `drawMeteors()`
- **hitstop path**: Missing `drawPlanets()` and `drawMeteors()`
- **rewardSelectActive path**: Missing `drawMeteors()`

## [1.87.2] - 2026-05-22

### Fixed — CRITICAL: Enemy Rendering & Logic Structure
- **Medic enemy had no shooting logic**: Drawing code was incorrectly placed inside `updateEnemies()`; medic now fires green bullets at player
- **Divider enemy had no shooting logic**: Same structural bug; divider now fires dual blue bullets
- **Medic/divider rendering relocated**: Moved from `updateEnemies()` (wrong place) to `drawEnemies()` (correct place), restoring proper canvas transform context

### Fixed — Audio Tab-Background Burst
- `playMusicStep()` now detects `audioCtx.state !== 'running'` and resyncs `musicNextTime` to prevent all scheduled notes from playing simultaneously when tab returns to foreground

## [1.87.1] - 2026-05-22

### Fixed — Runtime Stability & Memory Safety
- **Array caps added** to prevent unbounded growth:
  - `particles` (300), `texts` (60), `shockwaves` (30), `powerups` (20), `warnings` (30), `damageIndicators` (20), `meteors` (15)
  - `spawnPlayerHitParticles()` now respects particle ceiling
- **`deathSlowMo` decrements in all states**: Death animation no longer freezes when transitioning to GAMEOVER
- **`drawUI()` state-gated**: Skips expensive HUD DOM updates in MENU/GAMEOVER; achievement notification still updates universally
- **`stats.weaponUses` reset consistency**: Data reset now includes `homing` and `explosive` (was missing both)

## [1.87.0] - 2026-05-22

### Added — Splash Screen Intro Animation
- Full-screen intro overlay (`z-index: 100`) with 5-stage loading sequence (~3s total)
- "Hanazar Games" typewriter effect with blue glow + "PRODUCTS" subtitle fade-in
- "STELLAR DEFENSE" title entrance with glitch displacement effect
- Animated progress bar with 5 phase indicators (Core → Audio → Input → Starfield → Combat)
- Light burst transition to main menu, automatic DOM cleanup
- Pure CSS animations + JS timing control, responsive at 480px and 1440px breakpoints

### Fixed — CRITICAL Runtime Bugs
- **`checkCollisions()` explosive AOE crash**: `pl` (undefined variable) → `player.powerLevel`; `dmg` Temporal Dead Zone fixed by computing damage before AOE block
- **Two gameover paths missing `engineGainNode2` stop**: Enemy bullet collision (line ~3860) and enemy body collision (line ~3948) now correctly fade both engine oscillators
- **`bomberExplode()` missing `playerDeathEffect()`**: Bomber death now triggers explosions, particle shards, and shockwave like all other death paths
- **Broken keyboard shortcuts**: `BracketLeft`/`BracketRight`/`Minus`/`Equal`/`Tab`/`F2`/`F3`/`F4` key identifiers mismatched `e.key.toLowerCase()` storage — all 8 shortcuts now functional
- **Achievement notification freeze**: Timer now decrements outside PLAYING block; notifications dismiss properly in PAUSED/MENU/GAMEOVER
- **`drawLowHPWarning()` heartbeat in menus**: Added `state === STATE.PLAYING` guard to prevent heartbeat SFX firing on menu/pause screens

### Fixed — Audio State Safety
- `showPause()` now fades both engine gain nodes to 0 (prevents frozen engine hum)
- `showMenu()` defensively stops engine audio + clears lingering `screen-flash` / `bomb-flash-overlay`
- `ensureAudio()` now checks `window.AudioContext` existence before construction; `resume()` promise caught
- 7 SFX functions (`sfxPowerup`, `sfxWaveStart`, `sfxPickupEnergy`, `sfxPickupMagnet`, `sfxPickupScore`, `sfxUpgrade`, `sfxDash`) now guard with `if (!audioCtx) return`
- `resetGame()` clears `achievementNotifications` queue + `activeNotification` + re-arms engine audio
- Escape-to-menu now calls `resetGame()` to prevent stale enemies/bullets rendering behind menu overlay

### Fixed — DOM / Animation Leaks
- `animateCounter()` intervals now self-clear when element is disconnected or state leaves GAMEOVER
- `animateGameOverStats()` setTimeout callbacks now check `state === STATE.GAMEOVER` before executing
- `hideWaveAnnouncer()` now resets `announcerTimer = 0` (consistent with `hideBossWarning()`)
- Splash screen `logoTimer = 0` on finish prevents duplicate canvas logo animation

### Fixed — HTML/CSS
- Splash internal elements (`splash-progress-bar`, `splash-progress-glow`, `splash-status`) added `id` attributes to match JS `getElementById` lookups
- Arrow keys now call `e.preventDefault()` to prevent page scrolling during gameplay

## [1.86.0] - 2026-05-22

### Added — BGM Multi-Theme Music System
- Complete procedural music engine with 5 dynamic themes
  - `MENU`: Ambient space pad + gentle arpeggios at 72 BPM
  - `COMBAT`: Driving electronic beat + bassline + lead synth at 118 BPM
  - `BOSS`: Tense synth + deep bass + urgent arpeggios at 138 BPM
  - `ELITE`: High-intensity rhythm + dense arpeggios at 128 BPM
  - `GAMEOVER`: Melancholic descending melody at 60 BPM
- 4-track architecture: bass, lead, pad, arp — each with independent volume
- Crossfade transitions: 1.2s smooth theme switching with cubic ease-in-out
- Global effects chain: DynamicsCompressorNode + ConvolverNode synthetic reverb
- Sidechain ducking: Music dips 50% during explosions/bombs for clarity
- Auto-theme selection based on game state (wave type, boss presence)

### Added — SFX Spatial Audio & Effects
- Stereo panning (`StereoPannerNode`): enemy sounds positioned by screen X
- Enhanced engine sound: sawtooth overtone + LFO pitch wobble for mechanical feel
- New sound effects: `sfxGraze` (panned), `sfxWaveTransition`, `sfxMenuHover`, `sfxMenuClickEnhanced`, `sfxCountdown`
- Audio ducking integrated into `sfxExplosion()` and `sfxBomb()`

### Added — UI/UX Visual Overhaul
- Screen transition animations: opacity + transform smooth transitions
  - Pause slides from top, Game Over rises from bottom
- Wave announcer overlay: elastic scale pop with scanline effect
- Boss warning overlay: pulsing red "WARNING" with radial vignette
- Achievement notification upgrade: golden badge spin-in with stagger text
- Game Over glitch effect: RGB channel shift + clip-path distortion
- Low HP screen edge vignette: pulsing red inset shadow
- Screen flash on damage, bomb radial flash on explosion
- HUD enhancement: frosted glass backgrounds (`backdrop-filter: blur`)

### Added — Responsive Design System
- 10 media query breakpoints covering all devices
  - `< 480px` phones, `480-767px` large phones, `768-1023px` tablets
  - `1024-1439px` desktop, `≥1440px` wide, `≥1920px` ultra-wide
- Portrait orientation handling for phones and tablets
- Touch device optimizations (`hover: none` media query)
- Flexible `#game-container` sizing with `aspect-ratio` support

### Added — Menu Layout Rebuild
- Card-based information hierarchy with `.menu-card` containers
- Controls grid: 3×2 keyboard layout instead of 9 lines of text
- Settings grouped into 3 compact rows
- Stats displayed in flex rows with visual separators
- Scrollable content area for leaderboard/achievements/enemy log
- Custom thin scrollbar styling

### Added — Button Animation System
- Shimmer sweep effect on hover (`button::before` gradient sweep)
- Magnetic hover: `translateY(-3px) scale(1.02)` with multi-layer glow
- Press ripple: `::after` pseudo-element expanding from center
- Difficulty button pulse animation with unique colors per difficulty
- Weapon button hover tints matching weapon theme colors
- Elastic transition curve: `cubic-bezier(0.34, 1.56, 0.64, 1)`

### Fixed
- `isBeta` duplicate `const` declaration causing SyntaxError
- Overlay (wave announcer / boss warning) not hidden on state transitions
- `engineOsc2` not stopped on gameover/menu transitions
- `health-text` DOM access without null check
- CSS `.screen` duplicate definition
- Duplicate `pause-bosses` ID in HTML

## [1.72.3] - 2026-05-13

### Added
- F12 in-game screenshot hotkey
  - Press F12 anytime during gameplay to capture the screen
  - Watermark shows current version, score, and wave
  - Works in addition to the game over screenshot button
  - Fixed outdated version number in watermark

## [1.72.2] - 2026-05-13

### Added
- Enemy Log kill counters
  - Each discovered enemy now shows total lifetime kills
  - Hover tooltip shows kill count alongside hint text
  - Persisted across sessions via localStorage
  - Gives players a long-term goal of hunting every enemy type

## [1.72.1] - 2026-05-13

### Improved
- Wave progress display now shows kill count
  - Changed from percentage (e.g. "65%") to fraction (e.g. "8/12")
  - More intuitive and precise than percentage alone
  - Works for all wave types including boss and elite waves

## [1.72.0] - 2026-05-13

### Added
- New enemy type: MINE
  - 12th enemy type (appears from Wave 11+)
  - Stationary proximity mine that arms after 1 second
  - Explodes when player gets within 30px
  - Also explodes when destroyed by bullets
  - Spiky visual with pulsing inner glow
  - Warning ring expands as player approaches
  - Higher spawn rate in FORTRESS theme waves
  - Added to Enemy Log with hint text

## [1.71.3] - 2026-05-13

### Improved
- Power-up collection animation
  - Power-ups now fly toward player before being collected
  - Smooth acceleration + damping for organic motion
  - Collection only triggers when power-up reaches player center
  - Makes pickups feel more satisfying and physical

## [1.71.2] - 2026-05-13

### Added
- New power-up: SCORE MULTIPLIER
  - 7th power-up type (5% drop chance)
  - Increases score multiplier by +0.5 for 10 seconds
  - Stacks with wave reward multipliers
  - HUD timer shows active multiplier value
  - Golden floating text on pickup

## [1.71.1] - 2026-05-13

### Improved
- Weapon-colored engine trails
  - Each weapon now has a unique engine exhaust color
  - Balanced = cyan, Spread = green, Rapid = orange
  - Laser = magenta, Ricochet = gold, Homing = pink
  - Makes weapon choice more visually distinct during gameplay

## [1.71.0] - 2026-05-13

### Added
- 5 new achievements (30 total)
  - Portal Observer — Witness 50 enemies spawn through portals
  - Homing Ace — Destroy 100 enemies with Homing Missiles
  - Overdrive Killer — Destroy 30 enemies during Overdrive
  - Elite Wave Survivor — Survive an Elite Wave
  - Combo Burst Master — Trigger Combo Burst 3 times
  - Each tracks progress across the run and unlocks automatically

## [1.70.4] - 2026-05-13

### Added
- Combo Burst full-screen flash effect
  - Golden-yellow flash overlay when Combo Burst triggers at 100 combo
  - Intensity scales with flash duration (0.5s)
  - Makes the 100-combo milestone feel truly spectacular

## [1.70.3] - 2026-05-13

### Added
- Animated background in menu screen
  - Stars, nebulae, asteroids, and meteors continue moving behind menu
  - Adds visual life to the menu without interfering with UI
  - Makes the game feel more polished and immersive from the start

## [1.70.2] - 2026-05-13

### Added
- Wave number pop animation
  - HUD wave text briefly scales up (1.5x) when wave changes
  - Smooth elastic decay back to normal size
  - Adds satisfying feedback to wave progression
  - Works for all wave types (normal, boss, elite)

## [1.70.1] - 2026-05-13

### Added
- Elite Wave system
  - Every 10th wave (non-boss) becomes an Elite Wave
  - ALL enemies in the wave are guaranteed elite
  - Gold "ELITE WAVE!" warning on wave start
  - Screen shake + warning sound on announcement
  - Makes certain waves dramatically more intense

## [1.70.0] - 2026-05-13

### Added
- New power-up: OVERDRIVE
  - 6th power-up type (5% drop chance)
  - Doubles fire rate for 5 seconds
  - Red pulsing aura around player while active
  - HUD timer shows remaining duration
  - Visual and audio feedback on pickup
  - Adds burst-damage option to the power-up roster

## [1.69.3] - 2026-05-13

### Added
- Background meteor shower effects
  - Meteors streak across the sky at random intervals (5-10s)
  - Spawn from top or left edge with varied trajectories
  - Bright white head with blue trailing streak
  - Alpha fades as meteor burns out
  - Adds dynamic life to the background without distracting gameplay

## [1.69.2] - 2026-05-13

### Improved
- Enhanced pause screen statistics
  - Added remaining enemies count (alive + to spawn)
  - Added current perfect wave streak
  - Added bosses defeated this run
  - Gives players better situational awareness when paused

## [1.69.1] - 2026-05-13

### Added
- Random game tips in menu
  - 20 helpful tips covering mechanics, enemies, weapons, and strategies
  - Updates randomly each time menu is opened
  - Helps new players discover advanced features
  - Positioned below weapon/enemy log sections

## [1.69.0] - 2026-05-13

### Improved
- Difficulty selection visual feedback
  - Each difficulty now has unique active button color
  - Easy = green, Normal = blue, Hard = orange, Nightmare = red
  - Dynamic box-shadow glow matching difficulty color
  - Border color updates to match selection
  - Makes difficulty choice more visually impactful

## [1.68.9] - 2026-05-13

### Added
- Boss presence screen edge effect
  - Subtle radial gradient glow around screen edges during boss fights
  - Blue for Beta Boss, red for Alpha Boss
  - Intensity increases as boss HP drops below 50%
  - Gentle pulsing animation for living atmosphere
  - Makes boss fights feel more threatening and distinct

## [1.68.8] - 2026-05-13

### Improved
- Enhanced spawn warning visuals
  - Expanding pulse ring that grows as enemy approaches spawn
  - Larger arrow marker with brighter glow
  - White inner dot for extra visibility
  - Ring alpha fades as it expands for smooth effect
  - Makes spawn warnings much harder to miss

## [1.68.7] - 2026-05-13

### Added
- Elite enemy aura effects
  - Pulsing gold ring around all elite enemies
  - 3 rotating orbiting dot markers
  - Pulse speed varies slightly per enemy (based on x position)
  - Makes elites immediately distinguishable in crowds
  - Complements existing crown icon and lightenColor

## [1.68.6] - 2026-05-13

### Added
- Enhanced player death spectacle
  - Chain of 5 multi-colored explosions
  - 30-70 energy shards bursting outward (density-scaled)
  - Shockwave ripple expanding from player
  - Extended death slow-motion (1.5s)
  - Strong screen shake (25) + full white flash
  - Death effect triggers on both bullet and collision death

## [1.68.5] - 2026-05-13

### Improved
- Enhanced starfield parallax depth
  - 3 distinct layers: far (slow, small, dim), mid, near (fast, large, bright)
  - 40% far / 35% mid / 25% near distribution
  - Layer-based size, speed, and alpha multipliers
  - Creates much stronger sense of depth and motion
  - Increased total star count from 150 to 180

## [1.68.4] - 2026-05-13

### Improved
- Directional screen shake
  - Shake now has directionality based on event source
  - Player hit by enemy: shake pushes away from enemy
  - Player hit by bullet: shake follows bullet direction
  - Bomb explosion: omnidirectional (random)
  - Boss defeat / enrage: shake radiates from boss
  - Wave clear / rewards / milestones: upward celebration shake
  - 70% directional + 30% random for organic feel
  - Makes impacts feel more grounded and spatial

## [1.68.3] - 2026-05-13

### Added
- Enemy low-HP warning flash
  - Enemies below 30% health glow red with pulsing alpha
  - Flash frequency increases as HP drops lower
  - Helps players prioritize finishing wounded targets
  - Adds visual urgency to combat

## [1.68.2] - 2026-05-13

### Improved
- Knockback system enhanced
  - Knockback now scales with damage dealt
  - Enemy-type resistance: swarmer/bomber 1.3x, normal 1.0x, tank/shielder/divider 0.4x, boss 0.15x
  - Formula: (0.5 + dmg * 0.06) * resistance
  - Makes weapon choice and power level feel more impactful

## [1.68.1] - 2026-05-13

### Added
- Weapon descriptions in menu
  - Shows selected weapon name, description, and mastery info
  - Updates dynamically when switching weapons
  - Helps new players understand each weapon's strengths
  - Displays proficiency stars and damage bonus

## [1.68.0] - 2026-05-13

### Added
- New weapon: HOMING MISSILES
  - 6th weapon type available in weapon selection
  - Missiles automatically track nearest enemy within 400px
  - Turn rate scales with power level (+0.01 per level)
  - Lower base speed (0.85x) but high accuracy
  - Rocket-shaped visuals with engine glow pulsing
  - Unique sawtooth shoot sound effect
  - Fires 1 + floor(power/2) missiles per shot
  - Contributes to weapon proficiency system

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
