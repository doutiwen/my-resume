<template>
  <div
    class="arcgis-map-wrap"
    ref="ArcgisContainerRef"
    id="ArcgisMapContainer"
    v-loading.lock="mapLoading"
    element-loading-text="加载中..."
  >
    <div class="arcgis-map" ref="MapRef" v-if="!isLackBase">
      <div class="left-top-widget-wrap">
        <slot name="leftTopWidget" :map="expose"></slot>
      </div>
      <div class="left-bottom-widget-wrap">
        <slot name="leftBottomWidget" :map="expose"></slot>
        <Legend
          v-if="mapLoaded && config?.widgets?.legend?.show"
          :mapInstance="MapInstance"
          ref="LegendRef"
        ></Legend>
      </div>
      <div class="right-top-widget-wrap">
        <Control
          v-if="config?.widgets?.control"
          :mapMode="'2D'"
          :mapInstance="MapInstance"
          @onViewTable="onViewTableHandle"
          ref="ControlRef"
        ></Control>
        <!-- TODO 区域选择功能联动 -->
        <RegionSelect
          v-if="config?.widgets?.regionSelect"
          :regionData="config?.widgets?.regionSelect"
          :clearHeightArea="clearHeightArea"
          @onSelect="onRegionSelected"
        />
        <MapToolTik
          v-if="
            config?.widgets?.toolKit &&
            JSON.stringify(config?.widgets?.toolKit) !== '{}' &&
            MapInstance?.addMapWidget
          "
          :mapInstance="MapInstance"
          :expandTool="false"
          :config="config"
        ></MapToolTik>
        <slot name="rightTopWidget" :map="expose"></slot>
      </div>
      <div class="right-bottom-widget-wrap">
        <slot name="rightBottomWidget" :map="expose"></slot>
        <Zoom v-if="MapInstance && config?.widgets?.zoom" :mapInstance="MapInstance" />
        <!-- 底图控件 -->
        <BasemapControl
          v-if="
            !config?.baseData?.hiddenBaseMapElement &&
            config?.baseData?.baseMap?.length > 0 &&
            MapInstance
          "
          :data="config?.baseData?.baseMap"
          :mapInstance="MapInstance"
          :activeBaseMap="config?.baseData?.selectBaseMapConfig?.activeBaseMap"
          :initActiveChild="config?.baseData?.selectBaseMapConfig?.activeChild"
          :noteStatus="config?.baseData?.selectBaseMapConfig?.noteStatus"
          :baseMapVisible="config?.baseData?.selectBaseMapConfig?.unShowAllBaseMapOnMap"
          :style="config?.baseData?.style"
        />
      </div>
      <div class="mapTableWrap" v-if="showMapTable">
        <MapTable
          :mapInstance="MapInstance"
          :node="viewTableNode"
          @onClose="onCloseMapTable"
          ref="MapTableRef"
        />
      </div>
      <div class="queryTableWrap" id="queryTable"></div>
    </div>
    <div class="error-text" v-if="isLackBase">地图加载失败 , 缺少必要的配置项</div>
  </div>
</template>

