import * as THREE from 'three';
import { SKINS, TRAILS, BACKGROUNDS, type Skin, type Trail, type Background } from './data';

export interface GameCallbacks {
  onScore: (score: number) => void;
  onCoins: (totalCoins: number, sessionDelta: number) => void;
  onGameOver: (score: number) => void;
  onPickup: () => void;
  onHaptic: (ms: number) => void;
}

export interface GameConfig {
  skinId: string;
  trailId: string;
  backgroundId: string;
}

const POOL_SIZE = 40;

export class GameEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private ambientLight: THREE.AmbientLight;
  private pointLight: THREE.PointLight;

  private playerMesh: THREE.Mesh | null = null;
  private playerSize = 0.5;
  private groundY = -0.5;

  private gridHelper: THREE.GridHelper;
  private pyramids: THREE.Mesh[] = [];
  private backgroundStars: THREE.Points | null = null;

  private obstacles: { mesh: THREE.Mesh; radius: number }[] = [];
  private items: { mesh: THREE.Mesh }[] = [];

  // Object pools - shared geometries/materials to avoid per-frame allocation
  private obstaclePool: THREE.Mesh[] = [];
  private itemPool: THREE.Mesh[] = [];
  private sharedObstacleGeoms: THREE.BufferGeometry[] = [];
  private sharedObstacleMat: THREE.MeshStandardMaterial;
  private sharedItemGeom: THREE.BufferGeometry;
  private sharedItemMat: THREE.MeshStandardMaterial;

  // Trail particle system (single Points object, no per-particle meshes)
  private trailPoints: THREE.Points | null = null;
  private trailPositions: Float32Array | null = null;
  private trailColors: Float32Array | null = null;
  private trailLives: number[] = [];
  private trailIndex = 0;
  private readonly trailMax = 60;

  private score = 0;
  private gameActive = false;
  private isPaused = false;
  private sessionDiamonds = 0;

  private playerSpeed = 0.55;
  private readonly initialSpeedZ = 0.55;
  private readonly maxPlayerSpeed = 1.6;

  private readonly laneWidth = 3.5;
  private currentLane = 0;
  private targetX = 0;

  private readonly gravity = -0.016;
  private velocityY = 0;
  private jumpCount = 0;
  private readonly maxJumps = 2;

  private readonly trackLength = 1000;
  private readonly numLanes = 3;

  private rafId = 0;
  private resizeHandler: () => void;
  private keydownHandler: (e: KeyboardEvent) => void;
  private touchStartHandler: (e: TouchEvent) => void;
  private touchEndHandler: (e: TouchEvent) => void;
  private touchStartX = 0;
  private touchStartY = 0;

  private config: GameConfig;
  private callbacks: GameCallbacks;

  constructor(container: HTMLElement, config: GameConfig, callbacks: GameCallbacks) {
    this.config = config;
    this.callbacks = callbacks;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x040108, 0.012);

    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 4.5, 7.5);
    this.camera.lookAt(0, 0, -5.0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    this.pointLight = new THREE.PointLight(0xff00ff, 4.0, 150);
    this.pointLight.position.set(0, 8, 4);
    this.scene.add(this.pointLight);

    // Shared geometries for obstacles (reused across pool)
    this.sharedObstacleGeoms = [
      new THREE.SphereGeometry(0.7, 16, 16),
      new THREE.OctahedronGeometry(0.8, 0),
      new THREE.TorusKnotGeometry(0.5, 0.15, 64, 8),
    ];
    this.sharedObstacleMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0x440011, roughness: 0.4 });

    this.sharedItemGeom = new THREE.OctahedronGeometry(0.35);
    this.sharedItemMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x003333, roughness: 0.1 });

    // Pre-allocate pools
    for (let i = 0; i < POOL_SIZE; i++) {
      const obsMesh = new THREE.Mesh(this.sharedObstacleGeoms[0], this.sharedObstacleMat);
      obsMesh.visible = false;
      this.scene.add(obsMesh);
      this.obstaclePool.push(obsMesh);
    }
    for (let i = 0; i < POOL_SIZE; i++) {
      const itemMesh = new THREE.Mesh(this.sharedItemGeom, this.sharedItemMat);
      itemMesh.visible = false;
      this.scene.add(itemMesh);
      this.itemPool.push(itemMesh);
    }

    // Background pyramids (shared geometry + material)
    const pyramidGeom = new THREE.ConeGeometry(4, 14, 4);
    const pyramidMat = new THREE.MeshStandardMaterial({ color: 0x1b0033, emissive: 0x050010, wireframe: true });
    for (let i = 0; i < 12; i++) {
      const p = new THREE.Mesh(pyramidGeom, pyramidMat);
      const side = i % 2 === 0 ? 1 : -1;
      p.position.set(side * (Math.random() * 15 + 16), 4, -i * 60);
      this.scene.add(p);
      this.pyramids.push(p);
    }

    this.gridHelper = new THREE.GridHelper(120, 120, 0xff007f, 0x240055);
    this.gridHelper.position.set(0, -1, -this.trackLength / 2);
    this.scene.add(this.gridHelper);

    const railMaterial = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00aa });
    const railGeom = new THREE.CylinderGeometry(0.08, 0.08, this.trackLength, 8);
    const leftRail = new THREE.Mesh(railGeom, railMaterial);
    leftRail.rotation.x = Math.PI / 2;
    leftRail.position.set(-5.5, -0.9, -this.trackLength / 2);
    this.scene.add(leftRail);
    const rightRail = leftRail.clone();
    rightRail.position.x = 5.5;
    this.scene.add(rightRail);

    this.createStarfield();
    this.createPlayer();
    this.applyBackground();
    this.initTrailSystem();

    this.resizeHandler = () => this.onResize(container);
    window.addEventListener('resize', this.resizeHandler);

    this.keydownHandler = (e) => this.onKeydown(e);
    this.touchStartHandler = (e) => this.onTouchStart(e);
    this.touchEndHandler = (e) => this.onTouchEnd(e);
    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('touchstart', this.touchStartHandler, { passive: false });
    window.addEventListener('touchend', this.touchEndHandler, { passive: false });

    this.animate();
  }

  private createStarfield() {
    const starCount = 300;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = Math.random() * 80 + 10;
      positions[i * 3 + 2] = Math.random() * 400;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true });
    this.backgroundStars = new THREE.Points(geom, mat);
    this.scene.add(this.backgroundStars);
  }

  private createPlayer() {
    if (this.playerMesh) {
      this.scene.remove(this.playerMesh);
      this.playerMesh.geometry.dispose();
      (this.playerMesh.material as THREE.Material).dispose();
    }

    const skinData = SKINS.find((s) => s.id === this.config.skinId) || SKINS[0];
    const mat = new THREE.MeshStandardMaterial({
      color: skinData.color,
      emissive: skinData.emissive ?? 0x440a00,
      wireframe: skinData.wireframe ?? false,
      metalness: skinData.metalness ?? 0.1,
      roughness: skinData.roughness ?? 0.5,
      opacity: skinData.opacity ?? 1.0,
      transparent: skinData.transparent ?? false,
    });

    let geom: THREE.BufferGeometry;
    const g = skinData.geom;
    if (g === 'icosahedron') geom = new THREE.IcosahedronGeometry(0.8, 1);
    else if (g === 'octahedron') geom = new THREE.OctahedronGeometry(0.8);
    else if (g === 'box') geom = new THREE.BoxGeometry(1, 1, 1);
    else if (g === 'tetrahedron') geom = new THREE.TetrahedronGeometry(0.8);
    else if (g === 'torus') geom = new THREE.TorusGeometry(0.5, 0.2, 8, 24);
    else if (g === 'torusKnot') geom = new THREE.TorusKnotGeometry(0.4, 0.12, 64, 8);
    else if (g === 'dodecahedron') geom = new THREE.DodecahedronGeometry(0.8);
    else geom = new THREE.SphereGeometry(this.playerSize, 32, 32);

    this.playerMesh = new THREE.Mesh(geom, mat);
    this.playerMesh.position.set(0, this.groundY, 0);
    this.scene.add(this.playerMesh);
  }

  private initTrailSystem() {
    if (this.trailPoints) this.scene.remove(this.trailPoints);
    this.trailPositions = new Float32Array(this.trailMax * 3);
    this.trailColors = new Float32Array(this.trailMax * 3);
    this.trailLives = new Array(this.trailMax).fill(0);
    for (let i = 0; i < this.trailMax; i++) {
      this.trailPositions[i * 3] = 9999;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(this.trailColors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.3, vertexColors: true, transparent: true, opacity: 0.8 });
    this.trailPoints = new THREE.Points(geom, mat);
    this.scene.add(this.trailPoints);
  }

  private applyBackground() {
    const bg = BACKGROUNDS.find((b) => b.id === this.config.backgroundId) || BACKGROUNDS[0];
    this.renderer.setClearColor(bg.skyColor, 1);
    this.scene.background = new THREE.Color(bg.skyColor);
    this.scene.fog!.color.setHex(bg.skyColor);
    this.scene.remove(this.gridHelper);
    this.gridHelper = new THREE.GridHelper(120, 120, bg.gridColor, 0x240055);
    this.gridHelper.position.set(0, -1, -this.trackLength / 2);
    this.scene.add(this.gridHelper);
  }

  updateConfig(config: GameConfig) {
    const skinChanged = config.skinId !== this.config.skinId;
    const bgChanged = config.backgroundId !== this.config.backgroundId;
    this.config = config;
    if (skinChanged) this.createPlayer();
    if (bgChanged) this.applyBackground();
  }

  start() {
    this.createPlayer();
    this.applyBackground();
    this.score = 0;
    this.velocityY = 0;
    this.currentLane = 0;
    this.targetX = 0;
    this.playerSpeed = this.initialSpeedZ;
    this.sessionDiamonds = 0;
    if (this.playerMesh) this.playerMesh.position.set(0, this.groundY, 0);

    this.clearObstaclesAndItems();
    this.generateObstaclesAndItems();
    this.gameActive = true;
    this.isPaused = false;
    this.callbacks.onScore(0);
  }

  pause() {
    if (!this.gameActive) return;
    this.isPaused = !this.isPaused;
  }

  isRunning() {
    return this.gameActive && !this.isPaused;
  }

  destroy() {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('touchstart', this.touchStartHandler);
    window.removeEventListener('touchend', this.touchEndHandler);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }

  // --- Controls ---
  private moveLeft() {
    if (!this.gameActive || this.isPaused) return;
    if (this.currentLane > -1) this.currentLane--;
    this.targetX = this.currentLane * this.laneWidth;
    this.callbacks.onHaptic(30);
  }

  private moveRight() {
    if (!this.gameActive || this.isPaused) return;
    if (this.currentLane < 1) this.currentLane++;
    this.targetX = this.currentLane * this.laneWidth;
    this.callbacks.onHaptic(30);
  }

  private triggerJump() {
    if (!this.gameActive || this.isPaused) return;
    if (this.jumpCount < this.maxJumps) {
      this.velocityY = 0.32;
      this.jumpCount++;
      this.callbacks.onHaptic(40);
    }
  }

  private onKeydown(e: KeyboardEvent) {
    if (!this.gameActive || this.isPaused) return;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.moveLeft();
    else if (e.code === 'KeyD' || e.code === 'ArrowRight') this.moveRight();
    else if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') this.triggerJump();
  }

  private onTouchStart(e: TouchEvent) {
    if (!this.gameActive || this.isPaused) return;
    e.preventDefault();
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  }

  private onTouchEnd(e: TouchEvent) {
    if (!this.gameActive || this.isPaused) return;
    e.preventDefault();
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - this.touchStartX;
    const diffY = endY - this.touchStartY;

    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) this.moveRight();
      else this.moveLeft();
    } else if (diffY < -40 && Math.abs(diffY) > Math.abs(diffX)) {
      this.triggerJump();
    } else if (Math.abs(diffX) < 15 && Math.abs(diffY) < 15) {
      const screenW = window.innerWidth;
      if (endX < screenW * 0.33) this.moveLeft();
      else if (endX > screenW * 0.66) this.moveRight();
      else this.triggerJump();
    }
  }

  // --- Pool helpers ---
  private acquireObstacle(geomIndex: number): THREE.Mesh {
    for (const m of this.obstaclePool) {
      if (!m.visible) {
        m.visible = true;
        m.geometry = this.sharedObstacleGeoms[geomIndex];
        return m;
      }
    }
    // Pool exhausted; create fallback
    const m = new THREE.Mesh(this.sharedObstacleGeoms[geomIndex], this.sharedObstacleMat);
    this.scene.add(m);
    this.obstaclePool.push(m);
    return m;
  }

  private acquireItem(): THREE.Mesh {
    for (const m of this.itemPool) {
      if (!m.visible) {
        m.visible = true;
        return m;
      }
    }
    const m = new THREE.Mesh(this.sharedItemGeom, this.sharedItemMat);
    this.scene.add(m);
    this.itemPool.push(m);
    return m;
  }

  private clearObstaclesAndItems() {
    for (const o of this.obstacles) o.mesh.visible = false;
    this.obstacles.length = 0;
    for (const it of this.items) it.mesh.visible = false;
    this.items.length = 0;
  }

  private generateObstaclesAndItems() {
    const lanes = [-this.laneWidth, 0, this.laneWidth];
    for (let z = -50; z > -this.trackLength; z -= 35) {
      if (Math.random() < 0.6) {
        const shapeType = Math.floor(Math.random() * 3);
        let obsY = 0.2;
        let radius = 0.7;
        if (shapeType === 1) { obsY = 1.5; radius = 0.8; }
        else if (shapeType === 2) { obsY = 0.5; radius = 0.9; }

        const lane = lanes[Math.floor(Math.random() * this.numLanes)];
        const mesh = this.acquireObstacle(shapeType);
        mesh.position.set(lane, obsY, z);
        this.obstacles.push({ mesh, radius });
      }

      if (Math.random() < 0.4) {
        const lane = lanes[Math.floor(Math.random() * this.numLanes)];
        const mesh = this.acquireItem();
        const itemY = Math.random() < 0.4 ? 2.0 : 0.2;
        mesh.position.set(lane, itemY, z);
        this.items.push({ mesh });
      }
    }
  }

  private emitTrail() {
    if (this.config.trailId === 'trail_0' || !this.playerMesh || !this.trailPoints) return;
    const trailData = TRAILS.find((t) => t.id === this.config.trailId);
    if (!trailData || !this.trailPositions || !this.trailColors) return;

    const pos = this.playerMesh.position;
    const idx = this.trailIndex % this.trailMax;
    this.trailPositions[idx * 3] = pos.x;
    this.trailPositions[idx * 3 + 1] = pos.y;
    this.trailPositions[idx * 3 + 2] = pos.z - 0.5;

    let r = 1, g = 1, b = 1;
    if (this.config.trailId === 'trail_p1') {
      const c = new THREE.Color().setHSL((performance.now() % 3000) / 3000, 1.0, 0.5);
      r = c.r; g = c.g; b = c.b;
    } else {
      const tc = new THREE.Color(trailData.color);
      r = tc.r; g = tc.g; b = tc.b;
    }
    this.trailColors[idx * 3] = r;
    this.trailColors[idx * 3 + 1] = g;
    this.trailColors[idx * 3 + 2] = b;
    this.trailLives[idx] = 1.0;
    this.trailIndex++;

    // Decay all live particles
    for (let i = 0; i < this.trailMax; i++) {
      if (this.trailLives[i] > 0) {
        this.trailLives[i] -= 0.04;
        if (this.trailLives[i] <= 0) {
          this.trailPositions[i * 3] = 9999;
        }
      }
    }

    this.trailPoints.geometry.attributes.position.needsUpdate = true;
    this.trailPoints.geometry.attributes.color.needsUpdate = true;
  }

  private gameOver() {
    this.gameActive = false;
    this.callbacks.onHaptic(300);
    this.callbacks.onGameOver(this.score);
  }

  private animate = () => {
    this.rafId = requestAnimationFrame(this.animate);

    if (!this.gameActive || this.isPaused) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // Physics
    const pm = this.playerMesh!;
    pm.position.x += (this.targetX - pm.position.x) * 0.16;
    this.velocityY += this.gravity;
    pm.position.y += this.velocityY;

    if (pm.position.y <= this.groundY) {
      pm.position.y = this.groundY;
      this.velocityY = 0;
      this.jumpCount = 0;
    }
    if (pm.position.y >= 4.0) {
      pm.position.y = 4.0;
      this.velocityY = -0.01;
    }

    // Speed & scoring
    this.playerSpeed = Math.min(this.initialSpeedZ + (this.score * 0.0001), this.maxPlayerSpeed);
    pm.position.z -= this.playerSpeed;
    pm.rotation.x -= this.playerSpeed * 0.5;

    // Camera tracking
    this.camera.position.z = pm.position.z + 7.5;
    this.camera.position.x += (pm.position.x - this.camera.position.x) * 0.1;
    this.camera.lookAt(pm.position.x, pm.position.y + 1.0, pm.position.z - 12.0);

    // Starfield
    if (this.backgroundStars) {
      const pArr = (this.backgroundStars.geometry.attributes.position.array as Float32Array);
      for (let i = 0; i < pArr.length / 3; i++) {
        pArr[i * 3 + 2] -= this.playerSpeed;
        if (pArr[i * 3 + 2] < pm.position.z - 200) {
          pArr[i * 3 + 2] = pm.position.z + 100 + Math.random() * 100;
        }
      }
      this.backgroundStars.geometry.attributes.position.needsUpdate = true;
    }

    // Pyramid rotation
    for (const p of this.pyramids) {
      p.rotation.y += 0.005;
    }

    this.emitTrail();

    // Track loop
    if (pm.position.z < -this.trackLength + 100) {
      pm.position.z = 0;
      this.clearObstaclesAndItems();
      this.generateObstaclesAndItems();
    }

    // Collisions
    for (const obs of this.obstacles) {
      if (!obs.mesh.visible) continue;
      const dx = pm.position.x - obs.mesh.position.x;
      const dy = pm.position.y - obs.mesh.position.y;
      const dz = pm.position.z - obs.mesh.position.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq < (this.playerSize + obs.radius) ** 2) {
        this.gameOver();
        return;
      }
    }

    // Item pickup
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      const dx = pm.position.x - it.mesh.position.x;
      const dy = pm.position.y - it.mesh.position.y;
      const dz = pm.position.z - it.mesh.position.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      it.mesh.rotation.y += 0.03;

      if (distSq < (this.playerSize + 0.4) ** 2) {
        it.mesh.visible = false;
        this.items.splice(i, 1);
        this.sessionDiamonds++;
        this.score += 1;
        this.callbacks.onPickup();
        this.callbacks.onHaptic(60);
        this.callbacks.onScore(this.score);
        this.callbacks.onCoins(this.sessionDiamonds * 10, 10);
      }
    }

    // Time-based score (1 pt per second approx via ticks)
    this.score += 0.016;
    if (Math.floor(this.score) !== Math.floor(this.score - 0.016)) {
      this.callbacks.onScore(Math.floor(this.score));
    }

    this.renderer.render(this.scene, this.camera);
  };

  private onResize(container: HTMLElement) {
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}

export type { Skin, Trail, Background };
