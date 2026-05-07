<template>
  <TresGroup>
    <!-- 建筑主体 -->
    <TresMesh>
      <TresBoxGeometry :args="[8, 10, 8]" />
      <TresMeshStandardMaterial :color="color" />
    </TresMesh>

    <!-- 双坡屋顶（人字形屋顶） -->
    <TresMesh :position="[0, 5.25, 0]">
      <TresWedgeGeometry :args="[4.5, 3, 9, 1]" />
      <TresMeshStandardMaterial color="#5D4037" />
    </TresMesh>
  </TresGroup>
</template>

<script setup>
  defineProps({
    color: {
      type: String,
      default: '#666666',
    },
  });
</script>
