class GameScene1 extends Phaser.Scene {
  constructor() {
    super('GameScene1');

    
    this.dialogueLines = null;
    this.dialogueIndex = 0;
    this.dialogueBox = null;
    this.dialogueTextObject = null;
    this.typingTimer = null;
    this.inDialogue = false;
  }

  preload() {
    this.load.tilemapTiledJSON('map', 'assets/tilemaps/level1.json');
    this.load.image('tiles_forest', 'assets/tilesets/tileset_forest.png');
    this.load.image('tiles_snow', 'assets/tilesets/tileset_snow.png');
    this.load.image('tiles_sign', 'assets/tilesets/sign_arrow.png');
    this.load.image('bg', 'assets/backgrounds/background.png');
    this.load.audio('coin_collect', 'assets/audio/coin_collect.mp3');
    this.load.audio('bg_music3', 'assets/audio/bg_music3.mp3');


    
    this.load.spritesheet('appearing', 'assets/sprites/appearing.png', {
      frameWidth: 96,
      frameHeight: 96
    });
    this.load.spritesheet('player_idle', 'assets/sprites/player_idle.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('player_run', 'assets/sprites/player_run.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('player_jump', 'assets/sprites/player_jump.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('player_fall', 'assets/sprites/player_fall.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('coin', 'assets/sprites/coin.png', {
      frameWidth: 16,
      frameHeight: 16
    });
    this.load.spritesheet('enemy_idle', 'assets/sprites/enemy_idle.png', {
      frameWidth: 32,
      frameHeight: 32
    });
  }

  create() {
      
if (!this.sound.get('bg_music3')) {
  const music = this.sound.add('bg_music3', { loop: true, volume: 0 });
  music.play();

  this.sound.music = music; 

  this.tweens.add({
    targets: music,
    volume: 0.1,
    duration: 2000,
    ease: 'Linear'
  });
}


    
    this.spawnPoint = { x: 30, y: 290 };
    this.isRespawning = false;
    this.isTransitioning = false;
    this.inDialogue = false; 

    // --- MAP & LAYERS SETUP ---
    const map = this.make.tilemap({ key: 'map' });
    const tilesetForest = map.addTilesetImage('tileset_forest', 'tiles_forest');
    const tilesetSnow = map.addTilesetImage('tileset_snow', 'tiles_snow');
    const tilesetSign = map.addTilesetImage('sign_arrow', 'tiles_sign');
    const allTilesets = [tilesetForest, tilesetSnow, tilesetSign];
    const designLayerLayer = map.createLayer('design', allTilesets);
    const platformLayer = map.createLayer('platforms', allTilesets);
    platformLayer.setCollisionByExclusion([-1]);
    const flagLayer = map.createLayer('flag', allTilesets);
    flagLayer.setCollisionByExclusion([-1]);

    // --- BACKGROUND ---
    const bg = this.add.image(0, 0, 'bg').setOrigin(0);
    bg.setDepth(-1);
    bg.setDisplaySize(750, 800);
    bg.setScrollFactor(1);

    // --- CAMERA SETUP ---
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setZoom(2.5);

    // --- FADE IN ---
    this.cameras.main.fadeIn(1500, 0, 0, 0);

    // --- ANIMATIONS ---
    // (Your animation creation code remains the same)
    if (!this.anims.exists('appear')) { this.anims.create({ key: 'appear', frames: this.anims.generateFrameNumbers('appearing', { start: 0, end: 5 }), frameRate: 10, repeat: 0 }); }
    if (!this.anims.exists('idle')) { this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 10 }), frameRate: 20, repeat: -1 }); }
    if (!this.anims.exists('run')) { this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('player_run', { start: 0, end: 11 }), frameRate: 20, repeat: -1 }); }
    if (!this.anims.exists('jump')) { this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('player_jump', { start: 0, end: 0 }), frameRate: 1, repeat: -1 }); }
    if (!this.anims.exists('fall')) { this.anims.create({ key: 'fall', frames: this.anims.generateFrameNumbers('player_fall', { start: 0, end: 0 }), frameRate: 1, repeat: -1 }); }
    if (!this.anims.exists('spin')) { this.anims.create({ key: 'spin', frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 11 }), frameRate: 20, repeat: -1 }); }
    if (!this.anims.exists('enemy_idle')) { this.anims.create({ key: 'enemy_idle', frames: this.anims.generateFrameNumbers('enemy_idle', { start: 0, end: 10 }), frameRate: 20, repeat: -1 }); }
    

    // --- INITIAL PLAYER SPAWN ---
    const appearEffect = this.add.sprite(this.spawnPoint.x, this.spawnPoint.y, 'appearing');
    this.cameras.main.startFollow(appearEffect);

    // --- MODIFIED: Player spawn and dialogue trigger ---
    appearEffect.on('animationcomplete', () => {
      appearEffect.destroy();
      this.player = this.physics.add.sprite(this.spawnPoint.x, this.spawnPoint.y, 'player_idle');
      this.physics.add.collider(this.player, platformLayer);
      this.physics.add.collider(this.player, flagLayer, this.reachGoal, null, this);
      this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
      this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);
      this.player.setCollideWorldBounds(true);
      this.player.body.setSize(19, 30);
      this.cameras.main.startFollow(this.player);
      this.player.anims.play('idle');

      // --- NEW: Start the dialogue sequence after spawning ---
      this.startDialogue([
  "Hey there! I'm Pink Guy — yeah, I'm really pink, I know.",
  "But don't let the color fool you... I'm serious about one thing: reaching the top of Cragspire Cliff.",
  "It's known as the toughest climb in the region. Steep ridges, falling rocks, and barely any grip.",
  "I've spent months preparing — studying trail maps, training nonstop, and building up the guts to do this.",
  "People said I couldn’t make it. That I'd slip, that I'd give up halfway. Maybe they're right...",
  "But deep down, I feel like something’s waiting for me up there. Like I need to see it for myself.",
  "I'm not doing this to impress anyone. I'm doing it to prove that even the most unlikely climbers have a chance.",
  "So if you're with me — take the controls. W to jump, A and D to move around.",
  "Let’s scale Cragspire Cliff together. One step at a time!"
]);

    });

    appearEffect.play('appear');
    
    // --- CONTROLS, GROUPS, UI ---
    this.keys = this.input.keyboard.addKeys({ up: 'W', left: 'A', down: 'S', right: 'D' });
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE); // <-- NEW: Add space key
    this.enemies = this.physics.add.group({ allowGravity: false, immovable: true });
    this.coins = this.physics.add.group({ allowGravity: false, immovable: true });
    this.coinsCollected = 0;
    this.score = 0;
    this.coinText = this.add.text(16, 16, 'Coins: 0', { fontSize: '18px', fill: '#fff' }).setScrollFactor(0);
    this.scoreText = this.add.text(16, 40, 'Score: 0', { fontSize: '18px', fill: '#fff' }).setScrollFactor(0);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  }

  update() {
    
    if (!this.player || this.isRespawning || this.isTransitioning) {
      return;
    }
    
    // --- NEW: Handle dialogue input and pause game ---
    if (this.inDialogue) {
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.handleDialogueInteraction();
        }
        // Freeze player animation while in dialogue
        if(this.player.anims.currentAnim.key !== 'idle') {
            this.player.anims.play('idle', true);
        }
        return; // Prevent all player movement and other updates
    }


    const player = this.player;
    const keys = this.keys;

    // Player movement
    if (keys.left.isDown) {
      player.setVelocityX(-160);
      player.flipX = true;
    } else if (keys.right.isDown) {
      player.setVelocityX(160);
      player.flipX = false;
    } else {
      player.setVelocityX(0);
    }

    // Player jump
    if (keys.up.isDown && player.body.blocked.down) {
      player.setVelocityY(-330);
    }

    // Player animation logic
    if (!player.body.blocked.down) {
      if (player.body.velocity.y < 0) {
        player.anims.play('jump', true);
      } else if (player.body.velocity.y > 100) {
        player.anims.play('fall', true);
      }
    } else if (player.body.velocity.x !== 0) {
      player.anims.play('run', true);
    } else {
      player.anims.play('idle', true);
    }

    // Check for fall condition to trigger respawn
    if (player.y > 380) {
      this.handlePlayerFall();
    }
  }

  

