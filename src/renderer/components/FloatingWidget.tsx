import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import type { FloatingWidgetProps } from '../types'

/**
 * 浮动小部件组件
 * 可拖动的小球，点击展开聊天窗口
 */
const FloatingWidget: React.FC<FloatingWidgetProps> = ({ onClick, onRightClick }) => {
  // 位置状态
  const [position, setPosition] = useState({ x: 100, y: 100 })
  
  // 拖动状态
  const [isDragging, setIsDragging] = useState(false)
  
  // 拖动偏移量
  const dragOffset = useRef({ x: 0, y: 0 })

  // 鼠标按下
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // 左键
      setIsDragging(true)
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      }
    }
  }

  // 鼠标移动
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      })
    }
  }

  // 鼠标释放
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 点击事件
  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      onClick()
    }
  }

  // 右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    onRightClick()
  }

  // 监听全局鼠标事件
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as any)
      window.addEventListener('mouseup', handleMouseUp)
    } else {
      window.removeEventListener('mousemove', handleMouseMove as any)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove as any)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
      }}
      animate={{
        scale: isDragging ? 1.1 : 1,
      }}
      whileHover={{ scale: 1.05 }}
    >
      <div
        className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl cursor-pointer flex items-center justify-center select-none"
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>
      </div>
    </motion.div>
  )
}

export default FloatingWidget