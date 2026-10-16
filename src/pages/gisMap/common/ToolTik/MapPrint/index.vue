<template>
  <div class="map-print-root-container" :id="domId" ref="MapPrintRootRef">
    <div class="screen-shot-container">
      <div class="print-seeting-wrap" v-show="!legendVisible">
        <div class="pannel-title">
          <div class="left-title">地图打印</div>
          <div class="close-btn" @click.stop="onCloseHandle">
            <el-icon :size="16">
              <CircleClose />
            </el-icon>
          </div>
        </div>
        <div class="tip-wrap">
          <el-icon :size="18" style="color: #1ab3ff; margin-right: 8px">
            <WarningFilled />
          </el-icon>
          <span>可通过拖拽缩放右侧地图来确定打印范围</span>
        </div>
        <div class="setting-content">
          <el-scrollbar height="100%">
            <div class="form-content">
              <el-form
                ref="FormRef"
                :size="'default'"
                :model="form"
                label-position="top"
                label-width="auto"
              >
                <el-form-item label="图像标题（最多30个字符）" prop="imgTitle">
                  <el-input
                    clearable
                    maxlength="30"
                    minlength="2"
                    v-model.trim="form.imgTitle"
                    placeholder="请输入（最多30个字符）"
                  />
                </el-form-item>
                <el-form-item label="图像布局" prop="mapLayout">
                  <el-select
                    placeholder=""
                    v-model="form.mapLayout"
                    @change="
                      (val) => {
                        onLayoutOrSizeChange(val, form.mapImgSize);
                      }
                    "
                  >
                    <el-option :key="1" :label="'横向'" :value="1" />
                    <el-option :key="2" :label="'纵向'" :value="2" />
                  </el-select>
                </el-form-item>

                <el-form-item label="纸张尺寸" prop="mapImgSize">
                  <el-select
                    placeholder=""
                    v-model="form.mapImgSize"
                    @change="
                      (val) => {
                        onLayoutOrSizeChange(form.mapLayout, val);
                      }
                    "
                  >
                    <el-option :key="1" :label="'A4'" :value="1" />
                    <el-option :key="2" :label="'A3'" :value="2" />
                  </el-select>
                </el-form-item>
                <div class="paper-size-wrap">
                  <el-form-item label="纸张宽度" prop="width">
                    <el-input :disabled="true" v-model.trim="form.width" placeholder="">
                      <template #append>毫米</template>
                    </el-input>
                  </el-form-item>
                  <el-form-item style="margin-left: 16px" label="纸张高度" prop="height">
                    <el-input :disabled="true" v-model.trim="form.height" placeholder="">
                      <template #append>毫米</template>
                    </el-input>
                  </el-form-item>
                </div>
                <el-form-item label="纸张边距" prop="padding">
                  <span class="padding-tip">(边距最小为10,最大为40,超出此范围皆为无效值)</span>
                  <el-input-number
                    style="width: 100%"
                    v-model="form.padding"
                    :min="10"
                    :max="40"
                    @change="onFormPaddingChange"
                  />
                </el-form-item>
                <el-form-item label="比例尺" prop="scale">
                  <div class="scale-wrap">
                    <div class="scale-number">1:</div>
                    <el-select
                      placeholder="选择比例"
                      v-model="form.scale"
                      :filterable="true"
                      @keyup.enter="handleEnter"
                      @change="onFormScaleChange"
                    >
                      <el-option
                        v-for="item in ScaleOptions"
                        :key="item"
                        :label="item"
                        :value="item"
                      />
                    </el-select>
                  </div>
                </el-form-item>
                <div class="check-item">
                  <div class="left-wrap">
                    <span class="item-label">比例数值</span>
                    <el-checkbox v-model="form.showScale" label="" size="large" />
                  </div>
                </div>
                <div class="check-item">
                  <div class="left-wrap">
                    <span class="item-label">显示图例</span>
                    <el-checkbox v-model="form.showLegend" label="" size="large" />
                  </div>
                  <div
                    class="right-wrap"
                    v-show="form.showLegend"
                    @click.stop="legendVisible = true"
                  >
                    <el-icon :size="14">
                      <Setting />
                    </el-icon>
                    <span style="margin-left: 4px">图例配置</span>
                  </div>
                </div>
              </el-form>
            </div>
          </el-scrollbar>
        </div>
        <div class="handle-wrap">
          <el-button type="primary" @click.stop="onPrintHandle" :loading="printLoading">
            <el-icon>
              <Printer />
            </el-icon>
            <span>打印</span>
          </el-button>
          <el-button @click.stop="onScreenshotUrl" :loading="downLoading">
            <el-icon>
              <PictureFilled />
            </el-icon>
            <span>{{ downLoading ? '正在导出...' : '导出图片' }}</span>
          </el-button>
        </div>
      </div>
      <div :class="['print-seeting-wrap', 'is-legend-setting']" v-if="legendVisible">
        <div class="pannel-title">
          <div class="left-title">图例配置</div>
          <div class="close-btn" @click.stop="legendVisible = false">
            <el-icon :size="16">
              <CircleClose />
            </el-icon>
          </div>
        </div>
        <div class="legend-content-wrap">
          <el-scrollbar height="100%" v-if="legendData.length > 0">
            <div class="legend-list" v-for="(item, index) in legendData" :key="index">
              <LegendItem
                :data="item"
                :select-keys="selectLegendKeys"
                :show-check="true"
                @onCheck="onLegendCheck"
              ></LegendItem>
            </div>
          </el-scrollbar>
          <div class="empty-wrap" v-else>
            <el-empty :image-size="80" description="暂无数据" />
          </div>
        </div>
      </div>
      <div class="jsScreenshotImageWrap" ref="MapScreenRef">
        <div
          :class="['img-container', form.mapLayout === 2 && 'img-vertical-layout']"
          :style="{
            width: `${contentWidth}px`,
            height: `${contentHeight}px`,
            padding: `${paaddingNumber + 20}px ${paaddingNumber}px ${paaddingNumber + 10}px ${paaddingNumber}px`,
          }"
        >
          <div
            class="map-container-header"
            :style="{
              height: `${paaddingNumber + 20}px`,
              paddingTop: `${paaddingNumber - 10 * (Dpi / 25.4) * zoom}px`,
            }"
          >
            <div id="mapTitleWrap" :style="{ lineHeight: `${10 * (Dpi / 25.4) * zoom + 20}px` }">
              {{ form.imgTitle || '无标题' }}
            </div>
          </div>
          <div class="map-content-warp" v-loading.lock="mapLoading" id="exportMapContainer">
            <ArcgisMap :config="config" v-if="isStart" :mapProps="{}" @onLoaded="onMapLoaded" />
            <div class="compass-img-wrap"></div>
            <div
              class="print-map-legend-wrap"
              v-if="form.showLegend"
              :style="{
                left: `16px`,
                bottom: `16px`,
                transform: `scale(${zoom > 0.8 ? 0.8 : zoom})`,
              }"
            >
              <div id="printLegend" style="background-color: rgba(255, 255, 255, 0.6)">
                <div class="legend-title">图例</div>
                <div
                  class="legend-content"
                  :style="{
                    maxHeight:
                      form.mapLayout === 1
                        ? `${586 - pageInnerOffset * 2}px`
                        : `${856 - pageInnerOffset * 2}px`,
                  }"
                >
                  <LegendItem
                    v-if="
                      selectLegendDatas.length > 0 &&
                      selectLegendDatas.some((d) => d?.legend && d?.legend?.length)
                    "
                    v-for="(item, index) in selectLegendDatas"
                    :key="index"
                    :data="item"
                    :isPrint="true"
                  ></LegendItem>
                  <div class="empty-legend" v-else>请配置图例</div>
                </div>
              </div>
            </div>
          </div>
          <div
            class="map-container-footer"
            :style="{
              padding: `0px  ${paaddingNumber}px  ${paaddingNumber - 20}px  ${paaddingNumber}px`,
            }"
          >
            <div class="info-detail">
              <div class="scale-text" id="scaleWrap">比例尺：1: {{ form.scale }}</div>
              <div class="date-info" id="dateWrap">
                <span>云南省自然资源厅</span>
                <span style="padding: 0 8px">
                  {{ dateString }}
                </span>
                <span>制图</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import {
    defineProps,
    toRefs,
    useSlots,
    ref,
    toRaw,
    onMounted,
    reactive,
    watch,
    onUnmounted,
  } from 'vue';
  import { isArray, isEmpty, cloneDeep } from 'lodash-es';
  import printJS from 'print-js';
  import { FindMetaData, FindMetaDataByServerId } from '@/api/dataMap';
  import ArcgisMap from '../../index';
  import { SpatialReference, TileInfo } from '../../modules';
  import { ResetLayerOrder, AddLayerToMapView } from '@/utils/MapCommonMethods';
  import LegendItem from '../../widgets/Legend/LegendItem.vue';
  import { FormatLegend, QueryTableLayerLegend } from '../../widgets/Legend/utils';
  import { GetDpi, DownLoadImg } from './common';

  const Dpi = GetDpi();
  const ScaleOptions = [
    2000, 5000, 10000, 20000, 25000, 50000, 100000, 200000, 500000, 1000000, 2000000, 5000000,
  ];
  // 纸张尺寸 (px)
  const PaperSize = {
    x_a4: Math.round(210 * (Dpi / 25.4)),
    y_a4: Math.round(297 * (Dpi / 25.4)),
    x_a3: Math.round(297 * (Dpi / 25.4)),
    y_a3: Math.round(420 * (Dpi / 25.4)),
  };
  // 纸张尺寸 (mm)
  const RealPaperSize = { x_a4: 210, y_a4: 297, x_a3: 297, y_a3: 420 };

  const props = defineProps({
    mapInstance: { type: Object, default: () => ({}) },
    domId: { type: String, default: 'MapPrintRootContainer' },
  });

  const { mapInstance: MapIns, domId } = toRefs(props);

  const emits = defineEmits(['onClick', 'onComplete', 'onRemove', 'onClose']);

  const InitFormValue = {
    imgTitle: '',
    mapImgSize: 1,
    width: RealPaperSize.y_a4,
    height: RealPaperSize.x_a4,
    mapLayout: 1,
    padding: 10,
    scale: Math.floor(MapIns?.value?.MapView?.scale),
    showScale: true,
    showLegend: false,
  };

  let form = reactive({ ...InitFormValue });

  const MapPrintRootRef = ref(null);
  const MapScreenRef = ref(null);
  //const mapInstance = ref(null);
  const slots = useSlots();
  const mapLoading = ref(true);
  const isStart = ref(false);
  const parentNode = ref(
    MapIns?.value?.config?.widgets?.toolKit?.print?.container ||
      document.getElementById('ArcgisMapContainer')
  );
  const contentWidth = ref(842);
  const contentHeight = ref(595);
  const zoom = ref(842 / Math.round(297 * (Dpi / 25.4))); // 页面纸张长宽与实际纸张长宽比例
  const pageInnerOffset = ref(Math.ceil(Math.round(10 * (Dpi / 25.4))));
  const paaddingNumber = ref(Math.ceil(pageInnerOffset.value * zoom.value));
  const legendData = ref([]);
  const legendVisible = ref(false);
  const selectLegendKeys = ref([]);
  const selectLegendDatas = ref([]);
  const dateString = ref('');
  const printLoading = ref(false);
  const downLoading = ref(false);
  const excelImg = ref(); //excel图片
  const config = ref({
    baseData: {
      baseMap: [],
    },
    widgets: {
      zoom: {},
    },
  });
  const onCloseHandle = (e) => {
    const swipeDom = document.getElementById(domId.value);
    if (parentNode.value && MapPrintRootRef.value) {
      // parentNode.value.removeChild(MapSwiperRootRef.value);
      // swipeDom.remove();
    }
    parentNode.value = undefined;
    emits('onClose');
  };

  const initData = () => {
    setDate();
    if (parentNode.value && MapPrintRootRef.value) {
      parentNode.value.appendChild(MapPrintRootRef.value);
    }
    let _mapConfig = { ...config.value };
    _mapConfig = {
      ..._mapConfig,
      baseData: {
        ...MapIns?.value?.config?.baseData,
        hiddenBaseMapElement: true,
        selectBaseMapConfig: {
          unShowAllBaseMapOnMap: !MapIns?.value?.BaseMapIns?.baseMapVisible,
          activeBaseMap: MapIns?.value?.BaseMapIns?.activeBaseMap,
          noteStatus: MapIns?.value?.BaseMapIns?.noteStatus,
          activeChild: MapIns?.value?.BaseMapIns?.activeChild,
        },
      },
      widgets: {
        toolKit: {
          ..._mapConfig.widgets?.toolKit,
        },
      },
    };
    config.value = _mapConfig;
    isStart.value = true;
  };

  const setDate = () => {
    const timestamp = new Date().getTime();
    const date = new Date(timestamp);

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    // const day = date.getDate().toString().padStart(2, '0');
    dateString.value = `${year}年${month}月`;
  };

  const onMapLoaded = async (arcgisMap) => {
    mapLoading.value = false;
    if (arcgisMap) {
      const map = toRaw(arcgisMap);
      mapInstance.value = map;
      form.scale = Math.floor(MapIns?.value?.MapView?.scale);
      map.MapView.when(() => {
        setTimeout(() => {
          map.MapView.goTo(MapIns?.value?.MapView.extent, { animate: false });
        }, 0);

        map.MapView.on('mouse-wheel', (e) => {
          form.scale = Math.floor(map.MapView.scale);
        });
      });
      onAddLayerToMap();
    }
  };

  const onAddLayerToMap = () => {
    const map = toRaw(mapInstance.value);
    const mapLayers = MapIns?.value?.LayerControl?.controlList || map.temporaryLayers || [];
    const configData = map?.configData || [];
    const cropImg = map.excelCropImg || {};
    const graphicLayers = map?.Map.layers._items || [];
    // 设置缩放
    const spatialReference = new SpatialReference({
      wkid: 4490,
    });
    const tileInfo = TileInfo.create({
      spatialReference,
      numLODs: 24,
    });
    map.MapView.constraints.lods = tileInfo.lods;
    map.MapView.constraints.rotationEnabled = false; // 禁止旋转
    // 加载当前地图中已存在的服务
    if (mapLayers.length) {
      const mapData = [...mapLayers];
      mapData
        ?.reverse()
        ?.filter((d) => d.opacity && d.visible)
        .forEach((d) => {
          addMapLayerToMapHandle(d);
        });
      setTimeout(() => {
        onReorderChange(mapData);
      }, 400);
    }
  };

  /**
   * @Title:加载服务至图层事件
   */
  const addMapLayerToMapHandle = async (data) => {
    const map = toRaw(mapInstance.value);
    const fileLayer = map?.LayerControl?.uploadFileLayers || [];
    await AddLayerToMapView(data, map, [], fileLayer);
  };

  /**
   * @Title: 排序改变事件
   */
  const onReorderChange = (data) => {
    const map = toRaw(mapInstance.value);
    const mapLayers = map?.Map.allLayers._items;
    const topOrder = data.length - 1;
    const mapData = [...data].reverse();
    mapData.forEach((item, index) => {
      const { id } = item;
      const layerIndex = mapLayers.findIndex((d) => d.serverId === id);
      map?.Map.reorder(mapLayers[layerIndex], topOrder - index);
    });
  };

  const onFormPaddingChange = (val) => {
    pageInnerOffset.value = Math.ceil(form.padding * Math.round(Dpi / 25.4));
    paaddingNumber.value = Math.ceil(pageInnerOffset.value * zoom.value);
  };
  const onFormScaleChange = (v) => {
    if (mapInstance.value) {
      const d = toRaw(mapInstance.value);
      d.MapView.scale = v;
    }
  };
  const handleEnter = (e) => {
    const v = Number(e?.target?.value);
    if (!isNaN(v)) {
      form.scale = v;
      if (mapInstance.value) {
        const d = toRaw(mapInstance.value);
        d.MapView.scale = v;
      }
    }
  };

  //布局或纸张大小改变修改纸张宽度和高度
  const onLayoutOrSizeChange = (layout, size) => {
    const { x_a3, y_a3, x_a4, y_a4 } = RealPaperSize;
    // { x_a4: 210, y_a4: 297, x_a3: 297, y_a3: 420 }
    let w = form.width;
    let h = form.height;
    //横向
    if (layout === 1) {
      w = size === 1 ? y_a4 : y_a3;
      h = size === 1 ? x_a4 : x_a3;
    }
    //纵向
    if (layout === 2) {
      w = size === 1 ? x_a4 : x_a3;
      h = size === 1 ? y_a4 : y_a3;
    }
    form.width = w;
    form.height = h;
    caculateSize();
  };

  const caculateSize = (h) => {
    if (MapScreenRef?.value) {
      const { clientWidth, clientHeight } = MapScreenRef.value;
      const a4 = 297 / 210;
      const a3 = 420 / 297;
      let widthTemp = 0;
      const { mapLayout, mapImgSize } = form;
      const heightTemp = h ? h - 10 : clientHeight - 32;
      if (mapLayout === 1 && mapImgSize === 1) {
        widthTemp = heightTemp * a4;
      }
      if (mapLayout === 2 && mapImgSize === 1) {
        widthTemp = heightTemp / a4;
      }
      if (mapLayout === 1 && mapImgSize === 2) {
        widthTemp = heightTemp * a3;
      }
      if (mapLayout === 2 && mapImgSize) {
        widthTemp = heightTemp / a4;
      }

      if (widthTemp < clientWidth - 32) {
        const nW = widthTemp + 1;
        const nh = heightTemp + 1;
        contentWidth.value = nW;
        contentHeight.value = nh;
        zoom.value =
          (mapLayout === 1 ? widthTemp : heightTemp) /
          Math.round((mapImgSize === 1 ? 297 : 420) * (Dpi / 25.4));
        paaddingNumber.value = Math.ceil(pageInnerOffset.value * zoom.value);
      } else {
        caculateSize(heightTemp);
      }
    }
  };

  const contentResizeChange = () => {
    caculateSize();
  };

  const loadMapLegend = () => {
    const layersId = [];
    const services = [];
    if (!mapInstance.value) return;
    const map = toRaw(mapInstance.value);
    const rendererLegend = [];
    map.Map.allLayers.forEach((d) => {
      if (d.legend && !isEmpty(d.legend)) {
        rendererLegend.push(d.legend);
      }
    });
    // const legendTemp = [];
    // const initConfig = `{"layers":[{"layerType":"Feature Layer","layerId":2,"maxScale":0,"legend":[{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWP5caHoPwOVAIdBHyMLtQyDgVEDRw0cNXDUwFEDaWUgh0EfIzUNBABZbwUYeHiwyQAAAABJRU5ErkJggg==","values":["0101"],"width":20,"label":"水田(0101)","contentType":"image/png","url":"a57c81831b217a8427343cb8de89ca4c","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWP5/XT1fwYqAVbpUEYWahkGA6MGjho4auCogaMG0spAVulQRmoaCABYsgTH2o6qjgAAAABJRU5ErkJggg==","values":["0102"],"width":20,"label":"水浇地(0102)","contentType":"image/png","url":"477428f911e3147d6ef30448e2994a0c","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWP5///EfwYqAUZGC0YWahkGA6MGjho4auCogaMG0spARkYLRmoaCABYGgSMivsrpAAAAABJRU5ErkJggg==","values":["0103"],"width":20,"label":"旱地(0103)","contentType":"image/png","url":"c9f0a9bcd58e0c85b76f47948a554499","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWO5svL0fwYqAZ1wU0YWahkGA6MGjho4auCogaMG0spAnXBTRmoaCABZwgUKH97vpAAAAABJRU5ErkJggg==","values":["0201"],"width":20,"label":"果园(0201)","contentType":"image/png","url":"3dbbbf5857c8fe6adc6b35813d7d28d1","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWO5svL0fwYqAZ1wU0YWahkGA6MGjho4auCogaMG0spAnXBTRmoaCABZwgUKH97vpAAAAABJRU5ErkJggg==","values":["0201K"],"width":20,"label":"可调整果园(0201K)","contentType":"image/png","url":"3dbbbf5857c8fe6adc6b35813d7d28d1","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWO5unzDfwYqAe3IAEYWahkGA6MGjho4auCogaMG0spA7cgARmoaCABZ+gUmK93rrwAAAABJRU5ErkJggg==","values":["0202"],"width":20,"label":"茶园(0202)","contentType":"image/png","url":"cb6f90b5f3628b8a03b71eaac983f04b","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWO5unzDfwYqAe3IAEYWahkGA6MGjho4auCogaMG0spA7cgARmoaCABZ+gUmK93rrwAAAABJRU5ErkJggg==","values":["0202K"],"width":20,"label":"可调整茶园(0202K)","contentType":"image/png","url":"cb6f90b5f3628b8a03b71eaac983f04b","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWO5sefGfwYqAQ0XDUYWahkGA6MGjho4auCogaMG0spADRcNRmoaCABZXwTmmtHNmgAAAABJRU5ErkJggg==","values":["0203"],"width":20,"label":"橡胶园(0203)","contentType":"image/png","url":"83abd7d5e4b433a36dfe54359a3ead35","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWO5sefGfwYqAQ0XDUYWahkGA6MGjho4auCogaMG0spADRcNRmoaCABZXwTmmtHNmgAAAABJRU5ErkJggg==","values":["0203K"],"width":20,"label":"可调整橡胶园(0203K)","contentType":"image/png","url":"83abd7d5e4b433a36dfe54359a3ead35","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWO5sefGfwYqAQ0XDUYWahkGA6MGjho4auCogaMG0spADRcNRmoaCABZXwTmmtHNmgAAAABJRU5ErkJggg==","values":["0204"],"width":20,"label":"其他园地(0204)","contentType":"image/png","url":"83abd7d5e4b433a36dfe54359a3ead35","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWO5sefGfwYqAQ0XDUYWahkGA6MGjho4auCogaMG0spADRcNRmoaCABZXwTmmtHNmgAAAABJRU5ErkJggg==","values":["0204K"],"width":20,"label":"可调整其他园地(0204K)","contentType":"image/png","url":"83abd7d5e4b433a36dfe54359a3ead35","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWMxmmbzn4FK4FzWEUYWahkGA6MGjho4auCogaMG0srAc1lHGKlpIABdoQZO9FRW+wAAAABJRU5ErkJggg==","values":["0301"],"width":20,"label":"乔木林地(0301)","contentType":"image/png","url":"49c3c57a5916b9d0f4b43d40d57e515e","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWMxmmbzn4FK4FzWEUYWahkGA6MGjho4auCogaMG0srAc1lHGKlpIABdoQZO9FRW+wAAAABJRU5ErkJggg==","values":["0301K"],"width":20,"label":"可调整乔木林地(0301K)","contentType":"image/png","url":"49c3c57a5916b9d0f4b43d40d57e515e","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWMxmmbzn4FK4FzWEUYWahkGA6MGjho4auCogaMG0srAc1lHGKlpIABdoQZO9FRW+wAAAABJRU5ErkJggg==","values":["0302"],"width":20,"label":"竹林地(0302)","contentType":"image/png","url":"49c3c57a5916b9d0f4b43d40d57e515e","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWMxmmbzn4FK4FzWEUYWahkGA6MGjho4auCogaMG0srAc1lHGKlpIABdoQZO9FRW+wAAAABJRU5ErkJggg==","values":["0302K"],"width":20,"label":"可调整竹林地(0302K)","contentType":"image/png","url":"49c3c57a5916b9d0f4b43d40d57e515e","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWMxmmbzn4FK4FzWEUYWahkGA6MGjho4auCogaMG0srAc1lHGKlpIABdoQZO9FRW+wAAAABJRU5ErkJggg==","values":["0303"],"width":20,"label":"红树林地(0303)","contentType":"image/png","url":"49c3c57a5916b9d0f4b43d40d57e515e","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWMxmmbzn4FK4FzWEUYWahkGA6MGjho4auCogaMG0srAc1lHGKlpIABdoQZO9FRW+wAAAABJRU5ErkJggg==","values":["0304"],"width":20,"label":"森林沼泽(0304)","contentType":"image/png","url":"49c3c57a5916b9d0f4b43d40d57e515e","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWPJO1H8n4FKYJJFLyMLtQyDgVEDRw0cNXDUwFEDaWXgJIteRmoaCABbrQWpmKpXAQAAAABJRU5ErkJggg==","values":["0305"],"width":20,"label":"灌木林地(0305)","contentType":"image/png","url":"854eff39beb0c5f1ab72459df797f7b4","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWPJO1H8n4FKYJJFLyMLtQyDgVEDRw0cNXDUwFEDaWXgJIteRmoaCABbrQWpmKpXAQAAAABJRU5ErkJggg==","values":["0306"],"width":20,"label":"灌丛沼泽(0306)","contentType":"image/png","url":"854eff39beb0c5f1ab72459df797f7b4","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWOZfn7TfwYqgUxDP0YWahkGA6MGjho4auCogaMG0srATEM/RmoaCABadgU6G3YXwwAAAABJRU5ErkJggg==","values":["0307"],"width":20,"label":"其他林地(0307)","contentType":"image/png","url":"e3ab20040a32497db68b3e00662aab95","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWOZfn7TfwYqgUxDP0YWahkGA6MGjho4auCogaMG0srATEM/RmoaCABadgU6G3YXwwAAAABJRU5ErkJggg==","values":["0307K"],"width":20,"label":"可调整其他林地(0307K)","contentType":"image/png","url":"e3ab20040a32497db68b3e00662aab95","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWOZdsnoPwOVQJbeOUYWahkGA6MGjho4auCogaMG0srALL1zjNQ0EABbcQW4WMFHwwAAAABJRU5ErkJggg==","values":["0401"],"width":20,"label":"天然牧草地(0401)","contentType":"image/png","url":"f5b8ebbbab8e7f903dd0ef3af4a5e9d9","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWOZdsnoPwOVQJbeOUYWahkGA6MGjho4auCogaMG0srALL1zjNQ0EABbcQW4WMFHwwAAAABJRU5ErkJggg==","values":["0402"],"width":20,"label":"沼泽草地(0402)","contentType":"image/png","url":"f5b8ebbbab8e7f903dd0ef3af4a5e9d9","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWOZda7+PwOVQJpRIyMLtQyDgVEDRw0cNXDUwFEDaWVgmlEjIzUNBABa0wVrlLwQ7QAAAABJRU5ErkJggg==","values":["0403"],"width":20,"label":"人工牧草地(0403)","contentType":"image/png","url":"816ed1a8e8ec936937bd5bc5895f2344","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWOZda7+PwOVQJpRIyMLtQyDgVEDRw0cNXDUwFEDaWVgmlEjIzUNBABa0wVrlLwQ7QAAAABJRU5ErkJggg==","values":["0403K"],"width":20,"label":"可调整人工牧草地(0403K)","contentType":"image/png","url":"816ed1a8e8ec936937bd5bc5895f2344","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWPZfmfBfwYqAU+VBEYWahkGA6MGjho4auCogaMG0spAT5UERmoaCABZ8wUf2iO7KgAAAABJRU5ErkJggg==","values":["0404"],"width":20,"label":"其他草地(0404)","contentType":"image/png","url":"8454afe35fdbbb78d86eb34f81da8f7c","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWN5tHDqfwYqAbn4bEYWahkGA6MGjho4auCogaMG0spAufhsRmoaCABaDgU6MIYkugAAAABJRU5ErkJggg==","values":["05"],"width":20,"label":"商服用地(05)","contentType":"image/png","url":"c4c5a8a2609a34c2db7534cf1df005d9","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWP5vM7rPwOVAG/QNkYWahkGA6MGjho4auCogaMG0spA3qBtjNQ0EABaOQVn1PMIOQAAAABJRU5ErkJggg==","values":["0508"],"width":20,"label":"物流仓储用地(0508)","contentType":"image/png","url":"df4d76e0a7abef5c299d125567eebe48","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWP5vE7/PwOVAG/QRUYWahkGA6MGjho4auCogaMG0spA3qCLjNQ0EABabwWC89cKEAAAAABJRU5ErkJggg==","values":["05H1"],"width":20,"label":"商业服务业设施用地(05H1)","contentType":"image/png","url":"9d1cfb08c22247844394dd14c3f26852","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWM5OqvnPwOVgHVaCSMLtQyDgVEDRw0cNXDUwFEDaWWgdVoJIzUNBABaqQVnA3dY/QAAAABJRU5ErkJggg==","values":["06"],"width":20,"label":"工矿仓储用地(06)","contentType":"image/png","url":"cbb9ad470e83a42ed84eef0028fe36a7","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWM5OqvnPwOVgHVaCSMLtQyDgVEDRw0cNXDUwFEDaWWgdVoJIzUNBABaqQVnA3dY/QAAAABJRU5ErkJggg==","values":["0601"],"width":20,"label":"工业用地(0601)","contentType":"image/png","url":"cbb9ad470e83a42ed84eef0028fe36a7","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWM5OqvnPwOVgHVaCSMLtQyDgVEDRw0cNXDUwFEDaWWgdVoJIzUNBABaqQVnA3dY/QAAAABJRU5ErkJggg==","values":["0602"],"width":20,"label":"采矿用地(0602)","contentType":"image/png","url":"cbb9ad470e83a42ed84eef0028fe36a7","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWM5OqvnPwOVgHVaCSMLtQyDgVEDRw0cNXDUwFEDaWWgdVoJIzUNBABaqQVnA3dY/QAAAABJRU5ErkJggg==","values":["0604"],"width":20,"label":"仓储用地(0604)","contentType":"image/png","url":"cbb9ad470e83a42ed84eef0028fe36a7","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWM5OqvnPwOVgHVaCSMLtQyDgVEDRw0cNXDUwFEDaWWgdVoJIzUNBABaqQVnA3dY/QAAAABJRU5ErkJggg==","values":["06H1"],"width":20,"label":"工业仓储用地(06H1)","contentType":"image/png","url":"cbb9ad470e83a42ed84eef0028fe36a7","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWN5mp72n4FKQHrmLEYWahkGA6MGjho4auCogaMG0spA6ZmzGKlpIABbDgWgpcf3zQAAAABJRU5ErkJggg==","values":["0701"],"width":20,"label":"诚镇住宅用地(0701)","contentType":"image/png","url":"0ebd5fd43c3ac29e8e9b37fd4642e398","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWN509n1n4FKQKS8jJGFWobBwKiBowaOGjhq4KiBtDJQpLyMkZoGAgBaRAVTN3XrVQAAAABJRU5ErkJggg==","values":["0702"],"width":20,"label":"农村宅基地(0702)","contentType":"image/png","url":"fbb4915e6413290ced137e21e15cf6f0","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWP5uHTLfwYqAf5oH0YWahkGA6MGjho4auCogaMG0spA/mgfRmoaCABZiAUIu6gH9QAAAABJRU5ErkJggg==","values":["0809"],"width":20,"label":"公共设施用地(0809)","contentType":"image/png","url":"edc7c8d638e71006af1741fefaf3cf3e","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWNpPBz7n4FKoN52MSMLtQyDgVEDRw0cNXDUwFEDaWVgve1iRmoaCABbnAWxUCVECgAAAABJRU5ErkJggg==","values":["0810"],"width":20,"label":"公园与绿地(0810)","contentType":"image/png","url":"f2493a4897a55ce36f2a64ab3af80407","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWNpPBz7n4FKoN52MSMLtQyDgVEDRw0cNXDUwFEDaWVgve1iRmoaCABbnAWxUCVECgAAAABJRU5ErkJggg==","values":["0810A"],"width":20,"label":"广场用地(0810A)","contentType":"image/png","url":"f2493a4897a55ce36f2a64ab3af80407","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWP5uHTLfwYqAf5oH0YWahkGA6MGjho4auCogaMG0spA/mgfRmoaCABZiAUIu6gH9QAAAABJRU5ErkJggg==","values":["08H1"],"width":20,"label":"机关团体新闻出版用地(08H1)","contentType":"image/png","url":"edc7c8d638e71006af1741fefaf3cf3e","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWP5uHTLfwYqAf5oH0YWahkGA6MGjho4auCogaMG0spA/mgfRmoaCABZiAUIu6gH9QAAAABJRU5ErkJggg==","values":["08H2"],"width":20,"label":"科教文卫用地(08H2)","contentType":"image/png","url":"edc7c8d638e71006af1741fefaf3cf3e","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWP5uHTLfwYqAf5oH0YWahkGA6MGjho4auCogaMG0spA/mgfRmoaCABZiAUIu6gH9QAAAABJRU5ErkJggg==","values":["08H2A"],"width":20,"label":"高教用地(08H2A)","contentType":"image/png","url":"edc7c8d638e71006af1741fefaf3cf3e","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWM5WJT4n4FKwL5vPiMLtQyDgVEDRw0cNXDUwFEDaWWgfd98RmoaCABbhwW+xi1GAQAAAABJRU5ErkJggg==","values":["09"],"width":20,"label":"特殊用地(09)","contentType":"image/png","url":"2ab47600b7d84cf3362e4664706b96b1","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWO5ePLyfwYqAX1zXUYWahkGA6MGjho4auCogaMG0spAfXNdRmoaCABZXgTlwywm+QAAAABJRU5ErkJggg==","values":["1001"],"width":20,"label":"铁路用地(1001)","contentType":"image/png","url":"e2c313d0e5567c191c7aad643b3167f2","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWO5ePLyfwYqAX1zXUYWahkGA6MGjho4auCogaMG0spAfXNdRmoaCABZXgTlwywm+QAAAABJRU5ErkJggg==","values":["1002"],"width":20,"label":"轨道交通用地(1002)","contentType":"image/png","url":"e2c313d0e5567c191c7aad643b3167f2","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWO5dOPkfwYqAT0Nc0YWahkGA6MGjho4auCogaMG0spAPQ1zRmoaCABZQQTfprbRbAAAAABJRU5ErkJggg==","values":["1003"],"width":20,"label":"公路用地(1003)","contentType":"image/png","url":"21af9ecddc03ad8164fffde4d588e15f","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWO5d+/ufwYqASUlZUYWahkGA6MGjho4auCogaMG0spAJSVlRmoaCABY1wS5/Z5wMQAAAABJRU5ErkJggg==","values":["1004"],"width":20,"label":"城镇村道路用地(1004)","contentType":"image/png","url":"b57f3cf4cc29b342b2efa7dda86b740c","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWNZtXLlfwYqgbDwcEYWahkGA6MGjho4auCogaMG0srAsPBwRmoaCABargVWQZEbGwAAAABJRU5ErkJggg==","values":["1005"],"width":20,"label":"交通服务场站用地(1005)","contentType":"image/png","url":"6eb1f624ad36107f623de16ca8c6a5b1","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWM5dPDgfwYqATt7e0YWahkGA6MGjho4auCogaMG0spAO3t7RmoaCABZ1gUO5sCO2wAAAABJRU5ErkJggg==","values":["1006"],"width":20,"label":"农村道路(1006)","contentType":"image/png","url":"f1900514fa0671b867c672c092c004a3","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWN53Vn3n4FKQLS8iZGFWobBwKiBowaOGjhq4KiBtDJQtLyJkZoGAgBaYAVguRwfLgAAAABJRU5ErkJggg==","values":["1007"],"width":20,"label":"机场用地(1007)","contentType":"image/png","url":"1b8e172c4eb9b7ae97c17a39b5e946fd","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWN53Vn3n4FKQLS8iZGFWobBwKiBowaOGjhq4KiBtDJQtLyJkZoGAgBaYAVguRwfLgAAAABJRU5ErkJggg==","values":["1008"],"width":20,"label":"港口码头用地(1008)","contentType":"image/png","url":"1b8e172c4eb9b7ae97c17a39b5e946fd","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWN53Vn3n4FKQLS8iZGFWobBwKiBowaOGjhq4KiBtDJQtLyJkZoGAgBaYAVguRwfLgAAAABJRU5ErkJggg==","values":["1009"],"width":20,"label":"管道运输用地(1009)","contentType":"image/png","url":"1b8e172c4eb9b7ae97c17a39b5e946fd","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWNZfO3rfwYqgVgtbkYWahkGA6MGjho4auCogaMG0srAWC1uRmoaCABZqwTkHCQFjgAAAABJRU5ErkJggg==","values":["1101"],"width":20,"label":"河流水面(1101)","contentType":"image/png","url":"0adceb689827187783ea59060f09725f","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWNZfO3rfwYqgVgtbkYWahkGA6MGjho4auCogaMG0srAWC1uRmoaCABZqwTkHCQFjgAAAABJRU5ErkJggg==","values":["1102"],"width":20,"label":"湖泊水面(1102)","contentType":"image/png","url":"0adceb689827187783ea59060f09725f","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWNZfO3rfwYqgVgtbkYWahkGA6MGjho4auCogaMG0srAWC1uRmoaCABZqwTkHCQFjgAAAABJRU5ErkJggg==","values":["1103"],"width":20,"label":"水库水面(1103)","contentType":"image/png","url":"0adceb689827187783ea59060f09725f","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWOZsOr8fwYqgYIwQ0YWahkGA6MGjho4auCogaMG0srAgjBDRmoaCABaxwVJfuRjYgAAAABJRU5ErkJggg==","values":["1104"],"width":20,"label":"坑塘水面(1104)","contentType":"image/png","url":"15eac466475a0afe209d0e72d5421688","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWOZsOr8fwYqgYIwQ0YWahkGA6MGjho4auCogaMG0srAgjBDRmoaCABaxwVJfuRjYgAAAABJRU5ErkJggg==","values":["1104A"],"width":20,"label":"养殖坑塘(1104A)","contentType":"image/png","url":"15eac466475a0afe209d0e72d5421688","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWOZsOr8fwYqgYIwQ0YWahkGA6MGjho4auCogaMG0srAgjBDRmoaCABaxwVJfuRjYgAAAABJRU5ErkJggg==","values":["1104K"],"width":20,"label":"可调整养殖坑塘(1104K)","contentType":"image/png","url":"15eac466475a0afe209d0e72d5421688","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWPZfO/HfwYqAV8lDkYWahkGA6MGjho4auCogaMG0spAXyUORmoaCABZTQTJqgEQbAAAAABJRU5ErkJggg==","values":["1105"],"width":20,"label":"沿海滩涂(1105)","contentType":"image/png","url":"966189da5269f35cf642984d33902595","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWPZfO/HfwYqAV8lDkYWahkGA6MGjho4auCogaMG0spAXyUORmoaCABZTQTJqgEQbAAAAABJRU5ErkJggg==","values":["1106"],"width":20,"label":"内陆滩涂(1106)","contentType":"image/png","url":"966189da5269f35cf642984d33902595","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWNZcPbDfwYqgQRjAUYWahkGA6MGjho4auCogaMG0srABGMBRmoaCABZ3AT1iHFBLwAAAABJRU5ErkJggg==","values":["1107"],"width":20,"label":"沟渠(1107)","contentType":"image/png","url":"5b5dd0c2ec47ff978e267449a453bb7d","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWNZcPbDfwYqgQRjAUYWahkGA6MGjho4auCogaMG0srABGMBRmoaCABZ3AT1iHFBLwAAAABJRU5ErkJggg==","values":["1107A"],"width":20,"label":"干渠(1107A)","contentType":"image/png","url":"5b5dd0c2ec47ff978e267449a453bb7d","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWNZf+LOfwYqgUALFUYWahkGA6MGjho4auCogaMG0srAQAsVRmoaCABZ1wT/TjzD/AAAAABJRU5ErkJggg==","values":["1108"],"width":20,"label":"沼泽地(1108)","contentType":"image/png","url":"7929c708b51011ff3341ed0af0c593ba","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWN51pTyn4FKQKpuDiMLtQyDgVEDRw0cNXDUwFEDaWWgVN0cRmoaCABavQWGnF/CwgAAAABJRU5ErkJggg==","values":["1109"],"width":20,"label":"水工建筑用地(1109)","contentType":"image/png","url":"8e2a15568b44a477b15a5f40836281dc","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWO5/vb3fwYqAU1hVkYWahkGA6MGjho4auCogaMG0spATWFWRmoaCABYigSTWdY9VgAAAABJRU5ErkJggg==","values":["1110"],"width":20,"label":"冰川及永久积雪(1110)","contentType":"image/png","url":"941c1b4d7e7c2f62c55568751101e1d2","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWN5eOfhfwYqAXkVeUYWahkGA6MGjho4auCogaMG0spAeRV5RmoaCABYyQS0sBSdtQAAAABJRU5ErkJggg==","values":["1201"],"width":20,"label":"空闲地(1201)","contentType":"image/png","url":"ff6ef318dd2d16ab3e11ce3129a04241","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWO5s6XpPwOVgIpPHSMLtQyDgVEDRw0cNXDUwFEDaWWgik8dIzUNBABaEwVAqbPxMAAAAABJRU5ErkJggg==","values":["1202"],"width":20,"label":"设施农用地(1202)","contentType":"image/png","url":"116e9ae61411df3a6337510bb421659a","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWM5sW3TfwYqAQsvP0YWahkGA6MGjho4auCogaMG0spACy8/RmoaCABZ/QUiEoizywAAAABJRU5ErkJggg==","values":["1203"],"width":20,"label":"田坎(1203)","contentType":"image/png","url":"82a7c2bb7544f1af8846d99299fbb46a","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWM5cebSfwYqAQsTPUYWahkGA6MGjho4auCogaMG0spACxM9RmoaCABZewTs1CJe4QAAAABJRU5ErkJggg==","values":["1204"],"width":20,"label":"盐碱地(1204)","contentType":"image/png","url":"68021d28b4405679c98716713eac7ca8","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWM5sW/VfwYqAQunMEYWahkGA6MGjho4auCogaMG0spAC6cwRmoaCABZ9QUimw8cnwAAAABJRU5ErkJggg==","values":["1205"],"width":20,"label":"沙地(1205)","contentType":"image/png","url":"c15c92225e406683c0e1ee4a6dd7faf1","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWO5fmLnfwYqAU0Ld0YWahkGA6MGjho4auCogaMG0spATQt3RmoaCABZfQT62a5d2gAAAABJRU5ErkJggg==","values":["1206"],"width":20,"label":"裸土地(1206)","contentType":"image/png","url":"5ab535df1d484bd11316f58e0181df3f","height":20},{"imageData":"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQ4jWO5d/fafwYqASVlLUYWahkGA6MGjho4auCogaMG0spAJWUtRmoaCABY6ATBnfF1vgAAAABJRU5ErkJggg==","values":["1207"],"width":20,"label":"裸岩石砾地(1207)","contentType":"image/png","url":"2e0f7683ec3d2369f2892c94448691e4","height":20}],"layerName":"地类图斑","minScale":0}]}`
    // const mapLegendConfig = JSON.parse(initConfig)
    // if (isArray(mapLegendConfig)) {
    //     //@ts-ignore
    //     legendTemp.unshift(FormatLegend(mapLegendConfig?.[0]?.layers || mapLegendConfig?.[0]));
    // } else {
    //     //@ts-ignore
    //     legendTemp.unshift(FormatLegend(mapLegendConfig?.layers));
    // }
    // legendData.value = [...legendTemp.flat(), ...rendererLegend]
    // return;
    const effectLayers = map.Map.allLayers.filter(
      (d) =>
        (d.url &&
          d.parent?.id !== 'basemap' &&
          d?.groupType !== 'TopLayer' &&
          d.visible &&
          d.opacity) ||
        d?.isTableLayer
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
                  //@ts-ignore
                  legendTemp.unshift(
                    FormatLegend(mapLegendConfig?.[0]?.layers || mapLegendConfig?.[0])
                  );
                } else {
                  //@ts-ignore
                  legendTemp.unshift(FormatLegend(mapLegendConfig?.layers));
                }
              }
            } else {
              if (typeof layersId[index] === 'undefined') {
                //@ts-ignore
                value.data?.layers && legendTemp.unshift(FormatLegend(value.data?.layers));
              } else {
                //@ts-ignore
                value.data?.layers &&
                  legendTemp.unshift(
                    FormatLegend(value.data?.layers.find((d) => d.layerId === layersId[index]))
                  );
              }
            }
          }
        });
        legendData.value = [...legendTemp.flat(), ...rendererLegend];
      })
      .catch((err) => {
        legendData.value = [];
      });
  };

  const onLegendCheck = (checked, legend) => {
    const { id, fid } = legend;
    const selectKeysTemp = cloneDeep(selectLegendKeys.value);
    const selectLegendTemp = cloneDeep(selectLegendDatas.value);
    if (checked) {
      selectKeysTemp.push(id);
      const index = selectLegendTemp.findIndex((d) => d.id === fid);
      if (index > -1) {
        const legendIndex = selectLegendTemp[index].legend.findIndex((d) => d.id === id);
        if (legendIndex === -1) {
          const temp = [...selectLegendTemp[index].legend];
          temp.push(legend);
          selectLegendTemp[index].legend = temp;
        }
      } else {
        const temp = { ...legendData.value.find((d) => d.id === fid), legend: [] };
        temp.legend.push(legend);
        selectLegendTemp.push(temp);
      }
    } else {
      const index = selectLegendTemp.findIndex((d) => d.id === fid);
      selectKeysTemp.splice(
        selectKeysTemp.findIndex((d) => d === id),
        1
      );
      if (index > -1) {
        const legendIndex = selectLegendTemp[index].legend.findIndex((d) => d.id === id);
        if (legendIndex > -1) {
          const temp = [...selectLegendTemp[index].legend];
          if (temp.length === 1) {
            selectLegendTemp.splice(index, 1);
          } else {
            temp.splice(legendIndex, 1);
            selectLegendTemp[index].legend = temp;
          }
        }
      }
    }
    selectLegendKeys.value = [...selectKeysTemp];
    selectLegendDatas.value = [...selectLegendTemp];
  };

  /**
   * @title: 打印
   */
  const onPrintHandle = () => {
    const { x_a4, y_a4 } = PaperSize;
    const map = toRaw(mapInstance.value);
    const { mapLayout, mapImgSize } = form;
    const dom = document.getElementById('exportMapContainer');
    const width = dom ? dom.offsetWidth : mapLayout === 1 ? y_a4 : x_a4;
    const height = dom ? dom.offsetHeight : mapLayout === 2 ? x_a4 : y_a4;
    const scale = mapLayout === 1 ? 3 : 5;
    const _width = width * scale;
    const _height = height * scale;
    printLoading.value = true;
    map?.MapView.takeScreenshot({ x: 0, y: 0, width: _width, height: _height, format: 'png' })
      .then(async (screenshot) => {
        const url = await downloadImage(screenshot.dataUrl, _width, _height, true);
        printLoading.value = false;
        printJS({
          printable: url,
          type: 'image',
          scanStyles: false,
          style: `@page{size: ${mapImgSize === 1 ? 'A4 ' : 'A3 '} ${mapLayout === 1 ? 'landscape' : 'portrait'}; margin: 0;}`,
        });
      })
      .catch(() => {
        printLoading.value = false;
      });
  };
  /**
   * @Title: 获取地图的截屏地址
   */
  const onScreenshotUrl = () => {
    const map = toRaw(mapInstance.value);
    downLoading.value = true;
    const { x_a4, y_a4 } = PaperSize;
    const { mapLayout } = form;
    const dom = document.getElementById('exportMapContainer');
    const width = dom ? dom.offsetWidth : mapLayout === 1 ? y_a4 : x_a4;
    const height = dom ? dom.offsetHeight : mapLayout === 2 ? x_a4 : y_a4;
    const scale = mapLayout === 1 ? 3 : 5;
    const _width = width * scale;
    const _height = height * scale;
    map?.MapView.takeScreenshot({ x: 0, y: 0, width: _width, height: _height, format: 'png' })
      .then((screenshot) => {
        downloadImage(screenshot.dataUrl, _width, _height);
      })
      .catch(() => {
        downLoading.value = false;
      });
  };

  /**
   * @Title: 下载图片
   * @Author: DuXueSong
   * @Date: 2022/5/31
   */
  const downloadImage = async (url, width, height, returnUrl) => {
    const { x_a3, x_a4, y_a3, y_a4 } = PaperSize;
    const { imgTitle, mapLayout, mapImgSize } = form;
    const filename = `${imgTitle || '无标题'}`;
    const margin = returnUrl ? Math.round(6 * (Dpi / 25.4)) : 0;
    let imgUrl = url;
    const _width = width;
    const _height = height;
    let canvansWidth = y_a4 - margin;
    let canvasHeight = x_a4 - margin;
    switch (mapLayout) {
      case 1:
        canvansWidth = mapImgSize === 2 ? y_a3 - margin : y_a4 - margin;
        canvasHeight = mapImgSize === 2 ? x_a3 - margin : x_a4 - margin;
        break;
      case 2:
        canvansWidth = mapImgSize === 2 ? x_a3 - margin : x_a4 - margin;
        canvasHeight = mapImgSize === 2 ? y_a3 - margin : y_a4 - margin;
        break;
      default:
        break;
    }
    imgUrl = await DownLoadImg(
      url,
      excelImg.value,
      canvansWidth,
      canvasHeight,
      _width,
      _height,
      pageInnerOffset.value,
      zoom.value,
      mapLayout
    );
    if (returnUrl) return imgUrl;
    //@ts-ignore
    if (!window.navigator.msSaveOrOpenBlob) {
      const element = document.createElement('a');
      element.setAttribute('href', imgUrl);
      element.setAttribute('download', filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      downLoading.value = false;
    } else {
      const byteString = atob(imgUrl.split(',')[1]);
      const mimeString = imgUrl.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      //@ts-ignore
      window.navigator.msSaveOrOpenBlob(blob, filename);
      downLoading.value = false;
    }
  };

  // 监听数据变化
  watch(
    () => form.showLegend,
    (newValue) => {
      if (newValue && !legendVisible.value) {
        if (!legendData.value.length) {
          loadMapLegend();
        }
        legendVisible.value = true;
      }
    }
  );

  onMounted(() => {
    initData();
    setTimeout(() => {
      caculateSize();
    }, 100);
    window.addEventListener('resize', contentResizeChange);
  });
  onUnmounted(() => {
    // 移除监听器
    window.removeEventListener('resize', contentResizeChange);
  });
  defineExpose({});
</script>
<style lang="less" scoped>
  @import './index.less';
</style>
