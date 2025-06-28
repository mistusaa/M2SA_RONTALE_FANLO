class GameScene2 extends Phaser.Scene {
  constructor() {
    super('GameScene2');

    // Dialogue system properties
    this.dialogueLines = null;
    this.dialogueIndex = 0;
    this.dialogueContainer = null;
    this.dialogueBox = null;
    this.dialogueTextObject = null;
    this.typingTimer = null;
    this.inDialogue = false;
  }

  preload() {
    this.load.tilemapTiledJSON('map2', 'assets/tilemaps/level2.json');
    this.load.image('tileset_forest', 'assets/tilesets/tileset_forest.png');
    this.load.image('tileset_snow', 'assets/tilesets/tileset_snow.png');
    this.load.image('sign_arrow', 'assets/tilesets/sign_arrow.png');
    this.load.spritesheet('player_climb', 'assets/sprites/player_climb.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image('bg_layer_5', 'assets/backgrounds/bg_layer_5.png');
    this.load.audio('coin_collect', 'assets/audio/coin_collect.mp3');
  }

  create(data) {
    this.spawnPoint = { x: 30, y: 300 };
    this.isRespawning = false;

    const map = this.make.tilemap({ key: 'map2' });
    const tileset1 = map.addTilesetImage('tileset_forest', 'tileset_forest');
    const tileset2 = map.addTilesetImage('tileset_snow', 'tileset_snow');
    const tileset3 = map.addTilesetImage('sign_arrow', 'sign_arrow');
    const tilesets = [tileset1, tileset2, tileset3];
    const platformLayer = map.createLayer('platforms', tilesets);
    const designLayer = map.createLayer('design', tilesets);
    platformLayer.setCollisionByExclusion([-1]);
    const flagLayer = map.createLayer('flag', tilesets);
    flagLayer.setCollisionByExclusion([-1]);

    const bg = this.add.image(0, 0, 'bg_layer_5').setOrigin(0);
bg.setDepth(-1);
bg.setDisplaySize(800, 400);
bg.setScrollFactor(1); // This makes it a static, non-parallax background

    if (!this.anims.exists('idle')) this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 10 }), frameRate: 20, repeat: -1 });
    if (!this.anims.exists('run')) this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('player_run', { start: 0, end: 11 }), frameRate: 20, repeat: -1 });
    if (!this.anims.exists('jump')) this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('player_jump', { start: 0, end: 1 }), frameRate: 10, repeat: -1 });
    if (!this.anims.exists('fall')) this.anims.create({ key: 'fall', frames: this.anims.generateFrameNumbers('player_fall', { start: 0, end: 1 }), frameRate: 10, repeat: -1 });
    if (!this.anims.exists('climb')) this.anims.create({ key: 'climb', frames: this.anims.generateFrameNumbers('player_climb', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
    if (!this.anims.exists('spin')) this.anims.create({ key: 'spin', frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 11 }), frameRate: 20, repeat: -1 });

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setZoom(2.5);

    const appearEffect = this.add.sprite(this.spawnPoint.x, this.spawnPoint.y, 'appearing');
    this.cameras.main.startFollow(appearEffect);

    appearEffect.on('animationcomplete', () => {
      appearEffect.destroy();
      this.player = this.physics.add.sprite(this.spawnPoint.x, this.spawnPoint.y, 'player_idle');
      this.player.setCollideWorldBounds(true);
      this.physics.add.collider(this.player, platformLayer);
      this.physics.add.collider(this.player, flagLayer, this.reachGoal, null, this);
      this.player.body.setSize(19, 30);
      this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
      this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);
      this.cameras.main.startFollow(this.player);
      this.player.anims.play('idle');

      this.startDialogue([
        "Woah... this wall looks climbable.",
        "Wait, I remember now — I trained for this. I can climb walls if I jump toward them!",
        "Just press W while on a wall to climb up or down.",
        "And if I want to jump off the wall, I’ll press W again — with A or D to leap away.",
        "Gotta watch my stamina though... it drains while climbing!",
        "Alright. Let’s scale this part and push forward!"
      ]);
    });
    appearEffect.play('appear');

    this.isClimbing = false;
    this.climbSpeed = 100;
    this.maxStamina = 10;
    this.currentStamina = this.maxStamina;
    this.climbDrainRate = 5;

    this.keys = this.input.keyboard.addKeys({ up: 'W', left: 'A', down: 'S', right: 'D' });
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.coinsCollected = data.coinsCollected || 0;
    this.score = data.score || 0;
    this.coinText = this.add.text(16, 16, 'Coins: ' + this.coinsCollected, { fontSize: '18px', fill: '#fff' }).setScrollFactor(0);
    this.scoreText = this.add.text(16, 40, 'Score: ' + this.score, { fontSize: '18px', fill: '#fff' }).setScrollFactor(0);
    this.coins = this.physics.add.group({ allowGravity: false, immovable: true });
    this.enemies = this.physics.add.group({ allowGravity: false, immovable: true });
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  }

  update(time, delta) {
    if (!this.player || this.isRespawning) return;

    if (this.inDialogue) {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.handleDialogueInteraction();
      if (this.player.anims.currentAnim.key !== 'idle') this.player.anims.play('idle', true);
      return;
    }

    const keys = this.keys;
    const player = this.player;
    const onGround = player.body.blocked.down;
    const touchingWall = player.body.blocked.left || player.body.blocked.right;

    const canWallInteract = touchingWall && !onGround;
    this.isClimbing = false;

    if (canWallInteract && Phaser.Input.Keyboard.JustDown(keys.up) && this.currentStamina > 0) {
      const jumpDir = player.body.blocked.left ? 1 : -1;
      player.setVelocityY(-330);
      player.setVelocityX(160 * jumpDir);
    } else if (canWallInteract && (keys.up.isDown || keys.down.isDown)) {
      this.isClimbing = true;
      player.setVelocityX(0);
      if (keys.up.isDown && this.currentStamina > 0) {
        player.setVelocityY(-this.climbSpeed);
        this.currentStamina -= this.climbDrainRate * (delta / 1000);
      } else if (keys.down.isDown) {
        player.setVelocityY(this.climbSpeed);
      } else {
        player.setVelocityY(0);
      }
    } else {
      if (keys.left.isDown) {
        player.setVelocityX(-160);
        player.flipX = true;
      } else if (keys.right.isDown) {
        player.setVelocityX(160);
        player.flipX = false;
      } else {
        player.setVelocityX(0);
      }
      if (keys.up.isDown && onGround) {
        player.setVelocityY(-330);
      }
    }

    if (this.isClimbing) {
      player.anims.play('climb', true);
    } else if (!onGround) {
      if (player.body.velocity.y < 0) {
        //player.anims.play('jump', true);
      } else {
        player.anims.play('fall', true);
      }
    } else if (player.body.velocity.x !== 0) {
      player.anims.play('run', true);
    } else {
      player.anims.play('idle', true);
    }

    if (onGround) this.currentStamina = this.maxStamina;
    if (player.y > 380) this.handlePlayerFall();
  }

  startDialogue(lines) {
    if (this.inDialogue) return;
    this.inDialogue = true;
    this.dialogueLines = lines;
    this.dialogueIndex = 0;
    const padding = 10, boxWidth = 180, boxHeight = 120;
    this.dialogueContainer = this.add.container(0, 0).setDepth(100).setScrollFactor(0);
    this.dialogueBox = this.make.graphics();
    this.dialogueBox.fillStyle(0xffffff, 0.95);
    this.dialogueBox.fillRoundedRect(0, 0, boxWidth, boxHeight, 10);
    this.dialogueBox.lineStyle(2, 0x000000, 1);
    this.dialogueBox.strokeRoundedRect(0, 0, boxWidth, boxHeight, 10);
    this.dialogueTextObject = this.add.text(padding, padding, '', { fontSize: '16px', fill: '#000000', wordWrap: { width: boxWidth - padding * 2 } });
    this.dialogueContainer.add([this.dialogueBox, this.dialogueTextObject]);
    this.events.on('postupdate', this.updateDialoguePosition, this);
    this.typeNextLine();
  }

  updateDialoguePosition() {
    if (!this.player || !this.dialogueContainer) return;
    const zoom = this.cameras.main.zoom;
    const screenX = (this.player.x - this.cameras.main.scrollX) * zoom;
    const screenY = (this.player.y - this.cameras.main.scrollY) * zoom;
    const offsetX = 35, offsetY = -120;
    this.dialogueContainer.setScale(1 / zoom);
    this.dialogueContainer.setPosition((screenX + offsetX) / zoom, (screenY + offsetY) / zoom);
  }

  typeNextLine() {
    if (this.dialogueIndex >= this.dialogueLines.length) return this.endDialogue();
    const line = this.dialogueLines[this.dialogueIndex];
    this.dialogueTextObject.setText('');
    let charIndex = 0;
    this.typingTimer = this.time.addEvent({
      delay: 40,
      callback: () => {
        this.dialogueTextObject.text += line[charIndex++];
        if (charIndex === line.length) this.typingTimer.remove();
      }, repeat: line.length - 1
    });
  }

  handleDialogueInteraction() {
    const currentLine = this.dialogueLines[this.dialogueIndex];
    if (this.dialogueTextObject.text.length < currentLine.length) {
      if (this.typingTimer) this.typingTimer.remove();
      this.dialogueTextObject.setText(currentLine);
    } else {
      this.dialogueIndex++;
      this.typeNextLine();
    }
  }

  endDialogue() {
    this.inDialogue = false;
    if (this.typingTimer) this.typingTimer.remove();
    if (this.dialogueContainer) this.dialogueContainer.destroy();
    this.dialogueContainer = null;
    this.dialogueBox = null;
    this.dialogueTextObject = null;
    this.dialogueLines = null;
  }

  handlePlayerFall() {
    if (this.isRespawning) return;
    this.isRespawning = true;
    const player = this.player;
    const fallX = player.x;
    const fallY = player.y;
    player.disableBody(true, true);
    const disappearEffect = this.add.sprite(fallX, fallY, 'appearing');
    disappearEffect.playReverse('appear');
    disappearEffect.on('animationcomplete', () => {
      disappearEffect.destroy();
      const appearEffect = this.add.sprite(this.spawnPoint.x, this.spawnPoint.y, 'appearing');
      this.cameras.main.startFollow(appearEffect);
      appearEffect.play('appear');
      appearEffect.on('animationcomplete', () => {
        appearEffect.destroy();
        player.enableBody(true, this.spawnPoint.x, this.spawnPoint.y, true, true);
        player.setVelocity(0, 0);
        this.currentStamina = this.maxStamina;
        this.cameras.main.startFollow(player);
        this.isRespawning = false;
      });
    });
  }

  reachGoal(player, tile) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    player.setVelocity(0, 0);
    player.anims.play('idle', true);
    this.cameras.main.stopFollow();
    this.cameras.main.pan(this.cameras.main.scrollX + 50, this.cameras.main.scrollY, 1000, 'Sine.easeInOut');
    this.time.delayedCall(1000, () => {
      this.scene.start('GameScene3', { coinsCollected: this.coinsCollected, score: this.score });
    });
  }

  collectCoin(player, coin) {
    coin.disableBody(true, true);
    this.sound.play('coin_collect');
    this.coinsCollected += 1;
    this.score += 10;
    this.coinText.setText('Coins: ' + this.coinsCollected);
    this.scoreText.setText('Score: ' + this.score);
  }

  hitEnemy(player, enemy) {
    this.scene.start('GameOverScene', { message: 'You were killed by an enemy!' });
  }
}

window.GameScene2 = GameScene2;
