import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { getModelPath } from './common';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
dracoLoader.preload();

async function loadGLTFModel({ modelName, modelType, level }) {
  const modelPath = getModelPath(modelName, modelType, level);
  console.log('Loading model:', modelPath);

  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      modelPath,
      (gltf) => {
        console.log('Model loaded successfully:', modelName);
        resolve(gltf);
      },
      (xhr) => {
        console.log(`Loading model ${modelName}: ${(xhr.loaded / xhr.total) * 100}%`);
      },
      (error) => {
        console.error(`Failed to load model ${modelName}:`, error);
        reject(error);
      }
    );
  });
}

export { loadGLTFModel };