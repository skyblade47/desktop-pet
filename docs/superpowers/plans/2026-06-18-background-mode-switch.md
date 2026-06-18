# 背景模式切换 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 V2 预览控制面板中增加深色/浅色/原木色三种背景模式切换，3D 画布和页面背景联动变化。

**Architecture:** 在 `V2StageParams` 上增加 `BackgroundMode` 联合类型，`V2PetStage` 读取该字段映射画布 div 背景色，`StageControls` 渲染三个模式切换按钮，`V2Preview` 将当前模式作为 CSS class 注入页面容器，CSS 文件新增浅色/原木色页面样式和按钮样式。

**Tech Stack:** React 18 + TypeScript + CSS

---

## 文件总览

| 文件 | 操作 |
|------|------|
| `src/renderer/components/pet-v2/types.ts` | 修改 — 新增 `BackgroundMode`，`V2StageParams` 加字段 |
| `src/renderer/components/pet-v2/V2PetStage.tsx` | 修改 — 根据 `backgroundMode` 计算画布背景色 |
| `src/renderer/components/pet-v2/StageControls.tsx` | 修改 — 新增模式切换按钮组 |
| `src/renderer/pages/V2Preview.tsx` | 修改 — 页面容器注入 `backgroundMode` class |
| `preview/index.css` | 修改 — 新增按钮样式 + light/wood 页面样式 |
| `src/renderer/index.css` | 修改 — 同步 preview/index.css 的新增样式 |

---

## Task 1: 扩展类型定义

**Files:**
- Modify: `src/renderer/components/pet-v2/types.ts`

- [ ] **Step 1: 新增 BackgroundMode 类型并更新 V2StageParams**

在 `WaterSphereParams` 上方新增 `BackgroundMode` 类型：

```typescript
export type BackgroundMode = 'dark' | 'light' | 'wood'
```

修改 `V2StageParams` 接口，增加 `backgroundMode` 字段：

```typescript
export interface V2StageParams {
  backgroundMode: BackgroundMode
  backgroundIntensity: number
  sphere: WaterSphereParams
}
```

修改 `DEFAULT_V2_STAGE_PARAMS` 常量确保默认深色模式：

```typescript
export const DEFAULT_V2_STAGE_PARAMS: V2StageParams = {
  backgroundMode: 'dark',
  backgroundIntensity: 0.15,
  sphere: DEFAULT_WATER_SPHERE_PARAMS,
}
```

**完整改动后 types.ts 应为：**

```typescript
export interface WaterSphereParams {
  radius: number
  transparency: number
  fresnelStrength: number
  highlightStrength: number
  refractionStrength: number
  inkDensity: number
  inkSpread: number
  backlightStrength: number
  breathEnabled: boolean
}

export type BackgroundMode = 'dark' | 'light' | 'wood'

export interface V2StageParams {
  backgroundMode: BackgroundMode
  backgroundIntensity: number
  sphere: WaterSphereParams
}

export const DEFAULT_WATER_SPHERE_PARAMS: WaterSphereParams = {
  radius: 1.45,
  transparency: 0.42,
  fresnelStrength: 0.65,
  highlightStrength: 0.75,
  refractionStrength: 0.55,
  inkDensity: 0.7,
  inkSpread: 0.55,
  backlightStrength: 0.48,
  breathEnabled: false,
}

export const DEFAULT_V2_STAGE_PARAMS: V2StageParams = {
  backgroundMode: 'dark',
  backgroundIntensity: 0.15,
  sphere: DEFAULT_WATER_SPHERE_PARAMS,
}
```

- [ ] **Step 2: 运行类型检查**

```bash
npm run typecheck
```

Expected: 0 TypeScript errors。注意此时改了 `V2StageParams` 签名，引用它的组件尚未同步，预期会有类型错误——继续后续 Task 修复。

---

## Task 2: V2PetStage 根据 backgroundMode 切换画布背景

**Files:**
- Modify: `src/renderer/components/pet-v2/V2PetStage.tsx:11-13`

- [ ] **Step 1: 将硬编码背景色改为根据 backgroundMode 查找**

将当前第 12 行：

