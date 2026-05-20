/**
 * utils.js - 工具函数集合
 *
 * 功能说明：
 * - 提供省份地理数据加载功能
 * - 提供坐标系转换工具（经纬度与场景坐标互转）
 * - 提供纹理创建工具
 * - 提供相机位置设置工具
 * - 提供墨卡托投影创建工具
 */

import * as THREE from 'three';
import { geoMercator } from 'd3-geo';

/**
 * 创建共享的墨卡托投影函数
 *
 * @param {Object} featureCollection - GeoJSON FeatureCollection对象
 * @param {Object} extent - 投影范围对象 { width, height, padding }
 * @returns {Function} 投影函数，接收[lon, lat]返回[x, y]
 *
 * @example
 * const projection = createSharedProjection(geoJsonData, { width: 800, height: 600, padding: 30 });
 */
export function createSharedProjection(
  featureCollection,
  extent = { width: 500, height: 500, padding: 30 }
) {
  // 解构获取宽高和内边距
  const { width, height, padding } = extent;
  // 使用d3-geo的geoMercator投影
  // fitExtent自动调整投影比例以适应指定的范围
  const projection = geoMercator().fitExtent(
    [
      [padding, padding], // 左下角
      [width - padding, height - padding], // 右上角
    ],
    featureCollection
  );
  return projection;
}

/**
 * 默认加载的省份数据文件列表
 * 可以通过loadProvinceData函数的files参数覆盖
 */
export const PROVINCE_FILES = ['processed_xizang.json'];

/**
 * 加载省份GeoJSON数据
 *
 * @param {string[]} files - 要加载的省份文件名数组
 * @returns {Promise<Object>} 返回GeoJSON FeatureCollection对象
 *
 * @example
 * const data = await loadProvinceData([' provinces.json', 'cities.json']);
 */
export async function loadProvinceData(files = PROVINCE_FILES) {
  /** @type {Array} 存储所有有效的GeoJSON要素 */
  const allFeatures = [];

  // 遍历每个文件
  for (const fileName of files) {
    try {
      // 从/maps目录获取JSON文件
      const response = await fetch(`/maps/${fileName}`);

      // 检查HTTP响应状态
      if (!response.ok) {
        console.warn(`Failed to load ${fileName}: ${response.status}`);
        continue; // 跳到下一个文件
      }

      // 解析JSON数据
      const data = await response.json();

      // 处理FeatureCollection格式（多个要素）
      if (data.features && Array.isArray(data.features)) {
        // 过滤出有效的要素（必须有geometry和coordinates）
        const validFeatures = data.features.filter((f) => {
          if (!f.geometry || !f.geometry.coordinates) return false;
          return true;
        });
        allFeatures.push(...validFeatures);
      }
      // 处理单个Feature格式
      else if (data.type === 'Feature' && data.geometry && data.geometry.coordinates) {
        allFeatures.push(data);
      }
    } catch (error) {
      console.error(`Error loading ${fileName}:`, error);
    }
  }

  console.log(`Loaded ${allFeatures.length} valid province features`);

  // 返回标准的GeoJSON FeatureCollection格式
  return { type: 'FeatureCollection', features: allFeatures };
}

/**
 * 将公里转换为场景单位
 *
 * 墨卡托投影中，1度经度在不同纬度对应的实际距离不同：
 * - 赤道上1度经度 ≈ 111.32 km
 * - 其他纬度需要乘以cos(纬度)
 *
 * @param {number} km - 公里数
 * @param {number} latitude - 纬度（度）
 * @returns {number} 场景单位
 *
 * @example
 * // 在纬度30度处，100公里等于多少场景单位
 * const units = kmToSceneUnits(100, 30);
 */
export function kmToSceneUnits(km, latitude) {
  // 将纬度转换为弧度
  const latRad = (latitude * Math.PI) / 180;

  // 计算该纬度处每度经度对应的公里数
  // cos(latRad)是纬度处的长度比例因子
  const kmPerUnit = 111.32 * Math.cos(latRad);

  // 计算公里对应的场景单位
  return km / kmPerUnit;
}

/**
 * 创建渐变纹理
 *
 * 使用Canvas创建垂直渐变，然后转换为Three.js纹理
 *
 * @param {string} color1 - 渐变起点颜色（Hex字符串，如'#ff0000'）
 * @param {string} color2 - 渐变终点颜色（Hex字符串）
 * @returns {THREE.CanvasTexture} 渐变纹理对象
 *
 * @example
 * // 创建从蓝色到深蓝的垂直渐变
 * const texture = createGradientTexture('#699dd9', '#416295');
 */
