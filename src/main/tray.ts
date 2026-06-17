import { app, Tray, Menu, BrowserWindow } from 'electron'
import path from 'path'

let tray: Tray | null = null

/**
 * 创建系统托盘
 * @param mainWindow 主窗口实例
 */
export const createTray = (mainWindow: BrowserWindow) => {
  // 确定图标路径
  let iconPath: string

  if (app.isPackaged) {
    // 生产环境
    iconPath = path.join(process.resourcesPath, 'build', 'icon.png')
  } else {
    // 开发环境 - 使用正确的路径
    iconPath = path.join(__dirname, '..', '..', 'build', 'icon.png')
  }

  console.log('[Tray] Icon path:', iconPath)

  try {
    tray = new Tray(iconPath)
  } catch (error) {
    console.error('Failed to create tray:', error)
    // 如果图标加载失败，继续运行（托盘不是必需的）
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
