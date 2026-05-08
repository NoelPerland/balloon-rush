import Phaser from 'phaser';
import { createOverlayRoot, makeButton } from './dom';

export type WelcomeScreenOptions = {
  onStart: () => void;
};

export type EndScreenOptions = {
  outcome: 'victory' | 'loss';
  wavesCleared?: number | undefined;
  score?: number | undefined;
  onRetry: () => void;
  onMenu: () => void;
};

export function createWelcomeScreen(scene: Phaser.Scene, options: WelcomeScreenOptions): HTMLDivElement {
  const root = createOverlayRoot(scene, 'td-screen td-screen--welcome');
  const panel = document.createElement('main');
  panel.className = 'td-screen__panel';

  const kicker = document.createElement('p');
  kicker.className = 'td-screen__kicker';
  kicker.textContent = 'Tower Defense';

  const title = document.createElement('h1');
  title.className = 'td-screen__title';
  title.textContent = 'Hold the Last Gate';

  const copy = document.createElement('p');
  copy.className = 'td-screen__copy';
  copy.textContent = 'Build, upgrade, and time each wave before the path breaks through.';

  const startButton = makeButton('Start Defense', 'td-button td-button--primary td-screen__primary');
  startButton.addEventListener('click', options.onStart);

  panel.append(kicker, title, copy, startButton);
  root.appendChild(panel);

  return root;
}

export function createEndScreen(scene: Phaser.Scene, options: EndScreenOptions): HTMLDivElement {
  const root = createOverlayRoot(scene, `td-screen td-screen--${options.outcome}`);
  const panel = document.createElement('main');
  panel.className = 'td-screen__panel';

  const kicker = document.createElement('p');
  kicker.className = 'td-screen__kicker';
  kicker.textContent = options.outcome === 'victory' ? 'Victory' : 'Defeat';

  const title = document.createElement('h1');
  title.className = 'td-screen__title';
  title.textContent = options.outcome === 'victory' ? 'The Gate Stands' : 'The Line Has Fallen';

  const copy = document.createElement('p');
  copy.className = 'td-screen__copy';
  copy.textContent =
    options.outcome === 'victory'
      ? 'Every wave was stopped before it reached the keep.'
      : 'The invaders broke through. Rebuild the route and try again.';

  const summary = document.createElement('dl');
  summary.className = 'td-screen__summary';
  summary.innerHTML = `
    <div><dt>Waves</dt><dd>${options.wavesCleared ?? 0}</dd></div>
    <div><dt>Score</dt><dd>${options.score ?? 0}</dd></div>
  `;

  const actions = document.createElement('div');
  actions.className = 'td-screen__actions';

  const retryButton = makeButton('Retry', 'td-button td-button--primary');
  const menuButton = makeButton('Menu', 'td-button');
  retryButton.addEventListener('click', options.onRetry);
  menuButton.addEventListener('click', options.onMenu);

  actions.append(retryButton, menuButton);
  panel.append(kicker, title, copy, summary, actions);
  root.appendChild(panel);

  return root;
}
