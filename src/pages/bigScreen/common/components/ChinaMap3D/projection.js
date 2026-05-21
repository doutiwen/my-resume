import { geoMercator } from 'd3-geo';

export function createProjection(featureCollection, extent = { width: 500, height: 500 }) {
  const { width, height } = extent;
  const projection = geoMercator().fitExtent(
    [
      [0, 0],
      [width, height],
    ],
    featureCollection
  );
  const scale = projection.scale();
  const translate = projection.translate();
  console.log('projection', featureCollection, width, height, scale, translate);
  return { scale, translate };
}

export function createProjectionWithScaleTranslate(scale, translate) {
  return geoMercator().scale(scale).translate(translate).center([108, 34]);
}
