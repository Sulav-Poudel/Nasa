import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, ExternalLink, Image as ImageIcon, RotateCcw, Box } from 'lucide-react';
import { MISSIONS, MISSION_PROFILES, THREED_MODELS } from '../data/archive';
import { buildProceduralSpacecraft, type BuiltSpacecraft } from '../three/spacecraftBuilders';
import { NasaImage } from './NasaImage';
import { spaceAudio } from '../utils/audio';

const _goalPos = new THREE.Vector3();
const _goalTarget = new THREE.Vector3();

const MODEL_FALLBACK_MISSION: Record<string, string> = {
  curiosity: 'curiosity-msl',
  apollo: 'apollo-moon-buggies',
  voyager: 'voyager-1',
  perseverance: 'perseverance-m2020',
  ingenuity: 'ingenuity-helicopter',
};

export const SpacecraftLab: React.FC = () => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>(THREED_MODELS[0].id);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>('mast');
  const [viewMode, setViewMode] = useState<'3d' | 'photo'>('3d');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);

  const model = useMemo(
    () => THREED_MODELS.find((m) => m.id === selectedModelId) ?? THREED_MODELS[0],
    [selectedModelId],
  );
  const profile = MISSION_PROFILES[model.id];
  const linkedMission = useMemo(
    () => MISSIONS.find((m) => m.id === MODEL_FALLBACK_MISSION[model.id]),
    [model.id],
  );

  const selectedComponent = useMemo(
    () => model.components?.find((c) => c.id === selectedComponentId) ?? null,
    [model, selectedComponentId],
  );

  const sceneRefs = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    controls?: OrbitControls;
    renderer?: THREE.WebGLRenderer;
    craft?: BuiltSpacecraft;
    cameraGoal?: { active: boolean; pos: THREE.Vector3; target: THREE.Vector3 };
    requestRender?: () => void;
  }>({});

  // Initialize Three.js renderer once
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
      setWebglFailed(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060911);
    scene.fog = new THREE.FogExp2(0x060911, 0.045);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(42, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.set(3.8, 2.4, 4.4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.minDistance = 1.6;
    controls.maxDistance = 11;
    controls.target.set(0, 0.9, 0);

    const cameraGoal = {
      active: false,
      pos: new THREE.Vector3(3.8, 2.4, 4.4),
      target: new THREE.Vector3(0, 0.9, 0),
    };

    controls.addEventListener('start', () => {
      cameraGoal.active = false;
    });

    // Studio 3-Point Lighting
    const keyLight = new THREE.DirectionalLight(0xfff2dc, 2.2);
    keyLight.position.set(5, 8, 6);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const hemi = new THREE.HemisphereLight(0x94a3b8, 0x090d16, 0.85);
    scene.add(hemi);

    const rim = new THREE.DirectionalLight(0x7dd3fc, 0.95);
    rim.position.set(-5, 3, -5);
    scene.add(rim);

    // Subtle calibration floor grid
    const gridHelper = new THREE.GridHelper(16, 24, 0x334155, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    sceneRefs.current = { scene, camera, controls, renderer, cameraGoal };

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
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

    const requestRender = () => {
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        renderDirty = false;
        const dt = Math.min(clock.getDelta(), 0.1);
        let needsAnother = false;

        if (cameraGoal.active) {
          _goalPos.copy(cameraGoal.pos);
          _goalTarget.copy(cameraGoal.target);
          const alpha = 1 - Math.exp(-5.5 * dt);
          camera.position.lerp(_goalPos, alpha);
          controls.target.lerp(_goalTarget, alpha);
          if (camera.position.distanceTo(_goalPos) < 0.04) {
            cameraGoal.active = false;
          } else {
            needsAnother = true;
          }
        }

        const changed = controls.update();
        if (changed) needsAnother = true;

        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (renderDirty || needsAnother) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    };

    sceneRefs.current.requestRender = requestRender;
    controls.addEventListener('change', requestRender);

    // Raycaster for interactive Curiosity hotspots
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;
    const onDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
      const craft = sceneRefs.current.craft;
      if (!craft || craft.interactiveMeshes.length === 0) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(craft.interactiveMeshes, false);
      if (hits.length > 0) {
        const compId = hits[0].object.userData.componentId;
        if (compId) {
          setSelectedComponentId(compId);
          spaceAudio.playTelemetryPing(680);
          const targetVec = craft.componentTargets[compId];
          if (targetVec) {
            cameraGoal.target.copy(targetVec);
            cameraGoal.pos.set(targetVec.x + 1.8, targetVec.y + 0.9, targetVec.z + 2.2);
            cameraGoal.active = true;
            requestRender();
          }
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);

    const onResize = () => {
      if (!host) return;
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
      requestRender();
    };
    window.addEventListener('resize', onResize);

    if (!isSoftwareGl) renderer.compile(scene, camera);
    requestRender();

    return () => {
      window.removeEventListener('resize', onResize);
      controls.removeEventListener('change', requestRender);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      sceneRefs.current.craft?.dispose();
      gridHelper.geometry.dispose();
      (gridHelper.material as THREE.Material).dispose();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Swap procedural 3D model cleanly whenever selectedModelId changes
  useEffect(() => {
    const { scene, renderer, cameraGoal, requestRender } = sceneRefs.current;
    if (!scene || !renderer || !cameraGoal || !requestRender) return;

    if (sceneRefs.current.craft) {
      scene.remove(sceneRefs.current.craft.group);
      sceneRefs.current.craft.dispose();
    }

    const built = buildProceduralSpacecraft(
      selectedModelId,
      renderer.capabilities.getMaxAnisotropy(),
    );
    scene.add(built.group);
    sceneRefs.current.craft = built;

    cameraGoal.target.set(0, selectedModelId === 'voyager' || selectedModelId === 'hubble' ? 0.2 : 0.9, 0);
    cameraGoal.pos.set(3.8, 2.3, 4.4);
    cameraGoal.active = true;
    requestRender();
  }, [selectedModelId]);

  const focusComponent = (compId: string) => {
    setSelectedComponentId(compId);
    spaceAudio.playTelemetryPing(620);
    const { craft, cameraGoal, requestRender } = sceneRefs.current;
    if (!craft || !cameraGoal || !requestRender) return;
    const targetVec = craft.componentTargets[compId];
    if (targetVec) {
      cameraGoal.target.copy(targetVec);
      cameraGoal.pos.set(targetVec.x + 1.85, targetVec.y + 0.9, targetVec.z + 2.25);
      cameraGoal.active = true;
      requestRender();
    }
  };

  const resetCamera = () => {
    const { cameraGoal, requestRender } = sceneRefs.current;
    if (!cameraGoal || !requestRender) return;
    cameraGoal.target.set(0, selectedModelId === 'voyager' || selectedModelId === 'hubble' ? 0.2 : 0.9, 0);
    cameraGoal.pos.set(3.8, 2.3, 4.4);
    cameraGoal.active = true;
    requestRender();
  };

  return (
    <section className="relative w-full h-[calc(100vh-64px)] min-h-[640px] bg-[#060911] overflow-hidden">
      {/* 3D Viewport */}
      <div
        ref={hostRef}
        className={`w-full h-full ${viewMode === 'photo' || webglFailed ? 'hidden' : 'block'}`}
      />

      {/* Photo Fallback / Reference Mode */}
      {(viewMode === 'photo' || webglFailed) && (
        <div className="w-full h-full flex items-center justify-center p-6 sm:p-12 bg-[#060911]">
          <div className="max-w-3xl w-full">
            {linkedMission ? (
              <NasaImage
                src={linkedMission.imageUrl}
                alt={model.name}
                credit={linkedMission.imageCredit}
                className="rounded-md"
              />
            ) : (
              <div className="p-10 rounded-md bg-[#0B101B] border border-white/10 text-center">
                <p className="text-lg font-semibold text-white">{model.name}</p>
                <p className="mt-2 text-sm text-slate-300">{model.description}</p>
                <p className="mt-2 font-mono text-xs text-slate-400">Credit: {model.credit}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top-Left Compact Spacecraft Spec Card */}
      <div className="pointer-events-none absolute top-5 left-5 right-5 flex flex-wrap items-start justify-between gap-4 z-10">
        <div className="pointer-events-auto max-w-md p-4 rounded-md bg-[#080B12]/94 border border-white/15">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>{model.category}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{model.year}</span>
            <span aria-hidden="true">·</span>
            <span>{model.status}</span>
          </div>
          <h1 className="mt-1 text-xl sm:text-2xl font-semibold text-white">{model.name}</h1>
          <p className="mt-2 text-xs text-slate-300 leading-relaxed">{model.description}</p>
          <p className="mt-2 text-xs text-slate-200 leading-relaxed">
            <strong className="text-white">Significance:</strong> {model.significance}
          </p>

          {profile && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="font-mono text-[11px] text-slate-400 mb-1">Mission Goals</div>
              <ul className="space-y-1 text-xs text-slate-300">
                {profile.goals.map((g) => (
                  <li key={g}>— {g}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
            <span>Credit: {model.credit}</span>
            <a
              href={model.source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-200 hover:text-white"
            >
              <span>NASA Page</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Component Inspector (Curiosity Hotspots) */}
        {model.components && model.components.length > 0 && (
          <div className="pointer-events-auto w-full sm:w-80 rounded-md bg-[#080B12]/94 border border-white/15 p-4">
            <div className="font-mono text-[11px] text-slate-400 mb-2">
              Interactive Instrument Hotspots (Click 3D part or select below)
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {model.components.map((comp) => {
                const active = comp.id === selectedComponentId;
                return (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => focusComponent(comp.id)}
                    className={`px-2.5 py-2 rounded text-left text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#E5B880] text-[#05070B] font-semibold'
                        : 'bg-[#0E1422] text-slate-200 hover:bg-[#172034]'
                    }`}
                  >
                    {comp.name}
                  </button>
                );
              })}
            </div>

            {selectedComponent && (
              <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                <div className="font-mono text-[10px] text-[#E5B880]">
                  {selectedComponent.category}
                </div>
                <div className="text-sm font-semibold text-white">
                  {selectedComponent.name}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedComponent.description}
                </p>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {selectedComponent.purpose}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collapsible Bottom Control Dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[min(960px,95vw)] flex flex-col items-center">
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          className="mb-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-t-md bg-[#080B12] border border-b-0 border-white/15 text-[11px] font-mono text-slate-300 hover:text-white cursor-pointer"
        >
          {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{dockCollapsed ? 'Show Spacecraft Lab Controls' : 'Hide Controls'}</span>
        </button>

        {!dockCollapsed && (
          <div className="w-full p-2 rounded-md bg-[#080B12]/96 border border-white/15 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto max-w-full">
              {THREED_MODELS.map((m) => {
                const active = m.id === selectedModelId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedModelId(m.id);
                      setSelectedComponentId(m.components?.[0]?.id ?? null);
                      spaceAudio.playTelemetryPing(480);
                    }}
                    className={`px-3 py-2 min-h-[38px] rounded text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      active
                        ? 'bg-white text-[#05070B] font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={resetCamera}
                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded bg-[#0E1422] border border-white/10 text-xs text-slate-200 hover:text-white cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Camera</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode((v) => (v === '3d' ? 'photo' : '3d'))}
                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded bg-[#0E1422] border border-white/10 text-xs text-slate-200 hover:text-white cursor-pointer whitespace-nowrap"
              >
                {viewMode === '3d' ? <ImageIcon className="w-3.5 h-3.5" /> : <Box className="w-3.5 h-3.5" />}
                <span>{viewMode === '3d' ? 'NASA Photo' : '3D Procedural'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