```typescript
const background = `rgba(4, 8, 14, ${params.backgroundIntensity})`
```

替换为：

```typescript
import type { BackgroundMode } from './types'

const backgroundColors: Record<BackgroundMode, string> = {
  dark: `rgba(4, 8, 14, ${params.backgroundIntensity})`,
  light: `rgba(240, 240, 240, ${params.backgroundIntensity})`,
  wood: `rgba(232, 220, 200, ${params.backgroundIntensity})`,
}

const background = backgroundColors[params.backgroundMode]
```

**完整改动后 V2PetStage.tsx 前 15 行应为：**

```typescript
import React from 'react'
import { Canvas } from '@react-three/fiber'
import WaterSphere from './WaterSphere'
import type { V2StageParams, BackgroundMode } from './types'
import * as THREE from 'three'

interface V2PetStageProps {
  params: V2StageParams
}

const V2PetStage: React.FC<V2PetStageProps> = ({ params }) => {
  const backgroundColors: Record<BackgroundMode, string> = {
    dark: `rgba(4, 8, 14, ${params.backgroundIntensity})`,
    light: `rgba(240, 240, 240, ${params.backgroundIntensity})`,
    wood: `rgba(232, 220, 200, ${params.backgroundIntensity})`,
  }

  const background = backgroundColors[params.backgroundMode]

  return (
    // ... 其余不变
```

其余 Canvas / 灯光 / WaterSphere 部分不做任何修改。

---

## Task 3: StageControls 增加背景模式切换按钮

**Files:**
- Modify: `src/renderer/components/pet-v2/StageControls.tsx`

- [ ] **Step 1: 在"背景明暗"滑块上方插入模式切换按钮组**

在 `<label>背景明暗</label>`（第 112 行）之前插入以下 JSX：

```tsx
<div className="v2-stage-controls__mode-switch">
  <span>背景模式</span>
  <div className="v2-stage-controls__mode-buttons">
    <button
      type="button"
      className={params.backgroundMode === 'dark' ? 'is-active' : ''}
      onClick={() => onChange({ ...params, backgroundMode: 'dark' })}
    >
      深色
    </button>
    <button
      type="button"
      className={params.backgroundMode === 'light' ? 'is-active' : ''}
      onClick={() => onChange({ ...params, backgroundMode: 'light' })}
    >
      浅色
    </button>
    <button
      type="button"
      className={params.backgroundMode === 'wood' ? 'is-active' : ''}
      onClick={() => onChange({ ...params, backgroundMode: 'wood' })}
    >
      原木色
    </button>
  </div>
</div>
```

按钮直接放在 `<label>背景明暗</label>` 之前，保持当前其他所有滑块不变。

---

## Task 4: V2Preview 页面容器注入 backgroundMode class

**Files:**
- Modify: `src/renderer/pages/V2Preview.tsx:9-11`

- [ ] **Step 1: `<main>` 元素增加动态 class**

将 `<main className="v2-preview-page">` 改为挂载 `params.backgroundMode` 对应的 modifier class：

```tsx
<main className={`v2-preview-page v2-preview-page--${params.backgroundMode}`}>
```

**完整改动后 V2Preview.tsx：**

```tsx
import React, { useState } from 'react'
import StageControls from '../components/pet-v2/StageControls'
import V2PetStage from '../components/pet-v2/V2PetStage'
import { DEFAULT_V2_STAGE_PARAMS, type V2StageParams } from '../components/pet-v2/types'

const V2Preview: React.FC = () => {
  const [params, setParams] = useState<V2StageParams>(DEFAULT_V2_STAGE_PARAMS)

  return (
    <main className={`v2-preview-page v2-preview-page--${params.backgroundMode}`}>
      <section className="v2-preview-hero">
        <div>
          <p className="v2-preview-kicker">Desktop Pet V2 Preview</p>
          <h1>水滴球体阶段</h1>
          <p>
            当前只验证透明水滴球体。V1 桌宠保持不变，墨迹、眼睛、交互和业务功能均未接入。
          </p>
        </div>
      </section>

      <section className="v2-preview-workbench">
        <V2PetStage params={params} />
        <StageControls params={params} onChange={setParams} />
      </section>
    </main>
  )
}

export default V2Preview
```

