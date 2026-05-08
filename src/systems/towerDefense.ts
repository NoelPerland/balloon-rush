import { ENEMY_DEFINITIONS, type EnemyDefinition, type EnemyTypeId } from "../data/enemies";
import { MAIN_MAP, type MapDefinition, type Point } from "../data/map";
import { TOWER_DEFINITIONS, type TowerDefinition, type TowerStats, type TowerTargetMode, type TowerTypeId } from "../data/towers";
import { WAVE_DEFINITIONS, type WaveDefinition } from "../data/waves";

export type GamePhase = "ready" | "wave" | "won" | "lost";

export type EnemyState = {
  id: number;
  type: EnemyTypeId;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  waypointIndex: number;
  distanceTravelled: number;
  alive: boolean;
};

export type TowerState = {
  id: number;
  type: TowerTypeId;
  x: number;
  y: number;
  upgraded: boolean;
  targetMode: TowerTargetMode;
  cooldown: number;
};

export type ProjectileState = {
  id: number;
  towerId: number;
  targetId: number;
  x: number;
  y: number;
  damage: number;
  speed: number;
  splashRadius: number;
  alive: boolean;
};

export type PopEvent = {
  enemyId: number;
  enemyType: EnemyTypeId;
  cashReward: number;
  x: number;
  y: number;
};

export type LeakEvent = {
  enemyId: number;
  enemyType: EnemyTypeId;
  damage: number;
};

export type ShotEvent = {
  towerId: number;
  projectileId: number;
  targetId: number;
};

export type TickEvents = {
  shots: ShotEvent[];
  pops: PopEvent[];
  leaks: LeakEvent[];
  waveCompleted: boolean;
};

export type TowerDefenseSnapshot = {
  phase: GamePhase;
  cash: number;
  lives: number;
  waveIndex: number;
  enemies: EnemyState[];
  towers: TowerState[];
  projectiles: ProjectileState[];
};

type SpawnEntry = {
  enemy: EnemyTypeId;
  at: number;
};

type WaveRuntime = {
  wave: WaveDefinition;
  elapsed: number;
  nextSpawnIndex: number;
  spawns: SpawnEntry[];
};

export type TowerDefenseConfig = {
  map?: MapDefinition;
  waves?: WaveDefinition[];
};

const EPSILON = 0.0001;

export class TowerDefenseGame {
  readonly map: MapDefinition;
  readonly waves: WaveDefinition[];

  phase: GamePhase = "ready";
  cash: number;
  lives: number;
  waveIndex = 0;

  private enemies = new Map<number, EnemyState>();
  private towers = new Map<number, TowerState>();
  private projectiles = new Map<number, ProjectileState>();
  private occupiedBuildSpots = new Set<string>();
  private nextEnemyId = 1;
  private nextTowerId = 1;
  private nextProjectileId = 1;
  private activeWave: WaveRuntime | null = null;

  constructor(config: TowerDefenseConfig = {}) {
    this.map = config.map ?? MAIN_MAP;
    this.waves = config.waves ?? WAVE_DEFINITIONS;
    this.cash = this.map.startingCash;
    this.lives = this.map.baseHealth;
  }

  getSnapshot(): TowerDefenseSnapshot {
    return {
      phase: this.phase,
      cash: this.cash,
      lives: this.lives,
      waveIndex: this.waveIndex,
      enemies: [...this.enemies.values()].map(cloneEnemy),
      towers: [...this.towers.values()].map((tower) => ({ ...tower })),
      projectiles: [...this.projectiles.values()].map((projectile) => ({ ...projectile })),
    };
  }

  canPlaceTower(type: TowerTypeId, buildSpotId: string): boolean {
    const definition = TOWER_DEFINITIONS[type];
    return Boolean(definition) && this.cash >= definition.cost && this.getBuildSpot(buildSpotId) !== undefined && !this.occupiedBuildSpots.has(buildSpotId);
  }

  placeTower(type: TowerTypeId, buildSpotId: string): TowerState | null {
    if (!this.canPlaceTower(type, buildSpotId)) {
      return null;
    }

    const spot = this.getBuildSpot(buildSpotId);
    if (!spot) {
      return null;
    }

    const definition = TOWER_DEFINITIONS[type];
    const tower: TowerState = {
      id: this.nextTowerId++,
      type,
      x: spot.x,
      y: spot.y,
      upgraded: false,
      targetMode: definition.defaultTargetMode,
      cooldown: 0,
    };

    this.cash -= definition.cost;
    this.towers.set(tower.id, tower);
    this.occupiedBuildSpots.add(buildSpotId);
    return { ...tower };
  }

