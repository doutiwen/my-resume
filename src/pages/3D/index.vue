<template>
  <MenuLayout>
    <div class="tres-canvas-wrapper">
      <TresCanvas clear-color="#87CEEB" :window-size="false" :width="1200" :height="800">
        <TresPerspectiveCamera
          :position="[0, 50, 100]"
          :look-at="[0, 0, 0]"
        ></TresPerspectiveCamera>
        <!-- 轨道控制器 -->
        <OrbitControls
          :enable-damping="true"
          :damping-factor="0.05"
          :min-distance="10"
          :max-distance="200"
          :max-polar-angle="Math.PI / 2"
        />
        <!-- 场景内容 -->
        <SceneContent />
      </TresCanvas>
    </div>
  </MenuLayout>
</template>

<script setup name="3D">
  import { ref, onMounted } from 'vue';
  import MenuLayout from '@/layouts/menuLayout.vue';
  import { TresCanvas } from '@tresjs/core';
  import { OrbitControls } from '@tresjs/cientos';
  import SceneContent from './common/components/SceneContent/index.vue';
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

  :deep(.tres-canvas) {
    position: relative !important;
    z-index: 1;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  }
</style>
