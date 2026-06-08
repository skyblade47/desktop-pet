import React, { useState } from 'react'
import FloatingWidget from './components/FloatingWidget'
import ChatWindow from './components/ChatWindow'
import SettingsPanel from './components/SettingsPanel'

/**
 * 主应用组件
 */
function App() {
  // 控制聊天窗口显示
  const [showChat, setShowChat] = useState(false)
  
  // 控制设置面板显示
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="w-full h-full bg-transparent">
      {/* 浮动小部件 */}
      <FloatingWidget
        onClick={() => setShowChat(!showChat)}
        onRightClick={() => setShowSettings(true)}
      />
      
      {/* 聊天窗口 */}
      {showChat && (
        <ChatWindow onClose={() => setShowChat(false)} />
      )}
      
      {/* 设置面板 */}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}

export default App
