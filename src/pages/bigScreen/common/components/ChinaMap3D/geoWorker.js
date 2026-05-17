import { geoMercator, geoPath } from 'd3-geo';

function createProjection(featureCollection, extent) {
  const projection = geoMercator().fitExtent(
    [
      [extent[0], extent[1]],
      [extent[2], extent[3]],
    ],
    featureCollection
  );
  return projection;
}

function projectCoordinates(coordinates, projection) {
  const n = coordinates.length;
  const projected = new Float64Array(n);
  for (let i = 0; i < n; i += 2) {
    const [x, y] = projection([coordinates[i], coordinates[i + 1]]) || [0, 0];
    projected[i] = x;
    projected[i + 1] = -y;
  }
  return projected;
}

function computeBoundingBox(points) {
  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  const n = points.length;
  for (let i = 0; i < n; i += 2) {
    const x = points[i];
    const y = points[i + 1];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  return { minX, minY, maxX, maxY };
}

function scalePoints(points, centerX, centerY, scaleFactor) {
  const n = points.length;
  const result = new Float64Array(n);
  for (let i = 0; i < n; i += 2) {
    result[i] = (points[i] - centerX) * scaleFactor + centerX;
    result[i + 1] = (points[i + 1] - centerY) * scaleFactor + centerY;
  }
  return result;
}

function computeWallGeometry(innerPoints, outerPoints, edgeHeight) {
  const n = innerPoints.length / 2;
  const halfHeight = edgeHeight / 2;

  let totalLength = 0;
  for (let i = 0; i < n; i++) {
    const i2 = ((i + 1) % n) * 2;
    const x1 = outerPoints[i * 2];
    const y1 = outerPoints[i * 2 + 1];
    const x2 = outerPoints[i2];
    const y2 = outerPoints[i2 + 1];
    totalLength += Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  const wallPositions = new Float64Array(n * 12);
  const wallUvs = new Float64Array(n * 8);
  const wallIndices = new Uint32Array(n * 6);

  let currentLength = 0;
  for (let i = 0; i < n; i++) {
    const i2 = ((i + 1) % n) * 2;

    const outerX1 = outerPoints[i * 2];
    const outerY1 = outerPoints[i * 2 + 1];
    const outerX2 = outerPoints[i2];
    const outerY2 = outerPoints[i2 + 1];

    const segmentLength = Math.sqrt((outerX2 - outerX1) ** 2 + (outerY2 - outerY1) ** 2);

    const idx = i * 12;
    wallPositions[idx] = outerX1;
    wallPositions[idx + 1] = outerY1;
    wallPositions[idx + 2] = -halfHeight;
    wallPositions[idx + 3] = outerX1;
    wallPositions[idx + 4] = outerY1;
    wallPositions[idx + 5] = halfHeight;
    wallPositions[idx + 6] = outerX2;
    wallPositions[idx + 7] = outerY2;
    wallPositions[idx + 8] = halfHeight;
    wallPositions[idx + 9] = outerX2;
    wallPositions[idx + 10] = outerY2;
    wallPositions[idx + 11] = -halfHeight;

    const u1 = currentLength / totalLength;
    const u2 = (currentLength + segmentLength) / totalLength;

    const uvIdx = i * 8;
    wallUvs[uvIdx] = u1;
    wallUvs[uvIdx + 1] = 1;
    wallUvs[uvIdx + 2] = u1;
    wallUvs[uvIdx + 3] = 0;
    wallUvs[uvIdx + 4] = u2;
    wallUvs[uvIdx + 5] = 0;
    wallUvs[uvIdx + 6] = u2;
    wallUvs[uvIdx + 7] = 1;

    currentLength += segmentLength;

    const baseIndex = i * 4;
    wallIndices[i * 6] = baseIndex;
    wallIndices[i * 6 + 1] = baseIndex + 1;
    wallIndices[i * 6 + 2] = baseIndex + 2;
    wallIndices[i * 6 + 3] = baseIndex;
    wallIndices[i * 6 + 4] = baseIndex + 2;
    wallIndices[i * 6 + 5] = baseIndex + 3;
  }

  return { wallPositions, wallUvs, wallIndices };
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

function processFeature(feature, projection, edgeHeight, wallThickness) {
  const result = {
    name: feature.properties.name,
    polygons: [],
  };

  const geometry = feature.geometry;

  function processPolygon(polygonCoords) {
    if (!polygonCoords || polygonCoords.length === 0) return null;

    const ringCoords = polygonCoords[0];
    const flatCoords = flattenCoordinates([ringCoords]);
    const innerPoints = projectCoordinates(flatCoords, projection);
    const bbox = computeBoundingBox(innerPoints);

    const centerX = (bbox.maxX + bbox.minX) / 2;
    const centerY = (bbox.maxY + bbox.minY) / 2;
    const size = Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY);
    const scaleFactor = 1 + wallThickness / size;

    const outerPoints = scalePoints(innerPoints, centerX, centerY, scaleFactor);
    const wallData = computeWallGeometry(innerPoints, outerPoints, edgeHeight);

    const innerPointsArray = [];
    for (let i = 0; i < innerPoints.length; i += 2) {
      innerPointsArray.push({ x: innerPoints[i], y: innerPoints[i + 1] });
    }

    const outerPointsArray = [];
    for (let i = 0; i < outerPoints.length; i += 2) {
      outerPointsArray.push({ x: outerPoints[i], y: outerPoints[i + 1] });
    }

    return {
      innerPoints: innerPointsArray,
      outerPoints: outerPointsArray,
      wallPositions: Array.from(wallData.wallPositions),
      wallUvs: Array.from(wallData.wallUvs),
      wallIndices: Array.from(wallData.wallIndices),
      bbox: { min: { x: bbox.minX, y: bbox.minY }, max: { x: bbox.maxX, y: bbox.maxY } },
    };
  }

  if (geometry.type === 'Polygon') {
    const polygonData = processPolygon(geometry.coordinates);
    if (polygonData) result.polygons.push(polygonData);
  } else if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      const polygonData = processPolygon(polygon);
      if (polygonData) result.polygons.push(polygonData);
    }
  }

  return result;
}

let projection = null;

self.onmessage = function (e) {
  const { type, data } = e.data;

  if (type === 'init') {
    projection = createProjection(data.featureCollection, data.extent);
    self.postMessage({ type: 'ready' });
  }

  if (type === 'processFeature') {
    const result = processFeature(data.feature, projection, data.edgeHeight, data.wallThickness);
    self.postMessage({ type: 'featureResult', data: result });
  }

  if (type === 'processAll') {
    const { features, edgeHeight, wallThickness } = data;
    const results = [];
    for (let i = 0; i < features.length; i++) {
      const result = processFeature(features[i], projection, edgeHeight, wallThickness);
      results.push(result);
      if (i % 5 === 0) {
        self.postMessage({ type: 'progress', data: { current: i + 1, total: features.length } });
      }
    }
    self.postMessage({ type: 'allResults', data: results });
  }
};
