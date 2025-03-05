import Phaser from 'phaser';

export class Button extends Phaser.GameObjects.Container {
    private graphics: Phaser.GameObjects.Graphics;
    private label: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, text: string, options: { fillColor: number, borderColor: number, borderWidth: number, borderRadius: number }, callback:()=>void) {
        super(scene, x, y);

        // 创建背景
        this.graphics = scene.add.graphics();
        this.graphics.fillStyle(options.fillColor, 1);
        this.graphics.lineStyle(options.borderWidth, options.borderColor, 1);
        this.graphics.fillRoundedRect(0, 0, width, height, options.borderRadius);
        this.graphics.strokeRoundedRect(0, 0, width, height, options.borderRadius);

        // 创建文本
        this.label = scene.add.text(width / 2, height / 2, text, { fontSize: '24px', color: '#FFF' });
        this.label.setOrigin(0.5);

        // 添加到容器
        this.add(this.graphics);
        this.add(this.label);
        this.setSize(width, height);

        // 添加到场景
        scene.add.existing(this);

        // 设置点击事件
        //this.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);  // 不是很敏感
        this.setInteractive({ cursor: 'pointer' })
            .on('pointerover', () => {this.setScale(0.9); })
            .on('pointerout', () => { this.setScale(1); })
            .on('pointerdown', callback)
            ;
    }
}