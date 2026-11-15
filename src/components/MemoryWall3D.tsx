import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Compass,
  Flame,
  Hand,
  Orbit,
  RotateCcw,
  Sparkles,
  Waves,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  MISSIONS,
  PILLARS,
  PILLAR_COLORS,
  getVerificationFlagsForMission,
} from '../data/archive';
import type { MissionRecord, PillarId } from '../types/archive';
import { NasaImage } from './NasaImage';
import { spaceAudio } from '../utils/audio';

interface MemoryWall3DProps {
  litMemoryIds: string[];
  onLightMemory: (missionId: string, points: number) => void;
  onSelectMission: (mission: MissionRecord) => void;
}

interface PhysicsNode {
  mission: MissionRecord;
  index: number;
  anchor: THREE.Vector3;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  mass: number;
  phase: number;
  expandFactor: number;
  pulseBurst: number;
  group: THREE.Group;
  coreMesh: THREE.Mesh;
  ringMesh: THREE.Mesh;
  outerRingMesh: THREE.Mesh;
  coronaMat: THREE.ShaderMaterial;
  coreMat: THREE.MeshBasicMaterial;
  hitProxy: THREE.Mesh;
}

const PILLAR_INDEX: Record<PillarId, number> = {
  Weight: 0,
  Experiments: 1,
  Protection: 2,
  Time: 3,
};

const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _vecC = new THREE.Vector3();
const _panRight = new THREE.Vector3();
const _panUp = new THREE.Vector3();
const _zoomOffset = new THREE.Vector3();
const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const _rayPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const _rayHit = new THREE.Vector3();

function computeConstellationAnchor(mission: MissionRecord, idx: number, total: number): THREE.Vector3 {
  const pillarIdx = PILLAR_INDEX[mission.disposalReason];
  const baseAngle = (pillarIdx / 4) * Math.PI * 2 + 0.35;
  const samePillar = MISSIONS.filter((m) => m.disposalReason === mission.disposalReason);
  const localIdx = samePillar.findIndex((m) => m.id === mission.id);
  const localSpan = Math.max(samePillar.length - 1, 1);
  const spread = (localIdx / localSpan - 0.5) * 1.18;
  const angle = baseAngle + spread;

  const regionRing =
    mission.region === 'Moon' ? 5.6 : mission.region === 'Mars' ? 8.2 : 10.9;
  const heightWave =
    Math.sin((idx / total) * Math.PI * 4 + pillarIdx) * 2.6 +
    (localIdx % 2 === 0 ? 0.95 : -0.95);

  return new THREE.Vector3(
    Math.cos(angle) * regionRing,
    heightWave,
    Math.sin(angle) * regionRing,
  );
}