startDialogue(lines) {
  if (this.inDialogue) return;

  this.inDialogue = true;
  this.dialogueLines = lines;
  this.dialogueIndex = 0;

  const padding = 10;
  const boxWidth = 180;
  const boxHeight = 145;

  // Create a container so everything stays together
  this.dialogueContainer = this.add.container(0, 0).setDepth(100).setScrollFactor(0);

  // Draw a white rounded rectangle
  this.dialogueBox = this.make.graphics();
  this.dialogueBox.fillStyle(0xffffff, 0.95);
  this.dialogueBox.fillRoundedRect(0, 0, boxWidth, boxHeight, 10);
  this.dialogueBox.lineStyle(2, 0x000000, 1);
  this.dialogueBox.strokeRoundedRect(0, 0, boxWidth, boxHeight, 10);

  // Add the text
  this.dialogueTextObject = this.add.text(padding, padding, '', {
    fontSize: '16px',
    fill: '#000000',
    wordWrap: { width: boxWidth - padding * 2 }
  });

  this.dialogueContainer.add([this.dialogueBox, this.dialogueTextObject]);

  // Update container position dynamically
  this.events.on('postupdate', this.updateDialoguePosition, this);

  this.typeNextLine();
}


updateDialoguePosition() {
  if (!this.player || !this.dialogueContainer) return;

  const zoom = this.cameras.main.zoom;

  // Convert world position to screen position
  const screenX = (this.player.x - this.cameras.main.scrollX) * zoom;
  const screenY = (this.player.y - this.cameras.main.scrollY) * zoom;

  
  const offsetX = 35; 
  const offsetY = -140; 

  this.dialogueContainer.setScale(1 / zoom); // maintain fixed size on screen

  this.dialogueContainer.setPosition(
    (screenX + offsetX) / zoom,
    (screenY + offsetY) / zoom
  );
}






