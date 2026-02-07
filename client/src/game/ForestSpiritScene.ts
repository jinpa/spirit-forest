import Phaser from 'phaser';

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
  sky: [
    { r: 0x1a, g: 0x3a, b: 0x4a },
    { r: 0x2d, g: 0x5a, b: 0x6b },
    { r: 0x4a, g: 0x7c, b: 0x8c },
    { r: 0x8f, g: 0xb3, b: 0xc4 },
  ],
  forest: { far: 0x2d4a3d, mid: 0x3d5a4d, near: 0x4d6a5d, canopy: 0x5d8a6d },
  char: { body: 0x8b9a8b, belly: 0xc4d4c4, eyes: 0x2a3a2a, nose: 0x5a6a5a, umbrella: 0xd47a8a, umbrellaInner: 0xe4a0a8 },
  acorn: { cap: 0x6b4423, body: 0xc4956a, highlight: 0xe4c5a0, stem: 0x4a3413 },
  leaves: [0x5d8a6d, 0x7da88d, 0x4d7a5d, 0x8dc8a0],
  petals: [0xf4b4c4, 0xe4a0b0, 0xfcd4e0, 0xf0c0d0],
};

interface Platform { x: number; y: number; width: number; height: number; bounceForce: number; swayOffset: number; swaySpeed: number; }
interface Acorn { x: number; y: number; collected: boolean; bobOffset: number; rotation: number; }
interface GP { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: number; }
interface Firefly { x: number; y: number; baseY: number; phase: number; speed: number; brightness: number; size: number; }

