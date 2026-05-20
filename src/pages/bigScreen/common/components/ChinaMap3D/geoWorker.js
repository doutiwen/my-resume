/**
 * geoWorker.js - 地理数据处理Web Worker
 *
 * 功能说明：
 * - 在后台线程中处理省份GeoJSON数据
 * - 将经纬度坐标转换为平面坐标（墨卡托投影）
 * - 计算省份多边形的包围盒和缩放因子
 * - 生成省份围墙的几何数据（顶点位置、纹理坐标、索引）
 *
 * 为什么使用Web Worker：
 * - 地理数据处理是CPU密集型操作
 * - 在主线程执行会阻塞UI，导致页面卡顿
 * - Web Worker在后台线程执行，不影响页面响应
 *
 * 消息协议：
 * - 接收 'init': 初始化投影
 * - 接收 'processFeature': 处理单个省份
 * - 接收 'processAll': 批量处理所有省份
 * - 发送 'ready': 初始化完成
 * - 发送 'progress': 处理进度
 * - 发送 'featureResult': 单个省份处理结果
 * - 发送 'allResults': 所有省份处理完成
 */

import { createSharedProjection } from './utils.js';

/**
 * 将坐标数组投影为平面坐标
 *
 * @param {Float64Array|number[]} coordinates - 坐标数组 [lon1, lat1, lon2, lat2, ...]
 * @param {Function} projection - 投影函数
 * @returns {Float64Array} 投影后的坐标数组 [x1, z1, x2, z2, ...]（渲染在XZ平面）
 */
function projectCoordinates(coordinates, projection) {
  const n = coordinates.length;
  const projected = new Float64Array(n);

  // 每两个元素为一组经纬度坐标
  for (let i = 0; i < n; i += 2) {
    // 调用投影函数将经纬度转为平面坐标
    const [x, y] = projection([coordinates[i], coordinates[i + 1]]) || [0, 0];
    // 存储投影后的坐标，lat映射到Z轴，取反（GeoJSON的y轴向下，Three.js的z轴向上）
    projected[i] = isNaN(x) ? 0 : x;
    projected[i + 1] = isNaN(y) ? 0 : -y;
  }
  return projected;
}

/**
 * 计算坐标数组的包围盒
 *
 * @param {Float64Array} points - 坐标数组 [x1, y1, x2, y2, ...]
 * @returns {Object} 包围盒 {minX, minY, maxX, maxY}
 */
