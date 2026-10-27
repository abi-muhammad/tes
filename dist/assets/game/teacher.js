import * as THREE from 'three';

export const TEACHER_QUOTES = [
  '"Heh! Ngapain keluar ke kamar mandi berdua!"',
  '"Berhenti kamu! Bajunya di masukin!"',
  '"PRIIIT! Habis balikin MBG kok malah santai di belakang kelas!"',
  '"Sini kamu! Rambut kamu kapan mau di cukur!"',
  '"Berhent! Kenapa sepatu kamu warna warni!"',
  '"Awas ya! Ketangkap langsung ke Ruang BK panggian wali!"'
];

export const GAMEOVER_QUOTES = [
  '"Ketangkap kamu! Nongkrong di lorong SMAN 1 Pasir Sakti pas jam pelajaran, ikut Bapak ke Ruang BK!"',
  '"Bapak masih sanggup kejar sampai parkiran motor! Ayo balik ke kelas XI A1!"',
  '"Nongkrong boleh, ketahuan jangan! Sekarang rapikan barisan dan masuk kelas!"',
  '"Mau kabur ke kantin ya?! Jam pelajaran sudah mulai, ayo ikut Pak Wahid sekarang!"'
];

export class Teacher {
  constructor(scene, texLib) {
    this.scene = scene;
    this.texLib = texLib;
    this.group = new THREE.Group();
    this.rigRoot = new THREE.Group();
    this.group.add(this.rigRoot);

    // Sistem jarak kejaran asli tetap dipertahankan 100%
    this.maxDistance = 20;
    this.distance = 12;
    this.runCycle = 0;

    this.buildHumanoidTeacher();
    this.scene.add(this.group);
  }

