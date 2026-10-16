import {
    Point,
    Polyline,
    Polygon,
    Circle,
    Graphic,
    SimpleFillSymbol,
    SimpleLineSymbol,
    geometryEngine,
} from '../../modules';

export const generatePoint = (point, symbol) => {
    return new Graphic({
        geometry: new Point({
            x: point.x,
            y: point.y,
            spatialReference: point.spatialReference,
        }),
        symbol: symbol,
        attributes: {
            type: 'point',
        },
    });
};

export const generateLine = (points, symbol) => {
    const polyline = new Polyline({
        paths: [points.map((p) => [p.x, p.y])],
        spatialReference: points[0]?.spatialReference,
    });
    return new Graphic({
        geometry: polyline,
        symbol: symbol,
        attributes: {
            type: 'polyline',
        },
    });
};

export const generatePolygon = (points, symbol) => {
    const polygon = new Polygon({
        rings: [points.map((p) => [p.x, p.y])],
        spatialReference: points[0]?.spatialReference,
    });
    return new Graphic({
        geometry: polygon,
        symbol: symbol,
        attributes: {
            type: 'polygon',
        },
    });
};

export const generateCircle = (center, radius, symbol) => {
    const circle = new Circle({
        center: new Point({
            x: center.x,
            y: center.y,
            spatialReference: center.spatialReference,
        }),
        radius: radius,
    });
    return new Graphic({
        geometry: circle,
        symbol: symbol,
        attributes: {
            type: 'circle',
        },
    });
};

export const generateRectangle = (points, symbol) => {
    if (points.length < 2) return null;
    const [start, end] = points;
    const xmin = Math.min(start.x, end.x);
    const ymin = Math.min(start.y, end.y);
    const xmax = Math.max(start.x, end.x);
    const ymax = Math.max(start.y, end.y);
    const rectangle = new Polygon({
        rings: [
            [
                [xmin, ymin],
                [xmax, ymin],
                [xmax, ymax],
                [xmin, ymax],
                [xmin, ymin],
            ],
        ],
        spatialReference: start.spatialReference,
    });
    return new Graphic({
        geometry: rectangle,
        symbol: symbol,
        attributes: {
            type: 'rectangle',
        },
    });
};

export const calculateLength = (geometry) => {
    if (geometry.type === 'polyline') {
        return geometryEngine.geodesicLength(geometry, 'kilometers');
    }
    return 0;
};

export const calculateArea = (geometry) => {
    if (geometry.type === 'polygon') {
        return geometryEngine.geodesicArea(geometry, 'square-kilometers');
    }
    return 0;
};

export const formatLength = (length) => {
    if (length >= 1) {
        return `${length.toFixed(2)} km`;
    }
    return `${(length * 1000).toFixed(2)} m`;
};

export const formatArea = (area) => {
    if (area >= 1) {
        return `${area.toFixed(2)} km²`;
    }
    return `${(area * 1000000).toFixed(2)} m²`;
};

export const createDefaultPolygonSymbol = (style = 'default') => {
    const fillColor = style === 'hollow' ? 'rgba(255, 255, 255, 0)' : 'rgba(0, 150, 255, 0.3)';
    return new SimpleFillSymbol({
        color: fillColor,
        outline: new SimpleLineSymbol({
            color: '#0096ff',
            width: 2,
        }),
    });
};

export const createDefaultLineSymbol = (style = 'default') => {
    const styleType = style === 'dashed' ? 'short-dash' : 'solid';
    return new SimpleLineSymbol({
        color: '#0096ff',
        width: 2,
        style: styleType,
    });
};