export function createGradientTexture(color1, color2) {
  // 创建Canvas画布（1像素宽，256像素高）
  const canvas = document.createElement('canvas');
  canvas.width = 1; // 宽度1像素（纹理会在水平方向重复）
  canvas.height = 256; // 高度256像素

  // 获取Canvas 2D上下文
  const ctx = canvas.getContext('2d');

  // 创建垂直渐变
  // 参数：起点坐标(x1,y1) 到 终点坐标(x2,y2)
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);

  // 添加渐变色停止点
  // 0表示起点（顶部），1表示终点（底部）
  gradient.addColorStop(0, color1); // 顶部颜色
  gradient.addColorStop(1, color2); // 底部颜色

  // 使用渐变填充整个画布
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1, 256);

  // 创建Three.js CanvasTexture
  const texture = new THREE.CanvasTexture(canvas);

  // 设置纹理包裹模式
  texture.wrapS = THREE.ClampToEdgeWrapping; // 水平方向：边缘拉伸
  texture.wrapT = THREE.ClampToEdgeWrapping; // 垂直方向：边缘拉伸

  // 禁用Y轴翻转
  // Three.js默认翻转Y轴，但我们的渐变不需要翻转
  texture.flipY = false;

  // 标记纹理需要更新
  texture.needsUpdate = true;

  return texture;
}

/**
 * 将经纬度转换为场景坐标
 *
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @param {Function} projection - 投影函数
 * @returns {{x: number, z: number}} 场景坐标（XZ平面）
 *
 * @example
 * const coords = latLngToSceneCoords(116.4, 39.9, projection);
 */
export function latLngToSceneCoords(lng, lat, projection) {
  // 调用投影函数将经纬度转为平面坐标
  const [x, y] = projection([lng, lat]) || [0, 0];

  // 处理NaN情况，返回(0, 0)
  // y轴取反：GeoJSON的y轴向下，Three.js的z轴向上
  // 地图渲染在XZ平面，所以lat映射到z轴
  return {
    x: isNaN(x) ? 0 : x,
    z: isNaN(y) ? 0 : -y,
  };
}

/**
 * 根据经纬度和高度设置相机位置
 *
 * 将相机的三维位置设置为对应经纬度上空指定高度处
 *
 * @param {THREE.Camera} camera - Three.js相机对象
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @param {number} heightKm - 高度（公里）
 * @param {Function} projection - 投影函数
 *
 * @example
 * // 将相机设置在北京上空100公里处
 * setCameraPositionByLatLng(camera, 116.4, 39.9, 100, projection);
 */
export function setCameraPositionByLatLng(camera, lng, lat, heightKm, projection) {
  // 将经纬度转换为场景坐标
  const sceneCoords = latLngToSceneCoords(lng, lat, projection);

  // 将高度从公里转换为场景单位
  // 使用较小的比例，让相机更靠近地图
  // 500公里 × 0.1 = 50场景单位高度（适合观察单个省份）
  const SCENE_UNITS_PER_KM = 0.1;
  const sceneHeight = heightKm * SCENE_UNITS_PER_KM;

  // 设置相机位置
  // 从斜前方观察地图，而不是正上方
  // x: 经度坐标 - 偏移量（从前方看）
  // y: 高度（向上为正）
  // z: 纬度坐标 - 偏移量（从前方看）
  const offset = sceneHeight * 0.8; // 水平偏移，让相机从前方观察
  camera.position.set(sceneCoords.x - offset, sceneHeight, sceneCoords.z - offset);

  console.log(`投影坐标: (${sceneCoords.x}, ${sceneCoords.z})`);
  console.log(`相机位置: (${camera.position.x}, ${camera.position.y}, ${camera.position.z})`);
  console.log(`相机高度(场景单位): ${sceneHeight}`);
}

/**
 * 设置相机看向指定经纬度
 *
 * @param {THREE.Camera} camera - Three.js相机对象
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @param {Function} projection - 投影函数
 * @param {{x: number, y: number}} offset - 位置偏移量（可选）
 *
 * @example
 * // 设置相机看向北京
 * setCameraLookAtLatLng(camera, 116.4, 39.9, projection);
 */
export function setCameraLookAtLatLng(camera, lng, lat, projection, offset = { x: 0, z: 0 }) {
  // 将经纬度转换为场景坐标
  const targetCoords = latLngToSceneCoords(lng, lat, projection);

  // 设置相机朝向
  // 地图在XZ平面上，所以看向(x, 0, z)
  camera.lookAt(targetCoords.x - offset.x, 0, targetCoords.z - offset.z);

  console.log(`Camera looking at: (${targetCoords.x - offset.x}, 0, ${targetCoords.z - offset.z})`);
}
