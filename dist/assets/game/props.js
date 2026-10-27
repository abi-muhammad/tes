import * as THREE from 'three';

// Kumpulan Material & Model 3D Properti Sekolah Realistis (Motor, Kantin, Tanaman, Perabot)
export function createSharedPropMaterials(texLib) {
  const woodLightTex = texLib.getWoodTexture('#9a5b2d');
  const woodDarkTex = texLib.getWoodTexture('#5c3419');
  const contactShadowTex = texLib.getContactShadowTexture();

  return {
    tireRubber: new THREE.MeshStandardMaterial({
      color: 0x1c1e21,
      roughness: 0.88,
      metalness: 0.04
    }),
    alloyRim: new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.32,
      metalness: 0.82
    }),
    chrome: new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.18,
      metalness: 0.92
    }),
    exhaustDark: new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.48,
      metalness: 0.65
    }),
    mattePlastic: new THREE.MeshStandardMaterial({
      color: 0x26272b,
      roughness: 0.82,
      metalness: 0.05
    }),
    vinylSeat: new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.66,
      metalness: 0.06
    }),
    headlampGlass: new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0xbae6fd,
      emissiveIntensity: 0.25,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88
    }),
    taillampRed: new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.25,
      roughness: 0.2,
      metalness: 0.1
    }),
    plateBlack: new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.55
    }),
    woodLight: new THREE.MeshStandardMaterial({
      map: woodLightTex,
      roughness: 0.48,
      metalness: 0.04
    }),
    woodDark: new THREE.MeshStandardMaterial({
      map: woodDarkTex,
      roughness: 0.56,
      metalness: 0.04
    }),
    ironFrame: new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.45,
      metalness: 0.68
    }),
    aluminum: new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.28,
      metalness: 0.82
    }),
    glassClear: new THREE.MeshStandardMaterial({
      color: 0xdbeafe,
      roughness: 0.08,
      metalness: 0.12,
      transparent: true,
      opacity: 0.36
    }),
    stoolRed: new THREE.MeshStandardMaterial({
      color: 0xb91c1c,
      roughness: 0.52
    }),
    stoolBlue: new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.52
    }),
    ceramicPlate: new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.22
    }),
    icedTea: new THREE.MeshStandardMaterial({
      color: 0x92400e,
      roughness: 0.18,
      transparent: true,
      opacity: 0.82
    }),
    orangeDrink: new THREE.MeshStandardMaterial({
      color: 0xea580c,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85
    }),
    trunkBark: new THREE.MeshStandardMaterial({
      color: 0x573b26,
      roughness: 0.92
    }),
    leafDark: new THREE.MeshStandardMaterial({
      color: 0x245832,
      roughness: 0.82
    }),
    leafMid: new THREE.MeshStandardMaterial({
      color: 0x35743e,
      roughness: 0.78
    }),
    leafBright: new THREE.MeshStandardMaterial({
      color: 0x4d8f48,
      roughness: 0.76
    }),
    terracottaPot: new THREE.MeshStandardMaterial({
      color: 0x9a4422,
      roughness: 0.84
    }),
    soil: new THREE.MeshStandardMaterial({
      color: 0x3b2818,
      roughness: 0.95
    }),
    contactShadow: new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false
    })
  };
}

