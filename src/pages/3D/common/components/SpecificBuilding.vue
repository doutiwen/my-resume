<template>
  <BuildingLOD
    :model-name="modelName"
    :lod-distances="lodDistances"
    :position="position"
    :scale="scale"
    :rotation="rotation"
  />
</template>

<script setup>
  import BuildingLOD from './BuildingLOD.vue';

  defineProps({
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
    dracoLoaderPath: {
      type: String,
      default: () => import.meta.env.VITE_BASE_URL + '/draco/',
    },
  });
</script>
