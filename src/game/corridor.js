import * as THREE from 'three';
import {
  createSharedPropMaterials,
  createRealisticMotorcycle,
  createCanteenTableSet,
  createCanteenStallCounter,
  createTropicalTree,
  createSchoolPottedPlant
} from './props.js';

const SEGMENT_LENGTH = 20;
const SEGMENT_COUNT = 7;
const CORRIDOR_WIDTH = 8.2; // Jalur pemain di -2.2, 0, +2.2 tetap 100% kompatibel
const CEILING_HEIGHT = 3.95;

// Urutan zona autentik SMA Negeri 1 Pasir Sakti:
// 3 segmen Lorong Kelas -> 2 segmen Area Kantin -> 2 segmen Parkiran Motor
const ZONE_SEQUENCE = [
  'CORRIDOR',
  'CORRIDOR',
  'CORRIDOR',
  'CANTEEN',
  'CANTEEN',
  'PARKING',
  'PARKING'
];

const CLASS_SIGNS = ['XI A1', 'XI A2', 'XI A3', 'XII A1', 'RUANG BK', 'XI A4'];
const MOTOR_COLORS = [0xb91c1c, 0x18181b, 0x1d4ed8, 0xf8fafc, 0x334155, 0x991b1b];

export class CorridorManager {
  constructor(scene, texLib) {
    this.scene = scene;
    this.texLib = texLib;
    this.segments = [];
    this.bystanders = [];
    this.distantProps = [];
    this.highDetailProps = [];
    this.classCounter = 0;

    this.initMaterials();
    this.initSegments();
  }