---

## Task 5: 新增 CSS 样式

**Files:**
- Modify: `preview/index.css` — 在文件末尾追加新样式
- Modify: `src/renderer/index.css` — 在文件末尾追加相同样式

两个 CSS 文件的 V2 样式目前完全相同，本次追加的样式也完全相同。

- [ ] **Step 1: 在 preview/index.css 末尾追加**

追加内容：

```css
/* ============================================================
 * 背景模式切换按钮
 * ============================================================ */

.v2-stage-controls__mode-switch {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.v2-stage-controls__mode-switch > span {
  color: rgba(232, 247, 255, 0.82);
  font-size: 13px;
}

.v2-stage-controls__mode-buttons {
  display: flex;
  gap: 6px;
}

.v2-stage-controls__mode-buttons button {
  flex: 1;
  padding: 6px 4px;
  color: rgba(232, 247, 255, 0.62);
  font-size: 12px;
  border: 1px solid rgba(170, 236, 255, 0.14);
  border-radius: 10px;
  background: rgba(143, 231, 255, 0.06);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.v2-stage-controls__mode-buttons button:hover {
  background: rgba(143, 231, 255, 0.14);
  color: rgba(232, 247, 255, 0.92);
}

.v2-stage-controls__mode-buttons button.is-active {
  color: #08111c;
  border-color: #7fe7ff;
  background: #7fe7ff;
  font-weight: 600;
}

/* ============================================================
 * 浅色 / 原木色页面级样式
 * ============================================================ */

.v2-preview-page--light {
  color: #2a2a2a;
  background:
    radial-gradient(circle at 50% 35%, rgba(180, 180, 180, 0.12), transparent 34%),
    linear-gradient(135deg, #fafafa 0%, #e8e8e8 48%, #f5f5f5 100%);
}

.v2-preview-page--light .v2-preview-kicker {
  color: #5a7a8a;
}

.v2-preview-page--light .v2-preview-hero h1 {
  color: #1a1a1a;
}

.v2-preview-page--light .v2-preview-hero p {
  color: rgba(30, 30, 30, 0.72);
}

.v2-preview-page--light .v2-stage-controls {
  border-color: rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.v2-preview-page--light .v2-stage-controls__header span {
  color: #5a7a8a;
}

.v2-preview-page--light .v2-stage-controls__header strong {
  color: #1a1a1a;
}

.v2-preview-page--light .v2-stage-controls label {
  color: rgba(30, 30, 30, 0.82);
}

.v2-preview-page--light .v2-stage-controls__mode-switch > span {
  color: rgba(30, 30, 30, 0.82);
}

.v2-preview-page--light .v2-stage-controls__mode-buttons button {
  color: rgba(30, 30, 30, 0.62);
  border-color: rgba(0, 0, 0, 0.08);
  background: rgba(0, 0, 0, 0.04);
}

.v2-preview-page--light .v2-stage-controls__mode-buttons button:hover {
  background: rgba(0, 0, 0, 0.08);
  color: rgba(30, 30, 30, 0.92);
}

.v2-preview-page--light .v2-stage-controls__mode-buttons button.is-active {
  color: #ffffff;
  border-color: #4a7c9b;
  background: #4a7c9b;
}

.v2-preview-page--light .v2-stage-controls__note {
  color: rgba(30, 30, 30, 0.62);
  background: rgba(0, 0, 0, 0.05);
}

.v2-preview-page--light .v2-pet-stage {
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow:
    inset 0 0 80px rgba(0, 0, 0, 0.04),
    0 24px 80px rgba(0, 0, 0, 0.1);
}

.v2-preview-page--light .v2-pet-stage::before {
  background: radial-gradient(circle, rgba(0, 0, 0, 0.03), transparent 58%);
}

.v2-preview-page--light .v2-stage-controls__header {
  border-bottom-color: rgba(0, 0, 0, 0.08);
}

/* wood */

.v2-preview-page--wood {
  color: #3a2a18;
  background:
    radial-gradient(circle at 50% 35%, rgba(200, 180, 140, 0.18), transparent 34%),
    linear-gradient(135deg, #f5efe0 0%, #e0d4b8 48%, #efe8d4 100%);
}

.v2-preview-page--wood .v2-preview-kicker {
  color: #7a6040;
}

.v2-preview-page--wood .v2-preview-hero h1 {
  color: #2a1a08;
}

.v2-preview-page--wood .v2-preview-hero p {
  color: rgba(50, 35, 20, 0.72);
}

.v2-preview-page--wood .v2-stage-controls {
  border-color: rgba(120, 90, 50, 0.14);
  background: rgba(245, 239, 224, 0.78);
  box-shadow: 0 8px 32px rgba(80, 50, 20, 0.1);
}

.v2-preview-page--wood .v2-stage-controls__header span {
  color: #7a6040;
}

.v2-preview-page--wood .v2-stage-controls__header strong {
  color: #2a1a08;
}

.v2-preview-page--wood .v2-stage-controls label {
  color: rgba(50, 35, 20, 0.82);
}

.v2-preview-page--wood .v2-stage-controls__mode-switch > span {
  color: rgba(50, 35, 20, 0.82);
}

.v2-preview-page--wood .v2-stage-controls__mode-buttons button {
  color: rgba(50, 35, 20, 0.62);
  border-color: rgba(120, 90, 50, 0.12);
  background: rgba(120, 90, 50, 0.05);
}

.v2-preview-page--wood .v2-stage-controls__mode-buttons button:hover {
  background: rgba(120, 90, 50, 0.1);
  color: rgba(50, 35, 20, 0.92);
}

.v2-preview-page--wood .v2-stage-controls__mode-buttons button.is-active {
  color: #fffdf7;
  border-color: #8b7355;
  background: #8b7355;
}

.v2-preview-page--wood .v2-stage-controls__note {
  color: rgba(50, 35, 20, 0.62);
  background: rgba(120, 90, 50, 0.08);
}

.v2-preview-page--wood .v2-pet-stage {
  border-color: rgba(120, 90, 50, 0.12);
  box-shadow:
    inset 0 0 80px rgba(120, 90, 50, 0.04),
    0 24px 80px rgba(80, 50, 20, 0.12);
}

.v2-preview-page--wood .v2-pet-stage::before {
  background: radial-gradient(circle, rgba(255, 250, 240, 0.12), transparent 58%);
}

.v2-preview-page--wood .v2-stage-controls__header {
  border-bottom-color: rgba(120, 90, 50, 0.1);
}
```

