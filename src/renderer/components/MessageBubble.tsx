import React from 'react'
import type { MessageBubbleProps } from '../types'

/**
 * 消息气泡组件
 * 显示单条聊天消息
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  // 判断是否为用户消息
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-tr-sm'
            : 'bg-gray-800 text-gray-100 rounded-tl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p className="text-xs opacity-60 mt-1 text-right">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}

export default MessageBubble