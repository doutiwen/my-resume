/**
 * ProvinceRenderer.js - 省份3D渲染器模块
 *
 * 功能说明：
 * - 负责将省份地理数据转换为Three.js 3D网格模型
 * - 管理省份的顶面和侧面围墙的创建
 * - 处理鼠标悬停时的颜色过渡动画
 * - 提供省份外观的动态调节接口（颜色、边框、线框等）
 *
 * 结构说明：
 * - 顶部（Top）：省份的顶面，使用ShapeGeometry
 * - 侧面（Wall）：省份的围墙侧边，形成3D立体效果
 */

import * as THREE from 'three';
import { createSharedProjection } from './utils.js';

// 重新导出 createSharedProjection，保持向后兼容
export { createSharedProjection };

/**
 * 省份渲染器类
 *
 * 功能：
 * - 根据预计算的省份多边形数据创建3D模型
 * - 创建省份的顶面和侧面围墙
 * - 管理悬停状态和颜色动画
 *
 * @class ProvinceRenderer
 */
export class ProvinceRenderer {
  /**
   * 构造函数
   *
   * @param {Object} precomputedData - 预计算的省份数据（来自Worker处理）
   * @param {string} precomputedData.name - 省份名称
   * @param {Array} precomputedData.polygons - 多边形数组
   * @param {THREE.CanvasTexture} gradientTexture - 渐变纹理
   * @param {Object} options - 配置选项
   */
  constructor(precomputedData, gradientTexture, options = {}) {
    /** @type {THREE.CanvasTexture} 渐变纹理 */
    this.gradientTexture = gradientTexture;

    /** @type {number} 边框高度（省份立体墙的高度） */
    this.edgeHeight = options.edgeHeight || 0.15;

    /** @type {number} 围墙厚度（向外扩展的厚度） */
    this.wallThickness = options.wallThickness || 0.3;

    /** @type {THREE.Texture} 围墙纹理 */
    this.wallTexture = null;

    /** @type {THREE.Group} 省份Group，包含所有子网格 */
    this.provinceGroup = new THREE.Group();

    /** @type {THREE.Mesh[]} 顶面网格数组（用于射线检测） */
    this.topMeshes = [];

    /** @type {THREE.Mesh} 围墙网格 */
    this.wallMesh = null;

    /** @type {THREE.Mesh[]} 围墙顶面网格数组 */
    this.wallTopMeshes = [];

    /** @type {boolean} 当前是否处于悬停状态 */
    this.isHovered = false;

    /** @type {string} 省份名称 */
    this.name = precomputedData.name;

    /** @type {number} 动画进度（0-1之间） */
    this.animationProgress = 0;

    /** @type {number} 目标动画进度 */
    this.targetAnimationProgress = 0;

    /** @type {number} 动画速度（每帧插值的比例） */
    this.animationSpeed = 0.15;

    /**
     * 颜色配置
     *
     * 结构说明：
     * - wallTopNormal: 围墙顶面正常颜色
     * - wallTopHover: 围墙顶面悬停颜色
     * - topNormal: 省份顶面正常颜色
     * - topHover: 省份顶面悬停颜色
     */
    this.colors = {
      wallTopNormal: new THREE.Color('#ffffff'), // 白色
      wallTopHover: new THREE.Color('#ff4500'), // 橙红色（悬停高亮）
      topNormal: new THREE.Color('#4f5fc2'), // 蓝色（正常状态）
      topHover: new THREE.Color('#6b7dd4'), // 浅蓝色（悬停状态）
    };

    // 创建省份3D模型
    this.createProvince(precomputedData);
  }

  /**
   * 创建省份的完整3D模型
   *
   * @param {Object} precomputedData - 预计算的省份数据
   */
  createProvince(precomputedData) {
    // 遍历该省份的所有多边形（一个省份可能有多个多边形，如岛屿）
    precomputedData.polygons.forEach((polygonData) => {
      this.createPolygon(polygonData);
    });
  }