endDialogue() {
  this.inDialogue = false;
  if (this.typingTimer) this.typingTimer.remove();

  if (this.dialogueContainer) {
    this.dialogueContainer.destroy(); 
  }

  this.dialogueContainer = null;
  this.dialogueBox = null;
  this.dialogueTextObject = null;
  this.dialogueLines = null;
}


  // --- NEW: Function to type out a line of dialogue ---
  typeNextLine() {
    if (this.dialogueIndex >= this.dialogueLines.length) {
        this.endDialogue();
        return;
    }

    const line = this.dialogueLines[this.dialogueIndex];
    this.dialogueTextObject.setText(''); 

    let charIndex = 0;
    // Use a timed event to add characters one by one
    this.typingTimer = this.time.addEvent({
        delay: 40, 
        callback: () => {
            this.dialogueTextObject.text += line[charIndex];
            charIndex++;
            if (charIndex === line.length) {
                this.typingTimer.remove(); 
            }
        },
        repeat: line.length - 1
    });
  }

  // --- NEW: Function to handle spacebar press during dialogue ---
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

  // --- NEW: Function to end the dialogue and clean up ---
  endDialogue() {
    this.inDialogue = false;
    if (this.typingTimer) this.typingTimer.remove();
    if (this.dialogueBox) this.dialogueBox.destroy();
    if (this.dialogueTextObject) this.dialogueTextObject.destroy();

    this.dialogueBox = null;
    this.dialogueTextObject = null;
    this.dialogueLines = null;
  }
    
  handlePlayerFall() {
    
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
        this.cameras.main.startFollow(player);
        this.isRespawning = false;
      });
    });
  }

  reachGoal(player, tile) {
    
    if (this.isTransitioning) { return; }
    this.isTransitioning = true;
    player.setVelocity(0, 0);
    player.anims.play('idle', true);
    this.cameras.main.stopFollow();
    this.cameras.main.pan(
        this.cameras.main.scrollX + 50,
        this.cameras.main.scrollY,
        1000,
        'Sine.easeInOut'
    );
    this.time.delayedCall(1000, () => {
        this.scene.start('GameScene2', {
            coinsCollected: this.coinsCollected,
            score: this.score
        });
    });
  }

  collectCoin(player, coin) {
    // (This function remains unchanged)
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


window.GameScene1 = GameScene1;
