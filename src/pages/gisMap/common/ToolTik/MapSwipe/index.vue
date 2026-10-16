<template>
    <div class="map-swipe-root-container" :id="domId" ref="MapSwiperRootRef">
        <Swipe2D :mapInstance="mapInstance" :defaultLayer="defaultLayer" :layerTreeData="layerTreeData" @onClose="onCloseHandle" />
    </div>
</template>

<script setup>
import { defineProps, toRefs, useSlots, ref, toRaw, onMounted } from 'vue';
import Swipe2D from './Swipe2D/index.vue'

const props = defineProps({
    mapInstance: { type: Object, default: () => ({}) },
    domId: { type: String, default: 'MapSwiperRootContainer' }
});

const { mapInstance: MapIns, domId } = toRefs(props);

const emits = defineEmits([
    "onClick",
    "onComplete",
    "onRemove",
    "onClose"
]);

const MapSwiperRootRef = ref(null)
const mapInstance = toRaw(MapIns.value)
const slots = useSlots()
const mapLoading = ref(true)
const isStart = ref(false)
const parentNode = ref(MapIns?.value?.config?.widgets?.toolKit?.swipe?.container || document.getElementById('ArcgisMapContainer'))
const defaultLayer = ref(MapIns?.value?.LayerControl?.controlList || [])
const layerTreeData = ref(MapIns?.value?.config?.widgets?.toolKit?.swipe?.layerData || [])
const onCloseHandle = (e) => {
    const swipeDom = document.getElementById(domId.value);
    if (parentNode.value && MapSwiperRootRef.value) {
        // parentNode.value.removeChild(MapSwiperRootRef.value);
        // swipeDom.remove();
    }
    parentNode.value = undefined;
    emits('onClose')
}

const initData = () => {
    if (parentNode.value && MapSwiperRootRef.value) {
        parentNode.value.appendChild(MapSwiperRootRef.value)
    }
    isStart.value = true
}

onMounted(() => {
    initData()
})

defineExpose({
});

</script>
<style lang="less" scoped>
@import './index.less';
</style>