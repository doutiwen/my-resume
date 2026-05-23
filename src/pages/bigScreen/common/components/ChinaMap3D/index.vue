<template>
  <!-- 3D中国地图容器 -->
  <div class="china-map-3d-wrapper">
    <!-- Three.js渲染容器，通过ref引用 -->
    <div ref="containerRef" class="china-map-3d-container" @mousemove="onMouseMove"></div>
    <!-- 加载遮罩层，数据加载期间显示 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <span class="loading-text">地图加载中...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted, shallowRef } from 'vue';
  import * as THREE from 'three';
  import { ChinaMap } from './ChinaMap.js';
  import { createDebugTools, disposeDebugTools } from './DebugTools.js';

  const props = defineProps({
    mapUrl: {
      type: String,
      default: '/maps/processed_yunnan.json',
    },
    center: {
      type: Array,
      default: () => [102, 25],
    },
  });

  const containerRef = shallowRef(null);
  const loading = ref(true);

  const DEBUG_MODE = false;

  let scene = null;
  let camera = null;
  let renderer = null;
  let animationId = null;
  let chinaMap = null;
  let raycaster = null;
  let mouse = null;
  let debugTools = null;

  function onMouseMove(event) {
    if (!containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const provinceMeshes = chinaMap.getProvinceRenderers().flatMap((p) => p.topMeshes);
    if (provinceMeshes.length === 0) return;

    const intersects = raycaster.intersectObjects(provinceMeshes);

    chinaMap.getProvinceRenderers().forEach((province) => {
      const isHovered = intersects.some((intersect) =>
        province.topMeshes.includes(intersect.object)
      );
      province.setHovered(isHovered);
    });
  }

  function init() {
    const container = containerRef.value;
    const width = container.clientWidth;
    const height = container.clientHeight;

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = null;

    camera = new THREE.OrthographicCamera(0, width, 0, -height, 0.1, 1000);
    camera.position.copy(new THREE.Vector3(0, 0, 50));
    //camera.lookAt(0, 0.2, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    if (DEBUG_MODE) {
      debugTools = createDebugTools({
        container,
        camera,
        renderer,
        scene,
        width,
        height,
        chinaMap,
      });
    }
    chinaMap = new ChinaMap();
    chinaMap.load(scene, props.mapUrl, { width, height }, props.center).then(() => {
      loading.value = false;
    });
    animate();
  }

  function animate() {
    animationId = requestAnimationFrame(animate);

    if (DEBUG_MODE && debugTools?.stats) {
      debugTools.stats.update();
    }

    if (!scene || !renderer || !camera) return;

    chinaMap.getProvinceRenderers().forEach((province) => {
      province.update();
    });

    if (DEBUG_MODE && debugTools?.controls) {
      debugTools.controls.update();
    }

    renderer.render(scene, camera);
  }

  function dispose() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }

    containerRef.value?.removeEventListener('mousemove', onMouseMove);

    if (DEBUG_MODE && debugTools) {
      disposeDebugTools({
        ...debugTools,
        container: containerRef.value,
      });
      debugTools = null;
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

    chinaMap.dispose();
    chinaMap = null;

    scene = null;
    camera = null;
    renderer = null;
  }

  onMounted(() => {
    init();
  });

  onUnmounted(() => {
    dispose();
  });
</script>

<style lang="scss" scoped>
  .china-map-3d-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    .china-map-3d-container {
      width: 100%;
      height: 100%;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 10, 20, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      transition: opacity 0.3s ease;
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(59, 130, 246, 0.3);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loading-text {
      color: #3b82f6;
      font-size: 14px;
      font-weight: 500;
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