export class ForestSpiritScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;
  private posX = 150;
  private posY = 200;
  private velY = 0;
  private isHolding = false;
  private umbrellaOpen = 0;
  private squish = 1;
  private platforms: Platform[] = [];
  private acorns: Acorn[] = [];
  private particles: GP[] = [];
  private fireflies: Firefly[] = [];
  private score = 0;
  private dist = 0;
  private isResetting = false;
  private resetProgress = 0;
  private started = false;
  private bestScore = 0;
  private combo = 0;
  private comboTimer = 0;
  private shake = 0;
  private t = 0;
  private showInst = true;

  private titleText!: Phaser.GameObjects.Text;
  private instrText1!: Phaser.GameObjects.Text;
  private instrText2!: Phaser.GameObjects.Text;
  private instrText3!: Phaser.GameObjects.Text;
  private startText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private distText!: Phaser.GameObjects.Text;
  private bestText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private resetText!: Phaser.GameObjects.Text;
  private overlay!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'ForestSpiritScene' });
  }

  create() {
    this.gfx = this.add.graphics();
    this.overlay = this.add.graphics();

    const fontBase = { fontFamily: '"Architects Daughter", cursive', color: '#f0f4f0' };
    const shadow = { offsetX: 2, offsetY: 2, color: 'rgba(0,0,0,0.3)', fill: true, blur: 0 };

    this.scoreText = this.add.text(20, 20, '', { ...fontBase, fontSize: '28px', fontStyle: 'bold', shadow }).setDepth(10);
    this.distText = this.add.text(20, 55, '', { ...fontBase, fontSize: '28px', fontStyle: 'bold', shadow }).setDepth(10);
    this.bestText = this.add.text(this.scale.width - 20, 20, '', { ...fontBase, fontSize: '28px', fontStyle: 'bold', color: '#ffd700', shadow }).setOrigin(1, 0).setDepth(10);
    this.comboText = this.add.text(this.scale.width / 2, 100, '', { ...fontBase, fontSize: '36px', fontStyle: 'bold', shadow, align: 'center' }).setOrigin(0.5).setDepth(10);

    this.titleText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 80, 'Forest Spirit Journey', { ...fontBase, fontSize: '42px', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20);
    this.instrText1 = this.add.text(this.scale.width / 2, this.scale.height / 2 - 20, 'Hold SPACE or CLICK to open umbrella and float', { ...fontBase, fontSize: '24px' }).setOrigin(0.5).setDepth(20);
    this.instrText2 = this.add.text(this.scale.width / 2, this.scale.height / 2 + 20, 'Release to fall and bounce on tree canopies', { ...fontBase, fontSize: '24px' }).setOrigin(0.5).setDepth(20);
    this.instrText3 = this.add.text(this.scale.width / 2, this.scale.height / 2 + 60, 'Collect acorns along the way!', { ...fontBase, fontSize: '24px' }).setOrigin(0.5).setDepth(20);
    this.startText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 130, 'Click or Press SPACE to begin', { ...fontBase, fontSize: '28px', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20);

    this.resetText = this.add.text(this.scale.width / 2, this.scale.height - 80, '', { ...fontBase, fontSize: '24px', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20).setVisible(false);

    this.initGame();

    this.input.keyboard!.on('keydown-SPACE', (e: KeyboardEvent) => { e.preventDefault(); this.doHold(); });
    this.input.keyboard!.on('keyup-SPACE', () => { this.isHolding = false; });
    this.input.on('pointerdown', () => { this.doHold(); });
    this.input.on('pointerup', () => { this.isHolding = false; });

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.repositionUI(gameSize.width, gameSize.height);
    });
  }

  private repositionUI(w: number, h: number) {
    this.bestText.setX(w - 20);
    this.comboText.setX(w / 2);
    this.titleText.setPosition(w / 2, h / 2 - 80);
    this.instrText1.setPosition(w / 2, h / 2 - 20);
    this.instrText2.setPosition(w / 2, h / 2 + 20);
    this.instrText3.setPosition(w / 2, h / 2 + 60);
    this.startText.setPosition(w / 2, h / 2 + 130);
    this.resetText.setPosition(w / 2, h - 80);
  }

  private doHold() {
    if (!this.started && !this.isResetting) {
      this.started = true;
      this.showInst = false;
    }
    this.isHolding = true;
  }

  private initGame() {
    this.posX = 150; this.posY = 200; this.velY = 0;
    this.umbrellaOpen = 0; this.squish = 1;
    this.score = 0; this.dist = 0;
    this.isResetting = false; this.resetProgress = 0;
    this.combo = 0; this.comboTimer = 0; this.shake = 0;
    this.platforms = []; this.acorns = []; this.particles = []; this.fireflies = [];
    for (let i = 0; i < 8; i++) this.platforms.push(this.mkPlat(200 + i * 250));
    for (let i = 0; i < 12; i++) this.acorns.push(this.mkAcorn(300 + i * 180 + Math.random() * 100));
    for (let i = 0; i < 15; i++) this.fireflies.push(this.mkFF());
  }

  private mkPlat(sx: number): Platform {
    return { x: sx, y: 300 + Math.random() * 200, width: 120 + Math.random() * 80, height: 30, bounceForce: 0.6 + Math.random() * 0.3, swayOffset: Math.random() * Math.PI * 2, swaySpeed: 0.5 + Math.random() * 0.5 };
  }
  private mkAcorn(sx: number): Acorn {
    return { x: sx, y: 150 + Math.random() * 250, collected: false, bobOffset: Math.random() * Math.PI * 2, rotation: Math.random() * Math.PI * 2 };
  }
  private mkFF(): Firefly {
    const y = 100 + Math.random() * 400;
    return { x: Math.random() * 1200, y, baseY: y, phase: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 0.5, brightness: Math.random(), size: 2 + Math.random() * 3 };
  }

  private spawn(x: number, y: number, type: 'bounce' | 'collect' | 'leaf') {
    const count = type === 'collect' ? 12 : type === 'bounce' ? 8 : 3;
    const cols = type === 'collect' ? COLORS.petals : COLORS.leaves;
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const s = type === 'collect' ? 2 + Math.random() * 3 : 1 + Math.random() * 2;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (type === 'collect' ? 2 : 1), life: 1, maxLife: 0.8 + Math.random() * 0.4, size: type === 'collect' ? 4 + Math.random() * 4 : 3 + Math.random() * 3, color: cols[Math.floor(Math.random() * cols.length)] });
    }
  }

  update(_time: number, delta: number) {
    const dt = Math.min(delta / 1000, 0.1);
    this.t += dt;
    const W = this.scale.width;
    const H = this.scale.height;

    if (this.started && !this.isResetting) {
      this.umbrellaOpen = this.isHolding
        ? Math.min(1, this.umbrellaOpen + UMBRELLA_OPEN_SPEED)
        : Math.max(0, this.umbrellaOpen - UMBRELLA_CLOSE_SPEED);

      const eg = GRAVITY * (1 - this.umbrellaOpen * 0.7);
      const lift = this.isHolding ? LIFT_FORCE * this.umbrellaOpen : 0;
      this.velY = Phaser.Math.Clamp(this.velY + eg + lift, MAX_LIFT_SPEED, MAX_FALL_SPEED);
      this.posY += this.velY;
      this.dist += HORIZONTAL_SPEED;
      this.squish = 1 + (this.squish - 1) * (1 - SQUISH_RECOVERY);

      const cR = 35;
      const cBot = this.posY + cR * this.squish;
      for (const p of this.platforms) {
        const pTop = p.y + Math.sin(this.t * p.swaySpeed + p.swayOffset) * 5;
        const rx = this.posX - (p.x - this.dist);
        if (rx > -cR && rx < p.width + cR && cBot >= pTop && cBot <= pTop + p.height + 10 && this.velY > 0) {
          this.velY = -Math.min(Math.abs(this.velY) * p.bounceForce * BOUNCE_DAMPENING, 12);
          this.squish = 0.7;
          this.posY = pTop - cR;
          this.spawn(this.posX, pTop, 'bounce');
        }
      }

      if (this.comboTimer > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 0; }
      if (this.shake > 0) { this.shake *= 0.85; if (this.shake < 0.05) this.shake = 0; }

      for (const ac of this.acorns) {
        if (ac.collected) continue;
        const rx = ac.x - this.dist;
        const dx = this.posX - rx, dy = this.posY - ac.y;
        if (Math.sqrt(dx * dx + dy * dy) < cR + 15) {
          ac.collected = true; this.combo++; this.comboTimer = 2;
          this.score += 10 * Math.min(this.combo, 5);
          this.shake = Math.min(1 + this.combo * 0.3, 3);
          this.spawn(rx, ac.y, 'collect');
        }
      }

      for (const f of this.fireflies) {
        f.phase += dt * f.speed * 0.5;
        f.y = f.baseY + Math.sin(f.phase) * 20;
        f.brightness = 0.5 + Math.sin(f.phase * 0.8) * 0.3;
      }

      this.platforms = this.platforms.filter(p => p.x - this.dist > -200);
      this.acorns = this.acorns.filter(a => a.x - this.dist > -100);
      while (this.platforms.length < 8) { const l = this.platforms[this.platforms.length - 1]; this.platforms.push(this.mkPlat(l.x + 200 + Math.random() * 100)); }
      while (this.acorns.length < 12) { const l = this.acorns[this.acorns.length - 1]; this.acorns.push(this.mkAcorn(l.x + 150 + Math.random() * 100)); }

      this.particles = this.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= dt / p.maxLife; return p.life > 0; });
      if (Math.random() < 0.005) this.spawn(this.posX + 100 + Math.random() * 200, 50 + Math.random() * 100, 'leaf');

      if (this.posY > H + 50) { this.isResetting = true; this.resetProgress = 0; }
    }

    if (this.isResetting) {
      this.resetProgress += dt * 0.5;
      if (this.resetProgress >= 1.5) {
        if (this.score > this.bestScore) this.bestScore = this.score;
        this.initGame();
        this.started = false;
        this.showInst = true;
      }
    }

    const sx = this.shake > 0 ? (Math.random() - 0.5) * this.shake * 2 : 0;
    const sy = this.shake > 0 ? (Math.random() - 0.5) * this.shake * 2 : 0;

    const g = this.gfx;
    g.clear();
    this.overlay.clear();

    this.drawSky(g, W, H, sx, sy);
    this.drawMist(g, W, sx, sy);
    this.drawClouds(g, W, sx, sy);
    this.drawForestLayers(g, W, H, sx, sy);
    this.drawFF(g, W, sx, sy);
    this.drawPlats(g, W, sx, sy);
    this.drawAcorns2(g, W, sx, sy);
    this.drawParts(g, sx, sy);

    if (this.isResetting) {
      this.drawReset(g, W, H);
    } else {
      this.drawChar(g, sx, sy);
    }

    this.updateUI(W, H);
  }

  private lerp(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, f: number) {
    return { r: Math.round(a.r + (b.r - a.r) * f), g: Math.round(a.g + (b.g - a.g) * f), b: Math.round(a.b + (b.b - a.b) * f) };
  }
  private toHex(c: { r: number; g: number; b: number }) { return (c.r << 16) | (c.g << 8) | c.b; }

  private drawSky(g: Phaser.GameObjects.Graphics, W: number, H: number, sx: number, sy: number) {
    const steps = 30;
    const cs = COLORS.sky;
    for (let i = 0; i < steps; i++) {
      const f = i / steps;
      let c;
      if (f < 0.33) c = this.lerp(cs[0], cs[1], f / 0.33);
      else if (f < 0.66) c = this.lerp(cs[1], cs[2], (f - 0.33) / 0.33);
      else c = this.lerp(cs[2], cs[3], (f - 0.66) / 0.34);
      g.fillStyle(this.toHex(c), 1);
      g.fillRect(sx, (i / steps) * H + sy, W, H / steps + 1);
    }
  }

  private drawMist(g: Phaser.GameObjects.Graphics, W: number, sx: number, sy: number) {
    const layer = (yOff: number, a: number, sp: number) => {
      g.fillStyle(0xc8dce6, a);
      for (let i = 0; i < 5; i++) {
        const x = (((-this.dist * sp + i * 300) % (W + 200)) - 100) + sx;
        const y = yOff + Math.sin(this.t * 0.5 + i) * 10 + sy;
        g.fillEllipse(x, y, (150 + Math.sin(this.t + i) * 20) * 2, 80);
      }
    };
    layer(100, 0.1, 0.08);
    layer(180, 0.08, 0.12);
  }

  private drawClouds(g: Phaser.GameObjects.Graphics, W: number, sx: number, sy: number) {
    const dc = (bx: number, cy: number, sz: number, sp: number) => {
      const x = ((bx - this.dist * sp) % (W + 400)) - 100 + sx;
      const y = cy + sy;
      g.fillStyle(0xdcebf5, 0.25);
      g.fillEllipse(x, y, sz * 2.4, sz * 0.8);
      g.fillEllipse(x - sz * 0.5, y + 5, sz * 1.4, sz * 0.6);
      g.fillEllipse(x + sz * 0.6, y + 3, sz * 1.6, sz * 0.7);
    };
    dc(200, 80, 60, 0.15); dc(500, 120, 50, 0.12); dc(800, 70, 70, 0.18); dc(1100, 100, 55, 0.14);
  }

  private drawForestLayers(g: Phaser.GameObjects.Graphics, W: number, H: number, sx: number, sy: number) {
    const dl = (yBase: number, col: number, sp: number, th: number) => {
      g.fillStyle(col, 1);
      g.beginPath();
      g.moveTo(sx, H + sy);
      for (let x = 0; x <= W + 100; x += 50) {
        const ty = yBase + Math.sin((x + this.dist * sp) * 0.02) * 20 + sy;
        const h = th + Math.sin((x + this.dist * sp) * 0.03 + 1) * 15;
        g.lineTo(x + sx, ty);
        g.lineTo(x + 25 + sx, ty - h);
        g.lineTo(x + 50 + sx, ty);
      }
      g.lineTo(W + sx, H + sy);
      g.closePath();
      g.fillPath();
    };
    dl(450, COLORS.forest.far, 0.15, 80);
    dl(480, COLORS.forest.mid, 0.3, 100);
    dl(520, COLORS.forest.near, 0.5, 120);
  }

  private drawFF(g: Phaser.GameObjects.Graphics, W: number, sx: number, sy: number) {
    for (const f of this.fireflies) {
      let rx = ((f.x - this.dist * 0.15) % (W + 100));
      if (rx < 0) rx += W + 100;
      const x = rx + sx, y = f.y + sy;
      g.fillStyle(0xffffc8, f.brightness * 0.3);
      g.fillCircle(x, y, f.size * 6);
      g.fillStyle(0xffffdc, f.brightness * 0.6);
      g.fillCircle(x, y, f.size * 0.8);
    }
  }

  private drawPlats(g: Phaser.GameObjects.Graphics, W: number, sx: number, sy: number) {
    for (const p of this.platforms) {
      const rx = p.x - this.dist;
      if (rx < -200 || rx > W + 100) continue;
      const sway = Math.sin(this.t * p.swaySpeed + p.swayOffset) * 5;
      const px = rx + p.width / 2 + sx, py = p.y + sway + sy;

      g.fillStyle(0x5a4a3a, 1);
      g.fillRect(px - 8, py, 16, 80);

      g.fillStyle(0x7daa8d, 1);
      g.fillEllipse(px, py - 10, p.width, 50);
      g.fillStyle(COLORS.forest.canopy, 1);
      g.fillEllipse(px - p.width * 0.2, py - 5, p.width * 0.6, 40);
      g.fillStyle(0x4d7a5d, 1);
      g.fillEllipse(px + p.width * 0.15, py, p.width * 0.7, 44);
      g.fillStyle(0xffffff, 0.15);
      g.fillEllipse(px - 10, py - 15, p.width * 0.4, 20);
    }
  }

  private drawAcorns2(g: Phaser.GameObjects.Graphics, W: number, sx: number, sy: number) {
    for (const ac of this.acorns) {
      if (ac.collected) continue;
      const rx = ac.x - this.dist;
      if (rx < -50 || rx > W + 50) continue;
      const by = ac.y + Math.sin(this.t * 2 + ac.bobOffset) * 5;
      const x = rx + sx, y = by + sy;

      g.fillStyle(COLORS.acorn.body, 1);
      g.fillEllipse(x, y + 5, 20, 24);
      g.fillStyle(COLORS.acorn.cap, 1);
      g.fillEllipse(x, y - 5, 24, 16);
      g.fillStyle(COLORS.acorn.stem, 1);
      g.fillEllipse(x, y - 10, 4, 8);
      g.fillStyle(COLORS.acorn.highlight, 1);
      g.fillEllipse(x - 3, y + 2, 6, 8);
    }
  }

  private drawParts(g: Phaser.GameObjects.Graphics, sx: number, sy: number) {
    for (const p of this.particles) {
      g.fillStyle(p.color, p.life);
      g.fillEllipse(p.x + sx, p.y + sy, p.size * 2, p.size * 1.4);
    }
  }

  private drawChar(g: Phaser.GameObjects.Graphics, sx: number, sy: number) {
    const x = this.posX + sx, y = this.posY + sy;
    const uo = this.umbrellaOpen, sq = this.squish;
    const scX = 1 + (1 - sq) * 0.3;
    const breathe = Math.sin(this.t * 2) * 2;

    if (uo > 0.1) {
      const uy = y - (45 + uo * 15) * sq;
      const us = 35 + uo * 25;

      g.lineStyle(4, 0x8b5a4a, 1);
      g.beginPath(); g.moveTo(x, uy + us * 0.8); g.lineTo(x, uy - 5); g.strokePath();

      g.fillStyle(0xe4a0a8, 1);
      g.fillEllipse(x, uy, us * 2, us * 0.8 * uo);
      g.fillStyle(0xd47a8a, 0.5);
      g.fillEllipse(x, uy, us * 1.6, us * 0.6 * uo);

      g.lineStyle(2, 0xc06070, 1);
      for (let i = 0; i < 8; i++) {
        const a = Math.PI + (Math.PI * i) / 7;
        g.beginPath(); g.moveTo(x, uy); g.lineTo(x + Math.cos(a) * us, uy + Math.sin(a) * us * 0.4 * uo); g.strokePath();
      }
      g.fillStyle(0xffffff, 0.2);
      g.fillEllipse(x - us * 0.3, uy - us * 0.15 * uo, us * 0.5, us * 0.2 * uo);
    }

    g.fillStyle(0xa0b0a0, 1);
    g.fillEllipse(x, y, 70 * scX, 76 * sq);
    g.fillStyle(COLORS.char.body, 0.8);
    g.fillEllipse(x, y, 63 * scX, 68 * sq);
    g.fillStyle(0x6b7a6b, 0.3);
    g.fillEllipse(x + 5, y + 5, 56 * scX, 60 * sq);

    g.fillStyle(0xd4e4d4, 1);
    g.fillEllipse(x, y + 8 * sq, 44 * scX, 50 * sq);
    g.fillStyle(COLORS.char.belly, 0.6);
    g.fillEllipse(x, y + 8 * sq, 38 * scX, 44 * sq);

    g.fillStyle(COLORS.char.belly, 1);
    g.fillEllipse(x, y + (5 + breathe * 0.5) * sq, 16 * scX, 8 * sq);

    for (let i = 0; i < 3; i++) {
      g.fillStyle(0x7a8a7a, 1);
      g.fillEllipse(x + (-6 + i * 6) * scX, y + (12 + breathe * 0.3) * sq, 4 * scX, 6 * sq);
    }

    g.fillStyle(0xffffff, 1);
    g.fillEllipse(x - 12 * scX, y - 12 * sq, 20 * scX, 24 * sq);
    g.fillEllipse(x + 12 * scX, y - 12 * sq, 20 * scX, 24 * sq);

    const blink = Math.sin(this.t * 0.5) > 0.95 ? 0.2 : 1;
    g.fillStyle(COLORS.char.eyes, 1);
    g.fillEllipse(x - 12 * scX, y - 10 * sq, 10 * scX, 12 * blink * sq);
    g.fillEllipse(x + 12 * scX, y - 10 * sq, 10 * scX, 12 * blink * sq);

    if (blink > 0.5) {
      g.fillStyle(0xffffff, 1);
      g.fillEllipse(x - 10 * scX, y - 12 * sq, 4 * scX, 4 * sq);
      g.fillEllipse(x + 14 * scX, y - 12 * sq, 4 * scX, 4 * sq);
    }

    g.fillStyle(COLORS.char.nose, 1);
    g.fillEllipse(x, y - 2 * sq, 12 * scX, 8 * sq);
    g.fillStyle(0x4a5a4a, 1);
    g.fillEllipse(x, y - 2 * sq, 6 * scX, 4 * sq);

    g.lineStyle(2, 0x5a6a5a, 1);
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 3; i++) {
        const wy = y + (-2 + i * 4) * sq;
        g.beginPath();
        g.moveTo(x + side * 8 * scX, wy);
        g.lineTo(x + side * 30 * scX, wy - (5 - i * 5 - Math.sin(this.t * 3 + i) * 2) * sq);
        g.strokePath();
      }
    }

    g.fillStyle(0x7a8a7a, 1);
    g.fillEllipse(x - 25 * scX, y - 35 * sq, 16 * scX, 36 * sq);
    g.fillEllipse(x + 25 * scX, y - 35 * sq, 16 * scX, 36 * sq);
    g.fillStyle(COLORS.char.belly, 1);
    g.fillEllipse(x - 25 * scX, y - 30 * sq, 8 * scX, 16 * sq);
    g.fillEllipse(x + 25 * scX, y - 30 * sq, 8 * scX, 16 * sq);
  }

  private drawReset(g: Phaser.GameObjects.Graphics, W: number, H: number) {
    const prog = this.resetProgress;
    const fade = Math.min(prog * 2, 1);

    g.fillStyle(0xc8dcc8, fade * 0.8);
    g.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2 + Math.sin(prog * Math.PI) * 50;

    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5 + prog * 2;
      g.fillStyle(COLORS.leaves[i % 4], fade);
      g.fillEllipse(cx + Math.cos(a) * (50 + prog * 30), cy + Math.sin(a) * 30 - prog * 50, 30, 16);
    }

    g.fillStyle(0x6a9a6a, fade);
    for (let i = 0; i < 7; i++) {
      g.fillEllipse(cx - 80 + i * 25 + Math.sin(i + prog * 5) * 5, cy + 50 + Math.sin(i * 2 + prog * 3) * 10, 60, 50);
    }

    this.drawCharAt(g, cx, cy + 20, fade);
  }

  private drawCharAt(g: Phaser.GameObjects.Graphics, x: number, y: number, a: number) {
    const breathe = Math.sin(this.t * 2) * 2;
    g.fillStyle(0xa0b0a0, a); g.fillEllipse(x, y, 70, 76);
    g.fillStyle(COLORS.char.body, a * 0.8); g.fillEllipse(x, y, 63, 68);
    g.fillStyle(0xd4e4d4, a); g.fillEllipse(x, y + 8, 44, 50);
    g.fillStyle(COLORS.char.belly, a); g.fillEllipse(x, y + 5 + breathe * 0.5, 16, 8);
    g.fillStyle(0xffffff, a); g.fillEllipse(x - 12, y - 12, 20, 24); g.fillEllipse(x + 12, y - 12, 20, 24);
    g.fillStyle(COLORS.char.eyes, a); g.fillEllipse(x - 12, y - 10, 10, 4); g.fillEllipse(x + 12, y - 10, 10, 4);
    g.fillStyle(COLORS.char.nose, a); g.fillEllipse(x, y - 2, 12, 8);
    g.fillStyle(0x7a8a7a, a); g.fillEllipse(x - 25, y - 35, 16, 36); g.fillEllipse(x + 25, y - 35, 16, 36);
  }

  private updateUI(W: number, H: number) {
    this.scoreText.setText(`Acorns: ${this.score}`);
    this.distText.setText(`Distance: ${Math.floor(this.dist / 10)}m`);

    if (this.bestScore > 0) {
      this.bestText.setText(`Best: ${this.bestScore}`).setVisible(true);
    } else {
      this.bestText.setVisible(false);
    }

    if (this.combo > 1 && this.comboTimer > 0) {
      const col = this.combo >= 5 ? '#ffd700' : this.combo >= 3 ? '#ff9944' : '#ff6688';
      this.comboText.setText(`${this.combo}x Combo!`).setColor(col).setVisible(true);
      this.comboText.setScale(1 + Math.sin(this.t * 10) * 0.1);
    } else {
      this.comboText.setVisible(false);
    }

    const showInst = this.showInst && !this.started;
    this.overlay.clear();
    if (showInst) {
      this.overlay.fillStyle(0x000000, 0.4);
      this.overlay.fillRect(0, 0, W, H);
      this.overlay.setDepth(15);
    }
    this.titleText.setVisible(showInst);
    this.instrText1.setVisible(showInst);
    this.instrText2.setVisible(showInst);
    this.instrText3.setVisible(showInst);
    this.startText.setVisible(showInst);
    if (showInst) {
      this.startText.setAlpha(0.7 + Math.sin(this.t * 3) * 0.3);
    }

    if (this.isResetting) {
      this.resetText.setVisible(true);
      if (this.resetProgress < 0.5) {
        this.resetText.setText('Softly landing...');
      } else if (this.resetProgress < 1.2) {
        this.resetText.setText('Resting in the soft bushes...');
      } else {
        this.resetText.setText('Click or press SPACE to continue...');
        this.resetText.setAlpha(0.5 + Math.sin(this.t * 2) * 0.3);
      }
    } else {
      this.resetText.setVisible(false).setAlpha(1);
    }
  }
}
