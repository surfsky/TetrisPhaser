import 'phaser';
import { TestScene } from './scenes/TestScene';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 800,
  parent: 'game',
  backgroundColor: '#ffffff',
  //scene: TestScene,
  scene: GameScene,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x:0 },
      debug: false
    }
  }
};

new Phaser.Game(config);