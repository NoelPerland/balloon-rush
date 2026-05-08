export type Point = {
  x: number;
  y: number;
};

export type BuildSpot = Point & {
  id: string;
};

export type MapDefinition = {
  id: string;
  name: string;
  width: number;
  height: number;
  path: Point[];
  buildSpots: BuildSpot[];
  baseHealth: number;
  startingCash: number;
};

export const MAIN_MAP: MapDefinition = {
  id: "riverbend",
  name: "Riverbend",
  width: 960,
  height: 540,
  baseHealth: 20,
  startingCash: 650,
  path: [
    { x: -32, y: 278 },
    { x: 108, y: 278 },
    { x: 108, y: 132 },
    { x: 292, y: 132 },
    { x: 292, y: 404 },
    { x: 520, y: 404 },
    { x: 520, y: 214 },
    { x: 756, y: 214 },
    { x: 756, y: 346 },
    { x: 992, y: 346 },
  ],
  buildSpots: [
    { id: "a", x: 176, y: 220 },
    { id: "b", x: 212, y: 62 },
    { id: "c", x: 376, y: 238 },
    { id: "d", x: 388, y: 472 },
    { id: "e", x: 610, y: 330 },
    { id: "f", x: 620, y: 140 },
    { id: "g", x: 834, y: 280 },
    { id: "h", x: 842, y: 430 },
  ],
};
