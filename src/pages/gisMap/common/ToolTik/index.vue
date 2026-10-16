<template>
  <div v-if="Object.keys(tookitRef).length > 0 && mapInstance"
    :class="['arcgis-tool-warp', !isExpand ? 'un-expand' : '']" ref="ArcgisToolRef" id="ArcgisToolWarp">
    <div class="tool-item expand-item" v-if="Object.keys(tookitRef).length > 1" @click="onExpand">
      <el-icon>
        <Expand v-if="isExpand" />
        <Fold v-else />
      </el-icon>
      <div class="tool-name">折叠</div>
    </div>
    <el-tooltip effect="dark" :disabled="isExpand" :content="'属性查询'" placement="left">
      <Query v-if="tookitRef?.query" ref="QueryRef" :mapInstance="mapInstance" :expandStatus="isExpand" />
    </el-tooltip>
    <el-divider class="tool-divider" v-if="!isExpand && tookitRef?.query" />
    <el-tooltip effect="dark" :disabled="isExpand" :content="'坐标定位'" placement="left">
      <CoordinateLocate v-if="tookitRef?.locate" ref="LocateRef" :mapInstance="mapInstance" :expandStatus="isExpand"
        :symbol="tookitRef?.mapDrawSymbol" :onLocate="onLocateHandle" />
    </el-tooltip>
    <el-divider class="tool-divider" v-if="!isExpand && tookitRef?.locate" />

    <el-tooltip effect="dark" :disabled="isExpand" :content="'坐标拾取'" placement="left">
      <CoordinatePickUp v-if="tookitRef?.pickup" ref="PickupRef" :mapInstance="mapInstance" :expandStatus="isExpand"
        :symbol="tookitRef?.mapDrawSymbol" :onPick="onLocateHandle" />
    </el-tooltip>
    <el-divider class="tool-divider" v-if="!isExpand && tookitRef?.pickup" />
    <el-tooltip effect="dark" :disabled="isExpand" :content="'测距离'" placement="left">
      <MeasureDistance v-if="tookitRef?.distance" :mapInstance="mapInstance" :symbol="tookitRef?.mapDrawSymbol"
        @onComplete="onComplete" @onRemove="onRemove" @onCancel="onCancel" />
    </el-tooltip>
    <el-divider class="tool-divider" v-if="!isExpand && tookitRef?.distance" />
    <el-tooltip effect="dark" :disabled="isExpand" :content="'测面积'" placement="left">
      <MeasureArea v-if="tookitRef?.surface" :mapInstance="mapInstance" :symbol="tookitRef?.mapDrawSymbol"
        @onComplete="onComplete" @onRemove="onRemove" @onCancel="onCancel" />
    </el-tooltip>
    <el-divider class="tool-divider" v-if="!isExpand && tookitRef?.sign?.show" />
        <el-tooltip effect="dark" v-if="tookitRef?.sign?.show" :disabled="isExpand" :content="'标记'" placement="left">
            <MapSign :mapInstance="mapInstance"></MapSign>
        </el-tooltip>
    <el-divider class="tool-divider" v-if="!isExpand && tookitRef?.screen" />
    <el-tooltip effect="dark" v-if="tookitRef?.swipe" :disabled="isExpand" :content="'卷帘对比'" placement="left">
      <span class="tool-item measure-area" :style="style" @click="(event) => {
        onScreen(event);
      }
        ">
        <com-icon name="gongju_fenpingduibi" />
        <div class="tool-name">分屏对比</div>
      </span>
    </el-tooltip>
    <el-divider class="tool-divider" v-if="!isExpand && tookitRef?.swipe" />
    <el-tooltip effect="dark" v-if="tookitRef?.swipe" :disabled="isExpand" :content="'卷帘对比'" placement="left">
      <span class="tool-item measure-area" :style="style" @click="(event) => {
        onSwipe(event);
      }
        ">
        <com-icon name="gongju_juanlianduibi" />
        <div class="tool-name">卷帘对比</div>
      </span>
    </el-tooltip>
    <el-divider class="tool-divider" v-if="!isExpand && tookitRef?.print" />
    <el-tooltip effect="dark" v-if="tookitRef?.print" :disabled="isExpand" :content="'地图打印'" placement="left">
      <span class="tool-item measure-area" :style="style" @click="(event) => { onPrint(event) }">
        <com-icon name="gongju_dayin" />
        <div class="tool-name">地图打印</div>
      </span>
    </el-tooltip>
    <MapSwipe v-if="showSwipe && tookitRef?.swipe && mapInstance" :mapInstance="mapInstance" ref="SwipeRef"
      @onClose="showSwipe = false" />
    <MapPrint v-if="showPrint && tookitRef?.print && mapInstance" :mapInstance="mapInstance" ref="PrintRef"
      @onClose="showPrint = false" />
    <Screen v-if="showScreen && tookitRef?.screen && mapInstance" :mapInstance="mapInstance" ref="ScreenRef"
      @onClose="showScreen = false" />
  </div>
