import { TileLayer, BaseTileLayer, TileInfo, Point, Extent, SpatialReference } from '../../modules';
import { RegionExtent } from './RegionExtent';

const CustomTileLayer = (props) => {
    const { url, region, otherProps } = props;

    const TileLayerClass = BaseTileLayer.createSubclass({
        properties: {
            urlTemplate: null,
        },
        getTileUrl: function (level, row, col) {
            return this.urlTemplate
                .replace('{x}', col)
                .replace('{y}', row)
                .replace('{z}', level);
        },
        fetchTile: function (level, row, col, options) {
            const url = this.getTileUrl(level, row, col);
            return fetch(url, { signal: options?.signal })
                .then((response) => response.blob())
                .then((blob) => {
                    const img = document.createElement('img');
                    img.src = URL.createObjectURL(blob);
                    return img.decode().then(() => img);
                })
                .catch(() => {
                    return null;
                });
        },
    });

    const tileInfo = new TileInfo({
        dpi: 96,
        rows: 256,
        cols: 256,
        compressionQuality: 0,
        origin: {
            x: -180,
            y: 90,
        },
        spatialReference: {
            wkid: 4326,
        },
        lods: [
            { level: 0, resolution: 0.703125, scale: 295497598.5708346 },
            { level: 1, resolution: 0.3515625, scale: 147748799.2854173 },
            { level: 2, resolution: 0.17578125, scale: 73874399.64270864 },
            { level: 3, resolution: 0.087890625, scale: 36937199.82135432 },
            { level: 4, resolution: 0.0439453125, scale: 18468599.91067716 },
            { level: 5, resolution: 0.02197265625, scale: 9234299.95533858 },
            { level: 6, resolution: 0.010986328125, scale: 4617149.97766929 },
            { level: 7, resolution: 0.0054931640625, scale: 2308574.988834645 },
            { level: 8, resolution: 0.00274658203125, scale: 1154287.494417322 },
            { level: 9, resolution: 0.001373291015625, scale: 577143.747208661 },
            { level: 10, resolution: 0.0006866455078125, scale: 288571.8736043305 },
            { level: 11, resolution: 0.00034332275390625, scale: 144285.93680216525 },
            { level: 12, resolution: 0.000171661376953125, scale: 72142.96840108263 },
            { level: 13, resolution: 8.58306884765625e-05, scale: 36071.484200541314 },
            { level: 14, resolution: 4.291534423828125e-05, scale: 18035.742100270657 },
            { level: 15, resolution: 2.1457672119140625e-05, scale: 9017.871050135328 },
            { level: 16, resolution: 1.0728836059570312e-05, scale: 4508.935525067664 },
            { level: 17, resolution: 5.364418029785156e-06, scale: 2254.467762533832 },
        ],
    });

    let fullExtent = new Extent({
        xmin: -180,
        ymin: -90,
        xmax: 180,
        ymax: 90,
        spatialReference: { wkid: 4326 },
    });

    if (region && RegionExtent[region]) {
        const [xmin, ymin, xmax, ymax] = RegionExtent[region].extent;
        fullExtent = new Extent({
            xmin,
            ymin,
            xmax,
            ymax,
            spatialReference: { wkid: 4326 },
        });
    }

    return new TileLayerClass({
        urlTemplate: url,
        tileInfo,
        fullExtent,
        spatialReference: new SpatialReference({ wkid: 4326 }),
        ...otherProps,
    });
};

export default CustomTileLayer;
