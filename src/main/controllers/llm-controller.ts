import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../ipc-channels'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface LLMChatRequest {
  messages: ChatMessage[]
  model?: string
  temperature?: number
}

export const setupLlmHandlers = (): void => {
  ipcMain.handle(IPC_CHANNELS.LLM_CHAT, async (_, _request: LLMChatRequest) => {
    try {
      // TODO: 实现 LLM chat 逻辑
      return { success: true, data: { message: { role: 'assistant', content: 'TODO' } } }
    } catch (error) {
      console.error('[IPC] llm:chat failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.LLM_STREAM_CHAT, async (_, _request: LLMChatRequest) => {
    try {
      // TODO: 实现 LLM stream chat 逻辑
      return { success: true, data: { message: { role: 'assistant', content: 'TODO' } } }
    } catch (error) {
      console.error('[IPC] llm:streamChat failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })
}