</template>

<script setup>
import { ref, toRefs } from 'vue';
import MeasureDistance from './Measure/Distance.vue';
import MeasureArea from './Measure/AreaMea.vue';
import MapSwipe from './MapSwipe/index.vue';
import Screen from '@/components/Screen/index.vue';
import MapPrint from './MapPrint/index.vue';
import Query from '@/components/Query/index.vue';
import MapSign from './MapSign/index.vue';
import CoordinateLocate from '../widgets/CoordinateLocate/index.vue';
import CoordinatePickUp from '../widgets/CoordinatePickUp/index.vue';

const props = defineProps({
  config: { type: Object, default: () => ({}) },
  mapInstance: { type: Object, default: () => ({}) }
});
const emits = defineEmits(['onLoaded']);
const { config, mapInstance } = toRefs(props);

const ArcgisToolRef = ref();
const tookitRef = ref(config?.value?.widgets?.toolKit);
const isExpand = ref(true);
const showQuery = ref(true);
const SwipeRef = ref(null);
const ScreenRef = ref(null);
const PrintRef = ref(null);
const QueryRef = ref();
const LocateRef = ref();
const PickupRef = ref();
const showSwipe = ref(false);
const showPrint = ref(false);
const showScreen = ref(false);
const onExpand = () => {
  isExpand.value = !isExpand.value;
};

const onComplete = (data) => {
  console.log(data);
};

const onRemove = (layerId) => {
  console.log(layerId);
};

const onCancel = () => {
  console.log('cancel');
};

const onSwipe = (event) => {
  if (!showSwipe.value) {
    showSwipe.value = true;
  }
};

const onScreen = (event) => {
  if (!showScreen.value) {
    showScreen.value = true
  }
}

const onPrint = (event) => {
  if (!showPrint.value) {
    showPrint.value = true;
  }
}

const closeCommon = () => {
  clearLocate();
  clearPickup();
};

const clearQuery = () => {
  if (QueryRef?.value?.onClear) QueryRef.value?.onClear();
};

const clearLocate = () => {
  if (LocateRef.value?.onClear) LocateRef.value.onClear();
};

const clearPickup = () => {
  if (PickupRef.value?.onClear) PickupRef.value?.onClear();
};

const onLocateHandle = () => {
  clearQuery();
  clearLocate();
  clearPickup();
};
</script>

<style lang="less" scoped>
.arcgis-tool-warp {
  position: absolute;
  width: auto;
  cursor: pointer;
  background-color: #fff;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  width: 98px;
  right: 0;
  top: 52px;

  .is-hidden-tip {
    padding: 0;
    border: none;
  }

  &.un-expand {
    width: 32px;

    .tool-name {
      display: none;
    }

    :deep(.tool-name) {
      display: none;
    }
  }

  .tool-divider {
    width: 14px;
    min-width: unset !important;
    margin: 0px 9px;
  }

  ::v-deep(.tool-item) {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 8px;

    &.expand-item {
      background-color: var(--color-theme-main5);
      color: white;

      &:hover {
        background-color: var(--color-theme-main5);
      }
    }

    &:hover {
      background-color: #f5f5f5;
    }

    .tool-name {
      font-size: 14px;
      margin-left: 6px;
    }
  }
}
</style>
