"use client";

import * as React from "react";
import * as THREE from "three";

/**
 * The single 3D canvas on the entire site (PRD §51.2): an extruded, bevelled
 * "H" echoing the logo geometry. Constraints held deliberately:
 *   · simple extruded geometry, no imported model
 *   · one directional light plus ambient
 *   · only mounts when the hero is in view, and never for reduced-motion users
 *   · capped device pixel ratio and paused when the tab is hidden
 */
export default function HeroCanvas({ accent = "purple" }: { accent?: "purple" | "cyan" }) {
  const mountRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      return; // WebGL unavailable — the static fallback stays on screen.
    }

    const width = mount.clientWidth;
    const height = mount.clientHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.2);

    // --- Geometry: the H silhouette, extruded and bevelled ------------------
    const shape = new THREE.Shape();
    const w = 0.62;   // stroke width
    const h = 2.5;    // half height
    const gap = 1.28; // half distance between the uprights
    shape.moveTo(-gap - w, -h);
    shape.lineTo(-gap, -h);
    shape.lineTo(-gap, -0.34);
    shape.lineTo(gap, -0.34);
    shape.lineTo(gap, -h);
    shape.lineTo(gap + w, -h);
    shape.lineTo(gap + w, h);
    shape.lineTo(gap, h);
    shape.lineTo(gap, 0.34);
    shape.lineTo(-gap, 0.34);
    shape.lineTo(-gap, h);
    shape.lineTo(-gap - w, h);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.72,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.12,
      bevelSegments: 2,
      curveSegments: 1,
    });
    geometry.center();

    const palette =
      accent === "cyan"
        ? { base: 0x18c8f5, emissive: 0x0b4f7a, rim: 0x4f8bff }
        : { base: 0x6d4bf0, emissive: 0x2a1670, rim: 0x22e4ff };

    const material = new THREE.MeshStandardMaterial({
      color: palette.base,
      emissive: palette.emissive,
      emissiveIntensity: 0.45,
      metalness: 0.65,
      roughness: 0.28,
      flatShading: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(0.86);
    scene.add(mesh);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(4, 5, 6);
    scene.add(key);
    const rim = new THREE.PointLight(palette.rim, 26, 20);
    rim.position.set(-4.5, -2, 3.5);
    scene.add(rim);

    // --- Interaction: subtle parallax, never a full orbit control ----------
    const pointer = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 0.6;
      target.y = ((event.clientY - rect.top) / rect.height - 0.5) * 0.4;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    let frame = 0;
    let running = true;
    const clock = new THREE.Clock();

    const render = () => {
      if (!running) return;
      frame = requestAnimationFrame(render);
      const elapsed = clock.getElapsedTime();
      pointer.x += (target.x - pointer.x) * 0.05;
      pointer.y += (target.y - pointer.y) * 0.05;
      mesh.rotation.y = pointer.x + Math.sin(elapsed * 0.25) * 0.16;
      mesh.rotation.x = -pointer.y + Math.cos(elapsed * 0.22) * 0.08;
      mesh.position.y = Math.sin(elapsed * 0.6) * 0.08;
      renderer.render(scene, camera);
    };
    render();

    const onVisibility = () => {
      running = document.visibilityState === "visible";
      if (running) render();
      else cancelAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", onVisibility);

    const resize = new ResizeObserver(() => {
      const nextWidth = mount.clientWidth;
      const nextHeight = mount.clientHeight;
      if (!nextWidth || !nextHeight) return;
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    });
    resize.observe(mount);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [accent]);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden />;
}
