import * as THREE from 'three';
import { yearToX } from '../data/timeline';
import { computeEventLayouts } from './layout';

export type ShipKind =
  | 'star-destroyer'
  | 'tie-fighter'
  | 'x-wing'
  | 'millennium-falcon'
  | 'venator'
  | 'y-wing';

export interface FleetShip {
  group: THREE.Group;
  x: number;
  xMin: number;
  xMax: number;
  direction: 1 | -1;
  speed: number;
  y: number;
  z: number;
  engineGlow: THREE.Mesh[];
}

const SHIP_KINDS: ShipKind[] = [
  'star-destroyer',
  'tie-fighter',
  'x-wing',
  'millennium-falcon',
  'venator',
  'y-wing',
];

const FLEET_COUNT = 22;

/** Fixed flight lanes near the timeline ribbon — each ship gets a unique (y, z) pair */
const SHIP_LANES: ReadonlyArray<{ y: number; z: number }> = buildShipLanes(FLEET_COUNT);

function buildShipLanes(count: number): { y: number; z: number }[] {
  const zSlots = 11;
  const tiers = Math.ceil(count / zSlots);
  const zMin = -3.2;
  const zMax = 3.2;
  const yBase = 1.55;
  const yStep = 0.55;
  const lanes: { y: number; z: number }[] = [];

  for (let tier = 0; tier < tiers && lanes.length < count; tier++) {
    for (let zi = 0; zi < zSlots && lanes.length < count; zi++) {
      lanes.push({
        y: yBase + tier * yStep,
        z: zMin + (zi / (zSlots - 1)) * (zMax - zMin),
      });
    }
  }
  return lanes;
}

function getTimelineXBounds(): { min: number; max: number } {
  const layouts = computeEventLayouts();
  let min = Infinity;
  let max = -Infinity;
  for (const layout of layouts.values()) {
    min = Math.min(min, layout.x);
    max = Math.max(max, layout.x);
  }
  if (!isFinite(min)) {
    return { min: yearToX(-100), max: yearToX(34) };
  }
  return { min, max };
}

function hullMaterial(color: number, emissive = 0x0a1018): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.35,
    metalness: 0.75,
    roughness: 0.35,
  });
}

function engineGlow(color: number): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 8, 8),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
  );
}

/** Imperial-class Star Destroyer — wedge silhouette */
export function createStarDestroyer(): THREE.Group {
  const g = new THREE.Group();
  const mat = hullMaterial(0x8a9aaa, 0x141c28);
  const dark = hullMaterial(0x5a6670, 0x0a0e14);

  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 0.62), mat);
  g.add(hull);

  const bow = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.35), mat);
  bow.position.set(0.95, 0, 0);
  g.add(bow);

  const port = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.18), dark);
  port.position.set(-0.15, 0, 0.38);
  port.rotation.y = 0.25;
  g.add(port);

  const starboard = port.clone();
  starboard.position.z = -0.38;
  starboard.rotation.y = -0.25;
  g.add(starboard);

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.18), dark);
  bridge.position.set(-0.55, 0.14, 0);
  g.add(bridge);

  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.1), mat);
  tower.position.set(-0.55, 0.28, 0);
  g.add(tower);

  const superstructure = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.4), dark);
  superstructure.position.set(-0.2, 0.08, 0);
  g.add(superstructure);

  const glow = engineGlow(0x4488ff);
  glow.position.set(-0.82, 0, 0);
  glow.scale.setScalar(1.5);
  g.add(glow);

  g.userData.engineGlow = [glow];
  return g;
}

/** Y rotation so model nose (+X) points along travel direction on the timeline */
function yawForDirection(direction: 1 | -1): number {
  return direction === 1 ? 0 : Math.PI;
}

