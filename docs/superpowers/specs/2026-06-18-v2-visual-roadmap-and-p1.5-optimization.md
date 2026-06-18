# V2 视觉阶段推进路线图与进度报告

> 日期：2026-06-18
> 状态：进行中
> 关联：`desktop-pet/src/renderer/components/pet-v2/`

---

## 一、V2 视觉阶段推进路线图

### 1.1 总览

```
P1.5 水滴优化 ✅ ──→ P3 墨团 ✅ ──→ P2 水墨墨迹 🔄 ──→ P4 墨团流动 & 形变
                       │
                  (P7 双眼 ✂️ 已移除)
```

> **调整说明**（2026-06-18）：
> - 先完成墨团（P3）再完成墨迹（P2），因为墨迹作为球体晕染层需配合墨团效果验收
> - 双眼设计（P7）已废弃——用户决定墨团本身的形变和分裂来演绎表情，纯墨滴不需要眼睛
> - 外部环绕飘带方案（InkTrails）三次迭代均不理想，改用 CSS 水墨光晕 + 计划中的 Shader 球面流动墨色纹理

### 1.2 阶段定义

| 阶段 | 名称 | 状态 | 核心目标 | 涉及文件 |
|------|------|------|---------|---------|
| P1.5 | 水滴球体优化 | ✅ 完成 | 清澈水滴 + 波澜呼吸基态 + 为墨团留空间 | Shader + WaterSphere + types + StageControls |
| P3 | 墨团 | ✅ 完成 | 浓墨核心沉淀球体 + 统一光照 + 独立呼吸形变 | InkBlob.tsx |
| P2 | 水墨墨迹 | 🔄 进行中 | CSS 背景水墨光晕 + 球面流动墨色 Shader 纹理 | index.css + waterSphereMaterial.ts |
| P4 | 墨团流动与形变 | ⏳ 待开始 | 墨团受惯性漂移 + 受挤压形变为大小液滴 + 表情 | InkBlob 动画逻辑扩展 |
| P5 | 罗夏随机 | ⏳ 待开始 | 非对称随机墨迹边缘 | fragmentShader 扩展 |
| P6 | 墨迹流动循环 | ⏳ 待开始 | 生长→扩散→消散→再生 | 全管线联动 |

> ✂️ **废弃阶段**：P7 双眼设计——已删除 Eyes.tsx 组件及相关引用。表情通过墨团形态变化实现。

### 1.3 每阶段铁律

- 每次只做一个视觉层，每个层**独立可验收**
- V1 保持不动，V2 始终在 `?preview=v2` 独立入口
- 验收通过后方可合并到 `main` 分支并打新 tag
- 根据 lessons-learned 第 13 条：每个效果单独实现，逐层叠加
- **光照统一铁律**：所有元素的 `uLightDir`、`uSpecColor`、`uFresnelColor`、`uAmbient`、`uDiffuseStrength`、`uSpecPower`、`uSpecStrength`、`uFresnelPower`、`uFresnelStrength` 必须与外部球体（`waterSphereMaterial.ts`）保持一致

### 1.4 设计理念：悬浮墨滴生物

球体是**带淡墨晕染的清澈水珠**，内部悬浮一块浓墨核心。外部周围有不规则水墨光晕表现"悬浮"感。后续阶段墨团通过**分裂为大团+小团**来表现受挤压，通过**形态改变**做表情——不再需要面部器官。

**渲染层级模型（从下到上）：**

```
第 1 层：CSS 背景底色
第 2 层：CSS 水墨光晕（::before 伪元素，6 层椭圆径向渐变，mix-blend-mode: multiply）
第 3 层：球体背面（Shader 基色 + 背光透射）
第 4 层：墨团（球体内部悬浮）  ← InkBlob
第 5 层：球体外侧 Shader（高光 + Fresnel）
第 6 层：球面流动墨色纹理（计划中）
```

---

## 二、P1.5 水滴球体优化（✅ 已完成）

核心改动已完成：

| 改动 | 状态 |
|------|------|
| 清澈水球 + 墨核心模式（颜色 5 项调整） | ✅ |
| 波澜式呼吸（3 波降为稀疏波澜） | ✅ |
| 取消呼吸开关（breathAmplitude 作为默认基态） | ✅ |
| 移除 `breathEnabled` 类型定义和 UI | ✅ |

---

## 三、P3 墨团（✅ 已完成）

### 3.1 实现方案

