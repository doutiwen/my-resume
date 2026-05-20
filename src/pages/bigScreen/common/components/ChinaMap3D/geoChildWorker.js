/**
 * geoChildWorker.js - 子Worker，用于处理单个省份的地理数据
 *
 * 功能说明：
 * - 每个子Worker实例处理单个省份的GeoJSON数据
 * - 使用turf.buffer对原始GeoJSON进行内缩缓冲
 * - 使用projection将经纬度坐标转换为平面坐标（墨卡托投影）
 *
 * 此文件由主Worker通过URL创建，负责实际的地理数据处理逻辑
 */

import { createSharedProjection } from './utils.js';
import * as turf from '@turf/turf';

let projection = null;
let wallThickness = 0.01;

function projectCoordinates(coordinates, projection) {
  const n = coordinates.length;
  const projected = new Float64Array(n);

  for (let i = 0; i < n; i += 2) {
    const [x, y] = projection([coordinates[i], coordinates[i + 1]]) || [0, 0];
    projected[i] = isNaN(x) ? 0 : x;
    projected[i + 1] = isNaN(y) ? 0 : -y;
  }
  return projected;
}

function flattenCoordinates(coordinates) {
  const flat = [];

  function flatten(arr) {
    for (const item of arr) {
      if (typeof item[0] === 'number') {
        flat.push(item[0], item[1]);
      } else {
        flatten(item);
      }
    }
  }

  flatten(coordinates);
  return new Float64Array(flat);
}

function bufferPolygon(ringCoords) {
  if (!ringCoords || ringCoords.length < 3) {
    return null;
  }

  try {
    const polygon = turf.polygon([ringCoords]);
    const buffered = turf.buffer(polygon, -wallThickness, { units: 'degrees' });

    if (!buffered || !buffered.geometry || !buffered.geometry.coordinates) {
      return null;
    }

    const innerRing = buffered.geometry.coordinates[0];
    if (!innerRing || innerRing.length < 3) {
      return null;
    }

    return innerRing;
  } catch (error) {
    return null;
  }
}

function processPolygon(polygonCoords, projection) {
  if (!polygonCoords || polygonCoords.length === 0) return null;

  const outerRing = polygonCoords[0];
  if (!outerRing || outerRing.length < 3) return null;

  const innerRing = bufferPolygon(outerRing);

  const flatOuterCoords = flattenCoordinates([outerRing]);
  if (flatOuterCoords.length < 6) return null;
  const projectedOuter = projectCoordinates(flatOuterCoords, projection);

  const outerPoints = [];
  for (let i = 0; i < projectedOuter.length; i += 2) {
    outerPoints.push({ x: projectedOuter[i], z: projectedOuter[i + 1] });
  }

  let innerPoints = null;
  if (innerRing) {
    const flatInnerCoords = flattenCoordinates([innerRing]);
    if (flatInnerCoords.length >= 6) {
      const projectedInner = projectCoordinates(flatInnerCoords, projection);
      innerPoints = [];
      for (let i = 0; i < projectedInner.length; i += 2) {
        innerPoints.push({ x: projectedInner[i], z: projectedInner[i + 1] });
      }
    }
  }

  return {
    points: outerPoints,
    innerPoints: innerPoints,
  };
}

function processFeature(feature, projection) {
  const result = {
    name: feature.properties?.name || 'Unknown',
    polygons: [],
  };

  const geometry = feature.geometry;

  if (!geometry || !geometry.coordinates) {
    return result;
  }

  if (geometry.type === 'Polygon') {
    const polygonData = processPolygon(geometry.coordinates, projection);
    if (polygonData) result.polygons.push(polygonData);
  } else if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      const polygonData = processPolygon(polygon, projection);
      if (polygonData) result.polygons.push(polygonData);
    }
  }

  return result;
}

self.onmessage = function (e) {
  const { type, data } = e.data;

  if (type === 'init') {
    projection = createSharedProjection(data.featureCollection, data.extent);
    wallThickness = data.wallThickness !== undefined ? data.wallThickness : 0.01;
    self.postMessage({ type: 'ready' });
  }

  if (type === 'process') {
    const { feature, featureIndex } = data;
    const result = processFeature(feature, projection);
    self.postMessage({
      type: 'result',
      data: { result, featureIndex },
    });
  }
};