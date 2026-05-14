import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { loadGLTFModel } from '../utils/LoadGLTFModel.js';
import { createLowPolyBuilding, getBuildingColor } from '../utils/LowPolyBuildingHelper.js';
import { GLTFModelImporter, LODModelImporter } from './ModelImporter.js';
import { InstancedModelManager } from './InstancedModelManager.js';
import { RoadBuilder } from './RoadBuilder.js';

export class SceneBuilder {
  constructor(scene, sceneData) {
    this.scene = scene;
    this.sceneData = sceneData;
    this.roadBuilder = new RoadBuilder(scene);
    this.gltfImporter = new GLTFModelImporter(scene);
    this.lodImporter = new LODModelImporter(scene);
    this.roads = [];
  }

  async init() {
    if (this.sceneData?.roads) {
      this.buildRoads(this.sceneData.roads);
    }

    const promises = [];
    if (this.sceneData?.trees) {
      promises.push(this.buildTrees(this.sceneData.trees));
    }
    if (this.sceneData?.buildings) {
      promises.push(this.buildBuildings(this.sceneData.buildings));
    }

    await Promise.allSettled(promises);
  }

  async buildBuildings(buildingsData) {
    const promises = [];
    const lodBuildings = buildingsData.filter((b) => b.lodDistances);
    const simpleBuildings = buildingsData.filter((b) => !b.lodDistances);

    if (simpleBuildings.length > 0) {
      promises.push(this.gltfImporter.import(simpleBuildings));
    }

    if (lodBuildings.length > 0) {
      promises.push(this.lodImporter.import(lodBuildings));
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }

  createGround(size = 400, color = '#7CFC00') {
    const groundGeometry = new THREE.PlaneGeometry(size, size);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.8,
      metalness: 0,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    return ground;
  }

  buildRoads(roads) {
    roads.forEach((road) => {
      const roadGroup = this.roadBuilder.createRoad(road.points, road.features);
      this.roads.push(roadGroup);
    });
  }

  async buildTrees(trees) {
    if (trees.length === 0) return;

    try {
      const instancedManager = new InstancedModelManager(this.scene, 'tree_1', 'tree');
      await instancedManager.load();
      await instancedManager.buildCategory('trees', trees);
    } catch (err) {
      console.error('Failed to load tree model:', err);
    }
  }

  updateLOD(camera) {
    this.lodImporter.updateLOD(camera);
  }

  dispose() {
    this.roads.forEach((road) => {
      road.traverse((child) => {
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
      this.scene.remove(road);
    });
    this.roads = [];

    this.gltfImporter.dispose();
    this.lodImporter.dispose();
  }
}
