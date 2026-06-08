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

  // ========== 同步相关 API ==========

  /**
   * 添加灵感到同步队列
   */
  syncAddInspiration: (inspiration: {
    id: string
    content: string
    tags?: string[]
    chatHistory?: Array<{ role: string; content: string; timestamp: string }>
  }) => {
    return ipcRenderer.invoke('sync-add-inspiration', inspiration)
  },

  /**
   * 手动触发同步
   */
  syncTrigger: () => {
    return ipcRenderer.invoke('sync-trigger')
  },

  /**
   * 获取已发现的设备
   */
  syncGetDevices: () => {
    return ipcRenderer.invoke('sync-get-devices')
  },

  /**
   * 获取同步队列
   */
  syncGetQueue: () => {
    return ipcRenderer.invoke('sync-get-queue')
  },

  /**
   * 获取已发送的灵感
   */
  syncGetSent: () => {
    return ipcRenderer.invoke('sync-get-sent')
  },

  /**
   * 设置同步间隔
   */
  syncSetInterval: (minutes: number) => {
    return ipcRenderer.invoke('sync-set-interval', minutes)
  },
})