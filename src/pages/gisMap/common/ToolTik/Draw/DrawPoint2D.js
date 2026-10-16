import { Draw, Point } from '../../modules';

class DrawPoint2D {
    constructor(props) {
        const { MapView } = props;
        this.MapView = MapView;
        this.Draw = new Draw({ view: MapView });
        this.onDrawCallback = null;
        this.onCancelCallback = null;
    }

    on(type, callback) {
        if (type === 'draw-complete') {
            this.onDrawCallback = callback;
        } else if (type === 'cancel') {
            this.onCancelCallback = callback;
        }
    }

    activate(symbol) {
        const drawAction = this.Draw.create('point', { symbol });
        drawAction.on('draw-complete', (event) => {
            const graphic = event.graphic;
            graphic.attributes = {
                type: 'point',
            };
            this.onDrawCallback?.(graphic);
            this.deactivate();
        });
        this.currentAction = drawAction;
    }

    deactivate() {
        if (this.currentAction) {
            this.currentAction.destroy();
            this.currentAction = null;
        }
    }

    cancel() {
        this.deactivate();
        this.onCancelCallback?.();
    }
}

export default DrawPoint2D;