  /**
   * 创建单个多边形的3D模型
   *
   * 每个多边形包含：
   * 1. 顶面（TopMesh）：省份上方的面
   * 2. 围墙（WallMesh）：侧面的垂直墙面
   * 3. 围墙顶面（WallTopMesh）：围墙顶部的面
   *
   * @param {Object} polygonData - 多边形数据
   * @param {Array} polygonData.innerPoints - 内点数组（省份边界）
   * @param {Array} polygonData.outerPoints - 外点数组（带厚度的边界）
   * @param {Array} polygonData.wallPositions - 围墙顶点位置
   * @param {Array} polygonData.wallUvs - 围墙纹理坐标
   * @param {Array} polygonData.wallIndices - 围墙索引
   */
  createPolygon(polygonData) {
    const { innerPoints, outerPoints } = polygonData;

    // ==================== 创建顶面 ====================

    // 创建THREE.Shape（2D形状路径）
    const shape = new THREE.Shape();

    // 先绘制外边界（省份的实际边界）
    if (innerPoints && innerPoints.length > 0) {
      const firstPoint = innerPoints[0];
      // Shape在XY平面创建，旋转-90度后会将y转为-z
      // 由于数据已在geoWorker中取反（z = -y），这里需要再次取反以抵消旋转的影响
      shape.moveTo(firstPoint.x, -firstPoint.z);

      // 依次连接所有内点（作为外边界）
      for (let i = 1; i < innerPoints.length; i++) {
        shape.lineTo(innerPoints[i].x, -innerPoints[i].z);
      }
      shape.closePath();
    }

    // 从Shape创建几何体
    const topGeo = new THREE.ShapeGeometry(shape);

    // 创建基础材质（使用配置的颜色）
    const topMaterial = new THREE.MeshBasicMaterial({
      color: this.colors.topNormal, // 使用配置的蓝色
      transparent: true, // 允许透明
      opacity: 0.6, // 透明度60%
      side: THREE.DoubleSide, // 双面渲染
      depthWrite: true, // 写入深度缓冲
      depthTest: true, // 进行深度测试
    });

    // 创建顶面网格
    const topMesh = new THREE.Mesh(topGeo, topMaterial);
    topMesh.userData = { name: this.name, hovered: false }; // 存储元数据
    // 将顶面从XY平面旋转到XZ平面（绕X轴旋转-90度）
    topMesh.rotation.x = -Math.PI / 2;
    // 设置顶面高度（在地面位置，Y=0）
    topMesh.position.y = 0;
    this.provinceGroup.add(topMesh); // 添加到Group
    this.topMeshes.push(topMesh); // 保存引用用于射线检测

    // 确保顶面在渲染顺序中优先于围墙顶面
    topMesh.renderOrder = 1;

    // ==================== 创建围墙（使用ExtrudeGeometry）====================

    // 创建围墙的Shape（外边界 - 内边界 = 围墙厚度）
    const wallShape = new THREE.Shape();

    // 先绘制外边界（顺时针方向）
    if (outerPoints && outerPoints.length > 0) {
      wallShape.moveTo(outerPoints[0].x, -outerPoints[0].z);
      for (let i = 1; i < outerPoints.length; i++) {
        wallShape.lineTo(outerPoints[i].x, -outerPoints[i].z);
      }
      wallShape.closePath();
    }

    // 添加内边界作为洞（逆时针方向）
    if (innerPoints && innerPoints.length > 0) {
      const holeShape = new THREE.Shape();
      holeShape.moveTo(innerPoints[0].x, -innerPoints[0].z);
      for (let i = 1; i < innerPoints.length; i++) {
        holeShape.lineTo(innerPoints[i].x, -innerPoints[i].z);
      }
      holeShape.closePath();
      wallShape.holes.push(holeShape);
    }

    // 异步加载围墙纹理
    this.loadWallTexture((texture) => {
      // ==================== 创建围墙侧面 ====================

      // 使用ExtrudeGeometry拉伸创建3D围墙（仅侧面）
      const extrudeSettings = {
        depth: this.edgeHeight, // 围墙高度
        bevelEnabled: false, // 禁用倒角
        steps: 1,
        curveSegments: 12, // 曲线段数
      };

      const wallGeo = new THREE.ExtrudeGeometry(wallShape, extrudeSettings);

      // 创建围墙侧面材质（使用纹理）
      const wallSideMaterial = new THREE.MeshBasicMaterial({
        map: texture, // 纹理贴图
        side: THREE.DoubleSide, // 双面渲染
        depthWrite: true, // 写入深度缓冲
        depthTest: true, // 进行深度测试
      });

      // 创建围墙网格
      this.wallMesh = new THREE.Mesh(wallGeo, wallSideMaterial);

      // 将围墙从XY平面旋转到XZ平面（绕X轴旋转-90度）
      this.wallMesh.rotation.x = -Math.PI / 2;

      // 设置围墙位置（底部对齐到地面，Y=0处）
      this.wallMesh.position.y = 0;

      this.provinceGroup.add(this.wallMesh);

      // ==================== 创建围墙顶面 ====================

      // 使用ShapeGeometry创建围墙顶面
      const wallTopGeo = new THREE.ShapeGeometry(wallShape);

      // 创建围墙顶面材质（纯色，响应hover）
      const wallTopMaterial = new THREE.MeshBasicMaterial({
        color: this.colors.wallTopNormal, // 白色
        side: THREE.DoubleSide, // 双面渲染
        depthWrite: true, // 写入深度缓冲
        depthTest: true, // 进行深度测试
      });

      // 创建围墙顶面网格
      const wallTopMesh = new THREE.Mesh(wallTopGeo, wallTopMaterial);
      wallTopMesh.userData = { name: this.name, hovered: false };

      // 将顶面从XY平面旋转到XZ平面（绕X轴旋转-90度）
      wallTopMesh.rotation.x = -Math.PI / 2;

      // 设置顶面高度（在围墙顶部，Y = edgeHeight）
      wallTopMesh.position.y = this.edgeHeight;

      this.provinceGroup.add(wallTopMesh);
      this.wallTopMeshes.push(wallTopMesh);
    });
  }

