import { Draw, Circle, Point } from '../../modules';
import { createDefaultPolygonSymbol, calculateArea, formatArea } from './utils';

class DrawCircle2D {
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
        const drawAction = this.Draw.create('circle', {
            symbol: symbol || createDefaultPolygonSymbol(),
        });

        drawAction.on('cursor-update', (event) => {
            const center = event.vertices[0];
            const lastPoint = event.vertices[event.vertices.length - 1];
            if (center && lastPoint) {
                const radius = Math.sqrt(
                    Math.pow(lastPoint.x - center.x, 2) +
                    Math.pow(lastPoint.y - center.y, 2)
                );
                const circle = new Circle({
                    center: new Point({
                        x: center.x,
                        y: center.y,
                        spatialReference: this.MapView.spatialReference,
                    }),
                    radius: radius,
                });
                const area = calculateArea(circle);
                this.showTooltip(event, formatArea(area));
            }
        });

        drawAction.on('draw-complete', (event) => {
            const graphic = event.graphic;
            graphic.attributes = {
                type: 'circle',
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

export default DrawCircle2D;
