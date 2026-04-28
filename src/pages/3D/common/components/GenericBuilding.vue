<template>
  <TresGroup :position="position">
    <!-- 建筑主体 -->
    <TresMesh :scale="scale">
      <TresBoxGeometry :args="[features.width, features.height, features.depth]" />
      <TresMeshStandardMaterial :color="features.color" :roughness="0.4" :metalness="0.1" />
    </TresMesh>

    <!-- 屋顶 -->
    <TresMesh :position="[0, features.height / 2 + 0.25, 0]">
      <TresBoxGeometry :args="[features.width + 0.5, 0.5, features.depth + 0.5]" />
      <TresMeshStandardMaterial color="#5D4037" />
    </TresMesh>
  </TresGroup>
</template>

<script setup>
  defineProps({
    position: {
      type: Array,
      default: () => [0, 0, 0],
    },
    scale: {
      type: Array,
      default: () => [1, 1, 1],
    },
    features: {
      type: Object,
      default: () => ({
        height: 15,
        width: 10,
        depth: 10,
        color: '#90CAF9',
        levels: 5,
      }),
    },
  });
</script>
