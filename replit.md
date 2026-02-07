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

## Project Architecture

### Frontend (client/)
- `client/src/pages/Game.tsx` - React wrapper that initializes and manages the Phaser game instance
- `client/src/game/ForestSpiritScene.ts` - Main Phaser scene with all game logic, physics, rendering
- `client/src/App.tsx` - App router pointing to the game

### Technology
- **Phaser 3** (v3.90.0) - Game framework handling rendering, input, and game loop
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
