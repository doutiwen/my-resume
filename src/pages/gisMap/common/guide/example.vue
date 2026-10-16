<template>
  <div
    class="map"
    id="MapPageContainer"
    v-loading.lock="mapLoading"
    element-loading-text="地图加载中..."
    element-loading-background="rgba(255, 255, 255, 0.1)"
    ref="MapRef"
  >
    <ArcgisMap :config="config" :mapProps="mapProps" @onLoaded="onMapLoaded">
      <template v-if="$slots.leftTopWidget" #leftTopWidget="{ map }">
        <slot name="leftTopWidget" :map="map"></slot>
      </template>
    </ArcgisMap>
    <div class="self-draw-point" v-if="mapIns">
      <MeasurePoint
        ref="PointRef"
        v-if="mapIns"
        :mapInstance="mapIns"
        :symbol="{
          point: {
            color: '#11F5FF',
            size: 12,
            outlineColor: '#fff',
            outlineWidth: 1,
            outlineStyle: 'solid',
          },
        }"
        @onComplete="onComplete"
        @onClick="onClick"
        @onRemove="onRemove"
        @on-cancel="onCancel"
      />
      <MeasureArea
        ref="AreaRef"
        @onClick="onClick"
        :mapInstance="mapIns"
        @onComplete="onComplete"
        @onRemove="onRemove"
        @on-cancel="onCancel"
      />
      <el-button type="danger" @click="onClear">清除面积绘制</el-button>
      <el-button type="danger" @click="onClearPoint">清除点</el-button>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import { cloneDeep } from 'lodash-es';
  import ArcgisMap from '@/components/ArcgisMap/index';
  import { MeasurePoint, MeasureArea } from '@/components/export';
  import { InitData } from '@/components/export';
  import { InitRegionData, MapMarkerInitObjRes } from './_InitData';

  const props = defineProps({});
  const emits = defineEmits(['onLoaded']);
  const { InitLayerData } = InitData;
  const mapLoading = ref(true);
  const mapProps = ref(props);
  const mapIns = ref();
  const AreaRef = ref();
  const PointRef = ref();
  const MapRef = ref();
  const config = ref({
    mapView: {
      // constraints: {
      //   minZoom: 5, //最小空间等级
      // }
    },
    baseData: {
      baseMap: [
        {
          id: '634645354567',
          label: '影像',
          url: '',
          type: '',
          isDefault: true,
          thumbnail: 'http://192.168.130.220:9004/newjcxxptdl/20220621091315588001.jpg',
          fid: '0',
          children: [
            {
              id: '634645354567_2021',
              label: '2021年',
              fid: '634645354567',
              url: 'http://192.168.130.71:7080/tdtYnImg100cm2000_2020',
              type: 'TileLayer',
              isDefault: false,
              isNote: false,
              thumbnail: 'http://192.168.130.220:9004/newjcxxptdl/20220621091315588001.jpg',
            },
            {
              id: '634645354567_2022',
              label: '2022年',
              fid: '634645354567',
              url: 'http://192.168.130.249:9080/arcgis/YNDEM',
              type: 'TileLayer',
              isDefault: false,
              isNote: false,
              thumbnail: 'http://192.168.130.220:9004/newjcxxptdl/20220621091315588001.jpg',
            },
            {
              id: '634645354567_c',
              label: 'ZZC',
              fid: '634645354567',
              url: 'http://192.168.130.220:9008/YNDT/ZZC_53/p12/',
              type: 'VectorTileLayer',
              isDefault: false,
              isNote: true,
            },
          ],
        },
        {
          id: '4028025d8097f27c0180989a7f7f0256',
          label: '地形',
          url: 'http://t0.tianditu.gov.cn/img_c/wmts',
          type: 'TianDituLayer',
          isDefault: false,
          thumbnail: 'http://192.168.130.220:9004/newyztdl/20220505151747710001.jpg',
          fid: '0',
          children: [
            {
              id: '634645354231_c',
              fid: '4028025d8097f27c0180989a7f7f0256',
              label: 'ZZC',
              url: 'http://t0.tianditu.gov.cn/cia_c/wmts',
              type: 'TianDituLayer',
              isDefault: false,
              isNote: true,
            },
          ],
        },
      ],
      // baseMap: [
      //   {
      //     id: '4028025d8097f27c0180989a7f7f0256',
      //     label: '电子地图',
      //     url: 'http://t0.tianditu.gov.cn/vec_c/wmts',
      //     type: 'TianDituLayer',
      //     isDefault: false,
      //     thumbnail:
      //       'http://192.168.130.220:9004/dlyztgov/20221104154231160001.jpg',
      //     fid: '0',
      //     children: [
      //       {
      //         id: "634645354231_c",
      //         fid: '4028025d8097f27c0180989a7f7f0256',
      //         label: 'ZZC',
      //         url: "http://t0.tianditu.gov.cn/cva_c/wmts",
      //         type: "TianDituLayer",
      //         isDefault: false,
      //         isNote: true
      //       }
      //     ]
      //   },
      //   {
      //     id: '402802348d6907e6018dee728c155504',
      //     label: '影像',
      //     url: 'http://t0.tianditu.gov.cn/img_c/wmts',
      //     type: 'TianDituLayer',
      //     isDefault: true,
      //     thumbnail:
      //       'http://192.168.130.220:9004/sjyztgov/20230914101108991001.jpg',
      //     fid: '0',
      //     children: [
      //       {
      //         id: "634645354231_v",
      //         fid: '402802348d6907e6018dee728c155504',
      //         label: 'ZZC',
      //         url: "http://t0.tianditu.gov.cn/cia_c/wmts",
      //         type: "TianDituLayer",
      //         isDefault: false,
      //         isNote: true
      //       }
      //     ]
      //   },
      // ],
      defaultLayers: undefined,
      selectBaseMapConfig: {
        unShowAllBaseMapOnMap: false,
        activeBaseMap: '',
        activeChild: '',
        noteStatus: {},
      },
    },
    widgets: {
      control: true,
      zoom: true,
      regionSelect: InitRegionData,
      // legend: {
      //   show: true,
      // },
      toolKit: {
        swipe: {
          container: document.getElementById('MapPageContainer'),
          layerData: InitLayerData,
        },
        screen: {
          container: document.getElementById('MapPageContainer'),
          layerTree: InitLayerData,
        },
        print: {
          container: document.getElementById('MapPageContainer'),
        },
        query: true,
        sign: {
          show: true,
          onQuery: (num) => {
            return new Promise((resolve, reject) => {
              resolve(MapMarkerInitObjRes);
            });
          },
          onSave: (params) => {
            return new Promise((resolve, reject) => {
              const jsonPoints = JSON.parse(params.labelPoints);
              const newObj = {
                ...params,
                id: params?.id || new Date().getTime(),
                labelPoints: {
                  x: Number(jsonPoints.x),
                  y: Number(jsonPoints.y),
                },
              };
              if (params?.id) {
                const index = MapMarkerInitObjRes?.data?.data.findIndex(
                  (item) => item.id === newObj.id
                );
                if (index > -1) {
                  MapMarkerInitObjRes?.data?.data?.splice(index, 1, newObj);
                }
              } else {
                MapMarkerInitObjRes?.data?.data?.unshift(newObj);
              }
              resolve({ success: true, code: 200, data: newObj });
            });
          },
          onDelete: (id) => {
            return new Promise((resolve, reject) => {
              const index = MapMarkerInitObjRes?.data?.data.findIndex((item) => item.id === id);
              if (index > -1) {
                MapMarkerInitObjRes?.data?.data?.splice(index, 1);
              }
              resolve({ success: true, code: 200 });
            });
          },
        },
        distance: true,
        surface: true,
        locate: true,
        pickup: true,
      },
    },
  });

  function onMapLoaded(map) {
    mapLoading.value = false;
    mapIns.value = map;
    emits('onLoaded', map);
  }

  const onClick = (event) => {
    console.log('点了');
  };

  const onComplete = (data) => {
    console.log(data);
  };

  const onRemove = (layerId) => {
    console.log(layerId);
  };

  const onClear = () => {
    AreaRef?.value?.remove();
  };

  const onClearPoint = () => {
    PointRef?.value?.remove();
  };

  const onCancel = () => {
    console.log('cancel');
  };
</script>

<style scoped lang="less">
  .map {
    width: 100%;
    height: 100%;

    .self-draw-point {
      position: absolute;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 4;
      display: flex;

      :deep(.el-button) {
        margin: 0 4px;
      }

      :deep(.tool-item) {
        margin: 0 4px;
        background-color: white;
      }
    }
  }
</style>
