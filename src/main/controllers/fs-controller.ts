import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../ipc-channels'
import * as fs from 'fs/promises'
import * as path from 'path'

export const setupFsHandlers = (): void => {
  ipcMain.handle(IPC_CHANNELS.FS_READ_FILE, async (_, filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return { success: true, data: content }
    } catch (error) {
      console.error('[IPC] fs:readFile failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.FS_WRITE_FILE, async (_, filePath: string, content: string) => {
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, content, 'utf-8')
      return { success: true }
    } catch (error) {
      console.error('[IPC] fs:writeFile failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.FS_READ_DIR, async (_, dirPath: string) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      const result = entries.map((entry) => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
      }))
      return { success: true, data: result }
    } catch (error) {
      console.error('[IPC] fs:readDir failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.FS_DELETE, async (_, targetPath: string) => {
    try {
      const stat = await fs.stat(targetPath)
      if (stat.isDirectory()) {
        await fs.rm(targetPath, { recursive: true })
      } else {
        await fs.unlink(targetPath)
      }
      return { success: true }
    } catch (error) {
      console.error('[IPC] fs:delete failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.FS_EXISTS, async (_, targetPath: string) => {
    try {
      await fs.access(targetPath)
      return { success: true, data: true }
    } catch {
      return { success: true, data: false }
    }
  })
}
