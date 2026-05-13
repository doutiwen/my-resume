import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { loadGLTFModel } from '../utils/useGLTFLoader';
import { createLowPolyBuilding, getBuildingColor } from '../utils/LowPolyBuildingHelper';

export class RoadBuilder {
  constructor(scene) {
    this.scene = scene;
  }

  createRoadGeometry(points, width, offset = 0) {
    if (points.length < 2) {
      return new THREE.BufferGeometry();
    }

    const curvePoints = points.map((p) => new THREE.Vector3(p[0], 0, p[2]));
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    curve.closed = true;

    const segments = Math.max(100, points.length * 10);
    const sampledPoints = curve.getPoints(segments);

    const vertices = [];
    const faces = [];
    const halfWidth = width / 2 + offset;

    for (let i = 0; i < sampledPoints.length; i++) {
      const currentPoint = sampledPoints[i];
      const nextPoint = sampledPoints[(i + 1) % sampledPoints.length];

      const tangent = nextPoint.clone().sub(currentPoint).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const leftOffset = normal.clone().multiplyScalar(halfWidth);
      const rightOffset = normal.clone().multiplyScalar(-halfWidth);

      const leftPoint = currentPoint.clone().add(leftOffset);
      const rightPoint = currentPoint.clone().add(rightOffset);

      vertices.push(leftPoint.x, 0.01, leftPoint.z);
      vertices.push(rightPoint.x, 0.01, rightPoint.z);
    }

    for (let i = 0; i < sampledPoints.length; i++) {
      const v1 = i * 2;
      const v2 = i * 2 + 1;
      const v3 = ((i + 1) % sampledPoints.length) * 2;
      const v4 = ((i + 1) % sampledPoints.length) * 2 + 1;

      faces.push(v1, v2, v3);
      faces.push(v2, v4, v3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(faces);
    geometry.computeVertexNormals();

    return geometry;
  }

  createRoad(points, features) {
    const { width = 10, color = '#424242', hasMarkings = true } = features;

    const roadGroup = new THREE.Group();

    const roadGeometry = this.createRoadGeometry(points, width);
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.9,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
    roadMesh.receiveShadow = true;
    roadGroup.add(roadMesh);

    const curbLeftGeometry = this.createRoadGeometry(points, width + 0.6, 0.3);
    const curbRightGeometry = this.createRoadGeometry(points, width + 0.6, -0.3);
    const curbMaterial = new THREE.MeshStandardMaterial({
      color: '#808080',
      roughness: 0.7,
      metalness: 0.2,
      side: THREE.DoubleSide,
    });

    const curbLeftMesh = new THREE.Mesh(curbLeftGeometry, curbMaterial);
    curbLeftMesh.receiveShadow = true;
    roadGroup.add(curbLeftMesh);

    const curbRightMesh = new THREE.Mesh(curbRightGeometry, curbMaterial);
    curbRightMesh.receiveShadow = true;
    roadGroup.add(curbRightMesh);

    if (hasMarkings) {
      this.addRoadMarkings(roadGroup, points, width);
    }

    this.scene.add(roadGroup);
    return roadGroup;
  }

  addRoadMarkings(roadGroup, points, width) {
    const markingMaterial = new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      roughness: 0.3,
      metalness: 0.1,
      emissive: '#FFFFFF',
      emissiveIntensity: 0.15,
      side: THREE.DoubleSide,
    });

    const edgeLeftGeometry = this.createRoadGeometry(points, width - 0.3, 0.15);
    const edgeRightGeometry = this.createRoadGeometry(points, width - 0.3, -0.15);

    const edgeLeftMesh = new THREE.Mesh(edgeLeftGeometry, markingMaterial);
    edgeLeftMesh.receiveShadow = true;
    roadGroup.add(edgeLeftMesh);

    const edgeRightMesh = new THREE.Mesh(edgeRightGeometry, markingMaterial);
    edgeRightMesh.receiveShadow = true;
    roadGroup.add(edgeRightMesh);

    const centerLineMarkings = this.createCenterLineMarkings(points);
    centerLineMarkings.forEach((marking) => {
      roadGroup.add(marking);
    });

    if (width >= 10) {
      const laneMarkings = this.createLaneMarkings(points, width);
      laneMarkings.forEach((marking) => {
        roadGroup.add(marking);
      });
    }
  }

