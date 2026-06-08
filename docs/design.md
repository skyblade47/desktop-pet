# 桌面宠物 - 灵感助手 设计文档

## 1. 项目概述

桌面宠物是一个轻量级的 Electron 应用，用于在不方便打开写作教练和灵感调酒师时，快速记录和完善灵感，并通过本地 HTTP API 单向同步到灵感调酒师和写作教练。

### 1.1 核心特性
- 浮动小部件，可在屏幕任意位置拖动
- 聊天式界面，支持与本地模型对话
- 灵感快速记录和完善功能
- 单向数据同步（桌宠 → 灵感调酒师 → 写作教练）
- OpenAI 兼容本地模型支持

## 2. 技术架构

### 2.1 技术栈
- **Electron** - 桌面应用框架
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Zustand** - 状态管理
- **Framer Motion** - 动画效果
- **Lucide React** - 图标库

### 2.2 项目结构
```
desktop-pet/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── main.ts        # 主入口
│   │   ├── ipc.ts         # IPC 通信
│   │   ├── tray.ts        # 托盘管理
│   │   └── sync.ts        # 同步服务
│   ├── preload/           # 预加载脚本
│   │   └── preload.ts
│   └── renderer/          # React 渲染进程
│       ├── App.tsx
│       ├── components/
│       │   ├── FloatingWidget.tsx    # 浮动小部件
│       │   ├── ChatWindow.tsx        # 聊天窗口
│       │   ├── MessageBubble.tsx     # 消息气泡
│       │   └── SettingsPanel.tsx     # 设置面板
│       ├── hooks/
│       │   ├── useChat.ts
│       │   └── useLocalModel.ts
│       ├── store/
│       │   └── useStore.ts           # Zustand 状态管理
│       └── types/
│           └── index.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── electron-builder.json
```

## 3. 核心数据结构

### 3.1 灵感数据结构
```typescript
interface Inspiration {
  id: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'completed' | 'synced';
}
```

### 3.2 消息数据结构
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
```

### 3.3 应用配置结构
```typescript
interface AppConfig {
  modelApi: {
    baseUrl: string;
    apiKey: string;
    modelName: string;
  };
  syncApi: {
    inspirationBartenderUrl: string;
  };
}
```

## 4. 功能模块设计

### 4.1 浮动小部件 (FloatingWidget)
- 圆形/方形小部件，可在屏幕任意位置拖动
- 点击展开聊天窗口，点击外部收起
- 右键菜单：设置、退出、同步
- 呼吸动画效果提示新消息

### 4.2 聊天窗口 (ChatWindow)
- 对话输入框（支持 Enter 发送）
- AI 回复气泡（支持流式输出）
- 快捷操作按钮（记录灵感、完善灵感、标签管理）
- 历史记录查看

### 4.3 本地模型连接
- OpenAI 兼容 API 配置界面
- 支持模型选择和连接测试
- 连接状态实时显示

### 4.4 数据同步
- HTTP 客户端，单向推送灵感至灵感调酒师
- 同步状态管理和失败重试机制
- 批量同步和增量同步

## 5. 数据流设计

### 5.1 灵感记录流程
```
用户输入 → 保存本地 → 可选 AI 完善 → 同步到灵感调酒师 → 灵感调酒师同步到写作教练
```

### 5.2 聊天对话流程
```
用户消息 → 本地模型 API → 流式响应 → 渲染气泡 → 可选保存为灵感
```

## 6. UI 设计原则
- 简洁轻量，不干扰主工作区
- 深色主题，护眼友好
- 流畅动画，提升交互体验
- 与写作教练保持一致的视觉风格
