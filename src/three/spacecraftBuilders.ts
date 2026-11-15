import * as THREE from 'three';

export interface BuiltSpacecraft {
  group: THREE.Group;
  animatedParts: {
    dish?: THREE.Object3D;
    rotors?: THREE.Object3D[];
    wheels?: THREE.Object3D[];
    plume?: THREE.Object3D;
    beaconLight?: THREE.Mesh;
  };
  dispose: () => void;
}

export const SUPPORTED_3D_MODEL_IDS = new Set([
  'cassini-saturn',
  'lcross',
  'lunar-prospector',
  'apollo-moon-buggies',
  'opportunity-mer-b',
  'spirit-mer-a',
  'voyager-1',
  'voyager-2',
  'voyager',
  'curiosity-msl',
  'curiosity',
  'perseverance-m2020',
  'perseverance',
  'dart-planetary-defense',
  'insight-lander',
  'ingenuity-helicopter',
  'ingenuity',
]);

export function hasDetailedModel(missionId: string): boolean {
  return SUPPORTED_3D_MODEL_IDS.has(missionId);
}

function createSolarTexture(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  const b = document.createElement('canvas');
  b.width = 512;
  b.height = 512;
  const bCtx = b.getContext('2d');

  if (ctx && bCtx) {
    ctx.fillStyle = '#071734';
    ctx.fillRect(0, 0, 512, 512);
    bCtx.fillStyle = '#606060';
    bCtx.fillRect(0, 0, 512, 512);

    // Individual photovoltaic cells + silver busbars
    for (let y = 0; y < 512; y += 32) {
      for (let x = 0; x < 512; x += 64) {
        ctx.fillStyle = (x + y) % 128 === 0 ? '#0d2b5c' : '#10346e';
        ctx.fillRect(x + 3, y + 3, 58, 26);

        // Fine silver finger lines
        ctx.fillStyle = 'rgba(186, 230, 253, 0.35)';
        ctx.fillRect(x + 3, y + 15, 58, 1.5);

        bCtx.fillStyle = '#d4d4d4';
        bCtx.fillRect(x + 3, y + 3, 58, 26);
      }
    }
    // Grid seams
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    for (let x = 0; x <= 512; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
  }

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;

  const bump = new THREE.CanvasTexture(b);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  return { map, bump };
}

function createCrinkledFoilTextures(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  const b = document.createElement('canvas');
  b.width = 512;
  b.height = 512;
  const bCtx = b.getContext('2d');

  if (ctx && bCtx) {
    ctx.fillStyle = '#c98821';
    ctx.fillRect(0, 0, 512, 512);
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 650; i++) {
      const x = (i * 73) % 512;
      const y = (i * 137) % 512;
      const w = 12 + (i % 26);
      const h = 10 + ((i * 3) % 24);
      const bright = i % 3 === 0;
      ctx.fillStyle = bright ? 'rgba(255, 224, 130, 0.28)' : 'rgba(110, 56, 8, 0.28)';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y + (i % 9) - 4);
      ctx.lineTo(x + w * 0.6, y + h);
      ctx.closePath();
      ctx.fill();

      bCtx.fillStyle = bright ? 'rgba(240,240,240,0.42)' : 'rgba(30,30,30,0.42)';
      bCtx.beginPath();
      bCtx.moveTo(x, y);
      bCtx.lineTo(x + w, y + (i % 9) - 4);
      bCtx.lineTo(x + w * 0.6, y + h);
      bCtx.closePath();
      bCtx.fill();
    }
  }

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  const bump = new THREE.CanvasTexture(b);
  return { map, bump };
}

function createMetalPanelTextures(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  const b = document.createElement('canvas');
  b.width = 512;
  b.height = 512;
  const bCtx = b.getContext('2d');

  if (ctx && bCtx) {
    ctx.fillStyle = '#dce2ea';
    ctx.fillRect(0, 0, 512, 512);
    bCtx.fillStyle = '#909090';
    bCtx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    bCtx.strokeStyle = '#303030';
    bCtx.lineWidth = 3;

    for (let x = 0; x <= 512; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
      bCtx.beginPath();
      bCtx.moveTo(x, 0);
      bCtx.lineTo(x, 512);
      bCtx.stroke();
    }
    for (let y = 0; y <= 512; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
      bCtx.beginPath();
      bCtx.moveTo(0, y);
      bCtx.lineTo(512, y);
      bCtx.stroke();
    }

    // Rivets at panel corners
    ctx.fillStyle = '#64748b';
    bCtx.fillStyle = '#f0f0f0';
    for (let x = 16; x < 512; x += 128) {
      for (let y = 16; y < 512; y += 128) {
        for (const [dx, dy] of [
          [0, 0],
          [96, 0],
          [0, 96],
          [96, 96],
        ]) {
          ctx.beginPath();
          ctx.arc(x + dx, y + dy, 3, 0, Math.PI * 2);
          ctx.fill();
          bCtx.beginPath();
          bCtx.arc(x + dx, y + dy, 3, 0, Math.PI * 2);
          bCtx.fill();
        }
      }
    }
  }

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  const bump = new THREE.CanvasTexture(b);
  return { map, bump };
}

