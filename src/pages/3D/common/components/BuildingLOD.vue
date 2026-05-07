<template>
  <TresGroup :position="position" :scale="scale" :rotation="rotation" ref="groupRef">
    <!-- 加载中显示占位符 -->
    <TresMesh v-if="isLoading">
      <TresBoxGeometry :args="[8, 10, 8]" />
      <TresMeshStandardMaterial :color="buildingColor" wireframe />
    </TresMesh>
  </TresGroup>
</template>

<script setup>
  import * as THREE from 'three';
  import { useGLTFLoader } from '../hooks/useGLTFLoader';
  import { createLowPolyBuilding, getBuildingColor } from '../utils/LowPolyBuildingHelper';

  const props = defineProps({
    modelName: {
      type: String,
      required: true,
    },
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

  const groupRef = ref(null);
  const isLoading = ref(true);

  // 根据模型名称生成颜色
  const buildingColor = computed(() => getBuildingColor(props.modelName));

  // 创建 LOD 对象
  const createLOD = (highModel, mediumModel) => {
    const lod = new THREE.LOD();
    const lowPolyBuilding = createLowPolyBuilding({ color: buildingColor.value });

    // 高细节级别（近距离）
    if (highModel) {
      lod.addLevel(highModel.clone(), 0);
    } else {
      lod.addLevel(lowPolyBuilding.clone(), 0);
    }

    // 中细节级别（中等距离）
    if (mediumModel) {
      lod.addLevel(mediumModel.clone(), props.lodDistances.high);
    } else {
      lod.addLevel(lowPolyBuilding.clone(), props.lodDistances.high);
    }

    // 低细节级别（远距离）
    lod.addLevel(lowPolyBuilding, props.lodDistances.medium);

    return lod;
  };

  // 使用 useGLTFLoader 加载高细节模型（自动加载）
  const { modelObject: highModel } = useGLTFLoader({
    modelName: props.modelName,
    modelType: 'building',
    level: 'high',
  });

  // 使用 useGLTFLoader 加载中细节模型（自动加载）
  const { modelObject: mediumModel } = useGLTFLoader({
    modelName: props.modelName,
    modelType: 'building',
    level: 'medium',
  });

  // 将 LOD 对象添加到场景
  const addLODToScene = () => {
    if (groupRef.value && groupRef.value.$object && !groupRef.value.$object.userData.hasLOD) {
      const lod = createLOD(highModel.value, mediumModel.value);
      groupRef.value.$object.add(lod);
      groupRef.value.$object.userData.hasLOD = true;
      isLoading.value = false;
    }
  };

  // 监听模型加载状态变化
  watch([highModel, mediumModel], () => {
    addLODToScene();
  });

  // 超时处理（防止模型加载失败）
  onMounted(() => {
    setTimeout(() => {
      addLODToScene();
    }, 3000);
  });
</script>
