# V2 预览背景模式切换设计规格

> 日期：2026-06-18
> 关联：`src/renderer/components/pet-v2/V2PetStage.tsx`、`StageControls.tsx`、`types.ts`

## 1. 背景

当前 V2 预览页面使用深色渐变背景（`#02050a → #08111c`），3D 画布内为 `rgba(4,8,14, backgroundIntensity)` 的深色半透明背景。深色背景下球体暗部细节难以辨认。

需增加背景模式切换，支持深色 / 浅色 / 原木色三种预设。

## 2. 目标

- 控制面板增加背景模式切换按钮
- 常驻 `backgroundIntensity` 滑块对三种模式均生效
- 页面 CSS 背景和 3D 画布 div 背景联动切换
- V1 桌宠不受影响

## 3. 非目标

- 不增加自定义取色器
- 不修改 Shader 或灯光
- 不修改 V2Preview 页面结构

## 4. 类型扩展

```typescript
export type BackgroundMode = 'dark' | 'light' | 'wood'

export interface V2StageParams {
  backgroundMode: BackgroundMode
  backgroundIntensity: number
  sphere: WaterSphereParams
}
```

默认值：

```typescript
export const DEFAULT_V2_STAGE_PARAMS: V2StageParams = {
  backgroundMode: 'dark',
  backgroundIntensity: 0.15,
  sphere: DEFAULT_WATER_SPHERE_PARAMS,
}
```

## 5. 三种预设色值

| 模式 | 画布背景色（前端取色） | 页面背景色 |
|------|----------------------|-----------|
| `dark` | `#04080e` | `#02050a → #08111c` |
| `light` | `#f0f0f0` | `#fafafa → #e8e8e8` |
| `wood` | `#e8dcc8` | `#f5efe0 → #e0d4b8` |

`backgroundIntensity` 作为透明度叠加：
- `backgroundIntensity = 0` → 背景色完全透明（显示页面底色）
- `backgroundIntensity = 1` → 背景色完全不透明

## 6. 组件改动

### 6.1 V2PetStage.tsx

接收 `backgroundMode`，映射到画布 div 的 `background` 样式：

```typescript
const backgroundColors: Record<BackgroundMode, string> = {
  dark: 'rgba(4, 8, 14, ${params.backgroundIntensity})',
  light: 'rgba(240, 240, 240, ${params.backgroundIntensity})',
  wood: 'rgba(232, 220, 200, ${params.backgroundIntensity})',
}
```

不做其他改动。

### 6.2 StageControls.tsx

在"背景明暗"滑块上方增加背景模式切换按钮组：

```tsx
<div className="v2-stage-controls__mode-switch">
  <span>背景模式</span>
  <div className="v2-stage-controls__mode-buttons">
    <button className={active}>深色</button>
    <button className={active}>浅色</button>
    <button className={active}>原木色</button>
  </div>
</div>
```

### 6.3 CSS

新增样式：

```css
.v2-stage-controls__mode-switch { /* 容器 */ }
.v2-stage-controls__mode-buttons { display: flex; gap: 6px; }
.v2-stage-controls__mode-buttons button { /* 按钮基础样式 */ }
.v2-stage-controls__mode-buttons button.is-active { /* 激活态 */ }
```

浅色和原木色模式下的页面级 CSS 背景样式切换（通过给页面容器加 class，如 `.v2-preview-page--light`、`.v2-preview-page--wood`）：

- light 页面：浅灰白背景，文字色反转为深色
- wood 页面：暖米色背景，文字色改为深棕色（`#4a3820`）

## 7. 文件变更清单

| 文件 | 操作 |
|------|------|
| `src/renderer/components/pet-v2/types.ts` | 新增 `BackgroundMode` 类型，`V2StageParams` 增加 `backgroundMode` |
| `src/renderer/components/pet-v2/V2PetStage.tsx` | 根据 `backgroundMode` 切换画布 div 背景色 |
| `src/renderer/components/pet-v2/StageControls.tsx` | 新增背景模式切换按钮组 |
| `src/renderer/pages/V2Preview.tsx` | 根据 `backgroundMode` 给页面容器加 class |
| `preview/index.css` | 新增浅色/原木色页面级样式 + 按钮样式 |

## 8. 成功标准

- [ ] 默认进入深色模式，行为和视觉与当前完全一致
- [ ] 点击浅色按钮后球体在浅灰白背景下清晰可见
- [ ] 点击原木色按钮后球体在暖米色背景下清晰可见，风格对齐主项目木板色系
- [ ] `backgroundIntensity` 滑块在三种模式下均生效
- [ ] V1 桌宠不受任何影响
