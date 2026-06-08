# 桌面宠物 - 灵感助手 项目规范

> 本文档定义了项目的类型系统、API 接口、组件接口和配置规范，确保开发过程中的代码一致性。

## 目录

1. [TypeScript 类型定义](#1-typescript-类型定义)
2. [API 接口规范](#2-api-接口规范)
3. [组件接口规范](#3-组件接口规范)
4. [配置规范](#4-配置规范)
5. [状态管理规范](#5-状态管理规范)
6. [命名规范](#6-命名规范)

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

### 1.2 状态类型

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

### 1.3 组件 Props 类型

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

### 1.4 Hook 返回类型

#### useChat 返回值

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
  saveAsInspiration: (content: string, tags?: string[]) => Inspiration
}
```

#### useLocalModel 返回值

```typescript
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

/** 聊天消息格式 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
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
  model: string,           // 模型名称
  messages: ChatMessage[], // 消息列表
  stream?: boolean,        // 是否流式输出
  temperature?: number,    // 温度参数（可选）
  max_tokens?: number      // 最大令牌数（可选）
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

**响应（流式）**

```
data: {"id":"...","choices":[{"index":0,"delta":{"content":"..."}}]}
data: {"id":"...","choices":[{"index":0,"delta":{"content":"..."}}]}
...
data: [DONE]
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

**响应**

```typescript
{
  object: 'list',
  data: [{
    id: string,
    object: 'model',
    created: number,
    owned_by: string
  }]
}
```

### 2.2 同步 API

#### 推送灵感

```
POST {inspirationBartenderUrl}/api/inspirations
```

**请求头**

```typescript
{
  'Content-Type': 'application/json'
}
```

**请求体**

```typescript
{
  id: string,
  content: string,
  tags: string[],
  createdAt: string, // ISO 8601 格式
  updatedAt: string  // ISO 8601 格式
}
```

**响应**

```typescript
{
  success: boolean,
  id?: string,
  error?: string
}
```

---

## 3. 组件接口规范

### 3.1 FloatingWidget 组件

```typescript
import React from 'react'
import { FloatingWidgetProps } from '../types'

/**
 * 浮动小部件组件
 * 可拖动的小球，点击展开聊天窗口
 */
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

/**
 * 聊天窗口组件
 * 显示对话历史和输入框
 */
const ChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
  // 实现...
}

export default ChatWindow
```

**功能要求**

- 固定位置显示（右侧顶部）
- 标题栏：图标 + 标题 + 关闭按钮
- 消息列表区域：可滚动
- 快捷操作区：保存灵感按钮
- 输入区：文本框 + 发送按钮
- 支持 Enter 发送，Shift+Enter 换行
- 禁用状态：加载时输入框禁用
- 空状态提示

### 3.3 MessageBubble 组件

```typescript
import React from 'react'
import { MessageBubbleProps } from '../types'

/**
 * 消息气泡组件
 * 显示单条聊天消息
 */
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

/**
 * 设置面板组件
 * 配置 API 和同步设置
 */
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

### 4.2 环境变量

```bash
# 本地模型 API
MODEL_API_BASE_URL=http://localhost:11434/v1
MODEL_API_KEY=ollama
MODEL_API_MODEL_NAME=llama3.2

# 同步 API
SYNC_API_INSPIRATION_BARTENDER_URL=http://localhost:3000
```

### 4.3 持久化存储

- 使用 localStorage 存储配置
- Storage Key: `desktop-pet-storage`
- 数据格式：JSON

---

## 5. 状态管理规范

### 5.1 Zustand Store 结构

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useAppStore = create<ChatState & ConfigState & InspirationState>()(
  persist(
    (set, get) => ({
      // Chat State
      messages: [],
      isLoading: false,
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      clearMessages: () => set({ messages: [] }),
      setIsLoading: (loading) => set({ isLoading: loading }),

      // Config State
      config: defaultConfig,
      setConfig: (newConfig) =>
        set((state) => ({ config: { ...state.config, ...newConfig } })),

      // Inspiration State
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

### 5.2 状态更新规则

1. **消息状态**
   - 添加消息：追加到 messages 数组
   - 清空消息：重置 messages 为空数组
   - 加载状态：控制输入框和发送按钮

2. **配置状态**
   - 保存配置：合并到现有配置
   - 重置配置：使用默认配置

3. **灵感状态**
   - 添加灵感：追加到 inspirations 数组
   - 更新灵感：根据 id 更新对应项
   - 删除灵感：根据 id 过滤数组
   - 标记同步：更新状态为 'synced'

---

## 6. 命名规范

### 6.1 文件命名

- React 组件：`PascalCase.tsx`（如 `ChatWindow.tsx`）
- TypeScript 类型：`camelCase.ts`（如 `index.ts`）
- 配置文件：`kebab-case.json`（如 `electron-builder.json`）
- 脚本文件：`kebab-case.js`（如 `start.js`）

### 6.2 变量命名

- 普通变量：`camelCase`（如 `inputValue`）
- 常量：`UPPER_SNAKE_CASE`（如 `DEFAULT_TIMEOUT`）
- 类型/接口：`PascalCase`（如 `Inspiration`）
- 枚举值：`camelCase`（如 `InspirationStatus`）

### 6.3 事件处理函数

- 点击事件：`handle` 前缀（如 `handleSend`）
- 变化事件：`handle` + 目标名称 + `Change`（如 `handleInputChange`）
- 键盘事件：`handle` + 目标名称 + `KeyDown`（如 `handleKeyDown`）

### 6.4 Hooks

- 自定义 Hook：`use` 前缀（如 `useChat`）
- Hook 返回类型：`Use` + Hook 名称 + `Return`（如 `UseChatReturn`）

---

## 附录

### A. 版本历史

| 版本 | 日期 | 描述 |
|------|------|------|
| 1.0.0 | 2026-06-08 | 初始规范 |

### B. 参考文献

- TypeScript 官方文档
- React 官方文档
- Zustand 官方文档
- Electron 官方文档
- OpenAI API 文档

---

> 本规范将随项目发展持续更新
