<template>
  <div>
    <span class="tool-item widgets-location" :style="style" @click="onLocateHandle">
      <com-icon name="gongju_zuobiaodingwei" v-if="!slots.icon" />
      <slot name="icon" v-if="slots.icon"></slot>
      <div class="tool-name" v-if="!slots.title">{{ title }}</div>
      <slot name="title" v-if="slots.title"></slot>
    </span>

    <div v-if="activeStatus" :class="['coordinateWrap', { minOffsetWrap: !expandStatus }]">
      <div class="topHeader">
        <span>坐标定位</span>
        <el-button type="text" @click="onTypeChange">
          {{ coordinateType ? '度数' : '度分秒' }}
          <el-icon><Switch /></el-icon>
        </el-button>
        <div class="closeIcon">
          <el-icon @click="activeStatus = false"><CircleClose /></el-icon>
        </div>
      </div>
      <div class="coordinateContent">
        <div class="coordinateItem">
          <span class="itemLabel">经度：</span>
          <div class="itemValue">
            <div class="longWarp" v-if="coordinateType">
              <el-input
                v-model="longD.d"
                maxLength="3"
                @change="
                  (e) => {
                    onLongDChange('d', e?.target?.value);
                  }
                "
              />
              °
              <el-input
                v-model="longD.m"
                maxLength="2"
                @change="
                  (e) => {
                    onLongDChange('m', e?.target?.value);
                  }
                "
              />
              '
              <el-input
                v-model="longD.s"
                class="sCol"
                maxLength="10"
                @change="
                  (e) => {
                    onLongDChange('s', e?.target?.value);
                  }
                "
              />
              "
            </div>
            <el-input
              v-if="!coordinateType"
              v-model="longitude"
              :placeholder="'例如' + ExamplePoint[PLATFORM]?.lon"
              @change="
                (e) => {
                  valueChange('lon', e?.target?.value);
                }
              "
            />
          </div>
        </div>
        <div class="coordinateItem">
          <span class="itemLabel">纬度：</span>
          <div class="itemValue">
            <div v-if="coordinateType" class="latWrap">
              <el-input
                v-model="latD.d"
                maxLength="3"
                @change="
                  (e) => {
                    onLatDChange('d', e.target.value);
                  }
                "
              />
              °
              <el-input
                v-model="latD.m"
                maxLength="2"
                @change="
                  (e) => {
                    onLatDChange('m', e.target.value);
                  }
                "
              />
              '
              <el-input
                v-model="latD.s"
                maxLength="10"
                class="sCol"
                @change="
                  (e) => {
                    onLatDChange('s', e.target.value);
                  }
                "
              />
              "
            </div>
            <el-input
              v-if="!coordinateType"
              v-model="latitude"
              maxLength="18"
              :placeholder="'例如' + ExamplePoint[PLATFORM]?.lat"
              @change="
                (e) => {
                  valueChange('lat', e?.target?.value);
                }
              "
            />
          </div>
        </div>
      </div>
      <div class="bottomBtn">
        <span v-if="errorText" class="errorText" title="">{{ errorText }}</span>
        <!-- <el-button
        :disabled="!longitude || !latitude"
        @click="onSaveAsMarkerHandle"
        >存为标记点</el-button
      > -->
        <el-button
          type="primary"
          :loading="loading"
          :disabled="!longitude || !latitude"
          @click="mapPointQuery"
        >
          确认
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, toRefs, watch, useSlots, onMounted } from 'vue';
  import { ConvertAngleToDegree, ConvertDegreeToAngle } from '@/utils';
  import { CoordinateTransformNew } from '@/api/dataMap';
  import { Graphic } from '@/components/ArcgisMap/modules';
  import { GraphicsLayer } from '@/components/ArcgisMap/modules';

  const props = defineProps({
    title: { type: String, default: '坐标定位' },
    mapInstance: { type: Object, default: () => ({}) },
    onLocate: { type: Function, default: null },
    onSaveAsMarker: { type: Function, default: null },
    expandStatus: { type: Boolean, default: false },
  });
  const slots = useSlots();
  const { expandStatus } = toRefs(props);
  const { mapInstance, onLocate, onSaveAsMarker } = props;

  const emits = defineEmits(['update:expandStatus']);

  defineOptions({
    name: 'com-measure-location',
  });

  const ExamplePoint = {
    YN: {
      lon: 100.26648,
      lat: 25.609593,
    },
    DL: {
      lon: 100.26648,
      lat: 25.609593,
    },
    BN: {
      lon: 100.55579,
      lat: 22.12581,
    },
    DQ: {
      lon: 99.038134,
      lat: 28.257485,
    },
  };

  let LocateGraphic;
  const PLATFORM = 'YN';
  // State management using Vue's ref
  const activeStatus = ref(false);
  const loading = ref(false);
  const longitude = ref(ExamplePoint[PLATFORM]?.lon);
  const latitude = ref(ExamplePoint[PLATFORM]?.lat);

  const coordinateType = ref(false);
  const longD = ref({ d: 0, m: 0, s: 0 });
  const latD = ref({ d: 0, m: 0, s: 0 });
  const errorText = ref('');
  const currentMapMode = ref(mapInstance?.config?.mapMode || '2D');

  // Watchers and lifecycle hooks
  watch(activeStatus, (newVal) => {
    if (newVal) {
      longitude.value = ExamplePoint[PLATFORM]?.lon;
      latitude.value = ExamplePoint[PLATFORM]?.lat;
    } else {
      removeGraphic();
    }
  });

  const onLocateHandle = () => {
    onLocate && onLocate();
    activeStatus.value = !activeStatus.value;
  };

  const mapPointQuery = () => {
    let x = coordinateType.value
      ? `${longD.value.d}°${longD.value.m}'${longD.value.s}"`
      : longitude.value;
    let y = coordinateType.value
      ? `${latD.value.d}°${latD.value.m}'${latD.value.s}`
      : latitude.value;
    const errorMsg = checkCoordinatesValue(
      coordinateType.value
        ? `${longD.value.d}°${longD.value.m}'${longD.value.s}"`
        : longitude.value,
      coordinateType.value ? `${latD.value.d}°${latD.value.m}'${latD.value.s}` : latitude.value
    );

    let newMsg = '';
    if (errorMsg?.length) {
      if (errorMsg === '坐标点不符合经纬度标准范围.') {
        errorText.value = errorMsg;
        removeGraphic(true);
        return;
      }

      const latitudeDegreeValue = ConvertAngleToDegree(
        coordinateType.value ? `${latD.value.d}°${latD.value.m}'${latD.value.s}"` : latitude.value
      );
      const longitudeDegreeValue = ConvertAngleToDegree(
        coordinateType.value
          ? `${longD.value.d}°${longD.value.m}'${longD.value.s}"`
          : longitude.value
      );
      if (isNaN(latitudeDegreeValue)) {
        newMsg = '经度坐标点格式不正确.';
      }
      if (isNaN(longitudeDegreeValue)) {
        newMsg = '纬度坐标点格式不正确.';
      }
      newMsg = checkCoordinatesValue(longitudeDegreeValue, latitudeDegreeValue);
      if (newMsg?.length) {
        errorText.value = newMsg;
        removeGraphic(true);
        return;
      }
      x = longitudeDegreeValue;
      y = latitudeDegreeValue;
    }
    const isNotLongitudeAndLatitude = Number(x) > 180 || Number(y) > 90;
    if (isNotLongitudeAndLatitude) {
      const geometryParams = { geometry: `MULTIPOINT(${x} ${y})` };
      projectedCoordinateConvertGeo(geometryParams).then((res) => {
        const { success, data, msg } = res;
        if (success) {
          addGraphicToMap(data.coordinates[0]);
        } else {
          errorText.value = msg;
          removeGraphic(true);
        }
      });
    } else {
      addGraphicToMap([Number(x), Number(y)]);
    }
  };

  const onSaveAsMarkerHandle = () => {
    let x = coordinateType.value
      ? `${longD.value.d}°${longD.value.m}'${longD.value.s}"`
      : longitude.value;
    let y = coordinateType.value
      ? `${latD.value.d}°${latD.value.m}'${latD.value.s}`
      : latitude.value;
    const errorMsg = checkCoordinatesValue(
      coordinateType.value
        ? `${longD.value.d}°${longD.value.m}'${longD.value.s}"`
        : longitude.value,
      coordinateType.value ? `${latD.value.d}°${latD.value.m}'${latD.value.s}` : latitude.value
    );

    let newMsg = '';
    if (errorMsg?.length) {
      if (errorMsg === '坐标点不符合经纬度标准范围.') {
        errorText.value = errorMsg;
        removeGraphic(true);
        return;
      }

      const latitudeDegreeValue = ConvertAngleToDegree(
        coordinateType.value ? `${latD.value.d}°${latD.value.m}'${latD.value.s}"` : latitude.value
      );
      const longitudeDegreeValue = ConvertAngleToDegree(
        coordinateType.value
          ? `${longD.value.d}°${longD.value.m}'${longD.value.s}"`
          : longitude.value
      );
      if (isNaN(latitudeDegreeValue)) {
        newMsg = '经度坐标点格式不正确.';
      }
      if (isNaN(longitudeDegreeValue)) {
        newMsg = '纬度坐标点格式不正确.';
      }
      newMsg = checkCoordinatesValue(longitudeDegreeValue, latitudeDegreeValue);
      if (newMsg?.length) {
        errorText.value = newMsg;
        removeGraphic(true);
        return;
      }
      x = longitudeDegreeValue;
      y = latitudeDegreeValue;
    }
    const isNotLongitudeAndLatitude = Number(x) > 180 || Number(y) > 90;
    if (isNotLongitudeAndLatitude) {
      const geometryParams = { geometry: `MULTIPOINT(${x} ${y})` };
      projectedCoordinateConvertGeo(geometryParams).then((res) => {
        const { success, data, msg } = res;
        if (success) {
          onSaveAsMarker && onSaveAsMarker(data.coordinates[0][0], data.coordinates[0][1]);
        } else {
          errorText.value = msg;
          removeGraphic(true);
        }
      });
    } else {
      onSaveAsMarker && onSaveAsMarker(Number(x), Number(y));
    }
  };

  /**
   * @Title: 检查坐标值是否符合规则
   * @Author: DuXueSong
   * @Date: 2022/12/30
   */
  const checkCoordinatesValue = (lon, lat) => {
    let msg = '';
    if (isNaN(Number(lon)) || isNaN(Number(lat))) {
      msg = '坐标点格式不正确.';
      return msg;
    }
    if (Number(lon) === Number(lat)) {
      msg = '经度或纬度的坐标点不正确.';
      return msg;
    }
    const x = Math.abs(Number(lon));
    const y = Math.abs(Number(lat));
    const xIndex = x >= 180 ? (x < 1000 ? -1 : x.toString().indexOf('.')) : 0;
    const yIndex = y >= 90 ? (y < 1000 ? -1 : y.toString().indexOf('.')) : 0;
    if (xIndex === -1 || yIndex === -1) {
      msg = '坐标点不符合经纬度标准范围.';
      return msg;
    }
    return msg;
  };

  /**
   * @Title: 投影坐标转为地理坐标
   * @Author: Leslie
   * @Date: 2022/3/29
   */
  const projectedCoordinateConvertGeo = (geometryParams) => {
    return new Promise((resolve) => {
      CoordinateTransformNew(geometryParams)
        .then((res) => {
          const { code, success, message, data } = res;
          if (code === 200 && success) {
            const currentData = JSON.parse(data);
            resolve({ success: true, data: currentData });
          } else {
            resolve({ success: false, msg: message });
          }
        })
        .catch(() => {
          resolve({ success: false, msg: '坐标点转换服务调用失败.' });
        });
    });
  };

  const addGraphicToMap = (currentPoint) => {
    removeGraphic();
    const point = currentPoint ? currentPoint : [Number(longitude), Number(latitude)];
    const pointGraphic = new Graphic({
      geometry:
        currentMapMode === '2D'
          ? {
              type: 'multipoint',
              points: point,
              spatialReference: mapInstance?.MapView?.spatialReference,
            }
          : {
              type: 'point',
              x: point[0],
              y: point[1],
              spatialReference: mapInstance?.MapView?.spatialReference,
            },
      symbol: {
        type: 'picture-marker',
        url: `/images/point-marker/dw1.png`,
        width: '18px',
        height: '24px',
      },
    });
    LocateGraphic = new GraphicsLayer({
      graphics: [pointGraphic],
      spatialReference: mapInstance?.MapView.spatialReference,
      groupType: 'TopLayer',
      isRegionQueryLayer: true,
    });
    mapInstance?.Map.add(LocateGraphic);
    mapInstance?.MapView.goTo({
      center: point,
      scale: 10000,
    });
  };

  const removeGraphic = (isError) => {
    if (LocateGraphic) {
      mapInstance?.Map?.remove(LocateGraphic);
    }
    !isError && (errorText.value = undefined);
  };

  const valueChange = (key, value) => {
    if (key === 'lon') {
      longitude.value = value;
      errorText.value = !value ? '请输入经度坐标' : undefined;
    }
    if (key === 'lat') {
      latitude.value = value;
      errorText.value = !value ? '请输入纬度坐标' : undefined;
    }
  };

  const onLongDChange = (type, val) => {
    const temp = { ...longD.value };
    temp[type] = val ? Number(val) : undefined;
    longD.value = temp;
  };

  const onLatDChange = (type, val) => {
    const temp = { ...latD.value };
    temp[type] = val ? Number(val) : undefined;
    latD.value = temp;
  };

  const onTypeChange = () => {
    coordinateType.value = !coordinateType.value;
    if (!coordinateType.value) {
      if (longD.value?.d && longD.value.m && longD.value.s) {
        const temp = ConvertAngleToDegree(`${longD.value.d}°${longD.value.m}'${longD.value.s}"`);
        longitude.value = temp;
      }
      if (latD.value?.d && latD.value.m && latD.value.s) {
        const temp = ConvertAngleToDegree(`${latD.value.d}°${latD.value.m}'${latD.value.s}"`);
        latitude.value = temp;
      }
    } else {
      const longTemp = ConvertDegreeToAngle(longitude.value);
      longD.value = {
        d: longTemp.degree,
        m: longTemp.minute,
        s: longTemp.second,
      };
      const latTemp = ConvertDegreeToAngle(latitude.value);
      latD.value = {
        d: latTemp.degree,
        m: latTemp.minute,
        s: latTemp.second,
      };
    }
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
          ::v-deep(.el-input__wrapper) {
            background: #f5f5f5;
            border: none;
            box-shadow: none;
          }
          .longWarp,
          .latWrap {
            display: flex;
            ::v-deep(.el-input__wrapper) {
              flex: 1;
            }
            .sCol {
              ::v-deep(.el-input__inner) {
                color: #ff4d4f;
              }
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
