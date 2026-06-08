import { app, Tray, Menu, BrowserWindow } from 'electron'
import path from 'path'

let tray: Tray | null = null

/**
 * 创建系统托盘
 * @param mainWindow 主窗口实例
 */
export const createTray = (mainWindow: BrowserWindow) => {
  // 图标路径（开发环境和生产环境）
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'build', 'icon.png')
    : path.join(__dirname, '../../build/icon.png')
  
  try {
    tray = new Tray(iconPath)
  } catch (error) {
    console.error('Failed to create tray:', error)
    return
  }
  
  // 创建右键菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      },
    },
    {
      label: '设置',
      click: () => {
        mainWindow.webContents.send('open-settings')
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit()
      },
    },
  ])
  
  tray.setToolTip('桌面宠物 - 灵感助手')
  tray.setContextMenu(contextMenu)
  
  // 点击托盘图标切换窗口显示
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

/**
 * 销毁系统托盘
 */
export const destroyTray = () => {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
