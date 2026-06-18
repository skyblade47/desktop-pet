# 📋 错误库

> **版本**: 1.3
> **创建日期**: 2026-06-16
> **最后更新**: 2026-06-18
> **用途**: 记录开发过程中遇到的错误及解决方案，避免重复踩坑

---

## 错误分类

- **类型错误** — TypeScript 类型不匹配、缺少类型定义
- **运行时错误** — 程序崩溃、异常抛错
- **逻辑错误** — 程序正常运行但结果不符合预期
- **Shader 错误** — GLSL 编译/链接失败、渲染异常
- **规范违反** — 违反 CODE_STANDARDS 或 WORK_PRINCIPLES
- **架构问题** — 设计决策导致的系统性缺陷

---

## V2 Three.js 渲染引擎错误记录

### E001 — GLSL vertex shader 中 `position` 不可直接赋值

| 属性 | 说明 |
|------|------|
| **分类** | Shader 错误 |
| **严重度** | 🔴 阻塞 |
| **现象** | ShaderMaterial 编译失败，控制台输出 `ERROR: 0:xx: 'assign' : cannot assign to 'gl_Position'` 或类似错误 |
| **根因** | GLSL 中 `position` 是预定义的 attribute，在 vertex shader 中不可写。变形后的位置必须存储到局部变量，然后通过 `gl_Position` 输出 |
| **正确写法** | `vec3 deformed = position + normal * disp; gl_Position = projectionMatrix * modelViewMatrix * vec4(deformed, 1.0);` |
| **错误写法** | `position += normal * disp;` // 直接修改 position |
| **解决日期** | 2026-06-17 |

### E002 — Three.js ShaderMaterial 不支持 `material.color` 等内置属性

| 属性 | 说明 |
|------|------|
| **分类** | Shader 错误 |
| **严重度** | 🔴 阻塞 |
| **现象** | Shader 中引用 `material.color` 但结果始终为默认值（或编译失败） |
| **根因** | `THREE.ShaderMaterial` 不会自动注入 MeshStandardMaterial/MeshPhongMaterial 的内置 uniform。所有参数必须通过自定义 `uniforms` 对象传入 |
| **解决方案** | 在创建 ShaderMaterial 时，所有需要从 JS 传入的值都必须定义在 `uniforms` 对象中，例如 `uSpecColor: { value: new THREE.Color('#e8f6ff') }` |
| **解决日期** | 2026-06-17 |

### E003 — React Three Fiber 中 `useMemo` 创建的 material 在组件重渲染时丢失

| 属性 | 说明 |
|------|------|
| **分类** | 运行时错误 |
| **严重度** | 🟡 中 |
| **现象** | 滑块调节参数后，shader material 被重新创建而非更新已有 material，导致视觉闪烁或动画中断 |
| **根因** | 将需要动态更新的参数放入 `useMemo` 依赖数组会导致 material 被重建。正确做法是：用 `useMemo` 创建 material 一次（空依赖），然后用 `useFrame` 更新 uniform 值 |
| **解决方案** | material 创建使用 `useMemo(() => createMaterial(), [])`（空依赖数组），参数更新在 `useFrame` 中通过 `material.uniforms.xxx.value = newValue` 完成 |
| **代码示例** | 参考 `WaterSphere.tsx` L83（material 创建）和 L90-130（useFrame 更新） |
| **解决日期** | 2026-06-17 |

### E004 — Blinn-Phong 高光在 Fresnel 边缘光叠加后过曝

| 属性 | 说明 |
|------|------|
| **分类** | 逻辑错误（视觉效果） |
| **严重度** | 🟡 中 |
| **现象** | 球体边缘同时存在强高光和 Fresnel rim light，叠加后呈现不自然的白色/过曝"光晕环" |
| **根因** | Blinn-Phong specular 在边缘区域（N·V 接近 0）仍有较弱贡献，加上 Fresnel 边缘光，总亮度超出预期 |
| **解决方案** | 添加第二层柔和宽高光（`uSpecPower * 0.06` 低指数 + `* 0.08` 低强度），限制 Fresnel 软光晕仅占 `uFresnelStrength * 0.10` |
| **代码示例** | `waterSphereMaterial.ts` fragment shader L211-213, L233 |
| **解决日期** | 2026-06-17 |

### E005 — 有限差分数值不稳定（EPS 过小导致 NaN）

| 属性 | 说明 |
|------|------|
| **分类** | Shader 错误 |
| **严重度** | 🔴 阻塞 |
| **现象** | 球体渲染为全黑/全透明，法线计算出错导致光照异常 |
| **根因** | 有限差分采样间距 EPS 过小（< 0.001）时，相邻顶点的位移差可能被浮点精度吞没，`gradU/0` 产生 Inf → normalize 后变 NaN |
| **解决方案** | EPS 设为 `0.015`，确保在 sphere radius≈1.45 时位移梯度有足够的数值精度 |
| **代码示例** | `waterSphereMaterial.ts` vertex shader `const float EPS = 0.015;` |
| **解决日期** | 2026-06-17 |

