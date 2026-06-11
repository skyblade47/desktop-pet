import { app, BrowserWindow, screen } from 'electron'
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
  // 获取屏幕尺寸
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

  mainWindow = new BrowserWindow({
    width: 120,  // 窗口宽度 - 刚好容纳桌宠
    height: 100, // 窗口高度 - 刚好容纳桌宠
    x: screenWidth - 150, // 屏幕右下角
    y: screenHeight - 130,
    frame: false,           // 无边框
    transparent: true,       // 透明背景
    alwaysOnTop: true,      // 始终在最前
    resizable: false,        // 不可调整大小
    skipTaskbar: true,       // 不显示在任务栏
    hasShadow: false,        // 无阴影
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // 加载页面
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5174')
    // 开发时打开 DevTools 用于调试
    // mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // 调试：窗口准备就绪时打印日志
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Main] Window loaded successfully')
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('[Main] Window failed to load:', errorCode, errorDescription)
  })

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
  // 初始化数据库（不阻塞应用启动）
  initDatabase().catch((error) => {
    console.error('[Main] Database initialization failed:', error)
  })

  createWindow()
  
  // 初始化同步服务（不阻塞应用启动）
  initSyncService().catch((error) => {
    console.error('[Main] Sync service initialization failed:', error)
  })
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