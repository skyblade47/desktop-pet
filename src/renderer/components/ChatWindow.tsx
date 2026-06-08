import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Save, Sparkles } from 'lucide-react'
import MessageBubble from './MessageBubble'
import { useChat } from '../hooks/useChat'
import type { ChatWindowProps } from '../types'

/**
 * 聊天窗口组件
 * 显示对话历史和输入框
 */
const ChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
  // 输入值
  const [inputValue, setInputValue] = useState('')
  
  // 消息列表滚动引用
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 使用聊天 Hook
  const { messages, isLoading, streamingContent, sendMessage, saveAsInspiration } =
    useChat()

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 消息或流式内容变化时滚动
  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent])

  // 发送消息
  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue.trim())
      setInputValue('')
    }
  }

  // 键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 保存最后一条消息为灵感
  const handleSaveLastMessage = () => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage) {
      saveAsInspiration(lastMessage.content)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        className="fixed right-4 top-4 w-96 h-[600px] bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700 z-50"
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">灵感助手</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 h-[460px] bg-gray-900">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Sparkles className="w-12 h-12 mb-4 opacity-50" />
              <p>开始记录你的灵感吧！</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {streamingContent && (
                <div className="flex justify-start mb-4">
                  <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-gray-800 text-gray-100 rounded-tl-sm">
                    <p className="whitespace-pre-wrap break-words">
                      {streamingContent}
                      <span className="animate-pulse">▌</span>
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          {/* 快捷操作 */}
          <div className="flex gap-2 mb-2">
            {messages.length > 0 && (
              <button
                onClick={handleSaveLastMessage}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                保存灵感
              </button>
            )}
          </div>
          
          {/* 输入框和发送按钮 */}
          <div className="flex gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的想法..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ChatWindow