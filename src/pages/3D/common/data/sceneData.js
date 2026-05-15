export const sceneData = {
  buildings: [
    // {
    //   id: 'city-hall',
    //   type: 'building',
    //   name: '市政厅1',
    //   modelName: 'building_1',
    //   position: [60, 0, 60],
    //   scale: [1, 1, 1],
    //   rotation: [0, 0, 0],
    //   // lodDistances: {
    //   //   high: 50,
    //   //   medium: 150,
    //   //   low: 300,
    //   // },
    // },
    {
      id: 'city-hall-2',
      type: 'building',
      name: '市政厅',
      modelName: 'building_2',
      position: [0, 0, 0],
      scale: [1, 1, 1],
      rotation: [0, 0, 0],
      // lodDistances: {
      //   high: 50,
      //   medium: 150,
      //   low: 300,
      // },
    },
  ],
  trees: [
    {
      id: 'trees',
      type: 'tree',
      name: '树',
      position: [60, 0, 60],
      scale: [1, 1, 1],
      rotation: [0, 0, 0],
    },
    {
      id: 'trees_2',
      type: 'tree',
      name: '树',
      position: [120, 0, 120],
      scale: [1, 1, 1],
      rotation: [0, 0, 0],
    },
  ],
  roads: [
    // 单条闭环椭圆形道路
    // {
    //   id: 'elliptical-loop',
    //   type: 'road',
    //   name: '椭圆环路',
    //   points: [
    //     [-80, 0, 0], // 西端点
    //     [-75, 0, 20], // 西环拐点1
    //     [-60, 0, 35], // 西环拐点2
    //     [-30, 0, 45], // 西北拐点
    //     [0, 0, 50], // 北中点
    //     [30, 0, 45], // 东北拐点
    //     [60, 0, 35], // 东环拐点2
    //     [75, 0, 20], // 东环拐点1
    //     [80, 0, 0], // 东端点
    //     [75, 0, -20], // 东环拐点3
    //     [60, 0, -35], // 东环拐点4
    //     [30, 0, -45], // 东南拐点
    //     [0, 0, -50], // 南中点
    //     [-30, 0, -45], // 西南拐点
    //     [-60, 0, -35], // 西环拐点3
    //     [-75, 0, -20], // 西环拐点4
    //     [-80, 0, 0], // 回到西端点（闭合）
    //   ],
    //   features: {
    //     width: 12,
    //     color: '#909090',
    //     hasMarkings: true,
    //   },
    // },

    // 直线型道路测试
    {
      id: 'straight-road',
      type: 'road',
      name: '直线路',
      points: [
        [-100, 0, 0],
        [0, 0, 0],
        [100, 0, 0],
      ],
      features: {
        width: 12,
        color: '#909090',
        hasMarkings: true,
      },
    },
  ],
};
