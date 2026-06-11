/**
 * 同步管理器 - 桌面宠物版本
 * 负责协调设备发现、同步服务器和灵感推送
 */

import { SyncInspiration, SyncDevice, SyncConfig, SyncResponse } from './types'
import { DeviceDiscovery } from './discovery'
import { SyncServer } from './server'
import { toSyncInspiration, nowISO } from './protocol'

const DEFAULT_PORT = 3001

export class SyncManager {
  private static instance: SyncManager

  private discovery: DeviceDiscovery
  private server: SyncServer | null = null
  private config: SyncConfig
  private syncQueue: SyncInspiration[] = []
  private sentInspirations: SyncInspiration[] = []
  private isRunning = false
  private syncInterval: ReturnType<typeof setInterval> | null = null

  // 回调函数
  private onInspirationSynced: ((inspiration: SyncInspiration) => void) | null = null
  private onDevicesChanged: ((devices: SyncDevice[]) => void) | null = null

  private constructor() {
    this.discovery = new DeviceDiscovery()
    this.config = {
      enabled: true,
      autoSync: true,
      syncInterval: 5,
      deviceName: '桌面宠物',
    }
  }

  /**
   * 获取单例
   */
  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  /**
   * 初始化同步服务
   */
  async init(
    config?: Partial<SyncConfig>,
    callbacks?: {
      onInspirationSynced?: (inspiration: SyncInspiration) => void
      onDevicesChanged?: (devices: SyncDevice[]) => void
    }
  ): Promise<void> {
    if (this.isRunning) {
      return
    }

    if (config) {
      this.config = { ...this.config, ...config }
    }

    this.onInspirationSynced = callbacks?.onInspirationSynced || null
    this.onDevicesChanged = callbacks?.onDevicesChanged || null

    try {
      console.log('[SyncManager] Initializing (Desktop Pet)...')

      // 1. 启动设备发现
      await this.discovery.start('desktop-pet', this.config.deviceName, DEFAULT_PORT)

      // 2. 启动同步服务器
      const localIp = this.getLocalIP()
      const deviceInfo: SyncDevice = {
        id: 'desktop-pet',
        name: this.config.deviceName,
        type: 'desktop-pet',
        ip: localIp || '127.0.0.1',
        port: DEFAULT_PORT,
        lastSeen: nowISO(),
        capabilities: {
          canReceive: true,
          canSend: true,
        },
        version: '1.0.0',
        url: `http://${localIp || '127.0.0.1'}:${DEFAULT_PORT}`,
      }

      this.server = new SyncServer(
        DEFAULT_PORT,
        deviceInfo,
        this.handleInspirationsReceived.bind(this)
      )
      await this.server.start()

      // 3. 启动定时同步
      if (this.config.autoSync) {
        this.startSyncInterval()
      }

      this.isRunning = true
      console.log('[SyncManager] Initialized successfully on port', DEFAULT_PORT)
    } catch (error) {
      console.error('[SyncManager] Initialization failed:', error)
      throw error
    }
  }

  /**
   * 关闭同步服务
   */
  async shutdown(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }

    if (this.server) {
      await this.server.stop()
      this.server = null
    }

