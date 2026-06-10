/// <reference types="vite/client" />

// ============================================
// 记忆提升相关类型
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
  /** 唯一标识符 */
  id: string
  /** 项目ID */
  projectId: string
  /** 类型 */
  type: MemoryPromotionType
  /** 内容 */
  content: string
  /** 源区块ID */
  sourceBlockId?: string | null
  /** 来源智能体 */
  sourceAgent?: string | null
  /** 置信度 */
  confidence?: number
  /** 状态 */
  status: MemoryPromotionStatus
  /** 创建时间 */
  createdAt: number
}

// ============================================
// ElectronAPI 类型
// ============================================

interface ElectronAPI {
  // 基础方法
  sendMessage: (channel: string, data: unknown) => void
  onMessage: (channel: string, callback: (...args: unknown[]) => void) => void
  invoke: (channel: string, data?: unknown) => Promise<unknown>

  // 同步相关
  syncAddInspiration: (inspiration: {
    id: string
    content: string
    tags?: string[]
    chatHistory?: Array<{ role: string; content: string; timestamp: string }>
  }) => Promise<{ success: boolean; data?: unknown; error?: string }>
  syncTrigger: () => Promise<{ success: boolean; error?: string }>
  syncGetDevices: () => Promise<{ success: boolean; devices?: unknown[]; error?: string }>
  syncGetQueue: () => Promise<{ success: boolean; queue?: unknown[]; error?: string }>
  syncGetSent: () => Promise<{ success: boolean; sent?: unknown[]; error?: string }>
  syncSetInterval: (minutes: number) => Promise<{ success: boolean; error?: string }>

  // 记忆提升相关
  memoryPromotionCreate: (data: {
    projectId: string
    type: MemoryPromotionType
    content: string
    sourceBlockId?: string
    sourceAgent?: string
    confidence?: number
  }) => Promise<{ success: boolean; candidate?: MemoryPromotionCandidate; error?: string }>
  memoryPromotionGetPending: (
    projectId: string
  ) => Promise<{ success: boolean; candidates?: MemoryPromotionCandidate[]; error?: string }>
  memoryPromotionGetAll: (
    projectId: string
  ) => Promise<{ success: boolean; candidates?: MemoryPromotionCandidate[]; error?: string }>
  memoryPromotionApprove: (
    candidateId: string
  ) => Promise<{ success: boolean; knowledgeItemId?: string; error?: string }>
  memoryPromotionReject: (candidateId: string) => Promise<{ success: boolean; error?: string }>
  memoryPromotionDelete: (candidateId: string) => Promise<{ success: boolean; error?: string }>
  memoryPromotionApproveBatch: (
    candidateIds: string[]
  ) => Promise<{ success: boolean; successCount?: number; failedCount?: number; error?: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
