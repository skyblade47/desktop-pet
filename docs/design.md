# 桌面宠物 - 灵感助手设计文档

> 最后更新: 2026-06-17 — 明确 V1 保留、V2 独立动画研发与未来双形态对接策略

---

## 1. 项目概述

桌面宠物是一个轻量级 Electron 应用，用于在不方便打开写作教练和灵感调酒师时，快速记录和完善灵感，并通过本地 HTTP API 单向同步到灵感调酒师和写作教练。

### 1.1 当前版本策略

| 版本 | 定位 | 状态 |
|------|------|------|
| V1 桌宠 | 当前稳定的独立桌宠与灵感助手 | 保留，继续可用 |
| V2 桌宠 | 水墨水滴球动画形象与未来共享动画核心 | 独立打磨，不立即替换 V1 |

V2 在视觉效果成熟前，不替代 V1、不接入现有生产入口、不影响现有灵感记录和同步流程。

### 1.2 V2 双形态目标

| 场景 | 目标 |
|------|------|
| 独立桌宠应用 | 作为电脑端灵感收集平台，支持快速记录、AI 辅助整理、同步 |
| AI 写作教练主应用 | 作为部分 AI 功能入口，承载建议提示、状态反馈和轻量交互 |

V2 第一阶段只做动画核心，功能对接在动画形象成熟后再设计。

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

- **Three.js** - WebGL 场景、材质、光照、粒子
- **React Three Fiber** - React 中组织 Three.js 场景
- **GLSL Shader** - 水滴折射、Fresnel 边缘、水墨噪声、流动纹理
- **噪声函数** - 罗夏随机、墨团边缘扰动、墨迹循环

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
│       │   └── SettingsPanel.tsx
│       ├── hooks/
│       │   ├── useChat.ts
│       │   └── useLocalModel.ts
│       ├── store/
│       │   └── useStore.ts
│       └── types/
│           └── index.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── electron-builder.json
```

V2 具体代码目录在实现前另行设计，原则是隔离 V1，避免未成熟动画影响当前桌宠。

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

V2 先作为视觉动画核心独立实现，按以下阶段推进：

1. 水滴球体；
2. 基础水墨墨迹；
3. 墨团；
4. 墨团流动；
5. 罗夏随机；
6. 墨迹流动循环；
7. 双眼设计；
8. 内外墨流联动；
9. 呼吸动画；
10. 交互系统；
11. 情绪表情。

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

### 5.3 V2 未来对接流程

```text
V2 动画核心成熟 → 用户确认 → 独立桌宠功能对接 → 主应用 AI 入口对接 → 评估替换 V1
```

---

## 6. UI 设计原则

- 简洁轻量，不干扰主工作区；
- 深色主题，护眼友好；
- 流畅动画，提升交互体验；
- 与写作教练保持一致的视觉风格；
- V2 未成熟前不破坏 V1 稳定体验；
- V2 视觉研发遵循“一次只完成一个效果”的阶段验收方式。