  createCenterLineMarkings(points) {
    const markings = [];
    const curvePoints = points.map((p) => new THREE.Vector3(p[0], 0, p[2]));
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    curve.closed = true;

    const totalLength = curve.getLength();
    const segmentLength = 9;

    for (let i = 0; i < totalLength; i += segmentLength) {
      const point = curve.getPointAt(i / totalLength);
      const tangent = curve.getTangentAt(i / totalLength);
      const angle = Math.atan2(tangent.z, tangent.x);

      const markingGeometry = new THREE.BoxGeometry(3, 0.03, 0.15);
      const markingMaterial = new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        roughness: 0.3,
        metalness: 0.1,
        emissive: '#FFFFFF',
        emissiveIntensity: 0.15,
      });

      const marking = new THREE.Mesh(markingGeometry, markingMaterial);
      marking.position.set(point.x, 0.035, point.z);
      marking.rotation.set(0, angle, 0);
      marking.receiveShadow = true;

      markings.push(marking);
    }

    return markings;
  }

  createLaneMarkings(points, width) {
    const markings = [];
    const curvePoints = points.map((p) => new THREE.Vector3(p[0], 0, p[2]));
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    curve.closed = true;

    const totalLength = curve.getLength();
    const segmentLength = 8;
    const laneOffset = width / 4;

    for (let i = 0; i < totalLength; i += segmentLength) {
      const point = curve.getPointAt(i / totalLength);
      const tangent = curve.getTangentAt(i / totalLength);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const angle = Math.atan2(tangent.z, tangent.x);

      const leftOffset = point.clone().add(normal.clone().multiplyScalar(-laneOffset));
      const rightOffset = point.clone().add(normal.clone().multiplyScalar(laneOffset));

      const markingGeometry = new THREE.BoxGeometry(2.5, 0.025, 0.12);
      const markingMaterial = new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        roughness: 0.3,
        metalness: 0.1,
        emissive: '#FFFFFF',
        emissiveIntensity: 0.1,
      });

      const leftMarking = new THREE.Mesh(markingGeometry.clone(), markingMaterial);
      leftMarking.position.set(leftOffset.x, 0.035, leftOffset.z);
      leftMarking.rotation.set(0, angle, 0);
      leftMarking.receiveShadow = true;
      markings.push(leftMarking);

      const rightMarking = new THREE.Mesh(markingGeometry, markingMaterial);
      rightMarking.position.set(rightOffset.x, 0.035, rightOffset.z);
      rightMarking.rotation.set(0, angle, 0);
      rightMarking.receiveShadow = true;
      markings.push(rightMarking);
    }

    return markings;
  }
}

export class Buildings {
  constructor(scene) {
    this.scene = scene;
    this.buildings = [];
    this.buildingLODObjects = [];
  }

  async build(buildingsData) {
    const buildingPromises = buildingsData.map(async (buildingData) => {
      return this.buildSingle(buildingData);
    });

    await Promise.all(buildingPromises);
  }

  async buildSingle({ id, modelName, position, scale, rotation, lodDistances }) {
    const buildingColor = getBuildingColor(modelName);

    const buildingGroup = new THREE.Group();
    buildingGroup.position.set(position[0], position[1], position[2]);
    buildingGroup.scale.set(scale[0], scale[1], scale[2]);
    buildingGroup.rotation.set(rotation[0], rotation[1], rotation[2]);

    const placeholderGeometry = new THREE.BoxGeometry(8, 10, 8);
    const placeholderMaterial = new THREE.MeshStandardMaterial({
      color: buildingColor,
      wireframe: true,
    });
    const placeholderMesh = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
    buildingGroup.add(placeholderMesh);

    this.scene.add(buildingGroup);
    this.buildings.push(buildingGroup);

    try {
      if (!lodDistances) {
        const highModel = await loadGLTFModel({
          modelName: modelName,
          modelType: 'building',
          level: 'high',
        });

        if (highModel) {
          buildingGroup.remove(placeholderMesh);
          placeholderGeometry.dispose();
          placeholderMaterial.dispose();

          const modelClone = highModel.scene.clone();
          modelClone.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          buildingGroup.add(modelClone);
        }
      } else {
        const mediumModel = await loadGLTFModel({
          modelName: modelName,
          modelType: 'building',
          level: 'medium',
        });

        const lowPolyBuilding = createLowPolyBuilding({ color: buildingColor });
        const lod = new THREE.LOD();

        if (mediumModel) {
          lod.addLevel(mediumModel.scene.clone(), 0);
          lod.addLevel(mediumModel.scene.clone(), lodDistances.high);
        } else {
          lod.addLevel(lowPolyBuilding.clone(), 0);
          lod.addLevel(lowPolyBuilding.clone(), lodDistances.high);
        }
        lod.addLevel(lowPolyBuilding, lodDistances.medium);

        buildingGroup.remove(placeholderMesh);
        placeholderGeometry.dispose();
        placeholderMaterial.dispose();

        lod.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        buildingGroup.add(lod);
        this.buildingLODObjects.push(lod);

        const highModel = await loadGLTFModel({
          modelName: modelName,
          modelType: 'building',
          level: 'high',
        });

        if (highModel && lod.levels.length > 0) {
          lod.remove(lod.levels[0].object);
          lod.levels.shift();
          lod.addLevel(highModel.scene.clone(), 0);
        }
      }
    } catch (err) {
      console.error(`Failed to load building ${id}:`, err);

      buildingGroup.remove(placeholderMesh);
      placeholderGeometry.dispose();
      placeholderMaterial.dispose();

      const lowPolyBuilding = createLowPolyBuilding({ color: buildingColor });
      lowPolyBuilding.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      buildingGroup.add(lowPolyBuilding);

      if (lodDistances) {
        const lod = new THREE.LOD();
        lod.addLevel(lowPolyBuilding.clone(), 0);
        lod.addLevel(lowPolyBuilding, lodDistances.medium);
        buildingGroup.add(lod);
        this.buildingLODObjects.push(lod);
      }
    }

    return buildingGroup;
  }

