import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, XCircle, Trash2, Sparkles, Clock, Brain } from 'lucide-react'
import type { MemoryPromotionCandidate } from '../../vite-env'

interface MemoryPromotionPanelProps {
  /** 项目ID */
  projectId: string
  /** 关闭回调 */
  onClose: () => void
}

/**
 * 记忆提升面板组件
 * 显示待处理的记忆提升候选，用户可以批准或拒绝
 */
const MemoryPromotionPanel: React.FC<MemoryPromotionPanelProps> = ({ projectId, onClose }) => {
  // 候选列表
  const [candidates, setCandidates] = useState<MemoryPromotionCandidate[]>([])
  // 加载状态
  const [isLoading, setIsLoading] = useState(true)
  // 处理中的ID列表
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  // 获取待处理的候选
  const fetchPendingCandidates = async () => {
    setIsLoading(true)
    try {
      const result = await window.electronAPI.memoryPromotionGetPending(projectId)
      if (result.success && result.candidates) {
        setCandidates(result.candidates)
      }
    } catch (error) {
      console.error('[MemoryPromotionPanel] Failed to fetch candidates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    fetchPendingCandidates()
  }, [projectId])

  // 批准候选
  const handleApprove = async (candidateId: string) => {
    setProcessingIds((prev) => new Set(prev).add(candidateId))
    try {
      const result = await window.electronAPI.memoryPromotionApprove(candidateId)
      if (result.success) {
        setCandidates((prev) => prev.filter((c) => c.id !== candidateId))
      }
    } catch (error) {
      console.error('[MemoryPromotionPanel] Failed to approve candidate:', error)
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(candidateId)
        return next
      })
    }
  }

  // 拒绝候选
  const handleReject = async (candidateId: string) => {
    setProcessingIds((prev) => new Set(prev).add(candidateId))
    try {
      const result = await window.electronAPI.memoryPromotionReject(candidateId)
      if (result.success) {
        setCandidates((prev) => prev.filter((c) => c.id !== candidateId))
      }
    } catch (error) {
      console.error('[MemoryPromotionPanel] Failed to reject candidate:', error)
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(candidateId)
        return next
      })
    }
  }

  // 批量批准所有
  const handleApproveAll = async () => {
    if (candidates.length === 0) return

    setProcessingIds(new Set(candidates.map((c) => c.id)))
    try {
      const ids = candidates.map((c) => c.id)
      const result = await window.electronAPI.memoryPromotionApproveBatch(ids)
      if (result.success) {
        setCandidates([])
      }
    } catch (error) {
      console.error('[MemoryPromotionPanel] Failed to approve all candidates:', error)
    } finally {
      setProcessingIds(new Set())
    }
  }

  // 获取类型标签颜色
  const getTypeColor = (type: MemoryPromotionCandidate['type']) => {
    switch (type) {
      case 'fact':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'character_trait':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'plot_point':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'setting':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'relationship':
        return 'bg-pink-500/20 text-pink-400 border-pink-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  // 获取类型中文名
  const getTypeName = (type: MemoryPromotionCandidate['type']) => {
    switch (type) {
      case 'fact':
        return '事实'
      case 'character_trait':
        return '角色特征'
      case 'plot_point':
        return '情节要点'
      case 'setting':
        return '设定'
      case 'relationship':
        return '关系'
      default:
        return type
    }
  }

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="fixed right-4 top-4 w-[420px] max-h-[80vh] bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700 z-50 flex flex-col"
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">记忆提升</span>
            {candidates.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">
                {candidates.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {candidates.length > 0 && (
              <button
                onClick={handleApproveAll}
                disabled={processingIds.size > 0}
                className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                全部批准
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p>加载中...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Sparkles className="w-12 h-12 mb-4 opacity-50" />
              <p>暂无待处理的记忆提升</p>
              <p className="text-sm mt-2">AI 发现的重要事实和设定将显示在这里</p>
            </div>
          ) : (
            <div className="space-y-3">
              {candidates.map((candidate) => (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gray-800 rounded-xl border border-gray-700"
                >
                  {/* 类型和时间 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 text-xs rounded border ${getTypeColor(candidate.type)}`}>
                      {getTypeName(candidate.type)}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatTime(candidate.createdAt)}
                    </div>
                  </div>

                  {/* 内容 */}
                  <p className="text-gray-200 text-sm mb-3 whitespace-pre-wrap break-words">{candidate.content}</p>

                  {/* 置信度 */}
                  {candidate.confidence !== undefined && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-gray-500">置信度</span>
                      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${candidate.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{Math.round(candidate.confidence * 100)}%</span>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(candidate.id)}
                      disabled={processingIds.has(candidate.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      批准
                    </button>
                    <button
                      onClick={() => handleReject(candidate.id)}
                      disabled={processingIds.has(candidate.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      拒绝
                    </button>
                    <button
                      onClick={() =>
                        window.electronAPI.memoryPromotionDelete(candidate.id).then(() => {
                          setCandidates((prev) => prev.filter((c) => c.id !== candidate.id))
                        })
                      }
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default MemoryPromotionPanel
