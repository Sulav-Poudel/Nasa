import * as THREE from 'three';

export interface OrbitingMoon {
  mesh: THREE.Object3D;
  radius: number;
  speed: number;
  phase: number;
  inclination: number;
}

export interface PlanetSystem {
  group: THREE.Group;
  primaryMesh: THREE.Mesh;
  cloudMesh?: THREE.Mesh;
  moons: OrbitingMoon[];
  dispose: () => void;
}

export type WorldKind = 'sun' | 'mercury' | 'venus' | 'earth' | 'moon' | 'mars' | 'asteroid' | 'saturn';

function seededRand(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function drawCraters(
  ctx: CanvasRenderingContext2D,
  bumpCtx: CanvasRenderingContext2D,
  w: number,
  h: number,
  count: number,
  seed: number,
  rayBright = false,
) {
  const rand = seededRand(seed);
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const y = 18 + rand() * (h - 36);
    const r = 3 + Math.pow(rand(), 2.2) * 28;

    // Bright impact rays on a few major craters
    if (rayBright && i % 9 === 0 && r > 12) {
      ctx.save();
      ctx.strokeStyle = 'rgba(241, 245, 249, 0.35)';
      ctx.lineWidth = 1.5;
      for (let ray = 0; ray < 8; ray++) {
        const ang = (ray / 8) * Math.PI * 2 + rand() * 0.4;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r);
        ctx.lineTo(x + Math.cos(ang) * (r * 3.2), y + Math.sin(ang) * (r * 3.2));
        ctx.stroke();
      }
      ctx.restore();
    }

    // Crater floor darkness
    ctx.fillStyle = `rgba(15, 23, 42, ${0.14 + rand() * 0.22})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Raised rim highlight
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.18 + rand() * 0.18})`;
    ctx.lineWidth = Math.max(1, r * 0.14);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    // Linear bump map: deep basin + bright rim
    bumpCtx.fillStyle = '#383838';
    bumpCtx.beginPath();
    bumpCtx.arc(x, y, r * 0.85, 0, Math.PI * 2);
    bumpCtx.fill();

    bumpCtx.strokeStyle = '#e5e5e5';
    bumpCtx.lineWidth = Math.max(1.5, r * 0.18);
    bumpCtx.beginPath();
    bumpCtx.arc(x, y, r, 0, Math.PI * 2);
    bumpCtx.stroke();
  }
}