function computeBoundingBox(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const n = points.length;
  // 每两个元素为一组坐标
  for (let i = 0; i < n; i += 2) {
    const x = points[i];
    const y = points[i + 1];

    // 更新最小值和最大值
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  return { minX, minY, maxX, maxY };
}

/**
 * 按中心点和缩放因子变换所有坐标
 *
 * @param {Float64Array} points - 原始坐标数组
 * @param {number} centerX - 中心点X
 * @param {number} centerY - 中心点Y
 * @param {number} scaleFactor - 缩放因子（1表示不缩放）
 * @returns {Float64Array} 缩放后的坐标数组
 */
function scalePoints(points, centerX, centerY, scaleFactor) {
  const n = points.length;
  const result = new Float64Array(n);

  for (let i = 0; i < n; i += 2) {
    // 以中心点为基准，按比例缩放坐标
    result[i] = (points[i] - centerX) * scaleFactor + centerX;
    result[i + 1] = (points[i + 1] - centerY) * scaleFactor + centerY;
  }
  return result;
}

/**
 * 计算省份围墙的几何数据
 *
 * 围墙是连接内边界和外边界的垂直侧面，
 * 形成省份的3D立体效果
 *
 * @param {Float64Array} innerPoints - 内边界坐标数组
 * @param {Float64Array} outerPoints - 外边界坐标数组
 * @param {number} edgeHeight - 围墙高度
 * @returns {Object} 围墙几何数据 {wallPositions, wallUvs, wallIndices}
 */
function computeWallGeometry(innerPoints, outerPoints, edgeHeight) {
  // 内边界点的数量
  const n = innerPoints.length / 2;
  // 围墙高度的一半（围墙在Y轴方向从-halfHeight到+halfHeight，地图渲染在XZ平面）
  const halfHeight = edgeHeight / 2;

  // 计算围墙外边界的总长度（用于纹理坐标映射）
  let totalLength = 0;
  for (let i = 0; i < n; i++) {
    const i2 = ((i + 1) % n) * 2; // 下一个点的索引（环形）
    const x1 = outerPoints[i * 2];
    const z1 = outerPoints[i * 2 + 1];
    const x2 = outerPoints[i2];
    const z2 = outerPoints[i2 + 1];
    // 计算当前边的长度
    totalLength += Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
  }

  // 分配围墙顶点缓冲区
  // 每个边界点生成4个顶点（左下、右下、右上、左上）
  // 每个顶点3个分量（x, y, z），渲染在XZ平面，高度在Y轴
  const wallPositions = new Float64Array(n * 12); // n * 4 vertices * 3 components
  const wallUvs = new Float64Array(n * 8); // n * 4 vertices * 2 components (u, v)
  const wallIndices = new Uint32Array(n * 6); // n * 2 triangles * 3 indices

  let currentLength = 0; // 累计长度（用于UV映射）

  // 遍历每个边界点
  for (let i = 0; i < n; i++) {
    const i2 = ((i + 1) % n) * 2; // 下一个点的索引

    // 外边界的当前点和下一个点（XZ平面）
    const outerX1 = outerPoints[i * 2];
    const outerZ1 = outerPoints[i * 2 + 1];
    const outerX2 = outerPoints[i2];
    const outerZ2 = outerPoints[i2 + 1];

    // 计算当前边的长度
    const segmentLength = Math.sqrt((outerX2 - outerX1) ** 2 + (outerZ2 - outerZ1) ** 2);

    // 计算当前点生成的4个顶点位置
    // 索引偏移量（每个点4个顶点，每顶点3个分量）
    const idx = i * 12;

    // 左下顶点（外墙底边）
    wallPositions[idx] = outerX1;
    wallPositions[idx + 1] = -halfHeight; // Y轴为高度
    wallPositions[idx + 2] = outerZ1;

    // 左上顶点（外墙顶边）
    wallPositions[idx + 3] = outerX1;
    wallPositions[idx + 4] = halfHeight; // Y轴为高度
    wallPositions[idx + 5] = outerZ1;

    // 右上顶点（下一个点的外墙顶边）
    wallPositions[idx + 6] = outerX2;
    wallPositions[idx + 7] = halfHeight; // Y轴为高度
    wallPositions[idx + 8] = outerZ2;

    // 右下顶点（下一个点的外墙底边）
    wallPositions[idx + 9] = outerX2;
    wallPositions[idx + 10] = -halfHeight; // Y轴为高度
    wallPositions[idx + 11] = outerZ2;

    // 计算当前边在总长度中的UV位置
    // u坐标：累计长度/总长度
    // v坐标：0表示底边，1表示顶边
    const u1 = currentLength / totalLength;
    const u2 = (currentLength + segmentLength) / totalLength;

    // UV索引偏移量
    const uvIdx = i * 8;

    // 左下顶点UV（左下角）
    wallUvs[uvIdx] = u1;
    wallUvs[uvIdx + 1] = 1;

    // 左上顶点UV（左上角）
    wallUvs[uvIdx + 2] = u1;
    wallUvs[uvIdx + 3] = 0;

    // 右上顶点UV（右上角）
    wallUvs[uvIdx + 4] = u2;
    wallUvs[uvIdx + 5] = 0;

    // 右下顶点UV（右下角）
    wallUvs[uvIdx + 6] = u2;
    wallUvs[uvIdx + 7] = 1;

    // 累计长度
    currentLength += segmentLength;

    // 计算顶点索引
    // 每个矩形单元由两个三角形组成
    const baseIndex = i * 4;

    // 第一个三角形（左下、左上、右上）
    wallIndices[i * 6] = baseIndex;
    wallIndices[i * 6 + 1] = baseIndex + 1;
    wallIndices[i * 6 + 2] = baseIndex + 2;

    // 第二个三角形（左下、右上、右下）
    wallIndices[i * 6 + 3] = baseIndex;
    wallIndices[i * 6 + 4] = baseIndex + 2;
    wallIndices[i * 6 + 5] = baseIndex + 3;
  }

  return { wallPositions, wallUvs, wallIndices };
}

/**
 * 将嵌套坐标数组扁平化为一位数组
 *
 * GeoJSON的coordinates是嵌套数组，需要扁平化为一维数组便于处理
 *
 * @param {Array} coordinates - GeoJSON嵌套坐标数组
 * @returns {Float64Array} 扁平化后的坐标数组
 */
function flattenCoordinates(coordinates) {
  const flat = [];

  // 递归遍历所有坐标
  function flatten(arr) {
    for (const item of arr) {
      // 如果是第一层数字（经度），则item[0]是数字
      if (typeof item[0] === 'number') {
        // [longitude, latitude]
        flat.push(item[0], item[1]);
      } else {
        // 继续递归
        flatten(item);
      }
    }
  }

  flatten(coordinates);
  return new Float64Array(flat);
}

/**
 * 处理单个GeoJSON要素（省份）
 *
 * @param {Object} feature - GeoJSON Feature对象
 * @param {Function} projection - 投影函数
 * @param {number} edgeHeight - 围墙高度
 * @param {number} wallThickness - 围墙厚度
 * @returns {Object} 处理后的省份数据
 */
function processFeature(feature, projection, edgeHeight, wallThickness) {
  // 初始化结果对象
  const result = {
    name: feature.properties?.name || 'Unknown', // 省份名称，默认Unknown
    polygons: [], // 多边形数组
  };

  const geometry = feature.geometry;

  // 检查几何有效性
  if (!geometry || !geometry.coordinates) {
    console.warn('Skipping feature with invalid geometry');
    return result;
  }

  /**
   * 处理单个多边形
   *
   * @param {Array} polygonCoords - 多边形坐标数组
   * @returns {Object|null} 处理后的多边形数据
   */
  function processPolygon(polygonCoords) {
    // 检查坐标有效性
    if (!polygonCoords || polygonCoords.length === 0) return null;

    // 获取外边界环（第一个环是外边界）
    const ringCoords = polygonCoords[0];
    if (!ringCoords || ringCoords.length < 3) return null; // 至少需要3个点

    // 扁平化坐标
    const flatCoords = flattenCoordinates([ringCoords]);
    if (flatCoords.length < 6) return null; // 至少需要3个点 * 2个分量

    // 投影坐标
    const innerPoints = projectCoordinates(flatCoords, projection);

    // 计算包围盒
    const bbox = computeBoundingBox(innerPoints);

    // 检查包围盒有效性
    if (isNaN(bbox.minX) || isNaN(bbox.minY) || isNaN(bbox.maxX) || isNaN(bbox.maxY)) {
      console.warn('Skipping polygon with invalid bounding box');
      return null;
    }

    // 计算中心点和尺寸
    const centerX = (bbox.maxX + bbox.minX) / 2;
    const centerY = (bbox.maxY + bbox.minY) / 2;
    const size = Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY);

    // 检查尺寸有效性
    if (size <= 0) {
      console.warn(`Skipping polygon with zero size. Name: ${result.name}, bbox: `, bbox);
      console.log('Sample coordinates:', flatCoords.slice(0, 10));
      return null;
    }

    // 计算缩放因子：
    // 通过增加一定厚度的外围，创建围墙效果
    // wallThickness / size 是相对于尺寸的厚度比例
    const scaleFactor = 1 + wallThickness / size;

    // 生成外边界坐标（带厚度的边界）
    const outerPoints = scalePoints(innerPoints, centerX, centerY, scaleFactor);

    // 计算围墙几何数据
    const wallData = computeWallGeometry(innerPoints, outerPoints, edgeHeight);

    // 转换为对象数组格式（便于后续处理）
    // 地图渲染在XZ平面，所以坐标是 {x, z}
    const innerPointsArray = [];
    for (let i = 0; i < innerPoints.length; i += 2) {
      innerPointsArray.push({ x: innerPoints[i], z: innerPoints[i + 1] });
    }

    const outerPointsArray = [];
    for (let i = 0; i < outerPoints.length; i += 2) {
      outerPointsArray.push({ x: outerPoints[i], z: outerPoints[i + 1] });
    }

    // 返回多边形数据
    return {
      innerPoints: innerPointsArray, // 内边界点
      outerPoints: outerPointsArray, // 外边界点
      wallPositions: Array.from(wallData.wallPositions), // 围墙顶点位置
      wallUvs: Array.from(wallData.wallUvs), // 围墙纹理坐标
      wallIndices: Array.from(wallData.wallIndices), // 围墙顶点索引
      bbox: {
        // 包围盒（XZ平面）
        min: { x: bbox.minX, z: bbox.minY },
        max: { x: bbox.maxX, z: bbox.maxY },
      },
    };
  }

  // 根据几何类型处理
  if (geometry.type === 'Polygon') {
    // 单个多边形
    const polygonData = processPolygon(geometry.coordinates);
    if (polygonData) result.polygons.push(polygonData);
  } else if (geometry.type === 'MultiPolygon') {
    // 多个多边形（如有岛屿的省份）
    for (const polygon of geometry.coordinates) {
      const polygonData = processPolygon(polygon);
      if (polygonData) result.polygons.push(polygonData);
    }
  }

  return result;
}