export function buildDetailedSpacecraft(modelId: string, maxAnisotropy = 4): BuiltSpacecraft {
  const group = new THREE.Group();
  const animatedParts: BuiltSpacecraft['animatedParts'] = { rotors: [], wheels: [] };
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  const solar = createSolarTexture();
  solar.map.anisotropy = maxAnisotropy;
  const foil = createCrinkledFoilTextures();
  foil.map.anisotropy = maxAnisotropy;
  const panel = createMetalPanelTextures();
  panel.map.anisotropy = maxAnisotropy;
  textures.push(solar.map, solar.bump, foil.map, foil.bump, panel.map, panel.bump);

  const whiteThermalMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: panel.map,
      bumpMap: panel.bump,
      bumpScale: 0.018,
      roughness: 0.42,
      metalness: 0.18,
    }),
  );
  const darkCarbonMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1a202c,
      roughness: 0.65,
      metalness: 0.38,
    }),
  );
  const brushedTitaniumMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x9aa6b8,
      roughness: 0.22,
      metalness: 0.92,
      anisotropy: 0.75,
    }),
  );
  const goldFoilMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: foil.map,
      bumpMap: foil.bump,
      bumpScale: 0.035,
      roughness: 0.28,
      metalness: 0.92,
    }),
  );
  const copperMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd97742,
      roughness: 0.26,
      metalness: 0.94,
    }),
  );
  const solarMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      map: solar.map,
      bumpMap: solar.bump,
      bumpScale: 0.015,
      roughness: 0.2,
      metalness: 0.68,
      clearcoat: 0.65,
      clearcoatRoughness: 0.15,
    }),
  );
  const lensMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      roughness: 0.06,
      metalness: 0.15,
      clearcoat: 1.0,
      ior: 1.6,
    }),
  );
  const dishMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.38,
      metalness: 0.24,
      side: THREE.DoubleSide,
    }),
  );
  const beaconMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.6,
      roughness: 0.2,
    }),
  );

  // Helper: detailed parabolic dish with ribs + feed horn + tripod
  const buildDish = (radius: number, depth: number) => {
    const dishGrp = new THREE.Group();
    const pts = [
      new THREE.Vector2(0.01, 0),
      new THREE.Vector2(radius * 0.32, depth * 0.14),
      new THREE.Vector2(radius * 0.68, depth * 0.48),
      new THREE.Vector2(radius, depth),
    ];
    const dishMesh = new THREE.Mesh(trackGeo(new THREE.LatheGeometry(pts, 40)), dishMat);
    dishGrp.add(dishMesh);

    const rim = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(radius, radius * 0.024, 10, 40)),
      brushedTitaniumMat,
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = depth;
    dishGrp.add(rim);

    // 3 feed-horn tripod struts
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(a) * radius * 0.85, depth * 0.72, Math.sin(a) * radius * 0.85),
        new THREE.Vector3(Math.cos(a) * radius * 0.18, depth * 1.48, Math.sin(a) * radius * 0.18),
        new THREE.Vector3(0, depth * 1.65, 0),
      ]);
      const strut = new THREE.Mesh(
        trackGeo(new THREE.TubeGeometry(curve, 12, radius * 0.018, 6, false)),
        brushedTitaniumMat,
      );
      dishGrp.add(strut);
    }

    const subReflector = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(radius * 0.14, radius * 0.09, depth * 0.24, 16)),
      brushedTitaniumMat,
    );
    subReflector.position.y = depth * 1.65;
    dishGrp.add(subReflector);
    return dishGrp;
  };

  // Helper: detailed rover wheel with rim, hubcap, and 12 chevron grousers
  const buildDetailedWheel = (r: number, w: number, accentMat: THREE.Material) => {
    const wGrp = new THREE.Group();
    const tire = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(r, r, w, 24)),
      darkCarbonMat,
    );
    tire.rotation.z = Math.PI / 2;
    wGrp.add(tire);

    const hub = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(r * 0.56, r * 0.56, w * 1.06, 16)),
      accentMat,
    );
    hub.rotation.z = Math.PI / 2;
    wGrp.add(hub);

    const lug = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(r * 0.2, r * 0.2, w * 1.15, 10)),
      brushedTitaniumMat,
    );
    lug.rotation.z = Math.PI / 2;
    wGrp.add(lug);

    // 10 tread cleats around wheel perimeter
    const cleatGeo = trackGeo(new THREE.BoxGeometry(w * 0.92, 0.025, 0.032));
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const cleat = new THREE.Mesh(cleatGeo, brushedTitaniumMat);
      cleat.position.set(0, Math.cos(a) * (r + 0.008), Math.sin(a) * (r + 0.008));
      cleat.rotation.x = -a;
      wGrp.add(cleat);
    }
    return wGrp;
  };

  // Helper: RTG finned nuclear generator
  const buildRTG = (length: number, radius: number) => {
    const rtg = new THREE.Group();
    const core = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(radius, radius, length, 20)),
      darkCarbonMat,
    );
    rtg.add(core);
    const cap = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(radius * 0.75, radius, length * 0.14, 16)),
      brushedTitaniumMat,
    );
    cap.position.y = length * 0.54;
    rtg.add(cap);
    for (let f = 0; f < 8; f++) {
      const fin = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.02, length * 0.88, radius * 2.7)),
        brushedTitaniumMat,
      );
      fin.rotation.y = (f * Math.PI) / 4;
      rtg.add(fin);
    }
    return rtg;
  };

  const addGroundShadow = (radius: number) => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
      grad.addColorStop(0, 'rgba(0,0,0,0.68)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const sTex = new THREE.CanvasTexture(c);
    textures.push(sTex);
    const shadow = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(radius * 2, radius * 2)),
      trackMat(new THREE.MeshBasicMaterial({ map: sTex, transparent: true, depthWrite: false })),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    group.add(shadow);
  };

  // ==================== MODEL SWITCHING ====================
  if (modelId === 'cassini-saturn') {
    // 1. Main octagonal bus & propellant tank core wrapped in crinkled gold MLI
    const lowerCore = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.76, 0.82, 1.35, 12)),
      goldFoilMat,
    );
    lowerCore.position.y = 0.25;
    group.add(lowerCore);

    const upperEquipment = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.86, 0.78, 0.62, 12)),
      whiteThermalMat,
    );
    upperEquipment.position.y = 1.22;
    group.add(upperEquipment);

    // 2. 4-meter High-Gain Dish Antenna
    const hga = buildDish(1.45, 0.44);
    hga.position.y = 1.54;
    group.add(hga);
    animatedParts.dish = hga;

    // 3. Conical Huygens Probe Shield (Gold/Copper) mounted on flank
    const huygens = new THREE.Mesh(
      trackGeo(new THREE.ConeGeometry(0.78, 0.42, 24)),
      goldFoilMat,
    );
    huygens.rotation.z = Math.PI / 2;
    huygens.position.set(1.02, 0.55, 0);
    group.add(huygens);

    // 4. Twin Main Engine Nozzles + Thermal Micrometeoroid Covers
    for (const xOff of [-0.26, 0.26]) {
      const bell = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.11, 0.24, 0.45, 20, 1, true)),
        brushedTitaniumMat,
      );
      bell.position.set(xOff, -0.62, 0);
      group.add(bell);
    }

    // 5. Three RTG Shades & Canisters at base
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3 + 0.3;
      const rtg = buildRTG(0.65, 0.14);
      rtg.rotation.z = Math.cos(a) * 0.9;
      rtg.rotation.x = -Math.sin(a) * 0.9;
      rtg.position.set(Math.cos(a) * 0.98, -0.25, Math.sin(a) * 0.98);
      group.add(rtg);
    }

    // 6. 11-meter Magnetometer Boom (truss + tip sensor)
    const magBoom = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.03, 0.045, 3.3, 8)),
      brushedTitaniumMat,
    );
    magBoom.rotation.z = Math.PI / 2;
    magBoom.position.set(-2.35, 0.65, 0);
    group.add(magBoom);

    const magSensor = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.22, 0.16, 0.16)),
      goldFoilMat,
    );
    magSensor.position.set(-4.02, 0.65, 0);
    group.add(magSensor);

    // 7. Three RPWS Whip Antennas
    for (const ang of [-0.6, 0, 0.6]) {
      const whip = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.012, 0.016, 2.4, 6)),
        brushedTitaniumMat,
      );
      whip.position.set(0, 0.3, 1.45);
      whip.rotation.x = Math.PI / 2 + ang * 0.5;
      whip.rotation.z = ang;
      group.add(whip);
    }

    // 8. Remote Sensing Pallet (INMS / ISS cameras)
    const sciPallet = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.55, 0.42, 0.55)),
      darkCarbonMat,
    );
    sciPallet.position.set(-0.92, 0.45, 0.42);
    group.add(sciPallet);
    const optic = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.09, 0.09, 0.18, 16)),
      lensMat,
    );
    optic.rotation.z = Math.PI / 2;
    optic.position.set(-1.22, 0.5, 0.42);
    group.add(optic);
  } else if (modelId === 'lcross') {
    // Dual-Stage LCROSS Shepherd + 2.2-ton Spent Centaur Upper Stage
    const centaurGroup = new THREE.Group();
    const tank = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.72, 0.72, 2.45, 32)),
      brushedTitaniumMat,
    );
    centaurGroup.add(tank);

    // Ribbed structural rings along Centaur cylinder
    for (let y = -1.0; y <= 1.0; y += 0.4) {
      const ring = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.73, 0.028, 8, 32)),
        darkCarbonMat,
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      centaurGroup.add(ring);
    }

    // Forward adapter dome + gold foil collar
    const forwardCollar = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.52, 0.72, 0.48, 24)),
      goldFoilMat,
    );
    forwardCollar.position.y = 1.46;
    centaurGroup.add(forwardCollar);

    // RL10 Rocket Engine Bell
    const rl10 = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.18, 0.42, 0.65, 24, 1, true)),
      darkCarbonMat,
    );
    rl10.position.y = -1.52;
    centaurGroup.add(rl10);
    centaurGroup.position.y = -0.55;
    group.add(centaurGroup);

    // LCROSS Shepherd Satellite separating above Centaur
    const shepherd = new THREE.Group();
    const sRing = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.62, 0.62, 0.44, 16)),
      goldFoilMat,
    );
    shepherd.add(sRing);

    const sciDeck = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.78, 0.34, 0.78)),
      whiteThermalMat,
    );
    sciDeck.position.y = 0.38;
    shepherd.add(sciDeck);

    // Twin solar wings on shepherd
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.15, 0.04, 0.48)), solarMat);
      wing.position.set(side * 1.15, 0.25, 0);
      shepherd.add(wing);
    }

    // Spectrometer optics pointing down at Centaur impact plume
    for (const xOff of [-0.18, 0.18]) {
      const spec = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.08, 0.08, 0.24, 14)),
        lensMat,
      );
      spec.position.set(xOff, -0.25, 0.25);
      shepherd.add(spec);
    }

    // S-band omnidirectional whip
    const beacon = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.08, 12, 12)),
      beaconMat,
    );
    beacon.position.y = 0.75;
    shepherd.add(beacon);
    animatedParts.beaconLight = beacon;

    shepherd.position.y = 1.65;
    group.add(shepherd);
  } else if (modelId === 'lunar-prospector') {
    // Spin-stabilized cylindrical drum + 3 radial science booms + Eugene Shoemaker brass capsule
    const drum = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.72, 0.72, 0.92, 24)),
      solarMat,
    );
    group.add(drum);

    const topCap = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.74, 0.74, 0.08, 24)),
      goldFoilMat,
    );
    topCap.position.y = 0.48;
    group.add(topCap);

    // Central high-gain mast antenna
    const mast = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.04, 0.05, 1.15, 12)),
      whiteThermalMat,
    );
    mast.position.y = 1.05;
    group.add(mast);

    const helicalTip = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.25, 14)),
      copperMat,
    );
    helicalTip.position.y = 1.65;
    group.add(helicalTip);

    // Eugene Shoemaker's Brass Foil Memorial Capsule on exterior deck
    const memorial = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.09, 0.09, 0.24, 16)),
      goldFoilMat,
    );
    memorial.position.set(0.45, 0.56, 0.35);
    group.add(memorial);

    // 3 Radial 2.5m Science Booms (Neutron Spectrometer, Alpha Particle, Magnetometer)
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      const boom = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.025, 0.032, 1.85, 8)),
        brushedTitaniumMat,
      );
      boom.rotation.z = Math.PI / 2;
      boom.rotation.y = a;
      boom.position.set(Math.cos(a) * 1.55, 0, -Math.sin(a) * 1.55);
      group.add(boom);

      const sensorHead = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.12, 0.12, 0.26, 14)),
        i === 0 ? copperMat : darkCarbonMat,
      );
      sensorHead.position.set(Math.cos(a) * 2.48, 0, -Math.sin(a) * 2.48);
      group.add(sensorHead);
    }
  } else if (modelId === 'apollo-moon-buggies') {
    addGroundShadow(2.1);

    // Tubular aluminum chassis frame
    const floorDeck = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.32, 0.08, 2.25)),
      brushedTitaniumMat,
    );
    floorDeck.position.y = 0.48;
    group.add(floorDeck);

    // Front battery + avionics housing wrapped in gold thermal blanket
    const frontBay = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.95, 0.36, 0.62)),
      goldFoilMat,
    );
    frontBay.position.set(0, 0.68, 0.78);
    group.add(frontBay);

    // Twin astronaut bucket seats with headrests
    for (const xOff of [-0.34, 0.34]) {
      const seatPan = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.42, 0.08, 0.42)),
        whiteThermalMat,
      );
      seatPan.position.set(xOff, 0.62, -0.08);
      const seatBack = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.42, 0.56, 0.07)),
        whiteThermalMat,
      );
      seatBack.position.set(xOff, 0.9, -0.3);
      seatBack.rotation.x = -0.15;
      group.add(seatPan, seatBack);
    }

    // Center T-handle control stick
    const stick = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.025, 0.03, 0.45, 8)),
      brushedTitaniumMat,
    );
    stick.position.set(0, 0.74, 0.22);
    group.add(stick);

    // Umbrella-shaped High-Gain Mesh Dish Antenna
    const lrvDish = buildDish(0.55, 0.18);
    lrvDish.position.set(-0.36, 1.15, 0.85);
    lrvDish.rotation.x = -0.45;
    group.add(lrvDish);
    animatedParts.dish = lrvDish;

    // Color TV camera boom
    const tvBoom = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.58, 8)),
      brushedTitaniumMat,
    );
    tvBoom.position.set(0.36, 0.98, 0.92);
    group.add(tvBoom);
    const tvCam = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.15, 0.28)), whiteThermalMat);
    tvCam.position.set(0.36, 1.28, 0.92);
    group.add(tvCam);

    // Aft rock sample rack
    const rack = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.05, 0.28, 0.48)), darkCarbonMat);
    rack.position.set(0, 0.66, -0.82);
    group.add(rack);

    // 4 Wire-Mesh Wheels + Fenders (including Apollo 17 map-repaired rear fender!)
    const wheelPositions: [number, number][] = [
      [-0.86, 0.85],
      [0.86, 0.85],
      [-0.86, -0.85],
      [0.86, -0.85],
    ];
    for (const [wx, wz] of wheelPositions) {
      const wheel = buildDetailedWheel(0.32, 0.22, copperMat);
      wheel.position.set(wx, 0.32, wz);
      group.add(wheel);
      animatedParts.wheels?.push(wheel);

      const fender = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 14, 1, true, 0, Math.PI * 0.8)),
        wx > 0 && wz < 0 ? copperMat : whiteThermalMat,
      );
      fender.rotation.z = Math.PI / 2;
      fender.rotation.y = Math.PI / 2;
      fender.position.set(wx, 0.35, wz);
      group.add(fender);
    }
  } else if (modelId === 'opportunity-mer-b' || modelId === 'spirit-mer-a') {
    addGroundShadow(2.0);

    // Triangular Warm Electronics Box (WEB) wrapped in gold foil
    const webBody = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.75, 0.65, 0.44, 3)),
      goldFoilMat,
    );
    webBody.position.y = 0.68;
    group.add(webBody);

    // Petal-shaped Solar Wing Deck
    const centerDeck = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.88, 0.88, 0.06, 6)),
      solarMat,
    );
    centerDeck.position.y = 0.92;
    group.add(centerDeck);

    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.78, 0.04, 1.15)), solarMat);
      wing.position.set(side * 1.1, 0.9, -0.08);
      wing.rotation.z = side * -0.06;
      group.add(wing);
    }

    // Pancam Mast & Stereo Camera Bar
    const mastPole = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.045, 0.055, 0.95, 12)),
      whiteThermalMat,
    );
    mastPole.position.set(0.18, 1.38, 0.45);
    group.add(mastPole);

    const camBar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.46, 0.14, 0.16)), whiteThermalMat);
    camBar.position.set(0.18, 1.88, 0.48);
    group.add(camBar);

    for (const xOff of [-0.15, 0.15]) {
      const eye = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12)), lensMat);
      eye.rotation.x = Math.PI / 2;
      eye.position.set(0.18 + xOff, 1.88, 0.57);
      group.add(eye);
    }

    // High-gain saucer on rear deck
    const hga = buildDish(0.28, 0.08);
    hga.position.set(-0.26, 1.0, -0.35);
    hga.rotation.x = -0.3;
    group.add(hga);
    animatedParts.dish = hga;

    // Robotic Instrument Arm (IDD)
    const arm = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 0.08, 0.68)), brushedTitaniumMat);
    arm.position.set(-0.22, 0.68, 0.95);
    arm.rotation.x = 0.35;
    group.add(arm);

    // 6 Rocker-Bogie Wheels
    for (const side of [-1, 1]) {
      for (const zPos of [0.75, 0, -0.75]) {
        const wheel = buildDetailedWheel(0.2, 0.16, brushedTitaniumMat);
        wheel.position.set(side * 0.85, 0.2, zPos);
        group.add(wheel);
        animatedParts.wheels?.push(wheel);

        const strut = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 0.65, 8)),
          brushedTitaniumMat,
        );
        strut.position.set(side * 0.72, 0.46, zPos * 0.7);
        strut.rotation.z = side * 0.42;
        group.add(strut);
      }
    }
  } else if (modelId === 'voyager-1' || modelId === 'voyager-2' || modelId === 'voyager') {
    // Detailed Voyager Interstellar Explorer
    const hga = buildDish(1.48, 0.46);
    hga.position.y = 0.36;
    group.add(hga);
    animatedParts.dish = hga;

    const bus = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.72, 0.72, 0.48, 10)),
      darkCarbonMat,
    );
    bus.position.y = 0.05;
    group.add(bus);

    // Golden Record engraved disc
    const record = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.22, 0.22, 0.045, 28)),
      goldFoilMat,
    );
    record.rotation.x = Math.PI / 2;
    record.position.set(0, 0.05, 0.74);
    group.add(record);

    // RTG Truss + 3 MHW-RTG Canisters
    const rtgBoom = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.038, 0.038, 2.4, 10)),
      brushedTitaniumMat,
    );
    rtgBoom.rotation.z = Math.PI / 2;
    rtgBoom.position.set(-1.4, -0.05, 0);
    group.add(rtgBoom);

    for (let c = 0; c < 3; c++) {
      const rtg = buildRTG(0.42, 0.14);
      rtg.rotation.z = Math.PI / 2;
      rtg.position.set(-1.75 - c * 0.45, -0.05, 0);
      group.add(rtg);
    }

    // Science Scan Platform Boom + Optics
    const sciBoom = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.032, 0.032, 2.0, 10)),
      brushedTitaniumMat,
    );
    sciBoom.rotation.z = Math.PI / 2;
    sciBoom.position.set(1.3, 0.05, 0.18);
    group.add(sciBoom);

    const scanHead = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.42, 0.32, 0.34)), goldFoilMat);
    scanHead.position.set(2.32, 0.05, 0.18);
    group.add(scanHead);
    const camLens = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.08, 0.08, 0.16, 14)), lensMat);
    camLens.rotation.x = Math.PI / 2;
    camLens.position.set(2.38, 0.08, 0.38);
    group.add(camLens);

    // Magnetometer Boom + PRA Whip Antennas
    const magBoom = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.018, 0.025, 3.6, 8)),
      brushedTitaniumMat,
    );
    magBoom.rotation.x = Math.PI / 2;
    magBoom.position.set(0, 0.05, -2.1);
    group.add(magBoom);

    for (const ang of [-0.5, 0.5]) {
      const whip = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.012, 0.015, 2.5, 6)),
        brushedTitaniumMat,
      );
      whip.position.set(ang * 1.1, -0.1, 1.35);
      whip.rotation.x = Math.PI / 2.2;
      whip.rotation.z = -ang;
      group.add(whip);
    }
  } else if (modelId === 'curiosity-msl' || modelId === 'perseverance-m2020' || modelId === 'curiosity' || modelId === 'perseverance') {
    const isPercy = modelId.includes('perseverance');
    addGroundShadow(2.4);

    // Detailed Chassis + Gold Belly + Sample Caching Bay
    const chassis = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.56, 0.6, 2.08)), whiteThermalMat);
    chassis.position.set(0, 0.94, 0);
    group.add(chassis);

    const belly = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.38, 0.25, 1.72)), goldFoilMat);
    belly.position.set(0, 0.62, 0);
    group.add(belly);

    const hga = buildDish(0.34, 0.1);
    hga.position.set(-0.46, 1.32, -0.58);
    hga.rotation.x = -0.35;
    group.add(hga);
    animatedParts.dish = hga;

    // MMRTG Nuclear Finned Generator
    const rtg = buildRTG(0.75, 0.2);
    rtg.rotation.x = Math.PI / 2.7;
    rtg.position.set(0, 1.06, -1.32);
    group.add(rtg);

    // Remote Sensing Mast + ChemCam / SuperCam Head
    const mastPole = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.06, 0.08, 1.08, 12)),
      brushedTitaniumMat,
    );
    mastPole.position.set(0.32, 1.72, 0.62);
    group.add(mastPole);

    const headBox = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.58, 0.3, 0.36)), whiteThermalMat);
    headBox.position.set(0.32, 2.28, 0.66);
    group.add(headBox);

    const laserLens = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.09, 0.09, 0.14, 16)), lensMat);
    laserLens.rotation.x = Math.PI / 2;
    laserLens.position.set(0.32, 2.29, 0.85);
    group.add(laserLens);

    // Articulated Robotic Arm + Drill Turret
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.28, 0.92, 0.98),
      new THREE.Vector3(-0.28, 0.94, 1.55),
      new THREE.Vector3(-0.28, 0.62, 2.18),
    ]);
    const armTube = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(armCurve, 18, 0.055, 10, false)),
      brushedTitaniumMat,
    );
    group.add(armTube);

    const turret = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 16)),
      darkCarbonMat,
    );
    turret.rotation.z = Math.PI / 2;
    turret.position.set(-0.28, 0.62, 2.22);
    group.add(turret);

    // 6 Treaded Rocker-Bogie Wheels
    for (const side of [-1, 1]) {
      for (const zPos of [0.94, 0, -0.94]) {
        const wheel = buildDetailedWheel(0.27, 0.22, isPercy ? goldFoilMat : brushedTitaniumMat);
        wheel.position.set(side * 1.08, 0.27, zPos);
        group.add(wheel);
        animatedParts.wheels?.push(wheel);

        const strut = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.035, 0.035, 0.88, 10)),
          brushedTitaniumMat,
        );
        strut.position.set(side * 0.88, 0.62, zPos * 0.72);
        strut.rotation.z = side * 0.38;
        group.add(strut);
      }
    }
  } else if (modelId === 'dart-planetary-defense') {
    // DART Kinetic Impactor + Roll-Out Solar Arrays (ROSA) + DRACO Telescope + NEXT-C Ion Thruster
    const bus = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.05, 1.1, 1.05)), brushedTitaniumMat);
    group.add(bus);

    const foilSkirt = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.1, 0.42, 1.1)), goldFoilMat);
    foilSkirt.position.y = -0.35;
    group.add(foilSkirt);

    // DRACO Optical Navigation Telescope facing impact target (+Z)
    const baffle = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.24, 0.28, 0.55, 20)),
      darkCarbonMat,
    );
    baffle.rotation.x = Math.PI / 2;
    baffle.position.set(0, 0.12, 0.78);
    group.add(baffle);

    const dracoLens = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 20)), lensMat);
    dracoLens.rotation.x = Math.PI / 2;
    dracoLens.position.set(0, 0.12, 1.06);
    group.add(dracoLens);

    // Twin 8.5-meter Roll-Out Solar Array Wings
    for (const side of [-1, 1]) {
      const boom = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.035, 0.035, 3.3, 10)),
        brushedTitaniumMat,
      );
      boom.rotation.z = Math.PI / 2;
      boom.position.set(side * 2.1, 0.1, 0);
      group.add(boom);

      const wing = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.85, 0.035, 0.92)), solarMat);
      wing.position.set(side * 2.15, 0.1, 0);
      group.add(wing);

      const tipCap = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.12, 0.08, 0.96)), goldFoilMat);
      tipCap.position.set(side * 3.62, 0.1, 0);
      group.add(tipCap);
    }

    // Radial Slot Array High-Gain Antenna
    const rlSa = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 24)),
      whiteThermalMat,
    );
    rlSa.position.set(0.35, 0.62, -0.2);
    group.add(rlSa);
    animatedParts.dish = rlSa;

    // LICIACube Companion Box mounted on flank
    const licia = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.28, 0.36, 0.22)), goldFoilMat);
    licia.position.set(-0.68, 0.15, 0.2);
    group.add(licia);

    // NEXT-C Ion Thruster + Blue Xenon Plume Cone
    const ionRing = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.26, 0.22, 0.28, 20)),
      brushedTitaniumMat,
    );
    ionRing.rotation.x = Math.PI / 2;
    ionRing.position.set(0, -0.1, -0.68);
    group.add(ionRing);

    const plume = new THREE.Mesh(
      trackGeo(new THREE.ConeGeometry(0.24, 1.35, 20, 1, true)),
      trackMat(
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
        }),
      ),
    );
    plume.rotation.x = -Math.PI / 2;
    plume.position.set(0, -0.1, -1.48);
    group.add(plume);
    animatedParts.plume = plume;
  } else if (modelId === 'insight-lander') {
    addGroundShadow(2.4);

    // Octagonal lander deck + gold thermal enclosure
    const deck = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.95, 0.85, 0.38, 8)), goldFoilMat);
    deck.position.y = 0.68;
    group.add(deck);

    const topPlate = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.98, 0.98, 0.06, 8)),
      whiteThermalMat,
    );
    topPlate.position.y = 0.88;
    group.add(topPlate);

    // Three shock-absorbing tripod lander legs with footpads
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3 + 0.4;
      const leg = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.04, 0.032, 0.92, 10)),
        brushedTitaniumMat,
      );
      leg.position.set(Math.cos(a) * 0.86, 0.36, Math.sin(a) * 0.86);
      leg.rotation.z = Math.cos(a) * 0.55;
      leg.rotation.x = -Math.sin(a) * 0.55;
      group.add(leg);

      const pad = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.2, 0.24, 0.06, 16)),
        darkCarbonMat,
      );
      pad.position.set(Math.cos(a) * 1.12, 0.03, Math.sin(a) * 1.12);
      group.add(pad);
    }

    // Twin Iconic Decagonal UltraFlex Solar Array Fans
    for (const side of [-1, 1]) {
      const arrayFan = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(1.12, 1.12, 0.04, 10)),
        solarMat,
      );
      arrayFan.position.set(side * 1.65, 0.86, 0);
      group.add(arrayFan);

      const hub = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 12)),
        brushedTitaniumMat,
      );
      hub.position.set(side * 1.65, 0.89, 0);
      group.add(hub);
    }

    // SEIS Copper Wind & Thermal Shield Dome deployed in front of lander
    const seisDome = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.38, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2)),
      copperMat,
    );
    seisDome.position.set(0.32, 0.02, 1.48);
    group.add(seisDome);

    const seisSkirt = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.42, 0.46, 0.06, 20)),
      whiteThermalMat,
    );
    seisSkirt.position.set(0.32, 0.03, 1.48);
    group.add(seisSkirt);

    // HP3 Heat Flow Probe + Articulated IDA Robotic Arm
    const idaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.22, 0.92, 0.55),
      new THREE.Vector3(-0.08, 1.25, 1.08),
      new THREE.Vector3(0.25, 0.55, 1.42),
    ]);
    const idaArm = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(idaCurve, 16, 0.042, 8, false)),
      brushedTitaniumMat,
    );
    group.add(idaArm);

    // Weather TWINS Boom & UHF Antenna
    const uhf = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.03, 0.045, 0.65, 10)),
      whiteThermalMat,
    );
    uhf.position.set(0, 1.2, -0.35);
    group.add(uhf);
    animatedParts.dish = uhf;
  } else {
    // Ingenuity / Generic Detailed Lander/Probe
    addGroundShadow(1.6);
    const fuselage = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.46, 0.36, 0.46)), goldFoilMat);
    fuselage.position.y = 0.74;
    group.add(fuselage);

    const mast = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.038, 0.048, 0.66, 14)),
      brushedTitaniumMat,
    );
    mast.position.y = 1.14;
    group.add(mast);

    const solarCap = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.78, 0.035, 0.34)), solarMat);
    solarCap.position.y = 1.5;
    group.add(solarCap);

    const bladeGeo = trackGeo(new THREE.BoxGeometry(2.6, 0.025, 0.15));
    const rotorTop = new THREE.Mesh(bladeGeo, darkCarbonMat);
    rotorTop.position.y = 1.38;
    const rotorBot = new THREE.Mesh(bladeGeo, darkCarbonMat);
    rotorBot.position.y = 1.25;
    rotorBot.rotation.y = 0.6;
    group.add(rotorTop, rotorBot);
    animatedParts.rotors?.push(rotorTop, rotorBot);

    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      const leg = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.022, 0.018, 0.98, 8)),
        darkCarbonMat,
      );
      leg.position.set(Math.cos(a) * 0.46, 0.38, Math.sin(a) * 0.46);
      leg.rotation.z = Math.cos(a) * 0.65;
      leg.rotation.x = -Math.sin(a) * 0.65;
      group.add(leg);
    }
  }

  return {
    group,
    animatedParts,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
