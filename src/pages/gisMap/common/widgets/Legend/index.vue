<template>
  <div class="legendWrap">
    <div
      v-if="!show"
      class="esri-widget--button esri-widget esri-interactive legendTagClass"
      title="图例"
      @click="toggleLegendVisible"
    >
      <el-icon><Aim /></el-icon>
      <span class="esri-icon-font-fallback-text legendTagClass">图例</span>
    </div>
    <div v-else class="legendContent">
      <div v-loading="loading">
        <div class="legendTitle" @click="toggleLegendVisible">
          <span class="legendTitleText">图例</span>
          <el-icon class="legendCloseClass" @click="toggleLegendVisible"><CircleClose /></el-icon>
        </div>
        <div class="legendList" :style="{ maxHeight: `${clientRefHeight - 120}px`, ...style }">
          <LegendItem
            v-if="legendData.length > 0"
            v-for="(data, index) in legendData"
            :key="index"
            :data="data"
          ></LegendItem>
          <div v-else class="emptyName">暂无数据</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, toRaw, toRefs, watch, onMounted } from 'vue';
  import { isArray, isEmpty } from 'lodash-es';
  import { GetUniqKey } from '@/utils';
  import { FindMetaData, FindMetaDataByServerId } from '@/api/dataMap';
  import { FormatLegend, QueryTableLayerLegend } from './utils';
  import LegendItem from './LegendItem.vue';

  const props = defineProps({
    mapInstance: { type: Object, default: () => ({}) },
    collapse: { type: Boolean, default: false },
    hideList: { type: Array, default: () => [] },
    style: { type: Object, default: () => ({}) },
    updateStatus: { type: Boolean, default: false },
  });

  const { mapInstance } = props;
  const { collapse, hideList, style, updateStatus } = toRefs(props);
  const show = ref(true);
  const loading = ref(false);
  const clientRefHeight = ref();
  const legendData = ref([]);
  const LoadingRef = ref(false);
  const ShowRef = ref(false);
  ShowRef.value = show.value;
  const emits = defineEmits(['update:expandStatus']);

  defineOptions({
    name: 'com-widgets-legend',
  });

  let MapViewClickHandle = null;
  // State management using Vue's ref
  const activeStatus = ref(false);
  const position = ref({});
  const errorText = ref('');
  // const mapType = ref(mapInstance?.MapView?.type || '2D');

  // Watchers and lifecycle hooks
  watch(activeStatus, (newVal) => {
    if (newVal) {
      MapViewClickHandle = mapInstance.value?.MapView?.on('click', (event) => {
        const {
          mapPoint: { longitude, latitude, z },
        } = event;
        position.value = { longitude, latitude, height: z };
      });
    } else {
      position.value = {};
      if (MapViewClickHandle) {
        MapViewClickHandle.remove();
        MapViewClickHandle = null;
      }
    }
  });

  const useUpdateEffect = (effect, dependencies) => {
    watch(
      () => dependencies,
      (deps) => {
        effect(...deps);
      },
      { immediate: false }
    );
  };

  useUpdateEffect(() => {
    if (!!collapse === ShowRef.value && typeof collapse !== 'undefined') {
      show.value = !collapse;
    }
  }, [collapse]);

  useUpdateEffect(() => {
    updateStatus && show && loadMapLegend();
  }, [updateStatus]);

  /**
   * @Title: 加载图例
   * @Author: leslie
   * @Date: 2021/11/22
   */
  const loadMapLegend = () => {
    if (LoadingRef.value || loading.value) return;
    loading.value = true;
    LoadingRef.value = true;
    const { clientHeight } = mapInstance.MapView.container;
    clientRefHeight.value = clientHeight;
    const layersId = [];
    const services = [];
    const rendererLegend = [];
    mapInstance.Map.allLayers.forEach((d) => {
      if (d.legend && !isEmpty(d.legend)) {
        rendererLegend.push(d.legend);
      }
    });
    const effectLayers = mapInstance.Map.allLayers.filter(
      (d) =>
        (d.url &&
          d.parent?.id !== 'basemap' &&
          d?.groupType !== 'TopLayer' &&
          d.visible &&
          d.opacity) ||
        (d?.isTableLayer && d.visible && d.opacity) ||
        (d.type === 'web-tile' &&
          d.parent?.id !== 'basemap' &&
          d?.groupType !== 'TopLayer' &&
          d.visible &&
          d.opacity)
    );
    effectLayers.forEach((layer, index) => {
      if (layer?.isTableLayer) {
        layersId[index] = layer.id;
        services.push(QueryTableLayerLegend(layer));
      } else {
        layersId[index] = layer.layerId;
        if (layer?.useCode && layer.featureId) {
          services.push(FindMetaData(layer.featureId));
        } else if (!layer?.useCode && layer.serverId) {
          services.push(FindMetaDataByServerId(layer.serverId));
        } else {
          // services.push(esriRequest(PLATFORM === 'YN' && MODE === 'PRO' ? `${layer.url}/legend?f=json&register_sign=${YZT_REGISTER_SIGN}` : `${layer.url}/legend?f=json`, { headers: { HiddenNoPermissionModal: true}} ))
        }
      }
    });
    Promise.allSettled(services)
      .then((response) => {
        const legendTemp = [];
        response.forEach((res, index) => {
          const { status, value } = res;
          if (status === 'fulfilled') {
            if (value.code === 200 && value.success) {
              if (value.data?.serverFeature?.mapLegendConfig) {
                const mapLegendConfig = JSON.parse(value?.data?.serverFeature?.mapLegendConfig);
                if (isArray(mapLegendConfig)) {
                  legendTemp.unshift(
                    FormatLegend(mapLegendConfig?.[0]?.layers || mapLegendConfig?.[0])
                  );
                } else {
                  legendTemp.unshift(FormatLegend(mapLegendConfig?.layers));
                }
              }
            } else {
              if (typeof layersId[index] === 'undefined') {
                value.data?.layers && legendTemp.unshift(FormatLegend(value.data?.layers));
              } else {
                value.data?.layers &&
                  legendTemp.unshift(
                    FormatLegend(value.data?.layers.find((d) => d.layerId === layersId[index]))
                  );
              }
            }
          }
        });
        legendData.value = [...legendTemp.flat(), ...rendererLegend];
        loading.value = false;
        LoadingRef.value = false;
      })
      .catch((err) => {
        legendData.value = [];
        loading.value = false;
        LoadingRef.value = false;
      });
  };

  /**
   * @Title: 切换图例显示状态
   * @Author: leslie
   * @Date: 2021/11/22
   */
  const toggleLegendVisible = () => {
    const flag = !ShowRef.value;
    show.value = flag;
    mapInstance.LayerLegend?.updateCollapseStatus(!flag);
    if (flag) {
      loadMapLegend();
      // 折叠图层控制器
      if (mapInstance.LayerControl && !mapInstance.LayerControl.collapse) {
        mapInstance.LayerControl.updateCollapseStatus(true);
      }
      if (mapInstance.LayerStatistics && !mapInstance.LayerStatistics.collapse) {
        mapInstance.LayerStatistics.updateCollapseStatus(true);
      }
    }
  };

  onMounted(() => {
    const mapChangeEvent = mapInstance.Map.allLayers.on('change', (event) => {
      const effectLayers = [];
      event.added.forEach((d) => {
        if (d.groupType === 'DefaultLayer') {
          effectLayers.push(d);
        }
      });
      event.removed.forEach((d) => {
        if (d.groupType === 'DefaultLayer') {
          effectLayers.push(d);
        }
      });
      if (effectLayers.length && ShowRef.value && !LoadingRef.value) {
        setTimeout(() => {
          loadMapLegend();
        }, 0);
      }
    });
    const mapChangeEvent1 = mapInstance.MapView.watch('updating', (status) => {
      if (!status && ShowRef.value && !LoadingRef.value) {
        setTimeout(() => {
          const effectLayers = mapInstance.Map.allLayers.filter((d) => d.mapAbove);
          if (effectLayers.length) {
            loadMapLegend();
          }
        }, 0);
      }
    });
    return () => {
      mapChangeEvent.remove();
      mapChangeEvent1.remove();
    };
  });

  watch(hideList, (newVal) => {
    loadMapLegend();
  });
</script>

<style lang="less" scoped>
  @import '@/theme/colors.less';

  .legendWrap {
    //box-shadow: 0px 4px 12px 2px rgba(0,0,0,0.04);
    pointer-events: auto;
    .legendContent {
      width: 326px;
      background: #fff;
      overflow: hidden;
      margin-left: 26px;
      box-shadow: 0px 4px 12px 2px rgba(0, 0, 0, 0.04);

      &.isLoading {
        padding: 32px 16px;
      }

      .legendTitle {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        height: 40px;
        background: #f5f6f7;

        .legendTitleText {
          color: #222;
          font-weight: bold;
        }
        ::v-deep(.esri-icon, .iconfont) {
          cursor: pointer;

          &:hover {
            color: @red-color;
          }
        }
      }

      .legendList {
        max-height: 480px;
        padding: 16px;
        overflow-y: auto;

        .emptyName {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #666;
        }
      }
    }
  }
</style>