function createWorldTextures(
  kind: WorldKind,
  maxAnisotropy: number,
): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  cloudMap?: THREE.CanvasTexture;
  ringMap?: THREE.CanvasTexture;
} {
  const w = 1024;
  const h = 512;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = w;
  albedoCanvas.height = h;
  const ctx = albedoCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, w, h);

  const rand = seededRand(kind.charCodeAt(0) * 97 + kind.length * 31);
  let cloudMap: THREE.CanvasTexture | undefined;
  let ringMap: THREE.CanvasTexture | undefined;

  if (kind === 'sun') {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#ff981a');
    grad.addColorStop(0.5, '#ffca57');
    grad.addColorStop(1, '#f97316');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,245,190,0.22)' : 'rgba(234,88,12,0.22)';
      ctx.beginPath();
      ctx.arc(rand() * w, rand() * h, 4 + rand() * 16, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'moon') {
    ctx.fillStyle = '#b9c0cc';
    ctx.fillRect(0, 0, w, h);

    // Dark basaltic Lunar Maria basins (Imbrium, Tranquillitatis, Procellarum)
    for (let i = 0; i < 18; i++) {
      const mx = rand() * w;
      const my = 70 + rand() * (h - 140);
      const mr = 38 + rand() * 95;
      const maria = ctx.createRadialGradient(mx, my, mr * 0.2, mx, my, mr);
      maria.addColorStop(0, 'rgba(62, 69, 82, 0.72)');
      maria.addColorStop(1, 'rgba(62, 69, 82, 0)');
      ctx.fillStyle = maria;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();

      bCtx.fillStyle = 'rgba(85,85,85,0.4)';
      bCtx.beginPath();
      bCtx.arc(mx, my, mr * 0.85, 0, Math.PI * 2);
      bCtx.fill();
    }
    drawCraters(ctx, bCtx, w, h, 260, 412, true);
  } else if (kind === 'mars') {
    const marsGrad = ctx.createLinearGradient(0, 0, 0, h);
    marsGrad.addColorStop(0, '#f1f5f9');
    marsGrad.addColorStop(0.09, '#b84f32');
    marsGrad.addColorStop(0.5, '#c95c3a');
    marsGrad.addColorStop(0.91, '#a9442a');
    marsGrad.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = marsGrad;
    ctx.fillRect(0, 0, w, h);

    // Dark basaltic regions (Syrtis Major / Acidalia)
    for (let i = 0; i < 24; i++) {
      const rx = rand() * w;
      const ry = 55 + rand() * (h - 110);
      const rad = 32 + rand() * 88;
      const patch = ctx.createRadialGradient(rx, ry, 8, rx, ry, rad);
      patch.addColorStop(0, i % 3 === 0 ? 'rgba(92, 34, 20, 0.65)' : 'rgba(227, 132, 82, 0.35)');
      patch.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = patch;
      ctx.beginPath();
      ctx.arc(rx, ry, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Valles Marineris canyon rift across equator
    ctx.strokeStyle = 'rgba(69, 22, 12, 0.72)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(w * 0.35, h * 0.54);
    ctx.bezierCurveTo(w * 0.44, h * 0.51, w * 0.52, h * 0.58, w * 0.63, h * 0.55);
    ctx.stroke();

    bCtx.strokeStyle = '#202020';
    bCtx.lineWidth = 9;
    bCtx.beginPath();
    bCtx.moveTo(w * 0.35, h * 0.54);
    bCtx.bezierCurveTo(w * 0.44, h * 0.51, w * 0.52, h * 0.58, w * 0.63, h * 0.55);
    bCtx.stroke();

    drawCraters(ctx, bCtx, w, h, 140, 777, false);
  } else if (kind === 'mercury') {
    ctx.fillStyle = '#8b8e96';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(60,64,73,0.35)' : 'rgba(180,186,196,0.22)';
      ctx.beginPath();
      ctx.arc(rand() * w, rand() * h, 18 + rand() * 54, 0, Math.PI * 2);
      ctx.fill();
    }
    drawCraters(ctx, bCtx, w, h, 310, 108, true);
  } else if (kind === 'venus') {
    const vGrad = ctx.createLinearGradient(0, 0, 0, h);
    vGrad.addColorStop(0, '#c28c4e');
    vGrad.addColorStop(0.35, '#e8be7d');
    vGrad.addColorStop(0.5, '#f2d399');
    vGrad.addColorStop(0.65, '#dfb06d');
    vGrad.addColorStop(1, '#b57b3d');
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, w, h);

    // Chevron sulfuric cloud streaks
    for (let y = 20; y < h - 20; y += 14) {
      ctx.strokeStyle = y % 28 === 0 ? 'rgba(255,244,214,0.28)' : 'rgba(130,74,24,0.22)';
      ctx.lineWidth = 6 + rand() * 8;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 32) {
        const dy = Math.sin((x / w) * Math.PI * 4 + y * 0.04) * 14;
        if (x === 0) ctx.moveTo(x, y + dy);
        else ctx.lineTo(x, y + dy);
      }
      ctx.stroke();
    }
  } else if (kind === 'earth') {
    ctx.fillStyle = '#123e8a';
    ctx.fillRect(0, 0, w, h);

    // Polar caps
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, 34);
    ctx.fillRect(0, h - 34, w, 34);

    // Continental landmasses
    for (let i = 0; i < 22; i++) {
      const lx = 60 + rand() * (w - 120);
      const ly = 75 + rand() * (h - 150);
      const lr = 24 + rand() * 72;
      ctx.fillStyle = i % 3 === 0 ? '#a1865e' : '#2e6f40';
      ctx.beginPath();
      ctx.ellipse(lx, ly, lr * 1.3, lr * 0.85, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();

      bCtx.fillStyle = '#c8c8c8';
      bCtx.beginPath();
      bCtx.ellipse(lx, ly, lr * 1.2, lr * 0.8, 0, 0, Math.PI * 2);
      bCtx.fill();
    }

    // Separate semi-transparent swirling cloud canvas
    const cCanvas = document.createElement('canvas');
    cCanvas.width = 512;
    cCanvas.height = 256;
    const cCtx = cCanvas.getContext('2d')!;
    for (let i = 0; i < 160; i++) {
      cCtx.fillStyle = `rgba(255,255,255,${0.14 + rand() * 0.35})`;
      cCtx.beginPath();
      cCtx.ellipse(rand() * 512, 20 + rand() * 216, 16 + rand() * 44, 5 + rand() * 14, rand() * 0.4, 0, Math.PI * 2);
      cCtx.fill();
    }
    cloudMap = new THREE.CanvasTexture(cCanvas);
    cloudMap.colorSpace = THREE.SRGBColorSpace;
    cloudMap.anisotropy = maxAnisotropy;
  } else if (kind === 'saturn') {
    const bands = [
      '#c7ad82',
      '#e9d8b4',
      '#d4bc8c',
      '#f1e3c4',
      '#c19e6b',
      '#e4cfa2',
      '#d5b988',
      '#b69464',
    ];
    for (let y = 0; y < h; y += 4) {
      const idx = Math.floor((y / h) * bands.length * 3) % bands.length;
      ctx.fillStyle = bands[idx];
      ctx.fillRect(0, y, w, 5);
    }
    // Subtle storm eddies
    for (let i = 0; i < 45; i++) {
      ctx.fillStyle = 'rgba(255, 250, 235, 0.16)';
      ctx.beginPath();
      ctx.ellipse(rand() * w, 60 + rand() * (h - 120), 28 + rand() * 55, 4 + rand() * 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Multi-band radial Saturnian Rings texture (256x1 horizontal strip)
    const rCanvas = document.createElement('canvas');
    rCanvas.width = 512;
    rCanvas.height = 16;
    const rCtx = rCanvas.getContext('2d')!;
    const rg = rCtx.createLinearGradient(0, 0, 512, 0);
    rg.addColorStop(0.0, 'rgba(180,155,120,0.08)'); // Inner D/C faint ring
    rg.addColorStop(0.18, 'rgba(205,185,150,0.45)'); // C ring
    rg.addColorStop(0.32, 'rgba(240,224,190,0.92)'); // Bright B ring
    rg.addColorStop(0.58, 'rgba(226,204,168,0.85)');
    rg.addColorStop(0.64, 'rgba(18,18,24,0.12)'); // Cassini Division dark gap!
    rg.addColorStop(0.69, 'rgba(218,198,162,0.75)'); // A ring
    rg.addColorStop(0.86, 'rgba(20,20,26,0.18)'); // Encke gap
    rg.addColorStop(0.9, 'rgba(212,190,154,0.62)');
    rg.addColorStop(1.0, 'rgba(180,160,130,0.0)');
    rCtx.fillStyle = rg;
    rCtx.fillRect(0, 0, 512, 16);

    ringMap = new THREE.CanvasTexture(rCanvas);
    ringMap.colorSpace = THREE.SRGBColorSpace;
    ringMap.anisotropy = maxAnisotropy;
  } else {
    // Asteroid / Rocky Small Body
    ctx.fillStyle = '#6f6c68';
    ctx.fillRect(0, 0, w, h);
    drawCraters(ctx, bCtx, w, h, 180, 991, false);
  }

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap, cloudMap, ringMap };
}

