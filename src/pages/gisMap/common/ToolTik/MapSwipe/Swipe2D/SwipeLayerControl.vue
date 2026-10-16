<template>
    <div class="swipe-layer-control-wrap">
        <div :class="['expand-btn-wrap', position === 'RIGHT' && 'right-col-btn']" v-if="!expand"
            @click="onExpandHandle">
            <el-icon :color="'#2f3033'" :size="16" title="展开">
                <Fold v-if="position === 'RIGHT'" />
                <Expand v-if="position === 'LEFT'" />
            </el-icon>
        </div>
        <div class="layer-title">
            <div class="left-name">{{ position ? position === 'LEFT' ? '左侧图层' : '右侧图层' : '图层' }}</div>
            <div class="select-label">
                已选<span style="color: #17181A; margin: 0 3px"> {{ checkKeys.length }} </span> / {{ listData.length }}
                <div class="colspan-btn" @click="onExpandHandle">
                    <el-icon :size="16" :color="'#2f3033'" v-if="position === 'LEFT'">
                        <Fold v-if="expand" />
                        <Expand v-if="!expand" />
                    </el-icon>
                    <el-icon :size="16" :color="'#2f3033'" v-if="position === 'RIGHT'">
                        <Fold v-if="!expand" />
                        <Expand v-if="expand" />
                    </el-icon>
                </div>
            </div>
        </div>
        <div class="layer-content">
            <el-scrollbar max-height="300px">
                <div class="layer-list-wrap">
                    <VueDraggable v-if="listData?.length > 0" :model-value="listData" :animation="150" handle=".handle" @update="onUpdate">
                        <template v-for="(item, index) in listData" :key="item.id">
                            <SortItem :data="item" :position="position" :checkKeys="checkKeys" :index="index"
                                :is-expand="true"  @onCheckChange="onCheckChangeHandle" @onOpacity="onOpacityChange" @onLocation="onLocation" @onRemove="onRemove"/>
                        </template>
                    </VueDraggable>
                    <div class="empty-warp" v-if="listData?.length === 0">
                        <el-empty :image-size="80" description="暂无数据" />
                    </div>
                </div>
            </el-scrollbar>
        </div>
    </div>
</template>

<script setup lang="ts">
import { defineProps, toRefs, ref, toRaw, watch } from 'vue';
import { cloneDeep } from 'lodash-es'
import type { ArcgisMapType } from '../../../core/createMap';
import { VueDraggable } from 'vue-draggable-plus';
import SortItem from "../SwipeSortItem.vue";

interface ControlProps {
    mapInstance: ArcgisMapType;
    list: any;
    checkData: any;
    showOpacity?: boolean;
    expand?: boolean;
    position?: string,
}



const props = withDefaults(defineProps<ControlProps>(), {
});

const { mapInstance: MapIns, list, checkData, showOpacity, expand, position } = toRefs(props);

const emits = defineEmits<{
    (e: "onDragEnd", data: any): void;
    (e: "onExpand", status: boolean, postion: string): void;
    (e: "onRemove", data: any): void;
    (e: "onLocation", data: any): void;
    (e: "onCheckChange", data: any, isChecked: boolean): void;
    (e: "onOpacity", opacity: number, data: any): void; // 透明度改变
}>();


const checkKeys = ref<any>([])
const listData = ref<any>([list])


const onOpacityChange = (val:number, data: any) => {
    emits("onOpacity", val, data);
}

const onCheckChangeHandle = (data: any, checked: boolean) => {
    emits('onCheckChange', data, checked)
}

const onRemove = (data: any) => {
    emits('onRemove', data)
}

const onLocation = (data: any) => {
    emits('onLocation', data)
}

const onExpandHandle = () => {
    emits('onExpand', !expand.value, position.value || "LEFT")
}

const onUpdate = (e: any) => {
    const _oldList: any = cloneDeep(listData.value)
    const movedItem = _oldList.splice(e.oldIndex, 1)[0];
    _oldList.splice(e.newIndex, 0, movedItem);
    emits('onDragEnd', _oldList)
}


// 监听数据变化
watch(
  () => checkData?.value,
  (newValue: any) => {
    let arr: any = []
    checkData && newValue.length && newValue.map((c: any) => {
      arr.push(c.serverId)
    })
    checkKeys.value = [...arr]
    // console.log(checkKeys.value)
  },
)

// 监听数据变化
watch(
  () => list?.value,
  (newValue: any) => {
    listData.value = cloneDeep(newValue?.length ? [...newValue] : [])
  },
)

defineExpose({
});

</script>
<style lang="less" scoped>
@import '../index.less';
</style>
