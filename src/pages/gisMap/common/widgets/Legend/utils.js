import { isArray } from 'lodash-es';
import { GetUniqKey } from '@/utils';

export const QueryTableLayerLegend = (layer) => {
    return new Promise((resolve) => {
      const { title, id, renderer } = layer;
      let legend = [];
      switch (renderer.type) {
        case 'unique-value':
          legend = renderer.uniqueValueInfos.map((item) => {
            const { label, symbol } = item;
            return {
              label,
              width: 20,
              height: 20,
              contentType: 'color',
              color: symbol.color.toHex(),
            };
          });
          break;
        case 'class-breaks':
          legend = renderer.classBreakInfos.map((item) => {
            const { label, symbol } = item;
            return {
              label,
              width: 20,
              height: 20,
              contentType: 'color',
              color: symbol.color.toHex(),
            };
          });
          break;
        case 'pie-chart':
          legend = renderer.attributes.map((item) => {
            const { label, color } = item;
            return {
              label,
              width: 20,
              height: 20,
              contentType: 'color',
              color: color.toHex(),
            };
          });
          break;
        default:
          break;
      }
      resolve({
        data: {
          layers: [
            {
              legend,
              layerId: id,
              layerName: layer.tableUnit ? `${title}` : title,
              layerType: 'Feature Layer',
              minScale: 0,
              maxScale: 0,
            },
          ],
        },
      });
    });
  };
  
export const FormatLegend = (data) => {
const dataTemp = [];
if (isArray(data) && data.length) {
    data.forEach((d) => {
    const dataId = GetUniqKey();
    const temp = { ...d, legend: [] };
    temp.id = dataId;
    const { legend } = d;
    if (legend && legend.length) {
        legend.forEach((item) => {
        temp.legend.push({
            ...item,
            id: GetUniqKey(),
            fid: dataId,
        });
        });
    }
    dataTemp.push(temp);
    });
} else {
    const dataId = GetUniqKey();
    const temp = { ...data, legend: [] };
    temp.id = dataId;
    const { legend } = data;
    if (legend && legend.length) {
    legend.forEach((item) => {
        temp.legend.push({
        ...item,
        id: GetUniqKey(),
        fid: dataId,
        });
    });
    }
    dataTemp.push(temp);
}
return dataTemp;
};