  updateLOD(camera) {
    this.buildingLODObjects.forEach((lod) => {
      if (lod.update) {
        lod.update(camera);
      }
    });
  }

  dispose() {
    this.buildings.forEach((building) => {
      building.traverse((child) => {
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
      this.scene.remove(building);
    });
    this.buildings = [];
    this.buildingLODObjects = [];
  }
}

export class TownBuilder {
  constructor(scene, sceneData) {
    this.scene = scene;
    this.sceneData = sceneData;
    this.roadBuilder = new RoadBuilder(scene);
    this.buildingsBuilder = new Buildings(scene);
    this.roads = [];
    this.treeInstancedState = null;
    this.treeInstancedMesh = null;
  }

  async init() {
    if (this.sceneData && this.sceneData.roads) {
      this.buildRoads(this.sceneData.roads);
    }

    if (this.sceneData && this.sceneData.trees) {
      await this.buildTrees(this.sceneData.trees);
    }

    if (this.sceneData && this.sceneData.buildings) {
      await this.buildingsBuilder.build(this.sceneData.buildings);
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

    this.treeInstancedState = new TreeInstancedStateManager();

    try {
      await this.treeInstancedState.loadModel();

      if (!this.treeInstancedState.isModelLoaded) return;

      const instancedMesh = new THREE.InstancedMesh(
        this.treeInstancedState.mergedGeometry,
        this.treeInstancedState.material,
        Math.min(trees.length, this.treeInstancedState.MAX_INSTANCES)
      );
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;

      this.treeInstancedMesh = instancedMesh;
      this.scene.add(instancedMesh);

      trees.forEach((treeData) => {
        this.treeInstancedState.addInstance(
          instancedMesh,
          treeData.position,
          treeData.scale,
          treeData.rotation
        );
      });
    } catch (err) {
      console.error('Failed to load tree model:', err);
    }
  }

  updateLOD(camera) {
    this.buildingsBuilder.updateLOD(camera);
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

    this.buildingsBuilder.dispose();

    if (this.treeInstancedMesh) {
      if (this.treeInstancedMesh.geometry) {
        this.treeInstancedMesh.geometry.dispose();
      }
      if (this.treeInstancedMesh.material) {
        this.treeInstancedMesh.material.dispose();
      }
      this.scene.remove(this.treeInstancedMesh);
      this.treeInstancedMesh = null;
    }

    if (this.treeInstancedState) {
      this.treeInstancedState.dispose();
      this.treeInstancedState = null;
    }
  }
}

class TreeInstancedStateManager {
  constructor() {
    this.MAX_INSTANCES = 1000;
    this.mergedGeometry = null;
    this.material = null;
    this.instanceCount = 0;
    this.isModelLoaded = false;
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
      const model = await loadGLTFModel({
        modelName: 'tree_5',
        modelType: 'tree',
        level: 'high',
      });

      if (model && model.scene) {
        this.mergedGeometry = this.#mergeGroupGeometry(model.scene);
        this.material = this.#getFirstMaterial(model.scene);
        this.isModelLoaded = true;
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

  dispose() {
    if (this.mergedGeometry) {
      this.mergedGeometry.dispose();
      this.mergedGeometry = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
    this.instanceCount = 0;
    this.isModelLoaded = false;
    this.instancedMesh = null;
  }
}
