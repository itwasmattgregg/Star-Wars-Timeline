import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { TimelineEvent } from '../data/timeline';
import { TIMELINE_EVENTS } from '../data/timeline';
import {
  computeEventLayouts,
  getZoomNodeScale,
  type EventLayout,
} from './layout';

export interface NodeHandle {
  group: THREE.Group;
  mesh: THREE.Mesh;
  glow: THREE.Mesh;
  ring: THREE.Mesh;
  label: CSS2DObject;
  labelEl: HTMLDivElement;
  event: TimelineEvent;
  baseY: number;
  baseSize: number;
  layout: EventLayout;
}

function baseSizeForType(type: TimelineEvent['type']): number {
  if (type === 'film') return 0.55;
  if (type === 'lore') return 0.35;
  return 0.45;
}

function createNodeLabel(event: TimelineEvent, baseSize: number): CSS2DObject {
  const el = document.createElement('div');
  el.className = 'node-label';
  el.textContent = event.title;
  el.style.setProperty('--label-color', event.color);

  const label = new CSS2DObject(el);
  label.position.set(0, baseSize + 0.75, 0);
  label.center.set(0.5, 1);
  return label;
}

export function createTimelineNode(
  event: TimelineEvent,
  layout: EventLayout
): NodeHandle {
  const { x, y, z } = layout;
  const baseSize = baseSizeForType(event.type);

  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.userData = { eventId: event.id };

  const color = new THREE.Color(event.color);

  const geo = new THREE.IcosahedronGeometry(baseSize, 2);
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.6,
    metalness: 0.4,
    roughness: 0.3,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData = { eventId: event.id, isNode: true };
  group.add(mesh);

  const glowGeo = new THREE.SphereGeometry(baseSize * 1.8, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    side: THREE.BackSide,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  group.add(glow);

  let ring: THREE.Mesh;
  if (event.type === 'film') {
    const ringGeo = new THREE.TorusGeometry(baseSize * 1.6, 0.03, 8, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.7,
    });
    ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  } else {
    ring = new THREE.Mesh();
  }

  const label = createNodeLabel(event, baseSize);
  const labelEl = label.element as HTMLDivElement;
  group.add(label);

  return { group, mesh, glow, ring, label, labelEl, event, baseY: y, baseSize, layout };
}

export function createAllTimelineNodes(): NodeHandle[] {
  const layouts = computeEventLayouts();
  return TIMELINE_EVENTS.map((event) => {
    const layout = layouts.get(event.id)!;
    return createTimelineNode(event, layout);
  });
}

export function animateNode(
  handle: NodeHandle,
  time: number,
  hovered: boolean,
  selected: boolean,
  zoomScale: number,
  camDist: number
): void {
  const pulse = 1 + Math.sin(time * 2 + handle.group.position.x) * 0.06;
  const interactionScale = hovered ? 1.4 : selected ? 1.25 : pulse;
  const finalScale = interactionScale * zoomScale;

  handle.mesh.scale.lerp(
    new THREE.Vector3(finalScale, finalScale, finalScale),
    0.12
  );
  handle.glow.scale.lerp(
    new THREE.Vector3(finalScale, finalScale, finalScale),
    0.12
  );
  if (handle.ring.geometry.type === 'TorusGeometry') {
    handle.ring.scale.lerp(
      new THREE.Vector3(finalScale, finalScale, finalScale),
      0.12
    );
  }

  const glowOpacity = hovered ? 0.35 : selected ? 0.28 : 0.12;
  (handle.glow.material as THREE.MeshBasicMaterial).opacity +=
    (glowOpacity - (handle.glow.material as THREE.MeshBasicMaterial).opacity) * 0.12;

  handle.mesh.rotation.y += 0.008;
  handle.mesh.rotation.x = Math.sin(time * 0.5 + handle.group.position.x) * 0.15;

  if (handle.ring.geometry.type === 'TorusGeometry') {
    handle.ring.rotation.z += 0.015;
  }

  handle.group.position.y =
    handle.baseY + Math.sin(time * 1.2 + handle.group.position.x * 0.3) * 0.08;

  // Labels: hidden when zoomed out, fade in as camera moves closer
  const fadeStart = 10;
  const fadeEnd = 20;
  const zoomFade = THREE.MathUtils.clamp(
    1 - (camDist - fadeStart) / (fadeEnd - fadeStart),
    0,
    1
  );
  const labelOpacity = hovered || selected ? Math.max(zoomFade, 0.9) : zoomFade;

  handle.label.visible = labelOpacity > 0.02;
  handle.labelEl.style.opacity = String(labelOpacity);
  handle.labelEl.classList.toggle('node-label--hover', hovered);
  handle.labelEl.classList.toggle('node-label--selected', selected);

  const labelYOffset = handle.baseSize * finalScale + 0.55;
  handle.label.position.y += (labelYOffset - handle.label.position.y) * 0.15;
}

export { getZoomNodeScale };
