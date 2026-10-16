<template>
  <div>
    <span
      class="tool-item map-tag"
      @click="
        (event) => {
          onSign(event);
        }
      "
    >
      <com-icon name="gongju_biaoji" v-if="!slots.icon" />
      <slot name="icon" v-if="slots.icon"></slot>
      <div class="tool-name" v-if="!slots.title">{{ title }}</div>
      <slot name="title" v-if="slots.title"></slot>
    </span>
    <div
      class="tag-container-wrap"
      v-if="showPanel"
      :style="{ height: `calc(100vh - ${disTop + 16}px)` }"
    >
      <div class="tag-title-wrap">
        <span>{{ title }}</span>
        <span class="tag-close" @click.stop="onClosePanel">
          <el-icon :size="18">
            <Close />
          </el-icon>
        </span>
      </div>
      <div class="marker-handle">
        <el-button type="primary" style="width: 50%">
          <MeasurePoint
            ref="PointRef"
            v-if="MapIns"
            :mapInstance="MapIns"
            :isSingle="true"
            :isDrawToMap="false"
            :symbol="{
              point: {
                color: '#11F5FF',
                size: 12,
                outlineColor: '#fff',
                outlineWidth: 1,
                outlineStyle: 'solid',
              },
            }"
            :style="{ width: '100%', background: 'transparent' }"
            :title="'添加标记'"
            :tipText="'单击标记位置，右键结束'"
            @onComplete="onComplete"
            @onRemove="onRemove"
            @on-cancel="onCancel"
          >
            <template #icon>
              <el-icon>
                <Plus />
              </el-icon>
            </template>
          </MeasurePoint>
          <!-- <el-icon>
                        <Plus />
                    </el-icon>
                    <span>添加标记</span> -->
        </el-button>
        <el-button
          type="danger"
          plain
          :disabled="!checkedKeys?.length"
          style="width: 50%"
          @click.stop="onClearAllMarker"
        >
          <el-icon>
            <Delete />
          </el-icon>
          <span>清空标记</span>
        </el-button>
      </div>
      <div class="marker-content-wrap" v-loading.lock="queryLoading">
        <el-scrollbar height="100%">
          <div class="marker-list">
            <div class="list-item is-header">
              <div class="marker-label">我的标记</div>
              <div class="marker-action">操作</div>
            </div>
            <div class="list-item" v-for="(item, index) in markerList" :key="item.id">
              <div class="marker-label">
                <el-checkbox
                  :model-value="true"
                  v-if="checkedKeys.includes(item.id)"
                  label=""
                  size="large"
                  @change="
                    (e) => {
                      onAddOrMoveMarkHandle(item, false);
                    }
                  "
                />
                <el-checkbox
                  :model-value="false"
                  v-if="!checkedKeys.includes(item.id)"
                  label=""
                  size="large"
                  @change="
                    (e) => {
                      onAddOrMoveMarkHandle(item, true);
                    }
                  "
                />
                <span class="marker-name" :title="item.labelName">{{ item.labelName }}</span>
              </div>
              <div class="marker-action">
                <com-icon
                  :color="'#409eff'"
                  :size="16"
                  name="dingwei"
                  title="定位"
                  @click.stop="onAddOrMoveMarkHandle(item, true)"
                />
                <el-divider direction="vertical" />
                <com-icon
                  :color="'rgb(245 108 108)'"
                  :size="16"
                  name="shanchu"
                  title="删除"
                  @click.stop="onRemoveMarkHandle(item, 1)"
                />
              </div>
            </div>
          </div>
        </el-scrollbar>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, toRefs, h, useSlots, onMounted, toRaw, onUnmounted } from 'vue';
  import { isEmpty, cloneDeep } from 'lodash-es';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import MeasurePoint from '../Measure/Point.vue';
  import { Graphic, GraphicsLayer, watchUtils } from '../../modules';
  import { MarkerIconImage } from './_Data.js';
  import { CreateLabel2D, CreateLabelForThreeD, GetScreenPoint } from '../Draw/utils.js';
  import PointEdit from './PointEdit.vue';

  defineOptions({
    name: 'com-map-tag',
  });

  let MapDragEvent = null;
  let MapScaleEvent = null;
  let MapResizeEvent = null;
  let MapCenterEvent = null;
  const GraphicLayerId = [];
  let graphicsLayer = null;
  let pointEditTooltip = null;

  const props = defineProps({
    mapInstance: { type: Object, default: () => ({}) },
    title: { type: String, default: '标记' },
  });
  const slots = useSlots();
  const { mapInstance: MapIns } = toRefs(props);

  const emits = defineEmits(['update:expandStatus']);

  const MapInstance = toRaw(MapIns.value);
  const SignAttributes = MapInstance?.config?.widgets?.toolKit?.sign;
  let MapViewClickHandle = null;
  const queryLoading = ref(false);
  const showPanel = ref(false);
  const disTop = ref(52);
  const currentMapMode = ref(MapInstance?.MapView?.type === '3d' ? '3D' : '2D');
  const markerList = ref([]);
  const checkedList = ref([]);
  const checkedKeys = ref([]);
  const editPointModalData = ref(undefined);

  const onQueyList = () => {
    if (!SignAttributes?.onQuery) return;
    queryLoading.value = true;
    SignAttributes?.onQuery()
      .then((res) => {
        markerList.value = res?.data?.data || [];
        queryLoading.value = false;
      })
      .catch(() => {
        queryLoading.value = false;
      });
  };

  const onSign = (event) => {
    showPanel.value = true;
    onQueyList();
    setEventHandle();
  };

  const onClosePanel = () => {
    onDestroyMapviewEvent();
    showPanel.value = false;
    onClearAllMarker();
  };

  // 创建 GraphicLayer
  const createGraphicLayer = (graphics) => {
    graphicsLayer = new GraphicsLayer({
      graphics,
    });
    return graphicsLayer;
  };

  const onComplete = (data) => {
    if (data?.points?.length > 0) {
      const newObj = {
        name: '我的标记',
        iconIndex: '1',
        key: '',
        id: '',
      };
      const x = data?.points?.[0]?.[0];
      const y = data?.points?.[0]?.[1];
      if (x && y) {
        MapInstance?.MapView.goTo({ center: [x, y] }).then(() => {
          onEditMarkerByModal(newObj, { x: data?.points?.[0]?.[0], y: data?.points?.[0]?.[1] });
        });
      }
      setTimeout(() => {}, 0);
    }
  };

  const onRemove = () => {};

  const onCancel = () => {};

  //清空地图上的标记
  const onClearAllMarker = () => {
    destroyEditModal();
    const _allChecked = cloneDeep(checkedList.value);
    _allChecked?.length > 0 &&
      _allChecked?.map((s) => {
        onAddOrMoveMarkHandle(s, false);
      });
  };

  /**
   * @Title: 删除标记
   * @type: 删除类型 1: 从历史记录中删除 2: 从地图中删除
   */
  const onRemoveMarkHandle = (data, type) => {
    destroyEditModal();
    if (type === 1) {
      ElMessageBox.confirm('确定后该标记将会从历史标记中移除', '您是否确定要删除该条标记?', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          onAddOrMoveMarkHandle(data, false);
          SignAttributes?.onDelete(data?.id)
            .then((res) => {
              if (res?.code === 200 && res?.success) {
                onQueyList();
                ElMessage.success('操作成功');
              } else {
                ElMessage.error(res?.message);
              }
            })
            .catch((err) => {
              ElMessage.error(err);
            });
        })
        .catch(() => {});
    } else {
      onAddOrMoveMarkHandle(data, false);
    }
  };

  /**
   * @Title: 添加标记点至图层或移除标记点
   */
  const onAddOrMoveMarkHandle = (data, isCheck) => {
    const _oldSelectKeys = cloneDeep(checkedKeys.value);
    const _oldSelectList = cloneDeep(checkedList.value);
    const index = _oldSelectKeys.indexOf(data.id);
    if (isCheck) {
      if (index === -1) {
        _oldSelectKeys.push(data.id);
        _oldSelectList.push(data);
        addMarkerToMap(data);
      } else {
        addMarkerToMap(data);
      }
    } else {
      if (index > -1) {
        _oldSelectKeys.splice(index, 1);
        _oldSelectList.splice(index, 1);
      }
      removeMarkerFromMap(data?.id);
    }
    checkedKeys.value = [..._oldSelectKeys];
    checkedList.value = [..._oldSelectList];
  };

  const addMarkerToMap = (d) => {
    const layers = MapInstance?.Map.layers.items;
    const {
      id,
      labelIcon,
      labelName,
      labelPoints: { x, y },
    } = d;
    if (layers && layers.length) {
      const existLayer = layers.filter((layer) => layer.isKey === id)[0];
      if (existLayer) {
        MapInstance?.MapView.goTo({ center: [x, y], zoom: 12 });
        return;
      }
    }
    const markerObj = MarkerIconImage?.find((f) => f?.value === labelIcon);
    const symbol =
      currentMapMode.value === '3D'
        ? {
            type: 'point-3d',
            symbolLayers: [
              {
                anchor: 'relative',
                anchorPosition: { x: 0, y: 0.7 },
                type: 'icon',
                size: 18,
                resource: { href: markerObj?.href || MarkerIconImage?.[0]?.href },
              },
            ],
          }
        : {
            type: 'picture-marker',
            url: markerObj?.href || MarkerIconImage?.[0]?.href,
            width: '18px',
            height: '24px',
          };
    // 点图片
    const pointGraphic = new Graphic({
      geometry: {
        type: 'point',
        x,
        y,
        spatialReference: MapInstance?.MapView.spatialReference,
      },
      symbol,
    });
    const [RectGraphic, LabelGraphic] =
      currentMapMode.value === '3D'
        ? CreateLabelForThreeD({
            coordinates: { x, y },
            text: labelName,
            MapInstance,
            textColor: 'white',
            onClick: () =>
              onEditMarkerByModal({ name: labelName, iconIndex: labelIcon, key: id }, { x, y }),
          })
        : CreateLabel2D({
            coordinates: { x, y },
            text: labelName,
            MapInstance,
            hasRemove: false,
            onClick: () => {
              onEditMarkerByModal(
                { name: labelName, iconIndex: labelIcon, key: id, id: id },
                { x, y }
              );
            },
          });
    const addGraphic =
      currentMapMode.value === '3D'
        ? [pointGraphic, LabelGraphic]
        : [pointGraphic, RectGraphic, LabelGraphic];
    const graphicLayer = createGraphicLayer(addGraphic);
    GraphicLayerId.push(id);
    graphicLayer.isKey = id;
    MapInstance?.Map.add(graphicLayer);
    MapInstance?.MapView.goTo({ center: [x, y], zoom: 12 }).then(() => {});
  };

  const removeMarkerFromMap = (key, type) => {
    const layers = MapInstance?.Map.layers.items;
    if (layers && layers.length) {
      layers.map((layer) => {
        if (layer.isKey === key) {
          MapInstance?.Map.remove(layer);
          if (GraphicLayerId.length > 0) {
            const index = GraphicLayerId.findIndex((d) => d === key);
            index > -1 && GraphicLayerId.splice(index, 1);
          }
        }
      });
    }
  };

  //点击弹框的更新或保存按钮操作
  const onModalSave = (props) => {
    destroyEditModal();
    const { name, iconIndex, coordinates } = props;
    const idKey = props?.id || props?.key;
    const markData = {
      id: idKey,
      labelName: name,
      labelIcon: iconIndex,
      labelPoints: JSON.stringify(coordinates),
    };
    SignAttributes?.onSave(markData)
      .then((res) => {
        if (res?.success && res?.code === 200) {
          const newData = {
            ...res?.data,
            labelPoints: coordinates,
          };
          if (!idKey) {
            onAddOrMoveMarkHandle(newData, true);
          } else {
            removeMarkerFromMap(idKey);
            setTimeout(() => {
              onAddOrMoveMarkHandle(newData, true);
            }, 100);
          }
          onQueyList();
        } else {
          ElMessage.error(res?.message || '操作失败');
        }
      })
      .catch(() => {});
  };

  //更新地图上的标记点
  const upDateMarkerOnMap = (data) => {
    removeMarkerFromMap(data?.id);
  };

  //地图弹框出来编辑标记内容
  const onEditMarkerByModal = (data, coordinates) => {
    const idKey = data?.id || data?.key;
    const oldIdKey = editPointModalData?.value?.id || editPointModalData?.value?.key;
    if (idKey === oldIdKey) return;
    if (!pointEditTooltip)
      pointEditTooltip = MapInstance?.createTooltip({
        className: 'point-edit-tooltip',
        autoClose: true,
        minusNumber: 6,
        closeCallBack: () => destroyEditModal(),
      });
    const { x, y } = coordinates;
    const screenPoint = GetScreenPoint({ longitude: x, latitude: y }, MapInstance);
    const pointData = {
      ...data,
      coordinates,
      screenPoint,
    };
    editPointModalData.value = { ...pointData };
    // <PointEdit
    //         data={pointData}
    //         onSave={(data: any) => { onModalSave(data) }}
    //         onRemove={(data: any, type: number) => { onRemoveMarkHandle(data, type) }}
    //     />
    pointEditTooltip.show(
      screenPoint,
      h(PointEdit, { data: pointData, onSave: onModalSave, onRemove: onRemoveMarkHandle }),
      false
    );
  };

  // 销毁编辑框
  const destroyEditModal = () => {
    if (pointEditTooltip) {
      pointEditTooltip.destroy();
      pointEditTooltip = null;
    }
    editPointModalData.value = undefined;
  };

  const getDisTopOffset = () => {
    // 获取元素
    const element = document.getElementById('ArcgisToolWarp');
    // 获取元素的边界信息
    const rect = element.getBoundingClientRect();
    // 计算元素与浏览器上边的距离
    disTop.value = rect.top + window.scrollY;
  };

  const onDestroyMapviewEvent = () => {
    if (MapDragEvent) {
      MapDragEvent?.remove();
      MapDragEvent = null;
    }
    if (MapResizeEvent) {
      MapResizeEvent?.remove();
      MapResizeEvent = null;
    }
    if (MapScaleEvent) {
      MapScaleEvent?.remove();
      MapScaleEvent = null;
    }
    if (MapCenterEvent) {
      MapCenterEvent?.remove();
      MapCenterEvent = null;
    }
  };

  const setEventHandle = () => {
    // 监听地图拖动事件
    MapDragEvent = MapInstance?.MapView.on('drag', () => {
      updatePointTipPosition();
    });
    // 监听地图尺寸改变事件
    MapResizeEvent = MapInstance?.MapView.on('resize', () => {
      updatePointTipPosition();
    });
    // 监听地图缩放
    MapScaleEvent = watchUtils.watch(MapInstance?.MapView, 'scale', () => {
      updatePointTipPosition();
    });
    // 监听中心点变化
    MapCenterEvent = watchUtils.watch(MapInstance?.MapView, 'center', () => {
      updatePointTipPosition();
    });
  };

  const updatePointTipPosition = () => {
    if (!pointEditTooltip || !editPointModalData.value) return;
    const { x, y } = editPointModalData.value.coordinates;
    const screenPoint = GetScreenPoint({ longitude: x, latitude: y }, MapInstance);
    // <PointEdit
    //         data={editPointModalData.value}
    //         onSave={(data: any) => { onModalSave(data) }}
    //         onRemove={(data: any, type: number) => { onRemoveMarkHandle(data, type) }}
    //     />
    pointEditTooltip.show(
      screenPoint,
      pointEditTooltip.show(
        screenPoint,
        h(PointEdit, {
          data: editPointModalData?.value,
          onSave: onModalSave,
          onRemove: onRemoveMarkHandle,
        }),
        false
      ),
      false
    );
  };

  defineExpose({});

  onMounted(() => {
    getDisTopOffset();
    onQueyList();
    // handle logic when component is mounted
  });

  onUnmounted(() => {
    onDestroyMapviewEvent();
  });
</script>

<style lang="less" scoped>
  @import './index.less';
</style>
