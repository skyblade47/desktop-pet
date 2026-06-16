import { createServer, Server as HttpServer, IncomingMessage, ServerResponse } from 'http'

// MCP 协议类型定义
export interface MCPTool {
  name: string
  description: string
  inputSchema: object
}

export interface MCPRequest {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: object
}

export interface MCPError {
  code: number
  message: string
  data?: unknown
}

export interface MCPResponse {
  jsonrpc: '2.0'
  id: string | number
  result?: object
  error?: MCPError
}

type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>

// MCP 服务实现
class MCPService {
  private tools: Map<string, MCPTool> = new Map()
  private handlers: Map<string, ToolHandler> = new Map()
  private httpServer: HttpServer | null = null

  registerTool(tool: MCPTool, handler: ToolHandler): void {
    this.tools.set(tool.name, tool)
    this.handlers.set(tool.name, handler)
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    const handler = this.handlers.get(name)
    if (!handler) {
      throw new Error(`Tool not found: ${name}`)
    }
    return handler(args)
  }

  listTools(): MCPTool[] {
    return Array.from(this.tools.values())
  }

  private handleRequest(req: MCPRequest): MCPResponse {
    const { method, id } = req

    if (method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: { tools: this.listTools() },
      }
    }

    if (method === 'tools/call') {
      const { name, arguments: args = {} } = req.params as {
        name: string
        arguments?: Record<string, unknown>
      }
      try {
        const result = this.callTool(name, args)
        return {
          jsonrpc: '2.0',
          id,
          result,
        }
      } catch (err) {
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32602,
            message: err instanceof Error ? err.message : 'Internal error',
          },
        }
      }
    }

    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`,
      },
    }
  }

  private handleHttpRequest(req: IncomingMessage, res: ServerResponse): void {
    if (req.method === 'POST' && req.url === '/mcp') {
      let body = ''
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString()
      })
      req.on('end', async () => {
        try {
          const request = JSON.parse(body) as MCPRequest
          const response = this.handleRequest(request)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(response))
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ jsonrpc: '2.0', id: 0, error: { code: -32700, message: 'Parse error' } }))
        }
      })
    } else if (req.method === 'GET' && req.url === '/mcp/tools') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ jsonrpc: '2.0', id: 0, result: { tools: this.listTools() } }))
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ jsonrpc: '2.0', id: 0, error: { code: -32601, message: 'Not found' } }))
    }
  }

  startServer(port: number): HttpServer {
    this.httpServer = createServer((req, res) => {
      this.handleHttpRequest(req, res)
    })
    this.httpServer.listen(port)
    return this.httpServer
  }

  stopServer(): void {
    if (this.httpServer) {
      this.httpServer.close()
      this.httpServer = null
    }
  }
}

// 导出单例
export const mcpService = new MCPService()
