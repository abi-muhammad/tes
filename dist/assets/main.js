import * as THREE from 'three';
import { AudioManager } from './game/audio.js';
import { TextureLibrary } from './game/textures.js';
import { Player } from './game/player.js';
import { Teacher } from './game/teacher.js';
import { CorridorManager } from './game/corridor.js';
import { ObstacleManager } from './game/obstacles.js';
import { CollectiblesManager } from './game/powerups.js';
import { UIManager } from './game/ui.js';

const STORAGE_HIGHSCORE_KEY = 'kpw_highscore';
const STORAGE_TOTAL_COINS_KEY = 'kpw_total_coins';
const STORAGE_QUALITY_KEY = 'kpw_graphics_quality';

class KejaranPakWahidGame {
  constructor() {
    this.state = 'MENU'; // MENU | PLAYING | PAUSED | GAMEOVER
    this.score = 0;
    this.runCoins = 0;
    this.highScore = Number(localStorage.getItem(STORAGE_HIGHSCORE_KEY) || 0);
    this.totalCoins = Number(localStorage.getItem(STORAGE_TOTAL_COINS_KEY) || 0);

    this.baseSpeed = 13.5;
    this.maxSpeed = 27.0;
    this.currentSpeed = this.baseSpeed;
    this.cameraShake = 0;

    // Pengukur FPS riil untuk pemantauan frame pacing
    this.fpsAccumTime = 0;
    this.fpsFrames = 0;
    this.measuredFps = 60;

    this.audio = new AudioManager();
    this.quality = this.detectInitialQuality();

    this.ui = new UIManager({
      onStartGame: () => this.startGame(),
      onPauseGame: () => this.pauseGame(),
      onResumeGame: () => this.resumeGame(),
      onQuitToMenu: () => this.quitToMenu(),
      onToggleMute: () => {
        const muted = this.audio.toggleMute();
        this.ui.updateMuteButtons(muted);
        if (!muted && this.state === 'PLAYING') {
          this.audio.startBGM();
        }
      },
      onChangeQuality: (q) => this.applyGraphicsQuality(q),
      onAction: (action) => this.handlePlayerAction(action),
      isPlaying: () => this.state === 'PLAYING',
      isPaused: () => this.state === 'PAUSED'
    });

    this.ui.setQualitySelect(this.quality);
    this.ui.updateMuteButtons(this.audio.muted);
    this.ui.checkOrientationHint();

    if (!this.isWebGLAvailable()) {
      this.ui.showWebGLFallback();
      return;
    }

    this.initThreeScene();
    this.applyGraphicsQuality(this.quality);
    this.bindLifecycleEvents();

    this.ui.showMenu(this.highScore, this.totalCoins);
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.animate(t));
  }

  detectInitialQuality() {
    const saved = localStorage.getItem(STORAGE_QUALITY_KEY);
    if (saved === 'low' || saved === 'medium' || saved === 'high' || saved === 'ultra') {
      return saved;
    }
    const mem = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (mem <= 2 || cores <= 4) {
      return 'low';
    }
    if (isMobile) {
      return 'medium';
    }
    return 'high';
  }

  isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return Boolean(
        window.WebGLRenderingContext &&
          (canvas.getContext('webgl2') ||
            canvas.getContext('webgl') ||
            canvas.getContext('experimental-webgl'))
      );
    } catch {
      return false;
    }
  }

  initThreeScene() {
    const container = document.getElementById('canvas-container');

    this.scene = new THREE.Scene();
    // Langit siang cerah sekolah tropis & kabut atmosferik alami di kejauhan
    this.scene.background = new THREE.Color(0xcbe4f9);
    this.scene.fog = new THREE.Fog(0xdbeafe, 44, 118);

    this.camera = new THREE.PerspectiveCamera(
      54,
      window.innerWidth / window.innerHeight,
      0.15,
      165
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: this.quality !== 'low',
      powerPreference: 'high-performance'
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(this.renderer.domElement);

    const maxAniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy() || 4);
    this.texLib = new TextureLibrary(this.renderer, maxAniso);
    this.daylightEnvMap = this.texLib.getDaylightEnvMap();

    // Kubah Langit Siang Tropis bergradasi lembut
    this.buildSkyDome();

    // ==================== PENCAHAYAAN SIANG HARI SEKOLAH TROPIS ====================
    // 1. Hemisphere Light (Langit biru cerah + pantulan hangat keramik/taman di area teduh atap)
    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0xb8ad9e, 0.92);
    this.hemiLight.position.set(0, 20, 0);
    this.scene.add(this.hemiLight);

    // 2. Matahari Siang Alami (Datang menyerong dari taman kiri koridor terbuka)
    this.sunLight = new THREE.DirectionalLight(0xfff8e7, 1.85);
    this.sunLight.position.set(-16, 23, 10);
    this.sunLight.target.position.set(0, 0, -12);
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Konfigurasi kamera bayangan agar bayangan pilar, karakter & motor menempel tajam tanpa berkedip
    const sc = this.sunLight.shadow.camera;
    sc.left = -16;
    sc.right = 14;
    sc.top = 24;
    sc.bottom = -22;
    sc.near = 2;
    sc.far = 56;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.022;

    // 3. Cahaya Pengisi Halus dari Arah Kamera agar Batik Marun & Kemeja Putih Pak Wahid Selalu Terbaca Jelas
    this.fillLight = new THREE.DirectionalLight(0xeef6ff, 0.42);
    this.fillLight.position.set(4, 6, 12);
    this.scene.add(this.fillLight);

    // Entitas Permainan SMA Negeri 1 Pasir Sakti
    this.corridor = new CorridorManager(this.scene, this.texLib);
    this.player = new Player(this.scene, this.texLib);
    this.teacher = new Teacher(this.scene, this.texLib);
    this.obstacles = new ObstacleManager(this.scene, this.texLib);
    this.collectibles = new CollectiblesManager(this.scene);

    this.updateCameraProjection();
  }

  buildSkyDome() {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, '#1d4ed8');
    grad.addColorStop(0.38, '#60a5fa');
    grad.addColorStop(0.62, '#bae6fd');
    grad.addColorStop(0.76, '#f1f5f9');
    grad.addColorStop(1.0, '#dbeafe');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Awan cumulus siang lembut
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    [
      [48, 92, 34, 12],
      [140, 78, 42, 14],
      [210, 102, 30, 10]
    ].forEach(([cx, cy, rx, ry]) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    const skyTex = new THREE.CanvasTexture(c);
    skyTex.colorSpace = THREE.SRGBColorSpace;
    const skyMesh = new THREE.Mesh(
      new THREE.SphereGeometry(115, 24, 16),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })
    );
    this.scene.add(skyMesh);
  }

  // Sistem Grafis Adaptif 4 Preset Nyata: Low, Medium, High, Ultra
  applyGraphicsQuality(quality) {
    this.quality = quality;
    try {
      localStorage.setItem(STORAGE_QUALITY_KEY, quality);
    } catch {}

    if (!this.renderer || !this.scene) return;

    const dpr = window.devicePixelRatio || 1;
    const hwMaxAniso = this.renderer.capabilities.getMaxAnisotropy() || 4;

    if (quality === 'low') {
      this.renderer.setPixelRatio(Math.min(dpr, 1.0));
      this.renderer.shadowMap.enabled = false;
      this.sunLight.castShadow = false;
      this.scene.environment = null;
      this.texLib.setAnisotropy(1);
    } else if (quality === 'medium') {
      this.renderer.setPixelRatio(Math.min(dpr, 1.35));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.set(1024, 1024);
      this.scene.environment = this.daylightEnvMap;
      this.texLib.setAnisotropy(Math.min(2, hwMaxAniso));
    } else if (quality === 'high') {
      this.renderer.setPixelRatio(Math.min(dpr, 1.75));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.set(2048, 2048);
      this.scene.environment = this.daylightEnvMap;
      this.texLib.setAnisotropy(Math.min(4, hwMaxAniso));
    } else {
      // ULTRA Preset
      this.renderer.setPixelRatio(Math.min(dpr, 2.0));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.set(2048, 2048);
      this.scene.environment = this.daylightEnvMap;
      this.texLib.setAnisotropy(hwMaxAniso);
    }

    if (this.sunLight.shadow.map) {
      this.sunLight.shadow.map.dispose();
      this.sunLight.shadow.map = null;
    }
    this.renderer.shadowMap.needsUpdate = true;

    if (this.corridor) {
      this.corridor.applyQualityPreset(quality);
    }
  }

  updateCameraProjection() {
    if (!this.camera || !this.renderer) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;

    this.camera.aspect = aspect;
    // FOV proporsional bebas distorsi berlebih namun tetap menampilkan 3 jalur utuh di Android Portrait & Landscape
    if (aspect < 0.78) {
      this.camera.fov = 68;
      this.cameraBaseZ = 6.75;
      this.cameraBaseY = 3.15;
    } else if (aspect < 1.15) {
      this.camera.fov = 60;
      this.cameraBaseZ = 6.15;
      this.cameraBaseY = 2.95;
    } else {
      this.camera.fov = 52;
      this.cameraBaseZ = 5.65;
      this.cameraBaseY = 2.75;
    }
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  bindLifecycleEvents() {
    window.addEventListener('resize', () => {
      this.updateCameraProjection();
      this.ui.checkOrientationHint();
    });

    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.updateCameraProjection();
        this.ui.checkOrientationHint();
      }, 120);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'PLAYING') {
        this.pauseGame();
      }
    });
  }

  startGame() {
    this.audio.initContext();
    this.audio.playSchoolBell();
    setTimeout(() => {
      if (this.state === 'PLAYING') {
        this.audio.playTeacherWhistle();
      }
    }, 350);

    this.state = 'PLAYING';
    this.score = 0;
    this.runCoins = 0;
    this.currentSpeed = this.baseSpeed;
    this.cameraShake = 0;

    this.player.reset();
    this.teacher.reset();
    this.corridor.reset();
    this.obstacles.reset();
    this.collectibles.reset();

    this.ui.showPlaying(this.highScore);
    this.ui.showComicBubble(
      '"PRIIIT! Heh! Ngapain nongkrong di koridor XI A1?! Sini kamu!"',
      3600
    );
    this.audio.startBGM();
  }

  pauseGame() {
    if (this.state !== 'PLAYING') return;
    this.state = 'PAUSED';
    this.audio.stopBGM();
    this.ui.showPause();
  }

  resumeGame() {
    if (this.state !== 'PAUSED') return;
    this.state = 'PLAYING';
    this.lastTime = performance.now();
    this.ui.showPlaying(this.highScore);
    this.audio.startBGM();
  }

  quitToMenu() {
    this.state = 'MENU';
    this.audio.stopBGM();
    this.player.reset();
    this.teacher.reset();
    this.obstacles.reset();
    this.collectibles.reset();
    this.ui.showMenu(this.highScore, this.totalCoins);
  }

  handlePlayerAction(action) {
    if (this.state !== 'PLAYING') return;
    switch (action) {
      case 'LEFT':
        this.player.moveLeft(this.audio);
        break;
      case 'RIGHT':
        this.player.moveRight(this.audio);
        break;
      case 'JUMP':
        this.player.jump(this.audio);
        break;
      case 'SLIDE':
        this.player.slide(this.audio);
        break;
      default:
        break;
    }
  }

  handleObstacleCollision(obs) {
    this.audio.playCrash();
    this.cameraShake = 0.42;

    if (obs.isSolidWall) {
      this.teacher.distance = 0;
      this.triggerGameOver();
      return;
    }

    this.player.triggerStumble();
    this.currentSpeed = Math.max(this.baseSpeed, this.currentSpeed - 2.2);
    const caught = this.teacher.onPlayerStumble();

    if (caught) {
      this.triggerGameOver();
    } else {
      this.audio.playTeacherWhistle();
      this.audio.playTeacherBark();
      this.ui.showComicBubble(this.teacher.getRandomQuote(), 2600);
    }
  }

  triggerGameOver() {
    this.state = 'GAMEOVER';
    this.audio.stopBGM();
    this.audio.playTeacherWhistle();
    this.audio.playTeacherBark();

    this.player.setCaught();

    const finalScore = Math.floor(this.score);
    let isNewRecord = false;
    if (finalScore > this.highScore) {
      this.highScore = finalScore;
      isNewRecord = true;
      try {
        localStorage.setItem(STORAGE_HIGHSCORE_KEY, String(this.highScore));
      } catch {}
    }

    this.totalCoins += this.runCoins;
    try {
      localStorage.setItem(STORAGE_TOTAL_COINS_KEY, String(this.totalCoins));
    } catch {}

    const quote = this.teacher.getRandomGameOverQuote();
    this.ui.showGameOver(finalScore, this.runCoins, this.highScore, isNewRecord, quote);
  }

  animate(now) {
    requestAnimationFrame((t) => this.animate(t));

    const rawDt = (now - this.lastTime) / 1000;
    const dt = Math.min(0.05, Math.max(0.001, rawDt));
    this.lastTime = now;

    // Hitung rata-rata FPS tiap 0.5 detik
    if (rawDt > 0 && rawDt < 0.5) {
      this.fpsAccumTime += rawDt;
      this.fpsFrames += 1;
      if (this.fpsAccumTime >= 0.5) {
        this.measuredFps = this.fpsFrames / this.fpsAccumTime;
        this.fpsAccumTime = 0;
        this.fpsFrames = 0;
      }
    }

    if (this.state === 'PLAYING') {
      const targetSpeed = Math.min(this.maxSpeed, this.baseSpeed + this.score * 0.012);
      const effectiveSpeed = this.player.hasTurbo ? targetSpeed * 1.38 : targetSpeed;
      this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, effectiveSpeed, dt * 3);

      this.score += this.currentSpeed * dt * 0.85;

      this.corridor.update(dt, this.currentSpeed);
      this.player.update(dt, this.currentSpeed, this.audio);
      this.teacher.update(dt, this.player.group.position.x, this.currentSpeed, false);

      this.obstacles.update(
        dt,
        this.currentSpeed,
        this.player,
        this.collectibles,
        (obs) => this.handleObstacleCollision(obs)
      );

      this.collectibles.update(
        dt,
        this.currentSpeed,
        this.player,
        this.teacher,
        this.audio,
        () => {
          this.runCoins += 1;
          this.score += 5;
        },
        (powerupInfo) => {
          this.ui.showComicBubble(`⚡ Dapat ${powerupInfo.label}!`, 2000);
        }
      );

      this.ui.updateHUD(
        this.score,
        this.runCoins,
        this.highScore,
        this.teacher.distance,
        this.teacher.maxDistance,
        this.collectibles.getActiveBuffList(),
        this.measuredFps
      );
    } else if (this.state === 'MENU') {
      this.corridor.update(dt, 4.2);
      this.player.update(dt, 8.8, null);
      this.teacher.update(dt, 0, 8.8, false);
    } else if (this.state === 'GAMEOVER') {
      this.player.update(dt, 0, null);
      this.teacher.update(dt, this.player.group.position.x, 0, true);
    }

    // Kamera Third-Person Halus & Terbaca Jelas Tanpa Mengganggu Gameplay
    if (this.camera && this.player) {
      let shakeX = 0;
      let shakeY = 0;
      if (this.cameraShake > 0) {
        this.cameraShake = Math.max(0, this.cameraShake - dt * 2.0);
        shakeX = (Math.random() - 0.5) * this.cameraShake * 0.5;
        shakeY = (Math.random() - 0.5) * this.cameraShake * 0.5;
      }

      const targetCamX = this.player.group.position.x * 0.48 + shakeX;
      const targetCamY = this.cameraBaseY + this.player.y * 0.28 + shakeY;
      this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, Math.min(1, dt * 11));
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetCamY, Math.min(1, dt * 11));
      this.camera.position.z = this.cameraBaseZ;

      this.camera.lookAt(
        this.player.group.position.x * 0.34,
        1.32 + this.player.y * 0.16,
        -7.2
      );
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.__game = new KejaranPakWahidGame();

  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
});
