import { contextBridge, ipcRenderer } from 'electron'

/**
 * 预加载脚本
 * 在渲染进程和主进程之间建立安全的通信桥梁
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * 发送消息到主进程
   */
  sendMessage: (channel: string, data: unknown) => {
    ipcRenderer.send(channel, data)
  },
  
  /**
   * 监听主进程消息
   */
  onMessage: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args))
  },
  
  /**
   * 调用主进程方法并获取返回值
   */
  invoke: (channel: string, data?: unknown) => {
    return ipcRenderer.invoke(channel, data)
  },
})
