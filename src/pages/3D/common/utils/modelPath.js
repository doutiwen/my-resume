function getModelPath(modelName, modelType, lodLevel) {
  const finalModelName = Array.isArray(modelName)
    ? modelName[Math.floor(Math.random() * modelName.length)]
    : modelName;

  let typePath = '';
  switch (modelType) {
    case 'building':
      typePath = 'buildings';
      break;
    case 'tree':
      typePath = 'trees';
      break;
    case 'streetLight':
      typePath = 'street_lights';
      break;
    case 'road':
      typePath = 'roads';
      break;
    default:
      typePath = 'others';
  }

  let fileName = 'model.glb';
  if (modelType === 'building' && lodLevel === 'high') {
    fileName = 'lod_high.glb';
  } else if (modelType === 'building' && lodLevel === 'medium') {
    fileName = 'lod_medium.glb';
  }

  const pathParts = ['3d_models', typePath, finalModelName, fileName];
  pathParts.unshift('');
  return pathParts.join('/');
}

export { getModelPath };
