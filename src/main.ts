import Phaser from 'phaser';
import './style.css';

type TowerKind = 'dart' | 'cannon' | 'super' | 'ultra';
type EnemyKind = 'red' | 'blue' | 'purple';
type UpgradePath = 'rapid' | 'power' | 'range';

type TowerDef = {
  kind: TowerKind;
  name: string;
  cost: number;
  upgradeCost: number;
  range: number;
  fireRate: number;
  damage: number;
  radius: number;
  color: number;
  accent: number;
  splash?: number;
};

type TowerStats = TowerDef & {
  projectileSpeed: number;
};

type UpgradeTier = {
  title: string;
  body: string;
  cost: number;
  rangeAdd?: number;
  fireRateMult?: number;
  damageAdd?: number;
  splashAdd?: number;
  projectileSpeedAdd?: number;
};

type UpgradePathDef = {
  name: string;
  icon: string;
  tiers: UpgradeTier[];
};

type EnemyDef = {
  kind: EnemyKind;
  hp: number;
  speed: number;
  reward: number;
  radius: number;
  color: number;
};

type Tower = {
  id: number;
  kind: TowerKind;
  x: number;
  y: number;
  upgradePath?: UpgradePath;
  upgradeTier: number;
  spent: number;
  cooldown: number;
};

type Enemy = {
  id: number;
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  progress: number;
  alive: boolean;
};

type Projectile = {
  id: number;
  kind: TowerKind;
  x: number;
  y: number;
  targetId: number;
  speed: number;
  damage: number;
  splash: number;
};

const WORLD_W = 1280;
const WORLD_H = 720;

const PATH = [
  { x: -60, y: 282 }, { x: 20, y: 270 }, { x: 80, y: 259 },
  { x: 120, y: 276 }, { x: 145, y: 350 }, { x: 165, y: 435 },
  { x: 205, y: 470 }, { x: 260, y: 470 }, { x: 310, y: 460 },
  { x: 340, y: 405 }, { x: 360, y: 320 }, { x: 392, y: 275 },
  { x: 440, y: 262 }, { x: 475, y: 320 }, { x: 500, y: 410 },
  { x: 540, y: 455 }, { x: 600, y: 450 }, { x: 635, y: 365 },
  { x: 660, y: 245 }, { x: 705, y: 175 }, { x: 760, y: 168 },
  { x: 805, y: 200 }, { x: 835, y: 300 }, { x: 870, y: 390 },
  { x: 925, y: 405 }, { x: 975, y: 390 }, { x: 1010, y: 320 },
  { x: 1040, y: 265 }, { x: 1085, y: 243 }, { x: 1125, y: 255 },
  { x: 1160, y: 315 }, { x: 1200, y: 365 }, { x: 1245, y: 394 },
  { x: 1340, y: 392 },
];

const PATH_BLOCK_RADIUS = 42;

const TERRAIN_BLOCKERS = [
  { x: 270, y: 105, rx: 125, ry: 90 },
  { x: 165, y: 670, rx: 270, ry: 105 },
  { x: 58, y: 92, rx: 90, ry: 120 },
  { x: 115, y: 565, rx: 120, ry: 72 },
  { x: 612, y: 650, rx: 92, ry: 68 },
  { x: 737, y: 415, rx: 48, ry: 48 },
  { x: 734, y: 516, rx: 86, ry: 78 },
  { x: 740, y: 650, rx: 118, ry: 70 },
  { x: 964, y: 635, rx: 95, ry: 72 },
  { x: 1185, y: 105, rx: 118, ry: 92 },
  { x: 1218, y: 646, rx: 118, ry: 86 },
];

const TOWER_DEFS: Record<TowerKind, TowerDef> = {
  dart: { kind: 'dart', name: 'Dart', cost: 45, upgradeCost: 55, range: 155, fireRate: 0.34, damage: 1, radius: 25, color: 0x3ca370, accent: 0xffe066 },
  cannon: { kind: 'cannon', name: 'Cannon', cost: 80, upgradeCost: 80, range: 145, fireRate: 0.72, damage: 2, radius: 28, color: 0x566c86, accent: 0xf77622, splash: 58 },
  super: { kind: 'super', name: 'Super', cost: 150, upgradeCost: 120, range: 210, fireRate: 0.14, damage: 1, radius: 34, color: 0x8f563b, accent: 0x29adff },
  ultra: { kind: 'ultra', name: 'ULTRA', cost: 3000, upgradeCost: 750, range: 360, fireRate: 0.08, damage: 55, radius: 50, color: 0xe43b44, accent: 0xffa300, splash: 130 },
};

