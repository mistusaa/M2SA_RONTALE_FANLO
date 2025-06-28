class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.message = data?.message || 'Game Over!';
  }

  create() {
    const { width, height } = this.cameras.main;

    this.add.rectangle(0, 0, width * 2, height * 2, 0x000000, 0.7).setOrigin(0);

    this.add.text(width / 2, height / 2 - 50, this.message, {
      fontSize: '32px',
      fill: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    const restartBtn = this.add.text(width / 2, height / 2 + 10, 'Restart Level', {
      fontSize: '24px',
      fill: '#ffffff',
      backgroundColor: '#ff0000',
      padding: { x: 20, y: 10 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      
      if (this.sound.context.state === 'suspended') {
        this.sound.context.resume();
      }
      
      this.scene.start('GameScene1');
    });

    restartBtn.on('pointerover', () => restartBtn.setStyle({ fill: '#ffff00' }));
    restartBtn.on('pointerout', () => restartBtn.setStyle({ fill: '#ffffff' }));
  }
}

window.GameOverScene = GameOverScene;
