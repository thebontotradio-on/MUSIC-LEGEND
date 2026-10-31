import * as THREE from 'three';
import { StageType } from '../../server/types.js';

export class ThreeStageEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;
  private currentStage: StageType = 'IDLE';

  // 3D Objects
  private stageFloorGroup: THREE.Group = new THREE.Group();
  private equalizerBars: THREE.Mesh[] = [];
  private spotlights: THREE.SpotLight[] = [];
  private particles: THREE.Points | null = null;
  private podiumGroup: THREE.Group = new THREE.Group();
  private winnerRingsGroup: THREE.Group = new THREE.Group();

  private isRunning: boolean = false;
  private clock: THREE.Clock = new THREE.Clock();

  constructor(container: HTMLElement) {
    this.container = container;
    const width = container.clientWidth || 1080;
    const height = container.clientHeight || 1920;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050508, 0.035);

    // 2. Camera: Portrait 9:16 optimized field of view
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    this.camera.position.set(0, 3, 11);
    this.camera.lookAt(0, 1.5, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    // Build scene elements
    this.initLighting();
    this.initStageFloor();
    this.initEqualizer();
    this.initPodium();
    this.initWinnerEffects();
    this.initParticles();

    // Start rendering
    this.start();

    // Handle resize
    window.addEventListener('resize', this.onResize);
  }

  private initLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x1a1233, 1.2);
    this.scene.add(ambientLight);

    // Main Cyan Spotlight (Left)
    const cyanSpot = new THREE.SpotLight(0x00f0ff, 4, 30, Math.PI / 5, 0.4, 1);
    cyanSpot.position.set(-6, 12, 4);
    cyanSpot.target.position.set(0, 0, 0);
    this.scene.add(cyanSpot);
    this.scene.add(cyanSpot.target);
    this.spotlights.push(cyanSpot);

    // Purple Spotlight (Right)
    const purpleSpot = new THREE.SpotLight(0x8a2be2, 4.5, 30, Math.PI / 5, 0.4, 1);
    purpleSpot.position.set(6, 12, 4);
    purpleSpot.target.position.set(0, 0, 0);
    this.scene.add(purpleSpot);
    this.scene.add(purpleSpot.target);
    this.spotlights.push(purpleSpot);

    // Center Gold Spotlight (for Winner/Champion)
    const goldSpot = new THREE.SpotLight(0xffd700, 5, 25, Math.PI / 6, 0.3, 1);
    goldSpot.position.set(0, 14, 2);
    goldSpot.target.position.set(0, 1, 0);
    this.scene.add(goldSpot);
    this.scene.add(goldSpot.target);
    this.spotlights.push(goldSpot);
  }

  private initStageFloor(): void {
    // Circular stage platform with metallic reflective surface
    const stageGeo = new THREE.CylinderGeometry(5.5, 6, 0.4, 48);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x0c0d18,
      metalness: 0.85,
      roughness: 0.25
    });
    const stageMesh = new THREE.Mesh(stageGeo, stageMat);
    stageMesh.position.y = -0.2;
    this.stageFloorGroup.add(stageMesh);

    // Outer neon glow ring
    const ringGeo = new THREE.TorusGeometry(5.6, 0.08, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.02;
    this.stageFloorGroup.add(ringMesh);

    // Concentric inner purple ring
    const innerRingGeo = new THREE.TorusGeometry(3.8, 0.05, 16, 64);
    const innerRingMat = new THREE.MeshBasicMaterial({ color: 0x8a2be2 });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = Math.PI / 2;
    innerRing.position.y = 0.02;
    this.stageFloorGroup.add(innerRing);

    this.scene.add(this.stageFloorGroup);
  }

  private initEqualizer(): void {
    // Arc of 24 3D audio equalizer bars behind the stage
    const barCount = 28;
    const radius = 5.0;
    const barGeo = new THREE.BoxGeometry(0.18, 1, 0.18);

    for (let i = 0; i < barCount; i++) {
      const angle = (i / (barCount - 1) - 0.5) * Math.PI * 0.9;
      const x = Math.sin(angle) * radius;
      const z = -Math.cos(angle) * (radius * 0.6) - 1.5;

      // Gradient color from Cyan to Purple/Magenta
      const ratio = i / (barCount - 1);
      const color = new THREE.Color().lerpColors(
        new THREE.Color(0x00f0ff),
        new THREE.Color(0xff007f),
        ratio
      );

      const mat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.6,
        roughness: 0.3
      });

      const bar = new THREE.Mesh(barGeo, mat);
      bar.position.set(x, 0.5, z);
      this.equalizerBars.push(bar);
      this.scene.add(bar);
    }
  }

  private initPodium(): void {
    // 3D Metallic Podiums for Champion Stage:
    // Center: 1st Place (Gold, Height 2.2)
    // Left:   2nd Place (Silver, Height 1.6)
    // Right:  3rd Place (Bronze, Height 1.1)

    const podium1Geo = new THREE.CylinderGeometry(1.2, 1.3, 2.2, 32);
    const podium1Mat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x332600
    });
    const podium1 = new THREE.Mesh(podium1Geo, podium1Mat);
    podium1.position.set(0, 1.1, -1);
    this.podiumGroup.add(podium1);

    // Ring 1st Place
    const ring1Geo = new THREE.TorusGeometry(1.22, 0.06, 16, 32);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.set(0, 2.2, -1);
    this.podiumGroup.add(ring1);

    // 2nd Place (Left - Silver)
    const podium2Geo = new THREE.CylinderGeometry(1.0, 1.1, 1.6, 32);
    const podium2Mat = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0,
      metalness: 0.85,
      roughness: 0.2
    });
    const podium2 = new THREE.Mesh(podium2Geo, podium2Mat);
    podium2.position.set(-2.5, 0.8, -0.6);
    this.podiumGroup.add(podium2);

    // 3rd Place (Right - Bronze)
    const podium3Geo = new THREE.CylinderGeometry(0.9, 1.0, 1.1, 32);
    const podium3Mat = new THREE.MeshStandardMaterial({
      color: 0xcd7f32,
      metalness: 0.8,
      roughness: 0.25
    });
    const podium3 = new THREE.Mesh(podium3Geo, podium3Mat);
    podium3.position.set(2.5, 0.55, -0.6);
    this.podiumGroup.add(podium3);

    this.podiumGroup.visible = false;
    this.scene.add(this.podiumGroup);
  }

  private initWinnerEffects(): void {
    // Rotating concentric energy rings for winner celebration
    const ringGeo1 = new THREE.TorusGeometry(2.0, 0.05, 16, 48);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.8 });
    const r1 = new THREE.Mesh(ringGeo1, ringMat1);
    this.winnerRingsGroup.add(r1);

    const ringGeo2 = new THREE.TorusGeometry(2.6, 0.04, 16, 48);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.7 });
    const r2 = new THREE.Mesh(ringGeo2, ringMat2);
    r2.rotation.x = Math.PI / 3;
    this.winnerRingsGroup.add(r2);

    this.winnerRingsGroup.position.set(0, 2.5, 0);
    this.winnerRingsGroup.visible = false;
    this.scene.add(this.winnerRingsGroup);
  }

  private initParticles(): void {
    const particleCount = 400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = Math.random() * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;

      const color = Math.random() > 0.5 ? new THREE.Color(0x00f0ff) : new THREE.Color(0xffd700);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.6
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  public setStage(stage: StageType): void {
    if (this.currentStage === stage) return;
    this.currentStage = stage;

    // Toggle 3D element visibility per stage
    switch (stage) {
      case 'IDLE':
        this.podiumGroup.visible = false;
        this.winnerRingsGroup.visible = false;
        this.camera.position.set(0, 3, 11);
        this.camera.lookAt(0, 1.5, 0);
        break;
      case 'GUESSING':
        this.podiumGroup.visible = false;
        this.winnerRingsGroup.visible = false;
        // Move camera back slightly and lower lights to prioritize text overlay
        this.camera.position.set(0, 2.5, 12);
        this.camera.lookAt(0, 1.2, 0);
        break;
      case 'WINNER':
        this.podiumGroup.visible = false;
        this.winnerRingsGroup.visible = true;
        this.camera.position.set(0, 2.8, 9.5);
        this.camera.lookAt(0, 2.0, 0);
        break;
      case 'CHAMPION':
        this.podiumGroup.visible = true;
        this.winnerRingsGroup.visible = false;
        this.camera.position.set(0, 3.2, 10);
        this.camera.lookAt(0, 1.8, 0);
        break;
    }
  }

  private animate = (): void => {
    if (!this.isRunning) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    const elapsedTime = this.clock.getElapsedTime();

    // 1. Animate Equalizer Bars
    for (let i = 0; i < this.equalizerBars.length; i++) {
      const bar = this.equalizerBars[i];
      let h = 0.5;
      if (this.currentStage === 'IDLE' || this.currentStage === 'CHAMPION') {
        const wave1 = Math.sin(elapsedTime * 4 + i * 0.45);
        const wave2 = Math.cos(elapsedTime * 6 - i * 0.3);
        h = 0.3 + Math.abs(wave1 * 1.4 + wave2 * 0.8);
      } else if (this.currentStage === 'GUESSING') {
        // Subtle rhythmic heartbeat
        h = 0.4 + Math.abs(Math.sin(elapsedTime * 2 + i * 0.2)) * 0.6;
      } else if (this.currentStage === 'WINNER') {
        // High celebratory burst
        h = 0.6 + Math.abs(Math.sin(elapsedTime * 8 + i * 0.5)) * 2.0;
      }
      bar.scale.y = h;
      bar.position.y = h / 2;
    }

    // 2. Animate Dynamic Spotlights
    if (this.spotlights.length >= 2) {
      this.spotlights[0].position.x = -6 + Math.sin(elapsedTime * 1.5) * 2;
      this.spotlights[1].position.x = 6 + Math.cos(elapsedTime * 1.5) * 2;
    }

    // 3. Animate Winner Rings
    if (this.winnerRingsGroup.visible) {
      this.winnerRingsGroup.rotation.y = elapsedTime * 1.2;
      this.winnerRingsGroup.rotation.z = Math.sin(elapsedTime * 0.8) * 0.3;
    }

    // 4. Animate floating ambient particles
    if (this.particles) {
      this.particles.rotation.y = elapsedTime * 0.05;
      const posAttr = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
      const count = posAttr.count;
      for (let i = 0; i < count; i++) {
        let y = posAttr.getY(i) - 0.015;
        if (y < 0) y = 10;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  };

  public start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.clock.start();
      this.animate();
    }
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.clock.stop();
  }

  private onResize = (): void => {
    if (!this.container) return;
    const width = this.container.clientWidth || 1080;
    const height = this.container.clientHeight || 1920;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

