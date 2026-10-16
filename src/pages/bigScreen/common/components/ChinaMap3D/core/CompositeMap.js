import * as THREE from 'three';
import { RegionRenderer } from './RegionRenderer.js';
import GeoWorker from '../workers/geoWorker.js?worker';

export class CompositeMap {
  constructor() {
    this.regionRenderers = [];
    this.worker = null;
  }

  async load(scene, geoJsonUrl, extent, center = [102, 25], wallHeight = 1, wallThickness = 0.1) {
    const response = await fetch(geoJsonUrl);
    const regionsData = await response.json();

    this.extent = extent;

    return new Promise((resolve) => {
      this.worker = new GeoWorker();

      this.worker.onmessage = (e) => {
        const { type, data } = e.data;

        if (type === 'progress') {
          console.log('progress', data);
          this.createRegionMesh(scene, data.result, wallHeight);
        }

        if (type === 'complete') {
          this.worker.terminate();
          this.worker = null;
          resolve();
        }
      };

      this.worker.postMessage({
        type: 'init',
        data: {
          featureCollection: regionsData,
          extent,
          wallThickness,
          center,
        },
      });
    });
  }

  createRegionMesh(scene, data, wallHeight) {
    if (!data || !data.polygons || data.polygons.length === 0) {
      return;
    }

    try {
      const renderer = new RegionRenderer(data, wallHeight);
      renderer.regionGroup.userData = { name: data.name };
      scene.add(renderer.regionGroup);
      this.regionRenderers.push(renderer);
    } catch (error) {
      console.error(`Failed to create renderer for ${data.name}:`, error);
    }
  }

  getRegionRenderers() {
    return this.regionRenderers;
  }

  dispose() {
    this.regionRenderers.forEach((r) => r.dispose());
    this.regionRenderers = [];
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
