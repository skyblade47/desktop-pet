# 桌面宠物 - 灵感助手设计文档

> 最后更新: 2026-06-18 — 明确 V2 Canvas 水墨视觉内核拆分、预览入口与后续共享路线

---

## 1. 项目概述

桌面宠物是一个轻量级 Electron 应用，用于在不方便打开写作教练和灵感调酒师时，快速记录和完善灵感，并通过本地 HTTP API 单向同步到灵感调酒师和写作教练。

### 1.1 当前版本策略

| 版本    | 定位                                    | 状态                    |
| ------- | --------------------------------------- | ----------------------- |
| V1 桌宠 | 当前稳定的独立桌宠与灵感助手            | 保留，继续可用          |
| V2 桌宠 | Canvas 水墨球视觉内核与未来共享动画核心 | 独立打磨，不立即替换 V1 |

V2 在视觉效果成熟前，不替代 V1、不接入现有生产入口、不影响现有灵感记录和同步流程。

### 1.2 V2 双形态目标

| 场景              | 目标                                                    |
| ----------------- | ------------------------------------------------------- |
| 独立桌宠应用      | 作为电脑端灵感收集平台，支持快速记录、AI 辅助整理、同步 |
| AI 写作教练主应用 | 作为部分 AI 功能入口，承载建议提示、状态反馈和轻量交互  |

V2 第一阶段只做视觉动画核心，功能对接在动画形象成熟后再设计。

### 1.3 核心特性

- 浮动小部件，可在屏幕任意位置拖动；
- 聊天式界面，支持与本地模型对话；
- 灵感快速记录和完善功能；
- 单向数据同步（桌宠 → 灵感调酒师 → 写作教练）；
- OpenAI 兼容本地模型支持；
- V1 保持稳定，V2 独立研发。

---

## 2. 技术架构

### 2.1 V1 技术栈

- **Electron** - 桌面应用框架
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Zustand** - 状态管理
- **Framer Motion** - 基础动画效果
- **Lucide React** - 图标库

### 2.2 V2 动画技术栈

当前阶段以 **Canvas 2D 水墨球视觉内核** 为主，优先完成可复用组件边界和视觉稳定性：

- **React 18** - 组织可复用视觉组件；
- **Canvas 2D** - 绘制水墨球体、内部墨流、墨丝轨迹、眼睛和高光；
- **TypeScript** - 固化 `mood`、`quality`、尺寸和渲染配置类型；
- **FPS 自适应降级** - 低帧率时减少墨丝数量，保证运行稳定。

Three.js / React Three Fiber / Shader 路线保留为未来可能的高阶视觉升级方向，不作为当前 v0.1.5 的实现验收口径。

### 2.3 项目结构

```text
desktop-pet/
├── src/
│   ├── main/
│   │   ├── main.ts
│   │   ├── ipc.ts
│   │   ├── tray.ts
│   │   └── sync.ts
│   ├── preload/
│   │   └── preload.ts
│   └── renderer/
│       ├── App.tsx
│       ├── components/
│       │   ├── FloatingWidget.tsx
│       │   ├── ChatWindow.tsx
│       │   ├── MessageBubble.tsx
│       │   ├── SettingsPanel.tsx
│       │   └── pet/
│       │       ├── InkPet.tsx
│       │       ├── PetWindow.tsx
│       │       ├── ink-renderer.ts
│       │       ├── ink-engine.ts
│       │       ├── mood-config.ts
│       │       ├── color-palette.ts
│       │       └── types.ts
│       ├── hooks/
│       │   ├── useChat.ts
│       │   └── useLocalModel.ts
│       ├── store/
│       │   └── useStore.ts
│       └── types/
│           └── index.ts
├── package.json
├── tsconfig.json
├── electron-vite.config.ts
└── electron-builder.json
```

V2 当前视觉内核位于 `src/renderer/components/pet/`，在视觉效果成熟前只通过 `?preview=v2` 进入，不替换 V1 生产入口。