  upgradeTower(towerId: number): TowerState | null {
    const tower = this.towers.get(towerId);
    if (!tower || tower.upgraded) {
      return null;
    }

    const definition = TOWER_DEFINITIONS[tower.type];
    if (this.cash < definition.upgradeCost) {
      return null;
    }

    this.cash -= definition.upgradeCost;
    tower.upgraded = true;
    return { ...tower };
  }

  setTargetMode(towerId: number, targetMode: TowerTargetMode): TowerState | null {
    const tower = this.towers.get(towerId);
    if (!tower) {
      return null;
    }

    tower.targetMode = targetMode;
    return { ...tower };
  }

  startNextWave(): WaveDefinition | null {
    if (this.phase === "lost" || this.phase === "won" || this.activeWave || this.waveIndex >= this.waves.length) {
      return null;
    }

    const wave = this.waves[this.waveIndex];
    this.activeWave = {
      wave,
      elapsed: 0,
      nextSpawnIndex: 0,
      spawns: buildSpawnSchedule(wave),
    };
    this.phase = "wave";
    return wave;
  }

  update(deltaSeconds: number): TickEvents {
    const dt = Math.max(0, deltaSeconds);
    const events: TickEvents = {
      shots: [],
      pops: [],
      leaks: [],
      waveCompleted: false,
    };

    if (this.phase === "lost" || this.phase === "won") {
      return events;
    }

    this.spawnEnemies(dt);
    this.moveEnemies(dt, events);
    this.updateTowers(dt, events);
    this.updateProjectiles(dt, events);
    this.cleanupDead();
    this.completeWaveIfReady(events);

    return events;
  }

  private getBuildSpot(buildSpotId: string): Point | undefined {
    return this.map.buildSpots.find((spot) => spot.id === buildSpotId);
  }

  private spawnEnemies(dt: number): void {
    if (!this.activeWave) {
      return;
    }

    this.activeWave.elapsed += dt;
    while (
      this.activeWave.nextSpawnIndex < this.activeWave.spawns.length &&
      this.activeWave.spawns[this.activeWave.nextSpawnIndex].at <= this.activeWave.elapsed + EPSILON
    ) {
      const spawn = this.activeWave.spawns[this.activeWave.nextSpawnIndex];
      this.spawnEnemy(spawn.enemy);
      this.activeWave.nextSpawnIndex += 1;
    }
  }

  private spawnEnemy(type: EnemyTypeId): void {
    const definition = ENEMY_DEFINITIONS[type];
    const start = this.map.path[0];
    this.enemies.set(this.nextEnemyId, {
      id: this.nextEnemyId,
      type,
      x: start.x,
      y: start.y,
      health: definition.maxHealth,
      maxHealth: definition.maxHealth,
      waypointIndex: 1,
      distanceTravelled: 0,
      alive: true,
    });
    this.nextEnemyId += 1;
  }

  private moveEnemies(dt: number, events: TickEvents): void {
    for (const enemy of this.enemies.values()) {
      if (!enemy.alive) {
        continue;
      }

      const definition = ENEMY_DEFINITIONS[enemy.type];
      let remaining = definition.speed * dt;

      while (remaining > EPSILON && enemy.alive) {
        const waypoint = this.map.path[enemy.waypointIndex];
        if (!waypoint) {
          this.leakEnemy(enemy, definition, events);
          break;
        }

        const dx = waypoint.x - enemy.x;
        const dy = waypoint.y - enemy.y;
        const distance = Math.hypot(dx, dy);

        if (distance <= remaining + EPSILON) {
          enemy.x = waypoint.x;
          enemy.y = waypoint.y;
          enemy.distanceTravelled += distance;
          remaining -= distance;
          enemy.waypointIndex += 1;
        } else {
          const ratio = remaining / distance;
          enemy.x += dx * ratio;
          enemy.y += dy * ratio;
          enemy.distanceTravelled += remaining;
          remaining = 0;
        }
      }
    }
  }

  private leakEnemy(enemy: EnemyState, definition: EnemyDefinition, events: TickEvents): void {
    enemy.alive = false;
    this.lives -= definition.leakDamage;
    events.leaks.push({
      enemyId: enemy.id,
      enemyType: enemy.type,
      damage: definition.leakDamage,
    });

    if (this.lives <= 0) {
      this.lives = 0;
      this.phase = "lost";
    }
  }

  private updateTowers(dt: number, events: TickEvents): void {
    for (const tower of this.towers.values()) {
      tower.cooldown = Math.max(0, tower.cooldown - dt);
      if (tower.cooldown > EPSILON) {
        continue;
      }

      const stats = getTowerStats(tower);
      const target = this.findTarget(tower, stats);
      if (!target) {
        continue;
      }

      const projectile: ProjectileState = {
        id: this.nextProjectileId++,
        towerId: tower.id,
        targetId: target.id,
        x: tower.x,
        y: tower.y,
        damage: stats.damage,
        speed: stats.projectileSpeed,
        splashRadius: stats.splashRadius,
        alive: true,
      };

      this.projectiles.set(projectile.id, projectile);
      tower.cooldown = 1 / stats.fireRate;
      events.shots.push({
        towerId: tower.id,
        projectileId: projectile.id,
        targetId: target.id,
      });
    }
  }

