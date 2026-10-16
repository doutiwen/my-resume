<template>
  <div
    :class="['arcgis-basemap-container']"
    ref="ArcgisBasemapRef"
    id="ArcgisBasemapWrap"
    :style="style"
    @mouseenter="collapse = false"
    @mouseleave="collapse = true"
  >
    <div
      :class="['base-map-wrap', collapse && 'is-collapse1']"
      v-if="baseMapConfig?.length > 0 && !collapse"
    >
      <div
        :class="['base-map-item', activeType === item.id && 'is-active']"
        v-for="(item, i) in baseMapConfig"
        :key="i"
        @click.stop="
          () => {
            onBaseMapChange(item, layerNoteStatus[item.id]);
          }
        "
      >
        <img :src="item.thumbnail" alt="" />
        <span class="road-network" v-if="item.children && item?.children?.some((d) => d.isNote)">
          <el-checkbox
            style="height: 14px"
            :checked="isEmpty(layerNoteStatus) ? true : (layerNoteStatus[item.id] ?? true)"
            size="small"
            @change="
              (e) => {
                onCheckedHandle(e, item);
              }
            "
          />
          <span class="road-network-text">显示注记</span>
        </span>
        <div
          class="arrow"
          v-if="
            item?.children?.length > 0 &&
            item?.children?.filter((d) => !d.isNote).length > 1 &&
            item?.children?.some((d) => !d.isNote)
          "
        ></div>
        <div
          class="base-map-child"
          v-if="
            item?.children?.length > 0 &&
            item?.children?.filter((d) => !d.isNote).length > 1 &&
            item?.children?.some((d) => !d.isNote)
          "
          :style="getMapChildStyle(item?.children?.filter((d) => !d.isNote).length, i)"
        >
          <div class="base-map-child-content">
            <div
              :class="['base-map-child-item', activeChild === child.id && 'is-active']"
              v-for="(child, j) in item?.children?.filter((d) => !d.isNote)"
              @click.stop="
                () => {
                  onMapChildItemClickHandle(child, item.id);
                }
              "
              :key="child.id"
            >
              <span class="check"></span>
              <span class="child-name" :title="`${child.label}${item.label}`">
                {{ child.label }}{{ item.label }}
              </span>
            </div>
          </div>
        </div>
        <span class="map-type-name">{{ item.label }}</span>
      </div>
    </div>
    <div class="select-wrap" v-if="baseMapConfig?.length && !!selectItem">
      <div class="select-item">
        <img :src="selectItem.thumbnail" alt="" />
        <span class="road-network">
          <el-checkbox
            style="height: 14px"
            v-if="baseStatus"
            :checked="true"
            size="small"
            @change="
              (e) => {
                showBaseMpaChange(e);
              }
            "
          />
          <el-checkbox
            style="height: 14px"
            v-if="!baseStatus"
            :checked="false"
            size="small"
            @change="
              (e) => {
                showBaseMpaChange(e);
              }
            "
          />
          <span class="road-network-text">显示底图</span>
        </span>
        <span class="map-type-name">{{ selectItem.label }}</span>
      </div>
      <div
        class="base-map-shadow"
        v-if="baseMapConfig.length > 0 && collapse"
        v-for="(item, i) in new Array(baseMapConfig.length - 1).fill('')"
        :key="i"
        :style="{
          left: `${0 - (i + 1) * 3}px`,
          height: `${64 - (i + 1) * 2}px`,
          opacity: 0.48 - i * 0.18,
        }"
      ></div>
    </div>
  </div>
</template>

