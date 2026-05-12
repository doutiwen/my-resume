import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { useGLTFLoader } from '../../hooks/useGLTFLoader';
import { ref } from 'vue';

class TreeInstancedState {
  constructor() {
    this.MAX_INSTANCES = 1000;
    this.modelNames = 'tree_5';

    this.mergedGeometry = null;
    this.material = null;
    this.instanceCount = 0;
    this.isModelLoaded = ref(false);
    this.isLoading = false;
    this.instancedMesh = null;
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

  async loadModel() {
    if (this.isLoading) return;

    this.isLoading = true;

    try {
      const model = await useGLTFLoader({
        modelName: this.modelNames,
        modelType: 'tree',
        level: 'high',
      });

      if (model && model.scene) {
        this.mergedGeometry = this.#mergeGroupGeometry(model.scene);
        this.material = this.#getFirstMaterial(model.scene);
        this.isModelLoaded.value = true;
      }
    } catch (err) {
      console.error('Failed to load tree model:', err);
    } finally {
      this.isLoading = false;
    }
  }

  addInstance(mesh, position, scale, rotation) {
    if (this.instanceCount >= this.MAX_INSTANCES) {
      console.warn('Maximum instance count reached:', this.MAX_INSTANCES);
      return;
    }

    const matrix = new THREE.Matrix4();

    matrix.identity();
    matrix.makeRotationFromEuler(new THREE.Euler(rotation[0], rotation[1], rotation[2]));
    matrix.scale(new THREE.Vector3(scale[0], scale[1], scale[2]));
    matrix.setPosition(new THREE.Vector3(position[0], position[1], position[2]));

    const instanceId = this.instanceCount;
    mesh.setMatrixAt(instanceId, matrix);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = instanceId + 1;

    this.instanceCount++;
  }

  setInstancedMesh(mesh) {
    if (!this.instancedMesh) {
      this.instancedMesh = mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
    return this.instancedMesh;
  }
}

export const treeInstancedState = new TreeInstancedState();
