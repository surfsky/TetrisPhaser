import { Scene } from 'phaser';

export class Piece {
    private readonly SHAPES = [
        [[1, 1, 1, 1]], // I
        [[1, 1], [1, 1]], // O
        [[1, 1, 1], [0, 1, 0]], // T
        [[1, 1, 1], [1, 0, 0]], // L
        [[1, 1, 1], [0, 0, 1]], // J
        [[1, 1, 0], [0, 1, 1]], // S
        [[0, 1, 1], [1, 1, 0]]  // Z
    ];

    private readonly COLORS = [
        0x00b4d8, // 浅蓝色
        0x90be6d, // 柔和绿色
        0xf94144, // 柔和红色
        0xf9c74f, // 柔和黄色
        0x9d4edd, // 柔和紫色
        0x48cae4, // 天蓝色
        0xf8961e  // 柔和橙色
    ];

    public shape: number[][];
    public x: number;
    public y: number;
    public color: number;

    constructor(shapeIndex: number = -1) {
        if (shapeIndex === -1) {
            shapeIndex = Math.floor(Math.random() * this.SHAPES.length);
        }
        this.shape = this.SHAPES[shapeIndex].map(row => [...row]);
        this.color = this.COLORS[shapeIndex];
        this.x = 0;
        this.y = 0;
    }

    /**
     * 旋转方块
     * @returns 旋转后的形状数组
     */
    public rotate(): number[][] {
        return this.shape[0].map((_, i) =>
            this.shape.map(row => row[row.length - 1 - i])
        );
    }

    /**
     * 移动方块
     * @param dx X轴移动距离
     * @param dy Y轴移动距离
     */
    public move(dx: number, dy: number) {
        this.x += dx;
        this.y += dy;
    }

    /**
     * 获取方块的宽度
     */
    public getWidth(): number {
        return this.shape[0].length;
    }

    /**
     * 获取方块的高度
     */
    public getHeight(): number {
        return this.shape.length;
    }

    /**
     * 克隆当前方块
     * @returns 新的Piece实例
     */
    public clone(): Piece {
        const piece = new Piece();
        piece.shape = this.shape.map(row => [...row]);
        piece.color = this.color;
        piece.x = this.x;
        piece.y = this.y;
        return piece;
    }
}