/**
 * RegionRenderer.js - 区域3D渲染器模块
 *
 * 功能说明：
 * - 负责将区域地理数据转换为Three.js 3D网格模型
 * - 仅创建区域顶面（简化版）
 * - 处理鼠标悬停时的颜色过渡动画
 * - 提供区域外观的动态调节接口（颜色、线框等）
 */

import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { globalTweenGroup } from '../utils/tween.js';
import {
  ProvinceVertexShader,
  ProvinceFragmentShader,
  ProvinceShaderUniforms,
} from '../shaders/ProvinceShader.js';
import wallSideTextureImage from '../../../imgs/texture_cake_1.png';

/**
 * 区域渲染器类
 *
 * 功能：
 * - 根据预计算的区域多边形数据创建3D模型
 * - 创建区域的顶面（简化版，无围墙）
 * - 管理悬停状态和颜色动画
 *
 * @class RegionRenderer
 */
export class RegionRenderer {
  static extrudeConfig = {
    bevelEnabled: false,
    bevelThickness: 0,
    bevelSize: 0,
    bevelSegments: 0,
  };

  /**
   * 构造函数
   *
   * @param {Object} precomputedData - 预计算的区域数据（来自Worker处理）
   * @param {string} precomputedData.name - 区域名称
   * @param {Array} precomputedData.polygons - 多边形数组
   */
  constructor(precomputedData, height = 1) {
    this.regionGroup = new THREE.Group();
    this.topMeshes = [];
    this.isHovered = false;
    this.isSelected = false;
    this.name = precomputedData.name;
    this.animationProgress = 0;
    this.targetAnimationProgress = 0;
    this.animationSpeed = 0.06;
    this.height = height;
    this.wallHeight = height + 1;
    this.selectedElevation = 10;
    this.colors = {
      topNormal: new THREE.Color('#ff6b6b'), //new THREE.Color('#4f5fc2'),
      wallTopNormal: new THREE.Color('#ffffff'),
      hover: new THREE.Color('#7ca0e8'),
      selected: new THREE.Color('#ff6b6b'),
    };
    this.colors.topHover = this.colors.hover;
    this.colors.wallTopHover = this.colors.hover;
    this.colors.topSelected = this.colors.selected;
    this.colors.wallTopSelected = this.colors.selected;
    this.sideTexture = this.createSideTexture();
    this.createRegion(precomputedData);
    this.originalPositions = this.topMeshes.map((mesh) => mesh.position.z);
    this.currentTween = null;
  }

  createSideTexture() {
    const texture = new THREE.TextureLoader().load(wallSideTextureImage, (loadedTexture) => {
      loadedTexture.wrapS = THREE.RepeatWrapping;
      loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
      loadedTexture.repeat.set(0.5, 1);
      loadedTexture.needsUpdate = true;
    });
    return texture;
  }

