//import { GAMECONFIG } from '../gameConfig.js';
//import { Scene } from 'phaser';

export class SceneHelper {
    static DURATION: number = 500;  // 过渡动画持续时间

    /**
     * 创建加载进度UI
     * @param {Phaser.Scene} scene - 场景实例
     */
    static showLoading(scene: Phaser.Scene): void {
        // 半透明背景
        const bg = scene.add.rectangle(
            0, 0,
            scene.cameras.main.width, scene.cameras.main.height,
            0x000000, 0.8
        ).setOrigin(0);

        // 进度条参数
        const barWidth = scene.cameras.main.width * 0.6;
        const barHeight = 20;
        const barRadius = barHeight / 2;  // 圆角半径等于高度的一半
        const barX = scene.cameras.main.width/2 - barWidth/2;
        const barY = scene.cameras.main.height/2 - barHeight/2;

        // 进度条背景
        const barBg = scene.add.graphics();
        barBg.fillStyle(0x333333, 1);
        barBg.fillRoundedRect(
            barX,
            barY,
            barWidth,
            barHeight,
            barRadius
        );

        // 进度条
        const progressBar = scene.add.graphics();

        // 进度文本
        const progressText = scene.add.text(
            scene.cameras.main.width/2,
            scene.cameras.main.height/2 + 45,
            'Loading... 0%',
            {
                fontSize: '48px',
                //fill: '#ffffff',
                //fontFamily: GAMECONFIG.UI.FONTS.DEFAULT
            }
        ).setOrigin(0.5);

        // 监听加载进度
        scene.load.on('progress', (value: number) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ff00, 1);
            const progress = Math.min(Math.max(value, 0), 1);
            if (progress > 0) {
                progressBar.fillRoundedRect(
                    barX,
                    barY,
                    barWidth * progress,
                    barHeight,
                    barRadius
                );
            }
            progressText.setText(`Loading... ${Math.floor(progress * 100)}%`);
        });

        // 监听加载完成
        scene.load.on('complete', () => {
            scene.tweens.add({
                targets: [bg, barBg, progressBar, progressText],
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    bg.destroy();
                    barBg.destroy();
                    progressBar.destroy();
                    progressText.destroy();
                }
            });
        });
    }
    
    
    /**
     * Close current scene and go to new scene.
     * @param {Phaser.Scene} currentScene 
     * @param {string} targetSceneKey 
     * @param {object} data 
     */
    static goScene(currentScene: Phaser.Scene, targetSceneKey: string, data?: object): void {
        currentScene.cameras.main.fadeOut(this.DURATION);
        currentScene.time.delayedCall(this.DURATION, () => {
            currentScene.scene.stop();
            currentScene.scene.start(targetSceneKey, data);
        });
    }

    /**
     * 返回上一个场景
     * @param {Phaser.Scene} currentScene 当前场景实例
     * @param {string} targetSceneKey 上一个场景key
     * @param {object} [options] 配置选项
     * @param {boolean} [options.fade=true] 是否使用淡入淡出效果
     * @param {number} [options.duration] 过渡时间（默认使用配置）
     */
    static backScene(currentScene: Phaser.Scene, targetSceneKey: string): void {
        currentScene.cameras.main.fadeOut(this.DURATION);
        currentScene.time.delayedCall(this.DURATION, () => {
            currentScene.scene.stop();
            currentScene.scene.start(targetSceneKey);
        });
    }
    

    /**
     * Pause current scene, and load new scene.
     * @param {Phaser.Scene} currentScene 
     * @param {string} targetSceneKey 
     * @param {object} data 
     */
    static pushScene(currentScene: Phaser.Scene, targetSceneKey: string, data?: object): void {
        currentScene.cameras.main.fadeOut(this.DURATION);
        currentScene.time.delayedCall(this.DURATION, () => {
            currentScene.scene.pause();
            currentScene.scene.launch(targetSceneKey, data);
        });
    }
}