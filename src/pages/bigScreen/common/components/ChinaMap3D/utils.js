/**
 * utils.js - 工具函数集合
 *
 * 功能说明：
 * - 提供坐标系转换工具（经纬度与场景坐标互转）
 * - 提供相机位置设置工具
 * - 提供墨卡托投影创建工具
 */

import { geoMercator } from 'd3-geo';

/**
 * 创建共享的墨卡托投影函数
 *
 * @param {Object} featureCollection - GeoJSON FeatureCollection对象
 * @param {Object} extent - 投影范围对象 { width, height, padding }
 * @returns {Function} 投影函数，接收[lon, lat]返回[x, y]
 */
export function createSharedProjection(
  featureCollection,
  extent = { width: 500, height: 500, padding: 30 }
) {
  const { width, height, padding } = extent;
  const projection = geoMercator().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    featureCollection
  );
  return projection;
}

/**
 * 将经纬度转换为场景坐标
 *
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @param {Function} projection - 投影函数
 * @returns {{x: number, z: number}} 场景坐标（XZ平面）
 */
export function latLngToSceneCoords(lng, lat, projection) {
  const [x, y] = projection([lng, lat]) || [0, 0];
  return {
    x: isNaN(x) ? 0 : x,
    z: isNaN(y) ? 0 : -y,
  };
}

/**
 * 根据经纬度和高度设置相机位置
 *
 * @param {THREE.Camera} camera - Three.js相机对象
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @param {number} heightKm - 高度（公里）
 * @param {Function} projection - 投影函数
 */
export function setCameraPositionByLatLng(camera, lng, lat, heightKm, projection) {
  const sceneCoords = latLngToSceneCoords(lng, lat, projection);
  const SCENE_UNITS_PER_KM = 0.1;
  const sceneHeight = heightKm * SCENE_UNITS_PER_KM;
  const offset = sceneHeight * 0.8;
  camera.position.set(sceneCoords.x - offset, sceneHeight, sceneCoords.z - offset);
}

/**
 * 设置相机看向指定经纬度
 *
 * @param {THREE.Camera} camera - Three.js相机对象
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @param {Function} projection - 投影函数
 * @param {{x: number, y: number}} offset - 位置偏移量（可选）
 */
export function setCameraLookAtLatLng(camera, lng, lat, projection, offset = { x: 0, z: 0 }) {
  const targetCoords = latLngToSceneCoords(lng, lat, projection);
  camera.lookAt(targetCoords.x - offset.x, 0, targetCoords.z - offset.z);
}
