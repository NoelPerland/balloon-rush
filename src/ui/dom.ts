import Phaser from 'phaser';

export type UiCleanup = () => void;

export function createOverlayRoot(scene: Phaser.Scene, className: string): HTMLDivElement {
  const parent = scene.game.canvas.parentElement ?? document.body;
  const root = document.createElement('div');

  root.className = `td-ui ${className}`;
  root.dataset.scene = scene.scene.key;
  parent.appendChild(root);

  const cleanup = () => root.remove();
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  scene.events.once(Phaser.Scenes.Events.DESTROY, cleanup);

  return root;
}

export function makeButton(label: string, className = 'td-button'): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = className;
  button.type = 'button';
  button.textContent = label;
  return button;
}

export function clearElement(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}
