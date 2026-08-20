import { useEffect, useRef } from "react";
import * as THREE from "three";

// Lightweight ambient background: drifting particle field + rotating wireframe icosahedron, tuned to the brand green palette.
const HeroCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.z = 9;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Particle field
    const particleCount = 260;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 0.05,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Central wireframe geometry (represents a "token" / blockchain node)
    const icoGeometry = new THREE.IcosahedronGeometry(2.4, 1);
    const icoMaterial = new THREE.MeshBasicMaterial({
      color: 0x16a34a,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const ico = new THREE.Mesh(icoGeometry, icoMaterial);
    ico.position.set(3.2, 0.4, -2);
    scene.add(ico);

    const icoGeometrySmall = new THREE.IcosahedronGeometry(1.1, 0);
    const icoMaterialSmall = new THREE.MeshBasicMaterial({
      color: 0x0d9488,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const icoSmall = new THREE.Mesh(icoGeometrySmall, icoMaterialSmall);
    icoSmall.position.set(-4, -1.2, -1);
    scene.add(icoSmall);

    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);

    let frameId: number;
    const clock = new THREE.Clock();
    const animate = () => {
      const elapsed = clock.getElapsedTime();

      particles.rotation.y = elapsed * 0.02;
      ico.rotation.x = elapsed * 0.08;
      ico.rotation.y = elapsed * 0.12;
      icoSmall.rotation.x = elapsed * -0.1;
      icoSmall.rotation.y = elapsed * 0.15;

      camera.position.x += (mouseX * 0.6 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 0.4 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      particleGeometry.dispose();
      particleMaterial.dispose();
      icoGeometry.dispose();
      icoMaterial.dispose();
      icoGeometrySmall.dispose();
      icoMaterialSmall.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 -z-0"
      aria-hidden="true"
    />
  );
};

export default HeroCanvas;