// Worker全局变量：投影函数
let projection = null;

/**
 * Web Worker的消息处理函数
 *
 * 处理来自主线程的消息并返回处理结果
 */
self.onmessage = function (e) {
  const { type, data } = e.data;

  // 初始化投影
  if (type === 'init') {
    // 创建投影函数（使用共享的投影创建函数）
    projection = createSharedProjection(data.featureCollection, data.extent);
    // 通知主线程初始化完成
    self.postMessage({ type: 'ready' });
  }

  // 处理单个省份
  if (type === 'processFeature') {
    const result = processFeature(data.feature, projection, data.edgeHeight, data.wallThickness);
    self.postMessage({ type: 'featureResult', data: result });
  }

  // 批量处理所有省份
  if (type === 'processAll') {
    const { features, edgeHeight, wallThickness } = data;

    console.log(`Processing ${features.length} features`);

    const results = [];

    // 遍历每个省份进行处理
    for (let i = 0; i < features.length; i++) {
      const result = processFeature(features[i], projection, edgeHeight, wallThickness);

      console.log(
        `Feature ${i} processed, name: ${result.name}, polygons: ${result.polygons.length}`
      );

      results.push(result);

      // 每处理5个省份发送一次进度更新
      if (i % 5 === 0) {
        self.postMessage({
          type: 'progress',
          data: { current: i + 1, total: features.length },
        });
      }
    }

    // 过滤出有有效多边形的结果
    const validResults = results.filter((r) => r.polygons.length > 0);

    console.log(`Processed ${results.length} features, ${validResults.length} have valid polygons`);

    // 发送所有处理结果
    self.postMessage({ type: 'allResults', data: validResults });
  }
};
