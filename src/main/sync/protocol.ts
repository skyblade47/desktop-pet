/**
 * 协议处理模块
 * 桌面宠物版本
 */

import { SyncInspiration } from './types'

/**
 * 获取当前时间的 ISO 格式字符串
 */
export function nowISO(): string {
  return new Date().toISOString()
}

/**
 * 计算校验和
 */
export function calculateChecksum(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}

/**
 * 将本地灵感转换为同步格式
 */
export function toSyncInspiration(
  localInspiration: {
    id: string
    content: string
    tags?: string[]
    chatHistory?: Array<{ role: string; content: string; timestamp: string }>
  }
): SyncInspiration {
  const now = nowISO()
  
  return {
    id: localInspiration.id,
    content: localInspiration.content,
    tags: localInspiration.tags || [],
    source: 'desktop-pet',
    sourceApp: 'desktop-pet',
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    syncHistory: [],
    checksum: calculateChecksum(localInspiration.content),
    original: {
      chatHistory: localInspiration.chatHistory,
    },
  }
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 验证灵感数据
 */
export function validateInspiration(inspiration: SyncInspiration): boolean {
  if (!inspiration.id || !inspiration.content) {
    return false
  }
  
  if (!['desktop-pet', 'inspiration-bartender', 'writing-coach'].includes(inspiration.source)) {
    return false
  }
  
  if (!['local', 'pending', 'synced'].includes(inspiration.syncStatus)) {
    return false
  }
  
  return true
}

/**
 * 比较两个灵感（用于冲突检测）
 */
export function compareInspirations(
  a: SyncInspiration,
  b: SyncInspiration
): 'a' | 'b' | 'equal' {
  if (a.checksum === b.checksum) {
    return 'equal'
  }
  
  if (new Date(a.updatedAt) > new Date(b.updatedAt)) {
    return 'a'
  }
  
  return 'b'
}