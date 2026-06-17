import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAppStore } from '../store/useStore'
import { useLocalModel } from './useLocalModel'
import type { UseChatReturn, Message, Inspiration } from '../types'

/**
 * 聊天 Hook
 * 管理聊天消息和灵感保存
 */
export const useChat = (): UseChatReturn => {
  // 从 store 获取状态和方法
  const { messages, isLoading, addMessage, clearMessages, setIsLoading, addInspiration } = useAppStore((state) => state)

  // 使用本地模型
  const { chat } = useLocalModel()

  // 流式输出内容
  const [streamingContent, setStreamingContent] = useState('')

  /**
   * 发送消息
   */
  const sendMessage = useCallback(
    async (content: string) => {
      // 创建用户消息
      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: new Date(),
      }

      // 添加用户消息
      addMessage(userMessage)

      // 设置加载状态
      setIsLoading(true)
      setStreamingContent('')

      // 创建助手消息 ID
      const assistantMessageId = uuidv4()
      let fullResponse = ''

      try {
        // 调用模型
        await chat(
          [
            {
              role: 'system',
              content: '你是一个有帮助的创意写作助手。帮助用户记录和完善灵感。',
            },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content },
          ],
          (chunk) => {
            fullResponse += chunk
            setStreamingContent(fullResponse)
          }
        )

        // 添加助手消息
        if (fullResponse) {
          addMessage({
            id: assistantMessageId,
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date(),
          })
        }
      } catch (error) {
        // 添加错误消息
        addMessage({
          id: assistantMessageId,
          role: 'assistant',
          content: '抱歉，连接模型时出错了。请检查设置。',
          timestamp: new Date(),
        })
      } finally {
        setIsLoading(false)
        setStreamingContent('')
      }
    },
    [messages, addMessage, setIsLoading, chat]
  )

  /**
   * 保存为灵感并同步到灵感调酒师
   */
  const saveAsInspiration = useCallback(
    async (content: string, tags: string[] = []): Promise<Inspiration> => {
      const inspiration: Inspiration = {
        id: uuidv4(),
        content,
        tags,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft',
      }

      // 添加到本地存储
      addInspiration(inspiration)

      // 尝试同步到灵感调酒师
      try {
        const result = await window.electronAPI.syncAddInspiration({
          id: inspiration.id,
          content: inspiration.content,
          tags: inspiration.tags,
        })

        if (result.success) {
          console.log('[useChat] Inspiration synced successfully')
        } else {
          console.log('[useChat] Sync failed, will retry later:', result.error)
        }
      } catch (error) {
        console.log('[useChat] Sync error, will retry:', error)
      }

      return inspiration
    },
    [addInspiration]
  )

  return {
    messages,
    isLoading,
    streamingContent,
    sendMessage,
    clearMessages,
    saveAsInspiration,
  }
}