  private findTarget(tower: TowerState, stats: TowerStats): EnemyState | null {
    const inRange = [...this.enemies.values()].filter((enemy) => {
      return enemy.alive && distanceSquared(tower, enemy) <= stats.range * stats.range;
    });

    if (inRange.length === 0) {
      return null;
    }

    inRange.sort((a, b) => {
      if (tower.targetMode === "last") {
        return a.distanceTravelled - b.distanceTravelled || a.id - b.id;
      }

      if (tower.targetMode === "strong") {
        return b.health - a.health || b.distanceTravelled - a.distanceTravelled || a.id - b.id;
      }

      return b.distanceTravelled - a.distanceTravelled || a.id - b.id;
    });

    return inRange[0];
  }

  private updateProjectiles(dt: number, events: TickEvents): void {
    for (const projectile of this.projectiles.values()) {
      if (!projectile.alive) {
        continue;
      }

      const target = this.enemies.get(projectile.targetId);
      if (!target || !target.alive) {
        projectile.alive = false;
        continue;
      }

      const dx = target.x - projectile.x;
      const dy = target.y - projectile.y;
      const distance = Math.hypot(dx, dy);
      const travel = projectile.speed * dt;

      if (distance <= travel + EPSILON) {
        projectile.x = target.x;
        projectile.y = target.y;
        projectile.alive = false;
        this.applyProjectileHit(projectile, target, events);
      } else {
        const ratio = travel / distance;
        projectile.x += dx * ratio;
        projectile.y += dy * ratio;
      }
    }
  }

  private applyProjectileHit(projectile: ProjectileState, target: EnemyState, events: TickEvents): void {
    if (projectile.splashRadius > 0) {
      const radiusSquared = projectile.splashRadius * projectile.splashRadius;
      for (const enemy of this.enemies.values()) {
        if (enemy.alive && distanceSquared(projectile, enemy) <= radiusSquared) {
          this.damageEnemy(enemy, projectile.damage, events);
        }
      }
      return;
    }

    this.damageEnemy(target, projectile.damage, events);
  }

  private damageEnemy(enemy: EnemyState, rawDamage: number, events: TickEvents): void {
    const definition = ENEMY_DEFINITIONS[enemy.type];
    const damage = Math.max(1, rawDamage - definition.armor);
    enemy.health -= damage;

    if (enemy.health <= 0 && enemy.alive) {
      enemy.alive = false;
      this.cash += definition.cashReward;
      events.pops.push({
        enemyId: enemy.id,
        enemyType: enemy.type,
        cashReward: definition.cashReward,
        x: enemy.x,
        y: enemy.y,
      });
    }
  }

  private cleanupDead(): void {
    for (const [id, enemy] of this.enemies) {
      if (!enemy.alive) {
        this.enemies.delete(id);
      }
    }

    for (const [id, projectile] of this.projectiles) {
      if (!projectile.alive) {
        this.projectiles.delete(id);
      }
    }
  }

  private completeWaveIfReady(events: TickEvents): void {
    if (!this.activeWave || this.phase === "lost") {
      return;
    }

    const allSpawned = this.activeWave.nextSpawnIndex >= this.activeWave.spawns.length;
    if (!allSpawned || this.enemies.size > 0) {
      return;
    }

    this.cash += this.activeWave.wave.cashBonus;
    this.waveIndex += 1;
    this.activeWave = null;
    events.waveCompleted = true;
    this.phase = this.waveIndex >= this.waves.length ? "won" : "ready";
  }
}

export function getTowerStats(tower: Pick<TowerState, "type" | "upgraded">): TowerStats {
  const definition: TowerDefinition = TOWER_DEFINITIONS[tower.type];
  return tower.upgraded
    ? { ...definition.upgraded }
    : {
        range: definition.range,
        fireRate: definition.fireRate,
        damage: definition.damage,
        projectileSpeed: definition.projectileSpeed,
        splashRadius: definition.splashRadius,
      };
}

function buildSpawnSchedule(wave: WaveDefinition): SpawnEntry[] {
  const spawns: SpawnEntry[] = [];
  let cursor = 0;

  for (const group of wave.groups) {
    for (let i = 0; i < group.count; i += 1) {
      spawns.push({
        enemy: group.enemy,
        at: cursor,
      });
      cursor += group.interval;
    }
    cursor += 1.25;
  }

  return spawns;
}

function cloneEnemy(enemy: EnemyState): EnemyState {
  return { ...enemy };
}

function distanceSquared(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}