/** TIE Fighter — ball cockpit + hex wings */
export function createTieFighter(): THREE.Group {
  const g = new THREE.Group();
  const frameMat = hullMaterial(0x333338, 0x080808);
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a22,
    emissive: 0x220808,
    emissiveIntensity: 0.5,
    metalness: 0.6,
    roughness: 0.5,
  });

  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), frameMat);
  g.add(cockpit);

  const wingGeo = new THREE.BoxGeometry(0.38, 0.02, 0.38);
  const portWing = new THREE.Mesh(wingGeo, wingMat);
  portWing.position.set(0, 0, 0.22);
  g.add(portWing);

  const starWing = portWing.clone();
  starWing.position.z = -0.22;
  g.add(starWing);

  const strutP = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.2), frameMat);
  strutP.position.set(0, 0, 0.11);
  g.add(strutP);

  const strutS = strutP.clone();
  strutS.position.z = -0.11;
  g.add(strutS);

  const glow = engineGlow(0xff2222);
  glow.position.set(-0.12, 0, 0);
  g.add(glow);

  g.userData.engineGlow = [glow];
  return g;
}

/** TIE Fighter — ball cockpit + hex wings */
export function createXWing(): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = hullMaterial(0xb8c0c8, 0x182028);
  const wingMat = hullMaterial(0xd0d8e0, 0x1a2830);
  const redMat = hullMaterial(0xcc2222, 0x280808);

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.12), bodyMat);
  g.add(body);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 8), bodyMat);
  nose.rotation.z = -Math.PI / 2;
  nose.position.set(0.35, 0, 0);
  g.add(nose);

  const wingGeo = new THREE.BoxGeometry(0.28, 0.02, 0.14);
  const angles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
  for (const a of angles) {
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(-0.05 + Math.cos(a) * 0.18, 0, Math.sin(a) * 0.18);
    wing.rotation.y = a;
    g.add(wing);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.02), redMat);
    stripe.position.copy(wing.position);
    stripe.rotation.copy(wing.rotation);
    g.add(stripe);
  }

  const astromech = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), redMat);
  astromech.position.set(-0.12, 0.06, 0);
  g.add(astromech);

  const glowL = engineGlow(0xff6622);
  glowL.position.set(-0.3, 0.04, 0.08);
  const glowR = glowL.clone();
  glowR.position.set(-0.3, 0.04, -0.08);
  g.add(glowL, glowR);

  g.userData.engineGlow = [glowL, glowR];
  return g;
}

/** Millennium Falcon — saucer + cockpit */
export function createMillenniumFalcon(): THREE.Group {
  const g = new THREE.Group();
  const mat = hullMaterial(0x9a8a70, 0x1a1810);
  const dark = hullMaterial(0x5a5048, 0x0c0a08);

  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.1, 14), mat);
  dish.rotation.x = Math.PI / 2;
  g.add(dish);

  const mandibleL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.08), dark);
  mandibleL.position.set(0.28, -0.02, 0.12);
  g.add(mandibleL);

  const mandibleR = mandibleL.clone();
  mandibleR.position.z = -0.12;
  g.add(mandibleR);

  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), dark);
  cockpit.position.set(0.15, 0.06, 0);
  g.add(cockpit);

  const portEngine = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 10), dark);
  portEngine.rotation.x = Math.PI / 2;
  portEngine.position.set(-0.28, 0, 0.18);
  g.add(portEngine);

  const starEngine = portEngine.clone();
  starEngine.position.z = -0.18;
  g.add(starEngine);

  const glowL = engineGlow(0x44aaff);
  glowL.position.set(-0.36, 0, 0.18);
  const glowR = glowL.clone();
  glowR.position.z = -0.18;
  g.add(glowL, glowR);

  g.userData.engineGlow = [glowL, glowR];
  return g;
}

/** Venator-class Star Destroyer — Republic wedge */
export function createVenator(): THREE.Group {
  const g = new THREE.Group();
  const mat = hullMaterial(0x9aa0a8, 0x181c22);
  const red = hullMaterial(0xcc3333, 0x280808);
  const dark = hullMaterial(0x6a7078, 0x101418);

  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.13, 0.58), mat);
  g.add(hull);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.04, 0.6), red);
  stripe.position.y = 0.04;
  g.add(stripe);

  const bridgePort = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.12), mat);
  bridgePort.position.set(-0.45, 0.14, 0.14);
  g.add(bridgePort);

  const bridgeStar = bridgePort.clone();
  bridgeStar.position.z = -0.14;
  g.add(bridgeStar);

  const hangar = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.2), dark);
  hangar.position.set(0.35, -0.02, 0);
  g.add(hangar);

  const glow = engineGlow(0x66aaff);
  glow.position.set(-0.75, 0, 0);
  glow.scale.setScalar(1.4);
  g.add(glow);

  g.userData.engineGlow = [glow];
  return g;
}