  /**
   * 创建区域的完整3D模型
   *
   * @param {Object} precomputedData - 预计算的区域数据
   */
  createRegion(precomputedData) {
    // 遍历该区域的所有多边形（一个区域可能有多个多边形，如岛屿）
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
      shape.moveTo(firstPoint.x, firstPoint.y);
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i].x, points[i].y);
      }
      shape.closePath();
    }

    const geo = new THREE.ShapeGeometry(shape);

    const normalMaterial = new THREE.MeshBasicMaterial({
      color: this.colors.topNormal,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    const uniforms = {
      ...ProvinceShaderUniforms,
      uBaseColor: { value: new THREE.Color('#1a1a2e') },
      uNeonColor: { value: new THREE.Color('#00ffff') },
      uTime: { value: 0.0 },
      uBreathEnabled: { value: true },
      uBreathSpeed: { value: 1.0 },
      uBreathColor1: { value: new THREE.Color('#00ffff') },
      uBreathColor2: { value: new THREE.Color('#ff00ff') },
      uBreathIntensity: { value: 0.5 },
    };

    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: ProvinceVertexShader,
      fragmentShader: ProvinceFragmentShader,
      side: THREE.DoubleSide,
    });

    //const mesh = new THREE.Mesh(geo, normalMaterial);
    const mesh = new THREE.Mesh(geo, shaderMaterial);
    mesh.userData = {
      name: this.name,
      hovered: false,
      isWall: false,
      normalMaterial,
      shaderMaterial,
    };
    mesh.position.z = this.height;
    this.regionGroup.add(mesh);
    this.topMeshes.push(mesh);
  }

  createWallMesh(outerPoints, innerPoints) {
    const shape = new THREE.Shape();

    if (outerPoints && outerPoints.length > 0) {
      const firstPoint = outerPoints[0];
      shape.moveTo(firstPoint.x, firstPoint.y);
      for (let i = 1; i < outerPoints.length; i++) {
        shape.lineTo(outerPoints[i].x, outerPoints[i].y);
      }
      shape.closePath();
    }

    const hole = new THREE.Path();
    const firstInnerPoint = innerPoints[0];
    hole.moveTo(firstInnerPoint.x, firstInnerPoint.y);

    for (let i = 1; i < innerPoints.length; i++) {
      hole.lineTo(innerPoints[i].x, innerPoints[i].y);
    }
    hole.closePath();
    shape.holes.push(hole);

    const wallGeo = new THREE.ExtrudeGeometry(shape, {
      depth: this.wallHeight,
      steps: 1,
      ...RegionRenderer.extrudeConfig,
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
    this.regionGroup.add(wallMesh);
    this.topMeshes.push(wallMesh);
  }

  /**
   * 设置区域的悬停状态
   *
   * @param {boolean} hovered - 是否悬停
   */
  setHovered(hovered) {
    if (this.isHovered === hovered) return;

    this.isHovered = hovered;

    this.topMeshes.forEach((mesh) => {
      mesh.userData.hovered = hovered;
    });
  }

  /**
   * 设置区域的选中状态
   *
   * @param {boolean} selected - 是否选中
   */
  setSelected(selected) {
    if (this.isSelected === selected) return;

    this.isSelected = selected;

    this.topMeshes.forEach((mesh) => {
      mesh.userData.selected = selected;

      if (!mesh.userData.isWall && mesh.userData.normalMaterial && mesh.userData.shaderMaterial) {
        if (selected) {
          mesh.material = mesh.userData.shaderMaterial;
        } else {
          mesh.material = mesh.userData.normalMaterial;
          mesh.userData.normalMaterial.color.copy(this.colors.topNormal);
        }
      }
    });

    this.animateElevation(selected);
  }

  animateElevation(selected) {
    if (this.currentTween) {
      this.currentTween.stop();
      this.currentTween = null;
    }

    const targetZ = selected ? this.selectedElevation : 0;
    const startZ = this.regionGroup.position.z;

    const tweenData = { z: startZ };

    this.currentTween = new TWEEN.Tween(tweenData, globalTweenGroup)
      .to({ z: targetZ }, 500)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(() => {
        this.regionGroup.position.z = tweenData.z;
      })
      .onComplete(() => {
        this.currentTween = null;
      })
      .start();
  }

  /**
   * 更新动画状态
   *
   * 在渲染循环中每帧调用
   * 实现颜色从正常到悬停/选中的平滑过渡
   */
  update() {
    this.topMeshes.forEach((mesh) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const isWall = mesh.userData.isWall === true;

      if (!isWall && materials[0].uniforms) {
        materials[0].uniforms.uTime.value += 0.016;
      }

      if (isWall && materials.length >= 2) {
        const targetWallTopColor = this.isSelected
          ? this.colors.wallTopSelected
          : this.isHovered
            ? this.colors.wallTopHover
            : this.colors.wallTopNormal;

        materials[0].color.lerp(targetWallTopColor, this.animationSpeed);
      }
    });
  }

  /**
   * 设置区域颜色
   *
   * @param {string} color - 颜色值（如 '#ff0000'）
   */
  setColor(color) {
    this.colors.topNormal = new THREE.Color(color);
    this.topMeshes.forEach((mesh) => {
      if (!mesh.userData.isWall) {
        if (mesh.userData.normalMaterial) {
          mesh.userData.normalMaterial.color.copy(this.colors.topNormal);
        }
        if (mesh.userData.shaderMaterial && mesh.userData.shaderMaterial.uniforms) {
          mesh.userData.shaderMaterial.uniforms.uColor.value.copy(this.colors.topNormal);
        }
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
      if (mesh.userData.normalMaterial) {
        mesh.userData.normalMaterial.wireframe = wireframe;
      }
      if (mesh.userData.shaderMaterial) {
        mesh.userData.shaderMaterial.wireframe = wireframe;
      }
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((mat) => {
        mat.wireframe = wireframe;
      });
    });
  }

  /**
   * 设置呼吸渐变效果启用/禁用
   *
   * @param {boolean} enabled - 是否启用呼吸渐变效果
   */
  setBreathEnabled(enabled) {
    this.topMeshes.forEach((mesh) => {
      if (mesh.userData.shaderMaterial && mesh.userData.shaderMaterial.uniforms) {
        mesh.userData.shaderMaterial.uniforms.uBreathEnabled.value = enabled;
      }
    });
  }

  /**
   * 设置呼吸渐变速度
   *
   * @param {number} speed - 呼吸速度（值越大呼吸越快）
   */
  setBreathSpeed(speed) {
    this.topMeshes.forEach((mesh) => {
      if (mesh.userData.shaderMaterial && mesh.userData.shaderMaterial.uniforms) {
        mesh.userData.shaderMaterial.uniforms.uBreathSpeed.value = speed;
      }
    });
  }

  /**
   * 设置呼吸渐变颜色1
   *
   * @param {string|THREE.Color} color - 颜色值
   */
  setBreathColor1(color) {
    const threeColor = color instanceof THREE.Color ? color : new THREE.Color(color);
    this.topMeshes.forEach((mesh) => {
      if (mesh.userData.shaderMaterial && mesh.userData.shaderMaterial.uniforms) {
        mesh.userData.shaderMaterial.uniforms.uBreathColor1.value = threeColor;
      }
    });
  }

  /**
   * 设置呼吸渐变颜色2
   *
   * @param {string|THREE.Color} color - 颜色值
   */
  setBreathColor2(color) {
    const threeColor = color instanceof THREE.Color ? color : new THREE.Color(color);
    this.topMeshes.forEach((mesh) => {
      if (mesh.userData.shaderMaterial && mesh.userData.shaderMaterial.uniforms) {
        mesh.userData.shaderMaterial.uniforms.uBreathColor2.value = threeColor;
      }
    });
  }

  /**
   * 同时设置呼吸渐变的两种颜色
   *
   * @param {string|THREE.Color} color1 - 颜色1
   * @param {string|THREE.Color} color2 - 颜色2
   */
  setBreathColors(color1, color2) {
    this.setBreathColor1(color1);
    this.setBreathColor2(color2);
  }

  /**
   * 设置呼吸渐变强度
   *
   * @param {number} intensity - 强度值（0-1）
   */
  setBreathIntensity(intensity) {
    this.topMeshes.forEach((mesh) => {
      if (mesh.userData.shaderMaterial && mesh.userData.shaderMaterial.uniforms) {
        mesh.userData.shaderMaterial.uniforms.uBreathIntensity.value = Math.max(0, Math.min(1, intensity));
      }
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
      if (mesh.userData.normalMaterial) {
        mesh.userData.normalMaterial.dispose();
      }
      if (mesh.userData.shaderMaterial) {
        mesh.userData.shaderMaterial.dispose();
      }
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
