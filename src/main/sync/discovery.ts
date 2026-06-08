/**
 * 设备发现模块 - 使用 mDNS/Zeroconf
 * 桌面宠物版本
 */

import { SyncDevice } from './types'

const SERVICE_TYPE = '_ai-writing-sync._tcp.local.'

export class DeviceDiscovery {
  private devices: SyncDevice[] = []
  private browser: any = null
  private advertiser: any = null
  private serviceName: string = ''
  private port: number = 0

  /**
   * 启动发现服务
   */
  async start(type: string, name: string, port: number): Promise<void> {
    this.serviceName = `${name}.${SERVICE_TYPE}`
    this.port = port

    try {
      // 动态导入 bonjour 库
      const bonjour = await import('bonjour')
      const service = bonjour()

      // 发布自身服务
      this.advertiser = service.publish({
        name: name,
        type: SERVICE_TYPE,
        port: port,
        txt: {
          version: '1.0.0',
          type: type,
          name: name,
          port: port.toString(),
        },
      })

      // 监听服务
      this.browser = service.find({ type: SERVICE_TYPE }, (serviceInfo: any) => {
        this.handleService(serviceInfo)
      })

      this.browser.on('up', (serviceInfo: any) => {
        this.handleService(serviceInfo)
      })

      this.browser.on('down', (serviceInfo: any) => {
        this.removeDevice(serviceInfo)
      })

      console.log('[DeviceDiscovery] Started, publishing:', this.serviceName)
    } catch (error) {
      console.error('[DeviceDiscovery] Failed to start:', error)
      throw error
    }
  }

  /**
   * 停止发现服务
   */
  stop(): void {
    if (this.advertiser) {
      this.advertiser.stop()
      this.advertiser = null
    }

    if (this.browser) {
      this.browser.stop()
      this.browser = null
    }

    this.devices = []
    console.log('[DeviceDiscovery] Stopped')
  }

  /**
   * 处理发现的服务
   */
  private handleService(serviceInfo: any): void {
    const ip = serviceInfo.addresses?.[0] || serviceInfo.host
    if (!ip) return

    const device: SyncDevice = {
      id: `${ip}:${serviceInfo.port}`,
      name: serviceInfo.name || 'Unknown',
      type: serviceInfo.txt?.type || 'desktop-pet',
      ip: ip,
      port: serviceInfo.port,
      lastSeen: new Date().toISOString(),
      capabilities: {
        canReceive: true,
        canSend: true,
      },
      version: serviceInfo.txt?.version || '1.0.0',
      url: `http://${ip}:${serviceInfo.port}`,
    }

    // 更新或添加设备
    const existingIndex = this.devices.findIndex((d) => d.id === device.id)
    if (existingIndex >= 0) {
      this.devices[existingIndex] = device
    } else {
      this.devices.push(device)
    }
  }

  /**
   * 移除设备
   */
  private removeDevice(serviceInfo: any): void {
    const ip = serviceInfo.addresses?.[0] || serviceInfo.host
    if (!ip) return

    const id = `${ip}:${serviceInfo.port}`
    this.devices = this.devices.filter((d) => d.id !== id)
  }

  /**
   * 获取设备列表
   */
  getDevices(type?: string): SyncDevice[] {
    if (type) {
      return this.devices.filter((d) => d.type === type)
    }
    return [...this.devices]
  }

  /**
   * 手动添加设备
   */
  addDevice(ip: string, port: number, type: string, name: string): SyncDevice {
    const device: SyncDevice = {
      id: `${ip}:${port}`,
      name: name,
      type: type as SyncDevice['type'],
      ip: ip,
      port: port,
      lastSeen: new Date().toISOString(),
      capabilities: {
        canReceive: true,
        canSend: true,
      },
      version: '1.0.0',
      url: `http://${ip}:${port}`,
    }

    const existingIndex = this.devices.findIndex((d) => d.id === device.id)
    if (existingIndex >= 0) {
      this.devices[existingIndex] = device
    } else {
      this.devices.push(device)
    }

    return device
  }

  /**
   * 获取本机设备信息
   */
  getLocalDevice(): SyncDevice | null {
    return {
      id: `desktop-pet-local`,
      name: this.serviceName.replace(`.${SERVICE_TYPE}`, ''),
      type: 'desktop-pet',
      ip: this.getLocalIP() || '127.0.0.1',
      port: this.port,
      lastSeen: new Date().toISOString(),
      capabilities: {
        canReceive: true,
        canSend: true,
      },
      version: '1.0.0',
      url: `http://${this.getLocalIP() || '127.0.0.1'}:${this.port}`,
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