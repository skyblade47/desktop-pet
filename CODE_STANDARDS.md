# 桌面宠物 - 项目代码规范

> 版本：v1.0 | 日期：2026-06-08  
> 状态：正式版  
> 继承自：AI写作教练代码规范

---

## 一、文档目的

本文档为桌面宠物项目制定统一的代码规范，确保：
1. 代码风格一致性
2. 文件组织规范化
3. 质量检查标准化
4. 代码编写规则明确

**所有开发人员必须严格遵守本文档的所有规定。**

---

## 二、文件组织结构

### 2.1 整体目录结构

```
desktop-pet/
├── src/
│   ├── main/                    # Electron 主进程 (Node.js)
│   │   ├── index.ts             # 主进程入口
│   │   ├── ipc.ts               # IPC 处理器注册
│   │   ├── tray.ts              # 系统托盘管理
│   │   ├── main.ts              # 主窗口管理
│   │   │
│   │   ├── sync/               # 同步模块
│   │   │   ├── index.ts        # 入口
│   │   │   ├── types.ts        # 类型定义
│   │   │   ├── discovery.ts     # 设备发现
│   │   │   ├── server.ts        # HTTP 服务器
│   │   │   ├── protocol.ts      # 协议处理
│   │   │   └── syncManager.ts   # 同步管理器
│   │   │
│   │   └── logger.ts            # 日志工具
│   │
│   ├── preload/                  # Preload 脚本
│   │   └── preload.ts          # 所有 API 定义
│   │
│   └── renderer/                 # React 渲染进程
│       ├── src/
│       │   ├── components/       # React 组件
│       │   │   ├── ChatWindow.tsx
│       │   │   ├── FloatingWidget.tsx
│       │   │   ├── MessageBubble.tsx
│       │   │   ├── SettingsPanel.tsx
│       │   │   └── SyncStatus.tsx
│       │   │
│       │   ├── hooks/           # 自定义 Hooks
│       │   │   ├── useChat.ts
│       │   │   └── useLocalModel.ts
│       │   │
│       │   ├── store/           # Zustand 状态管理
│       │   │   └── useStore.ts
│       │   │
│       │   ├── types/           # TypeScript 类型定义
│       │   │   └── index.ts
│       │   │
│       │   ├── App.tsx
│       │   └── main.tsx
│       │
│       └── index.html
│
├── scripts/                      # 脚本文件
├── docs/                         # 设计文档
├── package.json
├── tsconfig.json
├── electron-vite.config.ts
├── .prettierrc
└── ...
```

### 2.2 文件命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| **组件文件** | PascalCase + `.tsx` | `ChatWindow.tsx` |
| **工具/服务文件** | kebab-case + `.ts` | `sync-manager.ts` |
| **Store 文件** | PascalCase + `Store` + `.ts` | `useStore.ts` |
| **Hook 文件** | `use` + PascalCase + `.ts` | `useChat.ts` |
| **类型文件** | PascalCase + `.ts` | `editor.ts` |
| **IPC 文件** | `*-ipc.ts` | `sync-ipc.ts` |
| **同步模块** | kebab-case | `sync-manager.ts` |

---

## 三、代码风格规范

### 3.1 TypeScript 类型定义

#### 3.1.1 类型定义位置

**规则：类型定义应在使用处最近的文件顶部声明**

```typescript
// ✅ 正确：在使用组件的同一文件顶部定义
import React from 'react'
import type { Inspiration } from '../types'

interface ChatWindowProps {
  inspirations: Inspiration[]
  onInspirationSelect: (id: string) => void
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  inspirations,
  onInspirationSelect,
}) => {
  // 组件实现...
}
```

#### 3.1.2 类型定义原则

| 原则 | 说明 |
|------|------|
| **就近定义** | 类型应在使用它的最小范围内定义 |
| **接口优于类型别名** | 优先使用 `interface`，除非需要联合类型或映射类型 |
| **避免 any** | 尽可能使用 `unknown` 或具体类型 |
| **导出原则** | 仅导出必要的类型，隐藏内部类型 |

### 3.2 React 组件规范

#### 3.2.1 组件定义模式

**规则：使用函数组件 + 命名导出**

```typescript
// ✅ 正确：命名导出函数组件
export const ChatWindow: React.FC = () => {
  return <div>...</div>
}

// ✅ 正确：带 Props 接口的命名导出
interface ChatWindowProps {
  onInspirationCreate: (content: string) => void
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  onInspirationCreate,
}) => {
  return <div>...</div>
}

// ❌ 错误：default 导出
const MyComponent: React.FC = () => { ... }
export default MyComponent
```

#### 3.2.2 组件内部结构规范

