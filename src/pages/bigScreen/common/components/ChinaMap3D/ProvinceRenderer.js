import * as THREE from 'three';
import { geoMercator, geoPath } from 'd3-geo';

export function createSharedProjection(featureCollection, extent = [0, 0, 50, 50]) {
  const projection = geoMercator().fitExtent(
    [
      [extent[0], extent[1]],
      [extent[2], extent[3]],
    ],
    featureCollection
  );
  return projection;
}

export function projectLonLat(lon, lat, projection) {
  const [x, y] = projection([lon, lat]) || [0, 0];
  return { x, y: -y };
}

export class ProvinceRenderer {
  constructor(precomputedData, gradientTexture, options = {}) {
    this.gradientTexture = gradientTexture;
    this.edgeHeight = options.edgeHeight || 0.15;
    this.wallThickness = options.wallThickness || 0.03;
    this.wallTexture = null;

    this.provinceGroup = new THREE.Group();
    this.topMeshes = [];
    this.wallMesh = null;
    this.wallTopMeshes = [];
    this.isHovered = false;
    this.name = precomputedData.name;

    this.animationProgress = 0;
    this.targetAnimationProgress = 0;
    this.animationSpeed = 0.15;

    this.colors = {
      wallTopNormal: new THREE.Color('#ffffff'),
      wallTopHover: new THREE.Color('#ff4500'),
      topNormal: new THREE.Color('#4f5fc2'),
      topHover: new THREE.Color('#6b7dd4'),
    };

    this.createProvince(precomputedData);
  }

  createProvince(precomputedData) {
    precomputedData.polygons.forEach((polygonData) => {
      this.createPolygon(polygonData);
    });
  }

  createPolygon(polygonData) {
    const { innerPoints, outerPoints, wallPositions, wallUvs, wallIndices } = polygonData;

    const shape = new THREE.Shape();
    if (innerPoints && innerPoints.length > 0) {
      const firstPoint = innerPoints[0];
      shape.moveTo(firstPoint.x, firstPoint.y);
      for (let i = 1; i < innerPoints.length; i++) {
        shape.lineTo(innerPoints[i].x, innerPoints[i].y);
      }
      shape.closePath();
    }

    const topGeo = new THREE.ShapeGeometry(shape);
    const topMaterial = new THREE.MeshBasicMaterial({
      color: this.colors.topNormal,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const topMesh = new THREE.Mesh(topGeo, topMaterial);
    topMesh.userData = { name: this.name, hovered: false };
    this.provinceGroup.add(topMesh);
    this.topMeshes.push(topMesh);

    this.createWallGeometryFromData(wallPositions, wallUvs, wallIndices);

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
    const wallTopMesh = new THREE.Mesh(wallTopGeo, wallTopMaterial);
    wallTopMesh.position.z = this.edgeHeight / 2 + 0.001;
    this.provinceGroup.add(wallTopMesh);
    this.wallTopMeshes.push(wallTopMesh);
  }

  createWallGeometryFromData(positions, uvs, indices) {
    const wallGeo = new THREE.BufferGeometry();
    wallGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    wallGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    wallGeo.setIndex(indices);
    wallGeo.computeVertexNormals();

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

    this.topMeshes.forEach((mesh) => {
      mesh.userData.hovered = hovered;
    });
  }

  update() {
    this.animationProgress +=
      (this.targetAnimationProgress - this.animationProgress) * this.animationSpeed;

    this.wallTopMeshes.forEach((mesh) => {
      const currentColor = new THREE.Color();
      currentColor.lerpColors(
        this.colors.wallTopNormal,
        this.colors.wallTopHover,
        this.animationProgress
      );
      mesh.material.color.copy(currentColor);
    });

    this.topMeshes.forEach((mesh) => {
      const currentColor = new THREE.Color();
      currentColor.lerpColors(this.colors.topNormal, this.colors.topHover, this.animationProgress);
      mesh.material.color.copy(currentColor);
    });
  }

  setEdgesVisible(visible) {
    if (this.wallMesh) this.wallMesh.visible = visible;
    this.wallTopMeshes.forEach((mesh) => {
      mesh.visible = visible;
    });
  }

  setEmissiveIntensity(value) {}

  setColor(color) {
    this.topMeshes.forEach((mesh) => {
      mesh.material.color.set(color);
    });
  }

  setWireframe(wireframe) {
    this.topMeshes.forEach((mesh) => {
      mesh.material.wireframe = wireframe;
    });
  }

  dispose() {
    this.topMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    if (this.wallMesh) {
      this.wallMesh.geometry.dispose();
      this.wallMesh.material.dispose();
    }
    this.wallTopMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    if (this.wallTexture) {
      this.wallTexture.dispose();
    }
  }
}
