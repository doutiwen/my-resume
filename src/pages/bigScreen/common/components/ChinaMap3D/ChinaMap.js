import * as THREE from 'three';
import { ProvinceRenderer } from './ProvinceRenderer.js';
import { createProjection } from './projection.js';

export class ChinaMap {
  constructor() {
    this.provinceRenderers = [];
    this.worker = null;
  }

  async load(scene, geoJsonUrl, extent, wallHeight = 1, wallThickness = 0.1) {
    const response = await fetch(geoJsonUrl);
    const provincesData = await response.json();

    const { scale, translate } = createProjection(provincesData, extent);
    this.extent = extent;
    const baseOffset = extent.height / 2;

    return new Promise((resolve) => {
      this.worker = new Worker(new URL('./geoWorker.js', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (e) => {
        const { type, data } = e.data;

        if (type === 'progress') {
          this.createProvinceMesh(scene, data.result, wallHeight, baseOffset);
        }

        if (type === 'complete') {
          this.worker.terminate();
          this.worker = null;
          resolve();
        }
      };

      this.worker.postMessage({
        type: 'init',
        data: { featureCollection: provincesData, extent, wallThickness, scale, translate },
      });
    });
  }

  createProvinceMesh(scene, data, wallHeight, baseOffset) {
    if (!data || !data.polygons || data.polygons.length === 0) {
      return;
    }

    try {
      const renderer = new ProvinceRenderer(data, wallHeight, baseOffset);
      renderer.provinceGroup.userData = { name: data.name };
      scene.add(renderer.provinceGroup);
      this.provinceRenderers.push(renderer);
    } catch (error) {
      console.error(`Failed to create renderer for ${data.name}:`, error);
    }
  }

  getProvinceRenderers() {
    return this.provinceRenderers;
  }

  dispose() {
    this.provinceRenderers.forEach((r) => r.dispose());
    this.provinceRenderers = [];
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
