<template>
  <div
    :class="['controlItem', checkKeys.includes(currentData?.serverId) && 'isActive', position === 'LEFT' && 'isLeftItem', position === 'RIGHT' && 'isRightItem']">
    <div>
      <div class="content">
        <div class="itemContent">
          <button class="handle">
            <svg viewBox="0 0 20 20" width="12">
              <path
                d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
            </svg>
            <span class="itemName" :title="currentData.name">
              <el-tag type="success" v-if="currentData.dataYear">{{
      currentData.dataYear
    }}</el-tag>
              {{ currentData.name }}
            </span>
          </button>
        </div>
        <div class="itemAction">
          <div class="actionIcon isCheckAction">
            <el-checkbox size="large" v-if="checkKeys.includes(currentData?.serverId)" :checked="true"
              @change="checkBoxChange" />
            <el-checkbox size="large" v-else :checked="false" @change="checkBoxChange" />
          </div>
        </div>
      </div>
      <div class="control">
        <div class="item">
          <div class="actionItem" @click="() => emits('onLocation', currentData)">
            <com-icon :size="13" name="dingwei" />定位
          </div>
          <div class="divider" v-if="false"></div>
          <el-tooltip v-if="false" raw-content :content="getDisabledStatus('query')
      ? ''
      : `<span>激活状态下,点击地图<br />进行图层属性查询</span>`
      " :placement="currentData.queryType && currentData.queryType.indexOf('1') > -1
      ? 'right'
      : 'bottom'
      ">
            <el-popover placement="top" trigger="hover" :disabled="getDisabledStatus('query')">
              <template #reference>
                <div class="actionItem" :class="{ isDisabled: getDisabledStatus('query') }" :style="querySelectId === currentData?.id && btnType === 'query'
      ? { color: '#1A4FFF' }
      : undefined
      " @click="() => {
      (currentData?.queryType && currentData.queryType === '0') ||
        !currentData?.queryType
        ? onQueryDataHandle('query', 'point')
        : () => { };
    }
      ">
                  <com-icon name="dian" />查询
                </div>
              </template>
              <template>
                <div class="pop" v-if="currentData?.queryType && currentData?.queryType.indexOf('1') > -1">
                  <div class="popItem" @click="() => onQueryDataHandle('query', 'point')">
                    <span><com-icon name="dian" />点选查询</span>
                  </div>
                  <div class="popItem" @click="() => onQueryDataHandle('query', 'rectangle')">
                    <span><com-icon name="juxing" />框选查询</span>
                  </div>
                  <div class="popItem" @click="() => onQueryDataHandle('query', 'polygon')">
                    <span><com-icon name="duobianxing" />套索查询</span>
                  </div>
                </div>
              </template>
            </el-popover>
          </el-tooltip>
          <div class="divider"></div>
          <div class="actionItem" @click="() => emits('onRemove', currentData)">
            <com-icon :size="12" name="yichu" />移除
          </div>
        </div>
        <div class="item">
          <div class="label">不透明度</div>
          <div class="value">
            <el-slider :model-value="currentData.opacity" size="small" :min="0" :max="1" :step="0.1"
              @input="(value) => onOpacityHandle(value, currentData)" :format-tooltip="(value: number) => {
      return `${value * 100}%`
    }"></el-slider>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, toRefs } from 'vue';
import { isEmpty } from "lodash-es";

const props = defineProps({
  data: { type: Object, default: () => ({}) },
  index: { type: Number, default: 0 },
  isInitFinish: { type: Boolean, default: false },
  isSplit: { type: Boolean, default: false },
  controlBtn: { type: Object, default: () => ({}) },
  querySelectId: { type: Object, default: null },
  btnType: { type: Object, default: null },
  checkKeys: { type: Array, default: () => [] },
  position: { type: String, default: '' }
});
const {
  data,
  querySelectId,
  btnType,
  position
} = toRefs(props);

const emits = defineEmits([
  "onOpacity",
  "onLocation",
  "onRemove",
  "onQuery",
  "ondrag",
  "onCheckChange"
]);

const geometryType = ref(
  data.value.dataSource === "selfAdd" && !isEmpty(data.value.geoJson)
    ? data.value.geoJson[0].features[0].geometry.type
    : data.value.geometryType
);
const show = ref(true);
const currentData = ref(data);

const getDisabledStatus = (type) => {
  return (
    (!currentData.value.url && !(currentData.value.dataSource === "selfAdd")) ||
    currentData.value.dataSource === "Table" ||
    (currentData.value?.url && currentData.value?.type !== "YJDVectorTileLayer") ||
    currentData.value?.type === "WMSLayer" ||
    currentData.value?.type === "WMTSLayer" ||
    !(type === "query" ? currentData.value.queryType : currentData.value.hasData)
  );
};

const onQueryDataHandle = (
  type,
  queryType
) => {
  if (
    (type === "query" && getDisabledStatus("query")) ||
    (type === "analysis" && getDisabledStatus("data"))
  )
    return;
  emits("onQuery", currentData.value, type, queryType);
};

/**
 * @Title: 是否选中
 */
const checkBoxChange = (checkedStatus) => {
  emits('onCheckChange', currentData.value, checkedStatus)
}

/**
 * @title: 显示/隐藏
 */
