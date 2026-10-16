<template>
    <span class="tool-item measure-distance" :style="style" @click="(event) => {onDistance(event)}">
        <com-icon name="gongju_ceju" v-if="!slots.icon" />
        <slot name="icon" v-if="slots.icon"></slot>
        <div class="tool-name" v-if="!slots.title">{{ title }}</div>
        <slot name="title" v-if="slots.title"></slot>
    </span>
</template>

<script setup>
import { defineProps, toRefs, useSlots, ref, toRaw } from 'vue';
import { DistanceHandle } from '@/components/export';

const props = defineProps({
    title: { type: String, default: '测距离' },
    mapInstance: { type: Object, default: () => ({}) },
    symbol: { type: Object, default: () => ({}) },
    style: { type: Object, default: () => ({}) },
    hiddenText: { type: Boolean, default: false }
});

const { style, title, mapInstance, symbol, hiddenText } = toRefs(props);

const emits = defineEmits(['onClick', 'onComplete', 'onRemove', 'onCancel']);

const slots = useSlots()
const DrawInstance = ref(null)
const DrawListData = ref([])

defineOptions({
    name: 'com-measure-distance'
})

const onDistance = (event) => {
    event?.stopPropagation();
    emits("onClick", event)
    DrawInstance.value = DistanceHandle({
        mapInstance: mapInstance.value,
        hiddenText: !!hiddenText?.value,
        symbol: symbol?.value,
        onComplete: (data) => {
            DrawListData.value.push(DrawInstance.value)
            emits("onComplete", data)
        },
        onRemove: (layerId) => {
            emits("onRemove", layerId)
        },
        onCancel: () => {
            emits("onCancel")
        }
    });
}

const remove = (layerId) => {
    const _old = [...DrawListData.value]
    const newMapIns = toRaw(mapInstance.value)
    const allMapLayers = newMapIns?.Map?.allLayers?.items;
    if (layerId) {
        const index = _old.findIndex(item => item.layerId === layerId)

        const _layer = allMapLayers?.filter((f) => f?.id === layerId);
        if (index > -1) {
            _old.splice(index, 1);
        }
        _layer &&
            _layer?.length &&
            _layer.map((f) => {
                emits("onRemove", layerId)
                f?.removeAll();
                newMapIns?.map?.remove(f);
            });
        DrawListData.value = [..._old]
    } else {
        _old.map((o, index) => {
            const _layer = allMapLayers?.filter((f) => f?.id === o?.layerId);
            _layer &&
                _layer?.length &&
                _layer.map((f) => {
                    f?.removeAll();
                    newMapIns?.map?.remove(f);
                });
        })
        emits("onRemove")
        DrawListData.value = []
    }
}

defineExpose({
    remove
});
</script>
<style lang="less">
.measure-distance {
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