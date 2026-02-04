import { useEffect, useRef, useState, useCallback } from 'react';

interface Vector2 {
  x: number;
  y: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  bounceForce: number;
  swayOffset: number;
  swaySpeed: number;
}

interface Acorn {
  x: number;
  y: number;
  collected: boolean;
  bobOffset: number;
  rotation: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface Firefly {
  x: number;
  y: number;
  baseY: number;
  phase: number;
  speed: number;
  brightness: number;
  size: number;
}

interface GameState {
  position: Vector2;
  velocity: Vector2;
  isHolding: boolean;
  umbrellaOpen: number;
  squish: number;
  platforms: Platform[];
  acorns: Acorn[];
  particles: Particle[];
  fireflies: Firefly[];
  score: number;
  distance: number;
  isResetting: boolean;
  resetProgress: number;
  gameStarted: boolean;
  bestScore: number;
  combo: number;
  comboTimer: number;
  screenShake: number;
}

const GRAVITY = 0.55;
const LIFT_FORCE = -0.45;
const MAX_FALL_SPEED = 10;
const MAX_LIFT_SPEED = -5;
const HORIZONTAL_SPEED = 4;
const UMBRELLA_OPEN_SPEED = 0.12;
const UMBRELLA_CLOSE_SPEED = 0.15;
const BOUNCE_DAMPENING = 0.75;
const SQUISH_RECOVERY = 0.08;

const COLORS = {
  sky: {
    top: '#1a3a4a',
    middle: '#2d5a6b',
    bottom: '#4a7c8c',
    horizon: '#8fb3c4',
  },
  mist: ['rgba(200, 220, 230, 0.15)', 'rgba(180, 200, 210, 0.1)', 'rgba(160, 180, 190, 0.08)'],
  forest: {
    far: '#2d4a3d',
    mid: '#3d5a4d',
    near: '#4d6a5d',
    canopy: '#5d8a6d',
  },
  character: {
    body: '#8b9a8b',
    belly: '#c4d4c4',
    eyes: '#2a3a2a',
    nose: '#5a6a5a',
    umbrella: '#d47a8a',
    umbrellaInner: '#e4a0a8',
  },
  acorn: {
    cap: '#6b4423',
    body: '#c4956a',
    highlight: '#e4c5a0',
  },
  ui: {
    text: '#f0f4f0',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
  leaves: ['#5d8a6d', '#7da88d', '#4d7a5d', '#8dc8a0'],
  petals: ['#f4b4c4', '#e4a0b0', '#fcd4e0', '#f0c0d0'],
};

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>({
    position: { x: 150, y: 200 },
    velocity: { x: 0, y: 0 },
    isHolding: false,
    umbrellaOpen: 0,
    squish: 1,
    platforms: [],
    acorns: [],
    particles: [],
    fireflies: [],
    score: 0,
    distance: 0,
    isResetting: false,
    resetProgress: 0,
    gameStarted: false,
    bestScore: 0,
    combo: 0,
    comboTimer: 0,
    screenShake: 0,
  });
  const animationFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [displayDistance, setDisplayDistance] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [bestScore, setBestScore] = useState(0);
  const [displayCombo, setDisplayCombo] = useState(0);

  const generateFirefly = useCallback((): Firefly => {
    return {
      x: Math.random() * 1200,
      y: 100 + Math.random() * 400,
      baseY: 100 + Math.random() * 400,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.5,
      brightness: Math.random(),
      size: 2 + Math.random() * 3,
    };
  }, []);

  const generatePlatform = useCallback((startX: number): Platform => {
    return {
      x: startX,
      y: 300 + Math.random() * 200,
      width: 120 + Math.random() * 80,
      height: 30,
      bounceForce: 0.6 + Math.random() * 0.3,
      swayOffset: Math.random() * Math.PI * 2,
      swaySpeed: 0.5 + Math.random() * 0.5,
    };
  }, []);

  const generateAcorn = useCallback((startX: number): Acorn => {
    return {
      x: startX,
      y: 150 + Math.random() * 250,
      collected: false,
      bobOffset: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
    };
  }, []);

  const spawnParticles = useCallback((x: number, y: number, type: 'bounce' | 'collect' | 'leaf') => {
    const state = gameStateRef.current;
    const count = type === 'collect' ? 12 : type === 'bounce' ? 8 : 3;
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = type === 'collect' ? 2 + Math.random() * 3 : 1 + Math.random() * 2;
      const colors = type === 'collect' ? COLORS.petals : type === 'bounce' ? COLORS.leaves : COLORS.mist;
      
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'collect' ? 2 : 1),
        life: 1,
        maxLife: 0.8 + Math.random() * 0.4,
        size: type === 'collect' ? 4 + Math.random() * 4 : 3 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }, []);

