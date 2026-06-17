import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import FloatingWidget from './components/FloatingWidget'
import ChatWindow from './components/ChatWindow'
import SettingsPanel from './components/SettingsPanel'
import { useAppStore } from './store/useStore'

/**
 * 桌面宠物主应用组件
 * 使用墨滴桌宠形象和木板风格设计
 */
const App: React.FC = () => {
  // 聊天窗口状态
  const [isChatOpen, setIsChatOpen] = useState(false)

  // 设置面板状态
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // 初始化应用状态
  const initApp = useAppStore((state) => state.initialize)

  // 初始化
  useEffect(() => {
    initApp()
  }, [initApp])

  // 点击桌宠
  const handlePetClick = () => {
    setIsChatOpen(!isChatOpen)
  }

  // 右键点击桌宠
  const handlePetRightClick = () => {
    setIsSettingsOpen(true)
  }

  return (
    <div className="app">
      {/* 浮动桌宠 */}
      <FloatingWidget
        onClick={handlePetClick}
        onRightClick={handlePetRightClick}
      />

      {/* 聊天窗口 */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <ChatWindow onClose={() => setIsChatOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 设置面板 */}
      <AnimatePresence>{isSettingsOpen && <SettingsPanel onClose={() => setIsSettingsOpen(false)} />}</AnimatePresence>
    </div>
  )
}

export default App
