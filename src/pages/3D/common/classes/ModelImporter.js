import * as THREE from 'three';
import { loadGLTFModel } from '../utils/LoadGLTFModel.js';
import { createLowPolyBuilding, getBuildingColor } from '../utils/LowPolyBuildingHelper.js';

export class GLTFModelImporter {
  constructor(scene) {
    this.scene = scene;
    this.models = [];
  }

  async import(modelsData) {
    const modelPromises = modelsData.map(async (modelData) => {
      return this.importSingle(modelData);
    });

    await Promise.all(modelPromises);
  }

  async importSingle({ id, modelName, position, scale, rotation, modelType = 'building', level }) {
    const modelGroup = new THREE.Group();
    modelGroup.position.set(position[0], position[1], position[2]);
    modelGroup.scale.set(scale[0], scale[1], scale[2]);
    modelGroup.rotation.set(rotation[0], rotation[1], rotation[2]);

    this.scene.add(modelGroup);
    this.models.push(modelGroup);

    try {
      const model = await loadGLTFModel({
        modelName: modelName,
        modelType: modelType,
      });

      if (model?.scene) {
        const modelClone = model.scene.clone();
        modelClone.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        modelGroup.add(modelClone);
      }
    } catch (err) {
      console.error(`Failed to load model ${id}:`, err);
    }

    return modelGroup;
  }

  dispose() {
    this.models.forEach((model) => {
      model.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.scene.remove(model);
    });
    this.models = [];
  }
}

export class LODModelImporter {
  constructor(scene) {
    this.scene = scene;
    this.models = [];
    this.lodObjects = [];
  }

  async import(modelsData) {
    const modelPromises = modelsData.map(async (modelData) => {
      return this.importSingle(modelData);
    });

    await Promise.all(modelPromises);
  }

  async importSingle({
    id,
    modelName,
    position,
    scale,
    rotation,
    modelType = 'building',
    lodDistances,
  }) {
    const modelColor = getBuildingColor(modelName);

    const modelGroup = new THREE.Group();
    modelGroup.position.set(position[0], position[1], position[2]);
    modelGroup.scale.set(scale[0], scale[1], scale[2]);
    modelGroup.rotation.set(rotation[0], rotation[1], rotation[2]);

    const placeholderGeometry = new THREE.BoxGeometry(8, 10, 8);
    const placeholderMaterial = new THREE.MeshStandardMaterial({
      color: modelColor,
      wireframe: true,
    });
    const placeholderMesh = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
    modelGroup.add(placeholderMesh);

    this.scene.add(modelGroup);
    this.models.push(modelGroup);

    try {
      const mediumModel = await loadGLTFModel({
        modelName: modelName,
        modelType: modelType,
        level: 'medium',
      });

      const lowPolyModel = createLowPolyBuilding({ color: modelColor });
      const lod = new THREE.LOD();

      if (mediumModel?.scene) {
        lod.addLevel(mediumModel.scene.clone(), 0);
        lod.addLevel(mediumModel.scene.clone(), lodDistances.high);
      } else {
        lod.addLevel(lowPolyModel.clone(), 0);
        lod.addLevel(lowPolyModel.clone(), lodDistances.high);
      }
      lod.addLevel(lowPolyModel, lodDistances.medium);

      modelGroup.remove(placeholderMesh);
      placeholderGeometry.dispose();
      placeholderMaterial.dispose();

      lod.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      modelGroup.add(lod);
      this.lodObjects.push(lod);

      const highModel = await loadGLTFModel({
        modelName: modelName,
        modelType: modelType,
        level: 'high',
      });

      if (highModel?.scene && lod.levels.length > 0) {
        lod.remove(lod.levels[0].object);
        lod.levels.shift();
        lod.addLevel(highModel.scene.clone(), 0);
      }
    } catch (err) {
      console.error(`Failed to load LOD model ${id}:`, err);

      modelGroup.remove(placeholderMesh);
      placeholderGeometry.dispose();
      placeholderMaterial.dispose();

      const lowPolyModel = createLowPolyBuilding({ color: modelColor });
      lowPolyModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      const lod = new THREE.LOD();
      lod.addLevel(lowPolyModel.clone(), 0);
      lod.addLevel(lowPolyModel, lodDistances.medium);
      modelGroup.add(lod);
      this.lodObjects.push(lod);
    }

    return modelGroup;
  }

  updateLOD(camera) {
    this.lodObjects.forEach((lod) => {
      if (lod.update) {
        lod.update(camera);
      }
    });
  }

  dispose() {
    this.models.forEach((model) => {
      model.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.scene.remove(model);
    });
    this.models = [];
    this.lodObjects = [];
  }
}