<script setup>
  import { ref, toRefs, watch } from 'vue';
  import { isEmpty } from 'lodash-es';
  import { Basemap } from '../../modules';

  defineOptions({
    name: 'com-basemap-control', // 此时这个组件的名称就是 xxx
  });

  const props = defineProps({
    data: { type: Array, default: () => [] },
    mapInstance: { type: Object, default: () => ({}) },
    activeBaseMap: { type: [String, Number], default: '' },
    baseMapVisible: { type: Boolean, default: true },
    initActiveChild: { type: [String, Number], default: '' },
    noteStatus: { type: Object, default: () => ({}) },
    style: { type: Object, default: () => ({}) },
  });
  const emits = defineEmits(['onChangeData']);

  const { data, mapInstance, activeBaseMap, baseMapVisible, initActiveChild, noteStatus, style } =
    toRefs(props);

  const ArcgisBasemapRef = ref();
  const baseMapConfig = ref(data.value);
  const currentMapMode = ref(mapInstance.value?.MapView?.type === '2d' ? '2D' : '3D');
  const collapse = ref(true);
  const activeType = ref(activeBaseMap.value);
  const selectItem = ref();
  const baseStatus = ref(!baseMapVisible.value);
  const activeChild = ref(initActiveChild.value);
  const layerNoteStatus = ref(noteStatus.value ?? {});
  /**
   * @Title: 获取底图 Layer
   */
  const getBaseLayersHandle = (baseLayer, showNote) => {
    const baseMapLayers = [];
    const { id, type, url, children } = baseLayer;
    // 底图
    if (type && url) {
      baseMapLayers.push({ id, type, url, groupType: 'BaseLayer' });
    }
    if ((!children || !children.length) && baseLayer?.fid && baseLayer?.fid !== '0') {
      const parentLayer = baseMapConfig.value.find((d) => d?.id === baseLayer?.fid);
      if (parentLayer?.children?.length > 0) {
        const noteLayers = parentLayer?.children.filter((d) => d.isNote);
        if (noteLayers?.length) {
          noteLayers.forEach((d) => {
            baseMapLayers.push({ id: d.id, type: d.type, url: d.url, groupType: 'TopLayer' });
          });
        }
      }
    }
    // 注记层
    if (children && children.length) {
      const noteLayers = children.filter((d) => d.isNote);
      if (noteLayers?.length) {
        noteLayers.forEach((d) => {
          baseMapLayers.push({ id: d.id, type: d.type, url: d.url, groupType: 'TopLayer' });
        });
      }
    }
    return new Promise((resolve) => {
      return Promise.all(
        baseMapLayers.map(async (layer) => {
          const layerItem = await mapInstance?.value?.loadMapLayer({
            type: layer.type,
            url: layer.url,
          });
          layerItem.set({ groupType: layer.groupType, dataId: layer.id, visible: baseStatus });
          if (layer.groupType === 'TopLayer' && !showNote) layerItem.visible = false;
          return layerItem;
        })
      ).then((layers) => {
        resolve(layers);
      });
    });
  };

  const showBaseMpaChange = (isChecked, data) => {
    try {
      baseStatus.value = isChecked;
      const currentData = data || selectItem.value;
      const baseLayers = mapInstance.value.Map.allLayers.filter((d) => d.groupType === 'BaseLayer');
      const currentTopLayers = mapInstance?.value?.Map?.allLayers?.filter(
        (d) => d.groupType === 'TopLayer' && !d?.isRegionQueryLayer
      );
      if (isChecked) {
        baseLayers &&
          baseLayers?.items?.length &&
          baseLayers.map((m) => {
            m.visible = true;
          });
        currentTopLayers &&
          currentTopLayers?.items?.length &&
          currentTopLayers.map((t) => {
            t.visible =
              isEmpty(layerNoteStatus.value) || !currentData
                ? true
                : (layerNoteStatus?.value?.[currentData?.id] ?? true);
          });
      } else {
        baseLayers &&
          baseLayers?.items?.length &&
          baseLayers.map((m) => {
            m.visible = false;
          });
        currentTopLayers &&
          currentTopLayers?.items?.length &&
          currentTopLayers.map((t) => {
            t.visible = false;
          });
      }
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * @Title: 文件夹下子图层点击切换
   */
  const onMapChildItemClickHandle = (layer, parentId) => {
    (async () => {
      // 移除之前的顶层 ( TopLayer )
      if (activeType.value !== parentId) {
        const currentTopLayers = mapInstance.value.Map.allLayers.filter(
          (d) => d.groupType === 'TopLayer' && !d?.isRegionQueryLayer
        );
        mapInstance.value.Map.removeMany(currentTopLayers);
      }
      const isChecked = isEmpty(layerNoteStatus?.value)
        ? true
        : (layerNoteStatus?.value?.[parentId] ?? true);
      const baseMapLayers = await getBaseLayersHandle(layer, isChecked);
      const baseLayers = baseMapLayers.filter((d) => d.groupType === 'BaseLayer');
      const topLayers = baseMapLayers.filter((d) => d.groupType === 'TopLayer');
      if (currentMapMode.value === '3D') {
        const baseMapQQYXLayer = mapInstance.value.Map.basemap?.baseLayers?.items?.filter(
          (f) => f?.isQQYXLayer
        );
        mapInstance.value.Map.basemap = new Basemap({
          id: 'basemap',
          baseLayers: [...baseMapQQYXLayer, ...baseLayers],
        });
      } else {
        mapInstance.value.Map.basemap = new Basemap({
          id: 'basemap',
          baseLayers,
        });
      }
      if (topLayers && topLayers.length && activeType.value !== parentId) {
        mapInstance.value.Map.addMany(topLayers);
      }
      activeType.value = parentId;
      activeChild.value = layer.id;
      selectItem.value = baseMapConfig.value.find((d) => d.id === parentId);
      setTimeout(() => {
        showBaseMpaChange(!baseStatus.value ? true : baseStatus.value);
      }, 10);
    })();
  };
  /**
   * @title: 显示路网
   * @param {any} e
   * @param {any} layer
   */
  const onCheckedHandle = async (isChecked, layer) => {
    layerNoteStatus.value = { [layer.id]: isChecked };
    // if (onNoteChange) onNoteChange({ [layer.id]: isChecked })
    if (activeType.value !== layer.id) {
      onBaseMapChange(layer, isChecked);
    } else {
      const noteLayerIds = layer.children.filter((d) => d.isNote).map((v) => v.id);
      activeType.value = layer?.id;
      if (noteLayerIds.length) {
        noteLayerIds.forEach((item) => {
          mapInstance.value.Map.allLayers.find((d) => d.dataId === item).visible = isChecked
            ? baseStatus.value
            : isChecked;
        });
      }
    }
  };

  /**
   * @title: 底图切换
   */
  const onBaseMapChange = (layer, showNote, isGroup) => {
    if (layer?.fid === '0' || (!layer?.fid && layer?.children?.length)) {
      selectItem.value = layer;
    }
    (async () => {
      if (layer.id === 'threeMap') {
        // if (onActiveChange) onActiveChange('')
        // if (onChangeMode) {
        //   onChangeMode()
        // } else {

        // }
        mapInstance.value?.BaseMapIns?.updateMode();
      } else {
        // if (onActiveChange) onActiveChange(layer.id)
        const noteStatus = typeof showNote === 'undefined' ? true : showNote;
        // 移除之前的顶层 ( TopLayer )
        if (activeType.value !== layer.id) {
          const currentTopLayers = mapInstance.value.Map.allLayers.filter(
            (d) => d.groupType === 'TopLayer' && !d?.isRegionQueryLayer
          );
          mapInstance.value.Map.removeMany(currentTopLayers);
        }
        // 非文件夹
        if (layer.type && layer.url) {
          if (activeType.value === layer.id) return;
          activeType.value = layer.id;
          if (!isGroup) activeChild.value = undefined;
          const baseMapLayers = await getBaseLayersHandle(layer, noteStatus);
          const baseLayers = baseMapLayers.filter((d) => d.groupType === 'BaseLayer');
          const topLayers = baseMapLayers.filter((d) => d.groupType === 'TopLayer');
          if (currentMapMode.value === '3D') {
            const baseMapQQYXLayer = mapInstance.value.Map.basemap?.baseLayers?.items?.filter(
              (f) => f?.isQQYXLayer
            );
            mapInstance.value.Map.basemap = new Basemap({
              id: 'basemap',
              baseLayers: [...baseMapQQYXLayer, ...baseLayers],
            });
          } else {
            mapInstance.value.Map.basemap = new Basemap({
              id: 'basemap',
              baseLayers,
            });
          }

          if (topLayers && topLayers.length) {
            mapInstance.value.Map.addMany(topLayers);
          }
          setTimeout(() => {
            showBaseMpaChange(!baseStatus.value ? true : baseStatus.value, layer);
          }, 10);
        } else {
          if (activeType.value === layer.id) return;
          const { children } = layer;
          if (children && children.length) {
            const activeItem = children.filter((d) => !d.isNote)[0];
            activeChild.value = activeItem.id;
            onBaseMapChange(
              {
                ...activeItem,
                id: layer.id,
                children: children.filter((d) => d.isNote),
              },
              noteStatus,
              true
            );
          }
        }
      }
    })();
  };

  const onChangeBaseMapConfigData = (data, type) => {
    mapInstance.value.BaseMapIns?.onChangeData(data, type);
  };

  /**
   * @Title: 获取子图层容器 Style 样式
   */
  const getMapChildStyle = (count, index) => {
    const rowCount = Math.ceil(count / 3);
    const height = rowCount * 24 + (rowCount - 1) * 12 + 24;
    const width = count < 3 ? count * 100 + 28 + (count - 1) * 12 : 352;
    let rightOffset = 'unset';
    let leftOffset = -10;
    if (index === baseMapConfig?.value?.length - 2) {
      rightOffset = -142;
      leftOffset = 'unset';
    }
    if (index === baseMapConfig?.value?.length - 1) {
      rightOffset = -66;
      leftOffset = 'unset';
    }
    return {
      top: `${-(Math.ceil(count / 3) * 24 + 12 * (Math.ceil(count / 3) + 1) + 24)}px`,
      // height: height > 139? 139 : height + 26,
      height: `${height + 26}px`,
      width: `${width}px`,
      left: leftOffset === 'unset' ? 'unset' : `${leftOffset}px`,
      right: rightOffset === 'unset' ? 'unset' : `${rightOffset}px`,
    };
  };
  // 监听数据变化
  watch(
    () => baseMapConfig?.value,
    (newValue) => {
      if (newValue?.length && !activeBaseMap?.value) {
        const currentActiveData = newValue.find((d) => d.isDefault) || newValue[0];
        const { id, type, url, children } = currentActiveData;
        activeType.value = id;
        selectItem.value = currentActiveData;
        if (!type && !url && children?.length && children.some((d) => !d.isNote)) {
          let childActiveData;
          const currentActiveCd = activeChild.value;
          if (currentActiveCd) {
            childActiveData = children?.filter((c) => c?.id === currentActiveCd)?.[0];
          }
          activeChild.value =
            currentActiveCd && childActiveData?.length > 0
              ? currentActiveCd
              : children.find((d) => !d.isNote)?.id;
        }
      } else if (newValue?.length && activeBaseMap?.value) {
        activeType.value = activeBaseMap.value;
        const currentActiveData = newValue.find((d) => d.id === activeBaseMap.value);
        selectItem.value = currentActiveData;
        if (currentActiveData) {
          const { type, url, children } = currentActiveData;
          if (!type && !url && children?.length && children.some((d) => !d.isNote)) {
            let childActiveData;
            const currentActiveCd = activeChild.value;
            if (currentActiveCd) {
              childActiveData = children?.filter((c) => c?.id === currentActiveCd)?.[0];
            }
            // 文件夹 , 取第一个服务图层为默认值
            activeChild.value =
              currentActiveCd && childActiveData?.length > 0
                ? currentActiveCd
                : children.find((d) => !d.isNote)?.id;
          }
        }
      }
    },
    { immediate: true }
  );

  // 监听数据变化
  watch(
    () => activeChild?.value,
    (newValue) => {
      onChangeBaseMapConfigData(newValue, 'activeChild');
      emits('onChangeData', newValue, 'activeChild');
    }
  );

  // 监听数据变化
  watch(
    () => layerNoteStatus?.value,
    (newValue) => {
      onChangeBaseMapConfigData(newValue, 'noteStatus');
      emits('onChangeData', newValue, 'noteStatus');
    }
  );
  // 监听数据变化
  watch(
    () => baseStatus?.value,
    (newValue) => {
      onChangeBaseMapConfigData(newValue, 'baseMapVisible');
      emits('onChangeData', newValue, 'baseMapVisible');
    }
  );

  // 监听数据变化
  watch(
    () => activeType?.value,
    (newValue) => {
      onChangeBaseMapConfigData(newValue, 'activeBaseMap');
      emits('onChangeData', newValue, 'activeBaseMap');
    },
    { immediate: true }
  );
</script>

<style lang="less" scoped>
  .arcgis-basemap-container {
    position: relative;
    z-index: 9;
    display: flex;
    align-items: center;
    height: 70px;
    margin-top: 10px;

    .base-map-wrap {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 8px 10px;
      background: #fff;
      box-shadow: 0px 4px 12px 2px rgba(0, 0, 0, 0.04);
      box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.06);

      &.is-collapse {
        box-shadow: none;

        .base-map-item {
          display: none;

          &.is-active {
            display: block;
            margin-left: 0;
          }
        }
      }

      .base-map-item {
        position: relative;
        width: 74px;
        height: 54px;
        cursor: pointer;
        z-index: 1;
        background: #fff;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

        & + .base-map-item {
          margin-left: 6px;
        }

        &.is-active {
          & > .map-type-name {
            color: #fff;
            background: #409eff;
          }
        }

        &:hover {
          border-color: #409eff;

          .road-network {
            display: inline-flex;
          }

          .base-map-child {
            display: block;
          }

          .arrow {
            display: block;
          }
        }

        .arrow {
          display: none;
          position: absolute;
          top: -25px;
          z-index: 9;
          left: calc(50% - (11px / 2) - 14px);
          border-top: solid 11px #fff;
          border-left: solid 11px transparent;
          border-right: solid 11px transparent;
          border-bottom: solid 11px transparent;
          box-shadow: 0px 4px 12px 2px rgba(0, 0, 0, 0.04);
          box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.06);
        }

        .base-map-child {
          display: none;
          position: absolute;
          left: -10px;
          max-width: 352px;
          padding-bottom: 25px;
          cursor: default;

          .base-map-child-content {
            display: grid;
            grid-template-columns: repeat(3, 100px);
            grid-column-gap: 12px;
            grid-row-gap: 12px;
            padding: 12px 14px;
            background: #fff;
            box-shadow: 0px 4px 12px 2px rgba(0, 0, 0, 0.04);
            box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.06);

            .base-map-child-item {
              position: relative;
              border: 1px solid #e6e6e6;
              width: 100px;
              height: 24px;
              padding: 5px 8px;
              display: flex;
              align-items: center;
              cursor: pointer;

              .check {
                display: flex;
                justify-content: center;
                align-items: center;
                position: relative;
                width: 14px;
                height: 14px;
                border-radius: 7px;
                border: solid 1px #b8b8b8;
                margin-right: 5px;
              }

              .child-name {
                display: inline-block;
                font-size: 12px;
                color: #5e6166;
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;
              }

              &:hover {
                border-color: #409eff;
              }

              &.is-active {
                background: #409eff;

                .check::before {
                  content: '';
                  width: 8px;
                  height: 8px;
                  border-radius: 4px;
                  background: #fff;
                }

                .child-name {
                  color: #fff;
                }
              }

              .map-type-name {
                display: inline-flex;
                right: 0;
                align-items: center;
                justify-content: center;
              }
            }
          }
        }

        img {
          width: 100%;
          height: 100%;
        }

        .map-type-name {
          display: inline-block;
          position: absolute;
          right: 0;
          bottom: 0;
          padding: 3px 4px;
          color: #fff;
          font-size: 12px;
          line-height: 12px;
          background: rgba(0, 0, 0, 0.7);
        }
      }
    }

    .select-wrap {
      position: relative;
      display: flex;
      align-items: center;
      margin-left: 8px;
      width: 86px;
      height: 64px;

      .select-item {
        position: relative;
        width: 86px;
        height: 64px;
        cursor: pointer;
        z-index: 1;
        background: #fff;

        img {
          width: 100%;
        }

        .map-type-name {
          display: inline-block;
          position: absolute;
          right: 0;
          bottom: 0;
          padding: 3px 4px;
          color: #fff;
          font-size: 12px;
          line-height: 12px;
          background: rgba(0, 0, 0, 0.7);
        }

        .road-network {
          display: inline-flex;
        }
      }

      .base-map-shadow {
        position: absolute;
        width: 3px;
        height: 64px;
        background: #181c29;
      }

      &:hover {
        .select-item {
          .map-type-name {
            background: #409eff;
          }
        }
      }
    }

    .road-network {
      display: none;
      position: absolute;
      left: 0;
      right: 0;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      padding: 3px 0;
      background: rgba(0, 0, 0, 0.7);

      .road-network-text {
        color: #fff;
        font-size: 12px;
        line-height: 12px;
        margin-left: 6px;
      }
    }
  }
</style>