export const MemoryWall3D: React.FC<MemoryWall3DProps> = ({
  litMemoryIds,
  onLightMemory,
  onSelectMission,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<{
    id: string;
    name: string;
    pillar: PillarId;
    region: string;
    x: number;
    y: number;
  } | null>(null);
  const [profileOrigin, setProfileOrigin] = useState<{ x: number; y: number }>({
    x: 50,
    y: 50,
  });
  const [filterPillar, setFilterPillar] = useState<PillarId | 'All'>('All');
  const [autoOrbit, setAutoOrbit] = useState(true);
  const [navMode, setNavMode] = useState<'orbit' | 'pan'>('orbit');
  const [zoomPct, setZoomPct] = useState(100);
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const selectedIdRef = useRef<string | null>(selectedId);
  const filterPillarRef = useRef<PillarId | 'All'>(filterPillar);
  const autoOrbitRef = useRef<boolean>(autoOrbit);
  const navModeRef = useRef<'orbit' | 'pan'>(navMode);
  const litIdsRef = useRef<string[]>(litMemoryIds);
  const applyNavModeRef = useRef<((mode: 'orbit' | 'pan') => void) | null>(null);

  selectedIdRef.current = selectedId;
  filterPillarRef.current = filterPillar;
  autoOrbitRef.current = autoOrbit;
  navModeRef.current = navMode;
  litIdsRef.current = litMemoryIds;

  const sceneActionsRef = useRef<{
    triggerShockwave: (origin?: THREE.Vector3, strength?: number) => void;
    focusMission: (missionId: string) => void;
    panBy: (rightUnits: number, upUnits: number) => void;
    zoomBy: (factor: number) => void;
    resetView: () => void;
  } | null>(null);

  const selectedMission = useMemo(
    () => (selectedId ? MISSIONS.find((m) => m.id === selectedId) ?? null : null),
    [selectedId],
  );

  const selectedFlags = useMemo(
    () => (selectedMission ? getVerificationFlagsForMission(selectedMission.id) : []),
    [selectedMission],
  );

  const handleSelectNode = useCallback((missionId: string) => {
    setSelectedId(missionId);
    const mission = MISSIONS.find((m) => m.id === missionId);
    if (mission) {
      const pitchMap: Record<PillarId, number> = {
        Weight: 523.25,
        Experiments: 587.33,
        Protection: 659.25,
        Time: 783.99,
      };
      spaceAudio.playTelemetryPing(pitchMap[mission.disposalReason]);
    }
    sceneActionsRef.current?.focusMission(missionId);
  }, []);

  const handleHonorMission = useCallback(
    (missionId: string) => {
      onLightMemory(missionId, 15);
      spaceAudio.playTelemetryPing(880);
      sceneActionsRef.current?.focusMission(missionId);
    },
    [onLightMemory],
  );

  const filteredMissions = useMemo(
    () =>
      filterPillar === 'All'
        ? MISSIONS
        : MISSIONS.filter((m) => m.disposalReason === filterPillar),
    [filterPillar],
  );

  const stepMission = useCallback(
    (delta: number) => {
      if (filteredMissions.length === 0) return;
      const idx = selectedId
        ? filteredMissions.findIndex((m) => m.id === selectedId)
        : -1;
      const nextIdx =
        idx === -1
          ? delta > 0
            ? 0
            : filteredMissions.length - 1
          : (idx + delta + filteredMissions.length) % filteredMissions.length;
      handleSelectNode(filteredMissions[nextIdx].id);
    },
    [filteredMissions, selectedId, handleSelectNode],
  );

  useEffect(() => {
    applyNavModeRef.current?.(navMode);
  }, [navMode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        setSelectedId(null);
      } else if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        sceneActionsRef.current?.zoomBy(0.8);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        sceneActionsRef.current?.zoomBy(1.25);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        sceneActionsRef.current?.panBy(-2.2, 0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        sceneActionsRef.current?.panBy(2.2, 0);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        sceneActionsRef.current?.panBy(0, 1.8);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        sceneActionsRef.current?.panBy(0, -1.8);
      } else if (e.key === '[') {
        e.preventDefault();
        stepMission(-1);
      } else if (e.key === ']') {
        e.preventDefault();
        stepMission(1);
      } else if (e.key === '0' || e.key === 'r' || e.key === 'R') {
        sceneActionsRef.current?.resetView();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stepMission]);

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
    renderer.toneMappingExposure = 1.18;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03050a);
    scene.fog = new THREE.FogExp2(0x03050a, 0.017);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(
      48,
      Math.max(host.clientWidth, 1) / Math.max(host.clientHeight, 1),
      0.1,
      180,
    );
    camera.position.set(0, 6.2, 22.5);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.065;
    controls.minDistance = 3.2;
    controls.maxDistance = 42;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.panSpeed = 0.95;
    controls.zoomSpeed = 1.15;
    controls.rotateSpeed = 0.85;

    const applyNavMode = (mode: 'orbit' | 'pan') => {
      if (mode === 'pan') {
        controls.mouseButtons = {
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        };
        controls.touches = {
          ONE: THREE.TOUCH.PAN,
          TWO: THREE.TOUCH.DOLLY_ROTATE,
        };
      } else {
        controls.mouseButtons = {
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        };
        controls.touches = {
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        };
      }
    };
    applyNavModeRef.current = applyNavMode;
    applyNavMode(navModeRef.current);

    const DEFAULT_CAM_DIST = Math.hypot(0, 6.2, 22.5);

    const cameraGoal = {
      active: false,
      pos: new THREE.Vector3(0, 6.2, 22.5),
      target: new THREE.Vector3(0, 0, 0),
    };

    controls.addEventListener('start', () => {
      cameraGoal.active = false;
    });

    let lastZoomUpdate = 0;
    const syncZoomPct = () => {
      const now = performance.now();
      if (now - lastZoomUpdate < 90) return;
      lastZoomUpdate = now;
      const dist = camera.position.distanceTo(controls.target);
      const pct = Math.round((DEFAULT_CAM_DIST / Math.max(dist, 0.5)) * 100);
      setZoomPct(Math.min(720, Math.max(55, pct)));
    };
    controls.addEventListener('change', syncZoomPct);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 1.3);
    keyLight.position.set(14, 18, 12);
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x05070b, 0.7);
    scene.add(hemiLight);

    const disposables: { dispose: () => void }[] = [];

    // ==================== 1. PHYSICS-DRIVEN 2,000 STARDUST PARTICLE FIELD ====================
    const PARTICLE_COUNT = 2000;
    const dustPositions = new Float32Array(PARTICLE_COUNT * 3);
    const dustAnchors = new Float32Array(PARTICLE_COUNT * 3);
    const dustVelocities = new Float32Array(PARTICLE_COUNT * 3);
    const dustColors = new Float32Array(PARTICLE_COUNT * 3);
    const dustSizes = new Float32Array(PARTICLE_COUNT);
    const dustPhases = new Float32Array(PARTICLE_COUNT);

    const pillarPalette = Object.values(PILLAR_COLORS).map((hex) => new THREE.Color(hex));

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const radius = 3.2 + Math.pow(Math.random(), 0.72) * 18.5;
      const theta = Math.random() * Math.PI * 2;
      const ySpread = (Math.random() - 0.5) * 11.5 * (1 - radius / 32);

      const x = Math.cos(theta) * radius;
      const y = ySpread;
      const z = Math.sin(theta) * radius;

      dustPositions[i3] = x;
      dustPositions[i3 + 1] = y;
      dustPositions[i3 + 2] = z;

      dustAnchors[i3] = x;
      dustAnchors[i3 + 1] = y;
      dustAnchors[i3 + 2] = z;

      const c = pillarPalette[i % pillarPalette.length].clone().lerp(new THREE.Color(0xe2e8f0), 0.48);
      dustColors[i3] = c.r;
      dustColors[i3 + 1] = c.g;
      dustColors[i3 + 2] = c.b;

      dustSizes[i] = 1.6 + Math.random() * 3.4;
      dustPhases[i] = Math.random() * Math.PI * 2;
    }

    const dustGeo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(dustPositions, 3);
    dustGeo.setAttribute('position', posAttr);
    dustGeo.setAttribute('aColor', new THREE.BufferAttribute(dustColors, 3));
    dustGeo.setAttribute('aSize', new THREE.BufferAttribute(dustSizes, 1));
    dustGeo.setAttribute('aPhase', new THREE.BufferAttribute(dustPhases, 1));

    const dustMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2) },
        uShockOrigin: { value: new THREE.Vector3(0, 0, 0) },
        uShockRadius: { value: -10 },
        uShockStrength: { value: 0 },
      },
      vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aPhase;
        uniform float uTime;
        uniform float uPixelRatio;
        uniform vec3 uShockOrigin;
        uniform float uShockRadius;
        uniform float uShockStrength;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = aColor;
          vec3 p = position;
          float distToWave = abs(length(p - uShockOrigin) - uShockRadius);
          float shockRing = exp(-distToWave * 0.85) * uShockStrength;

          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          float twinkle = 0.72 + 0.28 * sin(uTime * 1.9 + aPhase);
          vAlpha = clamp(0.55 * twinkle + shockRing * 0.55, 0.2, 1.0);
          gl_PointSize = (aSize + shockRing * 3.8) * uPixelRatio * (52.0 / max(-mvPosition.z, 1.0));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float glow = pow(1.0 - d * 2.0, 2.0);
          gl_FragColor = vec4(vColor, glow * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);
    disposables.push(dustGeo, dustMat);

    // Subtle concentric orbital reference rings
    const ringRefMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.07,
    });
    disposables.push(ringRefMat);
    [5.6, 8.2, 10.9].forEach((r) => {
      const pts: THREE.Vector3[] = [];
      for (let s = 0; s <= 96; s++) {
        const a = (s / 96) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
      }
      const rGeo = new THREE.BufferGeometry().setFromPoints(pts);
      disposables.push(rGeo);
      scene.add(new THREE.Line(rGeo, ringRefMat));
    });

    // ==================== 2. 27 FLOATING SPACECRAFT LIGHT PHYSICS NODES ====================
    const coreGeo = new THREE.SphereGeometry(0.19, 18, 18);
    const coronaGeo = new THREE.SphereGeometry(0.46, 20, 20);
    const ringGeo = new THREE.TorusGeometry(0.36, 0.022, 10, 36);
    const outerRingGeo = new THREE.TorusGeometry(0.58, 0.014, 8, 42);
    const hitGeo = new THREE.SphereGeometry(0.72, 10, 10);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.18,
    });

    disposables.push(coreGeo, coronaGeo, ringGeo, outerRingGeo, hitGeo, hitMat, ringMat);

    const nodes: PhysicsNode[] = [];
    const clickables: THREE.Object3D[] = [];

    MISSIONS.forEach((mission, idx) => {
      const anchor = computeConstellationAnchor(mission, idx, MISSIONS.length);
      const colorHex = PILLAR_COLORS[mission.disposalReason];
      const baseColor = new THREE.Color(colorHex);

      const group = new THREE.Group();
      group.position.copy(anchor);

      const coreMat = new THREE.MeshBasicMaterial({ color: baseColor });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      group.add(coreMesh);

      const coronaMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: baseColor.clone() },
          uPulse: { value: 0 },
          uExpand: { value: 0 },
          uDim: { value: 1 },
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
          uniform float uTime;
          uniform vec3 uColor;
          uniform float uPulse;
          uniform float uExpand;
          uniform float uDim;
          varying vec3 vNormal;
          varying vec3 vViewPos;

          void main() {
            vec3 viewDir = normalize(vViewPos);
            float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
            float breath = 0.55 + 0.45 * sin(uTime * 2.4 + uPulse * 6.28);
            float intensity = pow(rim, 1.8) * (0.7 + uExpand * 1.15 + uPulse * 0.9) * breath;
            gl_FragColor = vec4(uColor + vec3(uExpand * 0.25), clamp(intensity * uDim, 0.0, 1.0));
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
      });

      const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
      group.add(coronaMesh);

      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 3;
      group.add(ringMesh);

      const outerRingMesh = new THREE.Mesh(outerRingGeo, ringMat);
      outerRingMesh.rotation.y = Math.PI / 4;
      outerRingMesh.scale.setScalar(0.001);
      group.add(outerRingMesh);

      const hitProxy = new THREE.Mesh(hitGeo, hitMat);
      hitProxy.layers.set(1);
      hitProxy.userData = { missionId: mission.id, index: idx };
      group.add(hitProxy);

      scene.add(group);
      clickables.push(hitProxy);
      disposables.push(coreMat, coronaMat);

      const mass = Math.max(0.8, Math.log10((mission.hardwareMassKg || 50) + 12));

      nodes.push({
        mission,
        index: idx,
        anchor,
        pos: anchor.clone(),
        vel: new THREE.Vector3(),
        mass,
        phase: idx * 0.73,
        expandFactor: 0,
        pulseBurst: 0,
        group,
        coreMesh,
        ringMesh,
        outerRingMesh,
        coronaMat,
        coreMat,
        hitProxy,
      });
    });

    // Dynamic Constellation Filament Lines
    const maxLineSegments = MISSIONS.length * 2;
    const linePositions = new Float32Array(maxLineSegments * 2 * 3);
    const lineColors = new Float32Array(maxLineSegments * 2 * 3);
    const lineGeo = new THREE.BufferGeometry();
    const linePosAttr = new THREE.BufferAttribute(linePositions, 3);
    const lineColAttr = new THREE.BufferAttribute(lineColors, 3);
    lineGeo.setAttribute('position', linePosAttr);
    lineGeo.setAttribute('color', lineColAttr);
    lineGeo.setDrawRange(0, 0);

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const constellationLines = new THREE.LineSegments(lineGeo, lineMat);
    constellationLines.frustumCulled = false;
    scene.add(constellationLines);
    disposables.push(lineGeo, lineMat);

    // Shockwave state
    const shockState = {
      origin: new THREE.Vector3(),
      radius: -10,
      strength: 0,
      active: false,
    };

    const triggerShockwave = (origin?: THREE.Vector3, strength = 1.0) => {
      if (origin) shockState.origin.copy(origin);
      else shockState.origin.set(0, 0, 0);
      shockState.radius = 0.2;
      shockState.strength = strength;
      shockState.active = true;

      // Apply immediate kinetic impulse to nearby physics nodes
      nodes.forEach((n) => {
        _vecA.subVectors(n.pos, shockState.origin);
        const dist = _vecA.length();
        if (dist > 0.01 && dist < 18) {
          _vecA.normalize();
          const impulse = ((18 - dist) / 18) * (3.2 * strength) / n.mass;
          n.vel.addScaledVector(_vecA, impulse);
          n.pulseBurst = Math.min(1.5, n.pulseBurst + 0.7 * strength);
        } else if (dist <= 0.01) {
          n.pulseBurst = 1.6;
        }
      });
    };

    const clampTargetGoal = (targetVec: THREE.Vector3) => {
      if (targetVec.lengthSq() > 18 * 18) {
        targetVec.setLength(18);
      }
    };

    sceneActionsRef.current = {
      triggerShockwave,
      focusMission: (missionId: string) => {
        const targetNode = nodes.find((n) => n.mission.id === missionId);
        if (!targetNode) return;
        triggerShockwave(targetNode.pos, 1.15);
        targetNode.pulseBurst = 1.6;

        // Place camera smoothly facing the node while leaving room for HUD card
        _vecA.copy(targetNode.pos).normalize();
        if (_vecA.lengthSq() < 0.01) _vecA.set(0, 0, 1);
        _camGoalTarget.copy(targetNode.pos);
        _camGoalPos
          .copy(targetNode.pos)
          .addScaledVector(_vecA, 7.6)
          .add(new THREE.Vector3(0, 1.2, 0));
        cameraGoal.pos.copy(_camGoalPos);
        cameraGoal.target.copy(_camGoalTarget);
        cameraGoal.active = true;
      },
      panBy: (rightUnits: number, upUnits: number) => {
        const baseTarget = cameraGoal.active ? cameraGoal.target : controls.target;
        const basePos = cameraGoal.active ? cameraGoal.pos : camera.position;

        // Screen-space right & up vectors derived from camera orientation
        _panRight.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
        _panUp.setFromMatrixColumn(camera.matrixWorld, 1).normalize();

        _camGoalTarget
          .copy(baseTarget)
          .addScaledVector(_panRight, rightUnits)
          .addScaledVector(_panUp, upUnits);
        clampTargetGoal(_camGoalTarget);

        _vecA.subVectors(_camGoalTarget, baseTarget);
        _camGoalPos.copy(basePos).add(_vecA);

        cameraGoal.target.copy(_camGoalTarget);
        cameraGoal.pos.copy(_camGoalPos);
        cameraGoal.active = true;
      },
      zoomBy: (factor: number) => {
        const baseTarget = cameraGoal.active ? cameraGoal.target : controls.target;
        const basePos = cameraGoal.active ? cameraGoal.pos : camera.position;

        _zoomOffset.subVectors(basePos, baseTarget);
        const currentDist = Math.max(_zoomOffset.length(), 0.1);
        const nextDist = THREE.MathUtils.clamp(
          currentDist * factor,
          controls.minDistance,
          controls.maxDistance,
        );
        _zoomOffset.setLength(nextDist);

        cameraGoal.target.copy(baseTarget);
        cameraGoal.pos.copy(baseTarget).add(_zoomOffset);
        cameraGoal.active = true;

        const pct = Math.round((DEFAULT_CAM_DIST / Math.max(nextDist, 0.5)) * 100);
        setZoomPct(Math.min(720, Math.max(55, pct)));
      },
      resetView: () => {
        setSelectedId(null);
        cameraGoal.pos.set(0, 6.2, 22.5);
        cameraGoal.target.set(0, 0, 0);
        cameraGoal.active = true;
        setZoomPct(100);
        triggerShockwave(undefined, 0.75);
      },
    };

    // ==================== 3. RAYCASTING & POINTER VORTEX PHYSICS ====================
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2(-99, -99);
    const pointerWorld = new THREE.Vector3(999, 999, 999);
    let pointerActive = false;
    let hoveredNodeId: string | null = null;
    let lastHoverCheck = 0;

    const updatePointer = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerMove = (e: PointerEvent) => {
      pointerActive = true;
      updatePointer(e);

      // Update world-space pointer position on focal plane for particle physics
      _rayPlane.setFromNormalAndCoplanarPoint(
        camera.getWorldDirection(_vecC).negate(),
        controls.target,
      );
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(_rayPlane, _rayHit)) {
        pointerWorld.copy(_rayHit);
      }

      const now = performance.now();
      if (now - lastHoverCheck < 45) return;
      lastHoverCheck = now;

      const hits = raycaster.intersectObjects(clickables, false);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData.missionId as string;
        hoveredNodeId = hitId;
        const found = nodes.find((n) => n.mission.id === hitId);
        if (found) {
          _projVec.copy(found.pos).project(camera);
          const rect = renderer.domElement.getBoundingClientRect();
          const sx = ((_projVec.x + 1) * 0.5) * rect.width;
          const sy = ((-_projVec.y + 1) * 0.5) * rect.height;
          setHoveredInfo({
            id: found.mission.id,
            name: found.mission.name,
            pillar: found.mission.disposalReason,
            region: found.mission.region,
            x: sx,
            y: sy,
          });
          renderer.domElement.style.cursor = 'pointer';
        }
      } else {
        hoveredNodeId = null;
        setHoveredInfo(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const onPointerLeave = () => {
      pointerActive = false;
      hoveredNodeId = null;
      setHoveredInfo(null);
    };

    let downX = 0;
    let downY = 0;
    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 7) return;
      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickables, false);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData.missionId as string;
        const found = nodes.find((n) => n.mission.id === hitId);
        if (found) {
          _projVec.copy(found.pos).project(camera);
          setProfileOrigin({
            x: Math.min(82, Math.max(18, ((_projVec.x + 1) * 0.5) * 100)),
            y: Math.min(80, Math.max(20, ((-_projVec.y + 1) * 0.5) * 100)),
          });
        }
        handleSelectNode(hitId);
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // ==================== 4. PHYSICS & ANIMATION LOOP ====================
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
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      const activeSelected = selectedIdRef.current;
      const activeFilter = filterPillarRef.current;
      const litSet = litIdsRef.current;

      // Update Shockwave
      if (shockState.active) {
        shockState.radius += dt * 16.5;
        shockState.strength *= Math.exp(-2.4 * dt);
        if (shockState.strength < 0.02 || shockState.radius > 34) {
          shockState.active = false;
          shockState.strength = 0;
        }
      }
      dustMat.uniforms.uTime.value = elapsed;
      dustMat.uniforms.uShockOrigin.value.copy(shockState.origin);
      dustMat.uniforms.uShockRadius.value = shockState.radius;
      dustMat.uniforms.uShockStrength.value = shockState.strength;

      // Step 2,000 Stardust Particle Physics (spring-to-orbit + curl drift + pointer swirl)
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const px = dustPositions[i3];
        const py = dustPositions[i3 + 1];
        const pz = dustPositions[i3 + 2];

        const ax = dustAnchors[i3];
        const ay = dustAnchors[i3 + 1];
        const az = dustAnchors[i3 + 2];

        // Gentle orbital rotation around Y + harmonic float
        const phase = dustPhases[i];
        const targetX = ax * Math.cos(elapsed * 0.045) - az * Math.sin(elapsed * 0.045);
        const targetZ = ax * Math.sin(elapsed * 0.045) + az * Math.cos(elapsed * 0.045);
        const targetY = ay + Math.sin(elapsed * 0.7 + phase) * 0.25;

        let vx = (dustVelocities[i3] + (targetX - px) * 2.2 * dt) * 0.92;
        let vy = (dustVelocities[i3 + 1] + (targetY - py) * 2.2 * dt) * 0.92;
        let vz = (dustVelocities[i3 + 2] + (targetZ - pz) * 2.2 * dt) * 0.92;

        if (pointerActive) {
          const dx = px - pointerWorld.x;
          const dy = py - pointerWorld.y;
          const dz = pz - pointerWorld.z;
          const dSq = dx * dx + dy * dy + dz * dz;
          if (dSq < 18 && dSq > 0.05) {
            const d = Math.sqrt(dSq);
            const push = ((4.2 - d) / 4.2) * 5.2 * dt;
            // Swirl tangentially + push gently outward
            vx += (dx / d) * push - (dz / d) * push * 0.65;
            vy += (dy / d) * push;
            vz += (dz / d) * push + (dx / d) * push * 0.65;
          }
        }

        dustVelocities[i3] = vx;
        dustVelocities[i3 + 1] = vy;
        dustVelocities[i3 + 2] = vz;

        dustPositions[i3] = px + vx * dt * 16;
        dustPositions[i3 + 1] = py + vy * dt * 16;
        dustPositions[i3 + 2] = pz + vz * dt * 16;
      }
      posAttr.needsUpdate = true;

      // Step 27 Spacecraft Light Nodes Physics
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const isSelected = activeSelected === node.mission.id;
        const isHovered = hoveredNodeId === node.mission.id;
        const isLit = litSet.includes(node.mission.id);
        const matchesFilter =
          activeFilter === 'All' || node.mission.disposalReason === activeFilter;

        // Floating harmonic target offset around anchor
        const floatY = Math.sin(elapsed * 1.15 + node.phase) * 0.42;
        const floatX = Math.cos(elapsed * 0.72 + node.phase * 1.3) * 0.25;
        _vecA.set(node.anchor.x + floatX, node.anchor.y + floatY, node.anchor.z);

        // Spring restoring force F = -k * (pos - target)
        _vecB.subVectors(_vecA, node.pos);
        node.vel.addScaledVector(_vecB, (4.8 * dt) / node.mass);

        // Pointer magnetic attraction/repulsion micro-physics
        if (pointerActive && matchesFilter) {
          _vecB.subVectors(pointerWorld, node.pos);
          const d = _vecB.length();
          if (d < 4.5 && d > 0.2) {
            _vecB.normalize();
            node.vel.addScaledVector(_vecB, ((4.5 - d) / 4.5) * 2.4 * dt);
          }
        }

        // Damping
        node.vel.multiplyScalar(Math.exp(-3.4 * dt));
        node.pos.addScaledVector(node.vel, dt);
        node.group.position.copy(node.pos);

        // Smooth Expansion + Pulse animation
        const targetExpand = isSelected ? 1.0 : isHovered ? 0.55 : isLit ? 0.28 : 0.0;
        node.expandFactor = THREE.MathUtils.damp(node.expandFactor, targetExpand, 6.5, dt);
        node.pulseBurst = THREE.MathUtils.damp(node.pulseBurst, 0, 2.8, dt);

        const baseScale = matchesFilter ? 1.0 : 0.52;
        const dynamicPulse = 1 + Math.sin(elapsed * 3.1 + node.phase) * 0.08 + node.pulseBurst * 0.22;
        const scale = baseScale * (1 + node.expandFactor * 0.95) * dynamicPulse;
        node.group.scale.setScalar(scale);

        node.ringMesh.rotation.z += dt * (0.7 + node.expandFactor * 2.4);
        node.ringMesh.rotation.x += dt * (0.35 + node.expandFactor * 0.8);
        node.outerRingMesh.scale.setScalar(0.001 + node.expandFactor * 1.05);
        node.outerRingMesh.rotation.y -= dt * (1.2 + node.expandFactor * 2.2);

        // Corona uniform updates
        node.coronaMat.uniforms.uTime.value = elapsed;
        node.coronaMat.uniforms.uExpand.value = node.expandFactor;
        node.coronaMat.uniforms.uPulse.value = node.pulseBurst + (isLit ? 0.45 : 0);
        node.coronaMat.uniforms.uDim.value = matchesFilter ? 1.0 : 0.22;

        if (isSelected || isLit) {
          node.coreMat.color.setHex(isSelected ? 0xffffff : 0xfde68a);
        } else {
          node.coreMat.color.set(PILLAR_COLORS[node.mission.disposalReason]);
        }
      }

      // Update Constellation Filaments connected to Selected or Hovered node
      const focusId = activeSelected ?? hoveredNodeId;
      let segCount = 0;
      if (focusId) {
        const srcNode = nodes.find((n) => n.mission.id === focusId);
        if (srcNode) {
          const srcColor = new THREE.Color(PILLAR_COLORS[srcNode.mission.disposalReason]);
          for (let j = 0; j < nodes.length && segCount < maxLineSegments; j++) {
            const other = nodes[j];
            if (other.mission.id === srcNode.mission.id) continue;
            if (
              other.mission.disposalReason === srcNode.mission.disposalReason ||
              other.mission.region === srcNode.mission.region
            ) {
              const offset = segCount * 6;
              linePositions[offset] = srcNode.pos.x;
              linePositions[offset + 1] = srcNode.pos.y;
              linePositions[offset + 2] = srcNode.pos.z;
              linePositions[offset + 3] = other.pos.x;
              linePositions[offset + 4] = other.pos.y;
              linePositions[offset + 5] = other.pos.z;

              lineColors[offset] = srcColor.r;
              lineColors[offset + 1] = srcColor.g;
              lineColors[offset + 2] = srcColor.b;
              lineColors[offset + 3] = srcColor.r * 0.45;
              lineColors[offset + 4] = srcColor.g * 0.45;
              lineColors[offset + 5] = srcColor.b * 0.45;
              segCount++;
            }
          }
        }
      }
      lineGeo.setDrawRange(0, segCount * 2);
      linePosAttr.needsUpdate = true;
      lineColAttr.needsUpdate = true;

      // Camera damping
      if (cameraGoal.active) {
        const alpha = 1 - Math.exp(-4.6 * dt);
        camera.position.lerp(cameraGoal.pos, alpha);
        controls.target.lerp(cameraGoal.target, alpha);
        if (camera.position.distanceTo(cameraGoal.pos) < 0.08) {
          cameraGoal.active = false;
        }
      }

      // Clamp manual pan target within particle field envelope
      if (controls.target.lengthSq() > 18 * 18) {
        _vecA.copy(controls.target).setLength(18);
        _vecB.subVectors(_vecA, controls.target);
        controls.target.copy(_vecA);
        camera.position.add(_vecB);
      }

      controls.autoRotate = !isSoftwareGl && autoOrbitRef.current && !activeSelected;
      controls.autoRotateSpeed = 0.48;
      controls.update();

      renderer.render(scene, camera);

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };

    const onResize = () => {
      if (!host) return;
      const w = Math.max(host.clientWidth, 1);
      const h = Math.max(host.clientHeight, 1);
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
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.removeEventListener('change', syncZoomPct);
      cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      controls.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [handleSelectNode]);

  return (
    <section className="relative w-full h-[calc(100vh-64px)] min-h-[640px] bg-[#03050A] overflow-hidden border-b border-white/10">
      {/* Isolated WebGL Canvas Container */}
      <div ref={hostRef} className="w-full h-full" />

      {/* Top-Left Minimal Context Overlay (No backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute top-5 left-5 right-5 flex flex-wrap items-start justify-between gap-4 z-10">
        <div className="pointer-events-auto max-w-md p-4 rounded-md bg-[#080B12]/92 border border-white/15">
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-[#7DD3FC]" />
            <span>A living memorial · {MISSIONS.length} missions</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#FCD34D] tabular-nums">{litMemoryIds.length}/27 Honored</span>
          </div>
          <h1 className="mt-1 text-xl sm:text-2xl font-semibold text-white tracking-tight">
            A light for every mission
          </h1>
          <p className="mt-1 text-xs text-slate-300 leading-relaxed">
            Every beacon marks a spacecraft left beyond Earth. Select one to discover its story, explore the sky, or leave a memorial light.
          </p>
        </div>

        {/* Quick Navigation Hint */}
        {!selectedMission && (
          <div className="pointer-events-auto hidden md:flex items-center gap-2 px-3 py-2 rounded-md bg-[#080B12]/90 border border-white/10 font-mono text-[11px] text-slate-300">
            <Compass className="w-3.5 h-3.5 text-[#7DD3FC]" />
            <span>
              {navMode === 'pan' ? 'Drag to pan · Right-drag to orbit' : '              Drag to explore · Right-drag or WASD to move'} · Scroll or +/− to zoom
            </span>
          </div>
        )}
      </div>

      {/* Floating Hover Tooltip anchored near hovered 3D Node */}
      {hoveredInfo && hoveredInfo.id !== selectedId && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[125%] px-3 py-2 rounded-md bg-[#080C16]/95 border border-white/20 shadow-lg whitespace-nowrap"
          style={{ left: hoveredInfo.x, top: hoveredInfo.y }}
        >
          <div className="text-xs font-semibold text-white">{hoveredInfo.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-slate-300">
            <span style={{ color: PILLAR_COLORS[hoveredInfo.pillar] }}>{hoveredInfo.pillar}</span>
            <span aria-hidden="true">·</span>
            <span>{hoveredInfo.region}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400">Select to read</span>
          </div>
        </div>
      )}

      {/* Expanded Mission Profile Card emerging smoothly from the selected spacecraft light */}
      <AnimatePresence>
        {selectedMission && (
          <motion.aside
            key={selectedMission.id}
            initial={{ opacity: 0, scale: 0.72 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.78 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              transformOrigin: `${profileOrigin.x}% ${profileOrigin.y}%`,
            }}
            className="absolute top-20 right-5 bottom-24 z-20 w-[min(490px,calc(100vw-2.5rem))] overflow-y-auto rounded-xl border border-white/20 bg-[#080C15]/[0.98] shadow-2xl flex flex-col"
          >
            <div className="relative">
              <NasaImage
                src={selectedMission.imageUrl}
                alt={selectedMission.name}
                credit={selectedMission.imageCredit}
                aspectClass="aspect-[16/9]"
              />
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => stepMission(-1)}
                    aria-label="Previous spacecraft node"
                    className="p-2 rounded-md bg-[#05070B]/90 border border-white/20 text-slate-200 hover:text-white hover:border-white/50 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepMission(1)}
                    aria-label="Next spacecraft node"
                    className="p-2 rounded-md bg-[#05070B]/90 border border-white/20 text-slate-200 hover:text-white hover:border-white/50 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  aria-label="Collapse mission profile"
                  className="p-2 rounded-md bg-[#05070B]/90 border border-white/20 text-slate-200 hover:text-white hover:border-white/50 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                  <span
                    className="font-semibold"
                    style={{ color: PILLAR_COLORS[selectedMission.disposalReason] }}
                  >
                    {selectedMission.disposalReason} · {selectedMission.region}
                  </span>
                  <span className="text-slate-400">{selectedMission.status}</span>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-white leading-snug">
                    {selectedMission.name}
                  </h2>
                  <p
                    className="mt-1 text-xs font-mono"
                    style={{ color: PILLAR_COLORS[selectedMission.disposalReason] }}
                  >
                    {selectedMission.highlightTag}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-lg bg-[#050810] border border-white/10 font-mono text-xs">
                  <div>
                    <div className="text-slate-500">Mission timeline</div>
                    <div className="text-slate-200 tabular-nums mt-0.5">
                      {selectedMission.launchDate} → {selectedMission.eventDate}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Spacecraft mass</div>
                    <div className="text-slate-200 tabular-nums mt-0.5">
                      {selectedMission.hardwareMassKg.toLocaleString()} kg
                    </div>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-white/10">
                    <div className="text-slate-500">Destination</div>
                    <div className="text-slate-200 mt-0.5">
                      {selectedMission.location} ({selectedMission.coordinates})
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400">What it discovered</div>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {selectedMission.scienceReturn}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400">Why it matters</div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {selectedMission.humanStory}
                  </p>
                </div>

                {selectedFlags.length > 0 && (
                  <div className="p-2.5 rounded bg-amber-500/10 border border-amber-400/30 flex items-start gap-2 text-[11px] text-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-300" />
                    <span>Archive note: {selectedFlags[0].title}. Open the full dossier for context.</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/10 flex flex-wrap gap-2.5">
                {(() => {
                  const isLit = litMemoryIds.includes(selectedMission.id);
                  return (
                    <button
                      type="button"
                      onClick={() => handleHonorMission(selectedMission.id)}
                      className={`flex-1 min-w-[160px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[40px] rounded-md font-mono text-xs font-bold transition-colors cursor-pointer ${
                        isLit
                          ? 'bg-[#171207] border border-[#FCD34D] text-[#FCD34D]'
                          : 'bg-[#FCD34D] text-[#05070B] hover:bg-amber-300'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>{isLit ? 'Memory honored' : 'Leave a light · +15 points'}</span>
                    </button>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => onSelectMission(selectedMission)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[40px] rounded-md bg-white text-[#05070B] font-mono text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <span>Full Dossier</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[min(1120px,96vw)] flex flex-col items-center">
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          className="mb-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-t-md bg-[#080B12] border border-b-0 border-white/15 text-[11px] font-mono text-slate-300 hover:text-white cursor-pointer"
        >
          {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{dockCollapsed ? 'Explore controls' : 'Hide controls'}</span>
        </button>

        {!dockCollapsed && (
          <div className="w-full p-2 rounded-md bg-[#080B12]/95 border border-white/15 overflow-x-auto">
            <div className="flex items-center justify-between gap-3 min-w-max">
              {/* Pillar Filters */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setFilterPillar('All');
                    spaceAudio.playTelemetryPing(440);
                  }}
                  className={`px-2.5 py-2 min-h-[36px] rounded text-xs font-mono whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    filterPillar === 'All'
                      ? 'bg-white text-[#05070B] font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  All (27)
                </button>
                {PILLARS.map((p) => {
                  const active = filterPillar === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setFilterPillar(p.id);
                        spaceAudio.playTelemetryPing(520);
                      }}
                      className={`px-2.5 py-2 min-h-[36px] rounded text-xs font-mono whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                        active
                          ? 'bg-[#172136] text-white border border-white/40 font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                      style={active ? { borderColor: p.color } : undefined}
                    >
                      {p.id}
                    </button>
                  );
                })}
              </div>

              {/* Pan & Zoom Navigation Controls */}
              <div className="flex items-center gap-1.5 pl-3 border-l border-white/10">
                <div className="flex items-center rounded bg-[#050810] border border-white/10 p-0.5">
                  <button
                    type="button"
                    onClick={() => setNavMode('orbit')}
                    title="Left-drag to orbit, right-drag to pan"
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-mono whitespace-nowrap cursor-pointer ${
                      navMode === 'orbit'
                        ? 'bg-white text-[#05070B] font-semibold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Orbit className="w-3 h-3" />
                    <span>Orbit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNavMode('pan')}
                    title="Left-drag to pan across field"
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-mono whitespace-nowrap cursor-pointer ${
                      navMode === 'pan'
                        ? 'bg-white text-[#05070B] font-semibold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Hand className="w-3 h-3" />
                    <span>Pan</span>
                  </button>
                </div>

                {/* Directional Pan Controls */}
                <div className="flex items-center gap-0.5 rounded bg-[#050810] border border-white/10 p-0.5">
                  <button
                    type="button"
                    onClick={() => sceneActionsRef.current?.panBy(-2.6, 0)}
                    aria-label="Pan left"
                    title="Pan Left (A / Left Arrow)"
                    className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => sceneActionsRef.current?.panBy(0, 2.0)}
                    aria-label="Pan up"
                    title="Pan Up (W / Up Arrow)"
                    className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => sceneActionsRef.current?.panBy(0, -2.0)}
                    aria-label="Pan down"
                    title="Pan Down (S / Down Arrow)"
                    className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => sceneActionsRef.current?.panBy(2.6, 0)}
                    aria-label="Pan right"
                    title="Pan Right (D / Right Arrow)"
                    className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-1 rounded bg-[#050810] border border-white/10 px-1 py-0.5">
                  <button
                    type="button"
                    onClick={() => sceneActionsRef.current?.zoomBy(1.25)}
                    aria-label="Zoom out"
                    title="Zoom Out (-)"
                    className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[11px] text-slate-300 tabular-nums min-w-[40px] text-center">
                    {zoomPct}%
                  </span>
                  <button
                    type="button"
                    onClick={() => sceneActionsRef.current?.zoomBy(0.78)}
                    aria-label="Zoom in"
                    title="Zoom In (+)"
                    className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Physics & Camera Actions */}
              <div className="flex items-center gap-1.5 pl-3 border-l border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    sceneActionsRef.current?.triggerShockwave(undefined, 1.35);
                    spaceAudio.playTelemetryPing(620);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-2 min-h-[36px] rounded bg-[#0F172A] border border-[#7DD3FC]/40 text-xs font-mono text-[#7DD3FC] hover:bg-[#16223C] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Waves className="w-3.5 h-3.5" />
                  <span>Send a pulse</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAutoOrbit((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-2 min-h-[36px] rounded text-xs font-mono whitespace-nowrap shrink-0 cursor-pointer ${
                    autoOrbit
                      ? 'bg-[#121D33] text-white border border-white/25'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Orbit className="w-3.5 h-3.5" />
                  <span>{autoOrbit ? 'Auto' : 'Manual'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sceneActionsRef.current?.resetView();
                    spaceAudio.playTelemetryPing(392);
                  }}
                  title="Reset camera (R)"
                  className="inline-flex items-center gap-1.5 px-2.5 py-2 min-h-[36px] rounded text-xs font-mono text-slate-300 hover:text-white hover:bg-white/10 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
