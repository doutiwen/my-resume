import { Draw, Polygon } from '../../modules';
import { createDefaultPolygonSymbol, calculateArea, formatArea } from './utils';

class DrawRectangle2D {
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
        const drawAction = this.Draw.create('rectangle', {
            symbol: symbol || createDefaultPolygonSymbol(),
        });

        drawAction.on('cursor-update', (event) => {
            const vertices = event.vertices;
            if (vertices.length >= 2) {
                const [start, end] = vertices;
                const xmin = Math.min(start.x, end.x);
                const ymin = Math.min(start.y, end.y);
                const xmax = Math.max(start.x, end.x);
                const ymax = Math.max(start.y, end.y);
                const polygon = new Polygon({
                    rings: [
                        [
                            [xmin, ymin],
                            [xmax, ymin],
                            [xmax, ymax],
                            [xmin, ymax],
                            [xmin, ymin],
                        ],
                    ],
                    spatialReference: this.MapView.spatialReference,
                });
                const area = calculateArea(polygon);
                this.showTooltip(event, formatArea(area));
            }
        });

        drawAction.on('draw-complete', (event) => {
            const graphic = event.graphic;
            graphic.attributes = {
                type: 'rectangle',
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

export default DrawRectangle2D;
