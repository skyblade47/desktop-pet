/**
 * 局域网同步 - 类型定义
 * 桌面宠物版本
 */

// 灵感数据结构
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

// 设备信息
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

// 同步配置
export interface SyncConfig {
  enabled: boolean
  autoSync: boolean
  syncInterval: number // 分钟
  deviceName: string
}

// API 响应类型
export interface InfoResponse {
  device: SyncDevice
  api: {
    version: string
    endpoints: string[]
  }
}

export interface SyncResponse {
  success: boolean
  received: number
  processed: number
  conflicts: number
  timestamp: string
}

export interface InspirationListResponse {
  inspirations: SyncInspiration[]
  count: number
  lastSync: string
}
