import Phaser from 'phaser';
import { createEndScreen } from '../ui/screens';

export type EndSceneData = {
  outcome?: 'victory' | 'loss';
  wavesCleared?: number | undefined;
  score?: number | undefined;
};

export class EndScene extends Phaser.Scene {
  constructor() {
    super('EndScene');
  }

  create(data: EndSceneData = {}): void {
    createEndScreen(this, {
      outcome: data.outcome ?? 'loss',
      wavesCleared: data.wavesCleared,
      score: data.score,
      onRetry: () => this.scene.start('GameScene'),
      onMenu: () => this.scene.start('MenuScene'),
    });
  }
}

export default EndScene;
