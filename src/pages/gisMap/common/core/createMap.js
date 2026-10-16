import { isArray, maxBy, minBy } from 'lodash-es';
import MapLayer from './AddMapLayer';
import { render } from 'vue';
import Control from './Control';
import BaseMap from './BaseMap';
import Legend from './Legend';
import CreateTooltip from './Tooltip';

import { Extent, Expand } from '../modules';
import { WidgetPositionClass, WidgetPositionEnum } from './types';
import MapCursor from './SetMapCursor';

class ArcgisMap {
  constructor(props) {
    const { Map, MapView, config } = props;
    this.config = config;
    this.Map = Map;
    this.MapView = MapView;
    this.defaultExtent = { xmin: 0, xmax: 0, ymin: 0, ymax: 0 };
    this.LayerControl = config?.widgets?.control
      ? new Control({ mapInstance: this })
      : undefined;
    this.BaseMapIns = config?.baseData?.baseMap?.length
      ? new BaseMap({ mapInstance: this, config: config })
      : undefined;
    this.LayerLegend = config?.widgets?.legend
      ? new Legend({ mapInstance: this })
      : undefined;
  }

  updateContext(props) {
    const { Map, MapView } = props;
    this.Map = Map;
    this.MapView = MapView;
    this.Map?.allLayers.on('change', (event) => {
      if (event.added.length) {
        this.reorderLayer();
      }
    });
  }

  updateDefaultExtent() {
    const { MapView } = this;
    if (MapView.extent) {
      const { xmin, xmax, ymin, ymax } = MapView.extent;
      this.defaultExtent = { xmin, xmax, ymin, ymax };
    }
  }

  addMapWidget(props) {
    const { element, position, hasExpand, icon, className, widgetCode } = props;

    const { MapView } = this;
    const ele = document.createElement('div');
    ele.className = className
      ? `${WidgetPositionClass[position]} ${className}`
      : `${WidgetPositionClass[position]}`;
    render(element, ele);
    const _expand = new Expand({
      view: MapView,
      content: ele,
      expanded: true,
      expandIconClass: icon,
      group: 'widget-group',
    });
    const widget = hasExpand ? _expand : ele;
    this.Widgets?.push({
      widgetCode,
      widget,
    });
    MapView.ui.add(widget, WidgetPositionEnum[position]);
  }

  createTooltip(props) {
    return CreateTooltip.call(this, props);
  }

  removeAllWidget() {
    const widgets = this.Widgets;
    if (widgets && widgets.length) {
      widgets.forEach((cp) => {
        cp.widget?.destroy();
      });
    }
  }

  loadMapLayer(props) {
    const { Map, MapView } = this;
    return MapLayer({ Map, MapView }).loadMap(props);
  }

  addMapLayerToMap(props, index) {
    const { Map, MapView } = this;
    return MapLayer({ Map, MapView }).addLayerToMap(props, index);
  }

  setMapCursor(type) {
    MapCursor().setMapCursor.call(this, type);
  }

  removeLayer(props) {
    const { layer } = props;
    const { Map } = this;
    Map.remove(layer);
  }

  onLocate(data) {
    let xmin = 0;
    let xmax = 0;
    let ymin = 0;
    let ymax = 0;
    if (isArray(data)) {
      const extents = data.map((item) => {
        if (item?.geometry) {
          if (item.geometry.type === 'point') {
            return {
              xmin: item.geometry.x,
              xmax: item.geometry.x,
              ymin: item.geometry.y,
              ymax: item.geometry.y,
            };
          }
          return {
            xmin: item.geometry.extent.xmin,
            xmax: item.geometry.extent.xmax,
            ymin: item.geometry.extent.ymin,
            ymax: item.geometry.extent.ymax,
          };
        }
        return {
          xmin: item.xmin,
          xmax: item.xmax,
          ymin: item.ymin,
          ymax: item.ymax,
        };
      });
      xmin = minBy(extents, 'xmin').xmin;
      xmax = maxBy(extents, 'xmax').xmax;
      ymin = minBy(extents, 'ymin').ymin;
      ymax = maxBy(extents, 'ymax').ymax;
    } else {
      xmin = data.xmin;
      xmax = data.xmax;
      ymin = data.ymin;
      ymax = data.ymax;
    }
    const xOffset = (xmax - xmin) / 2;
    const yOffset = (ymax - ymin) / 2;
    this.MapView.goTo(
      new Extent({
        xmin: xmin - xOffset,
        xmax: xmax + xOffset,
        ymin: ymin - yOffset,
        ymax: ymax + yOffset,
        spatialReference: this.MapView.spatialReference,
      })
    );
  }

  reorderLayer(layerIds) {
    const { allLayers } = this.Map;

    const BaseLayers = allLayers.filter(
      (d) => d.groupType === 'BaseLayer'
    );
    let DefaultLayers = [];
    if (!layerIds) {
      DefaultLayers = allLayers.filter(
        (d) => d.groupType === 'DefaultLayer'
      );
    } else {
      layerIds.forEach((id) => {
        DefaultLayers.push(allLayers.find((layer) => layer.id === id));
      });
    }
    const SketchLayers = allLayers.filter(
      (d) => d.groupType === 'SketchLayer'
    );
    const AnalysisLayers = allLayers.filter(
      (d) => d.groupType === 'AnalysisLayer'
    );
    const TopLayers = allLayers.filter((d) => d.groupType === 'TopLayer');

    let currentIndex = BaseLayers.length;

    const reorder = (...rest) => {
      rest.forEach((layers) => {
        if (layers.length) {
          layers.forEach((layer, index) => {
            this.Map.reorder(layer, currentIndex + index);
          });
          currentIndex += layers.length;
        }
      });
    };
    reorder(DefaultLayers, SketchLayers, TopLayers, AnalysisLayers);
  }
}

const useArcgisMap = (props) => {
  return new ArcgisMap(props);
};

export default useArcgisMap;
