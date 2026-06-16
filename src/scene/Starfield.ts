import * as THREE from 'three';
import { ERA_CONFIG, TIMELINE_EVENTS, yearToX } from '../data/timeline';
import { computeEventLayouts, getTimelineLayoutBounds } from './layout';

export function createStarfield(count = 12000): THREE.Points {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const radius = 80 + Math.random() * 200;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.4;
    positions[i * 3 + 2] = radius * Math.cos(phi) - 40;

    const warmth = Math.random();
    colors[i * 3] = 0.6 + warmth * 0.4;
    colors[i * 3 + 1] = 0.7 + warmth * 0.2;
    colors[i * 3 + 2] = 0.9 + warmth * 0.1;
    sizes[i] = Math.random() * 2 + 0.5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    depthWrite: false,
  });

  return new THREE.Points(geo, mat);
}

export function createNebula(): THREE.Group {
  const group = new THREE.Group();

  const nebulaColors = [0x1a0a2e, 0x16213e, 0x0f3460, 0x2d1b69];
  for (let i = 0; i < 6; i++) {
    const geo = new THREE.SphereGeometry(15 + Math.random() * 20, 16, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: nebulaColors[i % nebulaColors.length],
      transparent: true,
      opacity: 0.04 + Math.random() * 0.03,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      -60 + Math.random() * 40,
      -10 + Math.random() * 20,
      -30 - Math.random() * 40
    );
    group.add(mesh);
  }

  return group;
}

function ribbonPoint(x: number): THREE.Vector3 {
  return new THREE.Vector3(
    x,
    Math.sin(x * 0.05) * 1.5,
    Math.cos(x * 0.03) * 2
  );
}

export function createTimelineRibbon(): THREE.Mesh {
  const { minX, maxX } = getTimelineLayoutBounds(3);
  const points: THREE.Vector3[] = [];
  const segments = 240;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = minX + t * (maxX - minX);
    points.push(ribbonPoint(x));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  const tubeGeo = new THREE.TubeGeometry(curve, 360, 0.08, 8, false);
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0x334466,
    emissive: 0x112244,
    emissiveIntensity: 0.5,
    metalness: 0.8,
    roughness: 0.4,
    transparent: true,
    opacity: 0.7,
  });

  return new THREE.Mesh(tubeGeo, tubeMat);
}

function getEraXBounds(
  start: number,
  end: number,
  layouts: ReturnType<typeof computeEventLayouts>,
  globalMin: number,
  globalMax: number
): { xStart: number; xEnd: number } {
  let xStart = yearToX(start);
  let xEnd = yearToX(end);

  for (const event of TIMELINE_EVENTS) {
    if (event.year < start || event.year > end) continue;
    const layout = layouts.get(event.id);
    if (!layout) continue;
    xStart = Math.min(xStart, layout.x);
    xEnd = Math.max(xEnd, layout.x);
  }

  // Clip to global timeline extent so adjacent eras meet without gaps
  xStart = Math.max(xStart, globalMin);
  xEnd = Math.min(xEnd, globalMax);

  return { xStart, xEnd };
}

export function createEraZones(): THREE.Group {
  const group = new THREE.Group();
  const layouts = computeEventLayouts();
  const { minX: globalMin, maxX: globalMax } = getTimelineLayoutBounds(3);

  const eraEntries = Object.entries(ERA_CONFIG).sort(
    (a, b) => a[1].start - b[1].start
  );

  for (let i = 0; i < eraEntries.length; i++) {
    const [, config] = eraEntries[i]!;
    let { xStart, xEnd } = getEraXBounds(
      config.start,
      config.end,
      layouts,
      globalMin,
      globalMax
    );

    if (config.start <= ERA_CONFIG.dawn.start) {
      xStart = globalMin;
    }
    if (config.end >= ERA_CONFIG['first-order'].end) {
      xEnd = globalMax;
    }

    const width = Math.max(Math.abs(xEnd - xStart), 0.5);
    const centerX = (xStart + xEnd) / 2;

    const geo = new THREE.PlaneGeometry(width, 18);
    const mat = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const plane = new THREE.Mesh(geo, mat);
    plane.position.set(centerX, 0, -2);
    plane.rotation.x = -Math.PI / 2 + 0.3;
    group.add(plane);

    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(xStart, -6, 0),
      new THREE.Vector3(xStart, 6, 0),
    ]);
    const lineMat = new THREE.LineBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: 0.15,
    });
    group.add(new THREE.Line(lineGeo, lineMat));
  }

  return group;
}

export function createGridLines(): THREE.Group {
  const group = new THREE.Group();
  const markerYears = [-25000, -5000, -1000, -500, -100, -32, -19, 0, 5, 34];

  for (const year of markerYears) {
    const x = yearToX(year);
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, -8, 0),
      new THREE.Vector3(x, 8, 0),
    ]);
    const mat = new THREE.LineBasicMaterial({
      color: 0x445566,
      transparent: true,
      opacity: 0.25,
    });
    group.add(new THREE.Line(geo, mat));
  }

  return group;
}
