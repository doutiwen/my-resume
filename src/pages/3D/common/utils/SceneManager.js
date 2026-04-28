import * as THREE from 'three';
import { ModelGenerator } from './ModelGenerator';

/**
 * 场景管理器类
 * 负责解析JSON数据并生成完整的3D场景
 */
export class SceneManager {
  constructor(scene) {
    this.scene = scene;
    this.modelGenerator = new ModelGenerator();
    this.instancedMeshes = {};
    this.lodObjects = [];
    this.objectsWithCulling = [];
    this.camera = null;
  }

  /**
   * 解析JSON数据并生成场景
   */
  async parseAndGenerate(sceneData) {
    // 清除现有场景
    this.clearScene();
    
    // 设置环境
    this.setupEnvironment(sceneData.environment);
    
    // 生成道路
    await this.generateRoads(sceneData.roads);
    
    // 生成建筑（使用实例化渲染优化）
    await this.generateBuildings(sceneData.buildings);
    
    // 生成树木（使用实例化渲染优化）
    await this.generateTrees(sceneData.trees);
    
    // 生成路灯
    await this.generateStreetLights(sceneData.streetLights);
    
    console.log('场景生成完成');
  }

  /**
   * 清除现有场景
   */
  clearScene() {
    while (this.scene.children.length > 0) {
      const child = this.scene.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
      this.scene.remove(child);
    }
    this.instancedMeshes = {};
    this.lodObjects = [];
    this.objectsWithCulling = [];
  }

  /**
   * 设置环境
   */
  setupEnvironment(environment) {
    // 设置天空颜色
    if (environment.skyColor) {
      // 可以在这里添加天空盒或穹顶
    }
    
    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, environment.ambientIntensity);
    this.scene.add(ambientLight);
    
    // 添加方向光（太阳光）
    const directionalLight = new THREE.DirectionalLight(0xffffff, environment.directionalIntensity);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    this.scene.add(directionalLight);
    
