import { ipcMain } from 'electron'
import { SyncManager } from './sync/syncManager'

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
  ipcMain.handle('get-version', () => {
    const { app } = require('electron')
    return app.getVersion()
  })

  // ========== 同步相关 API ==========

  // 添加灵感到同步队列
  ipcMain.handle('sync-add-inspiration', async (_, inspiration: {
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
      console.error('[IPC] sync-add-inspiration failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 手动触发同步
  ipcMain.handle('sync-trigger', async () => {
    try {
      const syncManager = SyncManager.getInstance()
      await syncManager.triggerSync()
      return { success: true }
    } catch (error) {
      console.error('[IPC] sync-trigger failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取已发现的设备
  ipcMain.handle('sync-get-devices', () => {
    try {
      const syncManager = SyncManager.getInstance()
      const devices = syncManager.getDiscoveredDevices()
      return { success: true, devices }
    } catch (error) {
      console.error('[IPC] sync-get-devices failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取同步队列
  ipcMain.handle('sync-get-queue', () => {
    try {
      const syncManager = SyncManager.getInstance()
      const queue = syncManager.getSyncQueue()
      return { success: true, queue }
    } catch (error) {
      console.error('[IPC] sync-get-queue failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取已发送的灵感
  ipcMain.handle('sync-get-sent', () => {
    try {
      const syncManager = SyncManager.getInstance()
      const sent = syncManager.getSentInspirations()
      return { success: true, sent }
    } catch (error) {
      console.error('[IPC] sync-get-sent failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 设置同步间隔
  ipcMain.handle('sync-set-interval', (_, minutes: number) => {
    try {
      const syncManager = SyncManager.getInstance()
      syncManager.setSyncInterval(minutes)
      return { success: true }
    } catch (error) {
      console.error('[IPC] sync-set-interval failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })
}