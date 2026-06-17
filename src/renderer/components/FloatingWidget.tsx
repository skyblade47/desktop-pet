import React, { useState } from 'react'
import { motion, AnimatePresence, type TargetAndTransition } from 'framer-motion'

interface FloatingWidgetProps {
  /** 点击回调 */
  onClick: () => void
  /** 右键点击回调 */
  onRightClick: () => void
}

/**
 * 墨滴桌宠浮动组件
 * 使用与AI写作教练一致的墨滴形象和动画
 */
const FloatingWidget: React.FC<FloatingWidgetProps> = ({ onClick, onRightClick }) => {
  // 展开状态
  const [isExpanded, setIsExpanded] = useState(false)

  // 状态文字
  const [statusText, setStatusText] = useState('')
  const [showStatus, setShowStatus] = useState(false)

  // 点击桌宠
  const handleClick = () => {
    setIsExpanded(!isExpanded)
    showTempStatus('嗨！')
    onClick()
  }

  // 右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    onRightClick()
  }

  // 显示临时状态文字
  const showTempStatus = (text: string) => {
    setStatusText(text)
    setShowStatus(true)
    setTimeout(() => setShowStatus(false), 2000)
  }

  // 呼吸动画变体
  const breatheAnimation: TargetAndTransition = {
    scaleY: [1, 1.06, 0.96, 1],
    scaleX: [1, 0.96, 1.04, 1],
    transition: {
      duration: 3.2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  }

  return (
    <>
      {/* 桌宠 */}
      <div className="pet-container">
        <motion.div
          className="pet-avatar"
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          whileTap={{ scale: [1, 1.15, 0.92, 1.05, 1] }}
          animate={breatheAnimation}
        >
          {/* 状态文字 */}
          <AnimatePresence>
            {showStatus && (
              <motion.div
                className="pet-status-text"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
              >
                {statusText}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 墨滴 SVG - 使用纯正的墨黑色 */}
          <svg
            viewBox="0 0 60 55"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient
                id="bodyGrad"
                cx="35%"
                cy="40%"
                r="70%"
              >
                <stop
                  offset="0%"
                  stopColor="#2A2A2A"
                />
                <stop
                  offset="40%"
                  stopColor="#0D0D0D"
                />
                <stop
                  offset="100%"
                  stopColor="#000000"
                />
              </radialGradient>
              <radialGradient
                id="highlightGrad"
                cx="35%"
                cy="30%"
                r="40%"
              >
                <stop
                  offset="0%"
                  stopColor="rgba(255,255,255,0.35)"
                />
                <stop
                  offset="50%"
                  stopColor="rgba(255,255,255,0.08)"
                />
                <stop
                  offset="100%"
                  stopColor="rgba(255,255,255,0)"
                />
              </radialGradient>
            </defs>
            <path
              d="M 30,4 Q 40,8 50,20 Q 56,30 54,40 Q 52,50 45,52 Q 38,55 30,54 Q 22,55 15,52 Q 8,50 6,40 Q 4,30 10,20 Q 20,8 30,4 Z"
              fill="url(#bodyGrad)"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="0.5"
            />
            <ellipse
              cx="20"
              cy="20"
              rx="8"
              ry="6"
              fill="url(#highlightGrad)"
              transform="rotate(-20,20,20)"
            />
            <ellipse
              cx="22"
              cy="33"
              rx="4"
              ry="4.5"
              fill="#ffffff"
            />
            <ellipse
              cx="38"
              cy="33"
              rx="4"
              ry="4.5"
              fill="#ffffff"
            />
            <circle
              cx="23"
              cy="34"
              r="2.2"
              fill="#000000"
            />
            <circle
              cx="39"
              cy="34"
              r="2.2"
              fill="#000000"
            />
            <circle
              cx="24"
              cy="32.5"
              r="0.8"
              fill="#ffffff"
            />
            <circle
              cx="40"
              cy="32.5"
              r="0.8"
              fill="#ffffff"
            />
            <path
              d="M 27,42 Q 30,44 33,42"
              stroke="#000000"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>

          {/* 展开指示器 */}
          <AnimatePresence>
            {!isExpanded && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  width: '16px',
                  height: '16px',
                  background: 'var(--accent-orange)',
                  borderRadius: '50%',
                  border: '2px solid var(--paper-white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                ✨
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  )
}

export default FloatingWidget