### E006 — 帧循环中每帧创建新对象导致 GC 压力

| 属性 | 说明 |
|------|------|
| **分类** | 性能问题 |
| **严重度** | 🟡 中（短期 OK，长期风险） |
| **现象** | 运行一段时间后出现周期性卡顿（GC pause），帧时间从 16ms 跃升至 50-100ms |
| **根因** | 在 `useFrame` 中每帧创建 `new THREE.Vector3()` 等临时对象，触发 V8 GC |
| **解决方案** | 在组件外部预分配可复用的 `THREE.Vector3`/`THREE.Color` 对象，或使用 ref 存储临时变量。关键原则：**useFrame 热路径中零堆分配** |
| **代码示例** | ```typescript
// ❌ 错误：每帧创建新对象
useFrame(() => {
  const temp = new THREE.Vector3(a, b, c)
  mesh.position.copy(temp)
})

// ✅ 正确：复用预分配对象
const _temp = useRef(new THREE.Vector3())
useFrame(() => {
  _temp.current.set(a, b, c)
  mesh.position.copy(_temp.current)
})
``` |
| **解决日期** | 2026-06-18（在 InkBlobFlow 物理引擎中应用） |

### E007 — 透明混合导致墨团重叠处半透明穿透

| 属性 | 说明 |
|------|------|
| **分类** | 逻辑错误（视觉效果） |
| **严重度** | 🔴 视觉缺陷 |
| **现象** | 多个墨团重叠区域出现半透明叠加，一眼能看出是多个独立球体而非一个整体墨块 |
| **根因** | ShaderMaterial 使用 `transparent: true, depthWrite: false`，alpha blending 在重叠像素处累积透明度，且深度缓冲未写入导致无法用 z-buffer 遮挡 |
| **解决方案** | 墨团改为 `transparent: false, depthWrite: true` 不透明渲染。真实墨水在水中的墨团本身就接近不透明。z-buffer 自然处理重叠遮挡，配合镜面高光形成统一的墨块视觉 |
| **代码示例** | `InkBlobFlow.tsx` `createOpaqueBlobMaterial()` — fragment shader 输出 `gl_FragColor = vec4(color, 1.0)` |
| **解决日期** | 2026-06-18 |

### E008 — 墨团间无液体变形导致缺乏"流动/挤压/汇聚"感

| 属性 | 说明 |
|------|------|
| **分类** | 逻辑错误（视觉效果） |
| **严重度** | 🟡 中等 |
| **现象** | 墨团相互靠近时仍是刚性球体，无拉伸/液桥/挤压变形，感受不到液体特征 |
| **根因** | 物理引擎只更新位置，mesh 使用均匀缩放 `scale.setScalar()`，未考虑墨团间的形变交互 |
| **解决方案** | ① 添加表面张力力场（高斯型中距离吸引力）② 检测最近邻距离 → 计算拉伸/挤压量 ③ 使用非均匀缩放 `scale.set(sx, sy, sz)` + `quaternion` 旋转，沿最近邻方向伸长、垂直方向压扁 ④ smoothstep 过渡避免突变 |
| **代码示例** | `InkBlobFlow.tsx` 阶段B（邻近变形计算）+ 阶段C（非均匀缩放应用） |
| **解决日期** | 2026-06-18 |

### E009 — 墨团仅为固定数量刚性球，无合并/分裂感

| 属性 | 说明 |
|------|------|
| **分类** | 逻辑错误（视觉效果） |
| **严重度** | 🔴 视觉缺陷 |
| **现象** | 墨团始终保持固定数量移动，没有互相吸引挤压后汇聚为一滴的液体合并动画，也没有运动中分离出小墨团的分裂动画 |
| **根因** | 物理引擎仅维护固定 `count` 个活跃墨团的状态，无合并/分裂逻辑，无体积守恒，无液桥渲染 |
| **解决方案** | ① 添加 `active` 标记控制墨团显隐 ② 合并检测：两个墨团距离 < 合并阈值时，较大的吸收较小的 — 吸收方半径膨胀、被吸收方向其滑动缩小 ③ 液桥渲染：合并期间在两墨团间渲染拉伸球体作连接颈 ④ 分裂检测：大墨团高速运动时，概率性地从未活跃池中复活子墨团并从父边缘弹出 ⑤ 体积守恒：合并/分裂时按体积立方根计算新半径 ⑥ 重生系统：被吸收墨团在延迟后复活 |
| **代码示例** | `InkBlobFlow.tsx` 阶段2（合并检测+动画）、阶段3（分裂检测）、阶段5（液桥Mesh） |
| **解决日期** | 2026-06-18 |

---

## V2 已知设计风险（非 Bug，待后续解决）

### R001 — 纹理皱纹感（拟人化老化）

