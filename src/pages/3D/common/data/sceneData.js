// 智慧小镇场景数据
export const sceneData = {
  name: '智慧小镇',
  description: '一个现代化的 3D 智慧小镇场景',
  environment: {
    skyColor: '#87CEEB',
    groundColor: '#7CFC00',
    ambientIntensity: 0.6,
    directionalIntensity: 1.2,
  },
  // 特定建筑 - 使用 GLB 模型和 LOD 渲染
  specificBuildings: [
    {
      id: 'city-hall',
      type: 'specific-building',
      name: '市政厅',
      modelName: 'specific_1',
      position: [0, 0, 0],
      scale: [1, 1, 1],
      rotation: [0, 0, 0],
      lodDistances: {
        high: 50,
        medium: 150,
        low: 300,
      },
    },
    // {
    //   id: 'hospital',
    //   type: 'specific-building',
    //   name: '医院',
    //   modelName: 'hospital',
    //   position: [-30, 0, 20],
    //   scale: [1.2, 1.2, 1.2],
    //   rotation: [0, Math.PI / 4, 0],
    //   lodDistances: {
    //     high: 50,
    //     medium: 150,
    //     low: 300,
    //   },
    // },
    // {
    //   id: 'school',
    //   type: 'specific-building',
    //   name: '学校',
    //   modelName: 'school',
    //   position: [30, 0, 25],
    //   scale: [0.8, 0.8, 0.8],
    //   rotation: [0, -Math.PI / 6, 0],
    //   lodDistances: {
    //     high: 50,
    //     medium: 150,
    //     low: 300,
    //   },
    // },
    // {
    //   id: 'shopping-mall',
    //   type: 'specific-building',
    //   name: '购物中心',
    //   modelName: 'mall',
    //   position: [0, 0, 40],
    //   scale: [1.5, 1.5, 1.5],
    //   rotation: [0, Math.PI / 2, 0],
    //   lodDistances: {
    //     high: 50,
    //     medium: 150,
    //     low: 300,
    //   },
    // },
  ],
  // 通用建筑 - 使用 GLB 模型随机选择和 LOD 渲染
  genericBuildings: [
    ...Array.from({ length: 15 }, (_, i) => ({
      id: `generic-building-${i}`,
      type: 'generic-building',
      name: `住宅楼${i + 1}`,
      position: [((i % 5) - 2) * 25, 0, Math.floor(i / 5) * 30 - 30],
      scale: [1, 1 + Math.random() * 0.5, 1],
      rotation: [0, Math.random() * Math.PI * 2, 0],
      lodDistances: {
        high: 50,
        medium: 150,
        low: 300,
      },
    })),
  ],
  // 道路 - 使用挤压几何体
  roads: [
    {
      id: 'main-road-h',
      type: 'road',
      name: '主干道 - 横向',
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
      name: '主干道 - 纵向',
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
      name: '横向道路 1',
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
      name: '横向道路 2',
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
      name: '纵向道路 1',
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
      name: '纵向道路 2',
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
