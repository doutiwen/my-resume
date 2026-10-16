import { Draw, Polyline } from '../../modules';
import { createDefaultLineSymbol, calculateLength, formatLength } from './utils';

class DrawLine2D {
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
        const drawAction = this.Draw.create('polyline', {
            symbol: symbol || createDefaultLineSymbol(),
        });

        drawAction.on('vertex-add', (event) => {
            const vertices = event.vertices;
            if (vertices.length >= 2) {
                const polyline = new Polyline({
                    paths: [vertices],
                    spatialReference: this.MapView.spatialReference,
                });
                const length = calculateLength(polyline);
                this.showTooltip(event, formatLength(length));
            }
        });

        drawAction.on('cursor-update', (event) => {
            const vertices = event.vertices;
            if (vertices.length >= 1) {
                const polyline = new Polyline({
                    paths: [vertices],
                    spatialReference: this.MapView.spatialReference,
                });
                const length = calculateLength(polyline);
                this.showTooltip(event, formatLength(length));
            }
        });

        drawAction.on('draw-complete', (event) => {
            const graphic = event.graphic;
            graphic.attributes = {
                type: 'polyline',
                length: calculateLength(graphic.geometry),
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

export default DrawLine2D;
