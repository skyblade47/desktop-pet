import { ipcMain } from 'electron'

/**
 * 设置 IPC 通信处理
 */
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
}
