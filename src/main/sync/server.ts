/**
 * 同步服务器模块
 * 桌面宠物版本
 */

import http, { Server, IncomingMessage, ServerResponse } from 'http'
import { SyncDevice, SyncResponse, InfoResponse, InspirationListResponse } from './types'
import { nowISO } from './protocol'

export class SyncServer {
  private server: Server | null = null
  private port: number
  private deviceInfo: SyncDevice
  private onInspirationsReceived: ((
    inspirations: any[],
    source: string
  ) => Promise<SyncResponse>) | null = null

  constructor(
    port: number,
    deviceInfo: SyncDevice,
    onInspirationsReceived: ((inspirations: any[], source: string) => Promise<SyncResponse>) | null
  ) {
    this.port = port
    this.deviceInfo = deviceInfo
    this.onInspirationsReceived = onInspirationsReceived
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(this.handleRequest.bind(this))

      this.server.listen(this.port, () => {
        console.log(`[SyncServer] Listening on port ${this.port}`)
        resolve()
      })

      this.server.on('error', (error) => {
        console.error('[SyncServer] Failed to start:', error)
        reject(error)
      })
    })
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('[SyncServer] Stopped')
          resolve()
        })
        this.server = null
      } else {
        resolve()
      }
    })
  }

  /**
   * 处理 HTTP 请求
   */
  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const { method, url } = req

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    // 处理 OPTIONS 请求
    if (method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    // 路由处理
    if (url === '/api/info' && method === 'GET') {
      this.handleInfo(req, res)
    } else if (url?.startsWith('/api/inspirations')) {
      if (method === 'GET') {
        this.handleGetInspirations(req, res)
      } else if (method === 'POST') {
        this.handlePostInspirations(req, res)
      }
    } else {
      this.handleNotFound(req, res)
    }
  }

  /**
   * 处理 /api/info 请求
   */
  private handleInfo(_req: IncomingMessage, res: ServerResponse): void {
    const response: InfoResponse = {
      device: this.deviceInfo,
      api: {
        version: '1.0.0',
        endpoints: ['/api/info', '/api/inspirations'],
      },
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(response))
  }

  /**
   * 处理 GET /api/inspirations 请求
   */
  private handleGetInspirations(_req: IncomingMessage, res: ServerResponse): void {
    const response: InspirationListResponse = {
      inspirations: [],
      count: 0,
      lastSync: nowISO(),
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(response))
  }

  /**
   * 处理 POST /api/inspirations 请求
   */
  private async handlePostInspirations(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
    })

    req.on('end', async () => {
      try {
        const data = JSON.parse(body)
        const { inspirations, source } = data

        if (!inspirations || !Array.isArray(inspirations)) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Invalid inspirations data' }))
          return
        }

        let result: SyncResponse

        if (this.onInspirationsReceived) {
          result = await this.onInspirationsReceived(inspirations, source || 'unknown')
        } else {
          result = {
            success: true,
            received: inspirations.length,
            processed: inspirations.length,
            conflicts: 0,
            timestamp: nowISO(),
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
      } catch (error) {
        console.error('[SyncServer] Error processing request:', error)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Internal server error' }))
      }
    })
  }

  /**
   * 处理未找到的路由
   */
  private handleNotFound(_req: IncomingMessage, res: ServerResponse): void {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
  }
}