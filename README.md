# Stellar Defense

A pure front-end bullet-hell space shooter built with HTML5 Canvas & vanilla JavaScript. Zero dependencies — open `index.html` and play instantly.

**[Play Online](https://your-username.github.io/Kimi2.6-AIGC-Webgame-Project/)** *(after enabling GitHub Pages)*

## Controls

| Key | Action |
|-----|--------|
| `W` `A` `S` `D` / Arrows | Move |
| `Space` / `J` | Shoot |
| `K` / `X` | Dash — quick invincible burst while moving |
| `Shift` | Slow (focus mode) |
| `B` | Bomb — clears enemy bullets, damages all enemies, brief slow-mo |
| `P` | Pause |
| `R` | Quick restart (game over) |
| `ESC` | Return to menu (game over) |

Touch devices: drag left side to move, tap right side to shoot, middle area for slow/focus mode.

## Features

- **6 enemy types** with unique AI & bullet patterns
  - **Drone** — basic swarm unit
  - **Hunter** — actively tracks the player
  - **Tank** — heavy armor, shotgun spread shots
  - **Swarmer** — fast, weak kamikaze units (wave 2+)
  - **Sniper** — high-speed aimed bullets from wave 4
  - **Boss** — appears every 5 waves with rotating attack phases (spiral, aimed burst, ring)
- **Elite variant system** — 8% chance for enhanced enemies with boosted stats and higher score
- **Dash system** — quick burst of speed with invincibility frames
- **Power-up system**
  - Energy (+HP)
  - Power (upgrade your shot pattern, up to 5 levels)
  - Shield (temporary invincibility)
- **Bomb system** — classic danmaku panic button; clears bullets, damages enemies, and triggers brief slow-motion
- **Combo Guard** — death save when combo >= 10 (one use per run)
- **Graze system** — earn bonus points by narrowly dodging enemy bullets
- **3 difficulty levels** — Easy / Normal / Hard (affects enemy HP, bullet speed & density)
- **Combo scoring** — chain kills for bonus multipliers; milestones at 10/25/50/100
- **Wave clear bonuses** — rewards based on remaining HP; extra for perfect no-damage waves
- **Spawn warnings** — red indicators show where enemies are about to appear
- **Danger zone & low-HP warnings** — visual alerts when you're in trouble
- **Wave-based screen border** — border color shifts from blue to red as waves get harder
- **Achievements** — 6 unlockable achievements, persisted via `localStorage`
- **Stats tracking** — total games, kills, best wave, total graze
- **Local leaderboard** — top 5 scores with medals, persisted via `localStorage`
- **Local high score** — also persisted via `localStorage`
- **Procedural waves** — difficulty scales infinitely
- **Touch / mobile support** — virtual controls for phones & tablets
- **Fullscreen support** — one-click fullscreen from the menu
- **Background music** — procedural synth music with on/off toggle
- **Juice**
  - Screen shake, particle explosions, bullet trails, engine glow
  - Bomb shockwave, combo celebrations, slow-mo effects
  - Dash trails, damage flash, hitstop on enemy hits
  - Elite enemy gold borders, Boss intro WARNING sequence
- **Web Audio API** synthesized SFX & music — no external assets needed

## Project Structure

```
.
├── index.html                  # Game entry
├── css/style.css               # UI & responsive layout
├── js/game.js                  # Core engine (~900 lines)
├── .github/workflows/pages.yml # GitHub Pages auto-deploy
├── CHANGELOG.md                # Version history
├── LICENSE                     # MIT
└── README.md                   # This file
```

## Deploy

This repo includes a GitHub Actions workflow (`.github/workflows/pages.yml`) that auto-deploys to GitHub Pages on every push to `main`/`master`.

To enable:
1. Go to **Settings → Pages** in your GitHub repo
2. Set **Source** to "GitHub Actions"
3. Push to `main` — the workflow will deploy automatically

## License

MIT License — see [LICENSE](./LICENSE).
