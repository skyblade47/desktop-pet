import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useChat } from '../hooks/useChat'
import type { ChatWindowProps } from '../types'

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  avatar: string
}

type TabType = 'chat' | 'inspirations'

/**
 * 墨滴助手聊天窗口
 * 使用与AI写作教练一致的木板风格设计
 */
const ChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
  // 标签页状态
  const [activeTab, setActiveTab] = useState<TabType>('chat')

  // 消息列表
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', type: 'ai', content: '您好，我是墨滴助手。有什么可以帮助您的？', avatar: '🖤' },
  ])

  // 输入值
  const [inputValue, setInputValue] = useState('')

  // 消息列表滚动引用
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 使用聊天 Hook
  const { messages: chatMessages, isLoading, sendMessage, clearMessages, saveAsInspiration } = useChat()

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // 消息变化时滚动
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // 当 chatMessages 变化时，更新本地消息
  useEffect(() => {
    // 过滤出助手消息并添加到本地消息列表
    const latestAssistant = chatMessages.filter((m) => m.role === 'assistant')
    if (latestAssistant.length > messages.filter((m) => m.type === 'ai').length) {
      const newMessages = latestAssistant.slice(messages.filter((m) => m.type === 'ai').length)
      newMessages.forEach((msg) => {
        setMessages((prev) => [
          ...prev.filter((m) => !m.content.includes('思考中')),
          {
            id: msg.id,
            type: 'ai' as const,
            content: msg.content,
            avatar: '🖤',
          },
        ])
      })
    }
  }, [chatMessages])

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      avatar: '👤',
    }

    setMessages((prev) => [...prev, userMsg])
    const text = inputValue.trim()
    setInputValue('')

    try {
      await sendMessage(text)
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'ai',
          content: '抱歉，连接模型时出错了。请检查设置。',
          avatar: '🖤',
        },
      ])
    }
  }

  // 键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 新建对话
  const handleNewChat = () => {
    setMessages([{ id: 'welcome', type: 'ai', content: '您好，我是墨滴助手。有什么可以帮助您的？', avatar: '🖤' }])
    clearMessages()
    inputRef.current?.focus()
  }

  // 保存灵感
  const handleSaveInspiration = async () => {
    const lastMessage = messages.filter((m) => m.type === 'ai').pop()
    if (lastMessage) {
      await saveAsInspiration(lastMessage.content)
    }
  }

  return (
    <>
      <div className="pet-expand-bubble">
        {/* 头部 */}
        <div className="pet-expand-header">
          <button
            className="pet-expand-close"
            onClick={onClose}
          >
            ×
          </button>
          <span>🖤 墨滴助手</span>
          <div className="pet-expand-actions">
            <button
              className="expand-action-btn"
              onClick={handleNewChat}
            >
              + 新对话
            </button>
          </div>
        </div>

        {/* 标签页 */}
        <div className="pet-expand-tabs">
          <button
            className={`expand-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            ✏️ 对话
          </button>
          <button
            className={`expand-tab ${activeTab === 'inspirations' ? 'active' : ''}`}
            onClick={() => setActiveTab('inspirations')}
          >
            💡 灵感
          </button>
        </div>

        {/* 标签页内容 */}
        <div className="pet-expand-tab-content">
          {activeTab === 'chat' && (
            <>
              <div className="pet-expand-messages">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`pet-expand-msg ${msg.type === 'user' ? 'user' : ''}`}
                  >
                    <div className="pet-expand-avatar">{msg.avatar}</div>
                    <div className="pet-expand-content">{msg.content}</div>
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.type !== 'ai' && (
                  <div className="pet-expand-msg">
                    <div className="pet-expand-avatar">🖤</div>
                    <div className="pet-expand-content">思考中...</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}

          {activeTab === 'inspirations' && (
            <div className="pet-expand-messages">
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--board-medium)' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>💡</div>
                <p style={{ fontSize: '13px' }}>对话结束后保存灵感</p>
                <button
                  onClick={handleSaveInspiration}
                  style={{
                    marginTop: '16px',
                    padding: '8px 16px',
                    background: 'var(--accent-blue)',
                    color: 'var(--paper-white)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  保存最后回复
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 输入区 */}
        <div className="pet-expand-input-area">
          <input
            ref={inputRef}
            type="text"
            className="pet-expand-input"
            placeholder="输入您的问题..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button
            className="pet-expand-send"
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
          >
            ➤
          </button>
        </div>
      </div>
    </>
  )
}

export default ChatWindow
