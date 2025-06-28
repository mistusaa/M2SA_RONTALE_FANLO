class GameScene4 extends Phaser.Scene {
  constructor() {
    super('GameScene4');
  }

  preload() {
    this.load.tilemapTiledJSON('map4', 'assets/tilemaps/level4.json');
    this.load.image('tileset_snow', 'assets/tilesets/tileset_snow.png');
    this.load.image('sign_arrow', 'assets/tilesets/sign_arrow.png');
    this.load.image('Idle', 'assets/tilesets/Idle.png');
    this.load.image('bg_layer_7', 'assets/backgrounds/bg_layer_7.jpg');
    this.load.spritesheet('player_climb', 'assets/sprites/player_climb.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('player_doublejump', 'assets/sprites/player_doublejump.png', { frameWidth: 32, frameHeight: 32 });
    this.load.audio('coin_collect', 'assets/audio/coin_collect.mp3');
  }

  create(data) {
    this.spawnPoint = { x: 30, y: 300 };
    this.isRespawning = false;

    const map = this.make.tilemap({ key: 'map4' });
    const tileset1 = map.addTilesetImage('tileset_snow', 'tileset_snow');
    const tileset2 = map.addTilesetImage('sign_arrow', 'sign_arrow');
    const tileset3 = map.addTilesetImage('Idle', 'Idle');
    const tilesets = [tileset1, tileset2, tileset3];

    const platformLayer = map.createLayer('platforms', tilesets);
    const designLayer = map.createLayer('design', tilesets);
    const flagLayer = map.createLayer('flag', tilesets);
    const spikeLayer = map.createLayer('spikes', tilesets);

    platformLayer.setCollisionByExclusion([-1]);
    flagLayer.setCollisionByExclusion([-1]);
    spikeLayer.setCollisionByExclusion([-1]);
    this.spikeLayer = spikeLayer;

    const bg = this.add.image(0, 0, 'bg_layer_7').setOrigin(0);
bg.setDepth(-1);
bg.setDisplaySize(610, 370);
bg.setScrollFactor(1); 

    if (!this.anims.exists('idle')) this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 10 }), frameRate: 20, repeat: -1 });
    if (!this.anims.exists('run')) this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('player_run', { start: 0, end: 11 }), frameRate: 20, repeat: -1 });
    if (!this.anims.exists('jump')) this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('player_jump', { start: 0, end: 1 }), frameRate: 10, repeat: -1 });
    if (!this.anims.exists('fall')) this.anims.create({ key: 'fall', frames: this.anims.generateFrameNumbers('player_fall', { start: 0, end: 1 }), frameRate: 10, repeat: -1 });
    if (!this.anims.exists('climb')) this.anims.create({ key: 'climb', frames: this.anims.generateFrameNumbers('player_climb', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
    if (!this.anims.exists('double_jump')) this.anims.create({ key: 'double_jump', frames: this.anims.generateFrameNumbers('player_doublejump', { start: 0, end: 5 }), frameRate: 15, repeat: -1 });
    if (!this.anims.exists('spin')) this.anims.create({ key: 'spin', frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 11 }), frameRate: 20, repeat: -1 });

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels).setZoom(2.5);

    const appearEffect = this.add.sprite(this.spawnPoint.x, this.spawnPoint.y, 'appearing');
    this.cameras.main.startFollow(appearEffect);

    appearEffect.on('animationcomplete', () => {
      appearEffect.destroy();

      this.player = this.physics.add.sprite(this.spawnPoint.x, this.spawnPoint.y, 'player_idle');
      this.player.setCollideWorldBounds(true);
      this.player.body.setSize(19, 23);

      this.physics.add.collider(this.player, platformLayer);
      this.physics.add.collider(this.player, flagLayer, this.reachGoal, null, this);
      this.physics.add.collider(this.player, this.spikeLayer, this.hitSpike, null, this);

      this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
      this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);

      this.cameras.main.startFollow(this.player);
      this.player.anims.play('idle');
    });

    appearEffect.play('appear');

    this.keys = this.input.keyboard.addKeys({ up: 'W', left: 'A', down: 'S', right: 'D' });

    this.jumpCount = 0;
    this.hasResetJump = false;
    this.isDoubleJumping = false;

    this.isClimbing = false;
    this.climbSpeed = 100;
    this.maxStamina = 10;
    this.currentStamina = this.maxStamina;
    this.climbDrainRate = 5;

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

    const keys = this.keys;
    const player = this.player;
    const onGround = player.body.blocked.down;
    const touchingWall = player.body.blocked.left || player.body.blocked.right;

    if (onGround && !this.hasResetJump) {
      this.jumpCount = 0;
      this.hasResetJump = true;
    }
    if (!onGround) this.hasResetJump = false;

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

      if (Phaser.Input.Keyboard.JustDown(keys.up)) {
        if (onGround) {
          player.setVelocityY(-330);
          this.jumpCount = 1;
        } else if (this.jumpCount < 2) {
          player.setVelocityY(-330);
          this.jumpCount++;
          this.isDoubleJumping = true;
        }
      }
    }

    if (this.isClimbing) {
      player.anims.play('climb', true);
    } else if (!onGround) {
      if (this.isDoubleJumping) {
        player.anims.play('double_jump', true);
      } else if (player.body.velocity.y < 0) {
        // player.anims.play('jump', true);
      } else {
        player.anims.play('fall', true);
      }
    } else if (player.body.velocity.x !== 0) {
      player.anims.play('run', true);
    } else {
      player.anims.play('idle', true);
    }

    if (onGround) {
      this.currentStamina = this.maxStamina;
      this.isDoubleJumping = false;
    }

    if (player.y > 340) {
      this.handlePlayerFall();
    }
  }

  handlePlayerFall() {
    if (this.isRespawning) return;
    this.isRespawning = true;
    const { x, y } = this.player;

    this.player.disableBody(true, true);
    const disappear = this.add.sprite(x, y, 'appearing').playReverse('appear');

    disappear.on('animationcomplete', () => {
      disappear.destroy();
      const appear = this.add.sprite(this.spawnPoint.x, this.spawnPoint.y, 'appearing');
      this.cameras.main.startFollow(appear);
      appear.play('appear');
      appear.on('animationcomplete', () => {
        appear.destroy();
        this.player.enableBody(true, this.spawnPoint.x, this.spawnPoint.y, true, true);
        this.player.setVelocity(0, 0);
        this.cameras.main.startFollow(this.player);
        this.currentStamina = this.maxStamina;
        this.isRespawning = false;
      });
    });
  }

  hitSpike(player, tile) {
    this.handlePlayerFall();
  }

  hitEnemy(player, enemy) {
    this.scene.start('GameOverScene', { message: 'You were killed by an enemy!' });
  }

  collectCoin(player, coin) {
    coin.disableBody(true, true);
    this.sound.play('coin_collect');
    this.coinsCollected += 1;
    this.score += 10;
    this.coinText.setText('Coins: ' + this.coinsCollected);
    this.scoreText.setText('Score: ' + this.score);
  }

  reachGoal(player, tile) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    player.setVelocity(0, 0);
    player.anims.play('idle', true);
    this.cameras.main.stopFollow();
    this.cameras.main.pan(this.cameras.main.scrollX + 50, this.cameras.main.scrollY, 1000, 'Sine.easeInOut');

    this.time.delayedCall(1000, () => {
      this.scene.start('GameScene5', {
        coinsCollected: this.coinsCollected,
        score: this.score
      });
    });
  }
}

window.GameScene4 = GameScene4;
