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