// 1. Model Sepeda Motor Matic Sekolah Indonesia yang Proporsional & Mudah Dikenali
export function createRealisticMotorcycle(mats, bodyColorHex = 0xb91c1c, highDetail = true) {
  const root = new THREE.Group();

  // Bayangan kontak di bawah motor
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 2.05), mats.contactShadow);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.012, 0);
  root.add(shadow);

  // Grup bodi dimiringkan sedikit karena bertumpu pada standar samping (~7 derajat)
  const bike = new THREE.Group();
  bike.rotation.z = 0.11;
  root.add(bike);

  const bodyPaint = new THREE.MeshStandardMaterial({
    color: bodyColorHex,
    roughness: 0.22,
    metalness: 0.22
  });

  // Pembuat roda (Ban Karet + Velg Bintang + Cakram)
  const buildWheel = (withDisc = false) => {
    const wg = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.068, 10, 20), mats.tireRubber);
    tire.rotation.y = Math.PI / 2;
    tire.castShadow = highDetail;
    wg.add(tire);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 10), mats.alloyRim);
    hub.rotation.z = Math.PI / 2;
    wg.add(hub);

    // Palang velg racing (5 palang)
    for (let i = 0; i < 5; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.19, 0.025), mats.alloyRim);
      spoke.rotation.x = (i * Math.PI * 2) / 5;
      wg.add(spoke);
    }

    if (withDisc && highDetail) {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.01, 14), mats.chrome);
      disc.rotation.z = Math.PI / 2;
      disc.position.x = 0.045;
      wg.add(disc);
    }
    return wg;
  };

  // Roda Depan (z = -0.58) & Roda Belakang (z = +0.58)
  const frontWheel = buildWheel(true);
  frontWheel.position.set(0, 0.285, -0.58);
  bike.add(frontWheel);

  const rearWheel = buildWheel(false);
  rearWheel.position.set(0, 0.285, 0.58);
  bike.add(rearWheel);

  // Shockbreaker Depan (Teleskopik miring ke stang)
  [-0.085, 0.085].forEach((fx) => {
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.66, 8), mats.chrome);
    fork.position.set(fx, 0.56, -0.49);
    fork.rotation.x = 0.28;
    bike.add(fork);
  });

  // Spakbor Depan
  const frontFender = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.34), bodyPaint);
  frontFender.position.set(0, 0.53, -0.58);
  frontFender.rotation.x = 0.22;
  bike.add(frontFender);

  // Tameng Depan Aerodinamis (Front Fairing / Legshield)
  const frontShield = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.52, 0.24), bodyPaint);
  frontShield.position.set(0, 0.72, -0.42);
  frontShield.rotation.x = 0.26;
  frontShield.castShadow = highDetail;
  bike.add(frontShield);

  const innerLegShield = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.48, 0.09), mats.mattePlastic);
  innerLegShield.position.set(0, 0.68, -0.32);
  innerLegShield.rotation.x = 0.26;
  bike.add(innerLegShield);

  // Lampu Depan Dual LED
  const headlamp = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.05), mats.headlampGlass);
  headlamp.position.set(0, 0.76, -0.54);
  headlamp.rotation.x = 0.26;
  bike.add(headlamp);

  // Dek Pijakan Kaki (Step-through Floorboard)
  const floorboard = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.48), mats.mattePlastic);
  floorboard.position.set(0, 0.34, -0.04);
  bike.add(floorboard);

  // Bodi Samping Belakang Meruncing
  const underSeatBody = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.3, 0.72), bodyPaint);
  underSeatBody.position.set(0, 0.6, 0.36);
  underSeatBody.rotation.x = 0.08;
  underSeatBody.castShadow = highDetail;
  bike.add(underSeatBody);

  // Jok Motor Dua Tingkat (Contoured Vinyl Seat)
  const seatFront = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.11, 0.38), mats.vinylSeat);
  seatFront.position.set(0, 0.77, 0.2);
  const seatRear = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.36), mats.vinylSeat);
  seatRear.position.set(0, 0.81, 0.52);
  const grabBar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.14), mats.exhaustDark);
  grabBar.position.set(0, 0.84, 0.74);
  bike.add(seatFront, seatRear, grabBar);

  // Lampu Belakang & Spakbor Belakang + Plat Nomor BE (Lampung)
  const tailLight = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.05), mats.taillampRed);
  tailLight.position.set(0, 0.72, 0.74);
  const rearMudguard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.06), mats.mattePlastic);
  rearMudguard.position.set(0, 0.5, 0.78);
  rearMudguard.rotation.x = -0.32;
  const licensePlate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.085, 0.015), mats.plateBlack);
  licensePlate.position.set(0, 0.52, 0.82);
  licensePlate.rotation.x = -0.32;
  bike.add(tailLight, rearMudguard, licensePlate);

  // Batok Stang, Grip, dan Spion Kiri-Kanan
  const headCowling = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.18), bodyPaint);
  headCowling.position.set(0, 1.03, -0.36);
  bike.add(headCowling);

  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.64, 8), mats.exhaustDark);
  handlebar.rotation.z = Math.PI / 2;
  handlebar.position.set(0, 1.03, -0.35);
  bike.add(handlebar);

  if (highDetail) {
    [-1, 1].forEach((side) => {
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 8), mats.tireRubber);
      grip.rotation.z = Math.PI / 2;
      grip.position.set(side * 0.28, 1.03, -0.35);

      const mirrorStalk = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 6), mats.chrome);
      mirrorStalk.position.set(side * 0.22, 1.11, -0.36);
      mirrorStalk.rotation.z = -side * 0.35;

      const mirrorHead = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.065, 0.025), mats.mattePlastic);
      mirrorHead.position.set(side * 0.26, 1.18, -0.36);

      bike.add(grip, mirrorStalk, mirrorHead);
    });
  }

  // Knalpot Samping Kanan + Pelindung Panas Chrome
  const muffler = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.52, 10), mats.exhaustDark);
  muffler.rotation.x = Math.PI / 2 - 0.18;
  muffler.position.set(0.21, 0.36, 0.48);
  const heatShield = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.07, 0.3), mats.chrome);
  heatShield.position.set(0.265, 0.37, 0.48);
  heatShield.rotation.x = -0.18;
  bike.add(muffler, heatShield);

  // Standar Samping (Menumpu ke tanah di sisi kiri)
  const kickstand = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, 0.32, 6), mats.ironFrame);
  kickstand.position.set(-0.18, 0.15, 0.08);
  kickstand.rotation.z = 0.42;
  root.add(kickstand);

  return root;
}

