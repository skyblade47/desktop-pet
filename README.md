# 桌面宠物 - 灵感助手

一个轻量级的 Electron 桌面应用，帮助你快速记录和完善灵感。

**当前版本：** v0.1.5

> 本版本保留 V1 桌宠稳定实现，并将 V2 Canvas 水墨球视觉拆分为可复用 `InkPet` 视觉内核。

## 功能特性

- 🎨 **浮动小部件** - 可在屏幕任意位置拖动的可爱小球
- 💬 **聊天式界面** - 支持与本地模型对话
- ✨ **灵感快速记录** - 一键保存灵感内容
- 🔄 **单向数据同步** - 桌宠 → 灵感调酒师 → 写作教练
- 🤖 **本地模型支持** - 支持 OpenAI 兼容的本地模型 API（如 Ollama, LM Studio）
- 🖤 **V2 水墨视觉预览** - 通过 `?preview=v2` 独立预览 Canvas 水墨球视觉内核

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

### V2 视觉预览

如果本地 Electron 二进制不可用，可以先启动 renderer 预览来检查视觉内核：

```bash
npx vite --host 127.0.0.1 --port 5174 src/renderer
```

然后访问：

```text
http://127.0.0.1:5174/?preview=v2
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

```text
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

```text
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
- `pet/InkPet.tsx` - V2 Canvas 水墨视觉组件
- `pet/PetWindow.tsx` - V2 视觉预览窗口包装组件

### Hooks 开发

自定义 Hook 位于 `src/renderer/hooks/` 目录：

- `useChat.ts` - 聊天逻辑
- `useLocalModel.ts` - 本地模型连接

### 状态管理

使用 Zustand 进行状态管理，Store 定义在 `src/renderer/store/useStore.ts`。

## V2 视觉路线

1. **v0.1.5 已完成**：拆分 `InkPet`、`ink-renderer`、`mood-config`、`types`，保持 `PetWindow` 为预览入口。
2. **下一阶段**：完善状态切换预览、尺寸/透明背景/质量档位验证、视觉参数调优。
3. **稳定后**：再考虑抽成共享包，供 desktop-pet 与 AI 写作教练共同复用。
4. **最后接业务**：仅通过外层适配器传入 `mood`，不让视觉内核直接依赖业务 store、IPC 或同步逻辑。

## License

MIT License
