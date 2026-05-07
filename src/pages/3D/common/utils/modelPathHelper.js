/**
 * 模型路径辅助工具
 * 用于根据模型名称、类型和细节级别获取 GLB 模型的完整路径
 */

/**
 * 获取模型的完整路径
 * @param {string} modelName - 模型名称（不带扩展名）
 * @param {string} modelType - 模型类型：'building' | 'tree' | 'streetLight' | 'road'
 * @param {string} [level] - 细节级别：'high' | 'medium'（可选，只有这两个值有效）
 * @returns {string} GLB 模型的完整路径
 */
export function getModelPath(modelName, level, modelType = 'building') {
  // 根据模型类型确定子目录（使用 switch 语句）
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

  const levelPath = level === 'high' || level === 'medium' ? level : '';
  const pathParts = ['3d_models', typePath, levelPath, `${modelName}.glb`].filter(Boolean);
  return `${import.meta.env.VITE_BASE_URL}${pathParts.join('/')}`;
}
