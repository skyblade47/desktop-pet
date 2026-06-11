import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store/useStore'
import { useLocalModel } from '../hooks/useLocalModel'

interface SettingsPanelProps {
  /** 关闭回调 */
  onClose: () => void
}

/**
 * 设置面板组件
 * 使用与AI写作教练一致的木板风格设计
 */
const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  // 表单状态
  const [modelApiUrl, setModelApiUrl] = useState('')
  const [modelApiKey, setModelApiKey] = useState('')
  const [modelName, setModelName] = useState('')
  const [bartenderUrl, setBartenderUrl] = useState('')
  
  // 连接状态
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [connectionMessage, setConnectionMessage] = useState('')

  // 从store获取配置
  const { config, setConfig } = useAppStore(state => ({
    config: state.config,
    setConfig: state.setConfig
  }))

  // 本地模型
  const { testConnection } = useLocalModel()

  // 初始化表单值
  useEffect(() => {
    if (config) {
      setModelApiUrl(config.modelApi.baseUrl)
      setModelApiKey(config.modelApi.apiKey)
      setModelName(config.modelApi.modelName)
      setBartenderUrl(config.syncApi.inspirationBartenderUrl)
    }
  }, [config])

  // 测试连接
  const handleTestConnection = async () => {
    setConnectionStatus('testing')
    setConnectionMessage('正在测试连接...')
    
    try {
      const result = await testConnection()
      if (result) {
        setConnectionStatus('success')
        setConnectionMessage('连接成功！')
      } else {
        setConnectionStatus('error')
        setConnectionMessage('连接失败，请检查配置')
      }
    } catch (error) {
      setConnectionStatus('error')
      setConnectionMessage('连接失败：' + (error as Error).message)
    }

    // 3秒后重置状态
    setTimeout(() => {
      setConnectionStatus('idle')
      setConnectionMessage('')
    }, 3000)
  }

  // 保存配置
  const handleSave = () => {
    setConfig({
      modelApi: {
        baseUrl: modelApiUrl,
        apiKey: modelApiKey,
        modelName: modelName,
      },
      syncApi: {
        inspirationBartenderUrl: bartenderUrl,
      },
    })
    onClose()
  }

  return (
    <>
      {/* 遮罩层 */}
      <div className="overlay" onClick={onClose} />
      
      {/* 设置面板 */}
      <div className="settings-panel">
        {/* 头部 */}
        <div className="settings-header">
          <span>⚙️ 设置</span>
          <button className="settings-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* 内容 */}
        <div className="settings-content">
          {/* 本地模型配置 */}
          <div className="settings-section">
            <div className="settings-section-title">🤖 本地模型配置</div>
            
            <div className="settings-field">
              <label className="settings-label">API 地址</label>
              <input
                type="text"
                className="settings-input"
                value={modelApiUrl}
                onChange={(e) => setModelApiUrl(e.target.value)}
                placeholder="http://localhost:11434/v1"
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">API 密钥</label>
              <input
                type="password"
                className="settings-input"
                value={modelApiKey}
                onChange={(e) => setModelApiKey(e.target.value)}
                placeholder="ollama"
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">模型名称</label>
              <input
                type="text"
                className="settings-input"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="llama3.2"
              />
            </div>

            <div className="settings-field">
              <button
                className="settings-btn settings-btn-secondary"
                onClick={handleTestConnection}
                disabled={connectionStatus === 'testing'}
              >
                {connectionStatus === 'testing' ? '测试中...' : '测试连接'}
              </button>
              
              {connectionMessage && (
                <div className={`settings-status ${connectionStatus}`} style={{ marginTop: '8px' }}>
                  {connectionStatus === 'success' && '✓ '}
                  {connectionStatus === 'error' && '✗ '}
                  {connectionMessage}
                </div>
              )}
            </div>
          </div>

          {/* 同步配置 */}
          <div className="settings-section">
            <div className="settings-section-title">🔗 同步配置</div>
            
            <div className="settings-field">
              <label className="settings-label">灵感调酒师地址</label>
              <input
                type="text"
                className="settings-input"
                value={bartenderUrl}
                onChange={(e) => setBartenderUrl(e.target.value)}
                placeholder="http://localhost:3000"
              />
              <small style={{ fontSize: '11px', color: 'var(--board-medium)', marginTop: '4px', display: 'block' }}>
                用于将灵感同步到灵感调酒师
              </small>
            </div>
          </div>

          {/* 关于 */}
          <div className="settings-section">
            <div className="settings-section-title">ℹ️ 关于</div>
            <div style={{ fontSize: '12px', color: 'var(--board-medium)' }}>
              <p>桌面宠物 - 灵感助手</p>
              <p style={{ marginTop: '4px' }}>版本 0.1.0</p>
              <p style={{ marginTop: '8px', opacity: 0.7 }}>
                连接本地 AI 模型，帮助您记录和完善灵感
              </p>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="settings-footer">
          <button
            className="settings-btn settings-btn-secondary"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="settings-btn settings-btn-primary"
            onClick={handleSave}
          >
            保存
          </button>
        </div>
      </div>
    </>
  )
}

export default SettingsPanel