class IntroductionScene extends Phaser.Scene {
  constructor() {
    super('IntroductionScene');
  }

  preload() {
    this.load.spritesheet('pink_guy_idle', 'assets/sprites/player_idle.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    // --- Load background music ---
    this.load.audio('bg_music2', 'assets/audio/bg_music2.mp3');
  }

  create() {
    // --- Flags ---
    this.currentLine = 0;
    this.currentChar = 0;
    this.typingSpeed = 30;
    this.fastForward = false;
    this.isTyping = false;
    this.dialogueEnded = false;

    // --- Background Music ---
    this.bgMusic = this.sound.add('bg_music2', { loop: true, volume: 0 }); // Start muted
    this.bgMusic.play();

    this.tweens.add({
      targets: this.bgMusic,
      volume: 0.2, // Target volume
      duration: 2000, // 2 seconds
      ease: 'Linear'
    });

    // --- Animation ---
    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('pink_guy_idle', { start: 0, end: 10 }),
      frameRate: 15,
      repeat: -1
    });

    // --- Character Sprite ---
    this.character = this.add.sprite(this.cameras.main.centerX, this.cameras.main.centerY, 'pink_guy_idle').setScale(4);
    this.character.play('idle');

    // --- Text Box ---
    this.textBox = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.height - 300,
      '',
      {
        fontSize: '20px',
        fill: '#fff',
        align: 'center',
        wordWrap: { width: this.cameras.main.width - 100, useAdvancedWrap: true }
      }
    ).setOrigin(0.5, 0);

    // --- Dialogue Content ---
    this.dialogue = [
      "Hi, this is Pink Guy.",
      "Pink Guy is an ambitious adventurer who dreams of reaching the top of the highest mountain.",
      "He's not just climbing for fun — he believes there's something magical up there.",
      "Some say it’s just a legend, but he’s always felt a calling from that distant peak.",
      "To prepare, he studied old trail maps, trained day and night, and even practiced in harsh conditions.",
      "He’s fallen. Failed. Gotten back up. Again and again.",
      "Most people laughed at him. Said he’s too small, too weak — or just too pink.",
      "But Pink Guy doesn’t care about what they think.",
      "He believes that even someone underestimated can rise higher than anyone expects.",
      "The mountain ahead is steep. Dangerous. Full of traps, cliffs, and things no one's ever seen.",
      "But he's ready. And he won’t be doing this alone...",
      "Let’s help Pink Guy reach his goal!"
    ];

    // --- Spacebar Input ---
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.dialogueEnded) return;

      if (this.isTyping) {
        this.fastForward = true;
      } else {
        this.nextLine();
      }
    });

    // Start first line
    this.nextLine();
  }

  nextLine() {
    if (this.currentLine >= this.dialogue.length) {
      if (this.dialogueEnded) return;
      this.dialogueEnded = true;

      // --- Fade out screen ---
      this.cameras.main.fadeOut(1000, 0, 0, 0);

      // --- Stop music after fadeout starts ---
      this.time.delayedCall(1000, () => {
        this.bgMusic.stop(); // Stop music after fade starts
      });

      // --- Go to next scene after total delay ---
      this.time.delayedCall(2500, () => {
        this.scene.start('GameScene1');
      });

      return;
    }

    this.textBox.setText('');
    this.currentChar = 0;
    this.fastForward = false;
    this.isTyping = true;
    this.typeLine();
  }

  typeLine() {
    const fullText = this.dialogue[this.currentLine];
    const currentText = fullText.substring(0, this.currentChar);
    this.textBox.setText(currentText);

    if (this.fastForward && this.currentChar < fullText.length) {
      this.textBox.setText(fullText);
      this.isTyping = false;
      this.currentLine++;
      return;
    }

    if (this.currentChar < fullText.length) {
      this.currentChar++;
      this.time.delayedCall(this.typingSpeed, () => this.typeLine());
    } else {
      this.isTyping = false;
      this.currentLine++;
    }
  }
}

window.IntroductionScene = IntroductionScene;
