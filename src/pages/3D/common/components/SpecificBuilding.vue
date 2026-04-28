<template>
  <TresGroup :position="position" :scale="scale" :rotation="rotation">
    <TresMesh>
      <TresBoxGeometry :args="[10, 15, 10]" />
      <TresMeshStandardMaterial :color="buildingColor" />
    </TresMesh>
    <TresMesh :position="[0, 8, 0]">
      <TresBoxGeometry :args="[11, 1, 11]" />
      <TresMeshStandardMaterial color="#5D4037" />
    </TresMesh>
  </TresGroup>
</template>

<script setup>
  import { computed } from 'vue';

  const props = defineProps({
    modelPath: {
      type: String,
      required: true,
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
    lod: {
      type: Array,
      default: () => [
        { level: 0, distance: 50 },
        { level: 1, distance: 150 },
        { level: 2, distance: 300 },
      ],
    },
  });

  // 根据模型路径生成颜色
  const buildingColor = computed(() => {
    const colors = {
      'city_hall': '#4A90D9',
      'hospital': '#E53935',
      'school': '#4CAF50',
      'mall': '#FF9800',
    };

    const name = props.modelPath.split('/').pop().replace('.glb', '');
    return colors[name] || '#666666';
  });
</script>
