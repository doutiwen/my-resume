<template>
  <TresGroup :position="position" :scale="scale" :rotation="rotation">
    <!-- 加载中显示占位符 -->
    <TresMesh v-if="isLoading">
      <TresBoxGeometry :args="[8, 10, 8]" />
      <TresMeshStandardMaterial :color="buildingColor" wireframe />
    </TresMesh>

    <!-- 使用 primitive 标签渲染 LOD 对象 -->
    <primitive v-if="lodObject" :object="lodObject" />
  </TresGroup>
</template>

<script setup>
  import * as THREE from 'three';
  import { ref, shallowRef, onMounted } from 'vue';
  import { useGLTFLoader } from '../../hooks/useGLTFLoader';
  import { createLowPolyBuilding, getBuildingColor } from '../../utils/LowPolyBuildingHelper';

  const props = defineProps({
    modelName: {
      type: [String, Array],
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

  const isLoading = ref(true);
  const lodObject = shallowRef(null);
  const hasHighModelLoaded = ref(false);

  // 根据模型名称生成颜色
  const buildingColor = getBuildingColor(props.modelName);

  // 创建初始 LOD 对象（使用中细节模型作为最高级别）
  const createInitialLOD = (mediumModel) => {
    const lod = new THREE.LOD();
    const lowPolyBuilding = createLowPolyBuilding({ color: buildingColor });
    // 初始最高级别使用中细节模型或低多边形建筑
    const highestLevelModel = mediumModel ? mediumModel.scene.clone() : lowPolyBuilding.clone();
    lod.addLevel(highestLevelModel, 0);
    // 中细节级别
    if (mediumModel) {
      lod.addLevel(mediumModel.scene.clone(), props.lodDistances.high);
    } else {
      lod.addLevel(lowPolyBuilding.clone(), props.lodDistances.high);
    }

    // 低细节级别
    lod.addLevel(lowPolyBuilding, props.lodDistances.medium);

    return lod;
  };

  // 更新 LOD 对象（替换最高级别为高细节模型）
  const updateLODWithHighModel = (highModel) => {
    if (lodObject.value && highModel && !hasHighModelLoaded.value) {
      // 移除原有的最高级别（距离为0的级别）
      while (lodObject.value.levels.length > 0 && lodObject.value.levels[0].distance === 0) {
        lodObject.value.remove(lodObject.value.levels[0].object);
        lodObject.value.levels.shift();
      }
      // 在最前面插入高细节模型
      lodObject.value.addLevel(highModel.scene.clone(), 0);
      hasHighModelLoaded.value = true;
    }
  };

  // 加载模型
  const loadModels = async () => {
    try {
      console.log(114);
      // 优先加载中细节模型
      const mediumModel = await useGLTFLoader({
        modelName: props.modelName,
        modelType: 'building',
        level: 'medium',
      });

      // 中等模型加载完成后，创建初始 LOD
      if (mediumModel) {
        lodObject.value = createInitialLOD(mediumModel);
        isLoading.value = false;
      }

      //后台加载高细节模型
      const highModel = await useGLTFLoader({
        modelName: props.modelName,
        modelType: 'building',
        level: 'high',
      });

      // 高细节模型加载完成后，更新 LOD
      if (highModel) {
        updateLODWithHighModel(highModel);
      }
    } catch (err) {
      console.error('Failed to load models:', err);
      // 加载失败时，使用低多边形建筑
      const lowPolyBuilding = createLowPolyBuilding({ color: buildingColor });
      const lod = new THREE.LOD();
      lod.addLevel(lowPolyBuilding.clone(), 0);
      lod.addLevel(lowPolyBuilding, props.lodDistances.medium);
      lodObject.value = lod;
      isLoading.value = false;
    }
  };

  // 组件挂载时开始加载模型
  onMounted(() => {
    loadModels();
  });
</script>
