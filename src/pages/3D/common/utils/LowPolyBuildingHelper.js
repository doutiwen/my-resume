import * as THREE from 'three';

/**
 * 创建双坡屋顶（人字形屋顶）
 * @param {number} width - 屋顶宽度
 * @param {number} depth - 屋顶深度
 * @param {number} height - 屋顶高度
 * @param {string} color - 屋顶颜色
 * @returns {THREE.Group} 屋顶组对象
 */
export function createGableRoof(width, depth, height, color) {
  const roofGroup = new THREE.Group();

  // 屋顶材质
  const roofMaterial = new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
  });

  // 计算参数
  const halfWidth = width / 2;

  // 创建三角形形状（用于拉伸）
  const triangleShape = new THREE.Shape();
  triangleShape.moveTo(-halfWidth, 0);
  triangleShape.lineTo(0, height);
  triangleShape.lineTo(halfWidth, 0);
  triangleShape.lineTo(-halfWidth, 0);

  // 拉伸设置
  const extrudeSettings = {
    depth: depth,
    bevelEnabled: false,
  };

  // 创建拉伸几何体
  const roofGeometry = new THREE.ExtrudeGeometry(triangleShape, extrudeSettings);
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);

  // 调整位置（将屋顶中心对齐到建筑顶部）
  roof.position.z = -depth / 2;
  roof.position.y = height / 2;

  roofGroup.add(roof);

  return roofGroup;
}

/**
 * 创建低细节建筑几何体（返回 THREE.Group）
 * @param {Object} options - 建筑参数
 * @param {number} [options.width=8] - 建筑宽度
 * @param {number} [options.height=10] - 建筑高度
 * @param {number} [options.depth=8] - 建筑深度
 * @param {string} [options.color='#666666'] - 建筑颜色
 * @param {string} [options.roofColor='#5D4037'] - 屋顶颜色
 * @param {number} [options.roofHeight=3] - 屋顶高度
 * @returns {THREE.Group} 建筑组对象
 */
export function createLowPolyBuilding(options = {}) {
  const {
    width = 8,
    height = 10,
    depth = 8,
    color = '#666666',
    roofColor = '#5D4037',
    roofHeight = 3,
  } = options;

  const group = new THREE.Group();

  // 建筑主体
  const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  group.add(body);

  // 双坡屋顶（人字形屋顶）
  const roof = createGableRoof(width + 1, depth + 1, roofHeight, roofColor);
  roof.position.y = height / 2;
  group.add(roof);

  return group;
}

/**
 * 根据模型名称获取对应颜色
 * @param {string} modelName - 模型名称
 * @returns {string} 颜色值
 */
export function getBuildingColor(modelName) {
  const colors = {
    city_hall: '#4A90D9',
    hospital: '#E53935',
    school: '#4CAF50',
    mall: '#FF9800',
  };
  return colors[modelName] || '#666666';
}