```typescript
export const ExampleComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  // ============================================================
  // 1. Hooks 声明区
  // ============================================================
  const [localState, setLocalState] = useState<string>('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  
  // Zustand store selectors
  const selectedInspiration = useStore((s) => s.selectedInspiration)
  
  // ============================================================
  // 2. useMemo - 计算属性（可选）
  // ============================================================
  const filteredItems = useMemo(() => {
    return items.filter(item => item.active)
  }, [items])
  
  // ============================================================
  // 3. useCallback - 事件处理函数
  // ============================================================
  const handleClick = useCallback((id: string) => {
    setLocalState(id)
    onUpdate?.(id)
  }, [onUpdate])
  
  // ============================================================
  // 4. useEffect - 副作用处理
  // ============================================================
  useEffect(() => {
    fetchData()
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])
  
  // ============================================================
  // 5. 渲染逻辑
  // ============================================================
  return (
    <div className="p-4">
      {items.map(item => (
        <div key={item.id} onClick={() => handleClick(item.id)}>
          {item.name}
        </div>
      ))}
    </div>
  )
}
```

#### 3.2.3 组件命名规范

| 元素 | 命名规范 | 示例 |
|------|----------|------|
| 组件文件 | PascalCase + `.tsx` | `ChatWindow.tsx` |
| Props 接口 | PascalCase + Props | `ChatWindowProps` |
| 回调属性 | `on` + PascalCase | `onInspirationCreate` |
| 状态属性 | `is`/`has`/`should` + PascalCase | `isLoading` |
| 处理函数 | `handle` + PascalCase | `handleClick` |

### 3.3 Zustand Store 规范

#### 3.3.1 Store 文件结构

```typescript
// ============================================================
// 1. 导入区
// ============================================================
import { create } from 'zustand'
import type { Inspiration } from '../types'

// ============================================================
// 2. 类型定义区 - State 和 Actions 接口
// ============================================================
interface StoreState {
  // State
  inspirations: Inspiration[]
  selectedInspirationId: string | null
  isLoading: boolean
  
  // Actions
  setInspirations: (inspirations: Inspiration[]) => void
  addInspiration: (inspiration: Inspiration) => void
  selectInspiration: (id: string | null) => void
}

// ============================================================
// 3. Store 实现
// ============================================================
export const useStore = create<StoreState>((set, get) => ({
  // State 默认值
  inspirations: [],
  selectedInspirationId: null,
  isLoading: false,
  
  // Actions 实现
  setInspirations: (inspirations) => set({ inspirations }),
  addInspiration: (inspiration) => set({ 
    inspirations: [...get().inspirations, inspiration] 
  }),
  selectInspiration: (id) => set({ selectedInspirationId: id }),
}))
```

### 3.4 IPC 通信规范

#### 3.4.1 Preload API 定义模式

```typescript
// src/preload/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

// 统一响应类型
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

const api = {
  // 灵感管理
  inspiration: {
    create: function (data: any): Promise<ApiResponse> {
      return ipcRenderer.invoke('inspiration:create', data)
    },
    getAll: function (): Promise<ApiResponse> {
      return ipcRenderer.invoke('inspiration:getAll')
    },
  },
  
  // 同步管理
  sync: {
    getStatus: function (): Promise<ApiResponse> {
      return ipcRenderer.invoke('sync:getStatus')
    },
    triggerSync: function (): Promise<ApiResponse> {
      return ipcRenderer.invoke('sync:trigger')
    },
  },
}

contextBridge.exposeInMainWorld('api', api)
export type API = typeof api
```

#### 3.4.2 IPC Handler 实现模式

```typescript
// src/main/ipc.ts
import { ipcMain } from 'electron'
import log from 'electron-log'

// 统一入口函数
export function setupIPC(): void {
  // 灵感创建
  ipcMain.handle('inspiration:create', async (_, data) => {
    try {
      const result = await syncManager.createInspiration(data)
      return { success: true, data: result }
    } catch (error) {
      log.error('创建灵感失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 同步状态
  ipcMain.handle('sync:getStatus', async () => {
    try {
      const status = syncManager.getStatus()
      return { success: true, data: status }
    } catch (error) {
      log.error('获取同步状态失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  log.info('IPC handlers 设置完成')
}
```

### 3.5 日志记录规范

| 场景 | 日志级别 | 示例 |
|------|----------|------|
| 初始化完成 | `log.info` | `log.info('IPC handlers 设置完成')` |
| 操作失败 | `log.error` | `log.error('创建灵感失败:', error)` |
| 重试尝试 | `log.warn` | `log.warn('[Retry] Attempt ${retryCount}')` |
| 调试信息 | `log.debug` | `log.debug('Using cached response')` |

---

## 四、质量检查要求

### 4.1 形式检查（自动化）

#### 4.1.1 TypeScript 类型检查

**命令：** `npm run typecheck`

**要求：** 必须通过，0 错误

```bash
npm run typecheck
# 必须输出无错误
```

#### 4.1.2 构建检查

**命令：** `npm run build`

**要求：** 必须成功构建

```bash
npm run build
# 必须构建成功
```

---

## 五、代码编写规则

### 5.1 基本规则

**规则 1：默认情况下，所有回复和注释都必须使用中文**

