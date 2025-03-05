import Phaser from 'phaser';

export class Block extends Phaser.GameObjects.Rectangle {
    constructor(scene: Phaser.Scene, x: number, y: number, size: number, fillColor: number, borderColor: number, borderWidth: number) {
        super(scene, x, y, size, size, fillColor);
        scene.add.existing(this);

        // 设置边框
        this.setStrokeStyle(borderWidth, borderColor);
        //this.setAlpha(0.9);
    }
}