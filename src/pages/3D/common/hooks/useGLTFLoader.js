import { useLoader } from '@tresjs/core';
import DracoLoader from '../utils/dracoLoader';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 构建模型路径
const getModelPath = (name, level, type = 'building') => {
  if (name) {
    let typePath;
    switch (type) {
      case 'building':
        typePath = 'buildings';
        break;
      case 'tree':
        typePath = 'trees';
        break;
      case 'streetLight':
        typePath = 'street_lights';
        break;
      case 'road':
        typePath = 'roads';
        break;
      default:
        typePath = 'others';
    }

    const levelPath = level === 'high' || level === 'medium' ? level : '';
    const pathParts = ['3d_model', typePath, levelPath, `${name}.glb`].filter(Boolean);
    return `${import.meta.env.VITE_BASE_URL}${pathParts.join('/')}`;
  } else {
    return '';
  }
};

const dracoLoaderInstance = new DracoLoader();

function useGLTFLoader({ modelName, modelType, level }) {
  const modelObject = shallowRef(null);
  const isLoading = ref(false);
  const error = ref(null);

  onMounted(() => {
    isLoading.value = true;

    const modelPath = getModelPath(modelName, level, modelType);
    console.log('Loading model:', modelPath);

    useLoader(GLTFLoader, modelPath, {
      extensions: (loader) => {
        if (loader instanceof GLTFLoader) {
          loader.setDRACOLoader(dracoLoaderInstance);
        }
      },
    })
      .then((gltf) => {
        modelObject.value = gltf.scene;
        isLoading.value = false;
        console.log('Model loaded successfully:', modelName);
      })
      .catch((err) => {
        error.value = err;
        isLoading.value = false;
        console.error(`Failed to load model ${modelName}:`, err);
        // 不抛出错误，让组件使用降级方案
      });
  });

  return {
    modelObject,
    isLoading,
    error,
  };
}

export { useGLTFLoader };
