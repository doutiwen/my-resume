import { useLoader } from '@tresjs/core';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { dracoLoader, getModelPath } from '../utils/common';

const dracoLoaderInstance = dracoLoader;

async function useGLTFLoader({ modelName, modelType, level }) {
  const modelPath = getModelPath(modelName, modelType, level);
  console.log('Loading model:', modelPath);

  try {
    const gltf = await useLoader(GLTFLoader, modelPath, {
      extensions: (loader) => {
        if (loader instanceof GLTFLoader) {
          loader.setDRACOLoader(dracoLoaderInstance);
        }
      },
    });
    console.log('Model loaded successfully:', modelName, gltf.state.value);
    return gltf.state.value;
  } catch (err) {
    console.error(`Failed to load model ${modelName}:`, err);
    return null;
  }
}

export { useGLTFLoader };