const UPGRADE_TREES: Record<TowerKind, Record<UpgradePath, UpgradePathDef>> = {
  dart: {
    rapid: {
      name: 'Quick Fletching',
      icon: 'tree-dart-rapid',
      tiers: [
        { title: 'Quick Fletching I', body: 'Darts fire faster.', cost: 50, fireRateMult: 0.86 },
        { title: 'Quick Fletching II', body: 'Rapid volley rhythm.', cost: 95, fireRateMult: 0.72, projectileSpeedAdd: 60 },
        { title: 'Quick Fletching III', body: 'Storm of darts.', cost: 155, fireRateMult: 0.55, projectileSpeedAdd: 120 },
      ],
    },
    power: {
      name: 'Needle Tips',
      icon: 'tree-dart-pierce',
      tiers: [
        { title: 'Needle Tips I', body: 'Sharper darts hit harder.', cost: 60, damageAdd: 1 },
        { title: 'Needle Tips II', body: 'Heavy dart heads.', cost: 120, damageAdd: 2 },
        { title: 'Needle Tips III', body: 'Armor-punch darts.', cost: 190, damageAdd: 4 },
      ],
    },
    range: {
      name: 'Eagle Eye',
      icon: 'tree-dart-range',
      tiers: [
        { title: 'Eagle Eye I', body: 'Longer sight range.', cost: 45, rangeAdd: 35 },
        { title: 'Eagle Eye II', body: 'Covers wider bends.', cost: 90, rangeAdd: 70 },
        { title: 'Eagle Eye III', body: 'Full lane control.', cost: 150, rangeAdd: 115, damageAdd: 1 },
      ],
    },
  },
  cannon: {
    rapid: {
      name: 'Blast Chamber',
      icon: 'tree-cannon-blast',
      tiers: [
        { title: 'Blast Chamber I', body: 'Wider explosions.', cost: 85, splashAdd: 22 },
        { title: 'Blast Chamber II', body: 'Blast catches groups.', cost: 150, splashAdd: 44 },
        { title: 'Blast Chamber III', body: 'Huge pop radius.', cost: 240, splashAdd: 76, damageAdd: 1 },
      ],
    },
    power: {
      name: 'Iron Bombs',
      icon: 'tree-cannon-heavy',
      tiers: [
        { title: 'Iron Bombs I', body: 'Bigger direct hits.', cost: 95, damageAdd: 2 },
        { title: 'Iron Bombs II', body: 'Crushing payloads.', cost: 175, damageAdd: 4 },
        { title: 'Iron Bombs III', body: 'Boss-grade shells.', cost: 285, damageAdd: 7 },
      ],
    },
    range: {
      name: 'Reload Gears',
      icon: 'tree-cannon-reload',
      tiers: [
        { title: 'Reload Gears I', body: 'Cannon reloads faster.', cost: 80, fireRateMult: 0.82 },
        { title: 'Reload Gears II', body: 'Quicker firing cycle.', cost: 145, fireRateMult: 0.66, projectileSpeedAdd: 80 },
        { title: 'Reload Gears III', body: 'Artillery tempo.', cost: 235, fireRateMult: 0.5, rangeAdd: 35 },
      ],
    },
  },
  super: {
    rapid: {
      name: 'Rush Fists',
      icon: 'tree-super-rapid',
      tiers: [
        { title: 'Rush Fists I', body: 'Hero attacks faster.', cost: 130, fireRateMult: 0.78 },
        { title: 'Rush Fists II', body: 'Blinding punch speed.', cost: 240, fireRateMult: 0.58 },
        { title: 'Rush Fists III', body: 'Ultra-fast barrage.', cost: 420, fireRateMult: 0.38, damageAdd: 1 },
      ],
    },
    power: {
      name: 'Energy Beam',
      icon: 'tree-super-beam',
      tiers: [
        { title: 'Energy Beam I', body: 'Energy hits harder.', cost: 150, damageAdd: 1 },
        { title: 'Energy Beam II', body: 'Focused beam damage.', cost: 285, damageAdd: 3 },
        { title: 'Energy Beam III', body: 'Devastating energy.', cost: 500, damageAdd: 6 },
      ],
    },
    range: {
      name: 'Hero Aura',
      icon: 'tree-super-aura',
      tiers: [
        { title: 'Hero Aura I', body: 'Hero sees farther.', cost: 120, rangeAdd: 45 },
        { title: 'Hero Aura II', body: 'Large protection aura.', cost: 230, rangeAdd: 90, projectileSpeedAdd: 100 },
        { title: 'Hero Aura III', body: 'Map-wide pressure.', cost: 390, rangeAdd: 150, fireRateMult: 0.82 },
      ],
    },
  },
  ultra: {
    rapid: {
      name: 'Inferno Breath',
      icon: 'tree-super-rapid',
      tiers: [
        { title: 'Inferno I', body: 'Dragon fire burns faster.', cost: 900, fireRateMult: 0.75 },
        { title: 'Inferno II', body: 'Near-constant flame stream.', cost: 1600, fireRateMult: 0.55 },
        { title: 'Inferno III', body: 'Absurd firestorm.', cost: 2600, fireRateMult: 0.35, damageAdd: 20 },
      ],
    },
    power: {
      name: 'Ancient Flame',
      icon: 'tree-super-beam',
      tiers: [
        { title: 'Ancient Flame I', body: 'Fire hits much harder.', cost: 1100, damageAdd: 30 },
        { title: 'Ancient Flame II', body: 'Melts entire groups.', cost: 1900, damageAdd: 70 },
        { title: 'Ancient Flame III', body: 'Comically overpowered.', cost: 3200, damageAdd: 140 },
      ],
    },
    range: {
      name: 'Dragon Dominion',
      icon: 'tree-super-aura',
      tiers: [
        { title: 'Dominion I', body: 'Dragon controls more map.', cost: 850, rangeAdd: 80 },
        { title: 'Dominion II', body: 'Huge fire splash.', cost: 1700, splashAdd: 90 },
        { title: 'Dominion III', body: 'Almost no safe path remains.', cost: 2900, rangeAdd: 160, splashAdd: 150 },
      ],
    },
  },
};

const ENEMY_DEFS: Record<EnemyKind, EnemyDef> = {
  red: { kind: 'red', hp: 2, speed: 118, reward: 8, radius: 20, color: 0xe43b44 },
  blue: { kind: 'blue', hp: 5, speed: 92, reward: 15, radius: 23, color: 0x0099db },
  purple: { kind: 'purple', hp: 3, speed: 164, reward: 18, radius: 21, color: 0x9a4dff },
};

