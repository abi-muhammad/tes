import * as THREE from 'three';
import { LANES } from './player.js';

export const POWERUP_TYPES = {
  MAGNET: {
    id: 'MAGNET',
    label: '🧲 Magnet Koin Kantin',
    duration: 9.0,
    color: 0xfacc15
  },
  SUPER_JUMP: {
    id: 'SUPER_JUMP',
    label: '👟 Sepatu Kecepatan',
    duration: 9.0,
    color: 0x38bdf8
  },
  TURBO: {
    id: 'TURBO',
    label: '🔔 Mode Kabur Turbo',
    duration: 5.5,
    color: 0xf97316
  }
};

export class CollectiblesManager {
  constructor(scene) {
    this.scene = scene;
    this.activeCoins = [];
    this.coinPool = [];
    this.activePowerups = [];

    this.activeBuffs = {
      MAGNET: 0,
      SUPER_JUMP: 0,
      TURBO: 0
    };

    // Material PBR Logam Emas Koin Kantin (Kilau metalik realistis, bukan kuning plastik)
    this.coinOuterGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.075, 18);
    this.coinInnerGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.088, 14);
    this.coinGoldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0x78350f,
      emissiveIntensity: 0.18,
      roughness: 0.26,
      metalness: 0.86
    });
    this.coinInnerMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      roughness: 0.34,
      metalness: 0.78
    });
  }

  acquireCoin() {
    if (this.coinPool.length > 0) {
      const coin = this.coinPool.pop();
      coin.mesh.visible = true;
      coin.collected = false;
      return coin;
    }

    const group = new THREE.Group();
    const outer = new THREE.Mesh(this.coinOuterGeo, this.coinGoldMat);
    outer.rotation.z = Math.PI / 2;
    const inner = new THREE.Mesh(this.coinInnerGeo, this.coinInnerMat);
    inner.rotation.z = Math.PI / 2;
    group.add(outer, inner);

    this.scene.add(group);
    return { mesh: group, collected: false };
  }

  releaseCoin(coin) {
    coin.mesh.visible = false;
    this.coinPool.push(coin);
  }

  // Model 3D Power-up Sesuai Referensi (Sepatu Sport, Magnet/Buku, Lonceng Bel Emas)
  acquirePowerup(typeKey) {
    const group = new THREE.Group();
    const info = POWERUP_TYPES[typeKey];

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.03, 8, 20),
      new THREE.MeshBasicMaterial({ color: info.color })
    );
    group.add(ring);

    if (typeKey === 'SUPER_JUMP') {
      // Model 3D Sepatu Sport Biru Bersol Putih (Sesuai Ikon Power-Up Referensi)
      const sole = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.07, 0.44),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
      );
      sole.position.y = -0.1;
      const shoe = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.1, 0.2, 6, 10),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.42 })
      );
      shoe.rotation.x = Math.PI / 2;
      shoe.position.y = -0.02;
      group.add(sole, shoe);
    } else if (typeKey === 'MAGNET') {
      // Magnet U Merah-Perak Penarik Koin Kantin
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.065, 8, 16, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.35 })
      );
      arch.rotation.z = Math.PI;
      arch.position.y = 0.06;
      const tipL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065, 0.065, 0.12, 8),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25, metalness: 0.85 })
      );
      tipL.position.set(-0.18, 0.12, 0);
      const tipR = tipL.clone();
      tipR.position.x = 0.18;
      group.add(arch, tipL, tipR);
    } else {
      // Lonceng Bel Sekolah Emas / Mode Kabur Turbo (Sesuai Ikon Power-Up Referensi)
      const bellDome = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.24, 0.32, 14),
        this.coinGoldMat
      );
      bellDome.position.y = 0.03;
      const clapper = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.8, roughness: 0.3 })
      );
      clapper.position.y = -0.14;
      group.add(bellDome, clapper);
    }

    this.scene.add(group);
    return { typeKey, mesh: group, collected: false };
  }

  reset() {
    while (this.activeCoins.length > 0) {
      this.releaseCoin(this.activeCoins.pop());
    }
    while (this.activePowerups.length > 0) {
      const p = this.activePowerups.pop();
      p.mesh.visible = false;
      this.scene.remove(p.mesh);
    }
    this.activeBuffs.MAGNET = 0;
    this.activeBuffs.SUPER_JUMP = 0;
    this.activeBuffs.TURBO = 0;
  }

  spawnForPattern(pattern, zPos) {
    const candidateLanes = [0, 1, 2].filter((idx) => pattern[idx] !== 'TALL_LOCKER');
    if (candidateLanes.length === 0) return;

    const chosenLane = candidateLanes[Math.floor(Math.random() * candidateLanes.length)];
    const obsType = pattern[chosenLane];

    const coinCount = 5;
    for (let i = 0; i < coinCount; i++) {
      const coin = this.acquireCoin();
      const offsetZ = (i - 2) * 1.9;
      let y = 0.65;

      if (obsType === 'DESK_CHAIR' || obsType === 'BAG_BOOKS') {
        const arc = Math.cos(((i - 2) / 2.2) * (Math.PI / 2));
        y = 0.65 + arc * 1.45;
      } else if (obsType === 'HIGH_BANNER') {
        y = 0.48;
      }

      coin.mesh.position.set(LANES[chosenLane], y, zPos + offsetZ);
      this.activeCoins.push(coin);
    }

    const freeLanes = [0, 1, 2].filter((idx) => pattern[idx] === null && idx !== chosenLane);
    if (freeLanes.length > 0 && Math.random() < 0.18) {
      const pLane = freeLanes[Math.floor(Math.random() * freeLanes.length)];
      const keys = Object.keys(POWERUP_TYPES);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const p = this.acquirePowerup(randomKey);
      p.mesh.position.set(LANES[pLane], 0.92, zPos);
      this.activePowerups.push(p);
    }
  }

  activateBuff(typeKey, player, teacher) {
    const info = POWERUP_TYPES[typeKey];
    if (!info) return;
    this.activeBuffs[typeKey] = info.duration;

    if (typeKey === 'TURBO' && teacher) {
      teacher.onPlayerTurbo();
    }
    this.syncPlayerFlags(player);
  }

  syncPlayerFlags(player) {
    player.hasMagnet = this.activeBuffs.MAGNET > 0;
    player.hasSuperJump = this.activeBuffs.SUPER_JUMP > 0;
    player.hasTurbo = this.activeBuffs.TURBO > 0;
  }

  getActiveBuffList() {
    const list = [];
    Object.keys(POWERUP_TYPES).forEach((k) => {
      if (this.activeBuffs[k] > 0) {
        list.push({
          label: POWERUP_TYPES[k].label,
          remaining: Math.ceil(this.activeBuffs[k])
        });
      }
    });
    return list;
  }

  update(dt, speed, player, teacher, audio, onCoinCollected, onPowerupCollected) {
    Object.keys(this.activeBuffs).forEach((k) => {
      if (this.activeBuffs[k] > 0) {
        this.activeBuffs[k] = Math.max(0, this.activeBuffs[k] - dt);
      }
    });
    this.syncPlayerFlags(player);

    const moveZ = speed * dt;
    const playerPos = player.group.position;

    for (let i = this.activeCoins.length - 1; i >= 0; i--) {
      const coin = this.activeCoins[i];
      coin.mesh.position.z += moveZ;
      coin.mesh.rotation.y += dt * 4.2;

      if (player.hasMagnet && coin.mesh.position.z > -16 && coin.mesh.position.z < 3) {
        coin.mesh.position.x = THREE.MathUtils.lerp(coin.mesh.position.x, playerPos.x, dt * 11);
        coin.mesh.position.y = THREE.MathUtils.lerp(
          coin.mesh.position.y,
          playerPos.y + 0.9,
          dt * 11
        );
      }

      const dx = Math.abs(coin.mesh.position.x - playerPos.x);
      const dy = Math.abs(coin.mesh.position.y - (playerPos.y + 0.8));
      const dz = Math.abs(coin.mesh.position.z - playerPos.z);

      if (dx < 0.78 && dy < 1.05 && dz < 0.78) {
        this.activeCoins.splice(i, 1);
        this.releaseCoin(coin);
        if (audio) audio.playCoin();
        if (onCoinCollected) onCoinCollected();
        continue;
      }

      if (coin.mesh.position.z > 8) {
        this.activeCoins.splice(i, 1);
        this.releaseCoin(coin);
      }
    }

    for (let i = this.activePowerups.length - 1; i >= 0; i--) {
      const p = this.activePowerups[i];
      p.mesh.position.z += moveZ;
      p.mesh.rotation.y += dt * 3.0;

      const dx = Math.abs(p.mesh.position.x - playerPos.x);
      const dy = Math.abs(p.mesh.position.y - (playerPos.y + 0.85));
      const dz = Math.abs(p.mesh.position.z - playerPos.z);

      if (dx < 0.85 && dy < 1.15 && dz < 0.85) {
        const typeKey = p.typeKey;
        this.activePowerups.splice(i, 1);
        this.scene.remove(p.mesh);

        this.activateBuff(typeKey, player, teacher);
        if (audio) audio.playPowerup();
        if (onPowerupCollected) onPowerupCollected(POWERUP_TYPES[typeKey]);
        continue;
      }

      if (p.mesh.position.z > 8) {
        this.activePowerups.splice(i, 1);
        this.scene.remove(p.mesh);
      }
    }
  }
}
