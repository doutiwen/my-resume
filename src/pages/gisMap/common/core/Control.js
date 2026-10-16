import { render, toRaw } from 'vue';
import { pick } from 'lodash-es';

class Control {
  constructor(props) {
    this.mapInstance = props.mapInstance;
    this.controlList = [];
    this.hideList = [];
    this.layerStyle = [];
    this.uploadFileLayers = [];
    this.sketchGraphic = [];
    this.events = { ADD: [], UPDATE: [], REMOVE: [], DROP: [], TOGGLEVISIBLE: [] };
    this.collapse = true;
    this.currentMapMode = '2D';
    this.controlRef = undefined;
  }

  on(type, callback) {
    this.events[type].push(callback);
  }

  updateControlList(type, node, controlData, isSelfCall) {
    const newNode = node
    if (type === 'ADD') {
      this.controlRef?.onAddLayerHandle(newNode)
      this.controlList.unshift(newNode);
      if (this.events.ADD.length) {
        this.events.ADD.forEach((cb) => {
          cb(newNode);
        })
      }
    } else if (type === 'UPDATE') {
      const nodeData = newNode;
      const _controlList = [...this.controlList];
      const index = this.controlList.findIndex(d => d.id === nodeData.id);
      if (index > -1) {
        _controlList[index] = {
          ..._controlList[index],
          opacity: nodeData?.opacity || nodeData?.opacity === 0 ? nodeData?.opacity : 1,
          name: nodeData?.name,
          label: nodeData?.label,
        }
        if (this.events.UPDATE.length) {
          this.events.UPDATE.forEach((cb) => {
            cb(newNode);
          })
        }
        this.controlList = _controlList;
      }
    } else if (type === 'DROP') {
      const _data = controlData || this.controlList;
      _data.map((d) => {
        if (this.events.DROP.length) {
          this.events.DROP.forEach((cb) => {
            cb(d);
          })
        }
      })
      this.controlList = _data;
    } else {
      const index = this.controlList.findIndex(d => d.id === newNode);
      if (index > -1) {
        !isSelfCall && this.controlRef?.onRemoveHandle(newNode, true)
        if (this.events.REMOVE.length) {
          this.events.REMOVE.forEach((cb) => {
            cb.call(this, this.controlList[index]);
          })
        }
        this.controlList.splice(index, 1);
      } else {
        return;
      }
    }
  }

  updateFileLayers(type, layer) {
    if (layer) {
      const _oldFileLayers = [...this.uploadFileLayers]
      const layerIndex = _oldFileLayers.findIndex((d) => d?.fileId === layer?.fileId);
      if (type === 'ADD') {
        layerIndex === -1 && _oldFileLayers.push(layer);
      }
      if (type === 'REMOVE' && layerIndex > -1) {
        _oldFileLayers.splice(layerIndex, 1)
      }
      if (type === 'UPDATE' && layerIndex > -1) {
        _oldFileLayers.splice(layerIndex, 1, layer)
      }
      this.uploadFileLayers = [..._oldFileLayers]
    }
  }

  onDragDone(e) {
    if((e?.oldIndex || e?.oldIndex === 0) && (e?.newIndex || e?.newIndex === 0)) {
      this.controlRef?.onUpdate(e, true)
    }
  }

  onUpdateOpacityOrVisible(opacity, data, type, index) {
    this.controlRef?.onOpacityHandle(opacity, data, type, index)
  }

  updateSketchGraphics(type, graphic) {
    if (graphic) {
      const _sketchGraphic = [...this.sketchGraphic]
      const layerIndex = _sketchGraphic.findIndex((d) => d?.id === graphic?.id);
      if (type === 'ADD') {
        layerIndex === -1 && _sketchGraphic.push(graphic);
      }
      if (type === 'REMOVE' && layerIndex > -1) {
        _sketchGraphic.splice(layerIndex, 1)
      }
      if (type === 'UPDATE' && layerIndex > -1) {
        _sketchGraphic.splice(layerIndex, 1, graphic)
      }
      this.sketchGraphic = [..._sketchGraphic]
    }
  }

  updateCollapseStatus(status, maxHeight) {
    this.collapse = status;
  }

  updateLayerStyleData(styleConfig) {
    this.layerStyle = styleConfig;
  }

  updateHideList(type, serverId) {
    if (type === 'ADD') {
      this.hideList.push(serverId)
    } else {
      const index = this.hideList.findIndex(d => d === serverId)
      if (index > -1) this.hideList.splice(index, 1)
    }
  }

  updateMapMode(mode) {
    this.currentMapMode = mode
  }

  updateStyleStatus(isShow, data) {
    if (this.events.TOGGLEVISIBLE.length) {
      this.events.TOGGLEVISIBLE.forEach((cb) => {
        cb({isShow, data});
      })
    }
  }
  
  updateControlRef(ref) {
    this.controlRef = ref
  }
}

export default Control;
