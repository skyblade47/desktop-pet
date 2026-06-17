# 桌面宠物 - 灵感助手

一个轻量级的 Electron 桌面应用，帮助你快速记录和完善灵感。

**当前版本：** v0.1.3

> 本版本保留 V1 桌宠稳定实现，并为后续 V2 水墨水滴球动画研发清理类型检查阻塞。

## 功能特性

- 🎨 **浮动小部件** - 可在屏幕任意位置拖动的可爱小球
- 💬 **聊天式界面** - 支持与本地模型对话
- ✨ **灵感快速记录** - 一键保存灵感内容
- 🔄 **单向数据同步** - 桌宠 → 灵感调酒师 → 写作教练
- 🤖 **本地模型支持** - 支持 OpenAI 兼容的本地模型 API（如 Ollama, LM Studio）

## 技术栈

- **Electron** - 桌面应用框架
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Zustand** - 状态管理
- **Framer Motion** - 动画效果
- **Lucide React** - 图标库

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建应用

```bash
npm run build
npm run dist
```

## 配置

首次使用请右键点击小部件，打开设置：

- **API 地址**: 本地模型 API 地址（默认 Ollama: `http://localhost:11434/v1`）
- **API Key**: API 密钥（Ollama 默认为 `ollama`）
- **模型名称**: 使用的模型名称
- **灵感调酒师 API 地址**: 用于同步灵感的服务地址

## 项目结构

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
│       ├── hooks/
│       ├── store/
│       └── types/
├── docs/
│   ├── design.md          # 设计文档
│   └── SPEC.md            # 项目规范
├── package.json
└── README.md
```

## 数据同步流程

```
用户输入灵感
    ↓
保存到本地
    ↓
与本地模型对话完善灵感（可选）
    ↓
点击"保存灵感"
    ↓
HTTP POST 到灵感调酒师 API
    ↓
灵感调酒师同步到写作教练
```

## 开发说明

### TypeScript 类型

所有类型定义都在 `src/renderer/types/index.ts` 中定义，包括：

- `Inspiration` - 灵感数据结构
- `Message` - 消息数据结构
- `AppConfig` - 应用配置
- 各种状态和 Props 类型

### 组件开发

组件位于 `src/renderer/components/` 目录：

- `FloatingWidget.tsx` - 浮动小部件
- `ChatWindow.tsx` - 聊天窗口
- `MessageBubble.tsx` - 消息气泡
- `SettingsPanel.tsx` - 设置面板

### Hooks 开发

自定义 Hook 位于 `src/renderer/hooks/` 目录：

- `useChat.ts` - 聊天逻辑
- `useLocalModel.ts` - 本地模型连接

### 状态管理

使用 Zustand 进行状态管理，Store 定义在 `src/renderer/store/useStore.ts`。

## License

MIT License
