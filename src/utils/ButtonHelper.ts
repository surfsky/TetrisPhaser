//import { GAMECONFIG } from '../gameConfig.js';

/**
 * 按钮辅助类，用于创建统一风格的游戏按钮
 */
export class ButtonHelper {
    static PRIMARY: number = 0x4a90e2;
    static PRIMARY_HOVER: number = 0x5ba1f3;

    /**
     * 创建一个标准按钮
     * @param {Phaser.Scene} scene - 场景实例
     * @param {number} x - 按钮中心x坐标
     * @param {number} y - 按钮中心y坐标
     * @param {string} text - 按钮文本
     * @param {ButtonOptions} options - 按钮配置选项
     * @param {() => void} onClick - 点击回调函数
     * @returns {Phaser.GameObjects.Container} 按钮容器对象
     */
    static create(scene: Phaser.Scene, x: number, y: number, text: string, options: ButtonOptions = {}, onClick: () => void): Phaser.GameObjects.Container {
        const {
            width = 380,
            height = 100,
            radius = 50,
            //depth = scene.depth + 1,
            fontSize = '56px',
            scale = 1.05,
            padding = 20,
            bgColor = this.PRIMARY,
            hoverColor = this.PRIMARY_HOVER,
        } = options;

        const container = scene.add.container(x, y); //.setDepth(depth);

        // 创建背景
        const bg = scene.add.graphics();
        bg.fillStyle(bgColor, 1);
        bg.fillRoundedRect(-width/2, -height/2, width, height, radius);

        // 创建文本（添加自动换行）
        const buttonText = scene.add.text(
            0, 0,
            text,
            {
                fontSize: fontSize,
                //fill: '#ffffff',
                wordWrap: { width: width - padding * 2 },
                align: 'center',
                lineSpacing: 10
            }
        ).setOrigin(0.5);

        // 如果文本高度超出按钮，调整字体大小
        if (buttonText.height > height - padding * 2) {
            const scale = (height - padding * 2) / buttonText.height;
            buttonText.setFontSize(parseInt(fontSize) * scale);
        }

        // 确保文本完全居中
        buttonText.setPosition(0, 0);

        container.add([bg, buttonText]);
        container.setSize(width, height);

        // 添加交互
        container.setInteractive({ cursor: 'pointer' })
            .on('pointerover', () => {
                bg.clear();
                bg.fillStyle(hoverColor, 1);
                bg.fillRoundedRect(-width/2, -height/2, width, height, radius);
                container.setScale(scale);
            })
            .on('pointerout', () => {
                bg.clear();
                bg.fillStyle(bgColor, 1);
                bg.fillRoundedRect(-width/2, -height/2, width, height, radius);
                container.setScale(1);
            })
            .on('pointerdown', onClick);

        return container;
    }

    /**
     * 创建一个带动画效果的按钮
     * @param {Phaser.Scene} scene - 场景实例
     * @param {number} x - 按钮x坐标
     * @param {number} y - 按钮y坐标
     * @param {string} text - 按钮文本
     * @param {ButtonOptions} options - 按钮配置
     * @param {() => void} onClick - 点击回调
     * @returns {Phaser.GameObjects.Container} 按钮容器对象
     */
    static createAnimated(scene: Phaser.Scene, x: number, y: number, text: string, options: ButtonOptions = {}, onClick: () => void): Phaser.GameObjects.Container {
        const button = this.create(scene, x, y, text, options, onClick);
        
        // 添加呼吸动画
        scene.tweens.add({
            targets: button,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        return button;
    }

    /**
     * 创建一个圆形按钮
     * @param {Phaser.Scene} scene - 场景实例
     * @param {number} x - 按钮x坐标
     * @param {number} y - 按钮y坐标
     * @param {string} iconKey - 图标键值
     * @param {CircleButtonOptions} options - 按钮配置
     * @param {() => void} onClick - 点击回调
     * @returns {Phaser.GameObjects.Container} 按钮容器对象
     */
    static createCircle(scene: Phaser.Scene, x: number, y: number, iconKey: string, options: CircleButtonOptions = {}, onClick: () => void): Phaser.GameObjects.Container {
        const {
            size = 80,
            //depth = scene.depth + 1,
            clickScale = 1.2,
            iconScale = 2,
            bgColor = this.PRIMARY,
            hoverColor = this.PRIMARY_HOVER,
        } = options;

        const container = scene.add.container(x, y);//.setDepth(depth);

        // 创建圆形背景
        const bg = scene.add.graphics();
        bg.fillStyle(bgColor, 1);
        bg.fillCircle(0, 0, size/2);

        // 使用图标图片
        const iconImage = scene.add.image(0, 0, iconKey)
            .setScale(iconScale)
            .setOrigin(0.5)
            .setTint(0xFFFFFF);

        container.add([bg, iconImage]);
        container.setSize(size, size);

        // 添加交互
        container.setInteractive({ cursor: 'pointer' })
            .on('pointerover', () => {
                bg.clear();
                bg.fillStyle(hoverColor, 1);
                bg.fillCircle(0, 0, size/2);
                container.setScale(clickScale);
            })
            .on('pointerout', () => {
                bg.clear();
                bg.fillStyle(bgColor, 1);
                bg.fillCircle(0, 0, size/2);
                container.setScale(1);
            })
            .on('pointerdown', onClick);

        return container;
    }
}

interface ButtonOptions {
    width?: number;
    height?: number;
    radius?: number;
    depth?: number;
    fontSize?: string;
    scale?: number;
    padding?: number;
    bgColor?: number;
    hoverColor?: number;
}

interface CircleButtonOptions {
    size?: number;
    depth?: number;
    clickScale?: number;
    iconScale?: number;
    bgColor?: number;
    hoverColor?: number;
}