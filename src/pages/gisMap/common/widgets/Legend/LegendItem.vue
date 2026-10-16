<template>
    <div :class="['legendItem', isPrint && 'isPrint']">
        <div class="layerName">{{ data.layerName }}</div>
        <div class="list">
            <div v-for="(item, index) in data.legend" :key="index" class="item">
                <el-checkbox v-if="showCheck && item?.id && legendSelectedKeys?.includes(item?.id)" :model-value="true"
                    :style="{ marginRight: '8px' }" @change="(e) => onHandleCheck(e, item)"></el-checkbox>
                <el-checkbox v-if="showCheck && item?.id && !legendSelectedKeys?.includes(item?.id)"
                    :model-value="false" :style="{ marginRight: '8px' }"
                    @change="(e) => onHandleCheck(e, item)"></el-checkbox>
                <!-- 根据 contentType 渲染不同的内容 -->
                <div v-if="item.contentType === 'image/png'" class="itemImage"
                    :style="{ width: item.width, height: item.height }">
                    <img :src="`data:${item.contentType};base64,${item.imageData}`" />
                </div>
                <div v-else-if="item.contentType === 'color'" class="itemImage" :style="{
        width: item.width,
        height: item.height,
        background: item.color,
        borderRadius: item.borderRadius || '0',
    }"></div>
                <div v-else-if="item.contentType === 'svg'" class="itemImage">
                    <svg viewBox="64 64 896 896" :width="item.width" :height="item.height" :fill="item.color">
                        <path :d="item.path"></path>
                    </svg>
                </div>
                <div v-else-if="item.contentType === 'picture-marker'" class="itemImage"
                    :style="{ width: item.width, height: item.height }">
                    <img :src="item.url" :style="{ width: item.width, height: item.height }" />
                </div>

                <span class="itemLabel">{{ item.label }}</span>
            </div>
        </div>
    </div>
</template>
<script setup>
import { watch, toRefs, ref } from 'vue';

const props = defineProps({
    data: { type: Object, default: () => ({}) },
    showCheck: { type: Boolean, default: false },
    selectKeys: { type: Array, default: () => [] },
    isPrint: { type: Boolean, default: false }
});

const emits = defineEmits(['onCheck']);

const { data, selectKeys, isPrint } = toRefs(props)

const onHandleCheck = (e, item) => {
    emits('onCheck', e, item)
}

const legendSelectedKeys = ref(selectKeys.value);

// 监听数据变化
watch(
    () => selectKeys?.value,
    (newValue) => {
        legendSelectedKeys.value = [...newValue]
    },
    { immediate: true }
)

</script>

<style lang="less" scoped>
@import '@/theme/colors.less';

.legendItem {
    .layerName {
        font-weight: bold;
        text-align: left;
    }

    .list {
        .item {
            display: flex;
            flex-direction: row;
            align-items: center;
            margin: 12px 0;

            .itemImage {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 8px;
                overflow: hidden;

                img {
                    width: 100%;
                }
            }
        }
    }

    &.isPrint {
        .layerName {
            color: black;
            font-weight: 700;
        }

        .itemLabel {}
    }
}
</style>