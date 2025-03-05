import { Scene } from 'phaser';
import { Button } from '../objects/Button';
import { Piece } from '../objects/Piece';
import { GameConfig } from '../GameConfig';
import { SceneHelper} from '../utils/SceneHelper';


export class GameScene extends Scene {
    // offset
    private readonly offsetX = 40;
    private readonly offsetY = 0;

    // 场景通用数据
    private gameSpeed: number = 1000;
    private score: number = 0;
    private level: number = 1;
    private lines: number = 0;
    private startDt: Date = new Date();
    private isGameOver: boolean = false;

    // 块（block）
    private blocks: { value: number, color: number }[][] = [];  // 方块数组。value=0表示空，value=1表示有方块
    private cntX: number = 10;  // 方块数组的列数
    private cntY: number = 20;  // 方块数组的行数
    private blockSize: number = 40;   // 方块大小

    // 件（piece）
    private currPiece: Piece | null = null;
    private nextPiece: Piece | null = null;

    // UI
    private scoreText!: Phaser.GameObjects.Text;
    private levelText!: Phaser.GameObjects.Text;
    private linesText!: Phaser.GameObjects.Text;
    private timeText!: Phaser.GameObjects.Text;
    private gameOverText!: Phaser.GameObjects.Text;

    private dropTimer!: Phaser.Time.TimerEvent;
    private blockPool: Phaser.GameObjects.Rectangle[] = [];
    private activeBlocks: Phaser.GameObjects.Rectangle[] = [];
    private graphics!: Phaser.GameObjects.Graphics;
    private gameMask!: Phaser.GameObjects.Graphics;
    private background!: Phaser.GameObjects.Image;
    private currBgIndex: number = 0;


    constructor() {
        super({ key: 'GameScene' });
    }

    /** 预加载资源 */
    preload() {
        SceneHelper.showLoading(this);

        // 根据配置文件加载图片、音频资源
        GameConfig.bgs.forEach(bg => { this.load.image(bg.key, bg.path);});
        this.load.audio(GameConfig.sounds.bgm.key,     GameConfig.sounds.bgm.path);
        this.load.audio(GameConfig.sounds.click.key,   GameConfig.sounds.click.path);
        this.load.audio(GameConfig.sounds.move.key,    GameConfig.sounds.move.path);
        this.load.audio(GameConfig.sounds.rotate.key,  GameConfig.sounds.rotate.path);
        this.load.audio(GameConfig.sounds.drop.key,    GameConfig.sounds.drop.path);
        this.load.audio(GameConfig.sounds.clear.key,   GameConfig.sounds.clear.path);
    }



    /** 场景入口 */
    create() {
        const boardWidth = this.cntX * this.blockSize;
        const boardHeight = this.cntY * this.blockSize;
        this.graphics = this.add.graphics();
        this.drawBoard(boardWidth, boardHeight);
        this.drawControls(boardWidth);
        this.setupInput();
        this.initBlocks();
        this.initBlockPool();
        this.createNextPiece();
        this.spawnNextPiece();
        this.drawTopMask();
        this.startDropTimer();
        this.sound.play(GameConfig.sounds.bgm.key, {loop:true});
    }

    /**创建游戏面板 */
    private drawBoard(boardWidth: number, boardHeight: number) {
        this.drawBoardBg(boardWidth, boardHeight);
        //this.drawBoardGrid(this.graphics, boardWidth, boardHeight);
        this.drawBoardBorder(boardWidth, boardHeight);
        this.drawGameOver(boardWidth, boardHeight);
    }


    /**Draw bg */
    private drawBoardBg(boardWidth: number, boardHeight: number) {
        this.currBgIndex = 0;
        this.background = this.add.image(this.offsetX + boardWidth / 2, this.offsetY + boardHeight / 2, GameConfig.bgs[this.currBgIndex].key);
        this.background.setDisplaySize(boardWidth, boardHeight);
        this.background.setDepth(-1);
        //var mask = this.add.rectangle(this.offsetX + boardWidth / 2, this.offsetY + boardHeight / 2, boardWidth, boardHeight, 0xffffff);
        //mask.setAlpha(0.5);
        //mask.setDepth(0);
    }

