export type TowerTypeId = "dart" | "cannon" | "super";

export type TowerTargetMode = "first" | "last" | "strong";

export type TowerStats = {
  range: number;
  fireRate: number;
  damage: number;
  projectileSpeed: number;
  splashRadius: number;
};

export type TowerDefinition = TowerStats & {
  id: TowerTypeId;
  name: string;
  cost: number;
  upgradeCost: number;
  upgraded: TowerStats;
  defaultTargetMode: TowerTargetMode;
};

export const TOWER_DEFINITIONS: Record<TowerTypeId, TowerDefinition> = {
  dart: {
    id: "dart",
    name: "Dart Tower",
    cost: 120,
    upgradeCost: 140,
    range: 138,
    fireRate: 1.35,
    damage: 18,
    projectileSpeed: 430,
    splashRadius: 0,
    defaultTargetMode: "first",
    upgraded: {
      range: 162,
      fireRate: 1.75,
      damage: 30,
      projectileSpeed: 510,
      splashRadius: 0,
    },
  },
  cannon: {
    id: "cannon",
    name: "Cannon",
    cost: 230,
    upgradeCost: 250,
    range: 122,
    fireRate: 0.58,
    damage: 44,
    projectileSpeed: 300,
    splashRadius: 54,
    defaultTargetMode: "strong",
    upgraded: {
      range: 138,
      fireRate: 0.72,
      damage: 72,
      projectileSpeed: 340,
      splashRadius: 72,
    },
  },
  super: {
    id: "super",
    name: "Super Tower",
    cost: 520,
    upgradeCost: 610,
    range: 176,
    fireRate: 2.6,
    damage: 24,
    projectileSpeed: 620,
    splashRadius: 0,
    defaultTargetMode: "first",
    upgraded: {
      range: 210,
      fireRate: 3.4,
      damage: 38,
      projectileSpeed: 720,
      splashRadius: 0,
    },
  },
};
