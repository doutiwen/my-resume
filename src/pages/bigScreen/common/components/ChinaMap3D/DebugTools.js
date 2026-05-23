import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

export const debugParams = {
  autoRotate: false,
  rotateSpeed: 1.0,
  showEdges: true,
  edgeOpacity: 0.8,
  provinceColor: '#1e5a8a',
  emissiveIntensity: 0.25,
  hoveredEmissiveIntensity: 0.4,
  lightIntensity: 0.9,
  wireframe: false,
  showAxes: true,
};

export function createDebugTools({ container, camera, renderer, scene, width, height, chinaMap }) {
  let controls = null;
  let stats = null;
  let gui = null;
  let axesHelper = null;

  axesHelper = new THREE.AxesHelper(50);
  axesHelper.position.set(0, 0, 0);
  scene.add(axesHelper);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.autoRotate = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  stats = new Stats();
  stats.showPanel(0);
  stats.dom.style.position = 'absolute';
  stats.dom.style.top = '0px';
  stats.dom.style.left = '0px';
  container.appendChild(stats.dom);

  gui = new GUI({ title: 'Three.js Dev Tools' });

  const controlsFolder = gui.addFolder('Controls');
  controlsFolder
    .add(debugParams, 'autoRotate')
    .name('Auto Rotate')
    .onChange((value) => {
      controls.autoRotate = value;
    });
  controlsFolder
    .add(debugParams, 'rotateSpeed', 0.1, 3.0, 0.1)
    .name('Rotate Speed')
    .onChange(() => {
      controls.autoRotateSpeed = debugParams.rotateSpeed;
    });

  const appearanceFolder = gui.addFolder('Appearance');
  appearanceFolder
    .addColor(debugParams, 'provinceColor')
    .name('Province Color')
    .onChange((value) => {
      chinaMap.getProvinceRenderers().forEach((province) => {
        province.setColor(value);
      });
    });
  appearanceFolder
    .add(debugParams, 'emissiveIntensity', 0, 1, 0.05)
    .name('Emissive')
    .onChange((value) => {
      chinaMap.getProvinceRenderers().forEach((province) => {
        province.setEmissiveIntensity(value);
      });
    });
  appearanceFolder
    .add(debugParams, 'hoveredEmissiveIntensity', 0, 1, 0.05)
    .name('Hovered Emissive')
    .onChange((value) => {
      provinceRenderers.forEach((province) => {
        province.topMesh.material.emissiveIntensity = province.topMesh.userData.hovered
          ? value
          : province.topMesh.material.emissiveIntensity;
      });
    });
  appearanceFolder
    .add(debugParams, 'showEdges')
    .name('Show Edges')
    .onChange((value) => {
      chinaMap.getProvinceRenderers().forEach((province) => {
        province.setEdgesVisible(value);
      });
    });
  appearanceFolder
    .add(debugParams, 'edgeOpacity', 0, 1, 0.05)
    .name('Edge Opacity')
    .onChange((value) => {
      if (!debugParams.showEdges) return;
      chinaMap.getProvinceRenderers().forEach((province) => {
        if (!province.topMesh.userData.hovered) {
          province.setEdgesVisible(debugParams.showEdges);
        }
      });
    });
  appearanceFolder
    .add(debugParams, 'wireframe')
    .name('Wireframe')
    .onChange((value) => {
      chinaMap.getProvinceRenderers().forEach((province) => {
        province.setWireframe(value);
      });
    });

  const lightsFolder = gui.addFolder('Lights');
  lightsFolder
    .add(debugParams, 'lightIntensity', 0, 2, 0.1)
    .name('Main Light')
    .onChange((value) => {
      scene.children.forEach((child) => {
        if (child instanceof THREE.DirectionalLight) {
          child.intensity = value;
        }
      });
    });

  const helpersFolder = gui.addFolder('Helpers');
  helpersFolder
    .add(debugParams, 'showAxes')
    .name('Show Axes')
    .onChange((value) => {
      if (axesHelper) {
        axesHelper.visible = value;
      }
    });

  gui.close();

  return { controls, stats, gui, axesHelper };
}

export function disposeDebugTools({ stats, gui, controls, axesHelper, container, renderer }) {
  if (stats) {
    if (container?.contains(stats.dom)) {
      container.removeChild(stats.dom);
    }
    stats = null;
  }

  if (gui) {
    gui.destroy();
    gui = null;
  }

  if (controls) {
    controls.dispose();
  }

  if (axesHelper) {
    axesHelper = null;
  }
}
