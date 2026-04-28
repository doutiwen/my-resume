import * as THREE from 'three';

/**
 * 模型生成器类
 * 负责根据特征数据生成各种3D模型
 */
export class ModelGenerator {
  constructor() {
    this.materials = {
      building: new THREE.MeshStandardMaterial({
        color: '#4A90D9',
        roughness: 0.3,
        metalness: 0.2,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: '#87CEEB',
        roughness: 0.1,
        metalness: 0.1,
        transparent: true,
        opacity: 0.6,
      }),
      road: new THREE.MeshStandardMaterial({
        color: '#424242',
        roughness: 0.8,
        metalness: 0.1,
      }),
      treeTrunk: new THREE.MeshStandardMaterial({
        color: '#8D6E63',
        roughness: 0.7,
        metalness: 0,
      }),
      treeLeaves: new THREE.MeshStandardMaterial({
        color: '#4CAF50',
        roughness: 0.3,
        metalness: 0,
        side: THREE.DoubleSide,
      }),
      streetLight: new THREE.MeshStandardMaterial({
        color: '#BDBDBD',
        roughness: 0.5,
        metalness: 0.3,
      }),
      lightBulb: new THREE.MeshStandardMaterial({
        color: '#FFEB3B',
        roughness: 0.1,
        metalness: 0,
        emissive: '#FFEB3B',
        emissiveIntensity: 0.5,
      }),
    };
  }

