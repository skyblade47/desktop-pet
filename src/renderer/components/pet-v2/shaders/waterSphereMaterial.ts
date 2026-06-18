import * as THREE from 'three'

/* ──────────── 墨水球体自定义 Shader ────────────
 *
 * 模拟"悬浮在清水中的墨滴球体"效果：
 *   1. 内部墨色密度场 — 左上偏浓黑墨，右下偏淡半透明灰（水墨晕染渐变）
 *   2. Lambert 漫反射 — 亮面/暗面基础立体感
 *   3. Blinn-Phong 高光 — 湿表面光泽，自然过渡
 *   4. 背光透射 — dot(N,-L) 让光线穿透球体后从暗面透出，是水珠"晶莹"的关键
 *   5. Fresnel 边缘光 — 球体与深色背景分离
 *   6. 底部焦散亮斑 — 光线穿过球体后在底部聚焦形成的亮点
 * ────────────────────────────────────────────── */

export function createInkSphereMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      // 光源方向（左上主光）
      uLightDir: { value: new THREE.Vector3(-0.52, 0.68, 0.45) },
      // 墨色密度场 — 方向：左上浓墨区域
      uInkDir: { value: new THREE.Vector3(-0.4, 0.58, 0.28) },
      // 淡墨色（半透明灰蓝，右下区域）
      uLightInk: { value: new THREE.Color('#4a6078') },
      // 浓墨色（实心黑墨，左上区域）
      uDarkInk: { value: new THREE.Color('#0a0f16') },
      // 高光颜色
      uSpecColor: { value: new THREE.Color('#e8f6ff') },
      // Fresnel 边缘光颜色
      uFresnelColor: { value: new THREE.Color('#6098b8') },
      // 背光透射颜色
      uBacklightColor: { value: new THREE.Color('#2a6090') },

      // ---- 参数 ----
      uAmbient: { value: 0.08 },
      uDiffuseStrength: { value: 0.78 },
      uSpecPower: { value: 180.0 },
      uSpecStrength: { value: 0.62 },
      uFresnelPower: { value: 5.5 },
      uFresnelStrength: { value: 0.14 },
      uInkDensity: { value: 0.7 },
      uInkSpread: { value: 0.55 },
      uBacklightStrength: { value: 0.48 },
      uOpacity: { value: 0.78 },
      // 呼吸动画 — 时间与幅度
      uTime: { value: 0.0 },
      uBreathAmplitude: { value: 0.0 },
    },
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      uniform float uTime;
      uniform float uBreathAmplitude;

      // 简单伪随机 hash，用于打破正弦波的规律性
      float hash(vec3 p) {
        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
      }

      // ══════════════════════════════════════════════════
      // 位移函数 — 给定球面上的方向 dir，返回该点的径向位移量
      //   提取为独立函数，以便多次采样做有限差分
      // ══════════════════════════════════════════════════
      float computeDisplacement(vec3 dir) {
        float wave1  = sin(dir.y * 2.4 + uTime * 0.85)        * 0.030;
        wave1       += cos(dir.z * 1.9 + uTime * 0.595)      * 0.018;
        wave1       += sin(dir.x * 2.1 + uTime * 1.105)      * 0.022;

        float wave2  = sin(dir.x * 3.7 + uTime * 1.16)        * cos(dir.y * 3.3 - uTime * 0.87)   * 0.020;
        wave2       += cos(dir.z * 4.1 + uTime * 1.74)        * sin(dir.x * 2.8 - uTime * 1.305)  * 0.016;
        wave2       += sin(dir.y * 3.5 - uTime * 1.595)       * cos(dir.z * 3.9 + uTime * 0.725)  * 0.018;

        float wave3  = sin(dir.x * 7.3 + uTime * 2.6)         * cos(dir.y * 6.8 - uTime * 1.82)   * 0.009;
        wave3       += cos(dir.z * 8.1 - uTime * 1.3)         * sin(dir.x * 7.5 + uTime * 2.08)   * 0.007;

        float randomPhase = hash(dir * 3.7) * 6.283;
        float waveR = sin(uTime * 0.95 + randomPhase) * 0.008;

        return (wave1 + wave2 + wave3 + waveR) * uBreathAmplitude;
      }

      void main() {
        vec3 dir = normalize(position);

        // ── 本顶点的位移 ──
        float disp0 = computeDisplacement(dir);

        // ── 有限差分求梯度 → 修正法线 ──
        //     在切平面两个方向上采样位移，计算表面斜率
        //     然后用斜率扰动原始法线，使高光随液体形变而动
        const float EPS = 0.015;

        // 构建切空间基向量（与 dir 正交的两个方向）
        vec3 up = abs(dir.y) > 0.999 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
        vec3 tangent1 = normalize(cross(dir, up));
        vec3 tangent2 = cross(dir, tangent1);

        // 沿切向偏移两个微距，分别采样位移
        vec3 sample1 = normalize(dir + tangent1 * EPS);
        vec3 sample2 = normalize(dir + tangent2 * EPS);
        float disp1 = computeDisplacement(sample1);
        float disp2 = computeDisplacement(sample2);

        // 梯度 = 位移变化率（无量纲，表示表面斜率）
        float gradU = (disp1 - disp0) / EPS;
        float gradV = (disp2 - disp0) / EPS;

        // 扰动法线：n_new ≈ n - grad_u * t1 - grad_v * t2
        //   grad_u > 0 表示位移沿 t1 增加 → 表面向 t1 方向翘起 → 法线向 -t1 偏转
        vec3 pertNormal = normalize(dir - tangent1 * gradU - tangent2 * gradV);

        // 变形后的位置
        vec3 deformed = position + dir * disp0;

        vec4 worldPos = modelMatrix * vec4(deformed, 1.0);
        vWorldPos = worldPos.xyz;
        vNormal = normalize(mat3(modelMatrix) * pertNormal);
        vViewDir = normalize(cameraPosition - worldPos.xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(deformed, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      uniform vec3 uLightDir;
      uniform vec3 uInkDir;
      uniform vec3 uLightInk;
      uniform vec3 uDarkInk;
      uniform vec3 uSpecColor;
      uniform vec3 uFresnelColor;
      uniform vec3 uBacklightColor;
      uniform float uAmbient;
      uniform float uDiffuseStrength;
      uniform float uSpecPower;
      uniform float uSpecStrength;
      uniform float uFresnelPower;
      uniform float uFresnelStrength;
      uniform float uInkDensity;
      uniform float uInkSpread;
      uniform float uBacklightStrength;
      uniform float uOpacity;

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewDir);
        vec3 L = normalize(uLightDir);

        // ══════════════════════════════════════════════════
        // 1. 内部墨色密度场 — 实现"左上浓墨、右下淡墨"
        // ══════════════════════════════════════════════════
        float inkDot = dot(N, normalize(uInkDir));

        // 水墨晕染渐变带 — 不是硬边，是平滑过渡
        // smoothstep 区间由 uInkSpread 控制（越小过渡越锐利）
        float transition = 0.35 + uInkSpread * 0.60;  // 0.35 ~ 0.95
        float inkGradient = smoothstep(-transition, transition, inkDot);

        // 墨色密度：高 → 浓黑，低 → 淡灰
        float inkDensity = inkGradient * uInkDensity;

        // 添加细微的纹理扰动避免过于均匀
        float noise = sin(vWorldPos.y * 6.8) * cos(vWorldPos.z * 7.3) * 0.03;
        inkDensity = clamp(inkDensity + noise, 0.0, 1.0);

        // 体色插值
        vec3 bodyColor = mix(uLightInk, uDarkInk, inkDensity);

        // ══════════════════════════════════════════════════
        // 2. Lambert 漫反射 — 表面明暗
        // ══════════════════════════════════════════════════
        float NdotL = max(dot(N, L), 0.0);
        float diffuse = uAmbient + NdotL * uDiffuseStrength;

        // ══════════════════════════════════════════════════
        // 3. Blinn-Phong 高光 — 湿表面光泽
        // ══════════════════════════════════════════════════
        vec3 H = normalize(L + V);
        float spec = pow(max(dot(N, H), 0.0), uSpecPower) * uSpecStrength;

        // 第二层柔和宽高光 — 模拟次表面散射的柔光（已大幅衰减，避免侵入边缘）
        float softSpec = pow(max(dot(N, H), 0.0), uSpecPower * 0.06) * uSpecStrength * 0.08;

        // ══════════════════════════════════════════════════
        // 4. 背光透射 — 水珠"晶莹剔透"的核心
        //    光线进入球体 → 穿透 → 从暗面射出
        //    墨色密度越低（越透明），透射越强
        // ══════════════════════════════════════════════════
        float NdotL_neg = max(dot(N, -L), 0.0);
        float translucency = 1.0 - inkDensity;
        float backTransmission = NdotL_neg * translucency * uBacklightStrength;

        // 底部焦散聚焦 — 光线在球体底部汇聚形成的亮斑
        float causticAngle = max(dot(N, vec3(0.25, -0.72, 0.15)), 0.0);
        float caustic = pow(causticAngle, 4.5) * translucency * uBacklightStrength * 0.45;
        backTransmission += caustic;

        // ══════════════════════════════════════════════════
        // 5. Fresnel 边缘光
        // ══════════════════════════════════════════════════
        float fresnel = 1.0 - abs(dot(N, V));
        float rim = pow(fresnel, uFresnelPower) * uFresnelStrength;
        // 宽光晕 — 极窄，仅极边缘可见
        float rimSoft = pow(fresnel, uFresnelPower * 3.0) * uFresnelStrength * 0.10;

        // ══════════════════════════════════════════════════
        // 6. 合成
        // ══════════════════════════════════════════════════
        vec3 color = bodyColor * diffuse;
        color += uBacklightColor * backTransmission;
        color += uSpecColor * (spec + softSpec);
        color += uFresnelColor * (rim + rimSoft);

        // 不透明度：墨色越浓越不透明
        float opacity = mix(0.35, 0.94, inkDensity) * uOpacity;

        gl_FragColor = vec4(color, opacity);
      }
    `,
  })
}

/* ──────────── 更新 shader 参数（供控制面板使用） ──────────── */

export function updateInkSphereUniforms(
  mat: THREE.ShaderMaterial,
  specPower: number,
  specStr: number,
  fresnelPower: number,
  fresnelStr: number,
  inkDensity: number,
  inkSpread: number,
  backlight: number,
  opacity: number,
  time?: number,
  breathAmplitude?: number
) {
  mat.uniforms.uSpecPower.value = specPower
  mat.uniforms.uSpecStrength.value = specStr
  mat.uniforms.uFresnelPower.value = fresnelPower
  mat.uniforms.uFresnelStrength.value = fresnelStr
  mat.uniforms.uInkDensity.value = inkDensity
  mat.uniforms.uInkSpread.value = inkSpread
  mat.uniforms.uBacklightStrength.value = backlight
  mat.uniforms.uOpacity.value = opacity
  if (time !== undefined) mat.uniforms.uTime.value = time
  if (breathAmplitude !== undefined) mat.uniforms.uBreathAmplitude.value = breathAmplitude
}
