<template>
  <div
    :class="['arcgis-zoom-container']"
    ref="ArcgisZoomRef"
    id="ArcgisZoomWrapWrap"
    :style="style"
  >
    <div class="home-zoom">
      <div class="zoom-item" title="全幅显示" @click.stop="onResetViewHandle">
        <com-icon name="quanfu" :color="'#6e6e6e'" />
      </div>
    </div>
    <div class="zoom-content">
      <div class="zoom-item" title="放大" @click.stop="zoomInHandle">
        <el-icon :color="'#6e6e6e'">
          <Plus />
        </el-icon>
      </div>
      <el-divider style="margin: 4px 9px; width: calc(100% - 18px)" />
      <div class="zoom-item" title="指南针" @click.stop="onResetCompassHandle">
        <span
          aria-hidden="true"
          role="presentation"
          className="esri-icon esri-icon-compass"
          :style="{ transform: `rotate(${rotation}deg)`, color: '#6e6e6e' }"
        ></span>
      </div>
      <el-divider style="margin: 4px 9px; width: calc(100% - 18px)" />
      <div class="zoom-item" title="缩小" @click.stop="zoomOutHandle">
        <el-icon :color="'#6e6e6e'">
          <Minus />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, toRefs, toRaw, onMounted, onUnmounted, watch } from 'vue';
  import { isEmpty, omit } from 'lodash-es';
  import { Zoom, Extent, watchUtils } from '../../modules';

  const props = defineProps({
    mapInstance: { type: Object, default: () => ({}) },
    style: { type: Object, default: () => ({}) },
  });
  const emits = defineEmits(['onChangeData']);

  const { mapInstance, style } = toRefs(props);

  let WatchViewRotationEvent = null;

  const MapInstance = toRaw(mapInstance.value);
  const ArcgisZoomRef = ref();
  const rotation = ref(0);
  const currentMapMode = ref(MapInstance?.MapView?.type === '2d' ? '2D' : '3D');

  /**
   * @Title: 全幅显示事件
   */
  const onResetViewHandle = () => {
    const MapView = mapInstance?.value?.MapView;
    if (currentMapMode.value === '2D') {
      const extent = new Extent({
        ...mapInstance?.value?.defaultExtent,
        spatialReference: MapView.spatialReference,
      });
      MapView.goTo(extent);
    } else {
      let extent = mapInstance?.value?.defaultExtent;
      if (mapInstance?.value?.config?.defaultExtent) {
        extent = mapInstance?.value?.config?.defaultExtent;
      }
      const targetExtent = new Extent({
        ...extent,
        spatialReference: MapView.spatialReference,
      });
      MapView.goTo({
        target: targetExtent,
        heading: mapInstance?.value?.config?.defaultHeading || -10,
        tilt: mapInstance?.value?.config?.defaultTilt || 80,
      });
    }
  };

  const onResetCompassHandle = () => {
    mapInstance.value.MapView.rotation = 0;
  };

  /**
   * @Title: 放大事件
   */
  const zoomInHandle = () => {
    const zoom = new Zoom({ view: mapInstance?.value?.MapView });
    zoom.zoomIn();
  };

  /**
   * @Title: 缩小事件
   */
  const zoomOutHandle = () => {
    const zoom = new Zoom({ view: mapInstance?.value?.MapView });
    zoom.zoomOut();
  };

  const listenRoationChange = () => {
    if (mapInstance?.value?.MapView) {
      WatchViewRotationEvent = watchUtils.watch(mapInstance.value.MapView, 'rotation', (newVal) => {
        rotation.value = newVal;
      });
    }
  };

  const removeListenRoation = () => {
    if (WatchViewRotationEvent) {
      WatchViewRotationEvent.remove();
      WatchViewRotationEvent = null;
    }
  };

  // 监听数据变化
  watch(
    () => mapInstance?.value,
    (newValue) => {
      if (newValue) {
        listenRoationChange();
      }
    }
  );

  onMounted(() => {
    // listenRoationChange();
  });

  onUnmounted(() => {
    removeListenRoation();
  });
</script>

<style lang="less" scoped>
  .arcgis-zoom-container {
    z-index: 9;
    margin-top: 10px;
    box-shadow: 0 4px 12px 2px rgba(0, 0, 0, 0.04);

    .home-zoom {
      background-color: white;
      width: 32px;
      box-shadow: 0 4px 12px 2px rgba(0, 0, 0, 0.04);
      margin-bottom: 10px;
    }

    .zoom-content {
      background-color: white;
      width: 32px;
      box-shadow: 0 4px 12px 2px rgba(0, 0, 0, 0.04);
    }

    .zoom-item {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
  }
</style>