<script setup>
  import { ref, onMounted, shallowRef } from 'vue';
  import { isEmpty, omit } from 'lodash-es';
  import { Control, MapTable, RegionSelect } from '@/components/export';
  import { esriConfig, MapView, Map, Basemap } from '../modules';
  import useMap from '../core/createMap';
  import MapToolTik from '../ToolTik/index.vue';
  import BasemapControl from '../widgets/BasemapControl/index.vue';
  import Zoom from '../widgets/Zoom/index.vue';
  import Legend from '../widgets/Legend/index.vue';
  import { AddLayerToMapView } from '@/utils/MapCommonMethods';
  import '../arcgis.css';
  import { InitData } from '@/components/export';

  const props = defineProps({
    config: Object,
    mapToken: String,
  });
  const emits = defineEmits(['onLoaded']);
  const { config } = props;

  const showMapTable = ref(false);
  const viewTableNode = ref();

  const ArcgisContainerRef = ref();
  const MapRef = ref();
  const ControlRef = ref();
  const MapTableRef = ref();
  const isLackBase = ref(false);
  const mapLoading = ref(false);

  const treeData = shallowRef();
  const { InitLayerData } = InitData;
  treeData.value = InitData.FormatServerListToTree(InitLayerData, '53', 1);

  defineOptions({
    name: 'com-arcgis-map',
  });

  let mapLoaded = ref(false);
  const MapInstance = useMap({ config });

  /**
   * @Title: 获取全局底图及个性底图
   */
  const getBaseLayersHandle = () => {
    const baseMapLayers = [];
    const { baseData } = config;
    const baseMap = baseData?.baseMap || [];
    const unShowAllBaseMapOnMap = baseData?.selectBaseMapConfig?.unShowAllBaseMapOnMap;
    const activeBaseMap = baseData?.selectBaseMapConfig?.activeBaseMap;
    const noteStatus = baseData?.selectBaseMapConfig?.noteStatus;
    const activeChild = baseData?.selectBaseMapConfig?.activeChild;
    const loop = (layers) => {
      layers.map(async (layer) => {
        const { id, type, url, children } = layer;
        if (type && url) {
          const baseLayer = {
            id,
            type,
            url,
            groupType: layer?.isNote ? 'TopLayer' : 'BaseLayer',
          };
          baseMapLayers.push(baseLayer);
          if (children && children.length > 0) loop(children);
        } else {
          let effectLayer = [];
          let childActiveData = [];
          if (activeChild) {
            childActiveData = children?.filter((c) => c?.id === activeChild);
          }
          effectLayer = effectLayer.concat(
            activeChild && childActiveData?.length > 0
              ? childActiveData
              : [children.find((d) => d.type && d.url && !d.isNote)]
          );
          effectLayer = effectLayer.concat(children.filter((d) => d.isNote));
          loop(effectLayer);
        }
      });
    };
    if (baseMap?.length) {
      let isDefaultLayer = [baseMap.find((m) => m.isDefault === true) || baseMap[0]];
      if (activeBaseMap) {
        const d = baseMap?.filter((f) => f.id === activeBaseMap);
        if (d && d?.length) {
          isDefaultLayer = d;
        }
      }
      loop(isDefaultLayer);
    }
    let topLayerVisible = !unShowAllBaseMapOnMap;
    if (!isEmpty(noteStatus)) {
      if (activeBaseMap && noteStatus.hasOwnProperty(`${activeBaseMap}`)) {
        const d = baseMap?.filter((f) => f.id === activeBaseMap);
        if (d && d?.length) {
          topLayerVisible = noteStatus[activeBaseMap];
        }
      }
    }
    return new Promise((resolve) => {
      return Promise.all(
        baseMapLayers.map(async (layer) => {
          const layerItem = await MapInstance?.loadMapLayer({
            ...layer,
            otherProps: { dataId: layer.id },
          });
          let layerVisible =
            layer?.groupType === 'TopLayer' ? topLayerVisible : !unShowAllBaseMapOnMap;
          layerItem.set({
            groupType: layer.groupType,
            dataId: layer.id,
            visible: layerVisible,
          });
          return layerItem;
        })
      ).then((layers) => {
        resolve(layers);
      });
    });
  };

  const setDefaultMapConfig = () => {
    const storageToken = localStorage.getItem('SYSTEM_BASIC_TOKEN');
    if (config?.fontsUrl) {
      esriConfig.fontsUrl = config?.fontsUrl;
    }
    if (config?.assetsPath) {
      esriConfig.assetsPath = config?.assetsPath;
    }
    // esriConfig.fontsUrl = '/arcgis_font';
    // esriConfig.fontsUrl = '/arcgis_font';
    esriConfig.request &&
      esriConfig.request.interceptors &&
      esriConfig.request.interceptors.push({
        headers: {
          token:
            props?.mapToken ||
            storageToken ||
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJ3ZWIiLCJpc3MiOiJDYW1lbCIsImV4cCI6MTcxMzk0NjE3NCwiaWF0IjoxNzEzODU5Nzc0LCJqdGkiOiIxMmVjMDUzNzRhY2E0NzhlOWM2ZWI2NDEyNmNkY2E4NiIsInVzZXJuYW1lIjoieW5zIn0.CvXL7scU5dDEoWdaT9Aj8yWtLa71v90-d8WBwwSq9I8',
        },
        before: function (params) {
          if (
            params?.url?.indexOf('/camel/vector') === -1 &&
            params?.url?.indexOf('camel/yztLssyProject') === -1 &&
            params?.url?.indexOf('/camel/ghcgConcurrent') === -1 &&
            params?.url?.indexOf('/camel/mapScope') === -1 &&
            params?.url?.indexOf('/camel/ghzt') === -1 &&
            params?.url?.indexOf('/camel/StatisticalAnalysisPro') === -1 &&
            params?.url?.indexOf('/camel/yjddoublepick') === -1 &&
            params?.url?.indexOf('/camel/mapServer') === -1 &&
            params?.url?.indexOf('/camel/jsyjConfig') === -1 &&
            params?.url?.indexOf('/camel/version') === -1 &&
            params?.url?.indexOf('/camel/lsydVector') === -1
          ) {
            params.requestOptions = {
              ...omit(params.requestOptions, ['headers']),
            };
          }
          if (params.requestOptions) {
          }
        },
        after: function (res) {
          const { data, requestOptions } = res;
        },
        error: function (err) {
          //
        },
      });
  };

  const initMap = async () => {
    setDefaultMapConfig();
    let basemap;
    const loadLayers = [];
    const baseMaps = await getBaseLayersHandle();
    const baseLayers = baseMaps.filter((d) => d.groupType === 'BaseLayer');
    const topLayers = baseMaps.filter((d) => d.groupType === 'TopLayer');
    isLackBase.value = false;
    if (baseLayers.length) {
      basemap = new Basemap({ baseLayers, id: 'basemap' });
    } else if (config?.defaultLayers || config?.defaultLayers?.length) {
      isLackBase.value = false;
    } else {
      isLackBase.value = true;
    }

    const _Map = new Map(
      basemap
        ? {
            basemap,
          }
        : {}
    );

    let MapViewConfig = {};
    if (config?.mapView) {
      MapViewConfig = { ...config.mapView };
    }

    const _MapView = new MapView({
      ui: {
        padding: { top: 16, left: 16, right: 16, bottom: 16 },
      },
      ...MapViewConfig,
      map: _Map,
      highlightOptions: {
        color: [255, 255, 255, 0],
        haloOpacity: 0,
        fillOpacity: 0,
      },
      container: MapRef.value,
      constraints: {
        snapToZoom: false,
        ...MapViewConfig?.constraints,
      },
      extent: config.defaultExtent || {
        xmin: 97.52668287000006,
        xmax: 106.19594241000006,
        ymin: 21.142051910000077,
        ymax: 29.225499240000076,
      },
      spatialReference: {
        wkid: 4490,
      },
    });

    _MapView.ui.remove('attribution');
    _MapView.ui.remove('zoom');
    _MapView.when(() => {
      mapLoaded.value = true;
    });
    MapInstance.updateContext({ Map: _Map, MapView: _MapView });
    if (topLayers.length) {
      topLayers.forEach((item) => {
        MapInstance.Map.add(item);
      });
    }

    if (config.defaultLayers && config.defaultLayers.length) {
      Promise.all(
        config.defaultLayers.map(async (item) => {
          const layer = await AddLayerToMapView(item, MapInstance, [], config?.mapFileLayer || []);
          loadLayers.push({
            name: item.name,
            id: item.id,
            key: item.id,
            layer,
            dataYear: item.dataYear,
          });
        })
      ).finally(() => {
        emits('onLoaded', MapInstance, loadLayers);
      });
    } else {
      emits('onLoaded', MapInstance);
    }
    setTimeout(() => {
      updateWidgets();
    }, 0);
  };

  const updateWidgets = () => {
    if (config?.widgets?.control) {
      MapInstance.LayerControl.updateControlRef(ControlRef.value);
    }
    if (config?.widgets?.legend && config?.widgets?.legend.show) {
      MapInstance.LayerLegend.updateControlRef(ControlRef.value);
    }
    // 图例
    // setTimeout(() => {
    //   if (config?.widgets?.legend && config?.widgets?.legend.show) {
    //     const element = new Legend({
    //       mapInstance: mapInstance.value,
    //       style: config?.widgets?.legend?.style,
    //     });
    //     mapInstance.value.LayerLegend?.create(
    //       element,
    //       config?.widgets?.legend?.position || 'BottomLeft'
    //     );
    //   }
    // }, 1000);
  };

  const onViewTableHandle = (node) => {
    showMapTable.value = true;
    viewTableNode.value = node;
  };

  const onCloseMapTable = () => {
    showMapTable.value = false;
  };
  const onRegionSelected = (data) => {
    console.log('data', data);
  };
  const clearHeightArea = () => {
    console.log('clearHeightArea');
  };

  onMounted(() => {
    initMap();
  });

  const expose = {
    addLayer: (addLayerItem) => {
      console.log('添加图层', addLayerItem);
      const { id, url, queryType, mapType, featureId, hasData, proxyUrl } = addLayerItem;
      MapInstance.addMapLayerToMap({
        url,
        type: mapType,
        groupType: 'DefaultLayer',
        otherProps: {
          id: addLayerItem.id,
          groupType: 'DefaultLayer',
          serverId: addLayerItem?.value,
          serverYear: addLayerItem?.dataYear,
          serverName: addLayerItem?.label,
          opacity: 1,
          mapType: addLayerItem.mapType,
          hasData: hasData,
          sqsxLayer: mapType === 'GeoWayWMTSLayer',
          featureId: featureId,
          queryType: queryType,
          proxyUrl: proxyUrl,
        },
      });
    },
    removeLayer: (removeLayerItem) => {
      MapInstance.LayerControl.updateControlList('REMOVE', removeLayerItem.id);
      const { allLayers } = MapInstance.Map;
      const deleteLayer = allLayers?.items.find(
        (i) =>
          i.id === removeLayerItem.id && i?.groupType !== 'BaseLayer' && i?.groupType !== 'TopLayer'
      );
      if (deleteLayer) {
        MapInstance.removeLayer({ layer: deleteLayer });
      }
    },
  };

  defineExpose(expose);
