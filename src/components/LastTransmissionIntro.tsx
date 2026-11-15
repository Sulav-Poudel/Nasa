import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { PILLARS } from '../data/archive';
import { spaceAudio } from '../utils/audio';

interface LastTransmissionIntroProps {
  onEnter: () => void;
}

const SEQUENCE_LINES = [
  'Millions of kilometers from Earth, a machine completed its final task.',
  'It would never come home.',
  'But what it left behind changed our understanding of the universe.',
];

export const LastTransmissionIntro: React.FC<LastTransmissionIntroProps> = ({ onEnter }) => {
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState(0);
  const [muted, setMuted] = useState(spaceAudio.getMuted());

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setStep(1), 650),
      window.setTimeout(() => setStep(2), 2700),
      window.setTimeout(() => setStep(3), 4900),
      window.setTimeout(() => setStep(4), 6800),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  useEffect(() => {
    const host = canvasHostRef.current;
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
    renderer.toneMappingExposure = 1.05;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth || window.innerWidth, host.clientHeight || window.innerHeight);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03050a);
    scene.fog = new THREE.FogExp2(0x03050a, 0.025);

    const camera = new THREE.PerspectiveCamera(
      45,
      (host.clientWidth || window.innerWidth) / (host.clientHeight || window.innerHeight),
      0.1,
      200,
    );
    camera.position.set(0, 1.2, 11.5);

    const keyLight = new THREE.DirectionalLight(0xffe8c8, 1.8);
    keyLight.position.set(8, 5, 6);
    scene.add(keyLight);

    const hemi = new THREE.HemisphereLight(0x475569, 0x05070b, 0.65);
    scene.add(hemi);

    // Starfield via InstancedMesh
    const starCount = 320;
    const starGeo = new THREE.SphereGeometry(0.035, 6, 6);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    const stars = new THREE.InstancedMesh(starGeo, starMat, starCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < starCount; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 48,
        (Math.random() - 0.5) * 28,
        -6 - Math.random() * 44,
      );
      const s = 0.4 + Math.random() * 1.4;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      stars.setMatrixAt(i, dummy.matrix);
    }
    stars.computeBoundingSphere();
    scene.add(stars);

    // Distant Voyager-inspired silhouette craft
    const probe = new THREE.Group();
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xdbeafe,
      roughness: 0.4,
      metalness: 0.35,
      side: THREE.DoubleSide,
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.3,
      metalness: 0.85,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xe5b880,
      roughness: 0.28,
      metalness: 0.9,
    });

    const dishPts = [
      new THREE.Vector2(0.01, 0),
      new THREE.Vector2(0.5, 0.1),
      new THREE.Vector2(1.05, 0.36),
    ];
    const dishGeo = new THREE.LatheGeometry(dishPts, 28);
    const dish = new THREE.Mesh(dishGeo, dishMat);
    probe.add(dish);

    const busGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10);
    const bus = new THREE.Mesh(busGeo, metalMat);
    bus.position.y = -0.18;
    probe.add(bus);

    const boomGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.2, 8);
    const boom = new THREE.Mesh(boomGeo, metalMat);
    boom.rotation.z = Math.PI / 2;
    boom.position.set(-1.1, -0.18, 0);
    probe.add(boom);

    const recordGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.03, 18);
    const record = new THREE.Mesh(recordGeo, goldMat);
    record.rotation.x = Math.PI / 2;
    record.position.set(0, -0.18, 0.43);
    probe.add(record);

    probe.position.set(2.8, 0.7, -3.5);
    probe.rotation.set(0.38, -0.55, 0.22);
    scene.add(probe);

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
      const t = clock.getElapsedTime();
      probe.position.x = THREE.MathUtils.damp(probe.position.x, 1.5, 0.35, dt);
      probe.position.z = THREE.MathUtils.damp(probe.position.z, -1.8, 0.35, dt);
      probe.rotation.y = -0.55 + Math.sin(t * 0.25) * 0.12;
      stars.rotation.y += dt * 0.008;

      renderer.render(scene, camera);
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };

    const onResize = () => {
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    tick();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      starGeo.dispose();
      starMat.dispose();
      dishGeo.dispose();
      busGeo.dispose();
      boomGeo.dispose();
      recordGeo.dispose();
      dishMat.dispose();
      metalMat.dispose();
      goldMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleToggleAudio = () => {
    const nextMuted = spaceAudio.toggleMute();
    setMuted(nextMuted);
    if (!nextMuted) {
      spaceAudio.playTelemetryPing(523.25);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#03050A] text-slate-100 flex flex-col justify-between overflow-hidden">
      <div ref={canvasHostRef} className="absolute inset-0 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-6">
        <span className="font-mono text-xs tracking-wider text-slate-400">
          ABANDONED, NOT FORGOTTEN
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleAudio}
            className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-md bg-[#0E131F] border border-white/15 text-xs font-medium text-slate-200 hover:border-white/30 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{muted ? 'Enable Signal Audio' : 'Signal Audio On'}</span>
          </button>
          <button
            type="button"
            onClick={onEnter}
            className="px-3.5 py-2 min-h-[40px] rounded-md bg-transparent border border-white/15 text-xs font-medium text-slate-300 hover:text-white hover:border-white/35 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Skip Intro
          </button>
        </div>
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 py-8 flex flex-col justify-center">
        <div className="space-y-6">
          {SEQUENCE_LINES.map((line, idx) => {
            const visible = step >= idx + 1;
            return (
              <p
                key={line}
                className={`font-display transition-all duration-1000 ${
                  idx === 2
                    ? 'text-2xl sm:text-4xl md:text-5xl text-white font-normal leading-tight'
                    : 'text-lg sm:text-2xl text-slate-300 font-normal leading-relaxed'
                } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
              >
                {line}
              </p>
            );
          })}
        </div>

        <div
          className={`mt-10 pt-8 border-t border-white/10 transition-all duration-1000 ${
            step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="font-mono text-xs text-slate-400 mb-4">
            Four reasons 27 missions remain beyond Earth
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PILLARS.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-md bg-[#090D16]/90 border border-white/10"
              >
                <div className="text-sm font-semibold" style={{ color: p.color }}>
                  {p.title}
                </div>
                <p className="mt-1.5 text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {p.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => {
                spaceAudio.playTelemetryPing(659.25);
                onEnter();
              }}
              className="inline-flex items-center gap-2.5 px-6 py-3 min-h-[44px] rounded-md bg-white text-[#05070B] text-sm font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <span>Enter the Archive</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-400">
              27 Mission Records · 6 Interactive 3D Spacecraft · NASA PDS Sources
            </span>
          </div>
        </div>
      </main>

      <div className="relative z-10 px-6 sm:px-10 py-5 flex items-center justify-between text-xs font-mono text-slate-500">
        <span>Every mission leaves something behind.</span>
        <span>NASA Space Apps Challenge 2026</span>
      </div>
    </div>
  );
};