  buildHumanoidTeacher() {
    const shirtSet = this.texLib ? this.texLib.getWhiteShirtSet() : null;
    const pantsSet = this.texLib ? this.texLib.getTrouserFabricSet('#23272f') : null;
    const shadowTex = this.texLib ? this.texLib.getContactShadowTexture() : null;

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xd6986c,
      roughness: 0.68,
      metalness: 0.02
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.8,
      metalness: 0.04
    });

    // Kemeja Putih Polos Guru (PBR katun rapi dengan normal lipatan kain, tetap terang & mudah dikenali)
    const whiteShirtMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      map: shirtSet ? shirtSet.map : null,
      normalMap: shirtSet ? shirtSet.normalMap : null,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.78,
      metalness: 0.02
    });

    // Celana Panjang Kain Formal Guru (Hitam Keabuan Tua)
    const slacksMat = new THREE.MeshStandardMaterial({
      color: pantsSet ? 0xffffff : 0x23272f,
      map: pantsSet ? pantsSet.map : null,
      roughness: 0.8,
      metalness: 0.03
    });

    // Sabuk Kulit Hitam & Gesper Logam
    const beltMat = new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.42,
      metalness: 0.2
    });

    const buckleMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.25,
      metalness: 0.85
    });

    // Sepatu Pantofel Kulit Hitam Guru
    const dressShoeMat = new THREE.MeshStandardMaterial({
      color: 0x141518,
      roughness: 0.3,
      metalness: 0.15
    });

    const badgeBlackMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35
    });

    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });

    // Bayangan Kontak di Lantai
    if (shadowTex) {
      this.contactShadow = new THREE.Mesh(
        new THREE.PlaneGeometry(1.1, 1.1),
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

    // ==================== RIG HUMANOID PAK WAHID (~1.73m, Sedikit Berisi) ====================
    // 1. Pinggul & Sabuk
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 0.92;
    this.rigRoot.add(this.pelvis);

    const pelvisMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.215, 0.19, 0.18, 16),
      slacksMat
    );
    pelvisMesh.scale.set(1.08, 1.0, 0.88);
    pelvisMesh.castShadow = true;
    this.pelvis.add(pelvisMesh);

    const beltMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.048, 16),
      beltMat
    );
    beltMesh.scale.set(1.09, 1.0, 0.9);
    beltMesh.position.y = 0.075;
    this.pelvis.add(beltMesh);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.052, 0.025), buckleMat);
    buckle.position.set(0, 0.075, -0.2);
    this.pelvis.add(buckle);

    // 2. Torso Berisi & Kemeja Putih Polos Rapi (Dimasukkan ke Celana)
    this.spine = new THREE.Group();
    this.spine.position.set(0, 0.08, 0);
    this.pelvis.add(this.spine);

    const teacherTorsoProfile = [
      new THREE.Vector2(0.04, 0.0),
      new THREE.Vector2(0.222, 0.05),
      new THREE.Vector2(0.238, 0.19), // Bagian perut sedikit berisi yang natural
      new THREE.Vector2(0.232, 0.34),
      new THREE.Vector2(0.238, 0.45), // Bahu bidang guru
      new THREE.Vector2(0.105, 0.53)
    ];
    const torsoMesh = new THREE.Mesh(
      new THREE.LatheGeometry(teacherTorsoProfile, 18),
      whiteShirtMat
    );
    torsoMesh.scale.set(1.06, 1.0, 0.84);
    torsoMesh.position.z = -0.015;
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    this.spine.add(torsoMesh);

    // Jalur Kancing Depan, Saku Kemeja Kiri, dan Papan Nama Dada Kanan
    const placket = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.46, 0.015), whiteShirtMat);
    placket.position.set(0, 0.25, -0.205);
    this.spine.add(placket);

    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.095, 0.014), whiteShirtMat);
    pocket.position.set(0.11, 0.34, -0.195);
    const pocketBadge = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.036, 0.018),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 })
    );
    pocketBadge.position.set(0.11, 0.35, -0.2);

    const nameTag = new THREE.Mesh(new THREE.BoxGeometry(0.092, 0.034, 0.018), badgeBlackMat);
    nameTag.position.set(-0.115, 0.36, -0.195);
    const nameBorder = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.02), buckleMat);
    nameBorder.position.set(-0.115, 0.36, -0.197);

    // Kerah Kemeja Putih Lipat Rapi
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.026, 8, 16, Math.PI * 1.5),
      whiteShirtMat
    );
    collar.rotation.x = Math.PI / 2 + 0.14;
    collar.rotation.z = -Math.PI * 0.25;
    collar.position.set(0, 0.51, -0.01);

    this.spine.add(pocket, pocketBadge, nameTag, nameBorder, collar);

    // 3. Leher, Kepala Proporsional, Rambut Belah Pinggir Rapi & Kumis Khas Pak Wahid
    this.neckPivot = new THREE.Group();
    this.neckPivot.position.set(0, 0.51, -0.01);
    this.spine.add(this.neckPivot);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.082, 0.095, 12), skinMat);
    neck.position.y = 0.035;
    this.neckPivot.add(neck);

    this.head = new THREE.Group();
    this.head.position.set(0, 0.165, 0);
    this.neckPivot.add(this.head);

    const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.142, 18, 16), skinMat);
    headSphere.scale.set(0.98, 1.05, 0.96);
    headSphere.castShadow = true;
    this.head.add(headSphere);

    // Pipi sedikit berisi & Telinga
    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), skinMat);
      ear.scale.set(0.45, 0.95, 0.65);
      ear.position.set(side * 0.136, -0.005, 0.005);
      this.head.add(ear);
    });

    // Mata, Alis Tegas & Hidung
    [-0.048, 0.048].forEach((ex) => {
      const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.019, 10, 8), eyeWhiteMat);
      eyeW.scale.set(1.15, 0.8, 0.55);
      eyeW.position.set(ex, 0.018, -0.126);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), hairMat);
      pupil.position.set(ex, 0.018, -0.134);

      const sternBrow = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.013, 0.015), hairMat);
      sternBrow.position.set(ex, 0.046, -0.13);
      sternBrow.rotation.z = ex < 0 ? -0.18 : 0.18; // Ekspresi tegas mengejar

      this.head.add(eyeW, pupil, sternBrow);
    });

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), skinMat);
    nose.scale.set(0.95, 1.15, 1.15);
    nose.position.set(0, -0.006, -0.14);
    this.head.add(nose);

    // Kumis Tebal Ikonik Pak Wahid (Sesuai Foto Referensi Karakter)
    this.mustache = new THREE.Group();
    this.mustache.position.set(0, -0.042, -0.134);
    const mustCenter = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.022, 0.022), hairMat);
    const mustLeft = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.02, 0.02), hairMat);
    mustLeft.position.set(-0.036, -0.006, 0.004);
    mustLeft.rotation.z = 0.28;
    const mustRight = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.02, 0.02), hairMat);
    mustRight.position.set(0.036, -0.006, 0.004);
    mustRight.rotation.z = -0.28;
    this.mustache.add(mustCenter, mustLeft, mustRight);
    this.head.add(this.mustache);

    // Rambut Hitam Rapi Belah Pinggir Khas Guru (Tanpa Peci, sesuai foto referensi karakter)
    const hairTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.147, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
      hairMat
    );
    hairTop.scale.set(1.0, 1.04, 1.0);
    hairTop.position.set(0, 0.015, 0.01);
    hairTop.rotation.x = -0.18;
    hairTop.castShadow = true;

    const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.125, 12, 10), hairMat);
    hairBack.scale.set(1.05, 0.85, 0.72);
    hairBack.position.set(0, -0.02, 0.055);

    const sideWave = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.08), hairMat);
    sideWave.position.set(0.02, 0.125, -0.065);
    sideWave.rotation.z = -0.12;

    this.head.add(hairTop, hairBack, sideWave);

    // 4. Lengan Kemeja Putih Pendek + Siku & Tangan Berartikulasi
    const createTeacherArm = (side) => {
      const shoulderPivot = new THREE.Group();
      shoulderPivot.position.set(side * 0.265, 0.445, 0);

      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), whiteShirtMat);
      const sleeve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.076, 0.068, 0.19, 12),
        whiteShirtMat
      );
      sleeve.position.y = -0.085;
      sleeve.rotation.z = side * 0.07;
      sleeve.castShadow = true;
      shoulderPivot.add(cap, sleeve);

      const elbowPivot = new THREE.Group();
      elbowPivot.position.set(0, -0.23, 0);

      const upperSkin = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.05, 0.08, 10), skinMat);
      upperSkin.position.y = -0.19;
      shoulderPivot.add(upperSkin, elbowPivot);

      const elbowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), skinMat);
      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.22, 10), skinMat);
      forearm.position.y = -0.11;
      forearm.castShadow = true;

      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.044, 10, 8), skinMat);
      hand.scale.set(0.85, 1.12, 0.95);
      hand.position.set(0, -0.235, -0.01);

      elbowPivot.add(elbowSphere, forearm, hand);
      this.spine.add(shoulderPivot);

      return { shoulderPivot, elbowPivot };
    };

    this.leftArm = createTeacherArm(-1);
    this.rightArm = createTeacherArm(1);

    // 5. Kaki Celana Panjang Kain & Sepatu Pantofel Hitam Berartikulasi Penuh
    const createTeacherLeg = (side) => {
      const hipPivot = new THREE.Group();
      hipPivot.position.set(side * 0.115, -0.02, 0);

      const thigh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.098, 0.08, 0.4, 12),
        slacksMat
      );
      thigh.position.y = -0.2;
      thigh.castShadow = true;
      hipPivot.add(thigh);

      const kneePivot = new THREE.Group();
      kneePivot.position.set(0, -0.4, 0);
      const kneeSphere = new THREE.Mesh(new THREE.SphereGeometry(0.078, 10, 8), slacksMat);
      const calf = new THREE.Mesh(
        new THREE.CylinderGeometry(0.078, 0.066, 0.39, 12),
        slacksMat
      );
      calf.position.y = -0.195;
      calf.castShadow = true;
      kneePivot.add(kneeSphere, calf);

      const anklePivot = new THREE.Group();
      anklePivot.position.set(0, -0.41, 0);

      const shoeBody = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.052, 0.13, 6, 10),
        dressShoeMat
      );
      shoeBody.rotation.x = Math.PI / 2;
      shoeBody.scale.set(1.06, 1.0, 0.82);
      shoeBody.position.set(0, -0.042, -0.04);
      shoeBody.castShadow = true;

      const shoeHeel = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.032, 0.08), dressShoeMat);
      shoeHeel.position.set(0, -0.074, 0.03);

      anklePivot.add(shoeBody, shoeHeel);
      kneePivot.add(anklePivot);
      hipPivot.add(kneePivot);
      this.pelvis.add(hipPivot);

      return { hipPivot, kneePivot, anklePivot };
    };

    this.leftLeg = createTeacherLeg(-1);
    this.rightLeg = createTeacherLeg(1);
  }

  reset() {
    this.distance = 8.5;
    this.runCycle = 0;
    this.group.position.set(0.28, 0, 3.6);
    this.group.rotation.y = 0;
  }

  onPlayerStumble() {
    this.distance = Math.max(0, this.distance - 7.5);
    return this.distance <= 0.5;
  }

  onPlayerTurbo() {
    this.distance = Math.min(this.maxDistance, this.distance + 6.0);
  }

  getRandomQuote() {
    return TEACHER_QUOTES[Math.floor(Math.random() * TEACHER_QUOTES.length)];
  }

  getRandomGameOverQuote() {
    return GAMEOVER_QUOTES[Math.floor(Math.random() * GAMEOVER_QUOTES.length)];
  }

  update(dt, playerX, speed, isGameOver = false) {
    if (isGameOver) {
      // Pose Pak Wahid menangkap & menegur siswa di depan kamera
      this.group.position.x = THREE.MathUtils.lerp(this.group.position.x, playerX + 0.78, dt * 8);
      this.group.position.z = THREE.MathUtils.lerp(this.group.position.z, 0.48, dt * 8);
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, -2.55, dt * 8);

      this.runCycle += dt * 7;
      this.pelvis.position.y = 0.92;
      this.spine.rotation.set(0.04, 0, 0);

      // Tangan kiri berkacak pinggang, tangan kanan menunjuk tegas memberi nasihat
      this.leftArm.shoulderPivot.rotation.set(-0.25, 0, -0.52);
      this.leftArm.elbowPivot.rotation.x = 1.35;

      this.rightArm.shoulderPivot.rotation.set(1.25 + Math.sin(this.runCycle * 1.8) * 0.22, 0, 0.15);
      this.rightArm.elbowPivot.rotation.x = 0.65;

      this.leftLeg.hipPivot.rotation.x = 0.04;
      this.leftLeg.kneePivot.rotation.x = -0.06;
      this.rightLeg.hipPivot.rotation.x = -0.04;
      this.rightLeg.kneePivot.rotation.x = -0.06;

      this.head.rotation.z = Math.sin(this.runCycle * 1.4) * 0.09;
      this.mustache.rotation.z = Math.sin(this.runCycle * 3.5) * 0.06;
      return;
    }

    // Pemulihan jarak aman perlahan saat pemain lari tanpa menabrak
    this.distance = Math.min(this.maxDistance, this.distance + dt * 0.95);

    // Posisi Z di belakang siswa (sedikit bergeser lateral agar siluet kemeja putih Pak Wahid jelas terlihat)
    const targetZ = 1.35 + (this.distance / this.maxDistance) * 5.0;
    const lateralOffset = playerX > 0.2 ? -0.36 : 0.36;
    this.group.position.z = THREE.MathUtils.lerp(this.group.position.z, targetZ, dt * 6);
    this.group.position.x = THREE.MathUtils.lerp(
      this.group.position.x,
      playerX + lateralOffset * (1 - this.distance / 28),
      dt * 6.5
    );
    this.group.rotation.y = 0; // Menghadap ke arah siswa (-Z)

    // Siklus Lari Mengejar Natural (Langkah mantap sesuai kecepatan)
    const strideFreq = Math.max(6.2, speed * 0.84);
    this.runCycle += dt * strideFreq;
    const p = this.runCycle;
    const sinP = Math.sin(p);
    const cosP = Math.cos(p);

    this.pelvis.position.y = 0.92 + Math.abs(cosP) * 0.06;
    this.pelvis.rotation.y = sinP * 0.11;

    // Postur condong maju mengejar
    this.spine.rotation.x = -0.2 - Math.abs(sinP) * 0.03;
    this.spine.rotation.y = -sinP * 0.15;
    this.spine.rotation.z = cosP * 0.04;

    const calcTeacherLeg = (phase) => {
      const s = Math.sin(phase);
      const c = Math.cos(phase);
      return {
        hipX: s * 0.68 + 0.05,
        kneeX: -0.14 - Math.max(0, -c) * 1.12 - Math.max(0, -s) * 0.28,
        ankleX: s > 0 ? 0.16 * s : -0.22 * s
      };
    };

    const lLeg = calcTeacherLeg(p);
    const rLeg = calcTeacherLeg(p + Math.PI);

    this.leftLeg.hipPivot.rotation.x = lLeg.hipX;
    this.leftLeg.kneePivot.rotation.x = lLeg.kneeX;
    this.leftLeg.anklePivot.rotation.x = lLeg.ankleX;

    this.rightLeg.hipPivot.rotation.x = rLeg.hipX;
    this.rightLeg.kneePivot.rotation.x = rLeg.kneeX;
    this.rightLeg.anklePivot.rotation.x = rLeg.ankleX;

    // Ayunan tangan tegas saat mengejar
    this.leftArm.shoulderPivot.rotation.set(-sinP * 0.76, 0, -0.14);
    this.leftArm.elbowPivot.rotation.x = 1.1 + Math.max(0, -sinP) * 0.4;

    this.rightArm.shoulderPivot.rotation.set(sinP * 0.76 + 0.15, 0, 0.14);
    this.rightArm.elbowPivot.rotation.x = 1.15 + Math.max(0, sinP) * 0.4;

    this.head.rotation.x = 0.16;
    this.head.rotation.y = -this.spine.rotation.y * 0.6;
    this.mustache.rotation.z = sinP * 0.04;
  }
}