function buildAtmosphereShell(radius: number, hexColor: number, intensity = 0.65): {
  mesh: THREE.Mesh;
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
} {
  const geometry = new THREE.SphereGeometry(radius, 36, 28);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(hexColor) },
      intensity: { value: intensity },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      uniform float intensity;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vec3 viewDir = normalize(vViewPos);
        float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
        float alpha = pow(rim, 3.0) * intensity;
        gl_FragColor = vec4(glowColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  return { mesh, geometry, material };
}

function buildRadialRingGeometry(innerR: number, outerR: number, segments = 96): THREE.RingGeometry {
  const geo = new THREE.RingGeometry(innerR, outerR, segments, 1);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const v3 = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v3.fromBufferAttribute(pos, i);
    const radialT = (v3.length() - innerR) / (outerR - innerR);
    uv.setXY(i, radialT, 0.5);
  }
  uv.needsUpdate = true;
  return geo;
}

export function buildDetailedWorld(
  kind: WorldKind,
  radius: number,
  maxAnisotropy = 4,
): PlanetSystem {
  const group = new THREE.Group();
  const moons: OrbitingMoon[] = [];
  const disposables: { dispose: () => void }[] = [];

  const textures = createWorldTextures(kind, maxAnisotropy);
  disposables.push(textures.map, textures.bumpMap);
  if (textures.cloudMap) disposables.push(textures.cloudMap);
  if (textures.ringMap) disposables.push(textures.ringMap);

  let primaryGeo: THREE.BufferGeometry;
  if (kind === 'asteroid') {
    // Sculpt irregular rocky body like Didymos
    primaryGeo = new THREE.IcosahedronGeometry(radius, 3);
    const pos = primaryGeo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const disp =
        1 +
        Math.sin(v.x * 5.2 + v.y * 3.1) * 0.12 +
        Math.cos(v.z * 6.4 - v.x * 2.5) * 0.08;
      v.multiplyScalar(disp);
      pos.setXYZ(i, v.x, v.y * 0.84, v.z);
    }
    primaryGeo.computeVertexNormals();
  } else {
    primaryGeo = new THREE.SphereGeometry(radius, 48, 36);
  }
  disposables.push(primaryGeo);

  const primaryMat =
    kind === 'sun'
      ? new THREE.MeshStandardMaterial({
          map: textures.map,
          emissive: 0xff8c1a,
          emissiveMap: textures.map,
          emissiveIntensity: 1.55,
          roughness: 0.4,
        })
      : new THREE.MeshStandardMaterial({
          map: textures.map,
          bumpMap: textures.bumpMap,
          bumpScale: kind === 'moon' || kind === 'mercury' ? 0.045 : kind === 'mars' ? 0.032 : 0.014,
          roughness: kind === 'earth' ? 0.45 : kind === 'saturn' ? 0.65 : 0.88,
          metalness: kind === 'earth' ? 0.12 : 0.04,
        });
  disposables.push(primaryMat);

  const primaryMesh = new THREE.Mesh(primaryGeo, primaryMat);
  if (kind === 'saturn') {
    // Realistic oblate flattening
    primaryMesh.scale.set(1, 0.9, 1);
  }
  group.add(primaryMesh);

  // Cloud Sphere (Earth)
  let cloudMesh: THREE.Mesh | undefined;
  if (textures.cloudMap) {
    const cloudGeo = new THREE.SphereGeometry(radius * 1.022, 40, 28);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: textures.cloudMap,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      roughness: 0.9,
    });
    cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    group.add(cloudMesh);
    disposables.push(cloudGeo, cloudMat);
  }

  // Atmospheric Fresnel Halo
  const atmoColor =
    kind === 'earth'
      ? 0x38bdf8
      : kind === 'mars'
        ? 0xf97316
        : kind === 'venus'
          ? 0xfcd34d
          : kind === 'saturn'
            ? 0xfde68a
            : kind === 'sun'
              ? 0xffa726
              : null;

  if (atmoColor !== null) {
    const atmo = buildAtmosphereShell(
      radius * (kind === 'sun' ? 1.18 : 1.06),
      atmoColor,
      kind === 'sun' ? 0.9 : kind === 'venus' ? 0.72 : 0.58,
    );
    group.add(atmo.mesh);
    disposables.push(atmo.geometry, atmo.material);
  }

  // Multi-Band Rings (Saturn)
  if (kind === 'saturn' && textures.ringMap) {
    const ringGeo = buildRadialRingGeometry(radius * 1.28, radius * 2.45, 96);
    const ringMat = new THREE.MeshStandardMaterial({
      map: textures.ringMap,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      roughness: 0.55,
      metalness: 0.1,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.28;
    ringMesh.rotation.y = 0.14;
    group.add(ringMesh);
    disposables.push(ringGeo, ringMat);
  }

  // Helper to attach detailed orbiting moons
  const addMoon = (
    moonRadius: number,
    orbitDist: number,
    speed: number,
    phase: number,
    inclination: number,
    colorHex: number,
    lumpy = false,
  ) => {
    const mGeo = lumpy
      ? new THREE.DodecahedronGeometry(moonRadius, 1)
      : new THREE.SphereGeometry(moonRadius, 24, 18);
    const mMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.85,
      metalness: 0.05,
    });
    const mMesh = new THREE.Mesh(mGeo, mMat);
    mMesh.position.set(Math.cos(phase) * orbitDist, 0, Math.sin(phase) * orbitDist);
    group.add(mMesh);
    disposables.push(mGeo, mMat);
    moons.push({ mesh: mMesh, radius: orbitDist, speed, phase, inclination });
  };

  if (kind === 'mars') {
    // Phobos & Deimos
    addMoon(0.065, radius * 1.7, 0.9, 0.4, 0.12, 0x9ca3af, true);
    addMoon(0.048, radius * 2.25, 0.52, 2.4, -0.1, 0xa8a29e, true);
  } else if (kind === 'saturn') {
    // Icy Enceladus + hazy orange Titan
    addMoon(0.11, radius * 2.65, 0.68, 0.8, 0.05, 0xe0f2fe, false);
    addMoon(0.24, radius * 3.35, 0.38, 3.1, 0.1, 0xf59e0b, false);
  } else if (kind === 'asteroid') {
    // Moonlet Dimorphos orbiting Didymos (with faint orbit ring)
    addMoon(0.14, radius * 2.1, 1.05, 1.2, 0.08, 0x94a3b8, true);
  }

  return {
    group,
    primaryMesh,
    cloudMesh,
    moons,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
