import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../ipc-channels'

export interface ProjectData {
  id: string
  name: string
  path: string
}

export const setupProjectHandlers = (): void => {
  ipcMain.handle(IPC_CHANNELS.PROJECT_CREATE, async (_, data: { name: string; path: string }) => {
    try {
      // TODO: 实现项目创建逻辑
      return { success: true, data: { id: `proj_${Date.now()}`, name: data.name, path: data.path } }
    } catch (error) {
      console.error('[IPC] project:create failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.PROJECT_OPEN, async (_, projectPath: string) => {
    try {
      // TODO: 实现项目打开逻辑
      return { success: true, data: { path: projectPath } }
    } catch (error) {
      console.error('[IPC] project:open failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.PROJECT_SAVE, async (_, _projectId: string) => {
    try {
      // TODO: 实现项目保存逻辑
      return { success: true }
    } catch (error) {
      console.error('[IPC] project:save failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })
}
