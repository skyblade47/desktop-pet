import { app, BrowserWindow } from 'electron'
import path from 'path'
import { setupIPC } from './ipc'
import { createTray, destroyTray } from './tray'
import { SyncManager } from './sync/syncManager'
import { initDatabase } from './database'

let mainWindow: BrowserWindow | null = null

/**
 * 创建主窗口
 */
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // 加载页面
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // 设置窗口位置
  mainWindow.setPosition(100, 100)

  // 创建系统托盘
  createTray(mainWindow)

  // 设置 IPC 通信
  setupIPC()
}

/**
 * 初始化同步服务
 */
const initSyncService = async () => {
  try {
    const syncManager = SyncManager.getInstance()
    await syncManager.init(
      {
        enabled: true,
        autoSync: true,
        syncInterval: 5,
        deviceName: '桌面宠物',
      },
      {
        onInspirationSynced: (inspiration) => {
          console.log('[Main] Inspiration synced:', inspiration.id)
        },
        onDevicesChanged: (devices) => {
          console.log('[Main] Devices changed:', devices.length)
        },
      }
    )
  } catch (error) {
    console.error('[Main] Failed to initialize sync service:', error)
  }
}

// 应用准备就绪
app.whenReady().then(async () => {
  // 初始化数据库
  await initDatabase()

  createWindow()
  await initSyncService()
})

// 所有窗口关闭时（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// macOS 点击 dock 图标时重新创建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 应用退出前
app.on('before-quit', async () => {
  destroyTray()
  // 关闭同步服务
  try {
    const syncManager = SyncManager.getInstance()
    await syncManager.shutdown()
  } catch (error) {
    console.error('[Main] Error shutting down sync service:', error)
  }
})