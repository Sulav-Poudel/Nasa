import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildDetailedSpacecraft } from '../three/spacecraftBuilders';

export type EnvironmentTheme = 'saturn' | 'mars' | 'moon-dark' | 'moon-lit' | 'interstellar' | 'asteroid';
export type CraftManeuver = 'idle' | 'burn' | 'scan' | 'drive' | 'impact';

interface DetailedCraftStageProps {
  modelId: string;
  environment?: EnvironmentTheme;
  maneuver?: CraftManeuver;
  autoRotate?: boolean;
  className?: string;
}

export const DetailedCraftStage: React.FC<DetailedCraftStageProps> = ({
  modelId,
  environment = 'interstellar',
  maneuver = 'idle',
  autoRotate = true,
  className = 'w-full h-full',
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const maneuverRef = useRef<CraftManeuver>(maneuver);
  const autoRotateRef = useRef<boolean>(autoRotate);

  useEffect(() => {
    maneuverRef.current = maneuver;
  }, [maneuver]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

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

    const width = host.clientWidth || 800;
    const height = host.clientHeight || 500;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const bgHex =
      environment === 'mars'
        ? 0x160a07
        : environment === 'saturn'
          ? 0x09080c
          : environment === 'moon-lit'
            ? 0x060911
            : 0x04060b;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, environment === 'mars' ? 0.032 : 0.015);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 200);
    camera.position.set(4.1, 2.3, 4.9);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 2.4;
    controls.maxDistance = 12;
    controls.target.set(0, 0.35, 0);

    // Three-point + planetary bounce lighting
    const keyLight = new THREE.DirectionalLight(
      environment === 'mars' ? 0xffdfc4 : 0xfff4e0,
      2.3,
    );
    keyLight.position.set(7, 8, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(
      environment === 'saturn' ? 0xf5d090 : 0x7dd3fc,
      1.25,
    );
    rimLight.position.set(-7, 3, -6);
    scene.add(rimLight);

    const hemi = new THREE.HemisphereLight(
      environment === 'mars' ? 0x9a5b40 : 0x64748b,
      0x05070b,
      0.7,
    );
    scene.add(hemi);

    const disposables: { dispose: () => void }[] = [];

    // Distant Starfield (InstancedMesh)
    const starGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    const stars = new THREE.InstancedMesh(starGeo, starMat, 260);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 260; i++) {
      const r = 24 + Math.random() * 48;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      dummy.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        Math.abs(r * Math.cos(phi) * 0.65) + 1.5,
        r * Math.sin(phi) * Math.sin(theta),
      );
      dummy.scale.setScalar(0.5 + Math.random() * 1.2);
      dummy.updateMatrix();
      stars.setMatrixAt(i, dummy.matrix);
    }
    stars.computeBoundingSphere();
    scene.add(stars);
    disposables.push(starGeo, starMat);

    // Environment Backdrop Props (Ground or Planet)
    const isSurfaceCraft =
      modelId.includes('apollo-moon-buggies') ||
      modelId.includes('opportunity') ||
      modelId.includes('spirit') ||
      modelId.includes('curiosity') ||
      modelId.includes('perseverance') ||
      modelId.includes('insight') ||
      modelId.includes('ingenuity');

    if (isSurfaceCraft) {
      const groundColor = environment === 'mars' ? 0x6b3222 : 0x3b4250;
      const groundGeo = new THREE.CircleGeometry(18, 48);
      const groundMat = new THREE.MeshStandardMaterial({
        color: groundColor,
        roughness: 0.94,
        metalness: 0.04,
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.02;
      scene.add(ground);
      disposables.push(groundGeo, groundMat);

      // Scattered surface rocks
      const rockGeo = new THREE.DodecahedronGeometry(0.16, 0);
      const rockMat = new THREE.MeshStandardMaterial({
        color: environment === 'mars' ? 0x4a2016 : 0x525a69,
        roughness: 0.92,
      });
      const rocks = new THREE.InstancedMesh(rockGeo, rockMat, 36);
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2 + i * 0.37;
        const rad = 2.8 + (i % 7) * 1.3;
        dummy.position.set(Math.cos(a) * rad, 0.04, Math.sin(a) * rad);
        dummy.rotation.set(i, i * 0.6, 0);
        dummy.scale.set(0.7 + (i % 4) * 0.45, 0.45 + (i % 3) * 0.25, 0.8 + (i % 3) * 0.35);
        dummy.updateMatrix();
        rocks.setMatrixAt(i, dummy.matrix);
      }
      rocks.computeBoundingSphere();
      scene.add(rocks);
      disposables.push(rockGeo, rockMat);
    } else if (environment === 'saturn') {
      const saturnGeo = new THREE.SphereGeometry(7.2, 36, 28);
      const saturnMat = new THREE.MeshStandardMaterial({
        color: 0xd9b982,
        roughness: 0.72,
      });
      const saturn = new THREE.Mesh(saturnGeo, saturnMat);
      saturn.position.set(-10.5, -5.2, -16);
      scene.add(saturn);

      const ringGeo = new THREE.RingGeometry(9.2, 14.5, 64);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xe6cfa4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55,
        roughness: 0.6,
      });
      const rings = new THREE.Mesh(ringGeo, ringMat);
      rings.position.copy(saturn.position);
      rings.rotation.set(Math.PI / 2.6, 0.22, 0.12);
      scene.add(rings);
      disposables.push(saturnGeo, saturnMat, ringGeo, ringMat);
    } else if (environment === 'moon-dark') {
      // Shadowed Cabeus Crater Rim behind LCROSS / Lunar Prospector
      const moonGeo = new THREE.SphereGeometry(6.8, 32, 24);
      const moonMat = new THREE.MeshStandardMaterial({
        color: 0x3b424f,
        roughness: 0.92,
      });
      const moon = new THREE.Mesh(moonGeo, moonMat);
      moon.position.set(-7.5, -6.4, -12.5);
      scene.add(moon);
      disposables.push(moonGeo, moonMat);
    } else if (environment === 'asteroid') {
      // Target Asteroid Dimorphos in background for DART
      const astGeo = new THREE.IcosahedronGeometry(3.2, 2);
      const astMat = new THREE.MeshStandardMaterial({
        color: 0x6b7280,
        roughness: 0.95,
        flatShading: true,
      });
      const ast = new THREE.Mesh(astGeo, astMat);
      ast.position.set(-6.5, -1.2, -10.5);
      scene.add(ast);
      disposables.push(astGeo, astMat);
    }

    // Build High-Detail Procedural PBR Spacecraft
    const built = buildDetailedSpacecraft(modelId, renderer.capabilities.getMaxAnisotropy());
    if (!isSurfaceCraft) {
      built.group.position.y = 0.2;
    }
    scene.add(built.group);

    // Optional reactive telemetry scan ring around craft during 'scan' or 'burn' maneuver
    const pulseGeo = new THREE.RingGeometry(1.85, 1.92, 48);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const pulseRing = new THREE.Mesh(pulseGeo, pulseMat);
    pulseRing.rotation.x = Math.PI / 2;
    pulseRing.position.y = 0.2;
    scene.add(pulseRing);
    disposables.push(pulseGeo, pulseMat);

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
      const mode = maneuverRef.current;

      if (autoRotateRef.current) {
        built.group.rotation.y += dt * (mode === 'burn' || mode === 'impact' ? 0.42 : 0.18);
      }

      if (!isSurfaceCraft) {
        built.group.position.y = 0.2 + Math.sin(t * 1.1) * (mode === 'burn' ? 0.1 : 0.04);
      }

      if (built.animatedParts.dish) {
        const targetTilt = mode === 'scan' ? Math.sin(t * 1.8) * 0.35 : Math.sin(t * 0.45) * 0.1;
        built.animatedParts.dish.rotation.z = THREE.MathUtils.lerp(
          built.animatedParts.dish.rotation.z,
          targetTilt,
          0.12,
        );
      }

      if (built.animatedParts.wheels) {
        const wheelSpeed = mode === 'drive' ? 2.4 : 0.25;
        built.animatedParts.wheels.forEach((w) => {
          w.rotation.x += dt * wheelSpeed;
        });
      }

      if (built.animatedParts.rotors) {
        const rotorSpeed = mode === 'burn' ? 18 : 6;
        built.animatedParts.rotors.forEach((r, idx) => {
          r.rotation.y += dt * rotorSpeed * (idx % 2 === 0 ? 1 : -1);
        });
      }

      if (built.animatedParts.plume) {
        built.animatedParts.plume.visible = mode === 'burn' || mode === 'impact';
        built.animatedParts.plume.scale.setScalar(0.9 + Math.sin(t * 22) * 0.12);
      }

      if (mode === 'scan' || mode === 'burn') {
        pulseMat.opacity = 0.28 + Math.sin(t * 4) * 0.14;
        const s = 1 + ((t * 0.5) % 0.45);
        pulseRing.scale.setScalar(s);
      } else {
        pulseMat.opacity = 0;
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
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    if (!isSoftwareGl) renderer.compile(scene, camera);
    tick();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      controls.dispose();
      built.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [modelId, environment]);

  return <div ref={hostRef} className={className} />;
};
