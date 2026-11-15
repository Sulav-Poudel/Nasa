import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, Info, RotateCcw } from 'lucide-react';
import { MISSIONS, PILLAR_COLORS } from '../data/archive';
import type { MissionRecord } from '../types/archive';
import { spaceAudio } from '../utils/audio';

interface SolarSystemExplorerProps {
  onSelectMission: (mission: MissionRecord) => void;
}

interface DestinationPreset {
  id: string;
  label: string;
  subtitle: string;
  position: [number, number, number];
  cameraOffset: [number, number, number];
  missionIds: string[];
}

const DESTINATIONS: DestinationPreset[] = [
  {
    id: 'overview',
    label: 'Solar System',
    subtitle: 'All 27 documented hardware sites & trajectories',
    position: [0, 0, 0],
    cameraOffset: [0, 22, 34],
    missionIds: MISSIONS.map((m) => m.id),
  },
  {
    id: 'moon',
    label: 'The Moon',
    subtitle: '6 missions · Apollo LRRR, Rovers, Surveyor 3, Lunar Prospector, LCROSS, GRAIL',
    position: [11.5, 0.4, 2.2],
    cameraOffset: [3.2, 2.2, 4.2],
    missionIds: [
      'apollo-retroreflectors',
      'apollo-moon-buggies',
      'surveyor-3',
      'lunar-prospector',
      'lcross',
      'grail',
    ],
  },
  {
    id: 'mars',
    label: 'Mars',
    subtitle: '10 missions · Viking 1, Pathfinder, Spirit, Opportunity, Phoenix, InSight, Ingenuity, MAVEN, Curiosity, Perseverance',
    position: [-14.5, 0, 7.5],
    cameraOffset: [3.6, 2.4, 4.6],
    missionIds: [
      'viking-1',
      'pathfinder-sojourner',
      'spirit-mer-a',
      'opportunity-mer-b',
      'phoenix-lander',
      'insight-lander',
      'ingenuity-helicopter',
      'maven-orbiter',
      'curiosity-msl',
      'perseverance-m2020',
    ],
  },
  {
    id: 'mercury',
    label: 'Mercury',
    subtitle: 'MESSENGER · Impacted Shakespeare Basin rim (54.4° N, 149.9° W)',
    position: [5.5, 0, -2.5],
    cameraOffset: [2.8, 1.8, 3.6],
    missionIds: ['messenger-mercury'],
  },
  {
    id: 'venus',
    label: 'Venus',
    subtitle: 'Magellan Radar Mapper · Vaporized in upper atmosphere (Oct 1994)',
    position: [-7.5, 0, -4.5],
    cameraOffset: [3.2, 2.0, 4.0],
    missionIds: ['magellan-venus'],
  },
  {
    id: 'asteroids',
    label: 'Asteroids & Comets',
    subtitle: 'NEAR Shoemaker (433 Eros), Deep Impact (Tempel 1), DART (Dimorphos)',
    position: [18.5, 0.5, -9.0],
    cameraOffset: [4.2, 2.6, 5.2],
    missionIds: ['near-shoemaker', 'deep-impact', 'dart-planetary-defense'],
  },
  {
    id: 'saturn',
    label: 'Saturn',
    subtitle: 'Cassini · Grand Finale plunge at 9.4° N, 53° W (Sept 15, 2017)',
    position: [-23.5, 0, -13.0],
    cameraOffset: [5.4, 3.2, 7.2],
    missionIds: ['cassini-saturn'],
  },
  {
    id: 'interstellar',
    label: 'Interstellar Space',
    subtitle: 'Voyager 1 (173 AU), Voyager 2 (144 AU), Pioneer 10, New Horizons (64 AU)',
    position: [28.0, 2.2, 16.0],
    cameraOffset: [6.0, 4.0, 8.5],
    missionIds: ['voyager-1', 'voyager-2', 'pioneer-10', 'new-horizons'],
  },
];

