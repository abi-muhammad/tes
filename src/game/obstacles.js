import * as THREE from 'three';
import { LANES } from './player.js';

export class ObstacleManager {
  constructor(scene, texLib) {
    this.scene = scene;
    this.texLib = texLib;
    this.activeObstacles = [];
    this.pool = [];
    this.spawnTimer = 0;

    this.initMaterials();
  }

  initMaterials() {
    const woodLightTex = this.texLib ? this.texLib.getWoodTexture('#9c5d30') : null;
    const woodDarkTex = this.texLib ? this.texLib.getWoodTexture('#693b1c') : null;
    const shadowTex = this.texLib ? this.texLib.getContactShadowTexture() : null;

    this.woodDeskMat = new THREE.MeshStandardMaterial({
      color: woodLightTex ? 0xffffff : 0x9c5d30,
      map: woodLightTex,
      roughness: 0.48,
      metalness: 0.04
    });

    this.woodDarkMat = new THREE.MeshStandardMaterial({
      color: woodDarkTex ? 0xffffff : 0x693b1c,
      map: woodDarkTex,
      roughness: 0.58,
      metalness: 0.04
    });

    this.ironPipeMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.42,
      metalness: 0.72
    });

    this.bagCanvasMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.86
    });

    this.binPlasticMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.52
    });

    this.wetConeYellowMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.44
    });

    this.bookBlueMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.68
    });

    this.paperMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.8
    });

    this.cabinetSteelMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.38,
      metalness: 0.62
    });

    this.glassMat = new THREE.MeshStandardMaterial({
      color: 0xdbeafe,
      roughness: 0.1,
      metalness: 0.18,
      transparent: true,
      opacity: 0.45
    });

    this.goldTrophyMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.85
    });

    this.bannerSignMat = this.texLib
      ? new THREE.MeshStandardMaterial({
          map: this.texLib.createSignboardTexture({
            title: 'AWAS LANTAI DIPEL',
            subtitle: 'PIKET KEBERSIHAN • MERUNDUK LEWAT BAWAH',
            bg: '#b45309',
            fg: '#ffffff',
            border: '#fef08a',
            accent: '#fef08a',
            width: 512,
            height: 192
          }),
          roughness: 0.55
        })
      : new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.6 });

    this.contactShadowMat = shadowTex
      ? new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
      : null;
  }

  addGroundShadow(group, w, d) {
    if (!this.contactShadowMat) return;
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), this.contactShadowMat);
    sh.rotation.x = -Math.PI / 2;
    sh.position.y = 0.01;
    group.add(sh);
  }

  createObstacleMesh(type) {
    const group = new THREE.Group();
    let minY = 0;
    let maxY = 1.0;
    let isSolidWall = false;

    if (type === 'DESK_CHAIR') {
      // Meja Belajar Kayu Sekolah + Laci Bawah + Kursi Kayu & Buku Paket
      this.addGroundShadow(group, 1.75, 1.25);

      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.055, 0.72), this.woodDeskMat);
      deskTop.position.set(0, 0.78, -0.08);
      deskTop.castShadow = true;
      deskTop.receiveShadow = true;

      const drawerBox = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.14, 0.58), this.woodDarkMat);
      drawerBox.position.set(0, 0.68, -0.08);
      group.add(deskTop, drawerBox);

      [-0.62, 0.62].forEach((lx) => {
        [-0.36, 0.2].forEach((lz) => {
          const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.028, 0.025, 0.76, 8),
            this.ironPipeMat
          );
          leg.position.set(lx, 0.38, lz);
          leg.castShadow = true;
          group.add(leg);
        });
      });

      // Kursi Kayu Sekolah di Depan/Belakang Meja
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.44), this.woodDarkMat);
      seat.position.set(0.22, 0.46, 0.36);
      const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.38, 0.04), this.woodDarkMat);
      backrest.position.set(0.22, 0.72, 0.56);
      backrest.castShadow = true;
      [-0.2, 0.2].forEach((cx) => {
        [-0.18, 0.18].forEach((cz) => {
          const cLeg = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.46, 0.038), this.woodDarkMat);
          cLeg.position.set(0.22 + cx, 0.23, 0.36 + cz);
          group.add(cLeg);
        });
      });

      // Buku Paket di Atas Meja
      const bookCover = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.22), this.bookBlueMat);
      bookCover.position.set(-0.28, 0.83, -0.08);
      const bookPages = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.2), this.paperMat);
      bookPages.position.set(-0.27, 0.83, -0.08);

      group.add(seat, backrest, bookCover, bookPages);
      minY = 0;
      maxY = 0.96;
    } else if (type === 'BAG_BOOKS') {
      // Tas Sekolah + Tempat Sampah Plastik + Kerucut Kuning "Awas Licin" (Sesuai Referensi Gameplay)
      this.addGroundShadow(group, 1.65, 1.05);

      // Tempat Sampah Sekolah dengan Tutup Ayun
      const binBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.17, 0.62, 12),
        this.binPlasticMat
      );
      binBody.position.set(0.38, 0.31, -0.06);
      binBody.castShadow = true;
      const binLid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.235, 0.23, 0.09, 12),
        this.wetConeYellowMat
      );
      binLid.position.set(0.38, 0.66, -0.06);

      // Tas Ransel Tergeletak di Lantai
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.28), this.bagCanvasMat);
      bag.position.set(-0.34, 0.24, 0.05);
      bag.rotation.z = 0.14;
      bag.castShadow = true;

      // Kerucut Peringatan Kuning Lantai Licin
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.62, 4),
        this.wetConeYellowMat
      );
      cone.position.set(-0.02, 0.31, -0.12);
      cone.rotation.y = Math.PI / 4;
      cone.castShadow = true;

      group.add(binBody, binLid, bag, cone);
      minY = 0;
      maxY = 0.82;
    } else if (type === 'HIGH_BANNER') {
      // Palang Rangka Besi & Papan Peringatan Tinggi (Dilewati dengan Meluncur/Slide di Kolongnya)
      this.addGroundShadow(group, 1.9, 0.65);

      [-0.82, 0.82].forEach((px) => {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.045, 2.32, 10),
          this.ironPipeMat
        );
        pole.position.set(px, 1.16, 0);
        pole.castShadow = true;

        const baseFoot = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.05, 0.46),
          this.ironPipeMat
        );
        baseFoot.position.set(px, 0.025, 0);
        group.add(pole, baseFoot);
      });

      const topCrossbar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 1.74, 10),
        this.ironPipeMat
      );
      topCrossbar.rotation.z = Math.PI / 2;
      topCrossbar.position.set(0, 2.26, 0);

      const bannerBoard = new THREE.Mesh(
        new THREE.BoxGeometry(1.62, 0.92, 0.1),
        this.bannerSignMat
      );
      bannerBoard.position.set(0, 1.68, 0);
      bannerBoard.castShadow = true;

      group.add(topCrossbar, bannerBoard);
      // Kolong y = 0 s/d 1.12 bebas dilewati saat meluncur (tinggi slide = 0.85)
      minY = 1.12;
      maxY = 2.3;
    } else if (type === 'TALL_LOCKER') {
      // Lemari Piala / Arsip Kaca Sekolah Tinggi (Wajib Pindah Jalur)
      this.addGroundShadow(group, 1.65, 1.05);

      const cabinet = new THREE.Mesh(
        new THREE.BoxGeometry(1.38, 2.28, 0.72),
        this.cabinetSteelMat
      );
      cabinet.position.y = 1.14;
      cabinet.castShadow = true;
      cabinet.receiveShadow = true;

      const glassDoor = new THREE.Mesh(
        new THREE.BoxGeometry(1.22, 1.25, 0.75),
        this.glassMat
      );
      glassDoor.position.y = 1.52;

      const trophyCup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.07, 0.34, 10),
        this.goldTrophyMat
      );
      trophyCup.position.set(-0.25, 1.42, 0);
      const trophyCup2 = trophyCup.clone();
      trophyCup2.position.x = 0.25;

      group.add(cabinet, glassDoor, trophyCup, trophyCup2);
      minY = 0;
      maxY = 2.32;
      isSolidWall = true;
    }

    return {
      type,
      group,
      minY,
      maxY,
      isSolidWall,
      lane: 1,
      hit: false
    };
  }

  acquireObstacle(type) {
    const idx = this.pool.findIndex((item) => item.type === type);
    if (idx !== -1) {
      const obs = this.pool.splice(idx, 1)[0];
      obs.hit = false;
      obs.group.visible = true;
      obs.group.position.y = 0;
      obs.group.rotation.set(0, 0, 0);
      return obs;
    }
    const created = this.createObstacleMesh(type);
    this.scene.add(created.group);
    return created;
  }

  releaseObstacle(obs) {
    obs.group.visible = false;
    this.pool.push(obs);
  }

  reset() {
    while (this.activeObstacles.length > 0) {
      const obs = this.activeObstacles.pop();
      this.releaseObstacle(obs);
    }
    this.spawnTimer = 0.6;
  }

  spawnPattern(zPos, collectiblesManager) {
    const patterns = [
      ['DESK_CHAIR', null, null],
      [null, 'DESK_CHAIR', null],
      [null, null, 'BAG_BOOKS'],
      [null, 'HIGH_BANNER', null],
      ['HIGH_BANNER', null, 'DESK_CHAIR'],
      ['TALL_LOCKER', 'DESK_CHAIR', null],
      [null, 'HIGH_BANNER', 'TALL_LOCKER'],
      ['BAG_BOOKS', null, 'HIGH_BANNER'],
      ['TALL_LOCKER', null, 'TALL_LOCKER'],
      ['DESK_CHAIR', 'HIGH_BANNER', 'BAG_BOOKS']
    ];

    const pattern = patterns[Math.floor(Math.random() * patterns.length)];

    pattern.forEach((type, laneIdx) => {
      if (!type) return;
      const obs = this.acquireObstacle(type);
      obs.lane = laneIdx;
      obs.group.position.set(LANES[laneIdx], 0, zPos);
      this.activeObstacles.push(obs);
    });

    if (collectiblesManager) {
      collectiblesManager.spawnForPattern(pattern, zPos);
    }
  }

  update(dt, speed, player, collectiblesManager, onCollision) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const interval = Math.max(0.78, 1.58 - (speed - 13) * 0.035);
      this.spawnTimer = interval;
      this.spawnPattern(-82, collectiblesManager);
    }

    const pBox = player.getHitbox();
    const moveZ = speed * dt;

    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const obs = this.activeObstacles[i];
      obs.group.position.z += moveZ;

      if (obs.hit && player.hasTurbo) {
        obs.group.position.y += dt * 10;
        obs.group.rotation.x += dt * 8;
      }

      if (!obs.hit) {
        const obsZ = obs.group.position.z;
        const obsX = obs.group.position.x;

        const overlapZ = obsZ + 0.45 > pBox.minZ && obsZ - 0.45 < pBox.maxZ;
        const overlapX = obsX + 0.68 > pBox.minX && obsX - 0.68 < pBox.maxX;
        const overlapY = obs.maxY > pBox.minY + 0.08 && obs.minY < pBox.maxY - 0.05;

        if (overlapZ && overlapX && overlapY) {
          obs.hit = true;
          if (!player.hasTurbo) {
            onCollision(obs);
          }
        }
      }

      if (obs.group.position.z > 10) {
        this.activeObstacles.splice(i, 1);
        this.releaseObstacle(obs);
      }
    }
  }
}
