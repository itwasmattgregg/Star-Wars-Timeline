import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import {
  TIMELINE_EVENTS,
  yearToX,
  formatYear,
  ERA_CONFIG,
  type TimelineEvent,
  type MediaType,
  type Era,
} from '../data/timeline';
import {
  createStarfield,
  createNebula,
  createTimelineRibbon,
  createEraZones,
  createGridLines,
} from './Starfield';
import {
  createAllTimelineNodes,
  animateNode,
  getZoomNodeScale,
  type NodeHandle,
} from './TimelineNode';
import { computeEventLayouts } from './layout';
import { createFleet, animateFleet, type FleetShip } from './Fleet';

export type SceneEventCallback = (event: TimelineEvent | null) => void;
export type YearChangeCallback = (year: number, era: string) => void;

export class TimelineScene {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private composer: EffectComposer;
  private labelRenderer: CSS2DRenderer;
  private nodes: NodeHandle[] = [];
  private fleet: FleetShip[] = [];
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private hoveredNode: NodeHandle | null = null;
  private selectedNode: NodeHandle | null = null;
  private clock = new THREE.Clock();
  private animationId = 0;
  private activeTypes = new Set<MediaType>([
    'film',
    'series',
    'game',
    'lore',
    'comic',
    'book',
  ]);

  private flyActive = false;
  private flyIndex = 0;
  private flyProgress = 0;
  private flySpeed = 0.35;
  /** Auto-fly steps toward older events (−1) */
  private flyStep = -1;

  private cameraTarget = new THREE.Vector3();
  private cameraAnimating = false;
  private cameraStart = new THREE.Vector3();
  private cameraEnd = new THREE.Vector3();
  private lookStart = new THREE.Vector3();
  private lookEnd = new THREE.Vector3();
  private animT = 0;

  private strafing = false;
  private strafePointerId = -1;
  private lastStrafeX = 0;
  private lastStrafeY = 0;
  private panRight = new THREE.Vector3();
  private panUp = new THREE.Vector3();
  private panOffset = new THREE.Vector3();

