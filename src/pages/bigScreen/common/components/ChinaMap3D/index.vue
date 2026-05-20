<template>
  <!-- 3D中国地图容器 -->
  <div class="china-map-3d-wrapper">
    <!-- Three.js渲染容器，通过ref引用 -->
    <div ref="containerRef" class="china-map-3d-container"></div>
    <!-- 加载遮罩层，数据加载期间显示 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <span class="loading-text">地图加载中...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
  /**
   * ChinaMap3D 组件 - 3D中国地图可视化组件
   *
   * 功能说明：
   * - 使用Three.js渲染3D中国省份地图
   * - 支持鼠标交互（hover高亮、省份选中）
   * - 使用Web Worker处理地理数据，避免主线程阻塞
   * - 提供调试面板（Stats性能监控、GUI参数控制）
   * - 支持鼠标缩放、旋转等交互操作
   */

  // Vue响应式API
  import { ref, onMounted, onUnmounted } from 'vue';

  // Three.js核心库
  import * as THREE from 'three';

  // Three.js轨道控制器，支持鼠标交互操作（缩放、旋转、平移）
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

  // Three.js性能监控插件，显示FPS等性能指标
  import Stats from 'three/addons/libs/stats.module.js';

  // lil-gui参数控制面板，用于实时调节3D场景参数
  import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

  // 省份渲染器，用于创建单个省份的3D模型
  import { ProvinceRenderer, createSharedProjection } from './ProvinceRenderer.js';

  // 工具函数集合
  import {
    loadProvinceData, // 加载省份地理数据
    kmToSceneUnits, // 公里转换为场景单位
    createGradientTexture, // 创建渐变纹理
    latLngToSceneCoords, // 经纬度转换为场景坐标
    setCameraPositionByLatLng, // 根据经纬度设置相机位置
    setCameraLookAtLatLng, // 设置相机看向目标
  } from './utils.js';

  // =============================================
  // 响应式状态
  // =============================================

  /** @type {import('vue').Ref<HTMLElement|null>} 容器DOM引用 */
  const containerRef = ref(null);

  /** @type {import('vue').Ref<boolean>} 加载状态标识，true时显示加载遮罩 */
  const loading = ref(true);

  // =============================================
  // 地图投影配置
  // =============================================

  /**
   * 墨卡托投影的地图范围配置
   * 用于将经纬度坐标映射到平面坐标
   * { width, height, padding } - 宽度、高度和内边距
   */
  const MAP_EXTENT = { width: 0, height: 0, padding: 30 };

  // =============================================
  // Three.js核心对象（模块级变量）
  // =============================================

  /** @type {THREE.Scene|null} Three.js场景对象，包含所有3D对象 */
  let scene = null;

  /** @type {THREE.PerspectiveCamera|null} 透视相机，用于3D渲染 */
  let camera = null;

  /** @type {THREE.WebGLRenderer|null} WebGL渲染器，负责将场景渲染到canvas */
  let renderer = null;

  /** @type {OrbitControls|null} 轨道控制器，管理相机交互 */
  let controls = null;

  /** @type {number|null} 动画帧ID，用于取消动画循环 */
  let animationId = null;

  /** @type {ProvinceRenderer[]} 所有省份渲染器实例数组 */
  let provinceRenderers = [];

  /** @type {THREE.Raycaster|null} 射线投射器，用于鼠标拾取3D物体 */
  let raycaster = null;

  /** @type {THREE.Vector2|null} 标准化鼠标坐标 */
  let mouse = null;

  /** @type {Stats|null} 性能统计面板 */
  let stats = null;

  /** @type {GUI|null} 参数控制面板 */
  let gui = null;

  /** @type {THREE.AxesHelper|null} 坐标轴辅助线（红绿蓝三轴） */
  let axesHelper = null;

  /** @type {THREE.CanvasTexture|null} 省份渐变纹理 */
  let gradientTexture = null;

  /** @type {Function|null} 共享的地图投影函数 */
  let sharedProjection = null;

  /** @type {Worker|null} 地理数据处理的Web Worker */
  let geoWorker = null;

  /** @type {Array|null} 处理后的省份数据 */
  let processedData = null;

  /** 相机距离缩放因子对象（用于GUI绑定） */
  const cameraDistance = { value: 1 };

  // =============================================
  // 核心函数
  // =============================================

  // =============================================
  // 调试参数配置
  // =============================================

  /**
   * GUI调试面板参数对象
   * 这些参数可以通过lil-gui界面实时调节
   */
  const debugParams = {
    autoRotate: false, // 是否自动旋转地图
    rotateSpeed: 1.0, // 旋转速度
    showEdges: true, // 是否显示省份边框
    edgeOpacity: 0.8, // 边框透明度
    provinceColor: '#1e5a8a', // 省份颜色
    emissiveIntensity: 0.25, // 发光强度（仅对MeshStandardMaterial有效）
    hoveredEmissiveIntensity: 0.4, // 悬停时的发光强度
    lightIntensity: 0.9, // 光照强度
    wireframe: false, // 是否显示线框模式
    showAxes: true, // 是否显示坐标轴
  };

  // =============================================
  // 省份数据加载与处理
  // =============================================

  /**
   * 异步创建所有省份的3D模型
   *
   * 数据流程：
   * 1. 创建渐变纹理（用于省份着色）
   * 2. 加载省份GeoJSON数据
   * 3. 创建Web Worker处理地理数据
   * 4. Worker返回处理结果后，创建Three.js网格
   *
   * @returns {Promise} 所有省份创建完成后resolve
   */
  async function createProvinces() {
    // 获取容器的实际尺寸，用于设置投影范围
    const container = containerRef.value;
    MAP_EXTENT.width = container.clientWidth;
    MAP_EXTENT.height = container.clientHeight;

    // 创建省份渐变纹理：从浅蓝到深蓝的垂直渐变
    gradientTexture = createGradientTexture('#699dd9', '#416295');

    // 从服务器加载省份GeoJSON数据
    const provincesData = await loadProvinceData();

    // 创建共享的墨卡托投影
    sharedProjection = createSharedProjection(provincesData, MAP_EXTENT);
    console.log('Shared projection created:', sharedProjection);
    console.log('MAP_EXTENT:', MAP_EXTENT);

    // 创建Web Worker用于处理地理数据（避免阻塞主线程）
    return new Promise((resolve) => {
      // 创建Worker，加载geoWorker.js模块
      geoWorker = new Worker(new URL('./geoWorker.js', import.meta.url), { type: 'module' });

      // 处理Worker返回的消息
      geoWorker.onmessage = function (e) {
        const { type, data } = e.data;

        // Worker初始化完成，准备开始处理
        if (type === 'ready') {
          // 发送所有省份特征数据进行批量处理
          geoWorker.postMessage({
            type: 'processAll',
            data: {
              features: provincesData.features,
              edgeHeight: 1, // 省份边框高度
              wallThickness: 0.08, // 省份围墙厚度（相对比例值，0.01-0.1之间）
            },
          });
        }

        // 处理进度更新
        if (type === 'progress') {
          loading.value = true;
        }

        // 所有省份处理完成
        if (type === 'allResults') {
          processedData = data;
          // 创建Three.js网格模型
          createProvinceMeshes().then(() => {
            resolve();
          });
        }
      };

      // 初始化Worker，传递地理数据集合和投影范围
      geoWorker.postMessage({
        type: 'init',
        data: { featureCollection: provincesData, extent: MAP_EXTENT },
      });
    });
  }

  /**
   * 创建省份的Three.js网格模型
   *
   * 实现策略：
   * - 使用分批创建，每批3个省份
   * - 使用setTimeout(0)让出主线程，防止UI卡顿
   *
   * @returns {Promise} 所有省份网格创建完成后resolve
   */
  function createProvinceMeshes() {
    return new Promise((resolve) => {
      // 检查是否有处理后的数据
      if (!processedData || processedData.length === 0) {
        console.warn('No processed province data available');
        resolve();
        return;
      }

      // 过滤出有效的省份数据（必须有polygons）
      const validData = processedData.filter((d) => d.polygons && d.polygons.length > 0);

      if (validData.length === 0) {
        console.warn('No valid province polygons to render');
        resolve();
        return;
      }

      // 当前处理的索引
      let index = 0;
      // 每批创建的省份数量
      const batchSize = 3;

      /**
       * 分批创建函数
       * 每次处理batchSize个省份，完成后等待主线程空闲再处理下一批
       */
      function createBatch() {
        // 计算本批次的结束索引
        const end = Math.min(index + batchSize, validData.length);

        // 创建本批次内每个省份的渲染器
        for (let i = index; i < end; i++) {
          const data = validData[i];
          try {
            // 创建省份渲染器实例（使用与Worker相同的参数）
            const renderer = new ProvinceRenderer(data, gradientTexture, {
              edgeHeight: 1, // 边框高度（需与Worker一致）
              wallThickness: 0.08, // 围墙厚度（需与Worker一致）
              baseEmissiveIntensity: debugParams.emissiveIntensity,
              hoveredEmissiveIntensity: debugParams.hoveredEmissiveIntensity,
              edgeOpacity: debugParams.edgeOpacity,
            });

            // 将省份名称存储在userData中，方便调试和交互
            renderer.provinceGroup.userData = { name: data.name };

            // 将省份组添加到场景
            scene.add(renderer.provinceGroup);

            // 保存渲染器引用到数组
            provinceRenderers.push(renderer);
          } catch (error) {
            console.error(`Failed to create renderer for ${data.name}:`, error);
          }
        }

        // 更新索引
        index = end;

        // 如果还有未处理的省份，延迟继续
        if (index < validData.length) {
          setTimeout(createBatch, 0); // 延迟0毫秒，等待主线程空闲
        } else {
          // 所有省份创建完成
          resolve();
        }
      }

      // 开始第一批创建
      createBatch();
    });
  }

  // =============================================
  // 鼠标交互处理
  // =============================================

  /**
   * 鼠标移动事件处理函数
   *
   * 实现功能：
   * 1. 将鼠标坐标转换为标准化设备坐标（NDC）
   * 2. 从相机发出射线检测与省份的交点
   * 3. 更新悬停省份的高亮状态
   *
   * @param {MouseEvent} event 鼠标事件对象
   */
  function onMouseMove(event) {
    // 确保容器存在
    if (!containerRef.value) return;

    // 获取容器的边界矩形
    const rect = containerRef.value.getBoundingClientRect();

    // 确保容器有有效尺寸
    if (rect.width === 0 || rect.height === 0) return;

    // 将鼠标坐标转换为标准化设备坐标（NDC）
    // NDC坐标范围：x从-1到1，y从-1到1
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // 从相机位置沿鼠标方向发射射线
    raycaster.setFromCamera(mouse, camera);

    // 获取所有省份的顶部网格
    const provinceMeshes = provinceRenderers.flatMap((p) => p.topMeshes);
    if (provinceMeshes.length === 0) return;

    // 检测射线与所有省份网格的交点
    const intersects = raycaster.intersectObjects(provinceMeshes);

    // 更新每个省份的悬停状态
    provinceRenderers.forEach((province) => {
      // 判断当前省份是否在交点列表中
      const isHovered = intersects.some((intersect) =>
        province.topMeshes.includes(intersect.object)
      );
      // 更新悬停状态（ProvinceRenderer内部会处理颜色过渡动画）
      province.setHovered(isHovered);
    });
  }

  /**
   * 将地图居中到场景原点
   *
   * 通过计算所有省份的包围盒，然后将所有省份向相反方向平移，
   * 使地图中心点对齐到场景原点(0,0,0)
   *
   * 同时也会平移相机和控制器目标点，保持相机相对于地图的位置和朝向不变
   */
  function centerMapAtOrigin() {
    console.log('centerMapAtOrigin 开始执行');
    console.log('provinceRenderers 数量:', provinceRenderers.length);

    // 创建一个包围盒来容纳所有省份
    const box = new THREE.Box3();

    // 遍历所有省份的渲染器，扩展包围盒
    provinceRenderers.forEach((province) => {
      province.provinceGroup.traverse((child) => {
        if (child.isMesh) {
          box.expandByObject(child);
        }
      });
    });

    // 检查包围盒是否有效
    if (box.isEmpty()) {
      console.error('包围盒为空！无法居中地图');
      return;
    }

    // 获取包围盒的中心点
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    console.log('包围盒中心:', center);
    console.log('包围盒尺寸:', size);

    // 将所有省份向相反方向平移，使地图居中
    provinceRenderers.forEach((province) => {
      province.provinceGroup.position.sub(center);
    });

    // 同时平移相机，保持相机相对于地图的位置不变
    camera.position.sub(center);

    // 如果控制器已初始化，同步平移控制器的目标点
    if (controls) {
      controls.target.sub(center);
    }

    // 重新设置相机朝向，确保看向正确的位置
    camera.lookAt(controls ? controls.target : new THREE.Vector3(0, 0, 0));

    console.log(`地图已居中，偏移量: (${-center.x}, ${-center.y}, ${-center.z})`);
  }

  // =============================================
  // 调试工具初始化
  // =============================================

  /**
   * 初始化性能统计面板
   *
   * Stats面板显示：
   * - FPS：每秒帧数
   * - MS：每帧耗时
   * - MB：内存占用（需要Chrome开启memory监控）
   */
  function initStats() {
    stats = new Stats();
    stats.showPanel(0); // 0=FPS, 1=MS, 2=MB
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = '0px';
    stats.dom.style.left = '0px';
    // 将stats面板添加到3D容器中
    containerRef.value.appendChild(stats.dom);
  }

  /**
   * 初始化GUI参数控制面板
   *
   * 控制面板包含以下分组：
   * - Controls：交互控制（自动旋转、旋转速度）
   * - Appearance：外观控制（颜色、发光、边框、线框等）
   * - Lights：光照控制（光照强度）
   * - Helpers：辅助工具（坐标轴、网格显示）
   * - Camera：相机控制（缩放距离）
   */
  function initGUI() {
    gui = new GUI({ title: 'Three.js Dev Tools' });

    // ========== 交互控制分组 ==========
    const controlsFolder = gui.addFolder('Controls');

    // 自动旋转开关
    controlsFolder
      .add(debugParams, 'autoRotate')
      .name('Auto Rotate')
      .onChange((value) => {
        controls.autoRotate = value;
      });

    // 旋转速度滑块
    controlsFolder
      .add(debugParams, 'rotateSpeed', 0.1, 3.0, 0.1)
      .name('Rotate Speed')
      .onChange(() => {
        controls.autoRotateSpeed = debugParams.rotateSpeed;
      });

    // ========== 外观控制分组 ==========
    const appearanceFolder = gui.addFolder('Appearance');

    // 省份颜色选择器
    appearanceFolder
      .addColor(debugParams, 'provinceColor')
      .name('Province Color')
      .onChange((value) => {
        provinceRenderers.forEach((province) => {
          province.setColor(value);
        });
      });

    // 发光强度滑块
    appearanceFolder
      .add(debugParams, 'emissiveIntensity', 0, 1, 0.05)
      .name('Emissive')
      .onChange((value) => {
        provinceRenderers.forEach((province) => {
          province.setEmissiveIntensity(value);
        });
      });

    // 悬停发光强度滑块
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

    // 边框可见性开关
    appearanceFolder
      .add(debugParams, 'showEdges')
      .name('Show Edges')
      .onChange((value) => {
        provinceRenderers.forEach((province) => {
          province.setEdgesVisible(value);
        });
      });

    // 边框透明度滑块
    appearanceFolder
      .add(debugParams, 'edgeOpacity', 0, 1, 0.05)
      .name('Edge Opacity')
      .onChange((value) => {
        if (!debugParams.showEdges) return;
        provinceRenderers.forEach((province) => {
          if (!province.topMesh.userData.hovered) {
            province.setEdgesVisible(debugParams.showEdges);
          }
        });
      });

    // 线框模式开关
    appearanceFolder
      .add(debugParams, 'wireframe')
      .name('Wireframe')
      .onChange((value) => {
        provinceRenderers.forEach((province) => {
          province.setWireframe(value);
        });
      });

    // ========== 光照控制分组 ==========
    const lightsFolder = gui.addFolder('Lights');

    // 主光源强度滑块
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

    // ========== 辅助工具分组 ==========
    const helpersFolder = gui.addFolder('Helpers');

    // 坐标轴可见性开关
    helpersFolder
      .add(debugParams, 'showAxes')
      .name('Show Axes')
      .onChange((value) => {
        if (axesHelper) {
          axesHelper.visible = value;
        }
      });

    // 关闭面板（默认折叠）
    gui.close();
  }

  // =============================================
  // 场景初始化
  // =============================================

  /**
   * 初始化Three.js场景
   *
   * 初始化顺序：
   * 1. 创建场景、相机、渲染器
   * 2. 异步创建省份模型（完成后执行后续初始化）
   * 3. 初始化控制器、光照、辅助工具
   * 4. 初始化调试工具
   * 5. 添加事件监听
   * 6. 启动渲染循环
   */
  function init() {
    const container = containerRef.value;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 创建Three.js场景
    scene = new THREE.Scene();
    scene.background = null; // 透明背景

    // 创建透视相机
    // 参数：视场角55度，宽高比，近截面0.1，远截面1000
    camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);

    // 创建WebGL渲染器
    renderer = new THREE.WebGLRenderer({
      antialias: true, // 开启抗锯齿
      alpha: true, // 允许透明
    });
    renderer.setSize(width, height); // 设置渲染尺寸
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 设置像素比，限制最大为2防止性能问题
    renderer.shadowMap.enabled = true; // 开启阴影映射
    renderer.shadowMap.type = THREE.VSMShadowMap; // 使用VSM阴影映射算法
    container.appendChild(renderer.domElement); // 将canvas添加到容器

    // 异步创建省份模型，完成后继续初始化
    createProvinces().then(() => {
      // 初始化轨道控制器
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enablePan = true; // 禁用平移
      controls.enableZoom = true; // 允许缩放
      controls.minDistance = 2; // 最小缩放距离
      controls.maxDistance = 400; // 最大缩放距离
      controls.minPolarAngle = 0; // 最小极角（垂直旋转上限）
      controls.maxPolarAngle = Math.PI; // 最大极角（垂直旋转下限）
      controls.autoRotate = false; // 关闭自动旋转
      controls.enableDamping = true; // 开启阻尼效果（惯性）
      controls.dampingFactor = 0.05; // 阻尼系数

      // 设置相机位置在西藏自治区中心上空
      // 西藏自治区地理中心：纬度约31°N，经度约88°E
      const xizangCenter = { lng: 88, lat: 31 };
      const cameraHeightKm = 500; // 降低高度，让相机更靠近地图

      // 设置相机位置
      setCameraPositionByLatLng(
        camera,
        xizangCenter.lng,
        xizangCenter.lat,
        cameraHeightKm,
        sharedProjection
      );

      // 设置相机朝向指向西藏中心
      setCameraLookAtLatLng(camera, xizangCenter.lng, xizangCenter.lat, sharedProjection);

      // 同步更新OrbitControls的目标点
      const targetCoords = latLngToSceneCoords(
        xizangCenter.lng,
        xizangCenter.lat,
        sharedProjection
      );
      controls.target.set(targetCoords.x, 0, targetCoords.z);
      controls.update();

      // 输出调试信息
      console.log('相机位置:', camera.position);
      console.log('相机朝向:', camera.getWorldDirection(new THREE.Vector3()));

      // 创建环境光：白色，强度0.5
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      // 创建坐标轴辅助线（红色=x轴，绿色=y轴，蓝色=z轴），放在西藏中心位置
      axesHelper = new THREE.AxesHelper(30); // 增大尺寸到30
      axesHelper.position.set(targetCoords.x, 0, targetCoords.z); // 移到西藏中心
      scene.add(axesHelper);

      // 创建网格辅助线
      // 参数：10=网格大小，20=网格细分数，0x00d4ff=主网格颜色，0x1a3a5c=次网格颜色
      // 初始化调试工具
      initStats();
      initGUI();

      // 初始化射线投射器（用于鼠标拾取）
      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();

      // 添加窗口大小改变事件监听
      window.addEventListener('resize', onWindowResize);

      // 添加鼠标移动事件监听（用于省份hover检测）
      container.addEventListener('mousemove', onMouseMove);

      // 启动渲染循环
      animate();

      // 隐藏加载遮罩
      loading.value = false;
    });
  }

  // =============================================
  // 渲染循环
  // =============================================

  /**
   * 动画渲染循环
   *
   * 每帧执行：
   * 1. 更新性能统计
   * 2. 更新所有省份渲染器（处理颜色过渡动画等）
   * 3. 更新控制器（应用阻尼等）
   * 4. 渲染场景
   */
  function animate() {
    // 请求下一帧
    animationId = requestAnimationFrame(animate);

    // 更新性能统计
    if (stats) {
      stats.update();
    }

    // 确保场景、渲染器、相机都存在
    if (!scene || !renderer || !camera) return;

    // 更新所有省份渲染器（处理动画）
    provinceRenderers.forEach((province) => {
      province.update();
    });

    // 更新控制器（必须调用以应用阻尼等效果）
    if (controls) {
      controls.update();
    }

    // 渲染场景到canvas
    renderer.render(scene, camera);
  }

  // =============================================
  // 窗口大小调整
  // =============================================

  /**
   * 处理窗口大小改变事件
   *
   * 更新内容：
   * 1. 相机的宽高比
   * 2. 相机的投影矩阵（重新计算投影）
   * 3. 渲染器的尺寸
   */
  function onWindowResize() {
    const container = containerRef.value;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 更新相机宽高比
    camera.aspect = width / height;
    camera.updateProjectionMatrix(); // 通知相机投影矩阵已更新

    // 更新渲染器尺寸
    renderer.setSize(width, height);
  }

  // =============================================
  // 资源清理
  // =============================================

  /**
   * 组件卸载时清理所有资源
   *
   * 清理内容：
   * 1. 取消动画帧
   * 2. 移除事件监听
   * 3. 销毁Stats和GUI面板
   * 4. 销毁控制器
   * 5. 销毁渲染器
   * 6. 遍历销毁所有几何体和材质
   * 7. 销毁所有省份渲染器
   * 8. 销毁纹理
   * 9. 终止Web Worker
   * 10. 清空所有引用
   */
  function dispose() {
    // 取消动画帧
    if (animationId) {
      cancelAnimationFrame(animationId);
    }

    // 移除事件监听
    window.removeEventListener('resize', onWindowResize);
    containerRef.value?.removeEventListener('mousemove', onMouseMove);

    // 销毁Stats面板
    if (stats) {
      if (containerRef.value?.contains(stats.dom)) {
        containerRef.value.removeChild(stats.dom);
      }
      stats = null;
    }

    // 销毁GUI面板
    if (gui) {
      gui.destroy();
      gui = null;
    }

    // 销毁控制器
    if (controls) {
      controls.dispose();
    }

    // 销毁渲染器
    if (renderer) {
      renderer.dispose();
      if (containerRef.value?.contains(renderer.domElement)) {
        containerRef.value.removeChild(renderer.domElement);
      }
    }

    // 遍历场景，销毁所有几何体和材质
    if (scene) {
      scene.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          // 材质可能是数组，需要分别销毁
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    // 销毁所有省份渲染器
    provinceRenderers.forEach((r) => r.dispose());
    provinceRenderers = [];

    // 销毁渐变纹理
    if (gradientTexture) {
      gradientTexture.dispose();
      gradientTexture = null;
    }

    // 终止Web Worker
    if (geoWorker) {
      geoWorker.terminate();
      geoWorker = null;
    }

    // 清空所有核心对象引用
    scene = null;
    camera = null;
    renderer = null;
    controls = null;
    axesHelper = null;
    gradientTexture = null;
  }

  // =============================================
  // 生命周期钩子
  // =============================================

  /**
   * 组件挂载后初始化Three.js场景
   *
   * 使用requestAnimationFrame包装确保：
   * 1. DOM已经完全渲染
   * 2. 容器有正确的尺寸
   * 3. 避免在挂载过程中进行渲染
   */
  onMounted(() => {
    init();
  });

  /**
   * 组件卸载前清理所有资源
   * 防止内存泄漏和WebGL上下文残留
   */
  onUnmounted(() => {
    dispose();
  });
</script>

<style scoped>
  /* 根容器：相对定位，作为加载遮罩的定位参考 */
  .china-map-3d-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
  }

  /* Three.js渲染容器：占满父容器 */
  .china-map-3d-container {
    width: 100%;
    height: 100%;
  }

  /* 加载遮罩层：绝对定位覆盖整个容器 */
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 10, 20, 0.8); /* 深蓝色半透明背景 */
    display: flex;
    align-items: center; /* 水平居中 */
    justify-content: center; /* 垂直居中 */
    z-index: 100; /* 置于最上层 */
    transition: opacity 0.3s ease; /* 渐变消失效果 */
  }

  /* 加载内容：垂直排列 */
  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  /* 加载动画：蓝色旋转圆环 */
  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(59, 130, 246, 0.3); /* 半透明蓝色边框 */
    border-top-color: #3b82f6; /* 顶部为亮蓝色，形成旋转效果 */
    border-radius: 50%; /* 圆形 */
    animation: spin 1s linear infinite; /* 线性旋转动画 */
  }

  /* 加载文字样式 */
  .loading-text {
    color: #3b82f6;
    font-size: 14px;
    font-weight: 500;
  }

  /* 旋转动画关键帧 */
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