    // 创建地面
    const groundGeometry = new THREE.PlaneGeometry(400, 400, 100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: environment.groundColor,
      roughness: 0.8,
      metalness: 0,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    
    // 添加网格辅助线（可选）
    const gridHelper = new THREE.GridHelper(400, 40, 0x444444, 0x888888);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);
  }

  /**
   * 生成道路
   */
  async generateRoads(roads) {
    roads.forEach((roadData) => {
      const { points, features } = roadData;
      const { width, color, hasMarkings } = features;
      
      // 创建道路几何体
      const roadShape = new THREE.Shape();
      
      if (points.length >= 2) {
        // 使用样条曲线创建平滑道路
        const curvePoints = points.map(p => new THREE.Vector3(p[0], p[2], p[1]));
        const curve = new THREE.CatmullRomCurve3(curvePoints);
        
        // 创建挤出几何体
        const extrudeSettings = {
          steps: 100,
          depth: 0.1,
          bevelEnabled: false,
        };
        
        const path = new THREE.Path(curve.getPoints(50));
        const roadGeometry = new THREE.ExtrudeGeometry(
          path,
          {
            ...extrudeSettings,
            extrudePath: new THREE.LineCurve3(
              new THREE.Vector3(0, -width / 2, 0),
              new THREE.Vector3(0, width / 2, 0)
            ),
          }
        );
        
        const roadMaterial = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.8,
          metalness: 0.1,
        });
        
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.receiveShadow = true;
        this.scene.add(road);
        
        // 添加道路标线
        if (hasMarkings) {
          this.addRoadMarkings(curve, width);
        }
      }
    });
  }

  /**
   * 添加道路标线
   */
  addRoadMarkings(curve, width) {
    const markingsMaterial = new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      roughness: 0.3,
      metalness: 0,
    });
    
    const markingPositions = curve.getPoints(50);
    
    markingPositions.forEach((pos, i) => {
      if (i % 5 === 0 && i > 0 && i < markingPositions.length - 1) {
        const markingGeometry = new THREE.BoxGeometry(3, 0.1, 0.15);
        const marking = new THREE.Mesh(markingGeometry, markingsMaterial);
        
        const nextPos = markingPositions[i + 1];
        const direction = nextPos.clone().sub(pos).normalize();
        
        marking.position.set(pos.x, 0.06, pos.z);
        marking.lookAt(pos.x + direction.x, 0.06, pos.z + direction.z);
        marking.scale.z = width * 0.6;
        
        this.scene.add(marking);
      }
    });
  }

  /**
   * 生成建筑
   */
  async generateBuildings(buildings) {
    const specificBuildings = buildings.filter(b => b.type === 'specific-building');
    const genericBuildings = buildings.filter(b => b.type === 'generic-building');
    
    // 生成特定建筑（非实例化）
    specificBuildings.forEach((buildingData) => {
      const { position, scale, features, lod } = buildingData;
      
      // 创建建筑模型
      const building = this.modelGenerator.createSpecificBuilding(features);
      
      // 创建LOD
      const lodObject = this.modelGenerator.createLOD(building, lod);
      
      // 设置位置和缩放
      lodObject.position.set(position[0], position[1], position[2]);
      lodObject.scale.set(scale[0], scale[1], scale[2]);
      
      // 启用阴影
      lodObject.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      this.scene.add(lodObject);
      this.lodObjects.push(lodObject);
    });
    
    // 生成通用建筑（使用实例化渲染）
    this.generateGenericBuildingsInstanced(genericBuildings);
  }

  /**
   * 使用实例化渲染生成通用建筑
   */
  generateGenericBuildingsInstanced(buildings) {
    // 按特征分组
    const groups = {};
    
    buildings.forEach((buildingData) => {
      const { features, position, scale } = buildingData;
      const key = `${features.height}-${features.width}-${features.depth}-${features.color}`;
      
      if (!groups[key]) {
        groups[key] = {
          features: features,
          instances: [],
        };
      }
      
      groups[key].instances.push({ position, scale });
    });
    
    // 为每组创建实例化网格
    Object.values(groups).forEach((group) => {
      // 创建基础模型
      const baseBuilding = this.modelGenerator.createGenericBuilding(group.features);
      
      // 合并几何体
      const mergedGeometry = this.mergeGroupGeometry(baseBuilding);
      
      if (mergedGeometry) {
        const material = new THREE.MeshStandardMaterial({
          color: group.features.color,
          roughness: 0.4,
          metalness: 0.1,
        });
        
        // 创建实例化网格
        const instancedMesh = new THREE.InstancedMesh(
          mergedGeometry,
          material,
          group.instances.length
        );
        
        // 设置实例矩阵
        const matrix = new THREE.Matrix4();
        group.instances.forEach((instance, i) => {
          matrix.makeTranslation(
            instance.position[0],
            instance.position[1],
            instance.position[2]
          );
          matrix.scale(new THREE.Vector3(instance.scale[0], instance.scale[1], instance.scale[2]));
          instancedMesh.setMatrixAt(i, matrix);
        });
        
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = true;
        
        this.scene.add(instancedMesh);
        this.instancedMeshes[group.features.color] = instancedMesh;
      }
    });
  }

  /**
   * 合并组内的几何体
   */
  mergeGroupGeometry(group) {
    const geometries = [];
    
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const cloned = child.geometry.clone();
        cloned.translate(child.position.x, child.position.y, child.position.z);
        geometries.push(cloned);
      }
    });
    
    if (geometries.length === 0) return null;
    
    // 合并所有几何体
    const merged = geometries.reduce((acc, geo) => {
      acc.merge(geo);
      return acc;
    });
    
    return merged;
  }

  /**
   * 生成树木（使用实例化渲染）
   */
  async generateTrees(trees) {
    // 按类型分组
    const groups = {};
    
    trees.forEach((treeData) => {
      const { features, position, scale } = treeData;
      const key = `${features.type}-${features.height}`;
      
      if (!groups[key]) {
        groups[key] = {
          features: features,
          instances: [],
        };
      }
      
      groups[key].instances.push({ position, scale });
    });
    
    // 为每组创建实例化网格
    Object.values(groups).forEach((group) => {
      // 创建基础模型
      const baseTree = this.modelGenerator.createTree(group.features);
      
      // 合并几何体
      const mergedGeometry = this.mergeGroupGeometry(baseTree);
      
      if (mergedGeometry) {
        const material = new THREE.MeshStandardMaterial({
          color: group.features.color,
          roughness: 0.3,
          metalness: 0,
        });
        
        // 创建实例化网格
        const instancedMesh = new THREE.InstancedMesh(
          mergedGeometry,
          material,
          group.instances.length
        );
        
        // 设置实例矩阵
        const matrix = new THREE.Matrix4();
        group.instances.forEach((instance, i) => {
          matrix.makeTranslation(
            instance.position[0],
            instance.position[1],
            instance.position[2]
          );
          matrix.scale(new THREE.Vector3(instance.scale[0], instance.scale[1], instance.scale[2]));
          instancedMesh.setMatrixAt(i, matrix);
        });
        
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = true;
        
        this.scene.add(instancedMesh);
        this.instancedMeshes[`tree-${group.features.type}`] = instancedMesh;
      }
    });
  }

  /**
   * 生成路灯
   */
  async generateStreetLights(streetLights) {
    // 使用实例化渲染
    const features = streetLights[0]?.features || {};
    
    // 创建基础模型
    const baseLight = this.modelGenerator.createStreetLight(features);
    
    // 合并几何体
    const mergedGeometry = this.mergeGroupGeometry(baseLight);
    
    if (mergedGeometry) {
      const material = new THREE.MeshStandardMaterial({
        color: '#757575',
        roughness: 0.5,
        metalness: 0.3,
      });
      
      // 创建实例化网格
      const instancedMesh = new THREE.InstancedMesh(
        mergedGeometry,
        material,
        streetLights.length
      );
      
      // 设置实例矩阵
      const matrix = new THREE.Matrix4();
      streetLights.forEach((lightData, i) => {
        const { position, scale } = lightData;
        matrix.makeTranslation(position[0], position[1], position[2]);
        matrix.scale(new THREE.Vector3(scale[0], scale[1], scale[2]));
        instancedMesh.setMatrixAt(i, matrix);
      });
      
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = false;
      
      this.scene.add(instancedMesh);
      this.instancedMeshes['streetlight'] = instancedMesh;
    }
  }

  /**
   * 更新LOD（需要在每一帧调用）
   */
  updateLOD(camera) {
    this.camera = camera;
    
    this.lodObjects.forEach((lod) => {
      if (lod.update) {
        lod.update(camera);
      }
    });
  }

  /**
   * 视锥体剔除（需要在每一帧调用）
   */
  frustumCulling(camera) {
    if (!camera || !camera.frustum) {
      // 计算视锥体
      camera.updateMatrixWorld();
      const projScreenMatrix = new THREE.Matrix4();
      projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      camera.frustum = new THREE.Frustum();
      camera.frustum.setFromProjectionMatrix(projScreenMatrix);
    }
    
    // 对非实例化对象进行视锥体剔除
    this.objectsWithCulling.forEach((obj) => {
      if (obj.geometry) {
        obj.visible = camera.frustum.intersectsObject(obj);
      }
    });
  }

  /**
   * 获取场景统计信息
   */
  getStats() {
    let totalVertices = 0;
    let totalFaces = 0;
    let totalInstances = 0;
    
    this.scene.traverse((child) => {
      if (child.geometry) {
        totalVertices += child.geometry.attributes.position.count;
        if (child.geometry.index) {
          totalFaces += child.geometry.index.count / 3;
        } else {
          totalFaces += child.geometry.attributes.position.count / 3;
        }
      }
      if (child instanceof THREE.InstancedMesh) {
        totalInstances += child.count;
      }
    });
    
    return {
      vertices: totalVertices,
      faces: Math.floor(totalFaces),
      instances: totalInstances,
      objects: this.scene.children.length,
      lodObjects: this.lodObjects.length,
    };
  }
}
