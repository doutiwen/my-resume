export const sceneData = {
  buildings: [
    {
      id: 'city-hall',
      type: 'specific-building',
      name: '市政厅',
      modelName: 'building_1',
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
  ],
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