- [ ] **Step 2: 将相同内容追加到 src/renderer/index.css 末尾**

确保两个 CSS 文件 styles 完全一致。

---

## Task 6: 完整检查

**Run all checks:**

- [ ] **Step 1: Prettier**

```bash
npx prettier --write src/
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: 0 errors

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: 0 errors

- [ ] **Step 4: 预览验证**

```bash
npx vite --config preview/vite.config.ts --host 127.0.0.1 --port 5175
```

打开 `http://127.0.0.1:5175/`，验证：
- 默认深色模式和当前完全一致
- 点击浅色按钮 → 页面背景变为浅灰白
- 点击原木色按钮 → 页面背景变为暖米色
- `背景明暗` 滑块在三种模式下均生效

---

## 任务依赖关系

```
Task 1 (types) ─┬─ Task 2 (V2PetStage)
                ├─ Task 3 (StageControls)
                └─ Task 4 (V2Preview)
Task 5 (CSS) — 独立，可与 2/3/4 并行
Task 6 (检查) — 依赖所有前序任务
```

---

## 风险与回滚

- **类型不兼容**：`V2StageParams` 新增必填字段 `backgroundMode`，所有创建该类型的代码已通过本 Plan 更新
- **CSS 样式冲突**：light/wood 样式通过 `.v2-preview-page--light` / `.v2-preview-page--wood` 限定，不影响深色模式默认样式
- **V1 不受影响**：所有修改仅限于 `pet-v2/` 和 `V2Preview` 相关文件，不涉及 V1 组件、App.tsx 或主项目业务代码
