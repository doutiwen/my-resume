import DrawPoint2D from './DrawPoint2D';
import DrawLine2D from './DrawLine2D';
import DrawPolygon2D from './DrawPolygon2D';
import DrawCircle2D from './DrawCircle2D';
import DrawRectangle2D from './DrawRectangle2D';
import { ToolCode } from './index.types';

class DrawTool {
    constructor(props) {
        const { MapView, mapInstance } = props;
        this.MapView = MapView;
        this.mapInstance = mapInstance;
        this.activeTool = null;
        this.currentTool = null;
    }

    on(type, callback) {
        if (this.currentTool) {
            this.currentTool.on(type, callback);
        }
    }

    activate(toolCode, options = {}) {
        this.deactivate();
        this.activeTool = toolCode;
        const { symbol } = options;

        switch (toolCode) {
            case ToolCode.POINT:
                this.currentTool = new DrawPoint2D({
                    MapView: this.MapView,
                    mapInstance: this.mapInstance,
                });
                this.currentTool.activate(symbol);
                break;
            case ToolCode.LINE:
                this.currentTool = new DrawLine2D({
                    MapView: this.MapView,
                    mapInstance: this.mapInstance,
                });
                this.currentTool.activate(symbol);
                break;
            case ToolCode.POLYGON:
                this.currentTool = new DrawPolygon2D({
                    MapView: this.MapView,
                    mapInstance: this.mapInstance,
                });
                this.currentTool.activate(symbol);
                break;
            case ToolCode.CIRCLE:
                this.currentTool = new DrawCircle2D({
                    MapView: this.MapView,
                    mapInstance: this.mapInstance,
                });
                this.currentTool.activate(symbol);
                break;
            case ToolCode.RECTANGLE:
                this.currentTool = new DrawRectangle2D({
                    MapView: this.MapView,
                    mapInstance: this.mapInstance,
                });
                this.currentTool.activate(symbol);
                break;
            default:
                break;
        }
    }

    deactivate() {
        if (this.currentTool) {
            this.currentTool.deactivate();
            this.currentTool = null;
        }
        this.activeTool = null;
    }

    cancel() {
        if (this.currentTool) {
            this.currentTool.cancel();
        }
        this.activeTool = null;
    }
}

export default DrawTool;
