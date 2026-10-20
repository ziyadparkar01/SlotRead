/**
 * SlothRead — 3D Parametric Torus Knot & Geometric Particle Lattice
 * Powered by Three.js (r128)
 * Theme: "Slow and Steady" — Slow, meditative continuous rotation
 * with smooth interactive camera parallax responding to mousemove & scroll.
 */

(function () {
  'use strict';

  // Ensure Three.js is loaded
  if (typeof THREE === 'undefined') {
    console.warn('Three.js library is not detected. 3D background initialization paused.');
    return;
  }

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) {
    return;
  }

  // Scene setup
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07090E, 0.0018);

  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(0, 0, 420);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    console.warn('WebGL initialization failed:', err);
    return;
  }

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Create Torus Knot wireframe mesh
  // Parametric curve: tubular segments 160, radial segments 32, p=2, q=3
  const knotGeometry = new THREE.TorusKnotGeometry(120, 32, 180, 28, 2, 3);
  
  // Custom wireframe material with subtle electric indigo color
  const knotMaterial = new THREE.MeshBasicMaterial({
    color: 0x6366F1,
    wireframe: true,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending
  });

  const torusKnot = new THREE.Mesh(knotGeometry, knotMaterial);
  scene.add(torusKnot);

  // Secondary outer lattice sphere for depth
  const sphereGeometry = new THREE.IcosahedronGeometry(220, 2);
  const sphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x10B981,
    wireframe: true,
    transparent: true,
    opacity: 0.07,
    blending: THREE.AdditiveBlending
  });
  const outerSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  scene.add(outerSphere);

  // Floating ambient particulate constellation
  const particleCount = 450;
  const particlePositions = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);

  const indigoColor = new THREE.Color(0x6366F1);
  const emeraldColor = new THREE.Color(0x10B981);
  const slateColor = new THREE.Color(0x94A3B8);

  for (let i = 0; i < particleCount; i++) {
    const x = (Math.random() - 0.5) * 1100;
    const y = (Math.random() - 0.5) * 900;
    const z = (Math.random() - 0.5) * 800;

    particlePositions[i * 3] = x;
    particlePositions[i * 3 + 1] = y;
    particlePositions[i * 3 + 2] = z;

    const rChoice = Math.random();
    const c = rChoice > 0.6 ? indigoColor : (rChoice > 0.3 ? emeraldColor : slateColor);
    particleColors[i * 3] = c.r;
    particleColors[i * 3 + 1] = c.g;
    particleColors[i * 3 + 2] = c.b;
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: 3.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending
  });

  const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);

  // Mouse & Scroll Parallax State
  let targetMouseX = 0;
  let targetMouseY = 0;
  let currentMouseX = 0;
  let currentMouseY = 0;
  let targetScrollY = 0;
  let currentScrollY = 0;

  function onMouseMove(event) {
    targetMouseX = (event.clientX - window.innerWidth / 2) * 0.28;
    targetMouseY = (event.clientY - window.innerHeight / 2) * 0.28;
  }

  function onScroll() {
    targetScrollY = window.scrollY * 0.22;
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });

  // Handle Resize
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  window.addEventListener('resize', onWindowResize);

  // WebGL context restoration
  canvas.addEventListener('webglcontextlost', function (event) {
    event.preventDefault();
    console.warn('WebGL Context Lost.');
  }, false);

  canvas.addEventListener('webglcontextrestored', function () {
    console.info('WebGL Context Restored.');
  }, false);

  // Animation Loop: "Slow and steady" rotation
  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Lerp mouse parallax for butter-smooth camera movement
    currentMouseX += (targetMouseX - currentMouseX) * 0.04;
    currentMouseY += (targetMouseY - currentMouseY) * 0.04;
    currentScrollY += (targetScrollY - currentScrollY) * 0.05;

    camera.position.x = currentMouseX;
    camera.position.y = -currentMouseY - currentScrollY;
    camera.lookAt(scene.position);

    // Meditative slow rotation
    torusKnot.rotation.x += delta * 0.12;
    torusKnot.rotation.y += delta * 0.18;

    outerSphere.rotation.x -= delta * 0.06;
    outerSphere.rotation.z += delta * 0.08;

    particleSystem.rotation.y += delta * 0.03;
    particleSystem.rotation.x -= delta * 0.015;

    renderer.render(scene, camera);
  }

  animate();
})();
