<template>
  <TresGroup :position="position" :scale="scale" :rotation="rotation">
    <primitive :object="lodObject" />
  </TresGroup>
</template>

<script setup>
  import { ref, watch } from 'vue';
  import { useLoader } from '@tresjs/core';
  import * as THREE from 'three';
  import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
  import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
  import { getModelPath } from '../utils/modelPathHelper';

  const props = defineProps({
    lodDistances: {
      type: Object,
      default: () => ({
        high: 50,
        medium: 150,
        low: 300,
      }),
    },
    position: {
      type: Array,
      default: () => [0, 0, 0],
    },
    scale: {
      type: Array,
      default: () => [1, 1, 1],
    },
    rotation: {
      type: Array,
      default: () => [0, 0, 0],
    },
  });

  const lodObject = ref(null);

  // 随机选择通用建筑模型
  const modelNames = ['generic_1', 'generic_2', 'generic_3'];
  const randomModelName = modelNames[Math.floor(Math.random() * modelNames.length)];

  // 配置 DRACO 解码器
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(import.meta.env.VITE_BASE_URL + '/draco/');
  dracoLoader.preload();

  // 加载高细节 GLB 模型
  const { state: highState } = useLoader(GLTFLoader, getModelPath(randomModelName, 'high'), {
    extensions: (loader) => {
      if (loader instanceof GLTFLoader) {
        loader.setDRACOLoader(dracoLoader);
      }
    },
  });

  // 加载中细节 GLB 模型
  const { state: mediumState } = useLoader(GLTFLoader, getModelPath(randomModelName, 'medium'), {
    extensions: (loader) => {
      if (loader instanceof GLTFLoader) {
        loader.setDRACOLoader(dracoLoader);
      }
    },
  });

  // 根据模型名称生成颜色
  const getBuildingColor = () => {
    const colors = {
      generic_1: '#90CAF9',
      generic_2: '#A5D6A7',
      generic_3: '#FFCC80',
    };
    return colors[randomModelName] || '#666666';
  };

  // 创建低细节建筑几何体
  const createLowPolyBuilding = () => {
    const group = new THREE.Group();

    // 建筑主体
    const bodyGeometry = new THREE.BoxGeometry(8, 10, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: getBuildingColor() });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);

    // 简单的长方体屋顶
    const roofGeometry = new THREE.BoxGeometry(9, 2, 9);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: '#5D4037' });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 6;
    group.add(roof);

    return group;
  };

  // 创建 LOD 对象
  const createLOD = () => {
    const lod = new THREE.LOD();

    // 高细节级别
    if (highState.value?.scene) {
      lod.addLevel(highState.value.scene.clone(), 0);
    } else {
      lod.addLevel(createLowPolyBuilding(), 0);
    }

    // 中细节级别
    if (mediumState.value?.scene) {
      lod.addLevel(mediumState.value.scene.clone(), props.lodDistances.high);
    } else {
      lod.addLevel(createLowPolyBuilding(), props.lodDistances.high);
    }

    // 低细节级别
    lod.addLevel(createLowPolyBuilding(), props.lodDistances.medium);

    return lod;
  };

  // 监听模型加载状态变化
  watch(
    [highState, mediumState],
    () => {
      if (!lodObject.value) {
        lodObject.value = createLOD();
      }
    },
    { immediate: true, deep: true }
  );
</script>
