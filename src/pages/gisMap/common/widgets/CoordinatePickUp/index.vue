<template>
  <div>
    <span class="tool-item widgets-location" :style="style" @click="onLocateHandle">
      <com-icon name="gongju_zuobiaoshiqu" v-if="!slots.icon" />
      <slot name="icon" v-if="slots.icon"></slot>
      <div class="tool-name" v-if="!slots.title">{{ title }}</div>
      <slot name="title" v-if="slots.title"></slot>
    </span>

    <div v-if="!isEmpty(position)" :class="['coordinateWrap', { minOffsetWrap: !expandStatus }]">
      <div class="topHeader">
        <span>坐标拾取</span>
        <div class="closeIcon">
          <el-icon @click="activeStatus = false"><CircleClose /></el-icon>
        </div>
      </div>
      <div class="coordinateContent">
        <div class="coordinateItem">
          <span class="itemLabel">经度：</span>
          <div class="itemValue">
            <el-input maxlength="18" readonly :value="position.longitude" />
          </div>
        </div>
        <div class="coordinateItem">
          <span class="itemLabel">纬度：</span>
          <div class="itemValue">
            <el-input maxlength="18" readonly :value="position.latitude" />
          </div>
        </div>
        <div v-if="mapType === '3D'" class="coordinateItem">
          <span class="itemLabel">高程：</span>
          <div class="itemValue">
            <el-input maxlength="18" readonly :value="position.height" />
          </div>
        </div>
      </div>
      <div class="bottomBtn">
        <span v-if="errorText" class="errorText" :title="errorText">{{ errorText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, toRefs, watch, useSlots, onMounted } from 'vue';
  import { isEmpty } from 'lodash-es';

  const props = defineProps({
    title: { type: String, default: '坐标拾取' },
    mapInstance: { type: Object, default: () => ({}) },
    onPick: { type: Function, default: null },
    expandStatus: { type: Boolean, default: false },
  });
  const slots = useSlots();
  const { expandStatus } = toRefs(props);
  const { mapInstance, onPick } = props;

  const emits = defineEmits(['update:expandStatus']);

  defineOptions({
    name: 'com-measure-location',
  });

  let MapViewClickHandle = null;
  // State management using Vue's ref
  const activeStatus = ref(false);
  const position = ref({});
  const errorText = ref('');
  const mapType = ref(mapInstance?.MapView?.type || '2d');

  // Watchers and lifecycle hooks
  watch(activeStatus, (newVal) => {
    console.log('newVal pick', newVal, 'mapInstance', mapInstance);
    if (newVal) {
      MapViewClickHandle = mapInstance?.MapView?.on('click', (event) => {
        const {
          mapPoint: { longitude, latitude, z },
        } = event;
        position.value = { longitude, latitude, height: z };
      });
    } else {
      position.value = {};
      if (MapViewClickHandle) {
        MapViewClickHandle.remove();
        MapViewClickHandle = null;
      }
    }
  });

  const onLocateHandle = () => {
    if (onPick) onPick();
    activeStatus.value = true;
  };

  const onClear = () => {
    if (activeStatus.value) {
      activeStatus.value = false;
    }
  };

  defineExpose({
    onClear,
  });

  onMounted(() => {
    // handle logic when component is mounted
  });
</script>

<style lang="less" scoped>
  @import '@/theme/colors.less';
  .widgets-location {
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
  .locateContainer {
    position: relative;
  }
  .toolItem {
    height: 32px;
    line-height: 32px;
    padding: 0;
    justify-content: center;
    text-align: center;
    cursor: pointer;
    &:first-child {
      margin-top: 4px;
    }
    &.unExpandItem {
      .esri-icon,
      .iconfont {
        font-size: 14px;
        margin-right: 0;
      }
    }
    &.activeItem {
      color: @main-color;
    }
    ::v-deep(.esri-icon, .iconfont) {
      font-size: 14px;
      margin-right: 6px;
    }
  }
  .coordinateWrap {
    position: absolute;
    width: 286px;
    height: auto;
    background: white;
    right: 110px;
    top: 0;
    padding-bottom: 10px;
    &.minOffsetWrap {
      right: 45px;
    }
    .topHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      height: 35px;
      border-bottom: 1px solid #f5f5f5;
      padding-left: 16px;
      .switch {
        margin-left: 60px;
        margin-right: 16px;
        cursor: pointer;
      }
      .closeIcon {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        width: 36px;
        height: 36px;
        color: rgb(26, 102, 255);
        background-color: rgba(26, 102, 255, 0.1);
      }
    }
    .coordinateContent {
      width: 100%;
      padding: 8px 16px;
      .coordinateItem {
        display: flex;
        position: relative;
        width: 100%;
        height: 46px;
        align-items: center;
        justify-content: space-between;
        .itemValue {
          width: calc(100% - 45px);
          ::v-deep(.el-input) {
            background: #f5f5f5;
            border: none;
            box-shadow: none;
          }
          .longWarp,
          .latWrap {
            display: flex;
            ::v-deep(.el-input) {
              flex: 1;
            }
          }
        }
      }
    }
    .bottomBtn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0px 16px 16px 16px;

      .errorText {
        margin-right: 16px;
        color: #ff4d4f;
        font-size: 12px;
        overflow: hidden;
        -webkit-line-clamp: 2;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-box-orient: vertical;
      }
    }
  }
</style>
