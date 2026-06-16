import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../ipc-channels'

export const setupAppHandlers = (): void => {
  // 测试 ping
  ipcMain.handle(IPC_CHANNELS.APP_PING, () => {
    return 'pong'
  })

  // 日志消息
  ipcMain.on(IPC_CHANNELS.APP_LOG, (_, message: string) => {
    console.log('[Renderer]', message)
  })

  // 获取应用版本
  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, () => {
    const { app } = require('electron')
    return { success: true, data: { version: app.getVersion() } }
  })
}
