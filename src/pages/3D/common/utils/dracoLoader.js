import { SingletonBase } from '@/utils/common';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const dracoLoaderPath = import.meta.env.VITE_BASE_URL + 'draco/';

console.log('dracoLoaderPath', dracoLoaderPath);

class DracoLoader extends SingletonBase {
  constructor() {
    super();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath(dracoLoaderPath);
    this.dracoLoader.preload();
    return this.dracoLoader;
  }
}

export default DracoLoader;
