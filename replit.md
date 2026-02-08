# Forest Spirit Journey - Studio Ghibli-Inspired Game

## Overview
A 2D endless runner game inspired by Studio Ghibli aesthetics. The player controls a large, round forest spirit (Totoro-style) that floats through a misty forest using an umbrella. Built with Phaser 3 game framework for smooth performance.

## Current State
The game is fully functional with all core mechanics implemented:
- Umbrella-based floating/gliding mechanic
- Bouncy tree canopy platforms
- Collectible acorns with score system
- Parallax scrolling backgrounds with floating clouds
- Peaceful reset animation
- Fireflies with smooth, gentle glow
- Pause/restart controls
- Synthesized wind-chime sound effects with toggle
- Wind gust difficulty mechanic with progressive scaling

## Core Mechanics
- **Single Input**: Hold Spacebar or Mouse Click to open umbrella
  - Holding: Opens umbrella, applies lift force, creates gentle glide
  - Releasing: Closes umbrella, increases gravity for heavy descent
- **Bouncing**: Landing on tree canopies creates a springy bounce based on falling velocity
- **Scoring**: Collect acorns for points with combo multiplier system
- **Reset**: Falling below screen triggers a peaceful "resting in bushes" animation
- **Pause**: Press ESC or click the pause button (top-right) during gameplay
  - Shows overlay with Resume and Restart options
  - All game logic freezes (physics, animations, scoring)
  - Resume: Press ESC or click Resume
  - Restart: Press R or click Restart (starts fresh run immediately)
- **Wind Gusts**: Progressive difficulty mechanic with varied directions
  - Start appearing after distance 1500
  - Frequency increases from every 8-12s down to 4-8s as distance grows
  - Strength scales from 0.4 to 1.0 based on distance (caps at 15000)
  - **Four gust types** with different visual tints and physics:
    - Headwind (40%): pushes back; umbrella open = upward lift + strong knockback, closed = downward push + mild knockback
    - Tailwind (25%): pushes forward; umbrella open = lift + forward boost, closed = mild forward push
    - Updraft (20%): pushes up; umbrella open = very strong lift, closed = moderate lift
    - Downdraft (15%): pushes down; umbrella open = strong downward push + knockback, closed = moderate downward push
  - Visual: semi-transparent column with directional wavy streaks and floating leaf particles; tint varies by type (blue=headwind, green=tailwind, warm=updraft, purple=downdraft)
  - Sound: warning whoosh builds as gust approaches (within 400px), volume scales with proximity
  - **Forward drift recovery**: spirit gradually returns to default X position after being knocked back or forward, preventing permanent edge-trapping

## Sound System
- **SoundManager** (`client/src/game/SoundManager.ts`) - Web Audio API synthesizer
  - Bounce: Wind-chime tones (sine waves with harmonics + noise burst)
  - Collect: Shimmer chimes that rise in pitch with combo count
  - Umbrella: Gentle continuous hum with LFO vibrato while open
  - Sink: Descending tone when falling off screen
  - Ambient: Random wind chime notes every 4-10 seconds
  - Wind Gust: Low sine oscillator + filtered noise whoosh, volume scales with proximity
- **iOS Support**: AudioContext unlock on first user interaction (silent buffer trick + resume), plus webkitAudioContext fallback
- **Toggle**: Clickable "Sound: ON/OFF" on start screen and pause menu
- **Default**: Sound enabled (ON)

## Project Architecture

### Frontend (client/)
- `client/src/pages/Game.tsx` - React wrapper that initializes and manages the Phaser game instance
- `client/src/game/ForestSpiritScene.ts` - Main Phaser scene with all game logic, physics, rendering
- `client/src/game/SoundManager.ts` - Web Audio API sound synthesis engine
- `client/src/App.tsx` - App router pointing to the game

### Technology
- **Phaser 3** (v3.90.0) - Game framework handling rendering, input, and game loop
- **Web Audio API** - Procedural sound synthesis (no audio files)
- **WebGL** rendering with 60fps target
- **React** wrapper for lifecycle management

### Key Features
- Phaser 3 WebGL rendering with 60fps game loop
- Parallax scrolling misty forest background with floating clouds
- Fireflies with smooth, gentle glow effects
- Particle systems for bouncing and collecting
- Squishy, organic character animations
- Totoro-style forest spirit with umbrella
- Phaser Text objects for UI (score, distance, combo, instructions)
- Pause/restart menu with ESC key and clickable pause button
- Synthesized wind-chime sound effects with on/off toggle
- Wind gust difficulty system with umbrella-dependent physics

## Design Tokens
The game uses a soft watercolor palette:
- Sky: Deep blues (#1a3a4a to #8fb3c4)
- Forest: Soft greens (#2d4a3d to #5d8a6d)
- Character: Gray-green tones (#8b9a8b, #c4d4c4)
- Umbrella: Soft pink (#d47a8a, #e4a0a8)
- Acorns: Warm browns (#6b4423, #c4956a)

## Physics Constants
- Gravity: 0.55
- Lift Force: -0.45
- Max Fall Speed: 10
- Max Lift Speed: -5
- Horizontal Speed: 4

## Running the Game
The game runs on port 5000 via the "Start application" workflow.

## Controls
- **Desktop**: Hold Spacebar or Left Mouse Button to float
- **Pause**: Press ESC key or click pause button (top-right corner)
- **Restart**: Press R while paused, or click Restart in pause menu
- **Mobile**: Touch and hold screen