  const initGame = useCallback(() => {
    const state = gameStateRef.current;
    state.position = { x: 150, y: 200 };
    state.velocity = { x: 0, y: 0 };
    state.umbrellaOpen = 0;
    state.squish = 1;
    state.platforms = [];
    state.acorns = [];
    state.particles = [];
    state.fireflies = [];
    state.score = 0;
    state.distance = 0;
    state.isResetting = false;
    state.resetProgress = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.screenShake = 0;

    for (let i = 0; i < 8; i++) {
      state.platforms.push(generatePlatform(200 + i * 250));
    }
    for (let i = 0; i < 12; i++) {
      state.acorns.push(generateAcorn(300 + i * 180 + Math.random() * 100));
    }
    for (let i = 0; i < 15; i++) {
      state.fireflies.push(generateFirefly());
    }
  }, [generatePlatform, generateAcorn, generateFirefly]);

  const updateGame = useCallback((deltaTime: number) => {
    const state = gameStateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    timeRef.current += deltaTime;

    if (!state.gameStarted) return;

    if (state.isResetting) {
      state.resetProgress += deltaTime * 0.5;
      if (state.resetProgress >= 1.5) {
        if (state.score > state.bestScore) {
          state.bestScore = state.score;
          setBestScore(state.score);
        }
        initGame();
        state.gameStarted = false;
        setShowInstructions(true);
      }
      return;
    }

    if (state.isHolding) {
      state.umbrellaOpen = Math.min(1, state.umbrellaOpen + UMBRELLA_OPEN_SPEED);
    } else {
      state.umbrellaOpen = Math.max(0, state.umbrellaOpen - UMBRELLA_CLOSE_SPEED);
    }

    const effectiveGravity = GRAVITY * (1 - state.umbrellaOpen * 0.7);
    const liftForce = state.isHolding ? LIFT_FORCE * state.umbrellaOpen : 0;
    
    state.velocity.y += effectiveGravity + liftForce;
    state.velocity.y = Math.max(MAX_LIFT_SPEED, Math.min(MAX_FALL_SPEED, state.velocity.y));

    state.position.y += state.velocity.y;
    state.distance += HORIZONTAL_SPEED;

    state.squish = 1 + (state.squish - 1) * (1 - SQUISH_RECOVERY);

    const characterRadius = 35;
    const characterBottom = state.position.y + characterRadius * state.squish;

    for (const platform of state.platforms) {
      const platformTop = platform.y + Math.sin(timeRef.current * platform.swaySpeed + platform.swayOffset) * 5;
      const relativeX = state.position.x - (platform.x - state.distance);
      
      if (relativeX > -characterRadius && relativeX < platform.width + characterRadius) {
        if (characterBottom >= platformTop && 
            characterBottom <= platformTop + platform.height + 10 &&
            state.velocity.y > 0) {
          const bounceStrength = Math.min(Math.abs(state.velocity.y) * platform.bounceForce * BOUNCE_DAMPENING, 12);
          state.velocity.y = -bounceStrength;
          state.squish = 0.7;
          state.position.y = platformTop - characterRadius;
          spawnParticles(state.position.x, platformTop, 'bounce');
        }
      }
    }

    if (state.comboTimer > 0) {
      state.comboTimer -= deltaTime;
      if (state.comboTimer <= 0) {
        state.combo = 0;
      }
    }

    if (state.screenShake > 0) {
      state.screenShake *= 0.85;
      if (state.screenShake < 0.05) state.screenShake = 0;
    }

    for (const acorn of state.acorns) {
      if (acorn.collected) continue;
      const relativeX = acorn.x - state.distance;
      const dx = state.position.x - relativeX;
      const dy = state.position.y - acorn.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < characterRadius + 15) {
        acorn.collected = true;
        state.combo++;
        state.comboTimer = 2;
        const comboMultiplier = Math.min(state.combo, 5);
        state.score += 10 * comboMultiplier;
        state.screenShake = Math.min(1 + state.combo * 0.3, 3);
        spawnParticles(relativeX, acorn.y, 'collect');
      }
    }

    for (const firefly of state.fireflies) {
      firefly.phase += deltaTime * firefly.speed * 0.5;
      firefly.y = firefly.baseY + Math.sin(firefly.phase) * 20;
      firefly.brightness = 0.5 + Math.sin(firefly.phase * 0.8) * 0.3;
    }

    state.platforms = state.platforms.filter(p => p.x - state.distance > -200);
    state.acorns = state.acorns.filter(a => a.x - state.distance > -100);

    while (state.platforms.length < 8) {
      const lastPlatform = state.platforms[state.platforms.length - 1];
      state.platforms.push(generatePlatform(lastPlatform.x + 200 + Math.random() * 100));
    }

    while (state.acorns.length < 12) {
      const lastAcorn = state.acorns[state.acorns.length - 1];
      state.acorns.push(generateAcorn(lastAcorn.x + 150 + Math.random() * 100));
    }

    state.particles = state.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= deltaTime / p.maxLife;
      return p.life > 0;
    });

    if (Math.random() < 0.005) {
      spawnParticles(
        state.position.x + 100 + Math.random() * 200,
        50 + Math.random() * 100,
        'leaf'
      );
    }

    if (state.position.y > canvas.height + 50) {
      state.isResetting = true;
      state.resetProgress = 0;
    }

    setDisplayScore(state.score);
    setDisplayDistance(Math.floor(state.distance / 10));
    setDisplayCombo(state.combo);
  }, [initGame, generatePlatform, generateAcorn, generateFirefly, spawnParticles]);

  const drawGame = useCallback((ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas;
    const state = gameStateRef.current;
    const time = timeRef.current;

    ctx.save();
    if (state.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * state.screenShake * 2;
      const shakeY = (Math.random() - 0.5) * state.screenShake * 2;
      ctx.translate(shakeX, shakeY);
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, COLORS.sky.top);
    gradient.addColorStop(0.3, COLORS.sky.middle);
    gradient.addColorStop(0.6, COLORS.sky.bottom);
    gradient.addColorStop(1, COLORS.sky.horizon);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const drawMistLayer = (yOffset: number, opacity: number, speed: number) => {
      ctx.fillStyle = `rgba(200, 220, 230, ${opacity})`;
      for (let i = 0; i < 5; i++) {
        const x = (((-state.distance * speed + i * 300) % (canvas.width + 200)) - 100);
        const y = yOffset + Math.sin(time * 0.5 + i) * 10;
        ctx.beginPath();
        ctx.ellipse(x, y, 150 + Math.sin(time + i) * 20, 40, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawMistLayer(100, 0.1, 0.08);
    drawMistLayer(180, 0.08, 0.12);

    const drawCloud = (baseX: number, y: number, size: number, speed: number) => {
      const x = ((baseX - state.distance * speed) % (canvas.width + 400)) - 100;
      ctx.fillStyle = 'rgba(220, 235, 245, 0.25)';
      ctx.beginPath();
      ctx.ellipse(x, y, size * 1.2, size * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x - size * 0.5, y + 5, size * 0.7, size * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + size * 0.6, y + 3, size * 0.8, size * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    drawCloud(200, 80, 60, 0.15);
    drawCloud(500, 120, 50, 0.12);
    drawCloud(800, 70, 70, 0.18);
    drawCloud(1100, 100, 55, 0.14);

    const drawForestLayer = (yBase: number, color: string, speed: number, treeHeight: number) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      
      for (let x = 0; x <= canvas.width + 100; x += 50) {
        const offsetX = (x - state.distance * speed) % 100;
        const treeY = yBase + Math.sin((x + state.distance * speed) * 0.02) * 20;
        const height = treeHeight + Math.sin((x + state.distance * speed) * 0.03 + 1) * 15;
        
        ctx.lineTo(x, treeY);
        ctx.lineTo(x + 25, treeY - height);
        ctx.lineTo(x + 50, treeY);
      }
      
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fill();
    };

    drawForestLayer(450, COLORS.forest.far, 0.15, 80);
    drawForestLayer(480, COLORS.forest.mid, 0.3, 100);
    drawForestLayer(520, COLORS.forest.near, 0.5, 120);

    for (const firefly of state.fireflies) {
      const relativeX = ((firefly.x - state.distance * 0.15) % (canvas.width + 100));
      const adjustedX = relativeX < 0 ? relativeX + canvas.width + 100 : relativeX;
      
      ctx.save();
      ctx.globalAlpha = firefly.brightness * 0.5;
      
      const glowGradient = ctx.createRadialGradient(adjustedX, firefly.y, 0, adjustedX, firefly.y, firefly.size * 6);
      glowGradient.addColorStop(0, 'rgba(255, 255, 200, 0.4)');
      glowGradient.addColorStop(0.4, 'rgba(255, 255, 180, 0.2)');
      glowGradient.addColorStop(1, 'rgba(255, 255, 150, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(adjustedX, firefly.y, firefly.size * 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(255, 255, 220, 0.8)';
      ctx.beginPath();
      ctx.arc(adjustedX, firefly.y, firefly.size * 0.8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }

    for (const platform of state.platforms) {
      const relativeX = platform.x - state.distance;
      if (relativeX < -200 || relativeX > canvas.width + 100) continue;

      const swayY = Math.sin(time * platform.swaySpeed + platform.swayOffset) * 5;
      const y = platform.y + swayY;

      ctx.save();
      ctx.translate(relativeX + platform.width / 2, y);

      const trunkGradient = ctx.createLinearGradient(0, 0, 0, 80);
      trunkGradient.addColorStop(0, '#5a4a3a');
      trunkGradient.addColorStop(1, '#3a2a1a');
      ctx.fillStyle = trunkGradient;
      ctx.fillRect(-8, 0, 16, 80);

      const canopyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, platform.width * 0.6);
      canopyGradient.addColorStop(0, '#7daa8d');
      canopyGradient.addColorStop(0.5, COLORS.forest.canopy);
      canopyGradient.addColorStop(1, '#4d7a5d');
      ctx.fillStyle = canopyGradient;

      ctx.beginPath();
      ctx.ellipse(0, -10, platform.width * 0.5, 25, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(-platform.width * 0.2, -5, platform.width * 0.3, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(platform.width * 0.15, 0, platform.width * 0.35, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.ellipse(-10, -15, platform.width * 0.2, 10, -0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    for (const acorn of state.acorns) {
      if (acorn.collected) continue;
      const relativeX = acorn.x - state.distance;
      if (relativeX < -50 || relativeX > canvas.width + 50) continue;

      const bobY = acorn.y + Math.sin(time * 2 + acorn.bobOffset) * 5;
      const rotation = Math.sin(time * 1.5 + acorn.bobOffset) * 0.2;

      ctx.save();
      ctx.translate(relativeX, bobY);
      ctx.rotate(rotation);

      ctx.fillStyle = COLORS.acorn.body;
      ctx.beginPath();
      ctx.ellipse(0, 5, 10, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = COLORS.acorn.cap;
      ctx.beginPath();
      ctx.ellipse(0, -5, 12, 8, 0, Math.PI, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#4a3413';
      ctx.beginPath();
      ctx.ellipse(0, -10, 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = COLORS.acorn.highlight;
      ctx.beginPath();
      ctx.ellipse(-3, 2, 3, 4, -0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    for (const particle of state.particles) {
      ctx.save();
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.ellipse(particle.x, particle.y, particle.size, particle.size * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const drawCharacter = () => {
      const { position, squish, umbrellaOpen, velocity } = state;
      
      ctx.save();
      ctx.translate(position.x, position.y);

      const tilt = velocity.y * 0.02;
      ctx.rotate(tilt);

      const scaleX = 1 + (1 - squish) * 0.3;
      const scaleY = squish;
      ctx.scale(scaleX, scaleY);

      if (umbrellaOpen > 0.1) {
        const umbrellaY = -45 - umbrellaOpen * 15;
        const umbrellaSize = 35 + umbrellaOpen * 25;

        ctx.save();
        ctx.translate(0, umbrellaY);
        
        ctx.strokeStyle = '#8b5a4a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, umbrellaSize * 0.8);
        ctx.lineTo(0, -5);
        ctx.stroke();

        const umbrellaGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, umbrellaSize);
        umbrellaGradient.addColorStop(0, COLORS.character.umbrellaInner);
        umbrellaGradient.addColorStop(1, COLORS.character.umbrella);
        ctx.fillStyle = umbrellaGradient;

        ctx.beginPath();
        ctx.ellipse(0, 0, umbrellaSize, umbrellaSize * 0.4 * umbrellaOpen, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#c06070';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const angle = Math.PI + (Math.PI * i) / 7;
          const ribX = Math.cos(angle) * umbrellaSize;
          const ribY = Math.sin(angle) * umbrellaSize * 0.4 * umbrellaOpen;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(ribX, ribY);
          ctx.stroke();
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.ellipse(-umbrellaSize * 0.3, -umbrellaSize * 0.15 * umbrellaOpen, 
          umbrellaSize * 0.25, umbrellaSize * 0.1 * umbrellaOpen, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      const bodyGradient = ctx.createRadialGradient(-10, -10, 0, 0, 0, 40);
      bodyGradient.addColorStop(0, '#a0b0a0');
      bodyGradient.addColorStop(0.7, COLORS.character.body);
      bodyGradient.addColorStop(1, '#6b7a6b');
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, 35, 38, 0, 0, Math.PI * 2);
      ctx.fill();

      const bellyGradient = ctx.createRadialGradient(0, 8, 0, 0, 8, 25);
      bellyGradient.addColorStop(0, '#d4e4d4');
      bellyGradient.addColorStop(1, COLORS.character.belly);
      ctx.fillStyle = bellyGradient;
      ctx.beginPath();
      ctx.ellipse(0, 8, 22, 25, 0, 0, Math.PI * 2);
      ctx.fill();

      const breathe = Math.sin(time * 2) * 2;

      ctx.fillStyle = COLORS.character.belly;
      ctx.beginPath();
      ctx.ellipse(0, 5 + breathe * 0.5, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#7a8a7a';
        ctx.beginPath();
        ctx.ellipse(-6 + i * 6, 12 + breathe * 0.3, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.ellipse(-12, -12, 10, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(12, -12, 10, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      const blinkPhase = Math.sin(time * 0.5);
      const eyeOpenness = blinkPhase > 0.95 ? 0.2 : 1;

      ctx.fillStyle = COLORS.character.eyes;
      ctx.beginPath();
      ctx.ellipse(-12, -10, 5, 6 * eyeOpenness, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(12, -10, 5, 6 * eyeOpenness, 0, 0, Math.PI * 2);
      ctx.fill();

      if (eyeOpenness > 0.5) {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(-10, -12, 2, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(14, -12, 2, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = COLORS.character.nose;
      ctx.beginPath();
      ctx.ellipse(0, -2, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#4a5a4a';
      ctx.beginPath();
      ctx.ellipse(0, -2, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#5a6a5a';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 3; i++) {
          const whiskerY = -2 + i * 4;
          ctx.beginPath();
          ctx.moveTo(side * 8, whiskerY);
          ctx.lineTo(side * 30, whiskerY - 5 + i * 5 + Math.sin(time * 3 + i) * 2);
          ctx.stroke();
        }
      }

      ctx.fillStyle = '#7a8a7a';
      ctx.beginPath();
      ctx.ellipse(-25, -35, 8, 18, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(25, -35, 8, 18, 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = COLORS.character.belly;
      ctx.beginPath();
      ctx.ellipse(-25, -30, 4, 8, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(25, -30, 4, 8, 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    if (state.isResetting) {
      const progress = state.resetProgress;
      const fadeIn = Math.min(progress * 2, 1);
      
      ctx.fillStyle = `rgba(200, 220, 200, ${fadeIn * 0.8})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.globalAlpha = fadeIn;
      ctx.translate(canvas.width / 2, canvas.height / 2 + Math.sin(progress * Math.PI) * 50);
      
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i) / 5 + progress * 2;
        const leafX = Math.cos(angle) * (50 + progress * 30);
        const leafY = Math.sin(angle) * 30 - progress * 50;
        
        ctx.fillStyle = COLORS.leaves[i % COLORS.leaves.length];
        ctx.beginPath();
        ctx.ellipse(leafX, leafY, 15, 8, angle, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.translate(0, 20);
      ctx.scale(1 + Math.sin(progress * Math.PI * 2) * 0.1, 1);
      
      ctx.fillStyle = '#6a9a6a';
      for (let i = 0; i < 7; i++) {
        const bushX = -80 + i * 25 + Math.sin(i + progress * 5) * 5;
        const bushY = 30 + Math.sin(i * 2 + progress * 3) * 10;
        ctx.beginPath();
        ctx.ellipse(bushX, bushY, 30, 25, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      drawCharacter();
      ctx.restore();

      ctx.fillStyle = COLORS.ui.text;
      ctx.font = 'bold 24px "Architects Daughter", cursive';
      ctx.textAlign = 'center';
      
      const restPhase = Math.min(progress * 2, 1);
      if (restPhase < 0.5) {
        ctx.fillText('Softly landing...', canvas.width / 2, canvas.height - 80);
      } else if (progress < 1.2) {
        ctx.fillText('Resting in the soft bushes...', canvas.width / 2, canvas.height - 80);
      } else {
        ctx.globalAlpha = 0.5 + Math.sin(time * 2) * 0.3;
        ctx.fillText('Click or press SPACE to continue...', canvas.width / 2, canvas.height - 80);
        ctx.globalAlpha = 1;
      }
    } else {
      drawCharacter();
    }

    ctx.fillStyle = COLORS.ui.shadow;
    ctx.font = 'bold 28px "Architects Daughter", cursive';
    ctx.textAlign = 'left';
    ctx.fillText(`Acorns: ${displayScore}`, 22, 42);
    ctx.fillStyle = COLORS.ui.text;
    ctx.fillText(`Acorns: ${displayScore}`, 20, 40);

    ctx.fillStyle = COLORS.ui.shadow;
    ctx.fillText(`Distance: ${displayDistance}m`, 22, 77);
    ctx.fillStyle = COLORS.ui.text;
    ctx.fillText(`Distance: ${displayDistance}m`, 20, 75);

    if (bestScore > 0) {
      ctx.fillStyle = COLORS.ui.shadow;
      ctx.textAlign = 'right';
      ctx.fillText(`Best: ${bestScore}`, canvas.width - 18, 42);
      ctx.fillStyle = '#ffd700';
      ctx.fillText(`Best: ${bestScore}`, canvas.width - 20, 40);
    }

    if (displayCombo > 1 && state.comboTimer > 0) {
      const comboScale = 1 + Math.sin(time * 10) * 0.1;
      ctx.save();
      ctx.translate(canvas.width / 2, 100);
      ctx.scale(comboScale, comboScale);
      ctx.textAlign = 'center';
      ctx.font = 'bold 36px "Architects Daughter", cursive';
      ctx.fillStyle = COLORS.ui.shadow;
      ctx.fillText(`${displayCombo}x Combo!`, 2, 2);
      const comboColor = displayCombo >= 5 ? '#ffd700' : displayCombo >= 3 ? '#ff9944' : '#ff6688';
      ctx.fillStyle = comboColor;
      ctx.fillText(`${displayCombo}x Combo!`, 0, 0);
      ctx.restore();
    }

    ctx.restore();

    if (showInstructions && !state.gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = COLORS.ui.text;
      ctx.font = 'bold 42px "Architects Daughter", cursive';
      ctx.textAlign = 'center';
      ctx.fillText('Forest Spirit Journey', canvas.width / 2, canvas.height / 2 - 80);

      ctx.font = '24px "Architects Daughter", cursive';
      ctx.fillText('Hold SPACE or CLICK to open umbrella and float', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText('Release to fall and bounce on tree canopies', canvas.width / 2, canvas.height / 2 + 20);
      ctx.fillText('Collect acorns along the way!', canvas.width / 2, canvas.height / 2 + 60);

      ctx.font = 'bold 28px "Architects Daughter", cursive';
      const pulse = 0.7 + Math.sin(time * 3) * 0.3;
      ctx.globalAlpha = pulse;
      ctx.fillText('Click or Press SPACE to begin', canvas.width / 2, canvas.height / 2 + 130);
      ctx.globalAlpha = 1;
    }
  }, [displayScore, displayDistance, displayCombo, bestScore, showInstructions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    initGame();

    let lastTime = performance.now();

    const gameLoop = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      updateGame(deltaTime);
      drawGame(ctx);

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [initGame, updateGame, drawGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        const state = gameStateRef.current;
        if (!state.gameStarted && !state.isResetting) {
          state.gameStarted = true;
          setShowInstructions(false);
        }
        state.isHolding = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        gameStateRef.current.isHolding = false;
      }
    };

    const handleMouseDown = () => {
      const state = gameStateRef.current;
      if (!state.gameStarted && !state.isResetting) {
        state.gameStarted = true;
        setShowInstructions(false);
      }
      state.isHolding = true;
    };

    const handleMouseUp = () => {
      gameStateRef.current.isHolding = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const state = gameStateRef.current;
      if (!state.gameStarted && !state.isResetting) {
        state.gameStarted = true;
        setShowInstructions(false);
      }
      state.isHolding = true;
    };

    const handleTouchEnd = () => {
      gameStateRef.current.isHolding = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div className="w-full h-screen overflow-hidden bg-[#1a3a4a]" data-testid="game-container">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        data-testid="game-canvas"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}
