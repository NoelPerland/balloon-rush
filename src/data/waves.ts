import type { EnemyTypeId } from "./enemies";

export type WaveSpawn = {
  enemy: EnemyTypeId;
  count: number;
  interval: number;
};

export type WaveDefinition = {
  id: number;
  cashBonus: number;
  groups: WaveSpawn[];
};

export const WAVE_DEFINITIONS: WaveDefinition[] = [
  { id: 1, cashBonus: 60, groups: [{ enemy: "scout", count: 10, interval: 0.72 }] },
  { id: 2, cashBonus: 70, groups: [{ enemy: "scout", count: 16, interval: 0.62 }] },
  {
    id: 3,
    cashBonus: 80,
    groups: [
      { enemy: "scout", count: 12, interval: 0.48 },
      { enemy: "brute", count: 4, interval: 1.05 },
    ],
  },
  {
    id: 4,
    cashBonus: 90,
    groups: [
      { enemy: "shield", count: 8, interval: 0.8 },
      { enemy: "scout", count: 12, interval: 0.42 },
    ],
  },
  {
    id: 5,
    cashBonus: 100,
    groups: [
      { enemy: "brute", count: 10, interval: 0.88 },
      { enemy: "scout", count: 16, interval: 0.36 },
    ],
  },
  {
    id: 6,
    cashBonus: 115,
    groups: [
      { enemy: "shield", count: 14, interval: 0.58 },
      { enemy: "brute", count: 8, interval: 0.82 },
    ],
  },
  {
    id: 7,
    cashBonus: 125,
    groups: [
      { enemy: "scout", count: 30, interval: 0.28 },
      { enemy: "shield", count: 12, interval: 0.52 },
    ],
  },
  {
    id: 8,
    cashBonus: 140,
    groups: [
      { enemy: "brute", count: 18, interval: 0.64 },
      { enemy: "shield", count: 16, interval: 0.46 },
    ],
  },
  {
    id: 9,
    cashBonus: 160,
    groups: [
      { enemy: "shield", count: 24, interval: 0.38 },
      { enemy: "brute", count: 18, interval: 0.56 },
    ],
  },
  {
    id: 10,
    cashBonus: 250,
    groups: [
      { enemy: "brute", count: 28, interval: 0.42 },
      { enemy: "shield", count: 28, interval: 0.34 },
      { enemy: "scout", count: 40, interval: 0.18 },
    ],
  },
];