const onShowHandle = (type, data) => {
  show.value = type;
  if (type) {
    emits("onOpacity", data?.opacity, data);
  } else {
    emits("onOpacity", 0, data);
  }
};

/**
 * @title: 透明度改变
 * @param {*} val
 * @param {*} data
 */
const onOpacityHandle = (val, data) => {
  emits("onOpacity", val, data);
};
// 监听数据变化
watch(
  () => data?.value,
  (newValue) => {
    currentData.value = newValue
  },
)

</script>

<style lang="less" scoped>
@import "@/theme/colors.less";

.controlItem {
  background: #fff;
  border: 1px solid #dcdcdc;

  &.isActive {
    position: relative;
    &.isLeftItem::before {
      position: absolute;
      top: 10px;
      right: -12px;
      width: 0;
      height: 0;
      border-top: 10px solid transparent;
      border-bottom: 10px solid transparent;
      border-left: 12px solid rgba(64, 158, 255, 0.2);
      content: "";
    }

    &.isRightItem::after {
      position: absolute;
      top: 10px;
      left: -12px;
      width: 0;
      height: 0;
      border-top: 10px solid transparent;
      border-right: 12px solid rgba(64, 158, 255, 0.2);
      border-bottom: 10px solid transparent;
      content: "";
    }

    .content {
      background-color: rgba(64, 158, 255, 0.2);
    }
  }

  &+.controlItem {
    margin-top: 12px;
  }

  &[aria-pressed="true"] {
    opacity: 0.3;
  }

  &.dragOverlay {
    transform: scale(1.05);
    box-shadow: -1px 0 15px 0 rgba(34, 33, 81, 0.01),
      0 15px 15px 0 rgba(34, 33, 81, 0.25);
  }


  .content {
    display: flex;
    flex: 1;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    padding: 0 12px 0 8px;

    .itemContent {
      display: flex;
      flex-direction: row;
      align-items: center;
      min-width: 0;
      width: 100%;

      .handle {
        display: flex;
        align-items: center;
        flex: 0 0 auto;
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: flex-start;
        width: 100%;
        padding: 6px 0px;
        touch-action: none;
        cursor: pointer;
        border-radius: 5px;
        border: none;
        outline: none;
        appearance: none;
        background-color: transparent;
        -webkit-tap-highlight-color: transparent;

        svg {
          width: 12px;
          height: 12px;
          margin-right: 4px;
          overflow: visible;
          fill: #919eab;
        }

        &:hover {
          svg {
            fill: #6f7b88;
          }
        }
      }

      .itemName {
        padding: 0 8px 0 6px;
        color: #222;
        font-weight: bold;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
    }

    .itemAction {
      display: flex;
      flex-shrink: 0;
      flex-direction: row;
      align-items: center;
      color: #666;

      .actionIcon {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 4px;
        cursor: pointer;
        width: 22px;
        height: 22px;
        border-radius: 2px;

        &.isCheckAction {
          &:hover {
            background: transparent;
          }
        }

        &:hover {
          background: #f2f2f2;

          :deep(.com-icon) {
            color: @main-color;
          }
        }

        :deep(.com-icon) {
          font-size: 14px;
          margin-top: 2px;
        }
      }
    }
  }

  .control {
    display: flex;
    flex-direction: column;
    padding: 0 12px;
    background: #f8f8f8;
    border: 0;
    outline: 0;

    .item {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      height: 40px;

      &:not(:first-child) {
        border-top: 1px solid #efefef;
      }

      .icon {
        display: inline-block;
        cursor: pointer;
        width: 16px;
        color: @main-color;

        &.active {
          color: #5e6166;
        }
      }

      .divider {
        flex: 0 0 1px;
        width: 1px;
        height: 10px;
        margin: 0 6px;
        background: #d9d9d9;
      }

      .actionItem {
        position: relative;
        display: flex;
        min-width: 48px;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        cursor: pointer;

        :deep(.com-icon) {
          margin-right: 8px;
        }

        &.isDisabled {
          color: #999;
          cursor: not-allowed;

          :deep(.com-icon) {
            fill: #999 !important;
          }

          &:hover {
            color: #999;

            :deep(.com-icon) {
              fill: #999 !important;
            }
          }
        }

        &:hover {
          color: @main-color;

          :deep(.com-icon) {
            fill: @main-color !important;
          }
        }
      }

      .label {
        display: flex;
        flex: 0 0 88px;
        align-items: center;
        font-size: 12px;
        width: 88px;
      }

      .value {
        flex: 1;

        :deep(.el-slider__button) {
          width: 15px;
          height: 15px;
        }

        .noValue {
          :deep(.ant-slider-handle) {
            left: 6% !important;
          }
        }

        .layoutList {
          display: flex;
          flex-direction: row;
          align-items: center;
          margin-left: 6px;

          .layoutItem {
            position: relative;
            display: inline-flex;
            flex: 1;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            height: 24px;
            line-height: 22px;
            border: 1px solid #dcdcdc;
            cursor: pointer;
            z-index: 1;

            &.active {
              color: #fff;
              background: @main-color;
              border-color: @main-color;
              z-index: 2;

              &:hover {
                color: #fff;
              }
            }

            &:not(:first-child) {
              margin-left: -1px;
            }

            &:hover {
              color: @main-color;
            }
          }
        }
      }
    }
  }
}
</style>