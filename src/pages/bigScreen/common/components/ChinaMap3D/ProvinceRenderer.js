import * as THREE from 'three';

export class ProvinceRenderer {
  constructor(feature, gradientTexture, options = {}) {
    this.feature = feature;
    this.gradientTexture = gradientTexture;
    this.edgeHeight = options.edgeHeight || 0.15;
    this.wallThickness = options.wallThickness || 0.03;

    this.provinceGroup = new THREE.Group();
    this.topMesh = null;
    this.wallMesh = null;
    this.wallTopMesh = null;
    this.isHovered = false;
    this.name = feature.properties.name;
    this.wallTexture = null;

    // 动画相关属性
    this.animationProgress = 0;
    this.targetAnimationProgress = 0;
    this.animationSpeed = 0.15;

    // 颜色定义
    this.colors = {
      wallTopNormal: new THREE.Color('#ffffff'),
      wallTopHover: new THREE.Color('#ff4500'),
      topNormal: new THREE.Color('#4f5fc2'),
      topHover: new THREE.Color('#6b7dd4'),
    };

    this.createProvince();
  }

  createShape(coordinates) {
    const shape = new THREE.Shape();
    if (coordinates && coordinates.length > 0) {
      const firstPoint = coordinates[0];
      shape.moveTo(firstPoint[0], firstPoint[1]);
      for (let i = 1; i < coordinates.length; i++) {
        shape.lineTo(coordinates[i][0], coordinates[i][1]);
      }
      shape.closePath();
    }
    return shape;
  }

