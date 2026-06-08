import { useState, useCallback } from 'react'
import { useAppStore } from '../store/useStore'
import type { UseLocalModelReturn, ChatMessage } from '../types'

/**
 * 本地模型 Hook
 * 管理与本地模型的连接和聊天
 */
export const useLocalModel = (): UseLocalModelReturn => {
  // 获取配置
  const config = useAppStore((state) => state.config)
  
  // 连接状态
  const [isConnected, setIsConnected] = useState(false)

  /**
   * 聊天方法
   */
  const chat = useCallback(
    async (
      messages: ChatMessage[],
      onStream?: (chunk: string) => void
    ): Promise<string> => {
      try {
        const response = await fetch(`${config.modelApi.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.modelApi.apiKey}`,
          },
          body: JSON.stringify({
            model: config.modelApi.modelName,
            messages,
            stream: !!onStream,
          }),
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        setIsConnected(true)

        // 流式响应
        if (onStream && response.body) {
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let fullText = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') continue

                try {
                  const parsed = JSON.parse(data)
                  const delta = parsed.choices?.[0]?.delta?.content || ''
                  fullText += delta
                  onStream(delta)
                } catch {
                  // 忽略解析错误
                }
              }
            }
          }

          return fullText
        } else {
          // 非流式响应
          const data = await response.json()
          return data.choices?.[0]?.message?.content || ''
        }
      } catch (error) {
        console.error('Model chat error:', error)
        setIsConnected(false)
        throw error
      }
    },
    [config]
  )

  /**
   * 测试连接
   */
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${config.modelApi.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${config.modelApi.apiKey}`,
        },
      })
      const ok = response.ok
      setIsConnected(ok)
      return ok
    } catch {
      setIsConnected(false)
      return false
    }
  }, [config])

  return { chat, testConnection, isConnected }
}