  /**
   * 异步加载围墙纹理
   *
   * @param {Function} callback - 加载完成后的回调函数，参数为加载的纹理（失败时为null）
   */
  loadWallTexture(callback) {
    const textureLoader = new THREE.TextureLoader();

    // 围墙纹理图片路径
    const texturePath = 'src/pages/bigScreen/common/imgs/texture_cake_1.png';

    textureLoader.load(
      texturePath,
      (texture) => {
        // 设置纹理水平方向重复
        texture.wrapS = THREE.RepeatWrapping;

        // 设置垂直方向拉伸（不重复）
        texture.wrapT = THREE.ClampToEdgeWrapping;

        // 水平方向重复3次，垂直方向不重复
        texture.repeat.set(3, 1);

        // 禁用Y轴翻转，确保图片底部对应围墙底部
        texture.flipY = false;

        this.wallTexture = texture;
        callback(texture);
      },
      undefined, // 进度回调（未使用）
      (error) => {
        console.error('Failed to load wall texture:', error);
        // 如果纹理加载失败，使用默认颜色材质
        callback(null);
      }
    );
  }

  /**
   * 设置省份的悬停状态
   *
   * @param {boolean} hovered - 是否悬停
   */
  setHovered(hovered) {
    // 如果状态没变，不做处理
    if (this.isHovered === hovered) return;

    this.isHovered = hovered;

    // 设置目标动画进度：悬停时为1，正常时为0
    this.targetAnimationProgress = hovered ? 1 : 0;

    // 更新所有顶面网格的userData
    this.topMeshes.forEach((mesh) => {
      mesh.userData.hovered = hovered;
    });
  }

  /**
   * 更新动画状态
   *
   * 在渲染循环中每帧调用
   * 实现颜色从正常到悬停的平滑过渡
   */
  update() {
    // 插值计算当前动画进度
    // 使用线性插值：current += (target - current) * speed
    this.animationProgress +=
      (this.targetAnimationProgress - this.animationProgress) * this.animationSpeed;

    // 更新围墙顶面颜色
    this.wallTopMeshes.forEach((mesh) => {
      const currentColor = new THREE.Color();
      currentColor.lerpColors(
        this.colors.wallTopNormal, // 起始颜色（白色）
        this.colors.wallTopHover, // 目标颜色（橙红色）
        this.animationProgress // 插值因子（0-1）
      );
      mesh.material.color.copy(currentColor);
    });

    // 更新顶面颜色
    this.topMeshes.forEach((mesh) => {
      const currentColor = new THREE.Color();
      currentColor.lerpColors(this.colors.topNormal, this.colors.topHover, this.animationProgress);
      mesh.material.color.copy(currentColor);
    });
  }

  /**
   * 设置边框（围墙）可见性
   *
   * @param {boolean} visible - 是否可见
   */
  setEdgesVisible(visible) {
    if (this.wallMesh) this.wallMesh.visible = visible;

    this.wallTopMeshes.forEach((mesh) => {
      mesh.visible = visible;
    });
  }

  /**
   * 设置发光强度（BasicMaterial不支持，留空）
   *
   * @param {number} value - 发光强度值
   */
  setEmissiveIntensity(value) {
    // BasicMaterial不支持emissive，这里留空
    // 如果改用MeshStandardMaterial，需要实现此方法
  }

  /**
   * 设置省份颜色
   *
   * @param {string} color - 颜色值（Hex字符串）
   */
  setColor(color) {
    this.topMeshes.forEach((mesh) => {
      mesh.material.color.set(color);
    });
  }

  /**
   * 设置线框模式
   *
   * @param {boolean} wireframe - 是否显示线框
   */
  setWireframe(wireframe) {
    this.topMeshes.forEach((mesh) => {
      mesh.material.wireframe = wireframe;
    });
  }

  /**
   * 销毁渲染器，释放所有GPU资源
   *
   * 重要：组件卸载时必须调用此方法，防止内存泄漏
   */
  dispose() {
    // 销毁所有顶面网格的几何体和材质
    this.topMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });

    // 销毁围墙网格
    if (this.wallMesh) {
      this.wallMesh.geometry.dispose();
      this.wallMesh.material.dispose();
    }

    // 销毁所有围墙顶面网格
    this.wallTopMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });

    // 销毁围墙纹理
    if (this.wallTexture) {
      this.wallTexture.dispose();
    }
  }
}
