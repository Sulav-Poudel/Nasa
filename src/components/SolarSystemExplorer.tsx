import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, Info, RotateCcw } from 'lucide-react';
import { MISSIONS, PILLAR_COLORS } from '../data/archive';
import type { MissionRecord } from '../types/archive';
import { spaceAudio } from '../utils/audio';
import { buildDetailedWorld, type OrbitingMoon, type WorldKind } from '../three/planetBuilders';

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
    subtitle: '6 missions · Craters, Maria basins, South Pole ice & Apollo sites',
    position: [12.1, 0.45, 2.6],
    cameraOffset: [1.5, 0.9, 1.9],
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
    subtitle: '10 missions · Craters, Valles Marineris, polar caps, Phobos & Deimos',
    position: [-14.5, 0, 7.5],
    cameraOffset: [2.4, 1.4, 3.1],
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
    subtitle: 'MESSENGER · Impacted cratered Shakespeare Basin rim (54.4° N, 149.9° W)',
    position: [5.5, 0, -2.5],
    cameraOffset: [1.9, 1.1, 2.4],
    missionIds: ['messenger-mercury'],
  },
  {
    id: 'venus',
    label: 'Venus',
    subtitle: 'Magellan · Sulfuric cloud bands & atmospheric Windmill plunge',
    position: [-7.5, 0, -4.5],
    cameraOffset: [2.4, 1.4, 3.0],
    missionIds: ['magellan-venus'],
  },
  {
    id: 'asteroids',
    label: 'Asteroids & Comets',
    subtitle: 'Didymos & Dimorphos · NEAR Shoemaker, Deep Impact, DART',
    position: [18.5, 0.5, -9.0],
    cameraOffset: [2.6, 1.5, 3.3],
    missionIds: ['near-shoemaker', 'deep-impact', 'dart-planetary-defense'],
  },
  {
    id: 'saturn',
    label: 'Saturn',
    subtitle: 'Cassini · Cassini Division rings, Enceladus & Titan',
    position: [-23.5, 0, -13.0],
    cameraOffset: [4.5, 2.5, 6.2],
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
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04060b);
    scene.fog = new THREE.FogExp2(0x04060b, 0.0072);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(46, host.clientWidth / host.clientHeight, 0.1, 300);
    camera.position.set(0, 22, 34);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.4;
    controls.maxDistance = 80;
    controls.maxPolarAngle = Math.PI * 0.85;

    controls.addEventListener('start', () => {
      cameraGoalRef.current.active = false;
    });

    // Lighting
    const sunLight = new THREE.PointLight(0xfff1d6, 110, 175, 1.15);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    const keyDir = new THREE.DirectionalLight(0xfff5e4, 1.05);
    keyDir.position.set(15, 25, 12);
    scene.add(keyDir);

    const hemi = new THREE.HemisphereLight(0x64748b, 0x05070b, 0.6);
    scene.add(hemi);

    const disposables: { dispose: () => void }[] = [];
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    // Background Stars (InstancedMesh)
    const starGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    const stars = new THREE.InstancedMesh(starGeo, starMat, 650);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 650; i++) {
      const r = 45 + Math.random() * 90;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      dummy.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi) * 0.65,
        r * Math.sin(phi) * Math.sin(theta),
      );
      dummy.scale.setScalar(0.45 + Math.random() * 1.45);
      dummy.updateMatrix();
      stars.setMatrixAt(i, dummy.matrix);
    }
    stars.computeBoundingSphere();
    scene.add(stars);
    disposables.push(starGeo, starMat);

    // Detailed Sun
    const sunWorld = buildDetailedWorld('sun', 2.2, maxAnisotropy);
    scene.add(sunWorld.group);
    disposables.push(sunWorld);

    // Orbit Rings
    const orbitRadii = [6.0, 8.7, 10.6, 16.3, 20.5, 26.8, 32.5];
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
    const rocks = new THREE.InstancedMesh(rockGeo, rockMat, 220);
    for (let i = 0; i < 220; i++) {
      const a = (i / 220) * Math.PI * 2 + Math.random() * 0.15;
      const rad = 19.3 + (Math.random() - 0.5) * 2.2;
      dummy.position.set(Math.cos(a) * rad, (Math.random() - 0.5) * 0.7, Math.sin(a) * rad);
      dummy.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      dummy.scale.setScalar(0.55 + Math.random() * 1.15);
      dummy.updateMatrix();
      rocks.setMatrixAt(i, dummy.matrix);
    }
    rocks.computeBoundingSphere();
    scene.add(rocks);
    disposables.push(rockGeo, rockMat);

    // High-Detail Worlds & Orbiting Moons
    const clickables: THREE.Object3D[] = [];
    const rotatingBodies: { mesh: THREE.Object3D; speed: number }[] = [
      { mesh: sunWorld.primaryMesh, speed: 0.08 },
    ];
    const allMoons: OrbitingMoon[] = [];

    const placeWorld = (
      kind: WorldKind,
      destId: string,
      label: string,
      pos: [number, number, number],
      radius: number,
      spinSpeed = 0.16,
    ) => {
      const world = buildDetailedWorld(kind, radius, maxAnisotropy);
      world.group.position.set(...pos);
      world.primaryMesh.userData = { destId, label };
      world.primaryMesh.layers.enable(1);
      scene.add(world.group);
      clickables.push(world.primaryMesh);
      rotatingBodies.push({ mesh: world.primaryMesh, speed: spinSpeed });
      if (world.cloudMesh) {
        rotatingBodies.push({ mesh: world.cloudMesh, speed: spinSpeed * 1.45 });
      }
      allMoons.push(...world.moons);
      disposables.push(world);
      return world;
    };

    placeWorld('mercury', 'mercury', 'Mercury · MESSENGER', [5.5, 0, -2.5], 0.58, 0.14);
    placeWorld('venus', 'venus', 'Venus · Magellan', [-7.5, 0, -4.5], 0.92, -0.09);
    placeWorld('earth', 'overview', 'Earth', [10.4, 0, 1.8], 0.95, 0.22);
    const moonWorld = placeWorld('moon', 'moon', 'The Moon · 6 Missions', [12.1, 0.45, 2.6], 0.52, 0.09);
    const marsWorld = placeWorld('mars', 'mars', 'Mars · 10 Missions', [-14.5, 0, 7.5], 0.86, 0.2);
    placeWorld('asteroid', 'asteroids', 'Didymos & Dimorphos · 3 Missions', [18.5, 0.5, -9.0], 0.54, 0.28);
    placeWorld('saturn', 'saturn', 'Saturn · Cassini & Moons', [-23.5, 0, -13.0], 1.55, 0.24);

    // Lunar Surface Mission Pins (attached to rotating Moon sphere!)
    const pinGeo = new THREE.SphereGeometry(0.055, 10, 10);
    disposables.push(pinGeo);
    const lunarPins: [string, [number, number, number]][] = [
      ['apollo-retroreflectors', [0.46, 0.08, 0.25]],
      ['apollo-moon-buggies', [0.35, 0.24, 0.32]],
      ['lcross', [0.08, -0.5, 0.14]],
      ['grail', [-0.15, 0.49, 0.12]],
    ];
    lunarPins.forEach(([mId, localPos]) => {
      const m = MISSIONS.find((x) => x.id === mId);
      const color = m ? PILLAR_COLORS[m.disposalReason] : '#E5B880';
      const pMat = new THREE.MeshBasicMaterial({ color });
      disposables.push(pMat);
      const pin = new THREE.Mesh(pinGeo, pMat);
      pin.position.set(...localPos);
      pin.userData = { destId: 'moon', missionId: mId, label: m?.name ?? mId };
      pin.layers.enable(1);
      moonWorld.primaryMesh.add(pin);
      clickables.push(pin);
    });

    // Mars Surface Mission Pins
    const marsPins: [string, [number, number, number]][] = [
      ['opportunity-mer-b', [0.72, -0.1, 0.48]],
      ['curiosity-msl', [-0.62, -0.12, 0.6]],
      ['perseverance-m2020', [0.45, 0.28, -0.68]],
      ['insight-lander', [-0.35, 0.15, -0.78]],
    ];
    marsPins.forEach(([mId, localPos]) => {
      const m = MISSIONS.find((x) => x.id === mId);
      const color = m ? PILLAR_COLORS[m.disposalReason] : '#D8B4FE';
      const pMat = new THREE.MeshBasicMaterial({ color });
      disposables.push(pMat);
      const pin = new THREE.Mesh(pinGeo, pMat);
      pin.position.set(...localPos);
      pin.userData = { destId: 'mars', missionId: mId, label: m?.name ?? mId };
      pin.layers.enable(1);
      marsWorld.primaryMesh.add(pin);
      clickables.push(pin);
    });

    // Interstellar Deep Space Beacon Cluster
    const interstellarCoords: [string, [number, number, number]][] = [
      ['voyager-1', [28.5, 2.5, 16.5]],
      ['voyager-2', [26.8, -1.8, 17.8]],
      ['pioneer-10', [30.2, 1.1, 13.8]],
      ['new-horizons', [24.2, 0.8, 13.5]],
    ];
    const beaconGeo = new THREE.OctahedronGeometry(0.32, 0);
    disposables.push(beaconGeo);
    const beacons: THREE.Mesh[] = [];
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
      const elapsed = clock.elapsedTime;

      rotatingBodies.forEach((b) => {
        b.mesh.rotation.y += dt * b.speed;
      });
      allMoons.forEach((moon) => {
        const ang = elapsed * moon.speed + moon.phase;
        moon.mesh.position.set(
          Math.cos(ang) * moon.radius,
          Math.sin(ang) * moon.radius * moon.inclination,
          Math.sin(ang) * moon.radius,
        );
        moon.mesh.rotation.y += dt * 0.4;
      });
      beacons.forEach((b, idx) => {
        b.rotation.y += dt * 0.8;
        b.position.y += Math.sin(elapsed * 1.4 + idx) * 0.0015;
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
            <span>Star Map</span>
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
              Click any planet, Moon crater pin, or deep-space beacon to inspect worlds & dossiers.
            </span>
          </p>
        </div>

        {/* Selected Region Mission List */}
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