function createPlanetTexture(baseHex: string, bandHex: string, speckled = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = bandHex;
    for (let y = 0; y < 128; y += 16) {
      ctx.globalAlpha = 0.22 + ((y * 7) % 10) * 0.025;
      ctx.fillRect(0, y, 256, 6 + (y % 5));
    }
    if (speckled) {
      for (let i = 0; i < 240; i++) {
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#0f172a';
        ctx.beginPath();
        ctx.arc((i * 47) % 256, (i * 29) % 128, 1 + (i % 4), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();

export const SolarSystemExplorer: React.FC<SolarSystemExplorerProps> = ({ onSelectMission }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [activeDestId, setActiveDestId] = useState<string>('overview');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  const activeDest = useMemo(
    () => DESTINATIONS.find((d) => d.id === activeDestId) ?? DESTINATIONS[0],
    [activeDestId],
  );

  const visibleMissions = useMemo(
    () => MISSIONS.filter((m) => activeDest.missionIds.includes(m.id)),
    [activeDest],
  );

  const cameraGoalRef = useRef<{
    active: boolean;
    pos: THREE.Vector3;
    target: THREE.Vector3;
  }>({
    active: false,
    pos: new THREE.Vector3(0, 22, 34),
    target: new THREE.Vector3(0, 0, 0),
  });

  const selectDestination = (destId: string) => {
    const dest = DESTINATIONS.find((d) => d.id === destId);
    if (!dest) return;
    setActiveDestId(destId);
    spaceAudio.playTelemetryPing(540);
    cameraGoalRef.current = {
      active: true,
      pos: new THREE.Vector3(
        dest.position[0] + dest.cameraOffset[0],
        dest.position[1] + dest.cameraOffset[1],
        dest.position[2] + dest.cameraOffset[2],
      ),
      target: new THREE.Vector3(...dest.position),
    };
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04060b);
    scene.fog = new THREE.FogExp2(0x04060b, 0.0085);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(46, host.clientWidth / host.clientHeight, 0.1, 300);
    camera.position.set(0, 22, 34);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.5;
    controls.maxDistance = 80;
    controls.maxPolarAngle = Math.PI * 0.85;

    controls.addEventListener('start', () => {
      cameraGoalRef.current.active = false;
    });

    // Lighting
    const sunLight = new THREE.PointLight(0xfff1d6, 85, 160, 1.3);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    const keyDir = new THREE.DirectionalLight(0xfff5e4, 0.85);
    keyDir.position.set(15, 25, 12);
    scene.add(keyDir);

    const hemi = new THREE.HemisphereLight(0x64748b, 0x05070b, 0.55);
    scene.add(hemi);

    const disposables: { dispose: () => void }[] = [];

    // Background Stars (InstancedMesh)
    const starGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    const stars = new THREE.InstancedMesh(starGeo, starMat, 500);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 500; i++) {
      const r = 45 + Math.random() * 85;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      dummy.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi) * 0.6,
        r * Math.sin(phi) * Math.sin(theta),
      );
      dummy.scale.setScalar(0.5 + Math.random() * 1.4);
      dummy.updateMatrix();
      stars.setMatrixAt(i, dummy.matrix);
    }
    stars.computeBoundingSphere();
    scene.add(stars);
    disposables.push(starGeo, starMat);

    // Sun + Corona
    const sunGeo = new THREE.SphereGeometry(2.1, 32, 24);
    const sunMat = new THREE.MeshStandardMaterial({
      color: 0xffb347,
      emissive: 0xff8c1a,
      emissiveIntensity: 1.8,
      roughness: 0.4,
    });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sun);
    disposables.push(sunGeo, sunMat);

    // Orbit Rings
    const orbitRadii = [6.0, 8.7, 11.4, 16.3, 20.5, 26.8, 32.5];
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.14,
    });
    disposables.push(orbitMat);
    orbitRadii.forEach((radius) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 96; i++) {
        const a = (i / 96) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      disposables.push(geo);
      scene.add(new THREE.Line(geo, orbitMat));
    });

    // Asteroid Belt InstancedMesh
    const rockGeo = new THREE.DodecahedronGeometry(0.09, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85, metalness: 0.1 });
    const rocks = new THREE.InstancedMesh(rockGeo, rockMat, 180);
    for (let i = 0; i < 180; i++) {
      const a = (i / 180) * Math.PI * 2 + Math.random() * 0.15;
      const rad = 19.3 + (Math.random() - 0.5) * 2.2;
      dummy.position.set(Math.cos(a) * rad, (Math.random() - 0.5) * 0.7, Math.sin(a) * rad);
      dummy.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      dummy.scale.setScalar(0.6 + Math.random() * 1.1);
      dummy.updateMatrix();
      rocks.setMatrixAt(i, dummy.matrix);
    }
    rocks.computeBoundingSphere();
    scene.add(rocks);
    disposables.push(rockGeo, rockMat);

    // Interactive Destination Bodies & Beacons
    const clickables: THREE.Object3D[] = [];
    const animatedBodies: THREE.Mesh[] = [];
    const beacons: THREE.Mesh[] = [];

    const addPlanet = (
      destId: string,
      label: string,
      pos: [number, number, number],
      radius: number,
      baseHex: string,
      bandHex: string,
      speckled = false,
      hasRings = false,
    ) => {
      const tex = createPlanetTexture(baseHex, bandHex, speckled);
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const geo = new THREE.SphereGeometry(radius, 32, 24);
      const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.72, metalness: 0.08 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      mesh.userData = { destId, label };
      mesh.layers.enable(1);
      scene.add(mesh);
      clickables.push(mesh);
      animatedBodies.push(mesh);
      disposables.push(tex, geo, mat);

      if (hasRings) {
        const ringGeo = new THREE.RingGeometry(radius * 1.35, radius * 2.25, 48);
        const ringMat = new THREE.MeshStandardMaterial({
          color: 0xe5cfa8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.65,
          roughness: 0.6,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(...pos);
        ring.rotation.x = Math.PI / 2.4;
        scene.add(ring);
        disposables.push(ringGeo, ringMat);
      }
    };

    addPlanet('mercury', 'Mercury · MESSENGER', [5.5, 0, -2.5], 0.52, '#8b8d94', '#5c5e66', true);
    addPlanet('venus', 'Venus · Magellan', [-7.5, 0, -4.5], 0.85, '#d9a45b', '#b87635');
    addPlanet('overview', 'Earth', [10.4, 0, 1.8], 0.88, '#2563eb', '#22c55e');
    addPlanet('moon', 'The Moon · 6 Missions', [11.9, 0.4, 2.5], 0.36, '#cbd5e1', '#64748b', true);
    addPlanet('mars', 'Mars · 10 Missions', [-14.5, 0, 7.5], 0.74, '#c2593f', '#7c2d12', true);
    addPlanet('asteroids', 'Asteroids & Comets · 3 Missions', [18.5, 0.5, -9.0], 0.48, '#78716c', '#44403c', true);
    addPlanet('saturn', 'Saturn · Cassini', [-23.5, 0, -13.0], 1.45, '#e2c58f', '#b8945a', false, true);

    // Interstellar Deep Space Beacon Cluster
    const interstellarCoords: [string, [number, number, number]][] = [
      ['voyager-1', [28.5, 2.5, 16.5]],
      ['voyager-2', [26.8, -1.8, 17.8]],
      ['pioneer-10', [30.2, 1.1, 13.8]],
      ['new-horizons', [24.2, 0.8, 13.5]],
    ];
    const beaconGeo = new THREE.OctahedronGeometry(0.32, 0);
    disposables.push(beaconGeo);
    interstellarCoords.forEach(([mId, pos]) => {
      const m = MISSIONS.find((x) => x.id === mId);
      const color = m ? PILLAR_COLORS[m.disposalReason] : '#D8B4FE';
      const bMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.7,
        roughness: 0.25,
        metalness: 0.6,
      });
      disposables.push(bMat);
      const bMesh = new THREE.Mesh(beaconGeo, bMat);
      bMesh.position.set(...pos);
      bMesh.userData = { destId: 'interstellar', missionId: mId, label: m?.name ?? mId };
      bMesh.layers.enable(1);
      scene.add(bMesh);
      clickables.push(bMesh);
      beacons.push(bMesh);
    });

    // Raycasting
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    let lastHoverCheck = 0;

    const updatePointer = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverCheck < 50) return;
      lastHoverCheck = now;
      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickables, false);
      if (hits.length > 0) {
        const hit = hits[0].object;
        setHoveredLabel(hit.userData.label || null);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredLabel(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    let downX = 0;
    let downY = 0;
    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickables, false);
      if (hits.length > 0) {
        const data = hits[0].object.userData;
        if (data.missionId) {
          const found = MISSIONS.find((m) => m.id === data.missionId);
          if (found) onSelectMission(found);
        } else if (data.destId) {
          selectDestination(data.destId);
        }
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    let frameId = 0;
    const clock = new THREE.Clock();

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const st = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (st === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.1);
      animatedBodies.forEach((b) => {
        b.rotation.y += dt * 0.16;
      });
      beacons.forEach((b, idx) => {
        b.rotation.y += dt * 0.8;
        b.position.y += Math.sin(clock.elapsedTime * 1.4 + idx) * 0.0015;
      });

      if (cameraGoalRef.current.active) {
        _targetPos.copy(cameraGoalRef.current.pos);
        _targetLook.copy(cameraGoalRef.current.target);
        const alpha = 1 - Math.exp(-4.5 * dt);
        camera.position.lerp(_targetPos, alpha);
        controls.target.lerp(_targetLook, alpha);
        if (camera.position.distanceTo(_targetPos) < 0.08) {
          cameraGoalRef.current.active = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };

    const onResize = () => {
      if (!host) return;
      const w = host.clientWidth;
      const h = host.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    if (!isSoftwareGl) renderer.compile(scene, camera);
    tick();

    return () => {
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      controls.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [onSelectMission]);

  return (
    <section className="relative w-full h-[calc(100vh-64px)] min-h-[600px] bg-[#04060B] overflow-hidden">
      <div ref={hostRef} className="w-full h-full" />

      {/* Top-Left Minimal Context Overlay (Solid/rgba without backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute top-5 left-5 right-5 flex flex-wrap items-start justify-between gap-4 z-10">
        <div className="pointer-events-auto max-w-md p-4 rounded-md bg-[#080B12]/92 border border-white/10">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>The Abandoned Universe</span>
            <span aria-hidden="true">·</span>
            <span>{visibleMissions.length} missions in view</span>
          </div>
          <h1 className="mt-1 text-xl sm:text-2xl font-semibold text-white">
            {activeDest.label}
          </h1>
          <p className="mt-1 text-xs text-slate-300 leading-relaxed">{activeDest.subtitle}</p>
          <p className="mt-2.5 flex items-start gap-1.5 text-[11px] font-mono text-amber-300/90">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              Illustrative Heliocentric Schematic: distances and deep-space markers are visually compressed, not ephemeris-exact.
            </span>
          </p>
        </div>

        {/* Selected Region Mission List (Right drawer on large screens, compact stack) */}
        <div className="pointer-events-auto w-full sm:w-80 max-h-[52vh] overflow-y-auto rounded-md bg-[#080B12]/92 border border-white/10 p-3">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <span className="font-mono text-[11px] text-slate-400">
              Select Mission Dossier
            </span>
            {activeDestId !== 'overview' && (
              <button
                type="button"
                onClick={() => selectDestination('overview')}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-300 hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset View</span>
              </button>
            )}
          </div>
          <ul className="space-y-1.5">
            {visibleMissions.map((mission) => (
              <li key={mission.id}>
                <button
                  type="button"
                  onClick={() => onSelectMission(mission)}
                  className="w-full text-left p-2.5 rounded-md bg-[#0D121D] hover:bg-[#141C2D] border border-white/5 hover:border-white/20 transition-colors cursor-pointer"
                >
                  <div className="text-xs font-semibold text-white truncate">
                    {mission.name}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-mono text-slate-400 truncate">
                    <span style={{ color: PILLAR_COLORS[mission.disposalReason] }}>
                      {mission.disposalReason}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{mission.status}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{mission.hardwareMassKg} kg</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {hoveredLabel && (
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-10 z-20 px-3 py-1.5 rounded-md bg-[#080B12] border border-white/20 text-xs font-mono text-white whitespace-nowrap">
          {hoveredLabel}
        </div>
      )}

      {/* Collapsible Bottom Control Dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[min(940px,95vw)] flex flex-col items-center">
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          className="mb-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-t-md bg-[#080B12] border border-b-0 border-white/15 text-[11px] font-mono text-slate-300 hover:text-white cursor-pointer"
        >
          {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{dockCollapsed ? 'Show Destinations' : 'Hide Destinations'}</span>
        </button>

        {!dockCollapsed && (
          <div className="w-full p-2 rounded-md bg-[#080B12]/95 border border-white/15 overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max justify-start sm:justify-center">
              {DESTINATIONS.map((dest) => {
                const isActive = dest.id === activeDestId;
                return (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => selectDestination(dest.id)}
                    className={`px-3 py-2 min-h-[38px] rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#05070B] font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {dest.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
