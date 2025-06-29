class CreditsScene extends Phaser.Scene {
    constructor() {
        super('CreditsScene');
    }

    preload() {
        this.load.image('mainButton', 'assets/images/buttonQuit.png');
        this.load.image('creditsBG', 'assets/images/background.jpg');
    }

    create() {
        
        this.add.image(-50, 0, 'creditsBG').setOrigin(0, 0)

        
        const mainBg = this.add.image(-50, 0, 'creditsBG').setOrigin(0);
        mainBg.setDepth(-1); 

       
        const reflectionBg = this.add.image(mainBg.x, mainBg.displayHeight, 'creditsBG').setOrigin(0);

       
        reflectionBg.flipY = true;    
        reflectionBg.setAlpha(0.4);     
        reflectionBg.setDepth(-1);      

        
        const textStyle = {
            font: 'bold 32px Arial Black',
            fill: '#FFD700',
            stroke: '#000000',
            strokeThickness: 5,
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#333333',
                blur: 3,
                fill: true
            }
        };

       
        this.add.text(200, 250, 'Matthew Miguel A. Fanlo', textStyle);
        this.add.text(200, 310, 'Rovil Jesus Rontale', textStyle);
        this.add.text(200, 370, 'SECTION: A224', textStyle);
        this.add.text(200, 430, 'PROGRAM: EMC', textStyle);

        
        const backButton = this.add.image(500, 550, 'mainButton')
            .setScale(0.5)
            .setInteractive();

        backButton.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }
}
