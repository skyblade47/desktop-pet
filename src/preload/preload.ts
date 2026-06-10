import { contextBridge, ipcRenderer } from 'electron'

/**
 * 预加载脚本
 * 在渲染进程和主进程之间建立安全的通信桥梁
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * 发送消息到主进程
   */
  sendMessage: (channel: string, data: unknown) => {
    ipcRenderer.send(channel, data)
  },
  
  /**
   * 监听主进程消息
   */
  onMessage: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args))
  },
  
  /**
   * 调用主进程方法并获取返回值
   */
  invoke: (channel: string, data?: unknown) => {
    return ipcRenderer.invoke(channel, data)
  },

  // ========== 同步相关 API ==========

  /**
   * 添加灵感到同步队列
   */
  syncAddInspiration: (inspiration: {
    id: string
    content: string
    tags?: string[]
    chatHistory?: Array<{ role: string; content: string; timestamp: string }>
  }) => {
    return ipcRenderer.invoke('sync-add-inspiration', inspiration)
  },

  /**
   * 手动触发同步
   */
  syncTrigger: () => {
    return ipcRenderer.invoke('sync-trigger')
  },

  /**
   * 获取已发现的设备
   */
  syncGetDevices: () => {
    return ipcRenderer.invoke('sync-get-devices')
  },

  /**
   * 获取同步队列
   */
  syncGetQueue: () => {
    return ipcRenderer.invoke('sync-get-queue')
  },

  /**
   * 获取已发送的灵感
   */
  syncGetSent: () => {
    return ipcRenderer.invoke('sync-get-sent')
  },

  /**
   * 设置同步间隔
   */
  syncSetInterval: (minutes: number) => {
    return ipcRenderer.invoke('sync-set-interval', minutes)
  },

  // ========== 记忆提升相关 API ==========

  /**
   * 创建记忆提升候选
   */
  memoryPromotionCreate: (data: {
    projectId: string
    type: 'fact' | 'character_trait' | 'plot_point' | 'setting' | 'relationship'
    content: string
    sourceBlockId?: string
    sourceAgent?: string
    confidence?: number
  }) => {
    return ipcRenderer.invoke('memoryPromotion:create', data)
  },

  /**
   * 获取待处理的记忆提升候选
   */
  memoryPromotionGetPending: (projectId: string) => {
    return ipcRenderer.invoke('memoryPromotion:getPending', projectId)
  },

  /**
   * 获取所有记忆提升候选
   */
  memoryPromotionGetAll: (projectId: string) => {
    return ipcRenderer.invoke('memoryPromotion:getAll', projectId)
  },

  /**
   * 批准记忆提升候选
   */
  memoryPromotionApprove: (candidateId: string) => {
    return ipcRenderer.invoke('memoryPromotion:approve', candidateId)
  },

  /**
   * 拒绝记忆提升候选
   */
  memoryPromotionReject: (candidateId: string) => {
    return ipcRenderer.invoke('memoryPromotion:reject', candidateId)
  },

  /**
   * 删除记忆提升候选
   */
  memoryPromotionDelete: (candidateId: string) => {
    return ipcRenderer.invoke('memoryPromotion:delete', candidateId)
  },

  /**
   * 批量批准记忆提升候选
   */
  memoryPromotionApproveBatch: (candidateIds: string[]) => {
    return ipcRenderer.invoke('memoryPromotion:approveBatch', candidateIds)
  },
})