/** Y-Wing — twin engined bomber */
export function createYWing(): THREE.Group {
  const g = new THREE.Group();
  const mat = hullMaterial(0xa8a090, 0x181410);

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.1), mat);
  g.add(body);

  const nacelleGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.35, 8);
  const portN = new THREE.Mesh(nacelleGeo, mat);
  portN.rotation.x = Math.PI / 2;
  portN.position.set(-0.1, 0, 0.2);
  g.add(portN);

  const starN = portN.clone();
  starN.position.z = -0.2;
  g.add(starN);

  const ionCannon = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), mat);
  ionCannon.position.set(0.2, -0.04, 0);
  g.add(ionCannon);

  const glowL = engineGlow(0xff8844);
  glowL.position.set(-0.3, 0, 0.2);
  const glowR = glowL.clone();
  glowR.position.z = -0.2;
  g.add(glowL, glowR);

  g.userData.engineGlow = [glowL, glowR];
  return g;
}

const BUILDERS: Record<ShipKind, () => THREE.Group> = {
  'star-destroyer': createStarDestroyer,
  'tie-fighter': createTieFighter,
  'x-wing': createXWing,
  'millennium-falcon': createMillenniumFalcon,
  venator: createVenator,
  'y-wing': createYWing,
};

function buildShip(kind: ShipKind): THREE.Group {
  const model = BUILDERS[kind]();
  const scale = kind === 'star-destroyer' || kind === 'venator' ? 0.55 : 0.7;
  model.scale.setScalar(scale);

  const wrapper = new THREE.Group();
  wrapper.add(model);
  wrapper.userData.engineGlow = model.userData.engineGlow;
  return wrapper;
}

function isCapitalShip(kind: ShipKind): boolean {
  return kind === 'star-destroyer' || kind === 'venator' || kind === 'millennium-falcon';
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createRandomShip(index: number, total: number, xBounds: { min: number; max: number }): FleetShip {
  const kind = SHIP_KINDS[Math.floor(Math.random() * SHIP_KINDS.length)]!;
  const group = buildShip(kind);
  const engineGlow = (group.userData.engineGlow as THREE.Mesh[]) ?? [];

  const span = xBounds.max - xBounds.min;
  const binWidth = span / total;
  const binStart = xBounds.min + index * binWidth;

  const segmentLen = randomInRange(binWidth * 0.5, binWidth * 1.05);
  const xMin = Math.max(xBounds.min, binStart + randomInRange(0, binWidth - segmentLen));
  const xMax = Math.min(xBounds.max, xMin + segmentLen);
  const direction: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
  const x =
    direction === 1
      ? randomInRange(xMin, xMin + segmentLen * 0.25)
      : randomInRange(xMax - segmentLen * 0.25, xMax);

  const lane = SHIP_LANES[index] ?? SHIP_LANES[0]!;
  const y = lane.y;
  const z = lane.z;
  const speed = isCapitalShip(kind) ? randomInRange(2.2, 5) : randomInRange(5.5, 11);

  group.position.set(x, y, z);
  group.rotation.set(0, yawForDirection(direction), 0);

  return { group, x, xMin, xMax, direction, speed, y, z, engineGlow };
}

export function createFleet(): FleetShip[] {
  const xBounds = getTimelineXBounds();
  return Array.from({ length: FLEET_COUNT }, (_, i) =>
    createRandomShip(i, FLEET_COUNT, xBounds)
  );
}

export function animateFleet(ships: FleetShip[], time: number, delta: number): void {
  for (const ship of ships) {
    ship.x += ship.speed * ship.direction * delta;

    if (ship.x >= ship.xMax) {
      ship.x = ship.xMax;
      ship.direction = -1;
    } else if (ship.x <= ship.xMin) {
      ship.x = ship.xMin;
      ship.direction = 1;
    }

    ship.group.position.set(ship.x, ship.y, ship.z);
    ship.group.rotation.set(0, yawForDirection(ship.direction), 0);

    const pulse = 0.65 + Math.sin(time * 8 + ship.x * 2) * 0.35;
    for (const glow of ship.engineGlow) {
      (glow.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  }
}