    this.discovery.stop()
    this.isRunning = false
    console.log('[SyncManager] Shutdown complete')
  }

  /**
   * 添加待同步的灵感
   */
  async addInspirationToSync(
    localInspiration: {
      id: string
      content: string
      tags?: string[]
      chatHistory?: Array<{ role: string; content: string; timestamp: string }>
    }
  ): Promise<SyncInspiration> {
    const syncInspiration = toSyncInspiration(localInspiration)
    this.syncQueue.push(syncInspiration)

    // 如果开启自动同步，立即尝试推送
    if (this.config.autoSync) {
      await this.pushToBartender()
    }

    return syncInspiration
  }

  /**
   * 推送到灵感调酒师
   */
  async pushToBartender(): Promise<void> {
    if (this.syncQueue.length === 0) {
      return
    }

    const bartenders = this.discovery.getDevices('inspiration-bartender')
    if (bartenders.length === 0) {
      console.log('[SyncManager] No inspiration bartender devices found')
      return
    }

    console.log(`[SyncManager] Pushing ${this.syncQueue.length} inspirations...`)

    let allSuccess = true
    for (const target of bartenders) {
      try {
        const result = await this.pushToDevice(target, this.syncQueue)
        if (result.success) {
          // 标记为已同步
          for (const insp of this.syncQueue) {
            insp.syncStatus = 'synced'
            insp.syncHistory.push({
              to: target.name,
              at: nowISO(),
              success: true,
            })
            this.sentInspirations.push(insp)

            // 回调通知
            if (this.onInspirationSynced) {
              this.onInspirationSynced(insp)
            }
          }
          this.syncQueue = []
        }
      } catch (error) {
        console.error(`[SyncManager] Push to ${target.name} failed:`, error)
        allSuccess = false
      }
    }

    // 如果部分成功，清空队列（假设至少一个成功）
    if (!allSuccess && this.syncQueue.length > 0) {
      console.log('[SyncManager] Keeping items in queue for retry')
    }
  }

  /**
   * 推送到指定设备
   */
  private async pushToDevice(
    device: SyncDevice,
    inspirations: SyncInspiration[]
  ): Promise<SyncResponse> {
    const response = await fetch(`${device.url}/api/inspirations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inspirations,
        source: 'desktop-pet',
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  }

  /**
   * 处理接收到的灵感（来自其他设备）
   */
  private async handleInspirationsReceived(
    inspirations: SyncInspiration[],
    source: string
  ): Promise<SyncResponse> {
    console.log(`[SyncManager] Received ${inspirations.length} from ${source}`)

    let processed = 0
    let conflicts = 0

    for (const insp of inspirations) {
      // 检查是否已存在
      const existing = this.sentInspirations.find((i) => i.id === insp.id)
      if (existing) {
        // 冲突处理：时间戳较新的获胜
        if (new Date(insp.updatedAt) > new Date(existing.updatedAt)) {
          const idx = this.sentInspirations.indexOf(existing)
          this.sentInspirations[idx] = insp
          processed++
        } else {
          conflicts++
        }
      } else {
        this.sentInspirations.push(insp)
        processed++
      }
    }

    return {
      success: true,
      received: inspirations.length,
      processed,
      conflicts,
      timestamp: nowISO(),
    }
  }

  /**
   * 启动定时同步
   */
  private startSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    this.syncInterval = setInterval(() => {
      if (this.syncQueue.length > 0) {
        this.pushToBartender().catch(console.error)
      }
    }, this.config.syncInterval * 60 * 1000)

    console.log(`[SyncManager] Auto-sync interval started (${this.config.syncInterval} min)`)
  }

  /**
   * 设置同步间隔
   */
  setSyncInterval(minutes: number): void {
    this.config.syncInterval = minutes
    if (this.config.autoSync && this.isRunning) {
      this.startSyncInterval()
    }
  }

  /**
   * 手动触发同步
   */
  async triggerSync(): Promise<void> {
    await this.pushToBartender()
  }

  /**
   * 获取已发现的设备
   */
  getDiscoveredDevices(): SyncDevice[] {
    const devices = this.discovery.getDevices()
    if (this.onDevicesChanged) {
      this.onDevicesChanged(devices)
    }
    return devices
  }

  /**
   * 获取已发送的灵感
   */
  getSentInspirations(): SyncInspiration[] {
    return [...this.sentInspirations]
  }

  /**
   * 获取待同步队列
   */
  getSyncQueue(): SyncInspiration[] {
    return [...this.syncQueue]
  }

  /**
   * 获取配置
   */
  getConfig(): SyncConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config }
    
    // 如果自动同步状态改变，重新启动定时任务
    if ('autoSync' in config && this.isRunning) {
      if (config.autoSync) {
        this.startSyncInterval()
      } else if (this.syncInterval) {
        clearInterval(this.syncInterval)
        this.syncInterval = null
      }
    }
    
    // 如果同步间隔改变，重新启动定时任务
    if ('syncInterval' in config && this.config.autoSync && this.isRunning) {
      this.startSyncInterval()
    }
  }

  /**
   * 获取本机 IP
   */
  private getLocalIP(): string | null {
    const interfaces = require('os').networkInterfaces()
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address
        }
      }
    }
    return null
  }
}