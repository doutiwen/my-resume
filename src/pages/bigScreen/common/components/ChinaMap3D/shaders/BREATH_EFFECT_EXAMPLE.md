# 呼吸渐变色功能使用示例

## 概述

呼吸渐变色功能为数据大屏中的省份着色器添加了平滑的颜色过渡动画效果，通过正弦函数实现从颜色1到颜色2的周期性渐变。

## 功能特性

- **平滑过渡**：使用正弦函数实现自然的呼吸效果
- **脉冲高亮**：在颜色变化时添加发光脉冲效果
- **距离衰减**：靠近中心的区域颜色更强烈，向边缘逐渐衰减
- **可配置参数**：支持速度、颜色、强度等参数的自定义

## 使用方法

### 1. 基本使用（默认已启用）

呼吸渐变效果默认已启用，无需额外配置即可看到青蓝色到紫红色的渐变效果。

```javascript
// RegionRenderer 实例已包含呼吸渐变功能
const regionRenderer = new RegionRenderer(precomputedData);
```

### 2. 控制启用/禁用

```javascript
// 启用呼吸效果
regionRenderer.setBreathEnabled(true);

// 禁用呼吸效果
regionRenderer.setBreathEnabled(false);
```

### 3. 设置呼吸速度

```javascript
// 设置呼吸速度（值越大呼吸越快）
// 默认值为 1.0
regionRenderer.setBreathSpeed(2.0);  // 快速呼吸
regionRenderer.setBreathSpeed(0.5);  // 慢速呼吸
```

### 4. 设置呼吸渐变颜色

```javascript
// 设置第一个渐变颜色
regionRenderer.setBreathColor1('#00ffff');  // 青色

// 设置第二个渐变颜色
regionRenderer.setBreathColor2('#ff00ff');  // 品红

// 同时设置两个颜色
regionRenderer.setBreathColors('#00ff00', '#ff0000');  // 绿色到红色
```

### 5. 设置呼吸强度

```javascript
// 设置呼吸效果强度（0-1）
// 值越大，呼吸颜色越明显
regionRenderer.setBreathIntensity(0.8);  // 高强度
regionRenderer.setBreathIntensity(0.3);  // 低强度
```

## 预设配色方案

### 方案1：科技蓝紫（默认）
```javascript
regionRenderer.setBreathColors('#00ffff', '#ff00ff');  // 青色 → 紫红色
```

### 方案2：经典蓝红
```javascript
regionRenderer.setBreathColors('#0066ff', '#ff3300');  // 蓝色 → 橙红色
```

### 方案3：自然渐变
```javascript
regionRenderer.setBreathColors('#00ff88', '#ffff00');  // 绿色 → 黄色
```

### 方案4：单色呼吸
```javascript
regionRenderer.setBreathColors('#00ffff', '#00aaaa');  // 深浅青色
```

## 完整使用示例

```javascript
// 创建区域渲染器
const regionRenderer = new RegionRenderer(precomputedData);

// 自定义呼吸效果
regionRenderer.setBreathEnabled(true);
regionRenderer.setBreathSpeed(1.5);
regionRenderer.setBreathColors('#00ffff', '#ff00ff');
regionRenderer.setBreathIntensity(0.6);

// 在动画循环中更新（自动完成）
function animate() {
  requestAnimationFrame(animate);
  regionRenderer.update();  // 自动更新时间uniform
  renderer.render(scene, camera);
}
```

## 着色器参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `uBreathEnabled` | bool | true | 是否启用呼吸渐变 |
| `uBreathSpeed` | float | 1.0 | 呼吸速度 |
| `uBreathColor1` | vec3 | #00ffff | 渐变起始颜色 |
| `uBreathColor2` | vec3 | #ff00ff | 渐变结束颜色 |
| `uBreathIntensity` | float | 0.5 | 呼吸效果强度 |

## 性能考虑

- 呼吸渐变效果仅在着色器中计算，对性能影响极小
- 可根据需要调整呼吸速度，避免过于频繁的更新
- 建议将强度设置在 0.3-0.7 之间以获得最佳视觉效果

## 与现有效果的协同

呼吸渐变效果与原有的霓虹发光效果完全兼容：

```javascript
// 霓虹发光仍然生效
// 呼吸渐变在发光效果基础上添加颜色变化

// 可以禁用发光，仅保留呼吸渐变
regionRenderer.setBreathEnabled(true);
// 注：霓虹发光由 uNeonColor 控制，无法单独禁用
```