</script>

<style lang="less" scoped>
  .arcgis-map-wrap {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    .arcgis-map {
      position: relative;
      width: 100%;
      height: 100%;
      background: url(data:image/png;base64,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)
        #f0f0f0;
      overflow: hidden;
    }

    .error-text {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: #666;
    }

    .left-top-widget-wrap {
      position: absolute;
      left: 16px;
      top: 16px;
      z-index: 1;
      height: 600px;
    }

    .right-top-widget-wrap {
      display: flex;
      position: absolute;
      right: 16px;
      top: 16px;
      z-index: 3;

      & > div:not(.arcgis-tool-warp) {
        margin-left: 12px;
      }
    }

    .left-bottom-widget-wrap {
      display: flex;
      position: absolute;
      left: 16px;
      bottom: 16px;
      flex-direction: column;
      align-items: flex-end;
      pointer-events: none;
      z-index: 9;
    }

    .right-bottom-widget-wrap {
      display: flex;
      position: absolute;
      right: 16px;
      bottom: 16px;
      flex-direction: column;
      align-items: flex-end;
      pointer-events: none;
      z-index: 2;
    }

    .right-bottom-widget-wrap > div:not(.arcgis-tool-warp) {
      pointer-events: auto;
    }

    .mapTableWrap {
      position: absolute;
      left: 400px;
      right: 20px;
      bottom: 20px;
      z-index: 9;
      background: #fff;
    }

    .queryTableWrap {
      position: absolute;
      left: 400px;
      right: 20px;
      bottom: 20px;
      z-index: 9;
    }

    :deep(.esri-widget *:focus) {
      outline: 0;
    }

    :deep(.esri-view-surface:after) {
      display: none;
    }

    :deep(.esri-ui-top-right.esri-ui-corner) {
      display: flex;
      flex-direction: row-reverse;
    }

    :deep(.esri-ui-bottom-right) {
      flex-direction: column;
      //flex-direction: column-reverse;
    }

    :deep(.esri-ui-bottom-right .esri-component) {
      margin-top: 10px;
    }

    :deep(.esri-popup--is-docked-top-right) {
      inset: 62px 0 0;
    }

    :deep(.arcgis-tool-kit-widget) {
      box-shadow: unset;
    }

    :deep(.esri-feature__content-element) {
      padding: 0;
    }
  }
  .left_top_layer_tree {
    width: 300px;
    height: 500px;
    background-color: white;
  }
</style>