  /**
   * 创建特定建筑（如市政厅、医院、学校等）
   */
  createSpecificBuilding(features) {
    const { height, width, depth, color, hasGlass, hasAntenna, hasCross, hasFlag, levels } = features;
    
    const group = new THREE.Group();
    
    // 建筑主体
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.3,
      metalness: 0.2,
    });
    const building = new THREE.Mesh(geometry, material);
    building.position.y = height / 2;
    group.add(building);
    
    // 玻璃窗户
    if (hasGlass) {
      const windowRows = Math.floor(levels);
      const windowCols = Math.floor(width / 3);
      const windowDepth = depth + 0.1;
      
      for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
          const windowGeo = new THREE.BoxGeometry(1.5, 2, windowDepth);
          const windowMat = new THREE.MeshStandardMaterial({
            color: '#B3E5FC',
            roughness: 0.1,
            metalness: 0.1,
            transparent: true,
            opacity: 0.7,
            emissive: '#B3E5FC',
            emissiveIntensity: 0.2,
          });
          const windowMesh = new THREE.Mesh(windowGeo, windowMat);
          windowMesh.position.set(
            (col - (windowCols - 1) / 2) * 3,
            height / 2 - row * (height / levels) - (height / levels) / 2,
            depth / 2 + 0.05
          );
          group.add(windowMesh);
        }
      }
    }
    
    // 天线
    if (hasAntenna) {
      const antennaGeo = new THREE.CylinderGeometry(0.2, 0.1, 5, 8);
      const antennaMat = new THREE.MeshStandardMaterial({ color: '#757575' });
      const antenna = new THREE.Mesh(antennaGeo, antennaMat);
      antenna.position.y = height + 2.5;
      group.add(antenna);
      
      // 天线顶端
      const topGeo = new THREE.SphereGeometry(0.3, 16, 16);
      const topMat = new THREE.MeshStandardMaterial({ color: '#FF9800' });
      const top = new THREE.Mesh(topGeo, topMat);
      top.position.y = height + 5.3;
      group.add(top);
    }
    
    // 十字架（医院）
    if (hasCross) {
      const crossGroup = new THREE.Group();
      const crossMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF' });
      
      // 水平杆
      const hBar = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.5, 0.5),
        crossMat
      );
      crossGroup.add(hBar);
      
      // 垂直杆
      const vBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 6, 0.5),
        crossMat
      );
      crossGroup.add(vBar);
      
      crossGroup.position.y = height + 3;
      group.add(crossGroup);
    }
    
    // 旗帜（学校）
    if (hasFlag) {
      // 旗杆
      const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 6, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: '#BDBDBD' });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = height + 3;
      group.add(pole);
      
      // 旗帜
      const flagGeo = new THREE.PlaneGeometry(3, 2);
      const flagMat = new THREE.MeshStandardMaterial({
        color: '#E53935',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      });
      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.position.set(1.5, height + 4, 0);
      flag.rotation.z = Math.PI / 6;
      group.add(flag);
    }
    
    return group;
  }

  /**
   * 创建通用建筑（住宅楼）
   */
  createGenericBuilding(features) {
    const { height, width, depth, color, levels } = features;
    
    const group = new THREE.Group();
    
    // 建筑主体
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.4,
      metalness: 0.1,
    });
    const building = new THREE.Mesh(geometry, material);
    building.position.y = height / 2;
    group.add(building);
    
    // 添加窗户
    const windowRows = levels;
    const windowCols = Math.floor(width / 2.5);
    const windowDepth = depth + 0.05;
    
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const windowGeo = new THREE.BoxGeometry(1, 1.5, windowDepth);
        const windowMat = new THREE.MeshStandardMaterial({
          color: '#B3E5FC',
          roughness: 0.1,
          metalness: 0.1,
          transparent: true,
          opacity: 0.8,
          emissive: '#B3E5FC',
          emissiveIntensity: 0.1,
        });
        const windowMesh = new THREE.Mesh(windowGeo, windowMat);
        windowMesh.position.set(
          (col - (windowCols - 1) / 2) * 2.5,
          height / 2 - row * (height / levels) - (height / levels) / 2,
          depth / 2 + 0.03
        );
        group.add(windowMesh);
      }
    }
    
    // 添加屋顶
    const roofGeo = new THREE.BoxGeometry(width + 0.5, 0.5, depth + 0.5);
    const roofMat = new THREE.MeshStandardMaterial({ color: '#5D4037' });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = height + 0.25;
    group.add(roof);
    
    return group;
  }

  /**
   * 创建树木
   */
  createTree(features) {
    const { height, type, color } = features;
    
    const group = new THREE.Group();
    
    // 树干
    const trunkHeight = height * 0.4;
    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, trunkHeight, 8);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: '#6D4C41',
      roughness: 0.7,
      metalness: 0,
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkHeight / 2;
    group.add(trunk);
    
    // 树冠
    const foliageHeight = height * 0.6;
    
    if (type === 'pine') {
      // 松树 - 锥形
      for (let i = 0; i < 3; i++) {
        const coneGeo = new THREE.ConeGeometry(
          foliageHeight * (0.6 - i * 0.15),
          foliageHeight * (0.4 - i * 0.1),
          8
        );
        const foliageMat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.3,
          metalness: 0,
          side: THREE.DoubleSide,
        });
        const foliage = new THREE.Mesh(coneGeo, foliageMat);
        foliage.position.y = trunkHeight + foliageHeight * 0.3 + i * foliageHeight * 0.25;
        group.add(foliage);
      }
    } else if (type === 'willow') {
      // 柳树 - 球形下垂
      const sphereGeo = new THREE.SphereGeometry(foliageHeight * 0.5, 16, 16);
      const foliageMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.3,
        metalness: 0,
        side: THREE.DoubleSide,
      });
      const foliage = new THREE.Mesh(sphereGeo, foliageMat);
      foliage.position.y = trunkHeight + foliageHeight * 0.5;
      foliage.scale.y = 1.2;
      group.add(foliage);
    } else {
      // 橡树 - 球形
      const sphereGeo = new THREE.SphereGeometry(foliageHeight * 0.5, 16, 16);
      const foliageMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.3,
        metalness: 0,
        side: THREE.DoubleSide,
      });
      const foliage = new THREE.Mesh(sphereGeo, foliageMat);
      foliage.position.y = trunkHeight + foliageHeight * 0.5;
      group.add(foliage);
    }
    
    return group;
  }

  /**
   * 创建路灯
   */
  createStreetLight(features) {
    const { height, isOn, color } = features;
    
    const group = new THREE.Group();
    
    // 灯杆
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.15, height, 8);
    const poleMat = new THREE.MeshStandardMaterial({
      color: '#757575',
      roughness: 0.5,
      metalness: 0.3,
    });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = height / 2;
    group.add(pole);
    
    // 横杆
    const armGeo = new THREE.BoxGeometry(1.5, 0.08, 0.08);
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.position.set(0.75, height - 0.5, 0);
    group.add(arm);
    
    // 灯头
    const headGeo = new THREE.BoxGeometry(0.5, 0.3, 0.3);
    const headMat = new THREE.MeshStandardMaterial({
      color: '#424242',
      roughness: 0.4,
      metalness: 0.5,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(1.5, height - 0.5, 0);
    group.add(head);
    
    // 灯泡
    const bulbGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: isOn ? color : '#757575',
      roughness: 0.1,
      metalness: 0,
      emissive: isOn ? color : 0x000000,
      emissiveIntensity: isOn ? 1 : 0,
      transparent: true,
      opacity: isOn ? 0.9 : 1,
    });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(1.5, height - 0.7, 0);
    group.add(bulb);
    
    // 发光效果
    if (isOn) {
      const glowGeo = new THREE.SphereGeometry(0.5, 16, 16);
      const glowMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0,
        metalness: 0,
        transparent: true,
        opacity: 0.2,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.set(1.5, height - 0.7, 0);
      group.add(glow);
    }
    
    return group;
  }

  /**
   * 创建道路
   */
  createRoad(features) {
    const { width, color, hasMarkings } = features;
    
    const group = new THREE.Group();
    
    // 道路主体
    const roadMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.8,
      metalness: 0.1,
    });
    
    return { mesh: null, material: roadMat, features, group };
  }

  /**
   * 创建LOD对象
   */
  createLOD(baseMesh, lodConfig) {
    const lod = new THREE.LOD();
    
    // 按距离排序
    const sortedConfigs = [...lodConfig].sort((a, b) => a.distance - b.distance);
    
    // 添加最高细节级别（原始模型）
    lod.addLevel(baseMesh, 0);
    
    // 添加其他级别
    sortedConfigs.forEach((config) => {
      let simplifiedMesh;
      
      if (config.detail === 'medium') {
        // 中等细节 - 简化几何体
        if (baseMesh.geometry) {
          simplifiedMesh = baseMesh.clone();
          simplifiedMesh.geometry = this.simplifyGeometry(baseMesh.geometry, 0.5);
        } else if (baseMesh instanceof THREE.Group) {
          simplifiedMesh = this.simplifyGroup(baseMesh, 0.5);
        }
      } else if (config.detail === 'low') {
        // 低细节 - 进一步简化
        if (baseMesh.geometry) {
          simplifiedMesh = baseMesh.clone();
          simplifiedMesh.geometry = this.simplifyGeometry(baseMesh.geometry, 0.2);
        } else if (baseMesh instanceof THREE.Group) {
          simplifiedMesh = this.simplifyGroup(baseMesh, 0.2);
        }
      }
      
      if (simplifiedMesh) {
        lod.addLevel(simplifiedMesh, config.distance);
      }
    });
    
    return lod;
  }

  /**
   * 简化几何体
   */
  simplifyGeometry(geometry, factor) {
    const simplified = geometry.clone();
    
    // 使用合并顶点和简化方法
    simplified.mergeVertices();
    
    // 如果支持简化修改器
    if (THREE.SimplifyModifier) {
      const simplifyModifier = new THREE.SimplifyModifier();
      return simplifyModifier.modify(simplified, Math.floor(geometry.attributes.position.count * factor));
    }
    
    return simplified;
  }

  /**
   * 简化组
   */
  simplifyGroup(group, factor) {
    const simplifiedGroup = group.clone();
    simplifiedGroup.children = group.children.map((child) => {
      if (child.geometry) {
        const simplified = child.clone();
        simplified.geometry = this.simplifyGeometry(child.geometry, factor);
        return simplified;
      }
      return child.clone();
    });
    return simplifiedGroup;
  }
}
