import * as THREE from 'three';

export const LANE_WIDTH = 2.2;
export const LANES = [-LANE_WIDTH, 0, LANE_WIDTH];

export class Player {
  constructor(scene, texLib) {
    this.scene = scene;
    this.texLib = texLib;
    this.group = new THREE.Group();
    this.rigRoot = new THREE.Group();
    this.group.add(this.rigRoot);

    // State pergerakan 3 jalur (100% mempertahankan mekanik inti)
    this.currentLane = 1;
    this.targetX = LANES[1];
    this.y = 0;
    this.velocityY = 0;
    this.gravity = -34;
    this.baseJumpForce = 12.8;

    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.slideDuration = 0.68;

    this.landCompress = 0;
    this.stumbleTimer = 0;
    this.isCaught = false;
    this.runCycle = 0;
    this.stepPhase = 0;

    // Bobot transisi animasi halus (Animation Blending)
    this.jumpBlend = 0;
    this.slideBlend = 0;
    this.laneBank = 0;

    // Power-up flags
    this.hasSuperJump = false;
    this.hasTurbo = false;
    this.hasMagnet = false;

    this.buildHumanoidStudent();
    this.scene.add(this.group);
  }

  buildHumanoidStudent() {
    const batikSet = this.texLib ? this.texLib.getBatikMaroonSet() : null;
    const pantsSet = this.texLib ? this.texLib.getTrouserFabricSet('#52637a') : null;
    const shadowTex = this.texLib ? this.texLib.getContactShadowTexture() : null;

    // Material PBR Realistis
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xdca074,
      roughness: 0.68,
      metalness: 0.02
    });

    const lipMat = new THREE.MeshStandardMaterial({
      color: 0xa85d4c,
      roughness: 0.62
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x16181d,
      roughness: 0.82,
      metalness: 0.04
    });

    const eyeWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25
    });

    const irisMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.2
    });

    // Seragam Batik Marun Motif Putih & Emas (Roughness kain tinggi agar tidak seperti plastik)
    const batikMat = new THREE.MeshStandardMaterial({
      color: batikSet ? 0xffffff : 0x6b1824,
      map: batikSet ? batikSet.map : null,
      normalMap: batikSet ? batikSet.normalMap : null,
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughness: 0.85,
      metalness: 0.02
    });

    // Celana Panjang Sekolah Abu-abu Kebiruan
    const trousersMat = new THREE.MeshStandardMaterial({
      color: pantsSet ? 0xffffff : 0x52637a,
      map: pantsSet ? pantsSet.map : null,
      roughness: 0.82,
      metalness: 0.02
    });

    const beltMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.48,
      metalness: 0.25
    });

    // Tas Sekolah Ransel Hitam Arang Realistis
    const backpackMat = new THREE.MeshStandardMaterial({
      color: 0x1e2026,
      roughness: 0.84,
      metalness: 0.04
    });

    const zipperMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.35,
      metalness: 0.75
    });

    // Sepatu Kets Kanvas Hitam Bersol Karet Putih & Tali Putih (Sesuai Referensi Siswa)
    const shoeCanvasMat = new THREE.MeshStandardMaterial({
      color: 0x18191c,
      roughness: 0.86
    });

    const shoeSoleMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.65
    });

    // Bayangan Kontak di Lantai
    if (shadowTex) {
      this.contactShadow = new THREE.Mesh(
        new THREE.PlaneGeometry(0.95, 0.95),
        new THREE.MeshBasicMaterial({
          map: shadowTex,
          transparent: true,
          depthWrite: false
        })
      );
      this.contactShadow.rotation.x = -Math.PI / 2;
      this.contactShadow.position.y = 0.012;
      this.group.add(this.contactShadow);
    }

    // ==================== HIERARKI SKELETAL HUMANOID (~1.68m) ====================
    // 1. Pelvis / Pinggul (Tinggi dasar 0.90m dari lantai)
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 0.9;
    this.rigRoot.add(this.pelvis);

    const hipsMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.165, 0.15, 0.16, 14),
      trousersMat
    );
    hipsMesh.scale.set(1.08, 1, 0.78);
    hipsMesh.castShadow = true;
    this.pelvis.add(hipsMesh);

    const beltMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.168, 0.168, 0.042, 14),
      beltMat
    );
    beltMesh.scale.set(1.09, 1, 0.79);
    beltMesh.position.y = 0.065;
    this.pelvis.add(beltMesh);

    // 2. Spine & Torso (Badan Seragam Batik Marun Berbentuk Anatomis Bahu-Pinggang)
    this.spine = new THREE.Group();
    this.spine.position.y = 0.07;
    this.pelvis.add(this.spine);

    // Profil torso utuh dari ujung bawah kemeja batik hingga bahu agar motif batik menyambung mulus tanpa sambungan
    const torsoPoints = [
      new THREE.Vector2(0.172, -0.035),
      new THREE.Vector2(0.162, 0.06),
      new THREE.Vector2(0.166, 0.2),
      new THREE.Vector2(0.194, 0.36),
      new THREE.Vector2(0.206, 0.46),
      new THREE.Vector2(0.09, 0.51)
    ];
    const torsoGeo = new THREE.LatheGeometry(torsoPoints, 18);
    this.chestMesh = new THREE.Mesh(torsoGeo, batikMat);
    this.chestMesh.scale.set(1.06, 1.0, 0.68);
    this.chestMesh.castShadow = true;
    this.chestMesh.receiveShadow = true;
    this.spine.add(this.chestMesh);

    // Kerah Kemeja Batik Lipat
    const collarRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.088, 0.022, 8, 14, Math.PI * 1.45),
      batikMat
    );
    collarRing.rotation.x = Math.PI / 2 + 0.15;
    collarRing.rotation.z = -Math.PI * 0.22;
    collarRing.position.set(0, 0.49, 0.01);
    this.spine.add(collarRing);

    // 3. Tas Ransel Sekolah Hitam Detail + Tali Bahu Melingkari Pundak
    this.backpack = new THREE.Group();
    this.backpack.position.set(0, 0.27, 0.155);

    const bagBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.15), backpackMat);
    bagBody.castShadow = true;
    const bagTopArch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.15, 12, 1, false, 0, Math.PI),
      backpackMat
    );
    bagTopArch.rotation.z = Math.PI / 2;
    bagTopArch.rotation.y = Math.PI / 2;
    bagTopArch.position.y = 0.2;

    const bagPocket = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.21, 0.055), backpackMat);
    bagPocket.position.set(0, -0.07, 0.09);
    bagPocket.castShadow = true;

    const bagZipper = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.014, 0.06), zipperMat);
    bagZipper.position.set(0, 0.03, 0.092);

    this.backpack.add(bagBody, bagTopArch, bagPocket, bagZipper);
    this.spine.add(this.backpack);

    // Tali Ransel Kiri & Kanan di Pundak Depan-Atas
    [-0.125, 0.125].forEach((sx) => {
      const strapTop = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.03, 0.22), backpackMat);
      strapTop.position.set(sx, 0.47, 0.01);
      const strapFront = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.34, 0.025), backpackMat);
      strapFront.position.set(sx, 0.3, -0.118);
      strapFront.rotation.x = 0.08;
      this.spine.add(strapTop, strapFront);
    });

    // 4. Leher, Kepala Proporsional, Wajah Detail & Rambut Alami
    this.neckPivot = new THREE.Group();
    this.neckPivot.position.set(0, 0.49, -0.01);
    this.spine.add(this.neckPivot);

    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.066, 0.1, 12), skinMat);
    neckMesh.position.y = 0.04;
    this.neckPivot.add(neckMesh);

    this.head = new THREE.Group();
    this.head.position.set(0, 0.165, 0);
    this.neckPivot.add(this.head);

    // Bentuk kepala manusia oval proporsional dengan rahang halus
    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.132, 18, 16), skinMat);
    cranium.scale.set(0.92, 1.08, 0.98);
    cranium.castShadow = true;
    this.head.add(cranium);

    // Telinga Kiri & Kanan Proporsional
    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), skinMat);
      ear.scale.set(0.45, 0.95, 0.65);
      ear.position.set(side * 0.122, -0.005, 0.005);
      this.head.add(ear);
    });

    // Wajah Menghadap -Z: Mata, Alis, Hidung & Mulut
    [-0.046, 0.046].forEach((ex) => {
      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.019, 10, 8), eyeWhiteMat);
      sclera.scale.set(1.15, 0.85, 0.55);
      sclera.position.set(ex, 0.015, -0.118);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), irisMat);
      iris.scale.set(1, 1, 0.5);
      iris.position.set(ex, 0.015, -0.126);

      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.009, 0.012), hairMat);
      brow.position.set(ex, 0.042, -0.122);
      brow.rotation.z = ex < 0 ? 0.08 : -0.08;

      this.head.add(sclera, iris, brow);
    });

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.042, 6), skinMat);
    nose.rotation.x = -Math.PI / 2 + 0.25;
    nose.position.set(0, -0.008, -0.134);
    this.head.add(nose);

    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.01, 0.01), lipMat);
    mouth.position.set(0, -0.052, -0.12);
    this.head.add(mouth);

    // Rambut Anak SMA Indonesia Berlapis Alami (Bukan helm kotak)
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.139, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
      hairMat
    );
    hairCap.scale.set(0.95, 1.08, 1.02);
    hairCap.position.set(0, 0.012, 0.008);
    hairCap.rotation.x = -0.14;
    hairCap.castShadow = true;
    this.head.add(hairCap);

    // Tengkuk rambut belakang & poni depan natural
    const hairNape = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), hairMat);
    hairNape.scale.set(1.02, 0.85, 0.7);
    hairNape.position.set(0, -0.025, 0.055);
    this.head.add(hairNape);

    [-0.045, 0.0, 0.05].forEach((fx, i) => {
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.085, 6), hairMat);
      tuft.position.set(fx, 0.095, -0.105);
      tuft.rotation.x = 2.45;
      tuft.rotation.z = (i - 1) * 0.25;
      this.head.add(tuft);
    });

    // 5. Lengan Berartikulasi Penuh (Bahu -> Lengan Atas Batik -> Siku -> Lengan Bawah -> Tangan)
    const createArmChain = (side) => {
      const shoulderPivot = new THREE.Group();
      shoulderPivot.position.set(side * 0.225, 0.435, 0);

      // Lengan Baju Batik Pendek
      const sleeve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.064, 0.058, 0.17, 12),
        batikMat
      );
      sleeve.position.y = -0.075;
      sleeve.rotation.z = side * 0.06;
      sleeve.castShadow = true;

      const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.064, 10, 10), batikMat);
      shoulderPivot.add(shoulderCap, sleeve);

      // Siku (Elbow Pivot)
      const elbowPivot = new THREE.Group();
      elbowPivot.position.set(0, -0.22, 0);
      const upperSkin = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.042, 0.09, 10), skinMat);
      upperSkin.position.y = -0.175;
      shoulderPivot.add(upperSkin, elbowPivot);

      const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), skinMat);
      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.041, 0.033, 0.21, 10), skinMat);
      forearm.position.y = -0.105;
      forearm.castShadow = true;

      // Telapak Tangan & Ibu Jari
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 8), skinMat);
      hand.scale.set(0.78, 1.15, 0.95);
      hand.position.set(0, -0.23, -0.008);

      elbowPivot.add(elbowJoint, forearm, hand);
      this.spine.add(shoulderPivot);

      return { shoulderPivot, elbowPivot };
    };

    this.leftArm = createArmChain(-1);
    this.rightArm = createArmChain(1);

    // 6. Kaki Berartikulasi Penuh (Pinggul -> Paha -> Lutut -> Betis -> Sepatu Kets Bersol Putih)
    const createLegChain = (side) => {
      const hipPivot = new THREE.Group();
      hipPivot.position.set(side * 0.095, -0.02, 0);

      const thigh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.082, 0.066, 0.39, 12),
        trousersMat
      );
      thigh.position.y = -0.195;
      thigh.castShadow = true;
      hipPivot.add(thigh);

      // Lutut (Knee Pivot - Hanya menekuk ke belakang/+Z)
      const kneePivot = new THREE.Group();
      kneePivot.position.set(0, -0.39, 0);
      const kneeJoint = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), trousersMat);
      kneePivot.add(kneeJoint);

      const calf = new THREE.Mesh(
        new THREE.CylinderGeometry(0.064, 0.052, 0.38, 12),
        trousersMat
      );
      calf.position.y = -0.19;
      calf.castShadow = true;
      kneePivot.add(calf);

      // Pergelangan Kaki & Sepatu Kets Hitam-Putih Detail (Ujung sepatu menghadap -Z)
      const anklePivot = new THREE.Group();
      anklePivot.position.set(0, -0.4, 0);

      // Sol Karet Putih
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.104, 0.034, 0.25), shoeSoleMat);
      sole.position.set(0, -0.072, -0.045);
      sole.castShadow = true;

      // Bodi Kanvas Hitam Sepatu
      const shoeUpper = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.048, 0.12, 6, 10),
        shoeCanvasMat
      );
      shoeUpper.rotation.x = Math.PI / 2;
      shoeUpper.scale.set(1.02, 1.0, 0.86);
      shoeUpper.position.set(0, -0.036, -0.035);
      shoeUpper.castShadow = true;

      // Pelindung Jari Depan Putih (White Toe Cap)
      const toeCap = new THREE.Mesh(new THREE.SphereGeometry(0.049, 10, 8), shoeSoleMat);
      toeCap.scale.set(1.0, 0.62, 1.05);
      toeCap.position.set(0, -0.048, -0.13);

      // Detail Tali Sepatu Putih
      [-0.03, -0.06, -0.09].forEach((lz) => {
        const lace = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.008, 0.012), shoeSoleMat);
        lace.position.set(0, -0.002, lz);
        anklePivot.add(lace);
      });

      anklePivot.add(sole, shoeUpper, toeCap);
      kneePivot.add(anklePivot);
      hipPivot.add(kneePivot);
      this.pelvis.add(hipPivot);

      return { hipPivot, kneePivot, anklePivot };
    };

    this.leftLeg = createLegChain(-1);
    this.rightLeg = createLegChain(1);

    // Aura Indikator Power-up di Lantai
    const shieldGeo = new THREE.RingGeometry(0.62, 0.8, 28);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    this.auraRing = new THREE.Mesh(shieldGeo, shieldMat);
    this.auraRing.rotation.x = -Math.PI / 2;
    this.auraRing.position.y = 0.025;
    this.auraRing.visible = false;
    this.group.add(this.auraRing);
  }

  reset() {
    this.currentLane = 1;
    this.targetX = LANES[1];
    this.group.position.set(0, 0, 0);
    this.y = 0;
    this.velocityY = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.landCompress = 0;
    this.stumbleTimer = 0;
    this.isCaught = false;
    this.runCycle = 0;
    this.stepPhase = 0;
    this.jumpBlend = 0;
    this.slideBlend = 0;
    this.laneBank = 0;
    this.hasSuperJump = false;
    this.hasTurbo = false;
    this.hasMagnet = false;
    this.auraRing.visible = false;

    this.rigRoot.position.set(0, 0, 0);
    this.rigRoot.rotation.set(0, 0, 0);
    this.pelvis.position.set(0, 0.9, 0);
    this.pelvis.rotation.set(0, 0, 0);
    this.spine.rotation.set(0, 0, 0);
    this.head.rotation.set(0, 0, 0);
  }

  moveLeft(audio) {
    if (this.isCaught) return false;
    if (this.currentLane > 0) {
      this.currentLane--;
      this.targetX = LANES[this.currentLane];
      if (audio) audio.playLaneSwitch();
      return true;
    }
    return false;
  }

  moveRight(audio) {
    if (this.isCaught) return false;
    if (this.currentLane < 2) {
      this.currentLane++;
      this.targetX = LANES[this.currentLane];
      if (audio) audio.playLaneSwitch();
      return true;
    }
    return false;
  }

  jump(audio) {
    if (this.isCaught) return false;
    if (!this.isJumping) {
      this.isJumping = true;
      this.isSliding = false;
      this.slideTimer = 0;
      const mult = this.hasSuperJump ? 1.28 : 1.0;
      this.velocityY = this.baseJumpForce * mult;
      if (audio) audio.playJump(this.hasSuperJump);
      return true;
    }
    return false;
  }

  slide(audio) {
    if (this.isCaught) return false;
    if (this.isJumping) {
      this.velocityY = -24;
    }
    this.isSliding = true;
    this.slideTimer = this.slideDuration;
    if (audio) audio.playSlide();
    return true;
  }

  triggerStumble() {
    this.stumbleTimer = 0.55;
  }

  setCaught() {
    this.isCaught = true;
    this.isSliding = false;
  }

  getHitbox() {
    const height = this.isSliding ? 0.85 : 1.72;
    const centerY = this.y + height * 0.5;
    return {
      minX: this.group.position.x - 0.34,
      maxX: this.group.position.x + 0.34,
      minY: this.y,
      maxY: this.y + height,
      minZ: this.group.position.z - 0.28,
      maxZ: this.group.position.z + 0.28,
      centerY
    };
  }

  update(dt, speed, audio) {
    // 1. Perpindahan Jalur Halus + Kemiringan Tubuh Natural (Banking)
    const dx = this.targetX - this.group.position.x;
    this.group.position.x += dx * Math.min(1, dt * 16);
    this.laneBank = THREE.MathUtils.lerp(this.laneBank, -dx * 0.13, Math.min(1, dt * 14));
    this.rigRoot.rotation.z = this.laneBank;
    this.rigRoot.rotation.y = -dx * 0.08;

    // 2. State Tertangkap Pak Wahid
    if (this.isCaught) {
      this.runCycle += dt * 7.5;
      this.y = 0;
      this.group.position.y = 0;
      this.pelvis.position.set(0, 0.9, 0);
      this.pelvis.rotation.set(0, Math.PI, 0); // Berbalik menghadap Pak Wahid dengan ekspresi panik
      this.spine.rotation.set(0.08, 0, 0);

      // Tangan memegang kepala panik
      this.leftArm.shoulderPivot.rotation.set(2.35, 0, -0.38);
      this.leftArm.elbowPivot.rotation.x = 1.65;
      this.rightArm.shoulderPivot.rotation.set(2.35, 0, 0.38);
      this.rightArm.elbowPivot.rotation.x = 1.65;

      this.leftLeg.hipPivot.rotation.x = 0.05;
      this.leftLeg.kneePivot.rotation.x = -0.1;
      this.rightLeg.hipPivot.rotation.x = -0.05;
      this.rightLeg.kneePivot.rotation.x = -0.1;
      this.head.rotation.y = Math.sin(this.runCycle * 1.6) * 0.25;
      return;
    }

    this.pelvis.rotation.y = 0;

    // 3. Fisika Lompatan & Deteksi Pendaratan (Landing Squat)
    const wasInAir = this.isJumping || this.y > 0.02;
    if (this.isJumping || this.y > 0) {
      this.y += this.velocityY * dt;
      this.velocityY += this.gravity * dt;
      if (this.y <= 0) {
        this.y = 0;
        this.velocityY = 0;
        this.isJumping = false;
        if (wasInAir && !this.isSliding) {
          this.landCompress = 0.18;
          if (audio) audio.playStep(true);
        }
      }
    }
    this.rigRoot.position.y = this.y;

    // Bayangan kontak mengecil & memudar proporsional saat melompat tinggi
    if (this.contactShadow) {
      const hScale = Math.max(0.42, 1.0 - this.y * 0.18);
      this.contactShadow.scale.set(hScale, hScale, 1);
      this.contactShadow.material.opacity = Math.max(0.18, 0.9 - this.y * 0.25);
    }

    if (this.landCompress > 0) {
      this.landCompress = Math.max(0, this.landCompress - dt * 1.1);
    }

    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    if (this.stumbleTimer > 0) {
      this.stumbleTimer -= dt;
    }

    // 4. Blending Bobot Animasi (Lari <-> Lompat <-> Meluncur)
    const targetJumpBlend = this.isJumping ? 1.0 : 0.0;
    const targetSlideBlend = this.isSliding && this.y <= 0.08 ? 1.0 : 0.0;
    this.jumpBlend = THREE.MathUtils.lerp(this.jumpBlend, targetJumpBlend, Math.min(1, dt * 16));
    this.slideBlend = THREE.MathUtils.lerp(this.slideBlend, targetSlideBlend, Math.min(1, dt * 18));

    // Kecepatan langkah proporsional terhadap laju lari agar kaki tidak tampak meluncur
    const strideFreq = Math.max(6.5, speed * 0.86);
    this.runCycle += dt * strideFreq;

    const p = this.runCycle;
    const sinP = Math.sin(p);
    const cosP = Math.cos(p);

    // Suara langkah kaki sinkron fase pijakan lantai
    if (!this.isJumping && !this.isSliding && audio) {
      const halfStep = Math.floor(p / Math.PI);
      if (halfStep !== this.stepPhase) {
        this.stepPhase = halfStep;
        audio.playStep(halfStep % 2 === 0);
      }
    }

    // --- POSE DASAR SIKLUS LARI BIOMEKANIS ---
    // Pinggul berayun vertikal 2x per siklus langkah + kompresi lembut saat mendarat
    const runBounce = Math.abs(cosP) * 0.055;
    const squatOffset = Math.sin((this.landCompress / 0.18) * Math.PI) * 0.11;
    let pelvisY = 0.91 + runBounce - squatOffset;
    let spinePitch = -0.17 - Math.abs(sinP) * 0.03 - squatOffset * 0.8; // Condong maju (-Z)
    let spineYaw = -sinP * 0.14; // Torsi bahu berlawanan ayunan kaki
    let pelvisYaw = sinP * 0.1;

    // Kinematika 2-Sendi Kaki Kiri & Kanan (Lutut menekuk ke belakang <= 0)
    const calcLegAngles = (phase) => {
      const s = Math.sin(phase);
      const c = Math.cos(phase);
      // Ayunan paha: maju (+0.78) hingga dorong belakang (-0.64)
      const hipX = s * 0.72 + 0.06;
      // Lutut menekuk tinggi saat kaki diangkat dari belakang menuju depan (c < 0)
      const liftKnee = Math.max(0, -c) * 1.18 + Math.max(0, -s) * 0.32;
      const kneeX = -0.12 - liftKnee - squatOffset * 2.2;
      // Pergelangan kaki mengimbangi agar telapak rata saat menapak dan menjejak saat dorong
      const ankleX = s > 0 ? 0.18 * s : -0.25 * s;
      return { hipX, kneeX, ankleX };
    };

    const lRun = calcLegAngles(p);
    const rRun = calcLegAngles(p + Math.PI);

    // Ayunan Lengan Berlawanan Kaki (Siku selalu menekuk natural maju >= 0.65 rad)
    let lShoulderX = -sinP * 0.72;
    let rShoulderX = sinP * 0.72;
    let lElbowX = 1.05 + Math.max(0, -sinP) * 0.45;
    let rElbowX = 1.05 + Math.max(0, sinP) * 0.45;

    // --- BLENDING POSE MELOMPAT ---
    if (this.jumpBlend > 0.01) {
      const jb = this.jumpBlend;
      const airProgress = THREE.MathUtils.clamp(this.velocityY / 12.0, -1, 1);
      spinePitch = THREE.MathUtils.lerp(spinePitch, -0.12 + airProgress * 0.1, jb);
      spineYaw = THREE.MathUtils.lerp(spineYaw, 0, jb);
      pelvisYaw = THREE.MathUtils.lerp(pelvisYaw, 0, jb);

      // Kaki kanan diangkat atletis di depan, kaki kiri ditekuk di belakang
      lRun.hipX = THREE.MathUtils.lerp(lRun.hipX, -0.32, jb);
      lRun.kneeX = THREE.MathUtils.lerp(lRun.kneeX, -1.15, jb);
      rRun.hipX = THREE.MathUtils.lerp(rRun.hipX, 0.85, jb);
      rRun.kneeX = THREE.MathUtils.lerp(rRun.kneeX, -0.95, jb);

      lShoulderX = THREE.MathUtils.lerp(lShoulderX, 0.85 + airProgress * 0.35, jb);
      rShoulderX = THREE.MathUtils.lerp(rShoulderX, 0.65 + airProgress * 0.35, jb);
      lElbowX = THREE.MathUtils.lerp(lElbowX, 1.15, jb);
      rElbowX = THREE.MathUtils.lerp(rElbowX, 1.25, jb);
    }

    // --- BLENDING POSE MELUNCUR (SLIDE RENDAH BASEBALL/PARKOUR) ---
    if (this.slideBlend > 0.01) {
      const sb = this.slideBlend;
      pelvisY = THREE.MathUtils.lerp(pelvisY, 0.36, sb);
      spinePitch = THREE.MathUtils.lerp(spinePitch, 0.82, sb); // Rebah ke belakang agar lolos kolong palang
      spineYaw = THREE.MathUtils.lerp(spineYaw, 0.22, sb);

      // Kaki kanan lurus meluncur ke depan (-Z), kaki kiri ditekuk di samping bawah
      rRun.hipX = THREE.MathUtils.lerp(rRun.hipX, 1.28, sb);
      rRun.kneeX = THREE.MathUtils.lerp(rRun.kneeX, -0.15, sb);
      lRun.hipX = THREE.MathUtils.lerp(lRun.hipX, 0.55, sb);
      lRun.kneeX = THREE.MathUtils.lerp(lRun.kneeX, -1.55, sb);

      lShoulderX = THREE.MathUtils.lerp(lShoulderX, -0.55, sb);
      rShoulderX = THREE.MathUtils.lerp(rShoulderX, 0.45, sb);
      lElbowX = THREE.MathUtils.lerp(lElbowX, 0.85, sb);
      rElbowX = THREE.MathUtils.lerp(rElbowX, 1.1, sb);
    }

    // Terapkan ke seluruh sendi rig karakter
    this.pelvis.position.y = pelvisY;
    this.pelvis.rotation.y = pelvisYaw;

    this.spine.rotation.x = spinePitch;
    this.spine.rotation.y = spineYaw;

    this.leftLeg.hipPivot.rotation.x = lRun.hipX;
    this.leftLeg.kneePivot.rotation.x = lRun.kneeX;
    this.leftLeg.anklePivot.rotation.x = lRun.ankleX;

    this.rightLeg.hipPivot.rotation.x = rRun.hipX;
    this.rightLeg.kneePivot.rotation.x = rRun.kneeX;
    this.rightLeg.anklePivot.rotation.x = rRun.ankleX;

    this.leftArm.shoulderPivot.rotation.set(lShoulderX, 0, -0.09);
    this.leftArm.elbowPivot.rotation.x = lElbowX;

    this.rightArm.shoulderPivot.rotation.set(rShoulderX, 0, 0.09);
    this.rightArm.elbowPivot.rotation.x = rElbowX;

    // Goyangan lembut tas sekolah mengikuti langkah
    this.backpack.rotation.x = Math.abs(cosP) * 0.045 * (1 - this.slideBlend);
    this.backpack.rotation.z = sinP * 0.035;

    // Stabilisasi Kepala (tetap fokus melihat lorong di depan + reaksi saat tersandung)
    if (this.stumbleTimer > 0) {
      const shake = Math.sin(this.stumbleTimer * 34) * 0.24;
      this.head.rotation.z = shake;
      this.spine.rotation.z = shake * 0.5;
    } else {
      this.head.rotation.x = -spinePitch * 0.55;
      this.head.rotation.y = -spineYaw * 0.65 - dx * 0.1;
      this.head.rotation.z = 0;
      this.spine.rotation.z = 0;
    }

    // Update cincin aura power-up
    if (this.hasTurbo || this.hasMagnet || this.hasSuperJump) {
      this.auraRing.visible = true;
      this.auraRing.rotation.z += dt * 4;
      if (this.hasTurbo) {
        this.auraRing.material.color.setHex(0x38bdf8);
      } else if (this.hasMagnet) {
        this.auraRing.material.color.setHex(0xfacc15);
      } else {
        this.auraRing.material.color.setHex(0x4ade80);
      }
    } else {
      this.auraRing.visible = false;
    }
  }
}
