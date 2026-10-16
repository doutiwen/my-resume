import { geoMercator, geoBounds } from 'd3-geo';

export function createProjection(featureCollection, extent = { width: 500, height: 500 }) {
  const { width, height } = extent;
  const projection = geoMercator().fitSize([width, height], featureCollection);
  const translate = projection.translate();
  return { translate };
}

export function createProjectionWithScaleTranslate(translate, center = [102, 25]) {
  return geoMercator().translate(translate).scale(1000).center(center);
}
