import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { ForestSpiritScene } from '../game/ForestSpiritScene';

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#1a3a4a',
      scene: [ForestSpiritScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      input: {
        keyboard: true,
        mouse: true,
        touch: true,
      },
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false,
      },
      fps: {
        target: 60,
        forceSetTimeOut: false,
      },
    };

    gameRef.current = new Phaser.Game(config);

    const handleResize = () => {
      if (gameRef.current) {
        gameRef.current.scale.resize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-screen overflow-hidden bg-[#1a3a4a]"
      data-testid="game-container"
      style={{ touchAction: 'none' }}
    />
  );
}
