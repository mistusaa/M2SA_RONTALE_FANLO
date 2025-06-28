const config = {
  type: Phaser.AUTO,
  width: 1000,
  height: 900,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  pixelArt: true, // Ensures pixel-perfect rendering for sprites
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1000 },
      debug: false
    }
  },
  render: {
    pixelArt: true,          // Keep pixels sharp
    antialias: false,        // Disable smoothing for graphics
    roundPixels: true        // Align rendering to whole pixels (important for zoom)
  },
  scene: [
    MainMenu,
    IntroductionScene,
    GameScene1,
    GameScene2,
    GameScene3,
    GameScene4,
    GameScene5,
    GameOverScene
  ]
};

const game = new Phaser.Game(config);