    /**绘制关卡背景图片 */
    private updateBoardBg() {
        this.background.setTexture(GameConfig.bgs[this.currBgIndex].key);
        const boardWidth = this.cntX * this.blockSize;
        const boardHeight = this.cntY * this.blockSize;
        this.background.setPosition(this.offsetX + boardWidth / 2, this.offsetY + boardHeight / 2);
        this.background.setDisplaySize(boardWidth, boardHeight);
        console.log(`升级到 ${this.level} 级，切换背景到 ${GameConfig.bgs[this.currBgIndex].key}`);
    }

    /**创建顶部的遮罩，用于遮挡未落下的方块 */
    private drawTopMask() {
        this.gameMask = this.add.graphics();
        this.gameMask.fillStyle(0xffffff);
        this.gameMask.fillRect(0, 0, this.game.canvas.width, this.offsetY - 1); // 顶部遮罩
        this.gameMask.setDepth(1); // 确保遮罩在最上层
    }

    /**Draw grid */
    private drawBoardGrid(graphics: Phaser.GameObjects.Graphics, boardWidth: number, boardHeight: number) {
        graphics.lineStyle(1, 0xf0f0f0);
        for (let x = this.offsetX; x <= this.offsetX + boardWidth; x += this.blockSize) {
            graphics.beginPath();
            graphics.moveTo(x, this.offsetY);
            graphics.lineTo(x, this.offsetY + boardHeight);
            graphics.strokePath();
        }
        for (let y = this.offsetY; y <= this.offsetY + boardHeight; y += this.blockSize) {
            graphics.beginPath();
            graphics.moveTo(this.offsetX, y);
            graphics.lineTo(this.offsetX + boardWidth, y);
            graphics.strokePath();
        }
    }
    