// 2. Meja & Bangku Kantin Sekolah Realistis beserta Peralatan Makan
export function createCanteenTableSet(mats) {
  const group = new THREE.Group();

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.9), mats.contactShadow);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  // Daun Meja Kayu Pernis (Tinggi 0.75m, Lebar 0.72m, Panjang 1.55m)
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.045, 1.55), mats.woodLight);
  tableTop.position.y = 0.75;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  group.add(tableTop);

  // Rangka Besi Hollow Hitam Meja
  [-0.31, 0.31].forEach((tx) => {
    [-0.68, 0.68].forEach((tz) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.74, 0.04), mats.ironFrame);
      leg.position.set(tx, 0.37, tz);
      group.add(leg);
    });
  });

  // Dua Bangku Panjang Kayu di Sisi Kiri & Kanan Meja
  [-0.56, 0.56].forEach((bx) => {
    const benchTop = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.035, 1.45), mats.woodDark);
    benchTop.position.set(bx, 0.45, 0);
    benchTop.castShadow = true;
    group.add(benchTop);

    [-0.58, 0.58].forEach((bz) => {
      const bLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.44, 0.035), mats.ironFrame);
      bLeg.position.set(bx, 0.22, bz);
      group.add(bLeg);
    });
  });

  // Detail di Atas Meja Kantin: Piring, Gelas Es Teh, Tempat Tisu & Botol Saus/Kecap
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.07, 0.025, 12), mats.ceramicPlate);
  plate.position.set(-0.12, 0.785, -0.3);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.034, 0.13, 10), mats.icedTea);
  glass.position.set(0.14, 0.835, -0.22);
  const sauceBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.16, 8), mats.stoolRed);
  sauceBottle.position.set(0.05, 0.85, 0.35);
  const soyBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.15, 8), mats.plateBlack);
  soyBottle.position.set(-0.04, 0.845, 0.38);

  group.add(plate, glass, sauceBottle, soyBottle);
  return group;
}

// 3. Meja Pelayanan & Etalase Kaca Makanan Kantin Sekolah
export function createCanteenStallCounter(mats) {
  const group = new THREE.Group();

  // Meja Counter Pelayanan
  const counterBase = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.86, 2.8), mats.woodDark);
  counterBase.position.y = 0.43;
  counterBase.castShadow = true;
  counterBase.receiveShadow = true;

  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.05, 2.88), mats.ceramicPlate);
  counterTop.position.y = 0.885;
  group.add(counterBase, counterTop);

  // Etalase Kaca Aluminium Makanan
  const etalaseGroup = new THREE.Group();
  etalaseGroup.position.set(-0.1, 1.24, -0.45);

  const glassBox = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.68, 1.35), mats.glassClear);
  etalaseGroup.add(glassBox);

  // Bingkai Aluminium Etalase
  [
    [-0.26, -0.67],
    [0.26, -0.67],
    [-0.26, 0.67],
    [0.26, 0.67]
  ].forEach(([ex, ez]) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.7, 0.03), mats.aluminum);
    post.position.set(ex, 0, ez);
    etalaseGroup.add(post);
  });

  // Rak Kaca Tengah + Nampan Makanan di dalam Etalase
  const midShelf = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.015, 1.3), mats.aluminum);
  etalaseGroup.add(midShelf);

  [-0.36, 0.36].forEach((tz) => {
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.46), mats.aluminum);
    tray.position.set(0, -0.26, tz);
    const foodPile = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.09, 0.36),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 })
    );
    foodPile.position.set(0, -0.2, tz);
    etalaseGroup.add(tray, foodPile);
  });
  group.add(etalaseGroup);

  // Dispenser / Toples Es Jeruk & Es Teh Jumbo di sebelahnya
  const jarTea = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.15, 0.42, 12), mats.icedTea);
  jarTea.position.set(-0.08, 1.12, 0.62);
  const jarLid1 = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 12), mats.stoolBlue);
  jarLid1.position.set(-0.08, 1.35, 0.62);

  const jarOrange = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.15, 0.42, 12), mats.orangeDrink);
  jarOrange.position.set(-0.08, 1.12, 1.04);
  const jarLid2 = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 12), mats.stoolRed);
  jarLid2.position.set(-0.08, 1.35, 1.04);

  group.add(jarTea, jarLid1, jarOrange, jarLid2);
  return group;
}

