# 桌面宠物 - 灵感助手 项目规范

> 本文档定义了项目的类型系统、API 接口、组件接口和配置规范，确保开发过程中的代码一致性。

## 目录

1. [TypeScript 类型定义](#1-typescript-类型定义)
2. [API 接口规范](#2-api-接口规范)
3. [组件接口规范](#3-组件接口规范)
4. [配置规范](#4-配置规范)
5. [状态管理规范](#5-状态管理规范)
6. [局域网同步规范](#6-局域网同步规范)
7. [命名规范](#7-命名规范)

---

## 1. TypeScript 类型定义

### 1.1 核心数据类型

#### Inspiration（灵感）

```typescript
/**
 * 灵感数据结构
 * 用于存储用户记录的灵感
 */
export interface Inspiration {
  /** 唯一标识符 */
  id: string
  /** 灵感内容 */
  content: string
  /** 标签列表 */
  tags: string[]
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
  /** 状态：草稿/已完成/已同步 */
  status: InspirationStatus
}

/** 灵感状态枚举 */
export type InspirationStatus = 'draft' | 'completed' | 'synced'
```

#### Message（消息）

```typescript
/**
 * 聊天消息数据结构
 */
export interface Message {
  /** 唯一标识符 */
  id: string
  /** 消息角色：用户/助手 */
  role: MessageRole
  /** 消息内容 */
  content: string
  /** 时间戳 */
  timestamp: Date
}

/** 消息角色枚举 */
export type MessageRole = 'user' | 'assistant' | 'system'
```

#### AppConfig（应用配置）

```typescript
/**
 * 应用配置数据结构
 */
export interface AppConfig {
  /** 本地模型 API 配置 */
  modelApi: ModelApiConfig
  /** 同步 API 配置 */
  syncApi: SyncApiConfig
}

/**
 * 本地模型 API 配置
 */
export interface ModelApiConfig {
  /** API 地址 */
  baseUrl: string
  /** API 密钥 */
  apiKey: string
  /** 模型名称 */
  modelName: string
}

/**
 * 同步 API 配置
 */
export interface SyncApiConfig {
  /** 灵感调酒师 API 地址 */
  inspirationBartenderUrl: string
}
```

### 1.2 同步相关类型

#### SyncInspiration（同步灵感）

```typescript
/**
 * 同步灵感数据结构（与灵感调酒师、AI写作教练一致）
 */
export interface SyncInspiration {
  id: string
  title?: string
  content: string
  tags: string[]
  source: 'desktop-pet' | 'inspiration-bartender' | 'writing-coach'
  sourceApp: string
  createdAt: string
  updatedAt: string
  syncStatus: 'local' | 'pending' | 'synced'
  syncHistory: Array<{
    to: string
    at: string
    success: boolean
  }>
  checksum: string
  original?: {
    chatHistory?: Array<{
      role: string
      content: string
      timestamp: string
    }>
    glassType?: string
    completion?: number
    rawInput?: any
  }
}

/**
 * 设备信息
 */
export interface SyncDevice {
  id: string
  name: string
  type: 'desktop-pet' | 'inspiration-bartender' | 'writing-coach'
  ip: string
  port: number
  lastSeen: string
  capabilities: {
    canReceive: boolean
    canSend: boolean
  }
  version: string
  url: string
}

/**
 * 同步配置
 */
export interface SyncConfig {
  enabled: boolean
  autoSync: boolean
  syncInterval: number
  deviceName: string
}
```

### 1.3 状态类型

#### ChatState（聊天状态）

```typescript
/**
 * 聊天状态
 */
export interface ChatState {
  /** 消息列表 */
  messages: Message[]
  /** 是否正在加载 */
  isLoading: boolean
  /** 添加消息 */
  addMessage: (message: Message) => void
  /** 清空消息 */
  clearMessages: () => void
  /** 设置加载状态 */
  setIsLoading: (loading: boolean) => void
}
```

#### ConfigState（配置状态）

```typescript
/**
 * 配置状态
 */
export interface ConfigState {
  /** 应用配置 */
  config: AppConfig
  /** 更新配置 */
  setConfig: (config: Partial<AppConfig>) => void
}
```

#### InspirationState（灵感状态）

```typescript
/**
 * 灵感状态
 */
export interface InspirationState {
  /** 灵感列表 */
  inspirations: Inspiration[]
  /** 添加灵感 */
  addInspiration: (inspiration: Inspiration) => void
  /** 更新灵感 */
  updateInspiration: (id: string, updates: Partial<Inspiration>) => void
  /** 删除灵感 */
  deleteInspiration: (id: string) => void
  /** 标记已同步 */
  markAsSynced: (id: string) => void
}
```

### 1.4 组件 Props 类型

#### FloatingWidgetProps

```typescript
/**
 * 浮动小部件属性
 */
export interface FloatingWidgetProps {
  /** 点击回调 */
  onClick: () => void
  /** 右键点击回调 */
  onRightClick: () => void
}
```

#### ChatWindowProps

```typescript
/**
 * 聊天窗口属性
 */
export interface ChatWindowProps {
  /** 关闭回调 */
  onClose: () => void
}
```

#### MessageBubbleProps

```typescript
/**
 * 消息气泡属性
 */
export interface MessageBubbleProps {
  /** 消息数据 */
  message: Message
}
```

#### SettingsPanelProps

```typescript
/**
 * 设置面板属性
 */
export interface SettingsPanelProps {
  /** 关闭回调 */
  onClose: () => void
}
```

### 1.5 Hook 返回类型

#### UseChatReturn

```typescript
/**
 * useChat Hook 返回值
 */
export interface UseChatReturn {
  /** 消息列表 */
  messages: Message[]
  /** 是否正在加载 */
  isLoading: boolean
  /** 流式输出内容 */
  streamingContent: string
  /** 发送消息 */
  sendMessage: (content: string) => Promise<void>
  /** 清空消息 */
  clearMessages: () => void
  /** 保存为灵感 */
  saveAsInspiration: (content: string, tags?: string[]) => Promise<Inspiration>
}
```

#### UseLocalModelReturn

```typescript
/**
 * 聊天消息格式
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/**
 * useLocalModel Hook 返回值
 */
export interface UseLocalModelReturn {
  /** 聊天方法 */
  chat: (
    messages: ChatMessage[],
    onStream?: (chunk: string) => void
  ) => Promise<string>
  /** 测试连接 */
  testConnection: () => Promise<boolean>
  /** 是否已连接 */
  isConnected: boolean
}
```

---

## 2. API 接口规范

### 2.1 本地模型 API（OpenAI 兼容）

#### 聊天完成接口

```
POST {baseUrl}/chat/completions
```

**请求头**

```typescript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer {apiKey}'
}
```

**请求体**

```typescript
{
  model: string,
  messages: ChatMessage[],
  stream?: boolean,
  temperature?: number,
  max_tokens?: number
}
```

**响应（非流式）**

```typescript
{
  id: string,
  object: 'chat.completion',
  created: number,
  model: string,
  choices: [{
    index: number,
    message: {
      role: 'assistant',
      content: string
    },
    finish_reason: 'stop' | 'length'
  }],
  usage: {
    prompt_tokens: number,
    completion_tokens: number,
    total_tokens: number
  }
}
```

#### 模型列表接口

```
GET {baseUrl}/models
```

**请求头**

```typescript
{
  'Authorization': 'Bearer {apiKey}'
}
```

### 2.2 同步 API（局域网）

#### 设备信息接口

```
GET /api/info
```

**响应**:
```json
{
  "device": {
    "id": "uuid",
    "name": "桌面宠物",
    "type": "desktop-pet",
    "version": "1.0.0"
  },
  "api": {
    "version": "1.0.0",
    "endpoints": ["/api/info", "/api/inspirations"]
  }
}
```

#### 获取灵感列表

```
GET /api/inspirations?since=2024-01-01T00:00:00Z
```

#### 推送灵感

```
POST /api/inspirations
Content-Type: application/json

{
  "inspirations": SyncInspiration[],
  "source": "desktop-pet"
}
```

### 2.3 IPC 接口（主进程与渲染进程）

| 接口名 | 用途 | 参数 | 返回值 |
|--------|------|------|--------|
| `ping` | 测试通信 | 无 | `'pong'` |
| `get-version` | 获取版本 | 无 | 版本号 |
| `sync-add-inspiration` | 添加灵感到同步队列 | `Inspiration` | `{ success: boolean, data?: SyncInspiration }` |
| `sync-trigger` | 手动触发同步 | 无 | `{ success: boolean }` |
| `sync-get-devices` | 获取已发现设备 | 无 | `{ success: boolean, devices: SyncDevice[] }` |
| `sync-get-queue` | 获取同步队列 | 无 | `{ success: boolean, queue: SyncInspiration[] }` |
| `sync-get-sent` | 获取已发送灵感 | 无 | `{ success: boolean, sent: SyncInspiration[] }` |
| `sync-set-interval` | 设置同步间隔 | `minutes: number` | `{ success: boolean }` |

---

## 3. 组件接口规范

### 3.1 FloatingWidget 组件

```typescript
import React from 'react'
import { FloatingWidgetProps } from '../types'

const FloatingWidget: React.FC<FloatingWidgetProps> = ({ onClick, onRightClick }) => {
  // 实现...
}

export default FloatingWidget
```

**功能要求**
- 可在屏幕任意位置拖动
- 左键点击：触发 onClick
- 右键点击：阻止默认菜单，触发 onRightClick
- 拖动时视觉反馈（放大效果）
- 悬停时轻微放大
- 呼吸动画效果

### 3.2 ChatWindow 组件

```typescript
import React from 'react'
import { ChatWindowProps } from '../types'

const ChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
  // 实现...
}

export default ChatWindow
```

**功能要求**
- 固定位置显示（右侧顶部）
- 标题栏：图标 + 标题 + 关闭按钮
- 消息列表区域：可滚动
- 快捷操作区：保存灵感按钮（带状态反馈）
- 输入区：文本框 + 发送按钮
- 支持 Enter 发送，Shift+Enter 换行
- 禁用状态：加载时输入框禁用
- 空状态提示

### 3.3 MessageBubble 组件

```typescript
import React from 'react'
import { MessageBubbleProps } from '../types'

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  // 实现...
}

export default MessageBubble
```

**功能要求**
- 用户消息：右侧显示，渐变背景
- 助手消息：左侧显示，深色背景
- 时间戳显示
- 最大宽度 80%
- 自动换行

### 3.4 SettingsPanel 组件

```typescript
import React from 'react'
import { SettingsPanelProps } from '../types'

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  // 实现...
}

export default SettingsPanel
```

**功能要求**
- 模态框显示
- 背景遮罩
- 表单字段：API 地址、API Key、模型名称、灵感调酒师地址
- 测试连接按钮
- 保存/取消按钮

---

## 4. 配置规范

### 4.1 默认配置

```typescript
export const defaultConfig: AppConfig = {
  modelApi: {
    baseUrl: 'http://localhost:11434/v1',
    apiKey: 'ollama',
    modelName: 'llama3.2',
  },
  syncApi: {
    inspirationBartenderUrl: 'http://localhost:3000',
  },
}
```

### 4.2 同步配置

```typescript
export const defaultSyncConfig: SyncConfig = {
  enabled: true,
  autoSync: true,
  syncInterval: 5,
  deviceName: '桌面宠物',
}
```

### 4.3 端口分配

| 应用 | 端口 | 角色 |
|------|------|------|
| 桌面宠物 | 3001 | 发送方 |
| 灵感调酒师 | 3002 | 中转方 |
| AI写作教练 | 3003 | 接收方 |

---

## 5. 状态管理规范

### 5.1 Zustand Store 结构

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useAppStore = create<ChatState & ConfigState & InspirationState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      clearMessages: () => set({ messages: [] }),
      setIsLoading: (loading) => set({ isLoading: loading }),

      config: defaultConfig,
      setConfig: (newConfig) =>
        set((state) => ({ config: { ...state.config, ...newConfig } })),

      inspirations: [],
      addInspiration: (inspiration) =>
        set((state) => ({ inspirations: [...state.inspirations, inspiration] })),
      updateInspiration: (id, updates) =>
        set((state) => ({
          inspirations: state.inspirations.map((i) =>
            i.id === id ? { ...i, ...updates } : i
          ),
        })),
      deleteInspiration: (id) =>
        set((state) => ({
          inspirations: state.inspirations.filter((i) => i.id !== id),
        })),
      markAsSynced: (id) =>
        set((state) => ({
          inspirations: state.inspirations.map((i) =>
            i.id === id ? { ...i, status: 'synced' } : i
          ),
        })),
    }),
    {
      name: 'desktop-pet-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
```

---

## 6. 局域网同步规范

### 6.1 同步方向

```
桌面宠物 (Desktop Pet) [端口: 3001]
    ↓ [单向]
灵感调酒师 (Inspiration Bartender) [端口: 3002]
    ↓ [单向]
AI写作教练 (AI Writing Coach) [端口: 3003]
```

### 6.2 设计原则

- **单向数据流**: 避免数据冲突，明确流向
- **局域网优先**: 无需云服务，本地网络即可同步
- **发现机制**: 使用 mDNS/Zeroconf 自动发现设备
- **数据完整性**: 校验和 + 增量同步
- **离线优先**: 优先本地存储，网络恢复后自动同步

### 6.3 服务发现

- **服务类型**: `_ai-writing-sync._tcp.local.`
- **TXT 记录**: `version`, `type`, `port`, `name`
- **发现流程**: 启动时广播自身服务 → 监听网络 → 保存设备列表 → 定期更新

### 6.4 同步流程

```typescript
// 1. 发现灵感调酒师设备
const devices = await discovery.getDevices('inspiration-bartender')

// 2. 获取待同步灵感
const pending = await getPendingInspirations()

// 3. 推送到灵感调酒师
for (const device of devices) {
  const result = await http.post(`${device.url}/api/inspirations`, {
    inspirations: pending,
    source: 'desktop-pet'
  })

  // 4. 标记为已同步
  if (result.success) {
    await markAsSynced(pending.map(i => i.id))
  }
}
```

### 6.5 冲突解决

- 以 `updatedAt` 时间戳最新为准
- 保留旧版本作为备份
- 自动重试 3 次，间隔递增

### 6.6 同步模块结构

```
src/main/sync/
├── types.ts         # 类型定义
├── discovery.ts     # 设备发现
├── protocol.ts      # 协议处理
├── server.ts        # HTTP服务器
├── syncManager.ts   # 同步管理器
└── index.ts         # 导出
```

---

## 7. 命名规范

### 7.1 文件命名

- React 组件：`PascalCase.tsx`（如 `ChatWindow.tsx`）
- TypeScript 类型：`camelCase.ts`（如 `types.ts`）
- 配置文件：`kebab-case.json`（如 `electron-builder.json`）
- 脚本文件：`kebab-case.js`（如 `start.js`）

### 7.2 变量命名

- 普通变量：`camelCase`（如 `inputValue`）
- 常量：`UPPER_SNAKE_CASE`（如 `DEFAULT_PORT`）
- 类型/接口：`PascalCase`（如 `Inspiration`）
- 枚举值：`camelCase`（如 `InspirationStatus`）

### 7.3 事件处理函数

- 点击事件：`handle` 前缀（如 `handleSend`）
- 变化事件：`handle` + 目标名称 + `Change`（如 `handleInputChange`）
- 键盘事件：`handle` + 目标名称 + `KeyDown`（如 `handleKeyDown`）

### 7.4 Hooks

- 自定义 Hook：`use` 前缀（如 `useChat`）
- Hook 返回类型：`Use` + Hook 名称 + `Return`（如 `UseChatReturn`）

---

## 附录

### A. 版本历史

| 版本 | 日期 | 描述 |
|------|------|------|
| 1.0.0 | 2026-06-08 | 初始规范，包含完整同步系统 |

### B. 参考文献

- TypeScript 官方文档
- React 官方文档
- Zustand 官方文档
- Electron 官方文档
- OpenAI API 文档
- 局域网同步系统设计文档

---

> 本规范与灵感调酒师、AI写作教练项目保持一致，避免数据冲突