**文件：** [InkBlob.tsx](file:///d:/Projects/ai-writing-coach/desktop-pet/src/renderer/components/pet-v2/InkBlob.tsx)

**架构：** 自定义 `ShaderMaterial`（无 FBM 噪声、无有机变形），纯几何球体 + 和外部球体完全一致的光照模型。

**光照参数**：与 `waterSphereMaterial.ts` 的 9 个 uniform 值完全一致。

**呼吸形变**：采用与水球相同架构的 `computeDisplacement` 方法，但波形参数不同（横向旋转涟漪 + 斜向波动 + 中频涟漪），频率/方向/振幅均有区别。

**动画**：正弦波漂浮在左上方（x±0.08, y±0.06, z±0.07），默认中心 `(-0.15, 0.2, 0.08)`。

**大小**：`baseScale = 0.15 + blobSize × 0.5`，默认 `blobSize=0.72` → 占球体半径约 35%。

**控制面板**：
- `墨团大小`：0.05~1，默认 0.72
- `墨团浓度`：0.1~1，默认 0.8

### 3.2 排坑记录

| # | 现象 | 根因 | 修复 | 教训 |
|---|------|------|------|------|
| 1 | 迭代后墨团消失 | InkBlob 接口变更 → tsc 报错 → Vite HMR 静默失败 | 逐层叠加，每次 `npm run typecheck` | HMR 不报错 |
| 2 | 加光照后透明 | `diffuse=0.06` 底值太低导致接近纯黑 | 统一水球 diffuse 参数 | 光照参数须对照已有验证值 |
| 3 | quaternion 赋值消失 | 设置 `meshRef.quaternion` 后不可见 | 改为 vertex shader 实现方向变形 | quaternion + 特殊材质有未知冲突 |

---

## 四、P2 水墨墨迹（🔄 进行中）

### 4.1 CSS 水墨光晕（✅ 已完成）

**文件：** `src/renderer/index.css` — `.v2-pet-stage::before`

- 6 层椭圆径向渐变重叠，形成**不对称有机墨池形状**
- `mix-blend-mode: multiply` — 墨色叠加产生真实浸染感
- `opacity: 0.72`，`z-index: 2` 确保在 Canvas 之上
- 深色/浅色/原木色三种背景模式各自适配墨色色调
- 不在球体表面——是球体**周围的环境光晕**，表现悬浮状态

### 4.2 InkTrails 飘带方案回顾（已废弃）

三次迭代均不理想：

| 迭代 | 方案 | 问题 |
|------|------|------|
| v1 | TubeGeometry 管道圆环 6 条 | 太规整，像环带不像水墨笔触 |
| v2 | 自定义 RibbonGeometry 飘带 + FBM 噪声阈值 | 干笔飞白效果仍不够水墨风 |
| v3 | 10 条飘带 + 更多噪声层 | 方向性错误——用户要的不是表面几何飘带 |

**废弃原因**：3D 几何管线无法表达水墨的浓淡自然过渡和散逸美感。最终删除 `InkTrails.tsx`。

### 4.3 球面流动墨色纹理（计划中）

**方案**：在 `waterSphereMaterial.ts` 的 fragmentShader 中，用 **domain-distorted flow noise** 在球面上产生流动的丝带状墨色纹理。

```glsl
// 噪声场沿方位角方向扭曲 → 丝带状纹理
float flow = fbm(vWorldPos * scale + curlNoise(vWorldPos * flowScale));
float ink = smoothstep(0.45, 0.62, flow);
```

产生类似水墨在宣纸上自然渗开的旋转纹理，随时间缓慢漂移和形变。

> **当前阻塞**：CSS 光晕在预览中不可见，需排查层级或 canvas alpha 覆盖问题。

---

## 五、待实现阶段

| 阶段 | 设计方向 |
|------|---------|
| P2 球面墨色纹理 | domain-distorted flow noise 产生流动丝带状墨色晕染 |
| P4 墨团流动与形变 | 墨团受惯性漂移 + 受挤压时分裂为大团+小团 + 形态变化做表情 |
| P5 罗夏随机 | 墨迹边缘产生非对称随机形变 |
| P6 墨迹循环 | 墨迹生长→扩散→消散→再生的循环动画 |

---

## 六、废弃阶段记录

| 阶段 | 原因 | 相关 Commit |
|------|------|-------------|
| P7 双眼 | 用户决定表情通过墨团形态变化实现 | `9260e0f` |
| InkTrails 飘带 | 三次迭代不理想，改用 CSS 光晕 + 计划 Shader 方案 | `9260e0f` |

---

*进度报告结束*
