import { ipcMain } from 'electron'
import { SyncManager } from './sync/syncManager'
import { memoryPromotionService } from './harness/memory-promotion-service'

export const setupIPC = () => {
  // 测试 ping
  ipcMain.handle('ping', () => {
    return 'pong'
  })
  
  // 日志消息
  ipcMain.on('log', (_, message: string) => {
    console.log('[Renderer]', message)
  })
  
  // 获取应用版本
  ipcMain.handle('app:getVersion', () => {
    const { app } = require('electron')
    return { success: true, data: { version: app.getVersion() } }
  })

  // ========== 同步相关 API (遵循 domain:action 命名约定) ==========

  // 添加灵感到同步队列
  ipcMain.handle('sync:addInspiration', async (_, inspiration: {
    id: string
    content: string
    tags?: string[]
    chatHistory?: Array<{ role: string; content: string; timestamp: string }>
  }) => {
    try {
      const syncManager = SyncManager.getInstance()
      const result = await syncManager.addInspirationToSync(inspiration)
      return { success: true, data: result }
    } catch (error) {
      console.error('[IPC] sync:addInspiration failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 手动触发同步
  ipcMain.handle('sync:trigger', async () => {
    try {
      const syncManager = SyncManager.getInstance()
      await syncManager.triggerSync()
      return { success: true }
    } catch (error) {
      console.error('[IPC] sync:trigger failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取已发现的设备
  ipcMain.handle('sync:getDevices', () => {
    try {
      const syncManager = SyncManager.getInstance()
      const devices = syncManager.getDiscoveredDevices()
      return { success: true, data: devices }
    } catch (error) {
      console.error('[IPC] sync:getDevices failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取同步队列
  ipcMain.handle('sync:getQueue', () => {
    try {
      const syncManager = SyncManager.getInstance()
      const queue = syncManager.getSyncQueue()
      return { success: true, data: queue }
    } catch (error) {
      console.error('[IPC] sync:getQueue failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取已发送的灵感
  ipcMain.handle('sync:getSent', () => {
    try {
      const syncManager = SyncManager.getInstance()
      const sent = syncManager.getSentInspirations()
      return { success: true, data: sent }
    } catch (error) {
      console.error('[IPC] sync:getSent failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 设置同步间隔
  ipcMain.handle('sync:setInterval', (_, minutes: number) => {
    try {
      const syncManager = SyncManager.getInstance()
      syncManager.setSyncInterval(minutes)
      return { success: true }
    } catch (error) {
      console.error('[IPC] sync:setInterval failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取同步配置
  ipcMain.handle('sync:getConfig', () => {
    try {
      const syncManager = SyncManager.getInstance()
      const config = syncManager.getConfig()
      return { success: true, data: config }
    } catch (error) {
      console.error('[IPC] sync:getConfig failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 更新同步配置
  ipcMain.handle('sync:updateConfig', (_, config: Partial<{
    enabled: boolean
    autoSync: boolean
    syncInterval: number
    deviceName: string
  }>) => {
    try {
      const syncManager = SyncManager.getInstance()
      syncManager.updateConfig(config)
      return { success: true }
    } catch (error) {
      console.error('[IPC] sync:updateConfig failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // ========== 记忆提升相关 API (遵循 domain:action 命名约定) ==========

  // 创建记忆提升候选
  ipcMain.handle(
    'memoryPromotion:create',
    (
      _,
      data: {
        projectId: string
        type: 'fact' | 'character_trait' | 'plot_point' | 'setting' | 'relationship'
        content: string
        sourceBlockId?: string
        sourceAgent?: string
        confidence?: number
      }
    ) => {
      try {
        const candidate = memoryPromotionService.createCandidate(data)
        return { success: true, data: candidate }
      } catch (error) {
        console.error('[IPC] memoryPromotion:create failed:', error)
        return { success: false, error: (error as Error).message }
      }
    }
  )

  // 获取待处理的记忆提升候选
  ipcMain.handle('memoryPromotion:getPending', (_, projectId: string) => {
    try {
      const candidates = memoryPromotionService.getPendingCandidates(projectId)
      return { success: true, data: candidates }
    } catch (error) {
      console.error('[IPC] memoryPromotion:getPending failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取所有记忆提升候选
  ipcMain.handle('memoryPromotion:getAll', (_, projectId: string) => {
    try {
      const candidates = memoryPromotionService.getAllCandidates(projectId)
      return { success: true, data: candidates }
    } catch (error) {
      console.error('[IPC] memoryPromotion:getAll failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 批准记忆提升候选
  ipcMain.handle('memoryPromotion:approve', async (_, candidateId: string) => {
    try {
      const result = await memoryPromotionService.approveCandidate(candidateId)
      return result
    } catch (error) {
      console.error('[IPC] memoryPromotion:approve failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 拒绝记忆提升候选
  ipcMain.handle('memoryPromotion:reject', (_, candidateId: string) => {
    try {
      memoryPromotionService.rejectCandidate(candidateId)
      return { success: true }
    } catch (error) {
      console.error('[IPC] memoryPromotion:reject failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 删除记忆提升候选
  ipcMain.handle('memoryPromotion:delete', (_, candidateId: string) => {
    try {
      memoryPromotionService.deleteCandidate(candidateId)
      return { success: true }
    } catch (error) {
      console.error('[IPC] memoryPromotion:delete failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 批量批准记忆提升候选
  ipcMain.handle('memoryPromotion:approveBatch', async (_, candidateIds: string[]) => {
    try {
      const result = await memoryPromotionService.approveCandidates(candidateIds)
      return { success: true, data: { approvedCount: result.success, failedCount: result.failed } }
    } catch (error) {
      console.error('[IPC] memoryPromotion:approveBatch failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })
}
