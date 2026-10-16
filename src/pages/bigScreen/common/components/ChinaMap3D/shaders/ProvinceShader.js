import * as THREE from 'three';

export const ProvinceVertexShader = `
  varying vec3 vPosition;

  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const ProvinceFragmentShader = `
  uniform vec3 uBaseColor;
  uniform vec3 uNeonColor;
  uniform float uTime;
  uniform bool uBreathEnabled;
  uniform float uBreathSpeed;
  uniform vec3 uBreathColor1;
  uniform vec3 uBreathColor2;
  uniform float uBreathIntensity;
  
  varying vec3 vPosition;
  
  void main() {
    float dist = length(vPosition.xy);
    
    float maxDist = 200.0;
    float normalizedDist = clamp(dist / maxDist, 0.0, 1.0);
    
    float glow = exp(-normalizedDist * normalizedDist * 3.0);
    
    float wave = sin(uTime * 2.0 + normalizedDist * 10.0) * 0.3 + 0.7;
    
    vec3 finalColor = uBaseColor + uNeonColor * glow * wave;
    
    // 呼吸渐变色效果
    if (uBreathEnabled) {
      // 使用正弦函数创建平滑的呼吸效果
      float breathCycle = sin(uTime * uBreathSpeed) * 0.5 + 0.5;
      
      // 在两个颜色之间插值
      vec3 breathColor = mix(uBreathColor1, uBreathColor2, breathCycle);
      
      // 应用呼吸颜色强度
      float intensity = uBreathIntensity * (1.0 - normalizedDist * 0.5);
      finalColor = mix(finalColor, finalColor + breathColor, intensity);
      
      // 添加脉冲高亮效果
      float pulse = pow(breathCycle, 2.0) * 0.3;
      finalColor += breathColor * pulse * glow;
    }
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export const ProvinceShaderUniforms = {
  uBaseColor: { value: new THREE.Color('#2a2a4a') },
  uNeonColor: { value: new THREE.Color('#00ffff') },
  uTime: { value: 0.0 },
  uBreathEnabled: { value: true },
  uBreathSpeed: { value: 1.0 },
  uBreathColor1: { value: new THREE.Color('#00ffff') },
  uBreathColor2: { value: new THREE.Color('#ff00ff') },
  uBreathIntensity: { value: 0.5 },
};
