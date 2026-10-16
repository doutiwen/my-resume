<template>
  <div class="swipe-wrap" :id="domId">
    <div class="swipe-title">
      <div class="left-title">
        <div class="close-btn" @click.stop="onCloseHandle">
          <span class="close-icon">
            <el-icon :size="16">
              <Back />
            </el-icon>
          </span>
          <span class="close-btn-text">卷帘对比</span>
        </div>
        <div class="divider"></div>
        <div class="tip-wrap">
          <el-icon :size="18" style="color: #1ab3ff; margin-right: 8px">
            <WarningFilled />
          </el-icon>
          <span>
            勾选图层可控制地图显示，勾选左侧图层只在左侧地图显示，右侧同理，若想同时显示，请同时勾选左右两侧图层
          </span>
        </div>
      </div>
      <div class="add-layer-btn">
        <el-button type="primary" @click.stop="onClickAddBtnHandle">
          <el-icon>
            <Plus />
          </el-icon>
          <span>添加图层</span>
        </el-button>
      </div>
    </div>
    <div class="swipe-content" v-loading.lock="mapLoading" element-loading-text="地图加载中...">
      <ArcgisMap :config="config" v-if="isStart" :mapProps="{}" @onLoaded="onMapLoaded" />
      <div
        :class="['left-swipe-wrap', (dragStatus || !leftExpandStatus) && 'hidden-layer-content']"
      >
        <SwipeLayerControl
          :map-instance="mapInstance"
          :list="list"
          :expand="leftExpandStatus"
          :checkData="leftCheckData"
          position="LEFT"
          @onExpand="onExpandHandle"
          @onCheckChange="
            (data, checked) => {
              onCheckChangeHandle(data, checked, 'LEFT', !!data?.geoJson);
            }
          "
          @onOpacity="layerOpacityChangeHandle"
          @onDragEnd="onDragEndHandle"
          @onLocation="onLocationHandle"
          @onRemove="onRemoveHandle"
        />
      </div>
      <div
        :class="['right-swipe-wrap', (dragStatus || !rightExpandStatus) && 'hidden-layer-content']"
      >
        <SwipeLayerControl
          :map-instance="mapInstance"
          :list="list"
          :expand="rightExpandStatus"
          :checkData="rightCheckData"
          position="RIGHT"
          @onExpand="onExpandHandle"
          @onCheckChange="
            (data, checked) => {
              onCheckChangeHandle(data, checked, 'RIGHT', !!data?.geoJson);
            }
          "
          @onOpacity="layerOpacityChangeHandle"
          @onDragEnd="onDragEndHandle"
          @onLocation="onLocationHandle"
          @onRemove="onRemoveHandle"
        />
      </div>
    </div>
    <LayerSelect
      ref="LayerSelectRef"
      v-if="showLayerSelect"
      :user="{}"
      :show-tags="false"
      :select-mode="'multiple'"
      :show-sync="false"
      :data="layerTreeData?.filter((d) => !d.td) || []"
      :isContainDataSourceTable="false"
      @close="onLayerClose"
      @onAdd="onSelectLayerDone"
    />
  </div>
</template>

