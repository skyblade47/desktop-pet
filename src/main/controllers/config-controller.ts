import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../ipc-channels'

// 配置存储 (内存中，临时实现)
const configStore: Record<string, unknown> = {}

export const setupConfigHandlers = (): void => {
  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, (_, key: string) => {
    try {
      return { success: true, data: configStore[key] }
    } catch (error) {
      console.error('[IPC] config:get failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.CONFIG_SET, (_, key: string, value: unknown) => {
    try {
      configStore[key] = value
      return { success: true }
    } catch (error) {
      console.error('[IPC] config:set failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })
}
