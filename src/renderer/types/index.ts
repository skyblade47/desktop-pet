// ============================================
// 核心数据类型 (与AI写作教练保持一致)
// ============================================

/**
 * 灵感状态枚举
 */
export type InspirationStatus = 'draft' | 'completed' | 'synced'

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

/**
 * 消息角色枚举
 */
export type MessageRole = 'user' | 'assistant' | 'system'

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

/**
 * 应用配置数据结构
 */
export interface AppConfig {
  /** 本地模型 API 配置 */
  modelApi: ModelApiConfig
  /** 同步 API 配置 */
  syncApi: SyncApiConfig
}

// ============================================
// 同步相关类型 (与AI写作教练保持一致)
// ============================================

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

// ============================================
// 记忆提升相关类型 (与AI写作教练保持一致)
// ============================================

/**
 * 记忆提升候选类型
 */
export type MemoryPromotionType = 'fact' | 'character_trait' | 'plot_point' | 'setting' | 'relationship'

/**
 * 记忆提升候选状态
 */
export type MemoryPromotionStatus = 'pending' | 'approved' | 'rejected'

/**
 * 记忆提升候选数据结构
 */
export interface MemoryPromotionCandidate {
  id: string
  projectId: string
  type: MemoryPromotionType
  content: string
  sourceBlockId?: string
  sourceAgent?: string
  confidence?: number
  status: MemoryPromotionStatus
  createdAt: string
  updatedAt: string
}

// ============================================
// 状态类型
// ============================================

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

/**
 * 配置状态
 */
export interface ConfigState {
  /** 应用配置 */
  config: AppConfig
  /** 更新配置 */
  setConfig: (config: Partial<AppConfig>) => void
}

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

/**
 * 应用状态
 */
export interface AppState {
  /** 初始化应用 */
  initialize: () => void
}

// ============================================
// 组件 Props 类型
// ============================================

/**
 * 浮动小部件属性
 */
export interface FloatingWidgetProps {
  /** 点击回调 */
  onClick: () => void
  /** 右键点击回调 */
  onRightClick: () => void
}

/**
 * 聊天窗口属性
 */
export interface ChatWindowProps {
  /** 关闭回调 */
  onClose: () => void
}

/**
 * 消息气泡属性
 */
export interface MessageBubbleProps {
  /** 消息数据 */
  message: Message
}

/**
 * 设置面板属性
 */
export interface SettingsPanelProps {
  /** 关闭回调 */
  onClose: () => void
}

/**
 * 记忆提升面板属性
 */
export interface MemoryPromotionPanelProps {
  /** 关闭回调 */
  onClose: () => void
}

// ============================================
// Hook 返回类型
// ============================================

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
  chat: (messages: ChatMessage[], onStream?: (chunk: string) => void) => Promise<string>
  /** 测试连接 */
  testConnection: () => Promise<boolean>
  /** 是否已连接 */
  isConnected: boolean
}

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

// ============================================
// API 响应类型 (与AI写作教练保持一致)
// ============================================

/**
 * 通用API响应格式
 */
export type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ============================================
// 数据库类型映射
// ============================================

/**
 * SQLite类型到TypeScript类型映射
 */
export interface SQLiteTypeMap {
  TEXT: string
  INTEGER: number | boolean
  REAL: number
  JSON: any
}