<script setup>
  import { defineProps, toRefs, useSlots, ref, toRaw, onUnmounted, onMounted, watch } from 'vue';
  import { cloneDeep, omit } from 'lodash-es';
  import { AddFeatureLayer, ResetLayerOrder, AddLayerToMapView } from '@/utils/MapCommonMethods';
  import { Swipe } from '../../../modules';
  import ArcgisMap from '../../../index';
  import SwipeLayerControl from './SwipeLayerControl.vue';
  import LayerSelect from '../../../LayerSelect/index.vue';

  const props = defineProps({
    mapInstance: { type: Object, default: () => ({}) },
    domId: { type: String, default: '' },
    defaultLayer: { type: Object, default: () => ({}) },
    fileLayer: { type: Object, default: () => ({}) },
    layerTree: { type: Array, default: () => [] },
    user: { type: Object, default: () => ({}) },
    mapExtent: { type: Object, default: () => ({}) },
    initExtent: { type: Object, default: () => ({}) },
    layerTreeData: { type: Object, default: () => ({}) },
  });

  const { mapInstance: MapIns, domId, defaultLayer, fileLayer, layerTreeData } = toRefs(props);

  const emits = defineEmits(['onClick', 'onComplete', 'onRemove', 'onClose']);

  let MapLayers = [];

  let SwipeRef = null;
  const LayerSelectRef = ref(null);

  let pointerDownStatus = false;
  let pointerMoveStatus = false;
  let legendColspanStatus = false;
  let layerLength = 0;

  const mapInstance = ref(null);
  const slots = useSlots();
  const mapLoading = ref(true);
  const dragStatus = ref(false);
  const isStart = ref(false);
  const list = ref([]);
  const leftExpandStatus = ref(true);
  const rightExpandStatus = ref(true);
  const leftCheckData = ref([]);
  const rightCheckData = ref([]);
  const showLayerSelect = ref(false);
  const config = ref({
    baseData: {
      baseMap: [],
    },
    widgets: {
      zoom: {},
    },
  });

  const setMapConfig = () => {
    config.value = {
      baseData: {
        baseMap: [...MapIns?.value?.config?.baseData?.baseMap],
        defaultLayers: undefined,
        selectBaseMapConfig: {
          unShowAllBaseMapOnMap: false,
          activeBaseMap: '',
          activeChild: '',
          noteStatus: {},
        },
      },
      widgets: {
        zoom: true,
      },
    };
    isStart.value = true;
  };

  const onClickAddBtnHandle = () => {
    showLayerSelect.value = true;
    setTimeout(() => {
      LayerSelectRef?.value?.showModal();
    }, 300);
  };

  const onLayerClose = () => {
    showLayerSelect.value = false;
  };

  const onSelectLayerDone = (data, isSync) => {
    if (!data || !data?.length) return;
    const _oldList = [...list.value];

    data.map((d) => {
      const objServerId = d.id || d?.value || d?.serverId;
      const index = _oldList.findIndex((o) => o.serverId === objServerId);
      const obj = {
        ...d,
        url: d?.url,
        type: d?.mapType,
        opacity: 1,
        isChecked: false,
        serverId: objServerId,
        isGeoJson: false,
      };
      if (index === -1) {
        _oldList.unshift(obj);
        onCheckChangeHandle(obj, true, 'LEFT', !!obj?.geoJson);

        setTimeout(
          () => {
            onCheckChangeHandle(obj, true, 'RIGHT', !!obj?.geoJson);
          },
          obj?.dataSource === 'Table' ? 500 : 200
        );
      }
    });
    list.value = [..._oldList];
  };

  const loadLayerToMap = async (node, map) => {
    return new Promise(async (resolve) => {
      if (!map && !mapInstance) resolve(undefined);
      const m = map || mapInstance?.value;
      const nodeData = node;
      const layerIndex = MapLayers.findIndex(
        (d) => d.key === nodeData.serverId || d.key === nodeData.id
      );
      let layer;
      if (layerIndex === -1) {
        layer = await AddLayerToMapView(nodeData, m, MapLayers, fileLayer?.value || []);
        MapLayers.push({ key: nodeData.serverId, mapType: nodeData.type, layer: layer });
        const topOrder = list.value.length - 1;
        for (let i = list.value.length - 1; i > -1; i--) {
          const oldId = list[i]?.serverId;
          const d = MapLayers.filter((m) => m.key === oldId)[0];
          if (d) {
            m.Map.reorder(d?.layer, topOrder - i);
          }
        }
        ResetLayerOrder(m);
      }
      resolve(layer);
    });
  };

  const onMapLoaded = async (arcgisMap) => {
    mapLoading.value = false;
    if (arcgisMap) {
      let left = [];
      let right = [];
      const map = toRaw(arcgisMap);
      const { hightLightGraphics } = MapIns?.value;
      if (hightLightGraphics && hightLightGraphics.length) {
        hightLightGraphics.forEach((g) => {
          const { type, graphic, features } = g;
          if (type === 'graphic') {
            map?.MapView.graphics.addMany([graphic]);
          }
          if (type === 'feature') {
            AddFeatureLayer(features, map);
          }
        });
      }
      const initListData = initList(defaultLayer?.value || []);
      if (initListData.length === 1) {
        leftCheckData.value = initListData;
        rightCheckData.value = initListData;
        const layer = await loadLayerToMap(initListData[0], map);
        layer.set({ isGeoJson: initListData[0]?.isGeoJson });
        left.push(layer);
        right.push(layer);
      }
      if (initListData.length > 1) {
        leftCheckData.value = [initListData[0]];
        rightCheckData.value = [initListData[1]];
        const leftLayer = await loadLayerToMap(initListData[0], map);
        const rightLayer = await loadLayerToMap(initListData[1], map);
        leftLayer.set({ isGeoJson: initListData[0]?.isGeoJson });
        rightLayer.set({ isGeoJson: initListData[1]?.isGeoJson });
        left.push(leftLayer);
        right.push(rightLayer);
      }
      SwipeRef = new Swipe({
        leadingLayers: left, //左边图层
        trailingLayers: right, //右边图层
        position: 50,
        view: arcgisMap?.MapView,
      });
      arcgisMap?.MapView.ui.add(SwipeRef);
      mapInstance.value = toRaw(arcgisMap);
      setTimeout(() => {
        const dragContainer = SwipeRef._container;
        if (dragContainer) {
          SwipeRef._container.addEventListener('pointerdown', SwipePointerDown, true);
          SwipeRef._container.addEventListener('pointermove', SwipePointerMove, true);
        }
      }, 500);
      list.value = [...initListData];
      const initExtent = MapIns?.value?.MapView?.extent;
      if (
        initExtent &&
        initExtent?.xmax &&
        initExtent?.xmin &&
        initExtent?.ymax &&
        initExtent?.ymin
      ) {
        arcgisMap?.MapView?.goTo(initExtent);
      }
    }
  };

  const SwipePointerDown = () => {
    pointerDownStatus = true;
    document.addEventListener('pointerup', documentPointerUp);
  };

  const SwipePointerMove = () => {
    if (SwipeRef?._container?.hasChildNodes('esri-swipe__handle') && pointerDownStatus) {
      SwipeRef._container.lastChild.style.opacity = 0;
      pointerMoveStatus = true;
      dragStatus.value = true;
    }
  };

  const SwipePointerUp = () => {
    if (SwipeRef?._container?.hasChildNodes('esri-swipe__handle')) {
      SwipeRef._container.lastChild.style.opacity = 1;
    }
    pointerDownStatus = false;
    pointerMoveStatus = false;
    dragStatus.value = false;
    document.removeEventListener('pointerup', documentPointerUp);
  };
  const documentPointerUp = () => {
    SwipePointerUp();
  };

  const onCloseHandle = (e) => {
    const dragContainer = SwipeRef._container;
    if (dragContainer) {
      SwipeRef._container.removeEventListener('pointerdown', SwipePointerDown, true);
      SwipeRef._container.removeEventListener('pointermove', SwipePointerMove, true);
    }
    SwipeRef?.destroy();
    SwipeRef = null;
    emits('onClose');
    document.removeEventListener('pointerup', documentPointerUp);
  };

  const initList = (data) => {
    if (!data || !data.length) return [];
    let arr = [];
    data.map((d) => {
      const obj = {
        ...{ ...omit(d, ['layer', 'nodeItem']) },
        opacity: 1,
        isChecked: false,
        serverId: d?.id || d?.severId,
        dataType: d?.dataType || d?.nodeItem?.dataType,
        dataSource: d?.dataSource || d?.nodeItem?.dataSource,
        dataManyYear: d?.dataManyYear || d?.nodeItem?.dataManyYear,
        isGeoJson: d.dataSource === 'selfAdd',
      };
      arr.push(obj);
    });
    return arr;
  };

  const onExpandHandle = (status, position) => {
    position === 'LEFT' ? (leftExpandStatus.value = status) : (rightExpandStatus.value = status);
  };

  const onDragEndHandle = (data) => {
    const map = toRaw(mapInstance?.value);
    list.value = [...data];
    const topOrder = data.length - 1;
    for (let i = data.length - 1; i > -1; i--) {
      const d = MapLayers.filter((m) => m.key === data[i]?.serverId)[0];
      if (d) {
        map.Map.reorder(d?.layer, topOrder - i);
      }
    }
    ResetLayerOrder(map);
  };

  const onLocationHandle = (data) => {
    const map = toRaw(mapInstance?.value);
    const { allLayers } = map?.Map;
    const locationLayer = allLayers?.items.filter((d) => d.serverId === data?.serverId)[0];
    if (locationLayer && locationLayer?.fullExtent) {
      map?.MapView?.goTo(locationLayer?.fullExtent);
    }
  };

  const onRemoveHandle = (data) => {
    if (!data || !data?.id) return;
    const map = toRaw(mapInstance?.value);
    const value = data?.value || data.id || data?.serverId;
    const temp = cloneDeep(list.value);
    const leftTemp = cloneDeep(leftCheckData.value);
    const rightTemp = cloneDeep(rightCheckData.value);
    const index = temp.findIndex((d) => d.serverId === value);
    const layerIndex = MapLayers.findIndex((d) => d.key === value);
    const leftIndex = leftTemp.findIndex((d) => d.serverId === value);
    const rightIndex = rightTemp.findIndex((d) => d.serverId === value);
    const { leadingLayers, trailingLayers } = SwipeRef;
    let leftStatusIndex = leadingLayers?.items.findIndex((d) => d?.serverId === data.serverId);
    let rightStatusIndex = trailingLayers?.items.findIndex((d) => d?.serverId === data.serverId);
    if (leftStatusIndex > -1) {
      // 是否存在左侧区域 , 若存在则移除
      leadingLayers.remove(MapLayers[leftStatusIndex]?.layer);
      leadingLayers?.items?.splice(leftStatusIndex, 1);
    }
    if (rightStatusIndex > -1) {
      // 是否存在右侧区域 , 若存在则移除
      trailingLayers.remove(MapLayers[rightStatusIndex]?.layer);
      trailingLayers?.items?.splice(leftStatusIndex, 1);
    }
    if (layerIndex > -1) {
      if (MapLayers[layerIndex]?.layer) {
        map.removeLayer({
          layer: MapLayers[layerIndex]?.layer,
        });
      }
      MapLayers.splice(layerIndex, 1);
    }
    index > -1 && temp.splice(index, 1);
    leftIndex > -1 && leftTemp.splice(leftIndex, 1);
    rightIndex > -1 && rightTemp.splice(rightIndex, 1);
    leftCheckData.value = [...leftTemp];
    rightCheckData.value = [...rightTemp];
    list.value = [...temp];
  };

  const layerOpacityChangeHandle = (value, data) => {
    const map = toRaw(mapInstance?.value);
    const { allLayers } = map?.Map;
    const changeLayer = allLayers?.items.filter((d) => d.serverId === data?.serverId)[0];
    if (changeLayer) {
      changeLayer.opacity = value;
    }
    const _oldList = cloneDeep(list.value);
    const oIndex = _oldList.findIndex((o) => o.serverId === data?.serverId);
    if (oIndex > -1) {
      _oldList[oIndex].opacity = value;
    }
    list.value = [..._oldList];
  };

  const onCheckChangeHandle = (data, checked, layout, isLocation) => {
    if (layout === 'LEFT') {
      const _oldLeft = cloneDeep(leftCheckData.value);
      const { serverId } = data;
      const leftIndex = _oldLeft.findIndex((o) => o.serverId === serverId);
      if (leftIndex > -1) {
        _oldLeft.splice(leftIndex, 1);
      } else {
        _oldLeft.push(data);
      }
      leftCheckData.value = [..._oldLeft];
      onLeftChange(data, checked, isLocation);
    }
    if (layout === 'RIGHT') {
      const _oldRight = cloneDeep(rightCheckData.value);
      const { serverId } = data;
      const rightIndex = _oldRight.findIndex((o) => o.serverId === serverId);
      if (rightIndex > -1) {
        _oldRight.splice(rightIndex, 1);
      } else {
        _oldRight.push(data);
      }
      rightCheckData.value = [..._oldRight];
      onRightChange(data, checked, isLocation);
    }
  };
  const onLeftChange = async (data, checked, isLocation) => {
    const map = toRaw(mapInstance?.value);
    const layerIndex = MapLayers.findIndex((d) => d.key === data.serverId);
    const { leadingLayers, trailingLayers } = SwipeRef;
    let leftHasStatus = leadingLayers.some((d) => d?.serverId === data.serverId);
    let rightHasStatus = trailingLayers.some((d) => d?.serverId === data.serverId);
    if (!checked) {
      if (layerIndex > -1 && !rightHasStatus && !leftHasStatus) {
        map?.removeLayer({
          layer: MapLayers[layerIndex]?.layer,
        });
        MapLayers.splice(layerIndex, 1);
      }
      if (leftHasStatus) {
        // 是否存在左侧区域 , 若存在则移除
        leadingLayers.remove(MapLayers[layerIndex]?.layer);
        if (!rightHasStatus && layerIndex > -1) {
          map?.removeLayer({
            layer: MapLayers[layerIndex]?.layer,
          });
          MapLayers.splice(layerIndex, 1);
        }
      }
    }
    if (checked) {
      const layer =
        layerIndex === -1 ? await loadLayerToMap(data, map) : MapLayers[layerIndex]?.layer;
      layer.set({ isGeoJson: data.isGeoJson });
      const topOrder = list?.value?.length - 1;
      for (let i = list?.value?.length - 1; i > -1; i--) {
        const oldId = list?.value?.[i]?.serverId;
        const d = MapLayers.filter((m) => m.key === oldId)[0];
        if (d) {
          map?.Map.reorder(d?.layer, topOrder - i);
        }
      }
      layerIndex !== -1 && ResetLayerOrder(map);
      if (!leftHasStatus) {
        leadingLayers.add(layer);
        if (layer?.fullExtent && isLocation) {
          map?.MapView?.goTo(layer?.fullExtent);
        }
      }
    }
  };

  const onRightChange = async (data, checked, isLocation) => {
    const map = toRaw(mapInstance?.value);
    const layerIndex = MapLayers.findIndex((d) => d.key === data.serverId);
    const { leadingLayers, trailingLayers } = SwipeRef;
    let leftHasStatus = leadingLayers.some((d) => d?.serverId === data.serverId);
    let rightHasStatus = trailingLayers.some((d) => d?.serverId === data.serverId);
    if (!checked) {
      if (layerIndex > -1 && !rightHasStatus && !leftHasStatus) {
        map?.removeLayer({
          layer: MapLayers[layerIndex]?.layer,
        });
        MapLayers.splice(layerIndex, 1);
      }
      if (rightHasStatus) {
        // 是否存在右侧区域 , 若存在则移除
        trailingLayers.remove(MapLayers[layerIndex]?.layer);
        if (!leftHasStatus && layerIndex > -1) {
          map?.removeLayer({
            layer: MapLayers[layerIndex]?.layer,
          });
          MapLayers.splice(layerIndex, 1);
        }
      }
    }
    if (checked) {
      const layer =
        layerIndex === -1 ? await loadLayerToMap(data, map) : MapLayers[layerIndex]?.layer;
      layer.set({ isGeoJson: data.isGeoJson });
      const topOrder = list?.value?.length - 1;
      for (let i = list?.value?.length - 1; i > -1; i--) {
        const oldId = list?.value?.[i]?.serverId;
        const d = MapLayers.filter((m) => m.key === oldId)[0];
        if (d) {
          map?.Map.reorder(d?.layer, topOrder - i);
        }
      }
      layerIndex !== -1 && ResetLayerOrder(map);
      if (!rightHasStatus) {
        trailingLayers.add(layer);
        if (layer?.fullExtent && isLocation) {
          map?.MapView?.goTo(layer?.fullExtent);
        }
      }
    }
  };

  onMounted(() => {
    setMapConfig();
  });

  defineExpose({});
