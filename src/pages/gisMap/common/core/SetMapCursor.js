class MapCursor {
  setMapCursor(type) {
    const { MapView } = this;
    const { container } = MapView;
    const esriView = container.getElementsByClassName('esri-view-surface')[0];
    esriView.setAttribute('data-cursor', type);
  }
}

export const useMapCursor = () => {
  return new MapCursor();
};

export default useMapCursor;
