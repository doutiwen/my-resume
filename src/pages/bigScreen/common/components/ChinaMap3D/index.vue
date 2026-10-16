<template>
  <!-- 3D中国地图容器 -->
  <div class="china-map-3d-wrapper">
    <!-- Three.js渲染容器，通过ref引用 -->
    <div
      ref="containerRef"
      class="china-map-3d-container"
      @mousemove="onMouseMove"
      @click="onClick"
    ></div>
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
  import { CompositeMap } from './core/CompositeMap.js';
  import { createDebugTools, disposeDebugTools } from './debug/DebugTools.js';
  import AdvWebSocket from '@/utils/advWebSocket.js';
  import { ElMessage, ElMessageBox } from 'element-plus';

  const props = defineProps({
    mapUrl: {
      type: String,
      default: '/maps/processed_china1.json',
    },
    center: {
      type: Array,
      default: () => [108, 34],
    },
  });

  const emit = defineEmits(['click']);

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
  let advWebSocket = null;
  let cameraLogTimer = null;
  let disasterMarkers = [];
  let selectedProvince = null;
  let isReconnecting = false;

  const provincialCapitals = [
    { name: '北京', lat: 39.9042, lng: 116.4074 },
    { name: '上海', lat: 31.2304, lng: 121.4737 },
    { name: '天津', lat: 39.3434, lng: 117.3616 },
    { name: '重庆', lat: 29.4316, lng: 106.9123 },
    { name: '广州', lat: 23.1291, lng: 113.2644 },
    { name: '深圳', lat: 22.5431, lng: 114.0579 },
    { name: '成都', lat: 30.5728, lng: 104.0668 },
    { name: '杭州', lat: 30.2741, lng: 120.1551 },
    { name: '武汉', lat: 30.5928, lng: 114.3055 },
    { name: '西安', lat: 34.3416, lng: 108.9398 },
    { name: '南京', lat: 32.0603, lng: 118.7969 },
    { name: '郑州', lat: 34.7466, lng: 113.6253 },
    { name: '长沙', lat: 28.2282, lng: 112.9388 },
    { name: '沈阳', lat: 41.8057, lng: 123.4315 },
    { name: '哈尔滨', lat: 45.8038, lng: 126.535 },
    { name: '长春', lat: 43.8171, lng: 125.3235 },
    { name: '济南', lat: 36.6512, lng: 117.1201 },
    { name: '青岛', lat: 36.0671, lng: 120.3826 },
    { name: '大连', lat: 38.914, lng: 121.6147 },
    { name: '厦门', lat: 24.4798, lng: 118.0894 },
    { name: '福州', lat: 26.0745, lng: 119.2965 },
    { name: '南昌', lat: 28.682, lng: 115.8579 },
    { name: '合肥', lat: 31.8206, lng: 117.2272 },
    { name: '昆明', lat: 25.0389, lng: 102.7183 },
    { name: '贵阳', lat: 26.647, lng: 106.6302 },
    { name: '南宁', lat: 22.817, lng: 108.3665 },
    { name: '海口', lat: 20.0174, lng: 110.3492 },
    { name: '兰州', lat: 36.0611, lng: 103.8343 },
    { name: '西宁', lat: 36.6171, lng: 101.7782 },
    { name: '银川', lat: 38.4872, lng: 106.2309 },
    { name: '乌鲁木齐', lat: 43.8256, lng: 87.6168 },
    { name: '拉萨', lat: 29.6525, lng: 91.1721 },
    { name: '呼和浩特', lat: 40.8414, lng: 111.7519 },
    { name: '太原', lat: 37.8706, lng: 112.5489 },
    { name: '石家庄', lat: 38.0428, lng: 114.5149 },
  ];

  const disasterTypes = [
    { type: 'earthquake', name: '地震', color: 0xff4444, icon: '🔴' },
    { type: 'flood', name: '洪水', color: 0x4488ff, icon: '🔵' },
    { type: 'typhoon', name: '台风', color: 0x44ff44, icon: '🟢' },
    { type: 'rainstorm', name: '暴雨', color: 0x8844ff, icon: '🟣' },
    { type: 'drought', name: '干旱', color: 0xffaa00, icon: '🟠' },
    { type: 'landslide', name: '滑坡', color: 0xff8844, icon: '🟤' },
  ];

  function createDisasterDataSource() {
    return {
      type: 'disaster',
      data: JSON.stringify({
        timestamp: Date.now(),
        location: provincialCapitals[Math.floor(Math.random() * provincialCapitals.length)],
        disaster: disasterTypes[Math.floor(Math.random() * disasterTypes.length)],
        severity: Math.floor(Math.random() * 10) + 1,
        affectedArea: Math.floor(Math.random() * 1000) + 100,
      }),
    };
  }

  function onMouseMove(event) {
    if (!containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const regionMeshes = chinaMap.getRegionRenderers().flatMap((r) => r.topMeshes);
    if (regionMeshes.length === 0) return;

    const intersects = raycaster.intersectObjects(regionMeshes);

    chinaMap.getRegionRenderers().forEach((region) => {
      const isHovered = intersects.some((intersect) => region.topMeshes.includes(intersect.object));
      region.setHovered(isHovered);
    });
  }

  function onClick(event) {
    if (!containerRef.value || !chinaMap) return;
    const rect = containerRef.value.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const regionMeshes = chinaMap.getRegionRenderers().flatMap((r) => r.topMeshes);
    if (regionMeshes.length === 0) return;

    const intersects = raycaster.intersectObjects(regionMeshes);

    if (intersects.length > 0) {
      const clickedRegion = chinaMap
        .getRegionRenderers()
        .find((region) => region.topMeshes.includes(intersects[0].object));

      if (clickedRegion) {
        const regionName = clickedRegion.regionGroup.userData.name;

        // 处理选中状态
        if (selectedProvince === clickedRegion) {
          // 取消选中
          clickedRegion.setSelected(false);
          selectedProvince = null;
        } else {
          // 取消之前选中的区域
          if (selectedProvince) {
            selectedProvince.setSelected(false);
          }
          // 选中当前区域
          clickedRegion.setSelected(true);
          selectedProvince = clickedRegion;
        }

        emit('click', {
          name: regionName,
          point: intersects[0].point,
          object: intersects[0].object,
          selected: selectedProvince !== null,
        });
      }
    }
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

    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    camera.position.copy(new THREE.Vector3(width / 2, -height * 0.8, 400));
    camera.lookAt(width / 2, -height / 2, 0);

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
    chinaMap = new CompositeMap();
    chinaMap.load(scene, props.mapUrl, { width, height }, props.center, 10).then(() => {
      loading.value = false;
      //initMockWebSocket();
    });
    animate();
  }

  function initMockWebSocket() {
    advWebSocket = new AdvWebSocket(
      'ws://localhost:8080/disaster',
      {
        reconnectDelay: 3000,
        maxReconnectAttempts: 10,
        simulateNetworkIssues: true,
      },
      createDisasterDataSource,
      AdvWebSocket.MODE_MOCK
    );

    advWebSocket.onopen = () => {
      console.log('AdvWebSocket connected');
      if (isReconnecting) {
        isReconnecting = false;
        ElMessage.success('WebSocket 重连成功');
      } else {
        ElMessage.success('WebSocket 连接成功');
      }
    };

    advWebSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'disaster') {
          handleDisasterData(JSON.parse(data.data));
        }
      } catch (error) {
        console.error('Error parsing disaster data:', error);
      }
    };

    advWebSocket.onerror = (event) => {
      console.error('AdvWebSocket error:', event.error);
      if (!isReconnecting) {
        isReconnecting = true;
        ElMessage.warning('WebSocket 连接异常，正在尝试自动重连...');
      }
    };

    advWebSocket.onclose = (event) => {
      console.log('AdvWebSocket closed:', event.code, event.reason);
      if (event.code === 1006 && !event.wasClean) {
        if (
          advWebSocket &&
          advWebSocket.reconnectAttempts >= advWebSocket.options.maxReconnectAttempts
        ) {
          ElMessageBox.confirm('WebSocket 自动重连失败，是否尝试手动重新连接？', '连接失败', {
            confirmButtonText: '手动重连',
            cancelButtonText: '取消',
            type: 'error',
            showCancelButton: true,
            closeOnClickModal: false,
          })
            .then(() => {
              advWebSocket.reconnectAttempts = 0;
              advWebSocket.connect();
              ElMessage.info('正在尝试手动重连...');
            })
            .catch(() => {
              ElMessage.info('已取消手动重连');
            });
        } else if (!isReconnecting) {
          isReconnecting = true;
          ElMessage.warning('WebSocket 连接断开，正在尝试自动重连...');
        }
      }
    };
  }

  function manualReconnect() {
    if (advWebSocket) {
      advWebSocket.reconnectAttempts = 0;
      advWebSocket.connect();
      ElMessage.info('正在尝试手动重连...');
    }
  }

  function handleDisasterData(disasterData) {
    console.log('Received disaster data:', disasterData);

    const { location, disaster, severity, affectedArea } = disasterData;

    const position = chinaMap.geoToPosition(location.lng, location.lat);
    if (!position) return;

    const marker = createDisasterMarker(position, disaster, severity);
    scene.add(marker);
    disasterMarkers.push(marker);

    if (disasterMarkers.length > 20) {
      const oldMarker = disasterMarkers.shift();
      scene.remove(oldMarker);
      oldMarker.geometry.dispose();
      oldMarker.material.dispose();
    }
  }

  function createDisasterMarker(position, disaster, severity) {
    const radius = 2 + severity * 0.5;
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: disaster.color,
      transparent: true,
      opacity: 0.8,
    });
    const marker = new THREE.Mesh(geometry, material);
    marker.position.set(position.x, position.y, 5);

    const ringGeometry = new THREE.RingGeometry(radius, radius + 1, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: disaster.color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(position.x, position.y, 4.9);
    marker.add(ring);

    marker.userData = {
      disaster: disaster,
      severity: severity,
      createdAt: Date.now(),
    };

    return marker;
  }

  function animate(time) {
    animationId = requestAnimationFrame(animate);

    if (!scene || !renderer || !camera) return;

    if (DEBUG_MODE && debugTools?.stats) {
      debugTools.stats.update();
    }

    chinaMap.getRegionRenderers().forEach((region) => {
      region.update();
    });

    disasterMarkers.forEach((marker, index) => {
      const time = Date.now() * 0.001;
      const pulse = Math.sin(time * 2 + index) * 0.2 + 0.8;
      marker.scale.set(pulse, pulse, pulse);

      if (marker.children[0]) {
        marker.children[0].rotation.z += 0.02;
        marker.children[0].scale.set(
          1 + Math.sin(time * 3 + index) * 0.3,
          1 + Math.sin(time * 3 + index) * 0.3,
          1
        );
      }
    });

    if (DEBUG_MODE && debugTools?.controls) {
      debugTools.controls.update();
      if (cameraLogTimer) {
        clearTimeout(cameraLogTimer);
      }
      cameraLogTimer = setTimeout(() => {
        console.log(
          '相机位置：',
          camera.position.x,
          camera.position.y,
          camera.position.z,
          '看向目标：',
          debugTools.controls.target.x,
          debugTools.controls.target.y,
          debugTools.controls.target.z
        );
        cameraLogTimer = null;
      }, 2000);
    }

    renderer.render(scene, camera);
  }

  function dispose() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }

    if (advWebSocket) {
      advWebSocket.close();
      advWebSocket = null;
    }

    disasterMarkers.forEach((marker) => {
      scene.remove(marker);
      marker.geometry.dispose();
      marker.material.dispose();
    });
    disasterMarkers = [];

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
