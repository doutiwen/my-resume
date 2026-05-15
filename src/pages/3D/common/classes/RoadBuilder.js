import * as THREE from 'three';

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

      faces.push(v1, v3, v2);
      faces.push(v3, v4, v2);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(faces);

    return geometry;
  }

  createCurbGeometry(points, width, offset) {
    if (points.length < 2) {
      return new THREE.BufferGeometry();
    }

    const curvePoints = points.map((p) => new THREE.Vector3(p[0], 0, p[2]));
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    curve.closed = true;

    const segments = Math.max(100, points.length * 10);

    const vertices = [];
    const faces = [];
    const lineWidth = 0.15;
    const halfWidth = width / 2;

    const direction = offset > 0 ? 1 : -1;

    for (let i = 0; i < segments; i++) {
      const t1 = i / segments;
      const t2 = (i + 1) / segments;

      const point1 = curve.getPointAt(t1);
      const point2 = curve.getPointAt(t2);

      const tangent1 = curve.getTangentAt(t1);
      const tangent2 = curve.getTangentAt(t2);

      const normal1 = new THREE.Vector3(-tangent1.z, 0, tangent1.x).normalize();
      const normal2 = new THREE.Vector3(-tangent2.z, 0, tangent2.x).normalize();

      const innerOffset1 = normal1.clone().multiplyScalar(halfWidth * direction);
      const outerOffset1 = normal1.clone().multiplyScalar((halfWidth + lineWidth) * direction);
      const innerOffset2 = normal2.clone().multiplyScalar(halfWidth * direction);
      const outerOffset2 = normal2.clone().multiplyScalar((halfWidth + lineWidth) * direction);

      const innerPoint1 = point1.clone().add(innerOffset1);
      const outerPoint1 = point1.clone().add(outerOffset1);
      const innerPoint2 = point2.clone().add(innerOffset2);
      const outerPoint2 = point2.clone().add(outerOffset2);

      const baseIndex = vertices.length / 3;
      vertices.push(innerPoint1.x, 0.02, innerPoint1.z);
      vertices.push(outerPoint1.x, 0.02, outerPoint1.z);
      vertices.push(innerPoint2.x, 0.02, innerPoint2.z);
      vertices.push(outerPoint2.x, 0.02, outerPoint2.z);

      faces.push(baseIndex, baseIndex + 2, baseIndex + 1);
      faces.push(baseIndex + 1, baseIndex + 2, baseIndex + 3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(faces);

    return geometry;
  }

  createRoad(points, features) {
    const { width = 10, color = '#424242', hasMarkings = true } = features;

    const roadGroup = new THREE.Group();

    const roadGeometry = this.createRoadGeometry(points, width);
    const roadMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      side: THREE.DoubleSide,
    });
    const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
    roadGroup.add(roadMesh);

    const curbLeftGeometry = this.createCurbGeometry(points, width, 0.2);
    const curbRightGeometry = this.createCurbGeometry(points, width, -0.2);
    const curbMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });

    const curbLeftMesh = new THREE.Mesh(curbLeftGeometry, curbMaterial);
    roadGroup.add(curbLeftMesh);

    const curbRightMesh = new THREE.Mesh(curbRightGeometry, curbMaterial);
    roadGroup.add(curbRightMesh);

    if (hasMarkings) {
      this.addRoadMarkings(roadGroup, points, width);
    }

    this.scene.add(roadGroup);
    return roadGroup;
  }

  addRoadMarkings(roadGroup, points, width) {
    const centerLineMarkings = this.createCenterLineMarkings(points);
    centerLineMarkings.forEach((marking) => {
      roadGroup.add(marking);
    });
  }

  createCenterLineMarkings(points) {
    const curvePoints = points.map((p) => new THREE.Vector3(p[0], 0, p[2]));
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    curve.closed = true;

    const totalLength = curve.getLength();
    const segmentLength = 9;
    const gapLength = 6;

    const vertices = [];
    const faces = [];

    for (let i = 0; i < totalLength; i += segmentLength + gapLength) {
      const startPoint = curve.getPointAt(i / totalLength);
      const endPoint = curve.getPointAt((i + segmentLength) / totalLength);

      const startTangent = curve.getTangentAt(i / totalLength);
      const endTangent = curve.getTangentAt((i + segmentLength) / totalLength);

      const startNormal = new THREE.Vector3(-startTangent.z, 0, startTangent.x).normalize();
      const endNormal = new THREE.Vector3(-endTangent.z, 0, endTangent.x).normalize();

      const lineWidth = 0.15;
      const startLeft = startPoint.clone().add(startNormal.clone().multiplyScalar(lineWidth / 2));
      const startRight = startPoint.clone().add(startNormal.clone().multiplyScalar(-lineWidth / 2));
      const endLeft = endPoint.clone().add(endNormal.clone().multiplyScalar(lineWidth / 2));
      const endRight = endPoint.clone().add(endNormal.clone().multiplyScalar(-lineWidth / 2));

      const baseIndex = vertices.length / 3;
      vertices.push(startLeft.x, 0.02, startLeft.z);
      vertices.push(startRight.x, 0.02, startRight.z);
      vertices.push(endLeft.x, 0.02, endLeft.z);
      vertices.push(endRight.x, 0.02, endRight.z);

      faces.push(baseIndex, baseIndex + 2, baseIndex + 1);
      faces.push(baseIndex + 1, baseIndex + 2, baseIndex + 3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(faces);

    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    const mesh = new THREE.Mesh(geometry, material);
    return [mesh];
  }
}
