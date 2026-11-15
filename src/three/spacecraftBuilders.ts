import * as THREE from 'three';

export interface BuiltSpacecraft {
  group: THREE.Group;
  interactiveMeshes: THREE.Object3D[];
  componentTargets: Record<string, THREE.Vector3>;
  dispose: () => void;
}

function createSolarTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0c1f3d';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#38bdf8';
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = 2;
    for (let i = 0; i <= 256; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = '#93c5fd';
    for (let y = 4; y < 256; y += 32) {
      for (let x = 4; x < 256; x += 32) {
        ctx.fillRect(x, y, 24, 24);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createGoldFoilTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#c88a2b';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 180; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,224,130,0.22)' : 'rgba(120,65,10,0.22)';
      const x = (i * 37) % 256;
      const y = (i * 53) % 256;
      ctx.fillRect(x, y, 18, 12);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function tagComponent(root: THREE.Object3D, componentId: string, interactiveMeshes: THREE.Object3D[]) {
  root.traverse((obj) => {
    obj.userData.componentId = componentId;
    if ((obj as THREE.Mesh).isMesh) {
      obj.layers.enable(1);
      interactiveMeshes.push(obj);
    }
  });
}

export function buildProceduralSpacecraft(modelId: string, maxAnisotropy = 4): BuiltSpacecraft {
  const group = new THREE.Group();
  const interactiveMeshes: THREE.Object3D[] = [];
  const componentTargets: Record<string, THREE.Vector3> = {};
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const solarTex = createSolarTexture();
  solarTex.anisotropy = maxAnisotropy;
  const foilTex = createGoldFoilTexture();
  foilTex.anisotropy = maxAnisotropy;
  textures.push(solarTex, foilTex);

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  const whiteThermalMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xe6e8ec, roughness: 0.45, metalness: 0.15 }),
  );
  const darkCarbonMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x1e2430, roughness: 0.68, metalness: 0.35 }),
  );
  const titaniumMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.88 }),
  );
  const goldFoilMat = trackMat(
    new THREE.MeshStandardMaterial({ map: foilTex, roughness: 0.3, metalness: 0.92 }),
  );
  const solarMat = trackMat(
    new THREE.MeshStandardMaterial({ map: solarTex, roughness: 0.22, metalness: 0.65 }),
  );
  const lensMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      roughness: 0.08,
      metalness: 0.1,
      clearcoat: 1,
    }),
  );

  // Soft radial contact shadow plane for grounded craft
  const addGroundShadow = (radius: number) => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
      grad.addColorStop(0, 'rgba(0,0,0,0.62)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(c);
    textures.push(shadowTex);
    const plane = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(radius * 2, radius * 2)),
      trackMat(
        new THREE.MeshBasicMaterial({
          map: shadowTex,
          transparent: true,
          depthWrite: false,
        }),
      ),
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0.01;
    group.add(plane);
  };

  if (modelId === 'curiosity' || modelId === 'perseverance') {
    const isPercy = modelId === 'perseverance';
    addGroundShadow(2.4);

    // 1. Primary Chassis
    const chassis = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.5, 0.58, 2.0)), whiteThermalMat);
    chassis.position.set(0, 0.92, 0);
    chassis.castShadow = true;
    group.add(chassis);

    // Gold belly bay & top deck
    const belly = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.32, 0.24, 1.65)), goldFoilMat);
    belly.position.set(0, 0.6, 0);
    group.add(belly);

    // High-gain saucer antenna
    const hga = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.32, 0.08, 0.08, 24)),
      whiteThermalMat,
    );
    hga.position.set(-0.45, 1.32, -0.55);
    hga.rotation.x = -0.35;
    group.add(hga);

    // MMRTG nuclear power source at rear
    const rtgGroup = new THREE.Group();
    const rtgCore = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.2, 0.2, 0.72, 16)),
      darkCarbonMat,
    );
    rtgCore.rotation.x = Math.PI / 2.6;
    rtgGroup.add(rtgCore);
    for (let f = 0; f < 6; f++) {
      const fin = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.03, 0.55, 0.62)), titaniumMat);
      fin.rotation.y = (f * Math.PI) / 3;
      rtgGroup.add(fin);
    }
    rtgGroup.position.set(0, 1.05, -1.28);
    group.add(rtgGroup);

    // 2. Remote Sensing Mast ('mast')
    const mastGroup = new THREE.Group();
    const mastPole = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.06, 0.08, 1.05, 12)),
      titaniumMat,
    );
    mastPole.position.set(0, 0.52, 0);
    mastGroup.add(mastPole);

    const headBox = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.56, 0.28, 0.34)),
      whiteThermalMat,
    );
    headBox.position.set(0, 1.08, 0.04);
    mastGroup.add(headBox);

    const cyclopsLens = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16)),
      lensMat,
    );
    cyclopsLens.rotation.x = Math.PI / 2;
    cyclopsLens.position.set(0, 1.09, 0.22);
    mastGroup.add(cyclopsLens);

    const mastCamLeft = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.09, 0.07, 0.1)), darkCarbonMat);
    mastCamLeft.position.set(-0.18, 1.09, 0.2);
    const mastCamRight = mastCamLeft.clone();
    mastCamRight.position.x = 0.18;
    mastGroup.add(mastCamLeft, mastCamRight);

    mastGroup.position.set(0.32, 1.2, 0.62);
    group.add(mastGroup);
    tagComponent(mastGroup, 'mast', interactiveMeshes);
    componentTargets.mast = new THREE.Vector3(0.32, 2.25, 0.66);

    // 3. Robotic Arm ('arm')
    const armGroup = new THREE.Group();
    const shoulder = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.1, 14, 14)), titaniumMat);
    const upperArm = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.11, 0.11, 0.72)), titaniumMat);
    upperArm.position.set(0, 0, 0.36);
    const elbow = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.09, 14, 14)), darkCarbonMat);
    elbow.position.set(0, 0, 0.72);
    const foreArm = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.09, 0.09, 0.62)), titaniumMat);
    foreArm.position.set(0, -0.18, 0.96);
    foreArm.rotation.x = 0.55;
    armGroup.add(shoulder, upperArm, elbow, foreArm);
    armGroup.position.set(-0.28, 0.92, 0.98);
    group.add(armGroup);
    tagComponent(armGroup, 'arm', interactiveMeshes);
    componentTargets.arm = new THREE.Vector3(-0.28, 0.85, 1.55);

    // 4. Science Turret ('turret')
    const turretGroup = new THREE.Group();
    const turretHub = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 16)),
      darkCarbonMat,
    );
    turretHub.rotation.z = Math.PI / 2;
    const drillHead = new THREE.Mesh(
      trackGeo(new THREE.ConeGeometry(0.08, 0.28, 12)),
      titaniumMat,
    );
    drillHead.rotation.x = Math.PI / 2;
    drillHead.position.set(0, -0.05, 0.24);
    const mahliLens = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 12)),
      lensMat,
    );
    mahliLens.position.set(0.16, 0.08, 0.12);
    turretGroup.add(turretHub, drillHead, mahliLens);
    turretGroup.position.set(-0.28, 0.58, 2.22);
    group.add(turretGroup);
    tagComponent(turretGroup, 'turret', interactiveMeshes);
    componentTargets.turret = new THREE.Vector3(-0.28, 0.58, 2.22);

    // 5. Six Wheels & Rocker-Bogie Suspension ('wheel')
    const wheelGroup = new THREE.Group();
    const wheelGeo = trackGeo(new THREE.CylinderGeometry(0.27, 0.27, 0.22, 20));
    const strutGeo = trackGeo(new THREE.CylinderGeometry(0.035, 0.035, 0.88, 10));
    const zPositions = [0.92, 0.0, -0.92];
    for (const side of [-1, 1]) {
      for (const zPos of zPositions) {
        const wheel = new THREE.Mesh(wheelGeo, darkCarbonMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(side * 1.06, 0.27, zPos);
        wheel.castShadow = true;
        wheelGroup.add(wheel);

        const rim = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 0.24, 14)),
          isPercy ? goldFoilMat : titaniumMat,
        );
        rim.rotation.z = Math.PI / 2;
        rim.position.copy(wheel.position);
        wheelGroup.add(rim);

        const strut = new THREE.Mesh(strutGeo, titaniumMat);
        strut.position.set(side * 0.88, 0.62, zPos * 0.72);
        strut.rotation.z = side * 0.38;
        wheelGroup.add(strut);
      }
    }
    group.add(wheelGroup);
    tagComponent(wheelGroup, 'wheel', interactiveMeshes);
    componentTargets.wheel = new THREE.Vector3(1.06, 0.3, 0.92);
  } else if (modelId === 'apollo') {
    addGroundShadow(2.3);

    // Descent stage octagonal core
    const descentBody = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(1.18, 1.18, 0.85, 8)),
      goldFoilMat,
    );
    descentBody.position.y = 0.95;
    descentBody.castShadow = true;
    group.add(descentBody);

    // Descent engine bell
    const bell = new THREE.Mesh(
      trackGeo(new THREE.ConeGeometry(0.42, 0.55, 20, 1, true)),
      darkCarbonMat,
    );
    bell.position.y = 0.42;
    group.add(bell);

    // Four landing struts + footpads flush on ground
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const strut = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.05, 0.05, 1.35, 10)),
        goldFoilMat,
      );
      strut.position.set(Math.cos(angle) * 1.4, 0.55, Math.sin(angle) * 1.4);
      strut.rotation.z = Math.cos(angle) * 0.46;
      strut.rotation.x = -Math.sin(angle) * 0.46;
      group.add(strut);

      const pad = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.28, 0.34, 0.06, 16)),
        goldFoilMat,
      );
      pad.position.set(Math.cos(angle) * 1.72, 0.03, Math.sin(angle) * 1.72);
      group.add(pad);
    }

    // Ascent stage faceted cabin
    const ascentCabin = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.86, 0.96, 1.05, 6)),
      titaniumMat,
    );
    ascentCabin.position.y = 1.92;
    ascentCabin.castShadow = true;
    group.add(ascentCabin);

    // Forward docking / viewport module
    const crewPod = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.88, 0.65, 0.95)), darkCarbonMat);
    crewPod.position.set(0, 1.9, 0.55);
    group.add(crewPod);

    // Overhead dish antenna
    const dish = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.32, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.45)),
      whiteThermalMat,
    );
    dish.position.set(0.42, 2.68, 0.25);
    dish.rotation.x = 0.6;
    group.add(dish);
  } else if (modelId === 'voyager') {
    // 1. 3.7m High-Gain Parabolic Dish (LatheGeometry)
    const points = [
      new THREE.Vector2(0.02, 0),
      new THREE.Vector2(0.45, 0.06),
      new THREE.Vector2(0.95, 0.22),
      new THREE.Vector2(1.38, 0.48),
    ];
    const dishGeo = trackGeo(new THREE.LatheGeometry(points, 32));
    const dishMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        roughness: 0.42,
        metalness: 0.25,
        side: THREE.DoubleSide,
      }),
    );
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.y = 0.35;
    group.add(dish);

    // Subreflector tripod
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      const leg = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 1.15, 8)),
        titaniumMat,
      );
      leg.position.set(Math.cos(a) * 0.42, 0.95, Math.sin(a) * 0.42);
      leg.rotation.z = Math.cos(a) * 0.45;
      leg.rotation.x = -Math.sin(a) * 0.45;
      group.add(leg);
    }

    // Decagonal spacecraft bus
    const bus = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.68, 0.68, 0.44, 10)),
      darkCarbonMat,
    );
    bus.position.y = 0.06;
    group.add(bus);

    // Golden Record mounted on bus
    const record = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 24)),
      goldFoilMat,
    );
    record.rotation.x = Math.PI / 2;
    record.position.set(0, 0.06, 0.7);
    group.add(record);

    // RTG power boom + 3 cylindrical canisters
    const rtgBoom = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 10)),
      titaniumMat,
    );
    rtgBoom.rotation.z = Math.PI / 2;
    rtgBoom.position.set(-1.35, -0.05, 0);
    group.add(rtgBoom);

    for (let c = 0; c < 3; c++) {
      const canister = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 0.38, 14)),
        darkCarbonMat,
      );
      canister.rotation.z = Math.PI / 2;
      canister.position.set(-1.75 - c * 0.42, -0.05, 0);
      group.add(canister);
    }

    // Science scan platform boom
    const sciBoom = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.035, 0.035, 1.9, 10)),
      titaniumMat,
    );
    sciBoom.rotation.z = Math.PI / 2;
    sciBoom.position.set(1.25, 0.05, 0.2);
    group.add(sciBoom);

    const scanHead = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.28, 0.28)), goldFoilMat);
    scanHead.position.set(2.22, 0.05, 0.2);
    group.add(scanHead);

    // Magnetometer boom
    const magBoom = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.018, 0.025, 3.2, 8)),
      titaniumMat,
    );
    magBoom.rotation.x = Math.PI / 2;
    magBoom.position.set(0, 0.05, -1.9);
    group.add(magBoom);
  } else if (modelId === 'hubble') {
    // Primary optical tube
    const tube = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.58, 0.58, 2.9, 28)),
      titaniumMat,
    );
    tube.rotation.z = Math.PI / 2;
    group.add(tube);

    // Aft equipment bay shroud
    const aft = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.76, 0.76, 1.05, 24)),
      whiteThermalMat,
    );
    aft.rotation.z = Math.PI / 2;
    aft.position.x = -1.25;
    group.add(aft);

    // Hinged aperture door
    const door = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.56, 0.56, 0.06, 24)),
      darkCarbonMat,
    );
    door.position.set(1.68, 0.48, 0);
    door.rotation.z = -0.65;
    group.add(door);

    // Dual solar array wings
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.035, 0.035, 0.85, 8)),
        titaniumMat,
      );
      arm.rotation.x = Math.PI / 2;
      arm.position.set(0.15, 0, side * 0.9);
      group.add(arm);

      const panel = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.88, 0.04, 2.15)), solarMat);
      panel.position.set(0.15, 0, side * 2.15);
      panel.rotation.x = 0.2;
      group.add(panel);
    }

    // Dual high-gain dish booms
    for (const side of [-1, 1]) {
      const dish = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.24, 0.08, 0.08, 18)),
        whiteThermalMat,
      );
      dish.position.set(-0.2, side * 1.15, 0);
      group.add(dish);
    }
  } else {
    // Ingenuity Helicopter
    addGroundShadow(1.6);

    const fuselage = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.42, 0.34, 0.42)), goldFoilMat);
    fuselage.position.y = 0.72;
    fuselage.castShadow = true;
    group.add(fuselage);

    const mast = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.035, 0.045, 0.62, 12)),
      titaniumMat,
    );
    mast.position.y = 1.12;
    group.add(mast);

    // Top solar panel
    const solarCap = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.75, 0.03, 0.32)), solarMat);
    solarCap.position.y = 1.48;
    group.add(solarCap);

    // Counter-rotating carbon rotor blades
    const bladeGeo = trackGeo(new THREE.BoxGeometry(2.55, 0.025, 0.14));
    const rotorTop = new THREE.Mesh(bladeGeo, darkCarbonMat);
    rotorTop.position.y = 1.36;
    rotorTop.rotation.y = 0.35;
    const rotorBottom = new THREE.Mesh(bladeGeo, darkCarbonMat);
    rotorBottom.position.y = 1.24;
    rotorBottom.rotation.y = -0.45;
    group.add(rotorTop, rotorBottom);

    // 4 carbon-fiber angled landing legs flush to ground
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const leg = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.022, 0.018, 0.96, 8)),
        darkCarbonMat,
      );
      leg.position.set(Math.cos(angle) * 0.46, 0.38, Math.sin(angle) * 0.46);
      leg.rotation.z = Math.cos(angle) * 0.65;
      leg.rotation.x = -Math.sin(angle) * 0.65;
      group.add(leg);
    }
  }

  return {
    group,
    interactiveMeshes,
    componentTargets,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
