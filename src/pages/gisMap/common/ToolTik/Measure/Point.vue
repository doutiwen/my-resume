<template>
  <span
    class="tool-item measure-point"
    :style="style"
    @click="
      (event) => {
        onPoint(event);
      }
    "
  >
    <com-icon name="dian" v-if="!slots.icon"/>
    <slot name="icon" v-if="slots.icon"></slot>
    <div class="tool-name" v-if="!slots.title">{{ title }}</div>
    <slot name="title" v-if="slots.title"></slot>
  </span>
</template>

<script setup>
import { defineProps, toRefs, useSlots, ref, toRaw } from 'vue';
import { MeasurePointHandle } from '@/components/export';

const props = defineProps({
  title: { type: String, default: '绘制点' },
  isSingle: { type: Boolean, default: false },
  isDrawToMap: { type: Boolean, default: true },
  tipText: { type: String, default: '单击绘制 , 双击或右键结束' },
  mapInstance: { type: Object, default: () => ({}) },
  symbol: { type: Object, default: () => ({}) },
  style: { type: Object, default: () => ({}) },
  hiddenText: { type: Boolean, default: false }
});

const { style, title, mapInstance, symbol, hiddenText } = toRefs(props);

const emits = defineEmits(['onClick', 'onComplete', 'onRemove', 'onCancel']);

const slots = useSlots();
const DrawInstance = ref(null);
const DrawListData = ref([]);

defineOptions({
  name: 'com-measure-point',
});

const onPoint = (event) => {
  event?.stopPropagation();
  emits('onClick', event);
  DrawInstance.value = MeasurePointHandle({
    mapInstance: mapInstance.value,
    symbol: symbol?.value,
    isSingle: props.isSingle,
    isDrawToMap: props.isDrawToMap,
    tipText: props.tipText,
    onComplete: (data) => {
      DrawListData.value.push(DrawInstance.value);
      emits('onComplete', data);
    },
    onRemove: (layerId) => {
      emits('onRemove', layerId);
    },
    onCancel: () => {
      emits('onCancel');
    },
  });
};

const remove = (layerId) => {
  const _old = [...DrawListData.value];
  const newMapIns = toRaw(mapInstance.value);
  const allMapLayers = newMapIns?.Map?.allLayers?.items;
  if (layerId) {
    const index = _old.findIndex((item) => item.layerId === layerId);
    const _layer = allMapLayers?.filter((f) => f?.id === layerId);
    if (index > -1) {
      _old.splice(index, 1);
    }
    _layer &&
      _layer?.length &&
      _layer.map((f) => {
        emits('onRemove', layerId);
        f?.removeAll();
        newMapIns?.Map?.remove(f);
      });
    DrawListData.value = [..._old];
  } else {
    _old.map((o, index) => {
      const _layer = allMapLayers?.filter(
        (f) => f?.id === o?.layerId
      );
      _layer &&
        _layer?.length &&
        _layer.map((f) => {
          f?.removeAll();
          newMapIns?.Map?.remove(f);
        });
    });
    emits('onRemove');
    DrawListData.value = [];
  }
};

defineExpose({
  remove,
});
</script>
<style lang="less">
.measure-point {
  position: relative;
  display: inline-flex;
  cursor: pointer;
  width: inherit;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  background-color: inherit;
  .tool-name {
    font-size: 14px;
    margin-left: 6px;
  }
}
</style>