const WAVES: EnemyKind[][] = [
  ['red', 'red', 'red', 'red', 'red'],
  ['red', 'red', 'red', 'red', 'red', 'red', 'blue'],
  ['red', 'blue', 'red', 'blue', 'red', 'red', 'blue'],
  ['purple', 'red', 'red', 'blue', 'purple', 'red', 'blue', 'red'],
  ['blue', 'blue', 'red', 'purple', 'blue', 'red', 'purple', 'blue', 'blue'],
  ['purple', 'purple', 'red', 'blue', 'blue', 'purple', 'red', 'blue', 'blue', 'red'],
  ['blue', 'purple', 'blue', 'purple', 'blue', 'red', 'blue', 'purple', 'blue', 'red', 'blue'],
  ['purple', 'blue', 'purple', 'blue', 'purple', 'blue', 'blue', 'purple', 'blue', 'purple', 'red'],
  ['blue', 'blue', 'purple', 'purple', 'blue', 'blue', 'purple', 'blue', 'purple', 'blue', 'purple', 'red'],
  ['purple', 'blue', 'blue', 'purple', 'blue', 'purple', 'blue', 'blue', 'purple', 'blue', 'purple', 'blue', 'purple'],
  ['red', 'purple', 'red', 'blue', 'purple', 'blue', 'purple', 'purple', 'blue', 'red', 'blue', 'purple', 'blue', 'purple'],
  ['blue', 'blue', 'blue', 'purple', 'purple', 'blue', 'purple', 'blue', 'purple', 'blue', 'purple', 'purple', 'red', 'red'],
  ['purple', 'purple', 'purple', 'blue', 'blue', 'purple', 'red', 'blue', 'purple', 'blue', 'purple', 'blue', 'purple', 'blue', 'purple'],
  ['blue', 'purple', 'blue', 'purple', 'purple', 'blue', 'purple', 'blue', 'blue', 'purple', 'purple', 'blue', 'purple', 'blue', 'red', 'purple'],
  ['purple', 'blue', 'purple', 'blue', 'purple', 'blue', 'purple', 'purple', 'blue', 'blue', 'purple', 'purple', 'blue', 'purple', 'blue', 'purple', 'blue'],
  ['purple', 'purple', 'blue', 'purple', 'blue', 'purple', 'blue', 'purple', 'red', 'purple', 'blue', 'purple', 'purple', 'blue', 'purple', 'blue', 'purple', 'blue'],
  ['blue', 'purple', 'purple', 'blue', 'purple', 'blue', 'purple', 'purple', 'blue', 'purple', 'blue', 'purple', 'purple', 'blue', 'purple', 'blue', 'purple', 'purple', 'red'],
  ['purple', 'blue', 'purple', 'blue', 'purple', 'purple', 'blue', 'purple', 'blue', 'purple', 'blue', 'purple', 'purple', 'blue', 'purple', 'blue', 'purple', 'purple', 'blue', 'purple'],
  ['purple', 'purple', 'blue', 'purple', 'purple', 'blue', 'purple', 'blue', 'purple', 'purple', 'blue', 'purple', 'blue', 'purple', 'purple', 'blue', 'purple', 'blue', 'purple', 'purple', 'blue'],
  ['purple', 'blue', 'purple', 'purple', 'blue', 'purple', 'purple', 'blue', 'purple', 'purple', 'blue', 'purple', 'purple', 'blue', 'purple', 'purple', 'blue', 'purple', 'purple', 'blue', 'purple', 'purple', 'blue', 'purple'],
];

const state = {
  money: 150,
  lives: 20,
  wave: 0,
  running: false,
  autoWave: false,
  selected: 'dart' as TowerKind,
  selectedTowerId: 0,
  placing: true,
  muted: false,
  logs: [] as string[],
  logOpen: false,
  status: 'menu' as 'menu' | 'play' | 'win' | 'loss',
};

const hud = document.querySelector<HTMLDivElement>('#hud')!;
const screen = document.querySelector<HTMLDivElement>('#screen')!;
const log = document.createElement('div');
log.id = 'log';
document.querySelector<HTMLDivElement>('#app')!.appendChild(log);

class AudioBus {
  private ctx?: AudioContext;
  private music?: HTMLAudioElement;

  setMuted(value: boolean) {
    state.muted = value;
    if (this.music) this.music.muted = value;
  }

  startMusic() {
    this.music ??= Object.assign(new Audio('/assets/music/night-of-dizzy-spells.mp3'), {
      loop: true,
      volume: 0.35,
    });
    this.music.muted = state.muted;
    void this.music.play();
  }

  setWaveActive(value: boolean) {
    void value;
  }

  blip(type: 'shoot' | 'pop' | 'wave' | 'upgrade' | 'leak') {
    if (state.muted) return;
    const ctx = this.getContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const table = {
      shoot: [520, 0.035, 0.028],
      pop: [220, 0.07, 0.065],
      wave: [330, 0.12, 0.05],
      upgrade: [740, 0.14, 0.055],
      leak: [95, 0.16, 0.07],
    } as const;
    const [freq, dur, vol] = table[type];
    osc.frequency.setValueAtTime(freq, now);
    if (type === 'pop') osc.frequency.exponentialRampToValueAtTime(120, now + dur);
    if (type === 'upgrade') osc.frequency.exponentialRampToValueAtTime(1100, now + dur);
    osc.type = type === 'leak' ? 'sawtooth' : 'triangle';
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur);
  }

  private getContext() {
    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx ??= new AudioContextCtor();
    return this.ctx;
  }

}

const audio = new AudioBus();

class GameScene extends Phaser.Scene {
  private towers: Tower[] = [];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private towerViews = new Map<number, Phaser.GameObjects.Container>();
  private enemyViews = new Map<number, Phaser.GameObjects.Container>();
  private projectileViews = new Map<number, Phaser.GameObjects.Arc>();
  private id = 1;
  private spawnQueue: EnemyKind[] = [];
  private spawnTimer = 0;
  private waveActive = false;
  private rangePreview?: Phaser.GameObjects.Arc;
  private selectedRange?: Phaser.GameObjects.Arc;
  private placementGhost?: Phaser.GameObjects.Image;
  private pathLength = 0;

  constructor() {
    super('game');
  }

  preload() {
    this.load.image('map-bg', '/assets/map-landscape.png');
    this.load.image('tower-dart', '/assets/sprites/tower-dart.png');
    this.load.image('tower-cannon', '/assets/sprites/tower-cannon.png');
    this.load.image('tower-super', '/assets/sprites/tower-super.png');
    this.load.image('tower-ultra', '/assets/sprites/tower-ultra.png');
    this.load.image('enemy-red', '/assets/sprites/enemy-red.png');
    this.load.image('enemy-blue', '/assets/sprites/enemy-blue.png');
    this.load.image('enemy-purple', '/assets/sprites/enemy-purple.png');
    this.load.image('fx-pop', '/assets/sprites/fx-pop.png');
    const loadedUpgradeIcons = new Set<string>();
    for (const kind of Object.keys(UPGRADE_TREES) as TowerKind[]) {
      for (const path of Object.keys(UPGRADE_TREES[kind]) as UpgradePath[]) {
        const icon = UPGRADE_TREES[kind][path].icon;
        if (loadedUpgradeIcons.has(icon)) continue;
        loadedUpgradeIcons.add(icon);
        this.load.image(icon, `/assets/upgrades/tree/${icon.replace('tree-', '')}.png`);
      }
    }
  }

