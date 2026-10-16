class BaseMapControll {
    constructor(props) {
        const { mapInstance, config } = props
        const { baseData } = config
        this.mapInstance = mapInstance
        this.config = config
        this.onChangeMode = null;
        this.activeBaseMap = baseData?.selectBaseMapConfig?.activeBaseMap;
        this.noteStatus = baseData?.selectBaseMapConfig?.noteStatus || {};
        this.baseMapVisible = !baseData?.selectBaseMapConfig?.unShowAllBaseMapOnMap
        this.activeChild = baseData?.selectBaseMapConfig?.activeChild
    }

    onChangeData(data, type) {
        if (type === 'activeBaseMap') {
            this.activeBaseMap = data
        }
        if (type === 'noteStatus') {
            this.noteStatus = data
        }
        if (type === 'baseMapVisible') {
            this.baseMapVisible = data
        }
        if (type === 'activeChild') {
            this.activeChild = data
        }
    }

    create(props) {
    }

    update(props) {
        this.create(props)
    }

    updateMode(mode) {
        this.onChangeMode(mode)
    }

    on(callBack) {
        this.onChangeMode = callBack
    }

    destory() {

    }
}

export default BaseMapControll