| 属性 | 说明 |
|------|------|
| **分类** | 架构问题 |
| **严重度** | 🔴 设计问题 |
| **来源** | 实现计划 §已知风险-1 |
| **现象** | 3 层正弦波均匀覆盖球体全表面 + 持续振荡 → 密布小凸起 → 视觉上类似皮肤皱纹/老化 |
| **根因** | 形变覆盖率 100%（每顶点每帧都在进出）+ wave3 空间频率 6~8 周期/球面 + 2.6Hz 高频 |
| **方向** | ① 形变覆盖率从 100% 降至 20~30% ② 给形变加"发生→消退"生命周期 ③ 降 wave2/wave3 幅度至 0.2~0.3× |
| **状态** | ⬜ 待解决 |

### R002 — 表情识别干扰

| 属性 | 说明 |
|------|------|
| **分类** | 架构问题 |
| **严重度** | 🔴 架构问题 |
| **来源** | 实现计划 §已知风险-2 |
| **现象** | shader 顶点位移让眼睛位置不可预测微移、圆形变椭圆、眨眼逻辑无法叠加 |
| **根因** | 形变作用在底层几何，面部区域没有做区域排斥 |
| **方向** | ① 基础球体保持静止或仅极慢宏观呼吸 ② 液体感迁移至叠加的粒子/纹理层 ③ vertex shader 中对面部区域做形变遮蔽 |
| **状态** | ⬜ 待解决 |

### R003 — 累计性能瓶颈

| 属性 | 说明 |
|------|------|
| **分类** | 架构问题 |
| **严重度** | 🟡 当前 OK，未来风险 |
| **来源** | 实现计划 §已知风险-3 |
| **当前开销** | SphereGeometry(64,64) ≈ 4097 顶点，每帧 ~12291 次 computeDisplacement + ~98328 次三角函数 |
| **叠加后预估** | P1 墨丝 + P2 墨团流动 + P5 气泡 → 可能跌破 45fps |
| **方向** | ① 几何体降采样（64→48）② vertex shader 去有限差分 ③ 降频至桌宠节奏 |
| **状态** | ⬜ 待监控 |

---

## 通用开发规范错误

### G001 — 数组 ref 初始化不当导致 `null` 引用崩溃

| 属性 | 说明 |
|------|------|
| **分类** | 运行时错误 |
| **严重度** | 🔴 阻塞 |
| **现象** | `microRefs.current[i]` 返回 `undefined` 或 `null`，`TypeError: Cannot read properties of null` |
| **根因** | 未预初始化 ref 数组长度，或 R3F ref callback 异步设置导致首次 `useFrame` 时 ref 尚未就绪 |
| **解决方案** | 使用 `useRef<(THREE.Mesh | null)[]>(new Array(N).fill(null))` 预分配，并在每次访问前进行 null 检查 |
| **代码示例** | `InkBlob.tsx` L124 和 L159 的 `if (!ref) continue` |
| **解决日期** | 2026-06-17 |

### G002 — 组件依赖数组遗漏导致 stale closure

| 属性 | 说明 |
|------|------|
| **分类** | 逻辑错误 |
| **严重度** | 🟡 中 |
| **现象** | `useFrame` 或 `useMemo` 闭包捕获了过期的 params 值，调节参数无效 |
| **根因** | `useFrame` 的依赖捕获机制：如果 params 通过 props 传入但没有放入依赖数组，闭包中将始终使用初始值 |
| **解决方案** | 在 `useFrame` 中**直接通过 props/ref 读取最新值**，不依赖闭包捕获。或使用 `useRef` 存储 params 引用并在 useFrame 中读取 |
| **代码示例** | `WaterSphere.tsx` L90 — 在 useFrame 内直接使用 `params.xxx` 而非闭包捕获 |
| **解决日期** | 2026-06-17 |

### G003 — ESLint/TypeScript 检查通过但运行时行为异常

| 属性 | 说明 |
|------|------|
| **分类** | 逻辑错误 |
| **严重度** | 🟡 中 |
| **现象** | `npm run typecheck` 和 `npm run lint` 均通过，但实际渲染效果不符合预期 |
| **常见原因** | ① GLSL shader 中语法错误（TS 不检查 .glsl 或模板字符串内的 GLSL）② Three.js API 使用错误（如 depthWrite 设置不当导致透明渲染顺序错乱）③ 数值范围映射错误（如 slider 0-1 映射到 shader 30-350 时公式错误） |
| **预防** | 每次修改 shader 或渲染参数后，在 V2Preview 页面目视确认效果 |
| **解决日期** | — |

---

## 提交前检查清单

每次修改完成后，必须通过以下检查：

- [ ] `npm run typecheck` — 0 错误
- [ ] `npm run lint` — 0 错误
- [ ] V2Preview 页面效果目视确认
- [ ] 未修改 V1 组件（V1/V2 隔离铁律）
- [ ] 所有注释和文档使用中文
- [ ] 新错误已记录到本文档

---

*文档结束*