```typescript
// ✅ 正确：中文注释
/**
 * 同步管理器 - 处理灵感数据的局域网同步
 * 支持 mDNS 设备发现和 HTTP 推送
 */

// ❌ 错误：英文注释
/**
 * Sync manager - handles inspiration sync across local network
 */
```

**规则 2：复杂需求拆解成小任务，分步实现，每完成一个小任务后再继续**

```
任务拆解原则：
1. 每个任务应该能在 2 小时内完成
2. 任务之间应该有明确的依赖关系
3. 每个任务完成后应该能独立测试
```

**规则 3：代码实现前后要仔细检查，确保类型定义完整、组件 props 正确**

```typescript
// ✅ 正确：完整的 Props 定义
interface ChatWindowProps {
  /** 灵感列表 */
  inspirations: Inspiration[]
  /** 选中灵感回调 */
  onInspirationSelect: (id: string) => void
  /** 是否显示设置面板 */
  showSettings: boolean
}

// ❌ 错误：Props 定义不完整
interface ChatWindowProps {
  inspirations: Inspiration[]
}
```

**规则 4：遵循项目架构设计，保持代码风格一致**

**规则 5：组件设计遵循单一职责原则**

```typescript
// ✅ 正确：单一职责
export const ChatWindow: React.FC<Props> = ({ 
  onInspirationCreate 
}) => {
  // 只负责聊天窗口的展示
}

// ❌ 错误：职责混合
export const ChatWindow: React.FC<Props> = ({ 
  onInspirationCreate 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  // 混入了分析逻辑
}
```

**规则 6：优先使用现有组件库和 hooks，避免重复代码**

```typescript
// ✅ 正确：使用现有 hooks
import { useChat } from '../hooks/useChat'

// ❌ 错误：重复造轮子
const useCustomDebounce = (callback: Function, delay: number) => {
  // 自己实现 debounce
}
```

**规则 7：确保代码可读性，复杂逻辑添加注释**

```typescript
// ✅ 正确：复杂逻辑添加注释
/**
 * 计算校验和
 * 原理：使用 DJB2 哈希算法
 */
function calculateChecksum(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}
```

**规则 8：如有疑问，先询问再修改**

---

## 六、Git 提交规范

### 6.1 提交信息格式

```
<类型>: <简短描述>

[可选的详细描述]
```

### 6.2 提交类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加灵感同步功能` |
| `fix` | Bug 修复 | `fix: 修复同步超时问题` |
| `docs` | 文档更新 | `docs: 更新 README` |
| `style` | 代码格式 | `style: 格式化代码` |
| `refactor` | 代码重构 | `refactor: 简化同步逻辑` |
| `chore` | 构建/工具 | `chore: 更新依赖版本` |

### 6.3 提交示例

```bash
# 正确示例
git commit -m "feat: 添加局域网同步系统"
git commit -m "fix: 修复设备发现超时"
git commit -m "docs: 添加同步功能文档"

# 详细示例
git commit -m "feat: 实现灵感同步管理器

- 添加设备发现模块
- 实现 HTTP 服务器接收端
- 集成到主进程"
```

---

## 七、同步模块规范

### 7.1 同步架构

```
桌面宠物 → 灵感调酒师 → AI写作教练
(端口3001)   (端口3002)      (端口3003)
```

### 7.2 同步模块文件结构

```typescript
// src/main/sync/types.ts - 类型定义
export interface SyncInspiration {
  id: string
  content: string
  tags: string[]
  source: 'desktop-pet'
  syncStatus: 'local' | 'pending' | 'synced'
  // ...
}

// src/main/sync/discovery.ts - 设备发现
export class DeviceDiscovery {
  async start(type: string, name: string, port: number): Promise<void>
  stop(): void
  getDevices(type?: string): SyncDevice[]
}

// src/main/sync/server.ts - HTTP 服务器
export class SyncServer {
  async start(): Promise<void>
  async stop(): Promise<void>
}

// src/main/sync/syncManager.ts - 同步管理器
export class SyncManager extends EventEmitter {
  static getInstance(): SyncManager
  async init(config?: Partial<SyncConfig>): Promise<void>
  queueForSync(inspiration: any): void
  async syncPending(): Promise<void>
  async shutdown(): Promise<void>
}
```

### 7.3 日志标签

| 模块 | 日志标签 | 示例 |
|------|----------|------|
| 设备发现 | `[DeviceDiscovery]` | `log.info('[DeviceDiscovery] Started')` |
| 同步服务器 | `[SyncServer]` | `log.info('[SyncServer] Started on port 3001')` |
| 同步管理器 | `[SyncManager]` | `log.info('[SyncManager] Initialized')` |

---

## 八、附录

### 8.1 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run lint` | 代码检查 |

### 8.2 相关文档

- [SPEC.md](./SPEC.md) - 产品规格文档
- [docs/design.md](./docs/design.md) - 设计文档

---

**文档版本历史：**

| 版本 | 日期 | 修改内容 |
|------|------|----------|
| v1.0 | 2026-06-08 | 初始版本，统一桌面宠物项目代码规范 |

**维护责任：** 所有开发人员都有责任遵守和维护本文档。
