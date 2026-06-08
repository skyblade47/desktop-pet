import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, TestTube } from 'lucide-react'
import { useAppStore } from '../store/useStore'
import { useLocalModel } from '../hooks/useLocalModel'
import type { SettingsPanelProps } from '../types'

/**
 * 设置面板组件
 * 配置 API 和同步设置
 */
const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  // 从 store 获取
  const { config, setConfig } = useAppStore((state) => state)
  
  // 使用本地模型 Hook
  const { testConnection, isConnected } = useLocalModel()
  
  // 本地配置状态
  const [localConfig, setLocalConfig] = useState(config)
  
  // 测试结果状态
  const [testResult, setTestResult] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  // 保存配置
  const handleSave = () => {
    setConfig(localConfig)
    onClose()
  }

  // 测试连接
  const handleTestConnection = async () => {
    setTestResult('loading')
    const success = await testConnection()
    setTestResult(success ? 'success' : 'error')
    setTimeout(() => setTestResult('idle'), 2000)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-96 bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700"
        >
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
            <span className="text-white font-medium">设置</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 表单内容 */}
          <div className="p-4 space-y-4">
            {/* API 地址 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                API 地址
              </label>
              <input
                type="text"
                value={localConfig.modelApi.baseUrl}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    modelApi: { ...localConfig.modelApi, baseUrl: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={localConfig.modelApi.apiKey}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    modelApi: { ...localConfig.modelApi, apiKey: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* 模型名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                模型名称
              </label>
              <input
                type="text"
                value={localConfig.modelApi.modelName}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    modelApi: { ...localConfig.modelApi, modelName: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* 测试连接按钮 */}
            <div className="flex gap-2">
              <button
                onClick={handleTestConnection}
                disabled={testResult === 'loading'}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  testResult === 'success'
                    ? 'bg-green-600 text-white'
                    : testResult === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                <TestTube className="w-4 h-4" />
                {testResult === 'loading'
                  ? '测试中...'
                  : testResult === 'success'
                  ? '连接成功'
                  : testResult === 'error'
                  ? '连接失败'
                  : '测试连接'}
              </button>
            </div>

            {/* 分隔线 */}
            <div className="pt-4 border-t border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                灵感调酒师 API 地址
              </label>
              <input
                type="text"
                value={localConfig.syncApi.inspirationBartenderUrl}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    syncApi: {
                      ...localConfig.syncApi,
                      inspirationBartenderUrl: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default SettingsPanel