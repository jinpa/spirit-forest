# Forest Spirit Journey - Studio Ghibli-Inspired Game

## Overview
A 2D endless runner game inspired by Studio Ghibli aesthetics. The player controls a large, round forest spirit (Totoro-style) that floats through a misty forest using an umbrella.

## Current State
The game is fully functional with all core mechanics implemented:
- Umbrella-based floating/gliding mechanic
- Bouncy tree canopy platforms
- Collectible acorns with score system
- Parallax scrolling backgrounds
- Peaceful reset animation

## Core Mechanics
- **Single Input**: Hold Spacebar or Mouse Click to open umbrella
  - Holding: Opens umbrella, applies lift force, creates gentle glide
  - Releasing: Closes umbrella, increases gravity for heavy descent
- **Bouncing**: Landing on tree canopies creates a springy bounce based on falling velocity
- **Scoring**: Collect acorns for points with combo multiplier system
- **Reset**: Falling below screen triggers a peaceful "resting in bushes" animation

## Project Architecture

### Frontend (client/)
- `client/src/pages/Game.tsx` - Main game component with canvas rendering, physics, and game loop
- `client/src/App.tsx` - App router pointing to the game

### Key Features
- HTML5 Canvas rendering with 60fps game loop
- Parallax scrolling misty forest background
- Fireflies with glowing effects
- Particle systems for bouncing and collecting
- Squishy, organic character animations
- Totoro-style forest spirit with umbrella

## Design Tokens
The game uses a soft watercolor palette:
- Sky: Deep blues (#1a3a4a to #8fb3c4)
- Forest: Soft greens (#2d4a3d to #5d8a6d)
- Character: Gray-green tones (#8b9a8b, #c4d4c4)
- Umbrella: Soft pink (#d47a8a, #e4a0a8)
- Acorns: Warm browns (#6b4423, #c4956a)

## Running the Game
The game runs on port 5000 via the "Start application" workflow.

## Controls
- **Desktop**: Hold Spacebar or Left Mouse Button
- **Mobile**: Touch and hold screen