  create() {
    this.pathLength = this.measurePath();
    this.drawMap();
    this.input.on('pointermove', () => {
      const point = this.input.activePointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      this.updateRangePreview(point.x, point.y);
    });
    renderScreen('menu');
    renderHud(this);

    this.game.canvas.addEventListener('click', (event) => {
      if (state.status !== 'play') return;
      const x = (event.offsetX / this.game.canvas.clientWidth) * WORLD_W;
      const y = (event.offsetY / this.game.canvas.clientHeight) * WORLD_H;
      this.handleBoardClick(x, y);
    });
  }

  update(_time: number, deltaMs: number) {
    if (state.status !== 'play') return;
    const dt = deltaMs / 1000;
    this.spawn(dt);
    this.updateEnemies(dt);
    this.updateTowers(dt);
    this.updateProjectiles(dt);
    this.syncViews();
    if (this.waveActive && this.spawnQueue.length === 0 && this.enemies.length === 0) {
      this.waveActive = false;
      state.running = false;
      audio.setWaveActive(false);
      const bonus = 45 + state.wave * 9 + (state.wave % 5 === 0 ? 90 : 0);
      state.money += bonus;
      addLog(`Wave ${state.wave} cleared +$${bonus}`);
      if (state.wave >= WAVES.length) {
        state.status = 'win';
        audio.setWaveActive(false);
        renderScreen('win');
      } else if (state.autoWave) {
        this.time.delayedCall(900, () => this.startWave());
      }
      renderHud(this);
    }
  }

  startGame() {
    this.clearAll();
    state.money = 150;
    state.lives = 20;
    state.wave = 0;
    state.running = false;
    state.autoWave = false;
    state.selected = 'dart';
    state.selectedTowerId = 0;
    state.placing = true;
    state.logs = [];
    state.status = 'play';
    audio.startMusic();
    audio.setWaveActive(false);
    addLog('Defense started');
    renderScreen('play');
    renderHud(this);
  }

  startWave() {
    if (state.status !== 'play' || this.waveActive || state.wave >= WAVES.length) return;
    this.spawnQueue = [...WAVES[state.wave]];
    state.wave += 1;
    state.running = true;
    this.waveActive = true;
    this.spawnTimer = 0;
    audio.setWaveActive(true);
    addLog(`Wave ${state.wave} started`);
    audio.blip('wave');
    renderHud(this);
  }

  selectTower(kind: TowerKind) {
    state.selected = kind;
    state.selectedTowerId = 0;
    state.placing = true;
    this.updateSelectedRange();
    renderHud(this);
  }

  cancelSelection() {
    state.selectedTowerId = 0;
    state.placing = false;
    this.updateSelectedRange();
    this.rangePreview?.setVisible(false);
    this.placementGhost?.setVisible(false);
    renderHud(this);
  }

  upgradeSelected(path: UpgradePath) {
    const tower = this.towers.find((item) => item.id === state.selectedTowerId);
    if (!tower) return;
    if (tower.upgradePath && tower.upgradePath !== path) return;
    const tree = UPGRADE_TREES[tower.kind][path];
    const nextTier = tree.tiers[tower.upgradeTier];
    if (!nextTier || state.money < nextTier.cost) return;
    state.money -= nextTier.cost;
    tower.upgradePath = path;
    tower.upgradeTier += 1;
    tower.spent += nextTier.cost;
    addLog(`${TOWER_DEFS[tower.kind].name}: ${nextTier.title}`);
    this.flash(tower.x, tower.y, 0xfff1a8, 58);
    this.updateSelectedRange();
    audio.blip('upgrade');
    renderHud(this);
  }

  toggleMute() {
    audio.setMuted(!state.muted);
    renderHud(this);
  }

  toggleAutoWave() {
    state.autoWave = !state.autoWave;
    if (state.autoWave && state.status === 'play' && !state.running) this.startWave();
    renderHud(this);
  }

  getSelectedTower() {
    return this.towers.find((item) => item.id === state.selectedTowerId);
  }

  sellSelectedTower() {
    const tower = this.getSelectedTower();
    if (!tower) return;
    const refund = sellValue(tower);
    state.money += refund;
    addLog(`Sold ${TOWER_DEFS[tower.kind].name} +$${refund}`);
    this.towerViews.get(tower.id)?.destroy();
    this.towerViews.delete(tower.id);
    this.towers = this.towers.filter((item) => item.id !== tower.id);
    state.selectedTowerId = 0;
    state.placing = false;
    this.updateSelectedRange();
    audio.blip('upgrade');
    renderHud(this);
  }

  private handleBoardClick(x: number, y: number) {
    const tower = this.towers.find((item) => Phaser.Math.Distance.Between(x, y, item.x, item.y) <= 44);
    if (tower) {
      state.selectedTowerId = tower.id;
      state.selected = tower.kind;
      state.placing = false;
      this.updateSelectedRange();
      renderHud(this);
      return;
    }
    state.selectedTowerId = 0;
    this.updateSelectedRange();
    if (state.placing) this.placeTower(x, y);
    else renderHud(this);
  }

  private placeTower(x: number, y: number) {
    if (state.status !== 'play') return;
    if (!this.canPlaceAt(x, y)) return;
    const def = TOWER_DEFS[state.selected];
    if (state.money < def.cost) return;
    state.money -= def.cost;
    const tower: Tower = { id: this.id++, kind: state.selected, x, y, upgradeTier: 0, spent: def.cost, cooldown: 0 };
    this.towers.push(tower);
    this.towerViews.set(tower.id, this.makeTowerView(tower));
    if (state.autoWave && state.money >= def.cost) {
      state.selectedTowerId = 0;
      state.placing = true;
    } else {
      state.selectedTowerId = tower.id;
      state.placing = false;
    }
    this.updateSelectedRange();
    audio.blip('upgrade');
    renderHud(this);
  }

