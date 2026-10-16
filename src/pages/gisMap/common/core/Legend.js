class Legend {
  constructor(props) {
    this.mapInstance = props.mapInstance;
    this.collapse = true;
    this.hideList = [];
    this.updateStatus = false;
    this.legendRef = undefined;
  }

  create(element, position) {
    this.legendInstance = element;
    this.mapInstance.addMapWidget({
      element: this.legendInstance.create(),
      widgetCode: 'Legend',
      position,
    });
  }

  updateCollapseStatus(status) {
    this.collapse = status;
    this.legendRef?.update(status);
  }

  updateHideList(hideList) {
    this.hideList = hideList;
    this.legendRef?.updateHideList(hideList);
  }

  updateLegendStatus(isUpdate) {
    this.updateStatus = isUpdate || false;
    this.legendRef?.updateLegendStatus(isUpdate);
  }
  
  updateControlRef(ref) {
    this.legendRef = ref;
  }
}

export default Legend;
