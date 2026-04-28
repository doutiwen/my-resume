// 智慧小镇场景数据
export const sceneData = {
  name: '智慧小镇',
  description: '一个现代化的3D智慧小镇场景',
  environment: {
    skyColor: '#87CEEB',
    groundColor: '#7CFC00',
    ambientIntensity: 0.6,
    directionalIntensity: 1.2,
  },
  // 特定建筑 - 使用 GLB 模型
  specificBuildings: [
    {
      id: 'city-hall',
      type: 'specific-building',
      name: '市政厅',
      modelPath: '@/assets/glbModle/city_hall.glb',
      position: [0, 0, 0],
      scale: [1, 1, 1],
      rotation: [0, 0, 0],
      lod: [
        { level: 0, distance: 50 },
        { level: 1, distance: 150 },
        { level: 2, distance: 300 },
      ],
    },
    {
      id: 'hospital',
      type: 'specific-building',
      name: '医院',
      modelPath: '@/assets/glbModle/hospital.glb',
      position: [-30, 0, 20],
      scale: [1.2, 1.2, 1.2],
      rotation: [0, Math.PI / 4, 0],
      lod: [
        { level: 0, distance: 50 },
        { level: 1, distance: 150 },
        { level: 2, distance: 300 },
      ],
    },
    {
      id: 'school',
      type: 'specific-building',
      name: '学校',
      modelPath: '@/assets/glbModle/school.glb',
      position: [30, 0, 25],
      scale: [0.8, 0.8, 0.8],
      rotation: [0, -Math.PI / 6, 0],
      lod: [
        { level: 0, distance: 50 },
        { level: 1, distance: 150 },
        { level: 2, distance: 300 },
      ],
    },
    {
      id: 'shopping-mall',
      type: 'specific-building',
      name: '购物中心',
      modelPath: '@/assets/glbModle/mall.glb',
      position: [0, 0, 40],
      scale: [1.5, 1.5, 1.5],
      rotation: [0, Math.PI / 2, 0],
      lod: [
        { level: 0, distance: 50 },
        { level: 1, distance: 150 },
        { level: 2, distance: 300 },
      ],
    },
  ],
  // 通用建筑 - 使用程序化生成或简化模型
  genericBuildings: [
    ...Array.from({ length: 15 }, (_, i) => ({
      id: `generic-building-${i}`,
      type: 'generic-building',
      name: `住宅楼${i + 1}`,
      position: [((i % 5) - 2) * 25, 0, Math.floor(i / 5) * 30 - 30],
      scale: [1, 1 + Math.random() * 0.5, 1],
      features: {
        height: 10 + Math.random() * 15,
        width: 8 + Math.random() * 6,
        depth: 8 + Math.random() * 6,
        color: ['#90CAF9', '#FFCC80', '#CE93D8', '#A5D6A7'][i % 4],
        levels: Math.floor(3 + Math.random() * 5),
      },
    })),
  ],
  // 树木 - 从多个 GLB 模型中随机选择
  trees: {
    modelPaths: [
      '@/assets/glbModle/tree_pine.glb',
      '@/assets/glbModle/tree_oak.glb',
      '@/assets/glbModle/tree_willow.glb',
    ],
    instances: Array.from({ length: 40 }, (_, i) => ({
      id: `tree-${i}`,
      type: 'tree',
      position: [(Math.random() - 0.5) * 150, 0, (Math.random() - 0.5) * 150],
      scale: [0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4],
      rotation: [0, Math.random() * Math.PI * 2, 0],
    })),
  },
  // 路灯 - 使用单个 GLB 模型进行实例化渲染
  streetLights: {
    modelPath: '@/assets/glbModle/streetlight.glb',
    instances: Array.from({ length: 25 }, (_, i) => ({
      id: `streetlight-${i}`,
      type: 'streetlight',
      position: [((i % 5) - 2) * 35, 0, Math.floor(i / 5) * 40 - 80],
      scale: [1, 1, 1],
      rotation: [0, Math.PI / 2, 0],
    })),
  },
  // 道路 - 使用挤压几何体
  roads: [
    {
      id: 'main-road-h',
      type: 'road',
      name: '主干道-横向',
      points: [
        [-100, 0, -60],
        [100, 0, -60],
      ],
      features: {
        width: 10,
        color: '#424242',
        hasMarkings: true,
      },
    },
    {
      id: 'main-road-v',
      type: 'road',
      name: '主干道-纵向',
      points: [
        [0, 0, -100],
        [0, 0, 100],
      ],
      features: {
        width: 10,
        color: '#424242',
        hasMarkings: true,
      },
    },
    {
      id: 'cross-road-1',
      type: 'road',
      name: '横向道路1',
      points: [
        [-100, 0, -25],
        [100, 0, -25],
      ],
      features: {
        width: 7,
        color: '#424242',
        hasMarkings: true,
      },
    },
    {
      id: 'cross-road-2',
      type: 'road',
      name: '横向道路2',
      points: [
        [-100, 0, 25],
        [100, 0, 25],
      ],
      features: {
        width: 7,
        color: '#424242',
        hasMarkings: true,
      },
    },
    {
      id: 'vertical-road-1',
      type: 'road',
      name: '纵向道路1',
      points: [
        [-45, 0, -100],
        [-45, 0, 100],
      ],
      features: {
        width: 7,
        color: '#424242',
        hasMarkings: true,
      },
    },
    {
      id: 'vertical-road-2',
      type: 'road',
      name: '纵向道路2',
      points: [
        [45, 0, -100],
        [45, 0, 100],
      ],
      features: {
        width: 7,
        color: '#424242',
        hasMarkings: true,
      },
    },
  ],
};
