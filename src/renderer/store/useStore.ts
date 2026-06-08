import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { 
  AppConfig, 
  ChatState, 
  ConfigState, 
  Inspiration, 
  InspirationState, 
  Message 
} from '../types'

/**
 * 默认应用配置
 */
const defaultConfig: AppConfig = {
  modelApi: {
    baseUrl: 'http://localhost:11434/v1',
    apiKey: 'ollama',
    modelName: 'llama3.2',
  },
  syncApi: {
    inspirationBartenderUrl: 'http://localhost:3000',
  },
}

/**
 * 应用状态管理
 * 组合了聊天状态、配置状态和灵感状态
 */
export const useAppStore = create<ChatState & ConfigState & InspirationState>()(
  persist(
    (set, get) => ({
      // ============================================
      // Chat State
      // ============================================
      
      messages: [],
      isLoading: false,
      
      addMessage: (message: Message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      
      clearMessages: () => set({ messages: [] }),
      
      setIsLoading: (loading: boolean) => set({ isLoading: loading }),

      // ============================================
      // Config State
      // ============================================
      
      config: defaultConfig,
      
      setConfig: (newConfig: Partial<AppConfig>) =>
        set((state) => ({ config: { ...state.config, ...newConfig } })),

      // ============================================
      // Inspiration State
      // ============================================
      
      inspirations: [],
      
      addInspiration: (inspiration: Inspiration) =>
        set((state) => ({ inspirations: [...state.inspirations, inspiration] })),
      
      updateInspiration: (id: string, updates: Partial<Inspiration>) =>
        set((state) => ({
          inspirations: state.inspirations.map((i) =>
            i.id === id ? { ...i, ...updates } : i
          ),
        })),
      
      deleteInspiration: (id: string) =>
        set((state) => ({
          inspirations: state.inspirations.filter((i) => i.id !== id),
        })),
      
      markAsSynced: (id: string) =>
        set((state) => ({
          inspirations: state.inspirations.map((i) =>
            i.id === id ? { ...i, status: 'synced' } : i
          ),
        })),
    }),
    {
      name: 'desktop-pet-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)