---

## 3. 核心数据结构

### 3.1 灵感数据结构

```typescript
interface Inspiration {
  id: string
  content: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  status: 'draft' | 'completed' | 'synced'
}
```

### 3.2 消息数据结构

```typescript
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}
```

### 3.3 应用配置结构

```typescript
interface AppConfig {
  modelApi: {
    baseUrl: string
    apiKey: string
    modelName: string
  }
  syncApi: {
    inspirationBartenderUrl: string
  }
}
```

### 3.4 V2 视觉组件接口

```typescript
type PetMood = 'idle' | 'focused' | 'blocked' | 'achievement' | 'rest'

type InkPetQuality = 'auto' | 'high' | 'low'

interface InkPetProps {
  mood?: PetMood
  size?: number | string
  quality?: InkPetQuality
  className?: string
  style?: CSSProperties
  onClick?: () => void
}
```

---

## 4. 功能模块设计

### 4.1 V1 浮动小部件

- 圆形/方形小部件，可在屏幕任意位置拖动；
- 点击展开聊天窗口，点击外部收起；
- 右键菜单：设置、退出、同步；
- 呼吸动画效果提示新消息。

### 4.2 聊天窗口

- 对话输入框，支持 Enter 发送；
- AI 回复气泡，支持流式输出；
- 快捷操作按钮：记录灵感、完善灵感、标签管理；
- 历史记录查看。

### 4.3 本地模型连接

- OpenAI 兼容 API 配置界面；
- 支持模型选择和连接测试；
- 连接状态实时显示。

### 4.4 数据同步

- HTTP 客户端，单向推送灵感至灵感调酒师；
- 同步状态管理和失败重试机制；
- 批量同步和增量同步。

### 4.5 V2 动画核心

V2 先作为视觉动画核心独立实现，当前采用 Canvas 水墨球路线，按以下阶段推进：

1. **已完成**：水墨球体基础渲染、内部墨流、墨丝轨迹、双眼、高光和呼吸；
2. **已完成**：拆分 `InkPet` 视觉组件、渲染管线、mood 配置和公共类型；
3. **下一阶段**：增加独立视觉预览控制面板，用于切换 `idle / focused / blocked / achievement / rest`；
4. **下一阶段**：验证透明背景、不同尺寸、不同质量档位和长期运行性能；
5. **下一阶段**：调优墨流密度、墨丝轨迹、眼睛表情和状态过渡；
6. **稳定后**：评估是否抽成共享包，供 desktop-pet 与 AI 写作教练共同复用；
7. **最后接业务**：通过外层适配器把应用状态映射为 `mood`，视觉内核不直接依赖业务 store、IPC 或同步逻辑。

---

## 5. 数据流设计

### 5.1 灵感记录流程

```text
用户输入 → 保存本地 → 可选 AI 完善 → 同步到灵感调酒师 → 灵感调酒师同步到写作教练
```

### 5.2 聊天对话流程

```text
用户消息 → 本地模型 API → 流式响应 → 渲染气泡 → 可选保存为灵感
```

### 5.3 V2 视觉渲染流程

```text
外部 mood/size/quality props → InkPet → Canvas 动画循环 → ink-engine 更新墨丝 → ink-renderer 绘制画面
```

### 5.4 V2 未来对接流程

```text
V2 Canvas 视觉内核稳定 → 用户确认 → 抽取共享边界 → 独立桌宠适配 → AI 写作教练适配 → 评估是否替换 V1
```

---

## 6. UI 设计原则

- 简洁轻量，不干扰主工作区；
- 深色主题，护眼友好；
- 流畅动画，提升交互体验；
- 与写作教练保持一致的视觉风格；
- V2 未成熟前不破坏 V1 稳定体验；
- V2 视觉研发遵循“一次只完成一个效果”的阶段验收方式。
