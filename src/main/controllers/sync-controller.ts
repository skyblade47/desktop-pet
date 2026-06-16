import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../ipc-channels'
import { SyncManager } from '../sync/syncManager'

export const setupSyncHandlers = (): void => {
  // 添加灵感到同步队列
  ipcMain.handle(
    IPC_CHANNELS.SYNC_ADD_INSPIRATION,
    async (_, inspiration: {
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
    }
  )

  // 手动触发同步
  ipcMain.handle(IPC_CHANNELS.SYNC_TRIGGER, async () => {
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
  ipcMain.handle(IPC_CHANNELS.SYNC_GET_DEVICES, () => {
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
  ipcMain.handle(IPC_CHANNELS.SYNC_GET_QUEUE, () => {
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
  ipcMain.handle(IPC_CHANNELS.SYNC_GET_SENT, () => {
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
  ipcMain.handle(IPC_CHANNELS.SYNC_SET_INTERVAL, (_, minutes: number) => {
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
  ipcMain.handle(IPC_CHANNELS.SYNC_GET_CONFIG, () => {
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
  ipcMain.handle(
    IPC_CHANNELS.SYNC_UPDATE_CONFIG,
    (_, config: Partial<{
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
    }
  )
}
