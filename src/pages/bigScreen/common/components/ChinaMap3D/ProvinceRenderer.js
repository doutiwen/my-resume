/**
 * ProvinceRenderer.js - 省份3D渲染器模块
 *
 * 功能说明：
 * - 负责将省份地理数据转换为Three.js 3D网格模型
 * - 仅创建省份顶面（简化版）
 * - 处理鼠标悬停时的颜色过渡动画
 * - 提供省份外观的动态调节接口（颜色、线框等）
 */

import * as THREE from 'three';
import wallSideTextureImage from '../../imgs/texture_cake_1.png';

/**
 * 省份渲染器类
 *
 * 功能：
 * - 根据预计算的省份多边形数据创建3D模型
 * - 创建省份的顶面（简化版，无围墙）
 * - 管理悬停状态和颜色动画
 *
 * @class ProvinceRenderer
 */
export class ProvinceRenderer {
  static extrudeConfig = {
    bevelEnabled: false,
    bevelThickness: 0,
    bevelSize: 0,
    bevelSegments: 0,
  };

  /**
   * 构造函数
   *
   * @param {Object} precomputedData - 预计算的省份数据（来自Worker处理）
   * @param {string} precomputedData.name - 省份名称
   * @param {Array} precomputedData.polygons - 多边形数组
   */
  constructor(precomputedData, wallHeight = 1) {
    this.provinceGroup = new THREE.Group();
    this.topMeshes = [];
    this.isHovered = false;
    this.name = precomputedData.name;
    this.animationProgress = 0;
    this.targetAnimationProgress = 0;
    this.animationSpeed = 0.15;
    this.wallHeight = wallHeight;
    this.colors = {
      topNormal: new THREE.Color('#4f5fc2'),
      wallTopNormal: new THREE.Color('#ffffff'),
      hover: new THREE.Color('#7ca0e8'),
    };
    this.colors.topHover = this.colors.hover;
    this.colors.wallTopHover = this.colors.hover;
    this.sideTexture = this.createSideTexture();
    this.createProvince(precomputedData);
  }

  createSideTexture() {
    const texture = new THREE.TextureLoader().load(wallSideTextureImage, (loadedTexture) => {
      loadedTexture.wrapS = THREE.RepeatWrapping;
      loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
      loadedTexture.repeat.set(1, 1);
      loadedTexture.needsUpdate = true;
    });
    return texture;
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
   * 创建单个多边形的3D模型（仅顶面）
   *
   * @param {Object} polygonData - 多边形数据
   * @param {Array} polygonData.points - 投影后的边界点数组
   */
  createPolygon(polygonData) {
    const { points, innerPoints } = polygonData;
    this.createMainMesh(points);

    if (innerPoints && innerPoints.length >= 3) {
      this.createWallMesh(points, innerPoints);
    }
  }

  createMainMesh(points) {
    const shape = new THREE.Shape();

    if (points && points.length > 0) {
      const firstPoint = points[0];
      shape.moveTo(firstPoint.x, -firstPoint.z);
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i].x, -points[i].z);
      }
      shape.closePath();
    }

    const geo = new THREE.ShapeGeometry(shape);
    const topMaterial = new THREE.MeshBasicMaterial({
      color: this.colors.topNormal,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, topMaterial);
    mesh.userData = { name: this.name, hovered: false, isWall: false };
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = this.wallHeight;
    this.provinceGroup.add(mesh);
    this.topMeshes.push(mesh);
  }

  createWallMesh(outerPoints, innerPoints) {
    const shape = new THREE.Shape();

    if (outerPoints && outerPoints.length > 0) {
      const firstPoint = outerPoints[0];
      shape.moveTo(firstPoint.x, -firstPoint.z);
      for (let i = 1; i < outerPoints.length; i++) {
        shape.lineTo(outerPoints[i].x, -outerPoints[i].z);
      }
      shape.closePath();
    }

    const hole = new THREE.Path();
    const firstInnerPoint = innerPoints[0];
    hole.moveTo(firstInnerPoint.x, -firstInnerPoint.z);

    for (let i = 1; i < innerPoints.length; i++) {
      hole.lineTo(innerPoints[i].x, -innerPoints[i].z);
    }
    hole.closePath();
    shape.holes.push(hole);

    const wallGeo = new THREE.ExtrudeGeometry(shape, {
      depth: this.wallHeight + 0.1,
      steps: 1,
      ...ProvinceRenderer.extrudeConfig,
    });
    const wallTopMaterial = new THREE.MeshBasicMaterial({
      color: this.colors.wallTopNormal,
      side: THREE.DoubleSide,
    });
    const wallSideMaterial = new THREE.MeshBasicMaterial({
      map: this.sideTexture,
      side: THREE.DoubleSide,
    });

    const wallMesh = new THREE.Mesh(wallGeo, [wallTopMaterial, wallSideMaterial]);
    wallMesh.userData = { name: this.name, hovered: false, isWall: true };
    wallMesh.rotation.x = -Math.PI / 2;
    wallMesh.position.y = 0;
    this.provinceGroup.add(wallMesh);
    this.topMeshes.push(wallMesh);
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
    this.animationProgress +=
      (this.targetAnimationProgress - this.animationProgress) * this.animationSpeed;

    this.topMeshes.forEach((mesh) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const isWall = mesh.userData.isWall === true;

      if (isWall && materials.length >= 2) {
        const wallTopColor = new THREE.Color();
        wallTopColor.lerpColors(
          this.colors.wallTopNormal,
          this.colors.wallTopHover,
          this.animationProgress
        );
        materials[0].color.copy(wallTopColor);
      } else if (!isWall && materials.length >= 1) {
        const topColor = new THREE.Color();
        topColor.lerpColors(this.colors.topNormal, this.colors.topHover, this.animationProgress);
        materials[0].color.copy(topColor);
      }
    });
  }

  /**
   * 设置省份颜色
   *
   * @param {string} color - 颜色值（如 '#ff0000'）
   */
  setColor(color) {
    this.colors.topNormal = new THREE.Color(color);
    this.topMeshes.forEach((mesh) => {
      if (!mesh.userData.isWall) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials[0].color.copy(this.colors.topNormal);
      }
    });
  }

  /**
   * 设置发光强度（兼容旧API）
   *
   * @param {number} intensity - 发光强度（0-1）
   */
  setEmissiveIntensity(intensity) {
    // 当前使用 MeshBasicMaterial，不支持发光效果
    // 此方法保留以兼容GUI调用
  }

  /**
   * 设置边框可见性（兼容旧API）
   *
   * @param {boolean} visible - 是否可见
   */
  setEdgesVisible(visible) {
    // 当前实现不包含边框线
    // 此方法保留以兼容GUI调用
  }

  /**
   * 设置线框模式（兼容旧API）
   *
   * @param {boolean} wireframe - 是否启用线框模式
   */
  setWireframe(wireframe) {
    this.topMeshes.forEach((mesh) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((mat) => {
        mat.wireframe = wireframe;
      });
    });
  }

  /**
   * 销毁渲染器，释放所有GPU资源
   *
   * 重要：组件卸载时必须调用此方法，防止内存泄漏
   */
  dispose() {
    this.topMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => mat.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    if (this.sideTexture) {
      this.sideTexture.dispose();
    }
  }
}