  initMaterials() {
    const ceramicSet = this.texLib.getCeramicFloorSet();
    const pavingSet = this.texLib.getParkingFloorSet();
    const plasterNorm = this.texLib.getPlasterNormalMap();
    const batikSet = this.texLib.getBatikMaroonSet();

    this.propMats = createSharedPropMaterials(this.texLib);

    // Lantai Keramik Putih Sekolah (PBR: pantulan lembut alami, nat tipis)
    this.ceramicFloorMat = new THREE.MeshStandardMaterial({
      map: ceramicSet.map,
      roughnessMap: ceramicSet.roughnessMap,
      normalMap: ceramicSet.normalMap,
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughness: 1.0,
      metalness: 0.04,
      envMapIntensity: 0.75
    });

    // Lantai Paving Block Parkiran Motor
    this.pavingFloorMat = new THREE.MeshStandardMaterial({
      map: pavingSet.map,
      normalMap: pavingSet.normalMap,
      normalScale: new THREE.Vector2(0.7, 0.7),
      roughness: 0.88,
      metalness: 0.02,
      envMapIntensity: 0.35
    });

    // Dinding Atas Hijau & Dinding Bawah Krem sesuai foto SMA Negeri 1 Pasir Sakti
    this.wallGreenUpperMat = new THREE.MeshStandardMaterial({
      map: this.texLib.getPlasterWallTexture('#357955', false),
      normalMap: plasterNorm,
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughness: 0.86,
      metalness: 0.02
    });

    this.wallCreamLowerMat = new THREE.MeshStandardMaterial({
      map: this.texLib.getPlasterWallTexture('#e7dec8', true),
      normalMap: plasterNorm,
      normalScale: new THREE.Vector2(0.4, 0.4),
      roughness: 0.84,
      metalness: 0.02
    });

    this.plinthDarkMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.8,
      metalness: 0.05
    });

    this.whiteFrameMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.52,
      metalness: 0.05
    });

    this.ceilingGridMat = new THREE.MeshStandardMaterial({
      map: this.texLib.getCeilingGridTexture(),
      roughness: 0.85,
      metalness: 0.02
    });

    this.roofTileMat = new THREE.MeshStandardMaterial({
      color: 0x9a3412,
      roughness: 0.78,
      metalness: 0.05
    });

    this.canopyMetalMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.42,
      metalness: 0.65,
      side: THREE.DoubleSide
    });

    this.gutterMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.5,
      metalness: 0.4
    });

    this.windowGlassMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f,
      roughness: 0.12,
      metalness: 0.25,
      envMapIntensity: 1.2
    });

    this.doormatMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.95
    });

    this.grassMat = new THREE.MeshStandardMaterial({
      color: 0x3f7a38,
      roughness: 0.94
    });

    this.parkingLineMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.75
    });

    this.bystanderBatikMat = new THREE.MeshStandardMaterial({
      map: batikSet.map,
      roughness: 0.85
    });

    // Tekstur Papan Nama Kelas (XI A1, XI A2, dst.)
    this.classSignMaterials = CLASS_SIGNS.map(
      (label) =>
        new THREE.MeshStandardMaterial({
          map: this.texLib.createSignboardTexture({
            title: label,
            subtitle: '',
            bg: '#18181b',
            fg: '#f8fafc',
            border: '#d4d4d8',
            width: 256,
            height: 112
          }),
          roughness: 0.45
        })
    );

    // Papan Nama Sekolah di Taman Luar (Sesuai Foto 4)
    this.schoolLandmarkMat = new THREE.MeshStandardMaterial({
      map: this.texLib.createSignboardTexture({
        title: 'SMA NEGERI 1',
        subtitle: 'PASIR SAKTI',
        bg: '#1e3a8a',
        fg: '#ffffff',
        border: '#93c5fd',
        accent: '#fde047',
        width: 512,
        height: 256
      }),
      roughness: 0.4
    });

    // Papan Kantin & Mading
    this.canteenHeaderMat = new THREE.MeshStandardMaterial({
      map: this.texLib.createSignboardTexture({
        title: 'KANTIN SEKOLAH',
        subtitle: 'SMAN 1 PASIR SAKTI • BERSIH & SEHAT',
        bg: '#235d3a',
        fg: '#fef08a',
        border: '#86efac',
        accent: '#ffffff',
        width: 512,
        height: 160
      }),
      roughness: 0.5
    });

    this.madingBoardMat = new THREE.MeshStandardMaterial({
      map: this.texLib.createSignboardTexture({
        title: 'INFORMASI & TATA TERTIB',
        subtitle: 'Disiplin Waktu • Budayakan 5S',
        bg: '#1e293b',
        fg: '#f8fafc',
        border: '#ca8a04',
        accent: '#fde047',
        width: 512,
        height: 224
      }),
      roughness: 0.55
    });
  }

  initSegments() {
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const zoneType = ZONE_SEQUENCE[i % ZONE_SEQUENCE.length];
      const seg = this.createZoneSegment(zoneType, i);
      seg.group.position.z = -i * SEGMENT_LENGTH;
      this.scene.add(seg.group);
      this.segments.push(seg);
    }
  }

  createZoneSegment(zoneType, index) {
    const group = new THREE.Group();
    const halfW = CORRIDOR_WIDTH / 2; // 4.1m

    // Halaman rumput taman sekolah di sisi kiri luar koridor (terkena sinar matahari langsung)
    const courtyardGround = new THREE.Mesh(
      new THREE.PlaneGeometry(24, SEGMENT_LENGTH),
      this.grassMat
    );
    courtyardGround.rotation.x = -Math.PI / 2;
    courtyardGround.position.set(-halfW - 12, -0.04, 0);
    courtyardGround.receiveShadow = true;
    group.add(courtyardGround);

    // Trotoar / saluran drainase tepi koridor kiri
    const curb = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.14, SEGMENT_LENGTH),
      this.plinthDarkMat
    );
    curb.position.set(-halfW - 0.25, 0.02, 0);
    curb.receiveShadow = true;
    group.add(curb);

    let signMesh = null;

    if (zoneType === 'CORRIDOR') {
      signMesh = this.buildClassroomCorridorZone(group, halfW, index);
    } else if (zoneType === 'CANTEEN') {
      this.buildCanteenZone(group, halfW, index);
    } else {
      this.buildMotorcycleParkingZone(group, halfW, index);
    }

    // Tambahkan vegetasi halaman sekolah & gedung seberang di sisi kiri luar
    this.buildExteriorCampusScenery(group, halfW, index, zoneType);

    return {
      zoneType,
      group,
      signMesh
    };
  }

  // ZONA 1: Koridor Belakang Kelas SMA Negeri 1 Pasir Sakti
  buildClassroomCorridorZone(group, halfW, index) {
    // 1. Lantai Keramik Putih
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(CORRIDOR_WIDTH, SEGMENT_LENGTH),
      this.ceramicFloorMat
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    // Jalur AO kontak tipis di pertemuan lantai dan dinding kanan
    const wallFloorAO = new THREE.Mesh(
      new THREE.PlaneGeometry(0.45, SEGMENT_LENGTH),
      this.propMats.contactShadow
    );
    wallFloorAO.rotation.x = -Math.PI / 2;
    wallFloorAO.position.set(halfW - 0.18, 0.006, 0);
    group.add(wallFloorAO);

    // 2. Plafon Kotak-Kotak + Balok Melintang Hijau + Tritisan Atap & Talang Air
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(CORRIDOR_WIDTH + 0.8, SEGMENT_LENGTH),
      this.ceilingGridMat
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(-0.2, CEILING_HEIGHT, 0);
    group.add(ceiling);

    // Atap Genteng Miring di Atas Plafon + Talang Air Sisi Kiri
    const roofSlope = new THREE.Mesh(
      new THREE.BoxGeometry(CORRIDOR_WIDTH + 1.5, 0.14, SEGMENT_LENGTH),
      this.roofTileMat
    );
    roofSlope.position.set(-0.25, CEILING_HEIGHT + 0.65, 0);
    roofSlope.rotation.z = 0.16;
    roofSlope.castShadow = true;
    group.add(roofSlope);

    const gutter = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.16, SEGMENT_LENGTH),
      this.gutterMat
    );
    gutter.position.set(-halfW - 0.55, CEILING_HEIGHT + 0.02, 0);
    group.add(gutter);

    // Lisplank Hijau Memanjang di Sisi Kiri Atas Tiang
    const leftHeaderBeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.52, SEGMENT_LENGTH),
      this.wallGreenUpperMat
    );
    leftHeaderBeam.position.set(-halfW + 0.12, CEILING_HEIGHT - 0.26, 0);
    leftHeaderBeam.castShadow = true;
    group.add(leftHeaderBeam);

    // 3. Dinding Kelas Kanan (Bawah Krem, Atas Hijau, Plinth Gelap)
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.15, SEGMENT_LENGTH),
      this.plinthDarkMat
    );
    plinth.position.set(halfW, 0.075, 0);

    const lowerCreamWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 1.32, SEGMENT_LENGTH),
      this.wallCreamLowerMat
    );
    lowerCreamWall.position.set(halfW, 0.15 + 0.66, 0);
    lowerCreamWall.receiveShadow = true;

    const midTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.27, 0.07, SEGMENT_LENGTH),
      this.wallGreenUpperMat
    );
    midTrim.position.set(halfW, 1.5, 0);

    const upperGreenWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, CEILING_HEIGHT - 1.53, SEGMENT_LENGTH),
      this.wallGreenUpperMat
    );
    upperGreenWall.position.set(halfW, 1.53 + (CEILING_HEIGHT - 1.53) * 0.5, 0);
    upperGreenWall.receiveShadow = true;

    group.add(plinth, lowerCreamWall, midTrim, upperGreenWall);

    // 4. Tiang Penyangga Konsisten Setiap 5 Meter (Sisi Kiri Terbuka & Pilaster Kanan)
    const columnZPositions = [-7.5, -2.5, 2.5, 7.5];
    columnZPositions.forEach((cz, cIdx) => {
      // Tiang Kolonade Kiri (Bawah Umpak Gelap, Badan Krem, Kepala Hijau)
      const colBase = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.28, 0.46), this.plinthDarkMat);
      colBase.position.set(-halfW + 0.12, 0.14, cz);
      colBase.castShadow = true;
      colBase.receiveShadow = true;

      const colShaft = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 2.75, 0.38),
        this.wallCreamLowerMat
      );
      colShaft.position.set(-halfW + 0.12, 0.28 + 1.375, cz);
      colShaft.castShadow = true;
      colShaft.receiveShadow = true;

      const colCapital = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, CEILING_HEIGHT - 3.03, 0.42),
        this.wallGreenUpperMat
      );
      colCapital.position.set(-halfW + 0.12, 3.03 + (CEILING_HEIGHT - 3.03) * 0.5, cz);
      colCapital.castShadow = true;

      // Balok Plafon Melintang Menghubungkan Tiang Kiri ke Dinding Kelas Kanan
      const crossBeam = new THREE.Mesh(
        new THREE.BoxGeometry(CORRIDOR_WIDTH, 0.32, 0.34),
        this.wallGreenUpperMat
      );
      crossBeam.position.set(0, CEILING_HEIGHT - 0.16, cz);

      // Lampu TL Neon di Plafon
      const tubeLamp = new THREE.Mesh(
        new THREE.BoxGeometry(1.25, 0.05, 0.14),
        new THREE.MeshBasicMaterial({ color: 0xf8fafc })
      );
      tubeLamp.position.set(0, CEILING_HEIGHT - 0.03, cz + 2.5);

      // Pilaster Dinding Kanan
      const rightPilaster = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, CEILING_HEIGHT, 0.36),
        this.wallCreamLowerMat
      );
      rightPilaster.position.set(halfW - 0.04, CEILING_HEIGHT * 0.5, cz);

      group.add(colBase, colShaft, colCapital, crossBeam, tubeLamp, rightPilaster);

      // Pipa Paralon Air Hujan pada salah satu tiang
      if (cIdx === 1) {
        const pipe = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, CEILING_HEIGHT, 8),
          this.gutterMat
        );
        pipe.position.set(-halfW - 0.1, CEILING_HEIGHT * 0.5, cz + 0.16);
        group.add(pipe);
      }
    });

    // Pagar Tembok Rendah & Railing Besi di Antara Tiang Sisi Kiri
    [-5.0, 0.0, 5.0].forEach((rz) => {
      const lowWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.72, 4.62),
        this.wallCreamLowerMat
      );
      lowWall.position.set(-halfW + 0.12, 0.36, rz);
      lowWall.castShadow = true;
      lowWall.receiveShadow = true;

      const coping = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.07, 4.62),
        this.wallGreenUpperMat
      );
      coping.position.set(-halfW + 0.12, 0.755, rz);

      const railBar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 4.62, 6),
        this.propMats.ironFrame
      );
      railBar.rotation.x = Math.PI / 2;
      railBar.position.set(-halfW + 0.12, 0.96, rz);

      group.add(lowWall, coping, railBar);
    });

    // 5. Pintu Kelas, Kusen Putih, Ventilasi Jalusi, Jendela Kaca & Keset
    this.addClassroomDoorAndWindows(group, halfW, -5.0);
    this.addClassroomWindowsBay(group, halfW, 0.0);
    this.addClassroomDoorAndWindows(group, halfW, 5.0);

    // 6. Papan Nama Kelas Menggantung di Balok (XI A1 / XI A2)
    const signMat = this.classSignMaterials[index % this.classSignMaterials.length];
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.38, 0.05), signMat);
    signBoard.position.set(halfW - 0.75, 3.12, -2.5);
    const hanger1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.52, 6),
      this.propMats.ironFrame
    );
    hanger1.position.set(halfW - 1.05, 3.55, -2.5);
    const hanger2 = hanger1.clone();
    hanger2.position.x = halfW - 0.45;
    group.add(signBoard, hanger1, hanger2);

    // 7. Lemari Rak Sepatu Kayu, Papan Informasi, Pot Tanaman & Siswa Penonton
    const shoeRack = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.92, 1.15),
      this.propMats.woodDark
    );
    shoeRack.position.set(halfW - 0.34, 0.46, -0.9);
    shoeRack.castShadow = true;
    group.add(shoeRack);

    const mading = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.95, 1.85), this.madingBoardMat);
    mading.position.set(halfW - 0.15, 1.95, 2.4);
    group.add(mading);

    const potPlant = createSchoolPottedPlant(this.propMats);
    potPlant.position.set(-halfW + 0.48, 0, -2.0);
    group.add(potPlant);
    this.highDetailProps.push(potPlant);

    // Siswa SMA lain berseragam batik marun di pinggir kelas
    const studentWatcher = this.createBystanderStudent(index);
    studentWatcher.group.position.set(halfW - 0.58, 0, 1.6);
    studentWatcher.group.rotation.y = -Math.PI / 2 - 0.25;
    group.add(studentWatcher.group);
    this.bystanders.push(studentWatcher);

    return signBoard;
  }

  addClassroomDoorAndWindows(group, halfW, centerZ) {
    const wallX = halfW - 0.12;

    // Kusen Pintu Putih (Tinggi 2.65m termasuk ventilasi atas, lebar 1.12m)
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 2.68, 1.14),
      this.whiteFrameMat
    );
    doorFrame.position.set(wallX, 1.34, centerZ - 1.15);

    // Daun Pintu Kayu Jati (Tinggi 2.22m, Lebar 0.98m)
    const doorLeaf = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 2.22, 0.98),
      this.propMats.woodDark
    );
    doorLeaf.position.set(wallX - 0.02, 1.11, centerZ - 1.15);

    // Gagang Pintu Logam
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.14, 0.03),
      this.propMats.aluminum
    );
    handle.position.set(wallX - 0.1, 1.05, centerZ - 0.78);

    // Ventilasi Jalusi di Atas Pintu
    const vent = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.32, 0.98),
      this.propMats.woodLight
    );
    vent.position.set(wallX - 0.01, 2.45, centerZ - 1.15);

    // Keset Hitam di Depan Pintu Kelas
    const doormat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.018, 0.92), this.doormatMat);
    doormat.position.set(halfW - 0.45, 0.01, centerZ - 1.15);
    doormat.receiveShadow = true;

    group.add(doorFrame, doorLeaf, handle, vent, doormat);

    // Jendela Kelas 2 Panel di Sebelah Pintu
    const winFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 1.75, 1.78),
      this.whiteFrameMat
    );
    winFrame.position.set(wallX, 1.82, centerZ + 0.78);

    const glassPane = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 1.32, 1.62),
      this.windowGlassMat
    );
    glassPane.position.set(wallX - 0.01, 1.68, centerZ + 0.78);

    const mullion = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 1.36, 0.06),
      this.whiteFrameMat
    );
    mullion.position.set(wallX - 0.01, 1.68, centerZ + 0.78);

    const winVent = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.26, 1.62),
      this.propMats.woodLight
    );
    winVent.position.set(wallX - 0.01, 2.54, centerZ + 0.78);

    group.add(winFrame, glassPane, mullion, winVent);
  }

  addClassroomWindowsBay(group, halfW, centerZ) {
    const wallX = halfW - 0.12;
    const winFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 1.75, 3.4),
      this.whiteFrameMat
    );
    winFrame.position.set(wallX, 1.82, centerZ);

    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 1.32, 3.2),
      this.windowGlassMat
    );
    glass.position.set(wallX - 0.01, 1.68, centerZ);

    [-0.55, 0.55].forEach((mz) => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.36, 0.06), this.whiteFrameMat);
      bar.position.set(wallX - 0.01, 1.68, centerZ + mz);
      group.add(bar);
    });

    const vent = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.26, 3.2),
      this.propMats.woodLight
    );
    vent.position.set(wallX - 0.01, 2.54, centerZ);

    group.add(winFrame, glass, vent);
  }

  // ZONA 2: Area Kantin Sekolah (Sesuai Foto Referensi Kantin SMAN 1 Pasir Sakti)
  buildCanteenZone(group, halfW, index) {
    // Lantai Keramik melebar ke area ruang makan kantin di sisi kanan (+6.5m)
    const mainFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(CORRIDOR_WIDTH + 6.4, SEGMENT_LENGTH),
      this.ceramicFloorMat
    );
    mainFloor.rotation.x = -Math.PI / 2;
    mainFloor.position.x = 3.2;
    mainFloor.receiveShadow = true;
    group.add(mainFloor);

    // Plafon & Atap Paviliun Kantin Lebar
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(CORRIDOR_WIDTH + 6.8, SEGMENT_LENGTH),
      this.ceilingGridMat
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(3.2, CEILING_HEIGHT, 0);
    group.add(ceiling);

    // Gerbang Balok Hijau Bertuliskan "KANTIN SEKOLAH"
    if (index % 2 === 1) {
      const archBeam = new THREE.Mesh(
        new THREE.BoxGeometry(CORRIDOR_WIDTH, 0.65, 0.36),
        this.wallGreenUpperMat
      );
      archBeam.position.set(0, CEILING_HEIGHT - 0.35, 8.5);

      const canteenSign = new THREE.Mesh(
        new THREE.BoxGeometry(3.8, 0.78, 0.08),
        this.canteenHeaderMat
      );
      canteenSign.position.set(0, CEILING_HEIGHT - 0.42, 8.7);
      group.add(archBeam, canteenSign);
    }

    // Tiang Paviliun Kantin Kiri & Kanan
    [-6.5, 0, 6.5].forEach((cz) => {
      [-halfW + 0.12, halfW + 0.2].forEach((cx) => {
        const col = new THREE.Mesh(
          new THREE.BoxGeometry(0.38, CEILING_HEIGHT, 0.38),
          this.wallCreamLowerMat
        );
        col.position.set(cx, CEILING_HEIGHT * 0.5, cz);
        col.castShadow = true;
        const cap = new THREE.Mesh(
          new THREE.BoxGeometry(0.44, 0.55, 0.44),
          this.wallGreenUpperMat
        );
        cap.position.set(cx, CEILING_HEIGHT - 0.28, cz);
        group.add(col, cap);
      });
    });

    // Dinding Belakang Kios Kantin di x = halfW + 6.2
    const stallBackWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, CEILING_HEIGHT, SEGMENT_LENGTH),
      this.wallCreamLowerMat
    );
    stallBackWall.position.set(halfW + 6.2, CEILING_HEIGHT * 0.5, 0);
    group.add(stallBackWall);

    // Meja Pelayanan Penjual + Etalase Makanan Kaca Aluminium + Toples Minuman
    [-4.8, 4.8].forEach((sz) => {
      const counter = createCanteenStallCounter(this.propMats);
      counter.position.set(halfW + 4.9, 0, sz);
      group.add(counter);
      this.highDetailProps.push(counter);
    });

    // Deretan Meja & Bangku Makan Kantin yang Proporsional (di area kanan jalur lari)
    [-6.0, -1.8, 2.6, 6.8].forEach((tz, idx) => {
      const tableSet = createCanteenTableSet(this.propMats);
      tableSet.position.set(halfW + 1.85 + (idx % 2) * 0.55, 0, tz);
      group.add(tableSet);
    });

    // Kursi Plastik & Meja Kecil di Sisi Tepi Kiri Kantin
    const sideBench = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.46, 2.2),
      this.propMats.woodLight
    );
    sideBench.position.set(-halfW + 0.42, 0.23, 2.5);
    sideBench.castShadow = true;
    group.add(sideBench);
  }

  // ZONA 3: Area Parkiran Sepeda Motor Siswa & Guru (Sesuai Foto Referensi Parkiran)
  buildMotorcycleParkingZone(group, halfW, index) {
    const lotWidth = CORRIDOR_WIDTH + 6.8;

    // Lantai Paving Block Abu-abu Realistis
    const pavingFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(lotWidth, SEGMENT_LENGTH),
      this.pavingFloorMat
    );
    pavingFloor.rotation.x = -Math.PI / 2;
    pavingFloor.receiveShadow = true;
    group.add(pavingFloor);

    // Garis Marka Parkir Putih di Sisi Kiri & Kanan Jalur Lari
    [-1, 1].forEach((side) => {
      const longLine = new THREE.Mesh(
        new THREE.PlaneGeometry(0.08, SEGMENT_LENGTH - 0.6),
        this.parkingLineMat
      );
      longLine.rotation.x = -Math.PI / 2;
      longLine.position.set(side * (halfW - 0.35), 0.008, 0);
      group.add(longLine);

      for (let pz = -8; pz <= 8; pz += 2.6) {
        const bayTick = new THREE.Mesh(
          new THREE.PlaneGeometry(1.75, 0.06),
          this.parkingLineMat
        );
        bayTick.rotation.x = -Math.PI / 2;
        bayTick.rotation.z = side * 0.45;
        bayTick.position.set(side * (halfW + 0.72), 0.008, pz);
        group.add(bayTick);
      }
    });

    // Kanopi Atap Baja Ringan & Spandek (Tinggi 3.55m dengan kemiringan drainase)
    const canopyRoof = new THREE.Mesh(
      new THREE.BoxGeometry(lotWidth + 0.8, 0.06, SEGMENT_LENGTH),
      this.canopyMetalMat
    );
    canopyRoof.position.set(0, 3.65, 0);
    canopyRoof.rotation.z = 0.06;
    canopyRoof.castShadow = true;
    group.add(canopyRoof);

    // Rangka Baja Ringan & Tiang Pipa Besi Penyangga Kanopi
    [-7.5, -2.5, 2.5, 7.5].forEach((cz) => {
      const truss = new THREE.Mesh(
        new THREE.BoxGeometry(lotWidth + 0.4, 0.14, 0.08),
        this.propMats.ironFrame
      );
      truss.position.set(0, 3.54, cz);
      truss.rotation.z = 0.06;
      group.add(truss);

      [-halfW - 2.6, halfW + 2.6].forEach((px) => {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.065, 0.065, 3.65, 8),
          this.propMats.ironFrame
        );
        pole.position.set(px, 1.82, cz);
        pole.castShadow = true;
        group.add(pole);
      });
    });

    // Barisan Sepeda Motor Matic Proporsional dengan Variasi Warna & Posisi Wajar
    const slotsZ = [-7.8, -5.1, -2.4, 0.4, 3.1, 5.8, 8.2];
    slotsZ.forEach((mz, mIdx) => {
      // Sisi Kanan Parkiran
      const colorRight = MOTOR_COLORS[(index * 3 + mIdx) % MOTOR_COLORS.length];
      const bikeRight = createRealisticMotorcycle(this.propMats, colorRight, mIdx % 2 === 0);
      bikeRight.position.set(halfW + 0.95 + (mIdx % 2) * 0.12, 0, mz);
      bikeRight.rotation.y = -0.62 + (mIdx % 3) * 0.05;
      group.add(bikeRight);
      if (mIdx % 2 === 1) this.highDetailProps.push(bikeRight);

      // Sisi Kiri Parkiran (beberapa petak dikosongkan agar tampak alami seperti parkiran nyata)
      if ((mIdx + index) % 3 !== 0) {
        const colorLeft = MOTOR_COLORS[(index * 5 + mIdx + 2) % MOTOR_COLORS.length];
        const bikeLeft = createRealisticMotorcycle(this.propMats, colorLeft, mIdx % 2 === 0);
        bikeLeft.position.set(-halfW - 0.95, 0, mz + 0.3);
        bikeLeft.rotation.y = Math.PI + 0.58;
        group.add(bikeLeft);
        if (mIdx % 2 === 1) this.highDetailProps.push(bikeLeft);
      }
    });
  }

  // Vegetasi Taman Sekolah & Gedung Seberang SMA Negeri 1 Pasir Sakti (Dengan LOD)
  buildExteriorCampusScenery(group, halfW, index, zoneType) {
    // Semak perdu halaman sekolah di dekat selasar kiri
    [-6.2, 0.5, 6.4].forEach((sz, idx) => {
      const bush = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.68 + (idx % 2) * 0.2, 1),
        idx % 2 === 0 ? this.propMats.leafMid : this.propMats.leafBright
      );
      bush.scale.set(1.3, 0.72, 1.8);
      bush.position.set(-halfW - 1.55 - (zoneType === 'PARKING' ? 2.4 : 0), 0.38, sz);
      bush.castShadow = true;
      group.add(bush);
    });

    // Pohon peneduh dekat koridor (Detail Penuh)
    const nearTree = createTropicalTree(this.propMats, index * 3 + 1, false);
    nearTree.position.set(-halfW - 4.4 - (zoneType === 'PARKING' ? 1.8 : 0), 0, -3.5);
    nearTree.rotation.y = index * 1.1;
    group.add(nearTree);

    // Pohon latar jauh (Menggunakan Model LOD Ringan)
    const farTree = createTropicalTree(this.propMats, index * 7 + 2, true);
    farTree.position.set(-halfW - 11.5, 0, 4.8);
    group.add(farTree);
    this.distantProps.push(farTree);

    // Gedung Sekolah Seberang Halaman + Plang Biru "SMA NEGERI 1 PASIR SAKTI" (Foto 4)
    if (index % 3 === 0) {
      const wing = new THREE.Group();
      wing.position.set(-halfW - 15.5, 0, 0);

      const wingWall = new THREE.Mesh(
        new THREE.BoxGeometry(5.5, 3.6, 13.5),
        this.wallCreamLowerMat
      );
      wingWall.position.y = 1.8;

      const wingBand = new THREE.Mesh(
        new THREE.BoxGeometry(5.6, 0.85, 13.6),
        this.wallGreenUpperMat
      );
      wingBand.position.y = 3.2;

      const wingRoof = new THREE.Mesh(
        new THREE.ConeGeometry(5.8, 2.3, 4),
        this.roofTileMat
      );
      wingRoof.rotation.y = Math.PI / 4;
      wingRoof.scale.set(0.9, 1, 1.9);
      wingRoof.position.y = 4.75;

      // Plang Resmi Biru SMA Negeri 1 Pasir Sakti (Dimiringkan sedikit menghadap arah lari pemain agar mudah terbaca)
      const landmarkGroup = new THREE.Group();
      landmarkGroup.position.set(4.2, 0, 1.5);
      landmarkGroup.rotation.y = 0.48;

      const signPostL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 2.3, 6),
        this.whiteFrameMat
      );
      signPostL.position.set(0, 1.15, -1.1);
      const signPostR = signPostL.clone();
      signPostR.position.z = 1.1;

      const landmarkBoard = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 1.25, 2.55),
        this.schoolLandmarkMat
      );
      landmarkBoard.position.set(0, 2.05, 0);
      landmarkGroup.add(signPostL, signPostR, landmarkBoard);

      wing.add(wingWall, wingBand, wingRoof, landmarkGroup);
      group.add(wing);
      this.distantProps.push(wing);
    }
  }

  createBystanderStudent(seed) {
    const g = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdba379, roughness: 0.72 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x5b6b82, roughness: 0.84 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x17191c, roughness: 0.85 });

    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.65), this.propMats.contactShadow);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    g.add(shadow);

    const legs = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.56, 4, 8), pantsMat);
    legs.position.set(-0.1, 0.42, 0);
    const legsR = legs.clone();
    legsR.position.x = 0.1;

    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.19, 0.38, 4, 10),
      this.bystanderBatikMat
    );
    torso.position.y = 1.05;
    torso.castShadow = true;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), skinMat);
    head.scale.set(0.92, 1.06, 0.96);
    head.position.y = 1.5;

    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62),
      hairMat
    );
    hair.position.set(0, 1.53, -0.01);

    const rightArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.055, 0.38, 4, 8),
      skinMat
    );
    rightArm.position.set(0.25, 1.15, 0);

    g.add(legs, legsR, torso, head, hair, rightArm);
    return { group: g, rightArm, phase: seed * 1.4 };
  }

  // Sesuaikan visibilitas detail sekunder berdasarkan preset grafis (Low/Medium/High/Ultra)
  applyQualityPreset(quality) {
    const showSecondary = quality !== 'low';
    const showDistant = quality === 'medium' || quality === 'high' || quality === 'ultra';
    this.highDetailProps.forEach((obj) => {
      obj.visible = showSecondary;
    });
    this.distantProps.forEach((obj) => {
      obj.visible = showDistant;
    });
  }

  reset() {
    this.classCounter = 0;
    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].group.position.z = -i * SEGMENT_LENGTH;
    }
  }

  update(dt, speed) {
    const moveZ = speed * dt;

    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      seg.group.position.z += moveZ;

      if (seg.group.position.z > SEGMENT_LENGTH) {
        let minZ = Infinity;
        for (let j = 0; j < this.segments.length; j++) {
          if (this.segments[j].group.position.z < minZ) {
            minZ = this.segments[j].group.position.z;
          }
        }
        seg.group.position.z = minZ - SEGMENT_LENGTH;

        if (seg.signMesh) {
          this.classCounter++;
          seg.signMesh.material =
            this.classSignMaterials[this.classCounter % this.classSignMaterials.length];
        }
      }
    }

    const time = performance.now() * 0.0055;
    for (let i = 0; i < this.bystanders.length; i++) {
      const b = this.bystanders[i];
      b.rightArm.rotation.z = 2.45 + Math.sin(time + b.phase) * 0.3;
    }
  }
}
