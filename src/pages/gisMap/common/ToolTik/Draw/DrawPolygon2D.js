import { Draw, Polygon } from '../../modules';
import { createDefaultPolygonSymbol, calculateArea, formatArea } from './utils';

class DrawPolygon2D {
    constructor(props) {
        const { MapView, mapInstance } = props;
        this.MapView = MapView;
        this.mapInstance = mapInstance;
        this.Draw = new Draw({ view: MapView });
        this.onDrawCallback = null;
        this.onCancelCallback = null;
        this.tooltip = null;
    }

    on(type, callback) {
        if (type === 'draw-complete') {
            this.onDrawCallback = callback;
        } else if (type === 'cancel') {
            this.onCancelCallback = callback;
        }
    }

    activate(symbol) {
        const drawAction = this.Draw.create('polygon', {
            symbol: symbol || createDefaultPolygonSymbol(),
        });

        drawAction.on('vertex-add', (event) => {
            const vertices = event.vertices;
            if (vertices.length >= 3) {
                const polygon = new Polygon({
                    rings: [vertices],
                    spatialReference: this.MapView.spatialReference,
                });
                const area = calculateArea(polygon);
                this.showTooltip(event, formatArea(area));
            }
        });

        drawAction.on('cursor-update', (event) => {
            const vertices = event.vertices;
            if (vertices.length >= 2) {
                const polygon = new Polygon({
                    rings: [vertices],
                    spatialReference: this.MapView.spatialReference,
                });
                const area = calculateArea(polygon);
                this.showTooltip(event, formatArea(area));
            }
        });

        drawAction.on('draw-complete', (event) => {
            const graphic = event.graphic;
            graphic.attributes = {
                type: 'polygon',
                area: calculateArea(graphic.geometry),
            };
            this.hideTooltip();
            this.onDrawCallback?.(graphic);
            this.deactivate();
        });

        this.currentAction = drawAction;
    }

    showTooltip(event, text) {
        if (!this.tooltip) {
            this.tooltip = this.mapInstance.createTooltip({
                className: 'draw-tooltip',
                zIndex: 1000,
            });
        }
        this.tooltip.show(event.screenPoint, text);
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.hide();
        }
    }

    deactivate() {
        if (this.currentAction) {
            this.currentAction.destroy();
            this.currentAction = null;
        }
        this.hideTooltip();
        if (this.tooltip) {
            this.tooltip.destroy();
            this.tooltip = null;
        }
    }

    cancel() {
        this.deactivate();
        this.onCancelCallback?.();
    }
}

export default DrawPolygon2D;