  private spawn(dt: number) {
    if (!this.waveActive) return;
    this.spawnTimer -= dt;
    while (this.spawnTimer <= 0 && this.spawnQueue.length > 0) {
      const kind = this.spawnQueue.shift()!;
      const def = ENEMY_DEFS[kind];
      const enemy: Enemy = { id: this.id++, kind, hp: def.hp + Math.floor(state.wave / 3), maxHp: def.hp + Math.floor(state.wave / 3), x: PATH[0].x, y: PATH[0].y, progress: 0, alive: true };
      this.enemies.push(enemy);
      this.enemyViews.set(enemy.id, this.makeEnemyView(enemy));
      this.spawnTimer += 0.32;
    }
  }

  private updateEnemies(dt: number) {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const def = ENEMY_DEFS[enemy.kind];
      enemy.progress += (def.speed + state.wave * 6) * dt;
      const pos = this.pointAt(enemy.progress);
      enemy.x = pos.x;
      enemy.y = pos.y;
      if (enemy.progress >= this.pathLength) {
        enemy.alive = false;
        const damage = enemy.kind === 'blue' ? 2 : 1;
        state.lives -= damage;
        addLog(`${enemy.kind} escaped -${damage} HP`);
        this.flash(WORLD_W - 35, enemy.y, 0xff004d, 55);
        audio.blip('leak');
      }
    }
    this.enemies = this.enemies.filter((enemy) => {
      if (enemy.alive) return true;
      this.enemyViews.get(enemy.id)?.destroy();
      this.enemyViews.delete(enemy.id);
      return false;
    });
    if (state.lives <= 0) {
      state.status = 'loss';
      audio.setWaveActive(false);
      renderScreen('loss');
    }
  }

  private updateTowers(dt: number) {
    for (const tower of this.towers) {
      tower.cooldown -= dt;
      const def = this.towerStats(tower);
      if (tower.cooldown > 0) continue;
      const target = this.enemies
        .filter((enemy) => Phaser.Math.Distance.Between(tower.x, tower.y, enemy.x, enemy.y) <= def.range)
        .sort((a, b) => b.progress - a.progress)[0];
      if (!target) continue;
      tower.cooldown = def.fireRate;
      this.projectiles.push({ id: this.id++, kind: tower.kind, x: tower.x, y: tower.y, targetId: target.id, speed: def.projectileSpeed, damage: def.damage, splash: def.splash ?? 0 });
      this.flash(tower.x, tower.y, def.accent, def.radius + 9);
      audio.blip('shoot');
    }
  }

  private updateProjectiles(dt: number) {
    for (const projectile of this.projectiles) {
      const target = this.enemies.find((enemy) => enemy.id === projectile.targetId);
      if (!target) {
        projectile.targetId = -1;
        continue;
      }
      const angle = Phaser.Math.Angle.Between(projectile.x, projectile.y, target.x, target.y);
      const travel = projectile.speed * dt;
      const distance = Phaser.Math.Distance.Between(projectile.x, projectile.y, target.x, target.y);
      if (travel >= distance || distance < 16) {
        projectile.x = target.x;
        projectile.y = target.y;
        this.hit(projectile, target);
        projectile.targetId = -1;
      } else {
        projectile.x += Math.cos(angle) * travel;
        projectile.y += Math.sin(angle) * travel;
      }
    }
    this.projectiles = this.projectiles.filter((projectile) => {
      if (projectile.targetId !== -1) return true;
      this.projectileViews.get(projectile.id)?.destroy();
      this.projectileViews.delete(projectile.id);
      return false;
    });
  }

  private hit(projectile: Projectile, target: Enemy) {
    const victims = projectile.splash > 0
      ? this.enemies.filter((enemy) => Phaser.Math.Distance.Between(target.x, target.y, enemy.x, enemy.y) <= projectile.splash)
      : [target];
    for (const enemy of victims) {
      enemy.hp -= projectile.damage;
      this.pop(enemy.x, enemy.y, ENEMY_DEFS[enemy.kind].color);
      if (enemy.hp <= 0 && enemy.alive) {
        enemy.alive = false;
        const reward = ENEMY_DEFS[enemy.kind].reward;
        state.money += reward;
        this.floatText(enemy.x, enemy.y, `+$${reward}`);
        addLog(`${enemy.kind} popped +$${reward}`);
        audio.blip('pop');
      }
    }
    renderHud(this);
  }

  private syncViews() {
    for (const tower of this.towers) {
      const view = this.towerViews.get(tower.id);
      if (!view) continue;
      view.setPosition(tower.x, tower.y);
      view.setScale(tower.upgradeTier > 0 ? 1 + Math.min(tower.upgradeTier * 0.05, 0.15) : 1);
      view.setAlpha(state.selectedTowerId === tower.id ? 1 : 0.96);
      const badge = view.getByName('upgradeBadge') as Phaser.GameObjects.Image | null;
      if (badge && tower.upgradePath) badge.setTexture(UPGRADE_TREES[tower.kind][tower.upgradePath].icon).setVisible(true);
      else badge?.setVisible(false);
    }
    for (const enemy of this.enemies) {
      const view = this.enemyViews.get(enemy.id);
      if (!view) continue;
      view.setPosition(enemy.x, enemy.y);
      const hpBar = view.getByName('hp') as Phaser.GameObjects.Rectangle;
      hpBar.width = 28 * Math.max(0, enemy.hp / enemy.maxHp);
    }
    for (const projectile of this.projectiles) {
      let view = this.projectileViews.get(projectile.id);
      if (!view) {
        const size = projectile.kind === 'ultra' ? 10 : projectile.kind === 'cannon' ? 6 : 4;
        const color = projectile.kind === 'ultra' ? 0xff7a00 : projectile.kind === 'cannon' ? 0x2f1b14 : 0xffe066;
        view = this.add.circle(projectile.x, projectile.y, size, color);
        view.setDepth(8);
        this.projectileViews.set(projectile.id, view);
      }
      view.setPosition(projectile.x, projectile.y);
    }
  }

  private makeTowerView(tower: Tower) {
    const def = TOWER_DEFS[tower.kind];
    const c = this.add.container(tower.x, tower.y).setDepth(6);
    c.add(this.add.ellipse(0, 19, 56, 18, 0x172038, 0.28));
    const sprite = this.add.image(0, 0, `tower-${tower.kind}`).setOrigin(0.5, 0.62);
    this.sizeTowerImage(sprite, tower.kind);
    c.add(sprite);
    c.add(this.add.circle(0, 0, def.radius + 12, 0xffffff, 0.08).setStrokeStyle(1, 0xffffff, 0.18));
    const badge = this.add.image(28, -34, UPGRADE_TREES[tower.kind].rapid.icon).setDisplaySize(34, 44).setName('upgradeBadge').setVisible(false);
    c.add(badge);
    return c;
  }

  private sizeTowerImage(sprite: Phaser.GameObjects.Image, kind: TowerKind) {
    if (kind === 'ultra') {
      sprite.setDisplaySize(142, 142);
      return;
    }
    sprite.setDisplaySize(kind === 'super' ? 92 : 78, kind === 'super' ? 106 : 92);
  }

  private makeEnemyView(enemy: Enemy) {
    const def = ENEMY_DEFS[enemy.kind];
    const c = this.add.container(enemy.x, enemy.y).setDepth(5);
    c.add(this.add.ellipse(0, 13, 28, 9, 0x172038, 0.22));
    const sprite = this.add.image(0, 0, `enemy-${enemy.kind}`).setOrigin(0.5, 0.62);
    sprite.setDisplaySize(enemy.kind === 'blue' ? 58 : 52, enemy.kind === 'blue' ? 64 : 64);
    c.add(sprite);
    c.add(this.add.rectangle(0, -20, 30, 4, 0x172038, 0.4));
    c.add(this.add.rectangle(-14, -20, 28, 4, 0x63c74d).setOrigin(0, 0.5).setName('hp'));
    return c;
  }

  private drawMap() {
    this.add.image(0, 0, 'map-bg').setOrigin(0, 0).setDisplaySize(WORLD_W, WORLD_H).setDepth(0);
    this.add.rectangle(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, 0x2b7a43, 0.04).setDepth(1);
    this.add.rectangle(WORLD_W / 2, 36, WORLD_W, 72, 0x172038, 0.88).setDepth(20);
    this.selectedRange = this.add.circle(0, 0, TOWER_DEFS.dart.range, 0xffffff, 0.08).setStrokeStyle(3, 0xffffff, 0.48).setVisible(false).setDepth(4);
    this.rangePreview = this.add.circle(0, 0, TOWER_DEFS.dart.range, 0x9aa0a6, 0.12).setStrokeStyle(3, 0x9aa0a6, 0.55).setVisible(false).setDepth(14);
    this.placementGhost = this.add.image(0, 0, 'tower-dart').setOrigin(0.5, 0.62).setAlpha(0.48).setVisible(false).setDepth(15);
  }

  private updateRangePreview(x: number, y: number) {
    if (!this.rangePreview || !this.placementGhost || state.status !== 'play') return;
    if (state.selectedTowerId || !state.placing) {
      this.rangePreview.setVisible(false);
      this.placementGhost.setVisible(false);
      return;
    }
    const blocked = !this.canPlaceAt(x, y);
    const def = TOWER_DEFS[state.selected];
    const inBoard = y >= 72;
    this.rangePreview
      .setPosition(x, y)
      .setRadius(def.range)
      .setFillStyle(blocked ? 0xff2244 : 0x9aa0a6, blocked ? 0.2 : 0.12)
      .setStrokeStyle(3, blocked ? 0xff2244 : 0x9aa0a6, blocked ? 0.9 : 0.55)
      .setVisible(inBoard);
    this.placementGhost
      .setTexture(`tower-${state.selected}`)
      .setPosition(x, y)
      .setAlpha(blocked ? 0.42 : 0.52)
      .setTint(blocked ? 0xff6678 : 0xffffff)
      .setVisible(inBoard);
    this.sizeTowerImage(this.placementGhost, state.selected);
  }

  private towerStats(tower: Tower): TowerStats {
    const def = TOWER_DEFS[tower.kind];
    const stats: TowerStats = {
      ...def,
      splash: def.splash ?? 0,
      projectileSpeed: tower.kind === 'ultra' ? 1150 : tower.kind === 'cannon' ? 560 : 780,
    };
    if (!tower.upgradePath || tower.upgradeTier <= 0) return stats;
    for (const tier of UPGRADE_TREES[tower.kind][tower.upgradePath].tiers.slice(0, tower.upgradeTier)) {
      if (tier.rangeAdd) stats.range += tier.rangeAdd;
      if (tier.damageAdd) stats.damage += tier.damageAdd;
      if (tier.splashAdd) stats.splash = (stats.splash ?? 0) + tier.splashAdd;
      if (tier.projectileSpeedAdd) stats.projectileSpeed += tier.projectileSpeedAdd;
      if (tier.fireRateMult) stats.fireRate *= tier.fireRateMult;
    }
    return stats;
  }

  private updateSelectedRange() {
    if (!this.selectedRange) return;
    const tower = this.getSelectedTower();
    if (!tower) {
      this.selectedRange.setVisible(false);
      return;
    }
    const stats = this.towerStats(tower);
    this.selectedRange
      .setPosition(tower.x, tower.y)
      .setRadius(stats.range)
      .setFillStyle(0xffffff, 0.08)
      .setStrokeStyle(3, 0xffffff, 0.5)
      .setVisible(true);
  }

  private nearPath(x: number, y: number) {
    return PATH.some((point, index) => {
      const next = PATH[index + 1];
      if (!next) return false;
      return distanceToSegment(x, y, point.x, point.y, next.x, next.y) < PATH_BLOCK_RADIUS;
    });
  }

  private canPlaceAt(x: number, y: number) {
    return y >= 72 && !this.nearPath(x, y) && !this.blockedTerrain(x, y) && !this.towers.some((tower) => Phaser.Math.Distance.Between(x, y, tower.x, tower.y) < 58);
  }

  private blockedTerrain(x: number, y: number) {
    return TERRAIN_BLOCKERS.some((zone) => {
      const dx = (x - zone.x) / zone.rx;
      const dy = (y - zone.y) / zone.ry;
      return dx * dx + dy * dy <= 1;
    });
  }

  private measurePath() {
    return PATH.slice(1).reduce((sum, point, index) => sum + Phaser.Math.Distance.Between(PATH[index].x, PATH[index].y, point.x, point.y), 0);
  }

  private pointAt(distance: number) {
    let remaining = distance;
    for (let i = 0; i < PATH.length - 1; i += 1) {
      const a = PATH[i];
      const b = PATH[i + 1];
      const len = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      if (remaining <= len) {
        const t = remaining / len;
        return { x: Phaser.Math.Linear(a.x, b.x, t), y: Phaser.Math.Linear(a.y, b.y, t) };
      }
      remaining -= len;
    }
    return PATH[PATH.length - 1];
  }

  private pop(x: number, y: number, color: number) {
    const burst = this.add.image(x, y, 'fx-pop').setDepth(11).setScale(0.12).setAlpha(0.95);
    this.tweens.add({ targets: burst, scale: 0.24, alpha: 0, duration: 240, onComplete: () => burst.destroy() });
    for (let i = 0; i < 8; i += 1) {
      const bit = this.add.circle(x, y, Phaser.Math.Between(2, 4), color).setDepth(9);
      this.tweens.add({
        targets: bit,
        x: x + Phaser.Math.Between(-28, 28),
        y: y + Phaser.Math.Between(-28, 28),
        alpha: 0,
        scale: 0.2,
        duration: 260,
        onComplete: () => bit.destroy(),
      });
    }
  }

  private floatText(x: number, y: number, text: string) {
    const label = this.add.text(x, y, text, {
      fontFamily: 'Arial',
      fontSize: '18px',
      fontStyle: '900',
      color: '#ffe066',
      stroke: '#172038',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(12);
    this.tweens.add({ targets: label, y: y - 34, alpha: 0, duration: 720, onComplete: () => label.destroy() });
  }

  private flash(x: number, y: number, color: number, radius: number) {
    const ring = this.add.circle(x, y, radius, color, 0.18).setStrokeStyle(2, color, 0.8).setDepth(10);
    this.tweens.add({ targets: ring, scale: 1.65, alpha: 0, duration: 220, onComplete: () => ring.destroy() });
  }

  private clearAll() {
    [...this.towerViews.values(), ...this.enemyViews.values(), ...this.projectileViews.values()].forEach((view) => view.destroy());
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.towerViews.clear();
    this.enemyViews.clear();
    this.projectileViews.clear();
    this.spawnQueue = [];
    this.waveActive = false;
    this.selectedRange?.setVisible(false);
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WORLD_W,
  height: WORLD_H,
  backgroundColor: '#4aa35e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [GameScene],
});

function scene() {
  return game.scene.getScene('game') as GameScene;
}

function volumeIcon(muted: boolean) {
  return muted
    ? `<svg class="volume-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3Z"/><path d="m17 9 4 4m0-4-4 4"/></svg>`
    : `<svg class="volume-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3Z"/><path d="M16 8c1.2 1.1 2 2.5 2 4s-.8 2.9-2 4"/><path d="M19 5c2.1 1.9 3 4.3 3 7s-.9 5.1-3 7"/></svg>`;
}

function sellValue(tower: Tower) {
  return Math.floor(tower.spent * 0.7);
}

function renderHudOld(gameScene: GameScene) {
  void gameScene;
  return;
  /*
  const buttons = (Object.keys(TOWER_DEFS) as TowerKind[]).map((kind) => {
    const def = TOWER_DEFS[kind];
    const locked = state.money < def.cost;
    return `<button class="tower ${state.selected === kind ? 'active' : ''}" data-tower="${kind}" ${locked ? 'aria-disabled="true"' : ''}>
      <span>${def.name}</span><b>$${def.cost}</b>
    </button>`;
  }).join('');

  hud.innerHTML = `
    <div class="bar">
      <div class="stat"><span>$</span>${state.money}</div>
      <div class="stat"><span>♥</span>${state.lives}</div>
      <div class="stat"><span>Wave</span>${Math.min(state.wave + (state.running ? 0 : 1), WAVES.length)}/${WAVES.length}</div>
      <div class="towers">${buttons}</div>
      <button class="action" data-action="upgrade">Upgrade $</button>
      <button class="action primary" data-action="wave">${state.running ? 'Wave Live' : 'Start Wave'}</button>
    </div>
  `;
  hud.querySelectorAll<HTMLButtonElement>('[data-tower]').forEach((button) => {
    button.onclick = () => gameScene.selectTower(button.dataset.tower as TowerKind);
  });
  hud.querySelector<HTMLButtonElement>('[data-action="wave"]')!.onclick = () => gameScene.startWave();
  hud.querySelector<HTMLButtonElement>('[data-action="upgrade"]')!.onclick = () => gameScene.upgradeSelected('rapid');
}

  */
}

function renderHud(gameScene: GameScene) {
  if (state.status !== 'play') {
    hud.innerHTML = '';
    renderLog();
    return;
  }
  const selectedTower = gameScene.getSelectedTower();
  const selectedDef = selectedTower ? TOWER_DEFS[selectedTower.kind] : undefined;
  const upgradeCards = selectedTower ? (Object.keys(UPGRADE_TREES[selectedTower.kind]) as UpgradePath[]).map((path) => {
    const tree = UPGRADE_TREES[selectedTower.kind][path];
    const locked = Boolean(selectedTower.upgradePath && selectedTower.upgradePath !== path);
    const tier = tree.tiers[selectedTower.upgradeTier];
    const maxed = !tier;
    const disabled = locked || maxed || !tier || state.money < tier.cost;
    const label = locked ? 'Locked' : maxed ? 'Maxed' : `Tier ${selectedTower.upgradeTier + 1} $${tier.cost}`;
    const body = locked ? 'This tower is committed to another path.' : maxed ? 'Path fully upgraded.' : tier.body;
    return `<button class="upgrade-card ${locked ? 'locked' : ''}" data-upgrade-path="${path}" ${disabled ? 'disabled' : ''}>
      <img src="/assets/upgrades/tree/${tree.icon.replace('tree-', '')}.png" alt="" />
      <b>${tree.name}</b>
      <small>${label}</small>
      <span>${body}</span>
    </button>`;
  }).join('') : '';
  const buttons = (Object.keys(TOWER_DEFS) as TowerKind[]).map((kind) => {
    const def = TOWER_DEFS[kind];
    const locked = state.money < def.cost;
    return `<button class="tower ${state.placing && state.selectedTowerId === 0 && state.selected === kind ? 'active' : ''}" data-tower="${kind}" ${locked ? 'disabled' : ''}>
      <span>${def.name}</span><b>$${def.cost}</b>
    </button>`;
  }).join('');

  hud.innerHTML = `
    <div class="bar">
      <div class="stat"><span>$</span>${state.money}</div>
      <div class="stat"><span>HP</span>${state.lives}</div>
      <div class="stat"><span>Wave</span>${Math.min(state.wave + (state.running ? 0 : 1), WAVES.length)}/${WAVES.length}</div>
      <div class="towers">${buttons}</div>
      ${selectedTower && selectedDef ? `
      <div class="upgrade-panel show">
        <div class="upgrade-title">
          <strong>${selectedDef.name} upgrades</strong>
          <small>${selectedTower.upgradePath ? `Path locked: ${UPGRADE_TREES[selectedTower.kind][selectedTower.upgradePath].name} tier ${selectedTower.upgradeTier}` : 'Choose one path. First upgrade locks this tower.'}</small>
          <small>Spent $${selectedTower.spent}. Sell refund $${sellValue(selectedTower)} (70%).</small>
        </div>
        <div class="upgrade-cards">${upgradeCards}</div>
        <button class="sell-button" data-action="sell">Sell +$${sellValue(selectedTower)}</button>
      </div>` : ''}
      <button class="action auto-wave ${state.autoWave ? 'active' : ''}" data-action="auto-wave">${state.autoWave ? 'Auto On' : 'Auto Wave'}</button>
      <button class="action primary" data-action="wave">${state.running ? 'Wave Live' : 'Start Wave'}</button>
      <button class="icon-button" data-action="mute" title="${state.muted ? 'Unmute' : 'Mute'}" aria-label="${state.muted ? 'Unmute' : 'Mute'}">
        ${volumeIcon(state.muted)}
      </button>
    </div>
  `;
  hud.querySelector<HTMLDivElement>('.bar')!.onclick = (event) => {
    if ((event.target as HTMLElement).closest('button')) return;
    gameScene.cancelSelection();
  };
  hud.querySelectorAll<HTMLButtonElement>('[data-tower]').forEach((button) => {
    if (button.disabled) return;
    button.onclick = () => gameScene.selectTower(button.dataset.tower as TowerKind);
  });
  const waveButton = hud.querySelector<HTMLButtonElement>('[data-action="wave"]');
  const autoWaveButton = hud.querySelector<HTMLButtonElement>('[data-action="auto-wave"]');
  const sellButton = hud.querySelector<HTMLButtonElement>('[data-action="sell"]');
  const muteButton = hud.querySelector<HTMLButtonElement>('[data-action="mute"]');
  if (waveButton) waveButton.onclick = () => gameScene.startWave();
  if (autoWaveButton) autoWaveButton.onclick = () => gameScene.toggleAutoWave();
  if (sellButton) sellButton.onclick = () => gameScene.sellSelectedTower();
  hud.querySelectorAll<HTMLButtonElement>('[data-upgrade-path]').forEach((button) => {
    if (button.disabled) return;
    button.onclick = () => gameScene.upgradeSelected(button.dataset.upgradePath as UpgradePath);
  });
  if (muteButton) muteButton.onclick = () => gameScene.toggleMute();
  renderLog();
}

function addLog(text: string) {
  state.logs = [text, ...state.logs].slice(0, 10);
  renderLog();
}

function renderLog() {
  if (state.status !== 'play') {
    log.innerHTML = '';
    log.className = '';
    return;
  }
  log.className = state.logOpen ? 'open' : 'closed';
  const latest = state.logs[0] ?? 'No events yet';
  log.innerHTML = `
    <button class="log-toggle" type="button">
      <span>${state.logOpen ? 'Hide Log' : `Log: ${latest}`}</span>
      <span class="log-arrow ${state.logOpen ? 'up' : 'down'}"></span>
    </button>
    ${state.logOpen ? `<div class="log-list">${state.logs.map((item) => `<div>${item}</div>`).join('')}</div>` : ''}
  `;
  log.querySelector<HTMLButtonElement>('.log-toggle')!.onclick = () => {
    state.logOpen = !state.logOpen;
    renderLog();
  };
}

function renderScreen(mode: typeof state.status) {
  if (mode === 'play') {
    screen.innerHTML = '';
    screen.className = '';
    return;
  }
  const copy = {
    menu: ['Balloon Rush', 'Place towers, pop every wave of balloons, upgrade fast before the rush gets out of control!'],
    win: ['Victory', 'All waves cleared. Economy strong. Path safe.'],
    loss: ['Defeat', 'Too many balloons escaped. Try earlier cannons and one super tower.'],
  }[mode];
  screen.className = 'visible';
  screen.innerHTML = `
    <div class="panel">
      <div class="mark"></div>
      <h1>${copy[0]}</h1>
      <p>${copy[1]}</p>
      <button data-action="start">${mode === 'menu' ? 'Play' : 'Retry'}</button>
    </div>
  `;
  screen.querySelector<HTMLButtonElement>('[data-action="start"]')!.onclick = () => scene().startGame();
}

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Phaser.Math.Distance.Between(px, py, ax, ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Phaser.Math.Distance.Between(px, py, ax + t * dx, ay + t * dy);
}