</script>
<style lang="less" scoped>
  @import '../index.less';
</style>
<style lang="less">
  .esri-swipe.esri-widget.esri-swipe--horizontal {
    .esri-swipe__container {
      margin-left: -30px;
      width: 60px;
      text-align: center;
    }

    .esri-swipe__divider {
      background: #409eff !important;
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-top: 0px;
      border-bottom: 0px;
      left: 30px;
      width: 4px;
      margin-left: -2px;
      transition: opacity 0.2s;
      outline: 0;
    }

    .esri-swipe__handle {
      background-color: #409eff !important;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      left: 10px;
      border: 1px solid rgba(255, 255, 255, 1);
      line-height: 40px;
      background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEwAAAAkCAYAAAAjMNwcAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAATKADAAQAAAABAAAAJAAAAAC/+/tsAAACSUlEQVRoBe1aQVLDMBAjHHlKH8Q15RU8J3yKp8AV5JB4bGFHu9QthrFnPPFGsna9VKETmO5+eXxgpCVMGGms8JR7i/X9LZL8pxyjYc6f5miYs2GDPjrQaQfw2+sB87nT8qplhZpD7VXCNQAkPGG+YmZfCa6Rq7VmqBkj1H5qrV3UQ6IZ8w1zHUWS4+aus195635/vzLujXcdXMMZZu9+Mx/iwYILZjbMAhViJoaAaQpnvopZD/GC2daiEIwWxDobqkCFZ2IImK9w5quY9ba4nUUhOGNGC24J4kUVqPAotC2Yr3Dmq5j1kvgyi0KoaMEkwbpUBfaGc/2FeME9n0WxoWpBTtBbQ1Q9XH8ltlsUAjNm1YKcQBXYG871H8THFsVGkwU5QW8NUfVw/YZ4ASe3KG6YLcgJVIEKV3oKV/qMs54xjhadsOERogtm3kXOVIn5hV+FVr0dCk5B1lN4uteyZj3Lno3zjuvTeL3j6FikouvDkuGjVx/RkmnTwkP/pb6njESBP7Ion+LwbuhJ/XEF8Iw5vlZ89eBs+hygYWaLmgQ7IuFslvHdguoMUDVZVOn0hhu6dWxBdSAkOLSo2q9wPgDzFc58FbNeEofH0FntN+EQqlrUJHBASgpel0xVOPNVzHpb7LegIVHRomqfwvkAzFc481XMeogvs6AhYWZRxVc4H4D5Cme+ihO9dhY0JI0WVdze8K1h7S2oDorEwaLjz2yqUQMfHXB1IPtfLNfORuTwTEmlrv16J831k/V4vePs2mjYaJizA076J0iO7PNn7xPkAAAAAElFTkSuQmCC');
      background-size: 80%;
      background-repeat: no-repeat;
      background-position: center;
      text-align: center;
      transition: opacity 0.2s;
      outline: 0;

      .esri-swipe__handle-icon.esri-icon-drag-vertical {
        display: none;
      }
    }
  }
</style>
