import Phaser from 'phaser';
import { createWelcomeScreen } from '../ui/screens';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create(): void {
    createWelcomeScreen(this, {
      onStart: () => {
        this.scene.start('GameScene');
      },
    });
  }
}

export default MenuScene;
