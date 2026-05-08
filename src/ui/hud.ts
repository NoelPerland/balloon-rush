import Phaser from 'phaser';
import { createOverlayRoot, makeButton } from './dom';

export type HudStats = {
  lives: number;
  cash: number;
  wave: number;
  waveTotal?: number | undefined;
  score?: number | undefined;
};

export type HudCallbacks = {
  onBuildMode?: () => void;
  onStartWave?: () => void;
  onPauseToggle?: () => void;
};

export type HudHandle = {
  root: HTMLDivElement;
  update: (stats: Partial<HudStats>) => void;
  setWaveReady: (ready: boolean) => void;
  destroy: () => void;
};

function formatWave(stats: HudStats): string {
  return stats.waveTotal ? `${stats.wave}/${stats.waveTotal}` : `${stats.wave}`;
}

export function createTowerDefenseHud(
  scene: Phaser.Scene,
  initialStats: HudStats,
  callbacks: HudCallbacks = {},
): HudHandle {
  const root = createOverlayRoot(scene, 'td-hud');
  const stats = { ...initialStats };

  const topBar = document.createElement('div');
  topBar.className = 'td-hud__topbar';

  const lives = document.createElement('span');
  const cash = document.createElement('span');
  const wave = document.createElement('span');
  const score = document.createElement('span');

  for (const node of [lives, cash, wave, score]) {
    node.className = 'td-hud__stat';
    topBar.appendChild(node);
  }

  const actions = document.createElement('div');
  actions.className = 'td-hud__actions';

  const buildButton = makeButton('Build', 'td-icon-button td-button');
  const waveButton = makeButton('Start Wave', 'td-button td-button--primary');
  const pauseButton = makeButton('Pause', 'td-icon-button td-button');

  buildButton.title = 'Build towers';
  waveButton.title = 'Start the next enemy wave';
  pauseButton.title = 'Pause';

  buildButton.addEventListener('click', () => callbacks.onBuildMode?.());
  waveButton.addEventListener('click', () => callbacks.onStartWave?.());
  pauseButton.addEventListener('click', () => callbacks.onPauseToggle?.());

  actions.append(buildButton, waveButton, pauseButton);
  root.append(topBar, actions);

  const render = () => {
    lives.textContent = `Lives ${stats.lives}`;
    cash.textContent = `Cash ${stats.cash}`;
    wave.textContent = `Wave ${formatWave(stats)}`;
    score.textContent = `Score ${stats.score ?? 0}`;
  };

  render();

  return {
    root,
    update(nextStats) {
      Object.assign(stats, nextStats);
      render();
    },
    setWaveReady(ready) {
      waveButton.disabled = !ready;
      waveButton.textContent = ready ? 'Start Wave' : 'Wave Active';
    },
    destroy() {
      root.remove();
    },
  };
}
