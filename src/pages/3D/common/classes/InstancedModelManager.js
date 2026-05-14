import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { loadGLTFModel } from '../utils/LoadGLTFModel.js';

export class InstancedModelManager {
  constructor(scene, modelName, modelType = 'tree', maxInstances = 1000) {
    this.scene = scene;
    this.modelName = modelName;
    this.modelType = modelType;
    this.MAX_INSTANCES = maxInstances;
    this.categories = new Map();
    this.mergedGeometry = null;
    this.material = null;
    this.isModelLoaded = false;
    this.isLoading = false;
  }

  async load() {
    if (this.isLoading) return;
    if (this.isModelLoaded) return;

    this.isLoading = true;

    try {
      const model = await loadGLTFModel({
        modelName: this.modelName,
        modelType: this.modelType,
        level: 'high',
      });

      if (model?.scene) {
        this.mergedGeometry = this.#mergeGroupGeometry(model.scene);
        this.material = this.#getFirstMaterial(model.scene);
        this.isModelLoaded = true;
      }
    } catch (err) {
      console.error(`Failed to load model '${this.modelName}':`, err);
    } finally {
      this.isLoading = false;
    }
  }

  #mergeGroupGeometry(group) {
    const geometries = [];

    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const cloned = child.geometry.clone();
        cloned.translate(child.position.x, child.position.y, child.position.z);

        if (child.rotation.x !== 0 || child.rotation.y !== 0 || child.rotation.z !== 0) {
          const rotationMatrix = new THREE.Matrix4();
          rotationMatrix.makeRotationFromEuler(child.rotation);
          cloned.applyMatrix4(rotationMatrix);
        }

        if (child.scale.x !== 1 || child.scale.y !== 1 || child.scale.z !== 1) {
          cloned.scale(child.scale.x, child.scale.y, child.scale.z);
        }

        geometries.push(cloned);
      }
    });

    if (geometries.length === 0) return null;

    return BufferGeometryUtils.mergeGeometries(geometries);
  }

  #getFirstMaterial(group) {
    let firstMaterial = null;

    group.traverse((child) => {
      if (!firstMaterial && child instanceof THREE.Mesh && child.material) {
        firstMaterial = child.material.clone();
      }
    });

    return (
      firstMaterial ||
      new THREE.MeshStandardMaterial({
        color: '#4CAF50',
        roughness: 0.3,
        metalness: 0,
        side: THREE.DoubleSide,
      })
    );
  }

  async loadCategory(categoryKey, count) {
    if (!this.scene) {
      console.error('InstancedModelManager not initialized.');
      return;
    }

    if (!this.isModelLoaded) {
      console.warn('Model not loaded yet. Call load() first.');
      return;
    }

    if (this.categories.has(categoryKey)) {
      console.warn(`Category '${categoryKey}' already exists`);
      return;
    }

    const instancedMesh = new THREE.InstancedMesh(
      this.mergedGeometry,
      this.material,
      Math.min(count, this.MAX_INSTANCES)
    );
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    this.scene.add(instancedMesh);

    const categoryState = {
      instancedMesh,
      instanceCount: 0,
    };

    this.categories.set(categoryKey, categoryState);
  }

  addInstance(categoryKey, position, scale, rotation) {
    const categoryState = this.categories.get(categoryKey);
    if (!categoryState) {
      console.error(`Category '${categoryKey}' not found`);
      return;
    }

    if (categoryState.instanceCount >= this.MAX_INSTANCES) {
      console.warn(
        `Maximum instance count reached for category '${categoryKey}':`,
        this.MAX_INSTANCES
      );
      return;
    }

    const matrix = new THREE.Matrix4();
    matrix.identity();
    matrix.makeRotationFromEuler(new THREE.Euler(rotation[0], rotation[1], rotation[2]));
    matrix.scale(new THREE.Vector3(scale[0], scale[1], scale[2]));
    matrix.setPosition(new THREE.Vector3(position[0], position[1], position[2]));

    const instanceId = categoryState.instanceCount;
    categoryState.instancedMesh.setMatrixAt(instanceId, matrix);
    categoryState.instancedMesh.instanceMatrix.needsUpdate = true;
    categoryState.instancedMesh.count = instanceId + 1;
    categoryState.instanceCount++;
  }

  async buildCategory(categoryKey, itemsData) {
    if (itemsData.length === 0) return;

    if (!this.isModelLoaded) {
      console.error('Model not loaded. Call load() first.');
      return;
    }

    await this.loadCategory(categoryKey, itemsData.length);
    itemsData.forEach((itemData) => {
      this.addInstance(categoryKey, itemData.position, itemData.scale, itemData.rotation);
    });
  }

  getCategoryState(categoryKey) {
    return this.categories.get(categoryKey) || null;
  }

  hasCategory(categoryKey) {
    return this.categories.has(categoryKey);
  }

  removeCategory(categoryKey) {
    const categoryState = this.categories.get(categoryKey);
    if (!categoryState) return;

    this.disposeCategory(categoryKey);
    this.categories.delete(categoryKey);
  }

  disposeCategory(categoryKey) {
    const categoryState = this.categories.get(categoryKey);
    if (!categoryState) return;

    if (categoryState.instancedMesh) {
      this.scene.remove(categoryState.instancedMesh);
      categoryState.instancedMesh = null;
    }
    categoryState.instanceCount = 0;
  }

  dispose() {
    this.categories.forEach((_, categoryKey) => {
      this.disposeCategory(categoryKey);
    });
    this.categories.clear();

    if (this.mergedGeometry) {
      this.mergedGeometry.dispose();
      this.mergedGeometry = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
    this.isModelLoaded = false;
    this.scene = null;
  }
}
