export type EnemyTypeId = "scout" | "brute" | "shield";

export type EnemyDefinition = {
  id: EnemyTypeId;
  name: string;
  maxHealth: number;
  speed: number;
  armor: number;
  cashReward: number;
  leakDamage: number;
};

export const ENEMY_DEFINITIONS: Record<EnemyTypeId, EnemyDefinition> = {
  scout: {
    id: "scout",
    name: "Scout",
    maxHealth: 38,
    speed: 86,
    armor: 0,
    cashReward: 9,
    leakDamage: 1,
  },
  brute: {
    id: "brute",
    name: "Brute",
    maxHealth: 115,
    speed: 48,
    armor: 1,
    cashReward: 18,
    leakDamage: 2,
  },
  shield: {
    id: "shield",
    name: "Shield",
    maxHealth: 72,
    speed: 58,
    armor: 4,
    cashReward: 16,
    leakDamage: 1,
  },
};
