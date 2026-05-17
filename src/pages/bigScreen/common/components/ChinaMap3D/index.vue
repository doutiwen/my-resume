<template>
  <div ref="containerRef" class="china-map-3d-container"></div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
  import Stats from 'three/addons/libs/stats.module.js';
  import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
  import provincesData from './china-provinces.json';
  import { ProvinceRenderer } from './ProvinceRenderer.js';

  const containerRef = ref(null);

  let scene = null;
  let camera = null;
  let renderer = null;
  let controls = null;
  let animationId = null;
  let provinceRenderers = [];
  let raycaster = null;
  let mouse = null;
  let stats = null;
  let gui = null;
  let axesHelper = null;
  let gridHelper = null;
  let gradientTexture = null;

  const debugParams = {
    autoRotate: false,
    rotateSpeed: 1.0,
    showEdges: true,
    edgeOpacity: 0.8,
    provinceColor: '#1e5a8a',
    emissiveIntensity: 0.25,
    hoveredEmissiveIntensity: 0.4,
    lightIntensity: 0.9,
    wireframe: false,
    showAxes: true,
    showGrid: true,
  };

  function createGradientTexture(color1, color2) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.flipY = false;
    texture.needsUpdate = true;

    return texture;
  }

  function createProvinces() {
    gradientTexture = createGradientTexture('#699dd9', '#416295');

    provincesData.features.forEach((feature) => {
      const renderer = new ProvinceRenderer(feature, gradientTexture, {
        edgeHeight: 0.15,
        baseEmissiveIntensity: debugParams.emissiveIntensity,
        hoveredEmissiveIntensity: debugParams.hoveredEmissiveIntensity,
        edgeOpacity: debugParams.edgeOpacity,
      });

      renderer.provinceGroup.userData = { name: feature.properties.name };
      scene.add(renderer.provinceGroup);
      provinceRenderers.push(renderer);
    });
  }

  function onMouseMove(event) {
    const rect = containerRef.value.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const provinceMeshes = provinceRenderers.map((p) => p.topMesh);
    const intersects = raycaster.intersectObjects(provinceMeshes);

    provinceRenderers.forEach((province) => {
      const isHovered = intersects.some((intersect) => intersect.object === province.topMesh);
      province.setHovered(isHovered);
    });
  }

  function initStats() {
    stats = new Stats();
    stats.showPanel(0);
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = '0px';
    stats.dom.style.left = '0px';
    containerRef.value.appendChild(stats.dom);
  }

  function initGUI() {
    gui = new GUI({ title: 'Three.js Dev Tools' });

    const controlsFolder = gui.addFolder('Controls');
    controlsFolder
      .add(debugParams, 'autoRotate')
      .name('Auto Rotate')
      .onChange((value) => {
        controls.autoRotate = value;
      });
    controlsFolder
      .add(debugParams, 'rotateSpeed', 0.1, 3.0, 0.1)
      .name('Rotate Speed')
      .onChange(() => {
        controls.autoRotateSpeed = debugParams.rotateSpeed;
      });

    const appearanceFolder = gui.addFolder('Appearance');
    appearanceFolder
      .addColor(debugParams, 'provinceColor')
      .name('Province Color')
      .onChange((value) => {
        provinceRenderers.forEach((province) => {
          province.setColor(value);
        });
      });
    appearanceFolder
      .add(debugParams, 'emissiveIntensity', 0, 1, 0.05)
      .name('Emissive')
      .onChange((value) => {
        provinceRenderers.forEach((province) => {
          province.setEmissiveIntensity(value);
        });
      });
    appearanceFolder
      .add(debugParams, 'hoveredEmissiveIntensity', 0, 1, 0.05)
      .name('Hovered Emissive')
      .onChange((value) => {
        provinceRenderers.forEach((province) => {
          province.topMesh.material.emissiveIntensity = province.topMesh.userData.hovered
            ? value
            : province.topMesh.material.emissiveIntensity;
        });
      });
    appearanceFolder
      .add(debugParams, 'showEdges')
      .name('Show Edges')
      .onChange((value) => {
        provinceRenderers.forEach((province) => {
          province.setEdgesVisible(value);
        });
      });
    appearanceFolder
      .add(debugParams, 'edgeOpacity', 0, 1, 0.05)
      .name('Edge Opacity')
      .onChange((value) => {
        if (!debugParams.showEdges) return;
        provinceRenderers.forEach((province) => {
          if (!province.topMesh.userData.hovered) {
            province.setEdgesVisible(debugParams.showEdges);
          }
        });
      });
    appearanceFolder
      .add(debugParams, 'wireframe')
      .name('Wireframe')
      .onChange((value) => {
        provinceRenderers.forEach((province) => {
          province.setWireframe(value);
        });
      });

    const lightsFolder = gui.addFolder('Lights');
    lightsFolder
      .add(debugParams, 'lightIntensity', 0, 2, 0.1)
      .name('Main Light')
      .onChange((value) => {
        scene.children.forEach((child) => {
          if (child instanceof THREE.DirectionalLight) {
            child.intensity = value;
          }
        });
      });

    const helpersFolder = gui.addFolder('Helpers');
    helpersFolder
      .add(debugParams, 'showAxes')
      .name('Show Axes')
      .onChange((value) => {
        if (axesHelper) {
          axesHelper.visible = value;
        }
      });
    helpersFolder
      .add(debugParams, 'showGrid')
      .name('Show Grid')
      .onChange((value) => {
        if (gridHelper) {
          gridHelper.visible = value;
        }
      });

    gui.close();
  }

  function init() {
    const container = containerRef.value;
    const width = container.clientWidth;
    const height = container.clientHeight;

    scene = new THREE.Scene();
    scene.background = null;

    camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(0, -3, 5);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 3;
    controls.maxDistance = 8;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
    controls.autoRotate = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x3b82f6, 0.9);
    directionalLight.position.set(5, 8, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x06b6d4, 0.6);
    pointLight.position.set(-5, 6, -5);
    scene.add(pointLight);

    const spotLight = new THREE.SpotLight(0xffffff, 0.7);
    spotLight.position.set(0, 12, 0);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.5;
    scene.add(spotLight);

    const hemisphereLight = new THREE.HemisphereLight(0x606060, 0x404040, 0.5);
    scene.add(hemisphereLight);

    axesHelper = new THREE.AxesHelper(3);
    scene.add(axesHelper);

    gridHelper = new THREE.GridHelper(10, 20, 0x00d4ff, 0x1a3a5c);
    gridHelper.position.y = -0.05;
    scene.add(gridHelper);

    createProvinces();

    initStats();
    initGUI();

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    window.addEventListener('resize', onWindowResize);
    container.addEventListener('mousemove', onMouseMove);
    animate();
  }

  function animate() {
    animationId = requestAnimationFrame(animate);

    if (stats) {
      stats.update();
    }

    // 更新所有省份的动画状态
    provinceRenderers.forEach((province) => {
      province.update();
    });

    controls.update();
    renderer.render(scene, camera);
  }

  function onWindowResize() {
    const container = containerRef.value;
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function dispose() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }

    window.removeEventListener('resize', onWindowResize);
    containerRef.value?.removeEventListener('mousemove', onMouseMove);

    if (stats) {
      if (containerRef.value?.contains(stats.dom)) {
        containerRef.value.removeChild(stats.dom);
      }
      stats = null;
    }

    if (gui) {
      gui.destroy();
      gui = null;
    }

    if (controls) {
      controls.dispose();
    }

    if (renderer) {
      renderer.dispose();
      if (containerRef.value?.contains(renderer.domElement)) {
        containerRef.value.removeChild(renderer.domElement);
      }
    }

    if (scene) {
      scene.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    provinceRenderers.forEach((r) => r.dispose());
    provinceRenderers = [];

    if (gradientTexture) {
      gradientTexture.dispose();
    }

    scene = null;
    camera = null;
    renderer = null;
    controls = null;
    axesHelper = null;
    gridHelper = null;
    gradientTexture = null;
  }

  onMounted(() => {
    init();
  });

  onUnmounted(() => {
    dispose();
  });
</script>

<style scoped>
  .china-map-3d-container {
    width: 100%;
    height: 100%;
  }
</style>
