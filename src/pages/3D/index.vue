<template>
  <MenuLayout>
    <div ref="canvasContainer" class="tres-canvas-wrapper"></div>
  </MenuLayout>
</template>

<script setup name="3D">
  import { ref, onMounted, onUnmounted } from 'vue';
  import MenuLayout from '@/layouts/menuLayout.vue';
  import { Scene3D } from './common/classes/Scene3D';
  import { TownBuilder } from './common/classes/TownBuilder';
  import { sceneData } from './common/data/sceneData';

  const canvasContainer = ref(null);
  let scene3D = null;
  let townBuilder = null;

  onMounted(async () => {
    if (canvasContainer.value) {
      scene3D = new Scene3D(canvasContainer.value);
      townBuilder = new TownBuilder(scene3D.scene, sceneData);
      await townBuilder.init();
    }
  });

  onUnmounted(() => {
    if (townBuilder) {
      townBuilder.dispose();
      townBuilder = null;
    }
    if (scene3D) {
      scene3D.dispose();
      scene3D = null;
    }
  });
</script>

<style lang="scss" scoped>
  .tres-canvas-wrapper {
    width: 100%;
    height: 100%;
    min-height: 700px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .tres-canvas-wrapper canvas {
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  }
</style>
