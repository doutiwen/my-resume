<template>
  <TresMesh ref="cubeRef">
    <TresBoxGeometry :args="[2, 2, 2]"></TresBoxGeometry>
    <TresMeshStandardMaterial color="#ff6b35"></TresMeshStandardMaterial>
  </TresMesh>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useLoop } from '@tresjs/core';

const cubeRef = ref();
const { onBeforeRender } = useLoop();

onBeforeRender(({ elapsed }) => {
  if (cubeRef.value) {
    // 让立方体在 X 轴和 Y 轴上持续旋转
    cubeRef.value.rotation.x = elapsed * 0.5;
    cubeRef.value.rotation.y = elapsed * 0.3;
  }
});
</script>
