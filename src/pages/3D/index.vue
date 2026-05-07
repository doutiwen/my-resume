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
        <SceneContent v-log />
      </TresCanvas>
    </div>
    <div class="stats-panel">
      <h3>场景统计</h3>
      <div class="stat-item">
        <span class="label">顶点数:</span>
        <span class="value">{{ stats.vertices.toLocaleString() }}</span>
      </div>
      <div class="stat-item">
        <span class="label">面数:</span>
        <span class="value">{{ stats.faces.toLocaleString() }}</span>
      </div>
      <div class="stat-item">
        <span class="label">实例数:</span>
        <span class="value">{{ stats.instances.toLocaleString() }}</span>
      </div>
      <div class="stat-item">
        <span class="label">对象数:</span>
        <span class="value">{{ stats.objects }}</span>
      </div>
      <div class="stat-item">
        <span class="label">LOD对象:</span>
        <span class="value">{{ stats.lodObjects }}</span>
      </div>
    </div>
  </MenuLayout>
</template>

<script setup name="3D">
  import { ref, onMounted } from 'vue';
  import MenuLayout from '@/layouts/menuLayout.vue';
  import { TresCanvas, vLog } from '@tresjs/core';
  import { OrbitControls } from '@tresjs/cientos';
  import SceneContent from './common/components/SceneContent/index.vue';

  const stats = ref({
    vertices: 0,
    faces: 0,
    instances: 0,
    objects: 0,
    lodObjects: 0,
  });

  const updateStats = (newStats) => {
    stats.value = newStats;
  };

  defineExpose({ updateStats });
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

  .stats-panel {
    position: fixed;
    top: 100px;
    right: 20px;
    background: rgba(255, 255, 255, 0.95);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    font-family: 'Segoe UI', sans-serif;
    z-index: 100;
    min-width: 200px;

    h3 {
      margin: 0 0 15px 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #667eea;
      padding-bottom: 8px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;

      &:last-child {
        border-bottom: none;
      }

      .label {
        color: #666;
        font-size: 14px;
      }

      .value {
        font-weight: 600;
        color: #667eea;
        font-size: 14px;
      }
    }
  }

  @media (max-width: 768px) {
    .stats-panel {
      position: static;
      margin-top: 20px;
      width: 100%;
    }
  }
</style>
