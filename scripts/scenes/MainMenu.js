class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    preload() {
        this.load.image('playBtn', 'assets/images/buttonPlay.png');
        this.load.image('creditsBtn', 'assets/images/buttonCredits.png');
        this.load.image('quitBtn', 'assets/images/buttonQuit.png');
        this.load.image('background', 'assets/images/background.jpg');
        this.load.image('title', 'assets/images/title.png');

        this.load.audio('bg_music', 'assets/audio/background_music.mp3');
        this.load.audio('click', 'assets/audio/click.mp3'); 
    }

    create() {
        // Music
        if (!this.sys.game.isMusicPlaying) {
            this.backgroundMusic = this.sound.add('bg_music', {
                loop: true,
                volume: 0.2
            });
            this.backgroundMusic.play();
            this.sys.game.isMusicPlaying = true;
            this.sys.game.backgroundMusicInstance = this.backgroundMusic;
        }

        // Click sound instance
        this.clickSound = this.sound.add('click');

        // --- START: MODIFIED CODE FOR REFLECTION ---

        // 1. Create the main background and keep a reference to it
        const mainBg = this.add.image(-50, 0, 'background').setOrigin(0);
        mainBg.setDepth(-1); // Ensure it's behind everything

        // 2. Create the reflection image below the main one
        // We get the height of the main background to know where to place the reflection
        const reflectionBg = this.add.image(mainBg.x, mainBg.displayHeight, 'background').setOrigin(0);

        // 3. Apply the reflection effect
        reflectionBg.flipY = true;      // Flip it vertically
        reflectionBg.setAlpha(0.4);     // Make it semi-transparent (adjust 0.4 to your liking)
        reflectionBg.setDepth(-1);      // Also send it to the back

        // --- END: MODIFIED CODE FOR REFLECTION ---
        
        // Title (no change needed here)
        this.add.image(200, 180, 'title');

        // Play Button (no change needed here)
        this.add.image(190, 575, 'playBtn')
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.clickSound.play(); 
                // --- ADD THESE LINES TO STOP THE MUSIC ---
                if (this.sys.game.backgroundMusicInstance) {
                    this.sys.game.backgroundMusicInstance.stop();
                    this.sys.game.isMusicPlaying = false;
                }
                // --- END OF ADDED LINES ---
                this.scene.start('IntroductionScene');
            });

        // Credits Button (no change needed here)
        this.add.image(190, 675, 'creditsBtn')
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.clickSound.play(); 
                this.scene.start('CreditsScene');
            });

        // Quit Button (no change needed here)
        this.add.image(190, 775, 'quitBtn')
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.clickSound.play(); 
                alert('You exited the game.');
            });
    }
}