    /**绘制游戏边框 */
    private drawBoardBorder(boardWidth: number, boardHeight: number) {
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x000000);
        graphics.strokeRect(this.offsetX, this.offsetY, boardWidth, boardHeight);
    }

    /**Draw game over text */
    private drawGameOver(boardWidth: number, boardHeight: number) {
        this.gameOverText = this.add.text(this.offsetX + boardWidth / 2, this.offsetY + boardHeight / 2, 'Game Over', {
            fontSize: '48px',
            color: '#ffffff',
            backgroundColor: '#ff0000',
            padding: { x: 20, y: 10 }
        }).setDepth(1000);
        this.gameOverText.setOrigin(0.5);
        this.gameOverText.setVisible(false);
    }


    /**绘制游戏控件 */
    private drawControls(boardWidth: number) {
        const bx = this.offsetX + boardWidth + 50;
        const by = this.offsetY;
        this.scoreText = this.add.text(bx, by, 'Score: 0', { fontSize: '24px', color: '#000000' });
        this.levelText = this.add.text(bx, by + 40, 'Level: 1', { fontSize: '24px', color: '#000000' });
        this.linesText = this.add.text(bx, by + 80, 'Lines: 0', { fontSize: '24px', color: '#000000' });
        this.timeText = this.add.text(bx, by + 120, 'Time: 0', { fontSize: '24px', color: '#000000' });
        this.add.text(bx, by + 160, 'Next Piece:', { fontSize: '24px', color: '#000000' });
        //this.graphics.strokeRect(bx, by+200, 150, 150);
        this.add.rectangle(bx, by + 200, 150, 150).setOrigin(0, 0).setStrokeStyle(1, 0x000000, 0.5);
        this.add.text(bx, by + 400, 'Controls:\n← : Move\n↑ : Rotate\n↓ : Soft Drop\nSpace : Hard Drop\nP : Pause', { fontSize: '20px', color: '#000000' });
        new Button(this, this.offsetX + boardWidth + 50, this.offsetY + 750, 150, 50, 'Restart', {
            fillColor: 0x90be6d,
            borderColor: 0x000000,
            borderWidth: 2,
            borderRadius: 10
        }, ()=>this.restartGame());
    }



    //-----------------------------------------------------
    // Input
    //-----------------------------------------------------
    /**按键事件处理 */
    private setupInput() {
        this.input.keyboard?.on('keydown-LEFT',  () => {!this.isGameOver && this.moveCurrPiece(-1, 0);});
        this.input.keyboard?.on('keydown-RIGHT', () => {!this.isGameOver && this.moveCurrPiece(1, 0); });
        this.input.keyboard?.on('keydown-DOWN',  () => {!this.isGameOver && this.moveCurrPiece(0, 1); });
        this.input.keyboard?.on('keydown-UP',    () => {!this.isGameOver && this.rotateCurrPiece();   });
        this.input.keyboard?.on('keydown-SPACE', () => {!this.isGameOver && this.dropCurrPiece();     });
        this.input.keyboard?.on('keydown-P',     () => {!this.isGameOver && this.togglePause();       });
    }

    /**暂停控制 */
    private togglePause() {
        if (this.dropTimer.paused) {
            this.dropTimer.paused = false;
            console.log('游戏继续');
        } else {
            this.dropTimer.paused = true;
            console.log('游戏暂停');
        }
    }


    //-----------------------------------------------------
    // 主游戏进程控制
    //-----------------------------------------------------
    /**刷新场景 */
    update(){
        this.drawBlocks();
    }

    /**启动下降定时器 */
    private startDropTimer() {
        this.startDt = new Date();
        this.updateScore();
        console.log('启动游戏循环，初始速度:', this.gameSpeed);
        this.setDropTimer();
    }

    private setDropTimer() {
        if (this.dropTimer) {
            this.dropTimer.remove();
        }
        this.dropTimer = this.time.addEvent({
            delay: this.gameSpeed,
            callback: () => {
                if (this.isGameOver || !this.currPiece)
                    return;
                this.updateScore();
                if (!this.moveCurrPiece(0, 1)) {
                    this.lockCurrPiece();
                    this.clearLines();
                    this.spawnNextPiece();
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    /**重启游戏 */
    private restartGame() {
        this.sound.play(GameConfig.sounds.click.key);
        this.isGameOver = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameSpeed = 1000;
        this.updateScore();
        this.gameOverText.setVisible(false);
        this.initBlocks();
        this.createNextPiece();
        this.spawnNextPiece();
        this.startDropTimer();
    }

    /**游戏结束 */
    private gameOver() {
        this.isGameOver = true;
        this.dropTimer.remove();
        this.gameOverText.setVisible(true);
        this.sound.stopByKey(GameConfig.sounds.bgm.key);
        console.log('游戏结束');
    }

    /**更新积分数据 */
    private updateScore() {
        this.scoreText.setText(`Score: ${this.score}`);
        this.levelText.setText(`Level: ${this.level}`);
        this.linesText.setText(`Lines: ${this.lines}`);
        //this.timeText.setText(`Time: ${new Date() - this.startDt}`);
        this.timeText.setText(`Time: ${this.calcTime(this.startDt, new Date())}`);
    }

    /** 计算两个Date对象的差值，并格式化为文本 hh:mm:ss */
    private calcTime(start: Date, end: Date): string {
        const diff = end.getTime() - start.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        return `${this.padZero(hours)}:${this.padZero(minutes)}:${this.padZero(seconds)}`;
    }

    /** 补零函数 */
    private padZero(num: number): string {
        return num < 10 ? `0${num}` : `${num}`;
    }

    //-----------------------------------------------------
    // 块控制（block）
    //-----------------------------------------------------
    /**预创建足够数量的方块精灵（可考虑放到loading事件中）*/
    private initBlockPool() {
        const totalBlocks = (this.cntX * this.cntY) + 8; // 额外的方块用于当前和预览方块
        for (let i = 0; i < totalBlocks; i++) {
            const block = this.add.rectangle(0, 0, this.blockSize, this.blockSize, 0xffffff);
            block.setVisible(false);
            this.blockPool.push(block);
        }
    }

    /**在制定位置绘制方块 */
    private drawBlock(x: number, y: number, color: number): Phaser.GameObjects.Rectangle {
        // 创建主方块
        const blockSize = this.blockSize;
        let block = this.blockPool.find(b => !b.visible);
        if (!block) {
            block = this.add.rectangle(0, 0, this.blockSize, this.blockSize, 0xffffff);
            this.blockPool.push(block);
        }
        block.setPosition(this.offsetX + x + blockSize / 2, this.offsetY + y + blockSize / 2);
        block.setFillStyle(color);
        block.setStrokeStyle(1, 0xffffff, 0.8);
        block.setVisible(true);
        this.activeBlocks.push(block);
        return block;
    }

    /**取消所有激活方块 */
    private clearActiveBlocks() {
        this.activeBlocks.forEach(block => {
            block.setVisible(false);
        });
        this.activeBlocks = [];
    }

    /**初始化网格数据 */
    private initBlocks() {
        for (let y = 0; y < this.cntY; y++) {
            this.blocks[y] = [];
            for (let x = 0; x < this.cntX; x++) {
                this.blocks[y][x] = { value: 0, color: 0 };
            }
        }
    }




    //-----------------------------------------------------
    // 件控制（piece）
    //-----------------------------------------------------
    /**
     * 检查移动是否有效
     * @param x 目标X坐标
     * @param y 目标Y坐标
     * @param shape 方块形状
     * @returns 移动是否有效
     */
    private isValidMove(x: number, y: number, shape: number[][]): boolean {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardX = x + col;
                    const boardY = y + row;

                    // 检查边界
                    if (boardX < 0 || boardX >= this.cntX || boardY >= this.cntY) {
                        return false;
                    }

                    // 检查碰撞
                    if (boardY >= 0 && this.blocks[boardY][boardX].value === 1) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    /**下落新件 */
    private spawnNextPiece() {
        if (!this.nextPiece) return;

        // 居中放置新方块
        const adjustedX = Math.round((this.cntX - this.nextPiece.getWidth())/2) + 1;
        this.currPiece = this.nextPiece;
        this.currPiece.x = adjustedX;
        this.currPiece.y = 0;
        console.log(`生成新方块，位置: (${adjustedX}, 0)，形状:`, this.currPiece.shape);

        // 检查新方块是否可以放置
        if (!this.isValidMove(adjustedX, 0, this.currPiece.shape)) {
            console.log('游戏结束：新方块无法放置');
            this.gameOver();
            return;
        }

        this.createNextPiece();
    }

    /**随机生成下一个件 */
    private createNextPiece() {
        this.nextPiece = new Piece();
    }

    /**移动当前件 */
    private moveCurrPiece(dx: number, dy: number) {
        if (!this.currPiece) return false;
        const newX = this.currPiece.x + dx;
        const newY = this.currPiece.y + dy;

        if (this.isValidMove(newX, newY, this.currPiece.shape)) {
            this.currPiece.move(dx, dy);
            if (dx !== 0) 
                this.sound.play(GameConfig.sounds.move.key);
            console.log(`方块移动到: (${newX}, ${newY})`);
            return true;
        }
        console.log(`方块移动失败 - 目标位置: (${newX}, ${newY})`);
        return false;
    }

    /**旋转当前件 */
    private rotateCurrPiece() {
        if (!this.currPiece) return;

        const rotated = this.currPiece.rotate();

        if (this.isValidMove(this.currPiece.x, this.currPiece.y, rotated)) {
            this.currPiece.shape = rotated;
            this.sound.play(GameConfig.sounds.rotate.key);
            console.log('方块旋转成功');
        } else {
            console.log('方块旋转失败 - 无效位置');
        }
    }

    /**如果当前键已经无法移动，则锁定当前件 */
    private lockCurrPiece() {
        if (!this.currPiece) return;

        for (let row = 0; row < this.currPiece.shape.length; row++) {
            for (let col = 0; col < this.currPiece.shape[row].length; col++) {
                if (this.currPiece.shape[row][col]) {
                    const boardY = this.currPiece.y + row;
                    const boardX = this.currPiece.x + col;
                    if (boardY >= 0) {
                        this.blocks[boardY][boardX] = { value: 1, color: this.currPiece.color };
                    }
                }
            }
        }
    }

    /**坠落当前件 */
    private dropCurrPiece() {
        if (!this.currPiece) return;
        let dropDistance = 0;
        while (this.moveCurrPiece(0, 1)) {
            dropDistance++;
        }
        this.sound.play(GameConfig.sounds.drop.key);
        console.log(`硬降落完成 - 下落距离: ${dropDistance}格`);
    }

    /**消除方块行 */
    private clearLines() {
        let linesCleared = 0;

        for (let row = this.cntY - 1; row >= 0; row--) {
            if (this.blocks[row].every(cell => cell.value === 1)) {
                this.blocks.splice(row, 1);
                this.blocks.unshift(new Array(this.cntX).fill({ value: 0, color: 0 }));
                linesCleared++;
                row++; // Check the same row again
                console.log(`消除第 ${row} 行`);
            }
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;
            const oldLevel = this.level;
            this.level = Math.floor(this.lines / 10) + 1;     // 10行加一级
            this.score += 100 * linesCleared * linesCleared;  // 分数=100*行数*行数
            this.gameSpeed = 1000 - (this.level - 1) * 100;   // 速度=1000-（等级-1）*100，值越小速度越快

            // 如果等级发生变化，更换背景
            if (this.level > oldLevel) {
                this.currBgIndex = (this.currBgIndex + 1) % GameConfig.bgs.length;
                this.updateBoardBg();
            }
            //this.dropTimer.delay = this.gameSpeed;
            console.log(`消除 ${linesCleared} 行，当前等级: ${this.level}，分数: ${this.score}，速度: ${this.gameSpeed}ms`);
            this.sound.play(GameConfig.sounds.clear.key);
            this.updateScore();
            this.setDropTimer();
        }
    }



    /**绘制游戏场景中的所有方块 */
    private drawBlocks() {
        this.clearActiveBlocks();
        this.graphics.clear();

        // 绘制已固定的方块
        for (let y = 0; y < this.cntY; y++) {
            for (let x = 0; x < this.cntX; x++) {
                if (this.blocks[y][x].value) {
                    this.drawBlock(
                        x * this.blockSize,
                        y * this.blockSize,
                        this.blocks[y][x].color
                    );
                }
            }
        }

        // 绘制当前方块
        if (this.currPiece) {
            for (let row = 0; row < this.currPiece.shape.length; row++) {
                for (let col = 0; col < this.currPiece.shape[row].length; col++) {
                    if (this.currPiece.shape[row][col]) {
                        this.drawBlock(
                            (this.currPiece.x + col) * this.blockSize,
                            (this.currPiece.y + row) * this.blockSize,
                            this.currPiece.color
                        );
                    }
                }
            }
        }

        // 绘制下一个方块预览
        if (this.nextPiece) {
            const previewX = this.cntX * this.blockSize + 120;
            const previewY = 260;
            const previewBlockSize = 20;

            for (let row = 0; row < this.nextPiece.shape.length; row++) {
                for (let col = 0; col < this.nextPiece.shape[row].length; col++) {
                    if (this.nextPiece.shape[row][col]) {
                        const block = this.add.rectangle(
                            previewX + col * previewBlockSize,
                            previewY + row * previewBlockSize,
                            previewBlockSize,
                            previewBlockSize,
                            this.nextPiece.color
                        );
                        block.setStrokeStyle(1, 0xffffff, 0.8);
                        this.activeBlocks.push(block);
                    }
                }
            }
        }
    }

}


