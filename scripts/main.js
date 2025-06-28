const config = {
  type: Phaser.AUTO,
  width: 1000,
  height: 900,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  pixelArt: true, 
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1000 },
      debug: false
    }
  },
  render: {
    pixelArt: true,          
    antialias: false,        
    roundPixels: true        
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