  onSelect: SceneEventCallback = () => {};
  onHover: SceneEventCallback = () => {};
  onYearChange: YearChangeCallback = () => {};
  onFlyActiveChange: (active: boolean) => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050510, 0.008);

    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );

    const defaultView = this.getEraCameraView('empire', 1.45);
    this.camera.position.copy(defaultView.position);
    this.cameraTarget.copy(defaultView.target);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 1.8;
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 80;
    this.controls.target.copy(this.cameraTarget);

    // Lighting
    const ambient = new THREE.AmbientLight(0x223355, 0.6);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    keyLight.position.set(20, 30, 20);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x4488ff, 0.5);
    rimLight.position.set(-30, 10, -20);
    this.scene.add(rimLight);

    // Scene elements
    this.scene.add(createStarfield());
    this.scene.add(createNebula());
    this.scene.add(createTimelineRibbon());
    this.scene.add(createEraZones());
    this.scene.add(createGridLines());

    // Event nodes (spread for same-year clusters)
    this.nodes = createAllTimelineNodes();
    for (const node of this.nodes) {
      this.scene.add(node.group);
    }

    // Patrolling fleet along the timeline
    this.fleet = createFleet();
    for (const ship of this.fleet) {
      this.scene.add(ship.group);
    }

    // Post-processing bloom
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.8,
      0.4,
      0.85
    );
    this.composer.addPass(bloom);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.left = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    document.getElementById('app')!.appendChild(this.labelRenderer.domElement);

    this.bindEvents();
    this.animate();
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.onResize);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('click', this.onClick);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('contextmenu', (e) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    });
    this.canvas.style.cursor = 'grab';
  }

  private isStrafeModifier(e: { ctrlKey: boolean; metaKey: boolean }): boolean {
    return e.ctrlKey || e.metaKey;
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0 || !this.isStrafeModifier(e)) return;
    this.strafing = true;
    this.strafePointerId = e.pointerId;
    this.lastStrafeX = e.clientX;
    this.lastStrafeY = e.clientY;
    this.controls.enabled = false;
    this.canvas.style.cursor = 'move';
    this.canvas.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.strafing || e.pointerId !== this.strafePointerId) return;

    const dx = e.clientX - this.lastStrafeX;
    const dy = e.clientY - this.lastStrafeY;
    this.lastStrafeX = e.clientX;
    this.lastStrafeY = e.clientY;

    const distance = this.camera.position.distanceTo(this.controls.target);
    const panSpeed = distance * 0.0012;

    this.panRight.setFromMatrixColumn(this.camera.matrix, 0);
    this.panUp.setFromMatrixColumn(this.camera.matrix, 1);
    this.panOffset
      .copy(this.panRight)
      .multiplyScalar(-dx * panSpeed)
      .addScaledVector(this.panUp, dy * panSpeed);

    this.camera.position.add(this.panOffset);
    this.controls.target.add(this.panOffset);
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (!this.strafing || e.pointerId !== this.strafePointerId) return;
    this.strafing = false;
    this.strafePointerId = -1;
    this.controls.enabled = !this.flyActive && !this.cameraAnimating;
    this.canvas.style.cursor = 'grab';
    try {
      this.canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  private updateOrbitEnabled(): void {
    this.controls.enabled = !this.flyActive && !this.cameraAnimating && !this.strafing;
  }

  private onResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
  };

  private onMouseMove = (e: MouseEvent): void => {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    if (this.flyActive || this.strafing) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.nodes
      .filter((n) => this.activeTypes.has(n.event.type))
      .map((n) => n.mesh);
    const hits = this.raycaster.intersectObjects(meshes);

    if (hits.length > 0) {
      const id = hits[0].object.userData.eventId as string;
      const node = this.nodes.find((n) => n.event.id === id) ?? null;
      if (node !== this.hoveredNode) {
        this.hoveredNode = node;
        this.onHover(node?.event ?? null);
        this.canvas.style.cursor = 'pointer';
      }
    } else if (this.hoveredNode) {
      this.hoveredNode = null;
      this.onHover(null);
      this.canvas.style.cursor = 'grab';
    }
  };

  private onClick = (): void => {
    if (this.strafing) return;
    if (this.hoveredNode) {
      this.selectNode(this.hoveredNode);
    }
  };

  selectNode(node: NodeHandle): void {
    this.selectedNode = node;
    this.syncFlyIndexToSelected();
    this.onSelect(node.event);
    this.flyToNode(node);
  }

  private syncFlyIndexToSelected(): void {
    if (!this.selectedNode) return;
    const visible = this.getVisibleSorted();
    const idx = visible.indexOf(this.selectedNode);
    if (idx >= 0) this.flyIndex = idx;
  }

  private currentNavIndex(visible: NodeHandle[]): number {
    if (this.selectedNode) {
      const idx = visible.indexOf(this.selectedNode);
      if (idx >= 0) return idx;
    }
    return this.flyIndex;
  }

  private setFlyActive(active: boolean): void {
    this.flyActive = active;
    this.onFlyActiveChange(active);
  }

  selectById(id: string): void {
    const node = this.nodes.find((n) => n.event.id === id);
    if (node) this.selectNode(node);
  }

  flyToNode(node: NodeHandle): void {
    const pos = node.group.position;
    const zoom = this.flyActive ? 5.5 : 7;
    this.cameraEnd.set(pos.x + 1.5, pos.y + 0.8, pos.z + zoom);
    this.lookEnd.copy(pos);
    this.cameraStart.copy(this.camera.position);
    this.lookStart.copy(this.controls.target);
    this.animT = 0;
    this.cameraAnimating = true;
    this.controls.enabled = false;
  }

  setTypeFilter(types: Set<MediaType>): void {
    this.activeTypes = types;
    for (const node of this.nodes) {
      const visible = types.has(node.event.type);
      node.group.visible = visible;
    }
  }

  toggleFly(): void {
    if (this.flyActive) {
      this.setFlyActive(false);
      this.controls.enabled = true;
      return;
    }

    const visible = this.getVisibleSorted();
    if (visible.length === 0) return;

    this.setFlyActive(true);
    this.controls.enabled = false;
    this.flyStep = -1;
    this.flyProgress = 0;
    // Start at the latest year and fly back through time
    this.flyIndex = visible.length - 1;
    this.selectNode(visible[this.flyIndex]!);
  }

  flyNext(): void {
    const visible = this.getVisibleSorted();
    if (visible.length === 0) return;
    const current = this.currentNavIndex(visible);
    this.flyIndex = Math.min(current + 1, visible.length - 1);
    this.selectNode(visible[this.flyIndex]!);
  }

  flyPrev(): void {
    const visible = this.getVisibleSorted();
    if (visible.length === 0) return;
    const current = this.currentNavIndex(visible);
    this.flyIndex = Math.max(current - 1, 0);
    this.selectNode(visible[this.flyIndex]!);
  }

  resetCamera(): void {
    this.setFlyActive(false);
    this.controls.enabled = true;
    const view = this.getEraCameraView('empire', 1.45);
    this.cameraEnd.copy(view.position);
    this.lookEnd.copy(view.target);
    this.cameraStart.copy(this.camera.position);
    this.lookStart.copy(this.controls.target);
    this.animT = 0;
    this.cameraAnimating = true;
    this.selectedNode = null;
    this.onSelect(null);
  }

  focusEra(era: Era): void {
    const view = this.getEraCameraView(era, 1);

    this.setFlyActive(false);
    this.selectedNode = null;
    this.onSelect(null);
    this.cameraEnd.copy(view.position);
    this.lookEnd.copy(view.target);
    this.cameraStart.copy(this.camera.position);
    this.lookStart.copy(this.controls.target);
    this.animT = 0;
    this.cameraAnimating = true;
    this.controls.enabled = false;
  }

  private getEraCameraView(
    era: Era,
    zoomOut = 1
  ): { position: THREE.Vector3; target: THREE.Vector3 } {
    const config = ERA_CONFIG[era];
    const layouts = computeEventLayouts();
    const eraEvents = TIMELINE_EVENTS.filter(
      (e) => e.year >= config.start && e.year <= config.end
    );

    let minX = Infinity;
    let maxX = -Infinity;
    for (const event of eraEvents) {
      const layout = layouts.get(event.id);
      if (!layout) continue;
      minX = Math.min(minX, layout.x);
      maxX = Math.max(maxX, layout.x);
    }

    if (!isFinite(minX)) {
      minX = yearToX(config.start);
      maxX = yearToX(config.end);
    }

    const centerX = (minX + maxX) / 2;
    const spread = Math.max(maxX - minX, 4);
    const camDist = Math.max(10, Math.min(spread * 0.55 + 8, 28)) * zoomOut;

    return {
      position: new THREE.Vector3(centerX + spread * 0.05, 4 + zoomOut * 1.5, camDist),
      target: new THREE.Vector3(centerX, 0, 0),
    };
  }

  private getVisibleSorted(): NodeHandle[] {
    return this.nodes
      .filter((n) => this.activeTypes.has(n.event.type))
      .sort(
        (a, b) =>
          a.layout.x - b.layout.x ||
          a.layout.y - b.layout.y ||
          a.event.year - b.event.year ||
          a.event.title.localeCompare(b.event.title)
      );
  }

  getCurrentYear(): number {
    const targetX = this.controls.target.x;
    // Approximate inverse — scan nearby
    let bestYear = 0;
    let bestDist = Infinity;
    for (let y = -36000; y <= 40; y += y > -1000 ? 1 : 100) {
      const x = yearToX(y);
      const d = Math.abs(x - targetX);
      if (d < bestDist) {
        bestDist = d;
        bestYear = y;
      }
    }
    return bestYear;
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    const time = this.clock.getElapsedTime();
    const delta = this.clock.getDelta();

    // Camera animation
    if (this.cameraAnimating) {
      this.animT += 0.025;
      const ease = 1 - Math.pow(1 - Math.min(this.animT, 1), 3);
      this.camera.position.lerpVectors(this.cameraStart, this.cameraEnd, ease);
      this.controls.target.lerpVectors(this.lookStart, this.lookEnd, ease);
      if (this.animT >= 1) {
        this.cameraAnimating = false;
        this.updateOrbitEnabled();
      }
    }

    // Auto-fly: newest → oldest, like a ship diving back through time
    if (this.flyActive && !this.cameraAnimating) {
      this.flyProgress += this.flySpeed * delta;
      if (this.flyProgress >= 1) {
        this.flyProgress = 0;
        const visible = this.getVisibleSorted();
        if (visible.length === 0) {
          this.setFlyActive(false);
          this.controls.enabled = true;
          return;
        }

        const nextIndex = this.flyIndex + this.flyStep;
        if (nextIndex < 0) {
          this.setFlyActive(false);
          this.controls.enabled = true;
          return;
        }

        this.flyIndex = nextIndex;
        this.selectNode(visible[this.flyIndex]!);
      }
    }

    // Animate nodes — shrink when zoomed in close
    const camDist = this.camera.position.distanceTo(this.controls.target);
    const zoomScale = getZoomNodeScale(camDist);

    for (const node of this.nodes) {
      if (!this.activeTypes.has(node.event.type)) continue;
      const hovered = node === this.hoveredNode;
      const selected = node === this.selectedNode;
      animateNode(node, time, hovered, selected, zoomScale, camDist);
    }

    animateFleet(this.fleet, time, delta);

    // Starfield subtle rotation
    const stars = this.scene.children.find(
      (child): child is THREE.Points => child instanceof THREE.Points
    );
    if (stars) stars.rotation.y = time * 0.002;

    this.controls.update();

    const year = this.selectedNode?.event.year ?? this.getCurrentYear();
    const era = this.getEraForYear(year);
    this.onYearChange(year, era);

    this.composer.render();
    this.labelRenderer.render(this.scene, this.camera);
  };

  private getEraForYear(year: number): string {
    for (const [, config] of Object.entries(ERA_CONFIG)) {
      if (year >= config.start && year <= config.end) return config.label;
    }
    return 'Unknown Era';
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}

export { formatYear };