// 4. Pepohonan Tropis Alami dengan Variasi Siluet & LOD Jarak Jauh
export function createTropicalTree(mats, seed = 1, isDistantLOD = false) {
  const g = new THREE.Group();
  const s1 = ((seed * 37) % 100) / 100;
  const s2 = ((seed * 73) % 100) / 100;

  const trunkHeight = 3.2 + s1 * 1.9;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.28, trunkHeight, isDistantLOD ? 5 : 8),
    mats.trunkBark
  );
  trunk.position.y = trunkHeight * 0.5;
  trunk.rotation.z = (s2 - 0.5) * 0.12;
  trunk.castShadow = !isDistantLOD;
  g.add(trunk);

  const leafMaterials = [mats.leafDark, mats.leafMid, mats.leafBright];

  if (isDistantLOD) {
    // LOD sederhana untuk pohon jauh
    const crown = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.65 + s1 * 0.55, 0),
      leafMaterials[seed % 3]
    );
    crown.scale.set(1.15, 0.82, 1.1);
    crown.position.y = trunkHeight + 0.7;
    g.add(crown);
    return g;
  }

  // Cabang organik + 5 gugus tajuk daun berlapis agar siluet tampak alami & tidak identik
  [-1, 1].forEach((dir, idx) => {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 1.3, 6), mats.trunkBark);
    branch.position.set(dir * 0.42, trunkHeight - 0.35 + idx * 0.2, (s1 - 0.5) * 0.3);
    branch.rotation.z = -dir * 0.62;
    g.add(branch);
  });

  const offsets = [
    [0, 0.85, 0, 1.45],
    [-0.95, 0.35, 0.45, 1.15],
    [0.92, 0.42, -0.35, 1.18],
    [0.25, 0.5, 0.85, 1.05],
    [-0.35, 0.45, -0.82, 1.08]
  ];

  offsets.forEach(([ox, oy, oz, rad], idx) => {
    const puff = new THREE.Mesh(
      new THREE.DodecahedronGeometry(rad * (0.9 + s2 * 0.22), 1),
      leafMaterials[(seed + idx) % 3]
    );
    puff.scale.set(1.12, 0.78, 1.06);
    puff.position.set(ox, trunkHeight + oy, oz);
    puff.castShadow = idx < 2;
    g.add(puff);
  });

  return g;
}

// 5. Pot Tanaman Koridor Sekolah (Lidah Mertua / Palem Hias Depan Kelas)
export function createSchoolPottedPlant(mats) {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.36, 10), mats.terracottaPot);
  pot.position.y = 0.18;
  pot.castShadow = true;

  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.23, 0.05, 10), mats.terracottaPot);
  rim.position.y = 0.35;

  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 10), mats.soil);
  soil.position.y = 0.34;
  g.add(pot, rim, soil);

  // Daun tanaman hias tegak menyebar alami
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2;
    const h = 0.46 + (i % 3) * 0.11;
    const blade = new THREE.Mesh(
      new THREE.ConeGeometry(0.055, h, 4),
      i % 2 === 0 ? mats.leafMid : mats.leafBright
    );
    blade.position.set(Math.cos(angle) * 0.07, 0.35 + h * 0.45, Math.sin(angle) * 0.07);
    blade.rotation.z = -Math.cos(angle) * 0.22;
    blade.rotation.x = Math.sin(angle) * 0.22;
    g.add(blade);
  }
  return g;
}
