<template>
  <GLTFModel 
    :path="selectedModelPath" 
    :position="position" 
    :scale="scale" 
    :rotation="rotation"
  />
</template>

<script setup>
  import { computed } from 'vue';
  import { GLTFModel } from '@tresjs/cientos';
  
  const props = defineProps({
    modelPaths: {
      type: Array,
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
  });
  
  // 基于实例位置生成确定性的随机选择
  const selectedModelPath = computed(() => {
    // 使用位置生成哈希值来确保相同位置总是选择相同的模型
    const hash = Math.abs(
      props.position[0] * 73856093 +
      props.position[1] * 19349663 +
      props.position[2] * 83492791
    );
    const index = hash % props.modelPaths.length;
    return props.modelPaths[index];
  });
</script>