  getShapeBoundingBox(points) {
    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    for (const point of points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    return {
      min: { x: minX, y: minY },
      max: { x: maxX, y: maxY },
    };
  }

  createProvince() {
    const geometry = this.feature.geometry;

    if (geometry.type === 'Polygon' && geometry.coordinates.length > 0) {
      const coordinates = geometry.coordinates[0];
      const innerShape = this.createShape(coordinates);
      const innerPoints = innerShape.getPoints();

      // 手动计算形状边界框和中心
      const bbox = this.getShapeBoundingBox(innerPoints);
      const centerX = (bbox.max.x + bbox.min.x) / 2;
      const centerY = (bbox.max.y + bbox.min.y) / 2;

      // 计算缩放因子来创建围墙厚度
      const size = Math.max(bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y);
      const scaleFactor = 1 + this.wallThickness / size;

      // 1. 创建省份顶面（蓝紫色半透明）
      const topGeo = new THREE.ShapeGeometry(innerShape);
      const topMaterial = new THREE.MeshBasicMaterial({
        color: this.colors.topNormal,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      this.topMesh = new THREE.Mesh(topGeo, topMaterial);
      this.topMesh.userData = { name: this.name, hovered: false };
      this.provinceGroup.add(this.topMesh);

      // 2. 创建围墙外轮廓（从中心缩放内轮廓）
      const outerPoints = [];
      for (let i = 0; i < innerPoints.length; i++) {
        const x = (innerPoints[i].x - centerX) * scaleFactor + centerX;
        const y = (innerPoints[i].y - centerY) * scaleFactor + centerY;
        outerPoints.push(new THREE.Vector2(x, y));
      }

      // 手动创建围墙几何体，正确设置UV坐标
      this.createWallGeometry(innerPoints, outerPoints);

      // 3. 创建围墙顶部白色顶面
      const wallShape = new THREE.Shape();
      wallShape.moveTo(outerPoints[0].x, outerPoints[0].y);
      for (let i = 1; i < outerPoints.length; i++) {
        wallShape.lineTo(outerPoints[i].x, outerPoints[i].y);
      }
      wallShape.closePath();

      const holeShape = new THREE.Shape();
      for (let i = innerPoints.length - 1; i >= 0; i--) {
        holeShape.lineTo(innerPoints[i].x, innerPoints[i].y);
      }
      holeShape.closePath();
      wallShape.holes.push(holeShape);

      const wallTopGeo = new THREE.ShapeGeometry(wallShape);
      const wallTopMaterial = new THREE.MeshBasicMaterial({
        color: this.colors.wallTopNormal,
        side: THREE.DoubleSide,
        depthWrite: true,
        depthTest: true,
      });
      this.wallTopMesh = new THREE.Mesh(wallTopGeo, wallTopMaterial);
      this.wallTopMesh.position.z = this.edgeHeight / 2 + 0.001;
      this.provinceGroup.add(this.wallTopMesh);
    }
  }

  createWallGeometry(innerPoints, outerPoints) {
    const positions = [];
    const uvs = [];
    const indices = [];

    const halfHeight = this.edgeHeight / 2;
    let totalLength = 0;

    // 计算总长度用于UV映射
    for (let i = 0; i < outerPoints.length; i++) {
      const p1 = outerPoints[i];
      const p2 = outerPoints[(i + 1) % outerPoints.length];
      totalLength += p1.distanceTo(p2);
    }

    let currentLength = 0;

    // 创建围墙侧面
    for (let i = 0; i < outerPoints.length; i++) {
      const inner1 = innerPoints[i];
      const inner2 = innerPoints[(i + 1) % innerPoints.length];
      const outer1 = outerPoints[i];
      const outer2 = outerPoints[(i + 1) % outerPoints.length];

      // 计算当前段的长度
      const segmentLength = outer1.distanceTo(outer2);

      // 4个顶点
      // 左下角 (外)
      positions.push(outer1.x, outer1.y, -halfHeight);
      // 左上角 (外)
      positions.push(outer1.x, outer1.y, halfHeight);
      // 右上角 (外)
      positions.push(outer2.x, outer2.y, halfHeight);
      // 右下角 (外)
      positions.push(outer2.x, outer2.y, -halfHeight);

      // 设置UV坐标
      const u1 = currentLength / totalLength;
      const u2 = (currentLength + segmentLength) / totalLength;

      // 左下角 - V=1 对应底部
      uvs.push(u1, 1);
      // 左上角 - V=0 对应顶部
      uvs.push(u1, 0);
      // 右上角 - V=0 对应顶部
      uvs.push(u2, 0);
      // 右下角 - V=1 对应底部
      uvs.push(u2, 1);

      // 更新当前长度
      currentLength += segmentLength;

      // 两个三角形
      const baseIndex = i * 4;
      indices.push(
        baseIndex,
        baseIndex + 1,
        baseIndex + 2,
        baseIndex,
        baseIndex + 2,
        baseIndex + 3
      );
    }

    // 创建BufferGeometry
    const wallGeo = new THREE.BufferGeometry();
    wallGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    wallGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    wallGeo.setIndex(indices);
    wallGeo.computeVertexNormals();

    // 加载纹理并创建材质
    this.loadWallTexture((texture) => {
      const wallMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        depthWrite: true,
        depthTest: true,
      });
      this.wallMesh = new THREE.Mesh(wallGeo, wallMaterial);
      this.provinceGroup.add(this.wallMesh);
    });
  }

  loadWallTexture(callback) {
    const textureLoader = new THREE.TextureLoader();
    const texturePath = 'src/pages/bigScreen/common/imgs/texture_cake_1.png';

    textureLoader.load(
      texturePath,
      (texture) => {
        // 设置纹理水平方向循环
        texture.wrapS = THREE.RepeatWrapping;
        // 设置垂直方向拉伸（不重复）
        texture.wrapT = THREE.ClampToEdgeWrapping;
        // 水平方向重复次数，垂直方向不重复（拉伸适配高度）
        texture.repeat.set(3, 1);
        // 禁用Y轴翻转，确保图片底部对应围墙底部
        texture.flipY = false;
        this.wallTexture = texture;
        callback(texture);
      },
      undefined,
      (error) => {
        console.error('Failed to load wall texture:', error);
        // 如果纹理加载失败，使用默认颜色材质
        callback(null);
      }
    );
  }

  setHovered(hovered) {
    if (this.isHovered === hovered) return;
    this.isHovered = hovered;
    this.targetAnimationProgress = hovered ? 1 : 0;

    if (this.topMesh) {
      this.topMesh.userData.hovered = hovered;
    }
  }

  update() {
    // 平滑插值动画
    this.animationProgress +=
      (this.targetAnimationProgress - this.animationProgress) * this.animationSpeed;

    // 更新边界墙顶部颜色
    if (this.wallTopMesh) {
      const currentColor = new THREE.Color();
      currentColor.lerpColors(
        this.colors.wallTopNormal,
        this.colors.wallTopHover,
        this.animationProgress
      );
      this.wallTopMesh.material.color.copy(currentColor);
    }

    // 更新省份顶面颜色
    if (this.topMesh) {
      const currentColor = new THREE.Color();
      currentColor.lerpColors(this.colors.topNormal, this.colors.topHover, this.animationProgress);
      this.topMesh.material.color.copy(currentColor);
    }
  }

  setEdgesVisible(visible) {
    if (this.wallMesh) this.wallMesh.visible = visible;
    if (this.wallTopMesh) this.wallTopMesh.visible = visible;
  }

  setEmissiveIntensity(value) {}

  setColor(color) {
    if (this.topMesh) {
      this.topMesh.material.color.set(color);
    }
  }

  setWireframe(wireframe) {
    if (this.topMesh) {
      this.topMesh.material.wireframe = wireframe;
    }
  }

  dispose() {
    if (this.topMesh) {
      this.topMesh.geometry.dispose();
      this.topMesh.material.dispose();
    }
    if (this.wallMesh) {
      this.wallMesh.geometry.dispose();
      this.wallMesh.material.dispose();
    }
    if (this.wallTopMesh) {
      this.wallTopMesh.geometry.dispose();
      this.wallTopMesh.material.dispose();
    }
    if (this.wallTexture) {
      this.wallTexture.dispose();
    }
  }
}
