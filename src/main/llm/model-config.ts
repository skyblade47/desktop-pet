/**
 * 任务类型枚举
 */
export type TaskType =
  | 'writing' // 写作 - 长上下文，速度优先
  | 'polishing' // 润色 - 高质量，复杂推理
  | 'local' // 本地模型 - 隐私优先
  | 'embedding' // Embedding - 向量化

/**
 * 模型提供商
 */
export type ModelProvider = 'openai' | 'claude' | 'local'

/**
 * 模型配置接口
 */
export interface ModelConfig {
  /** 模型唯一标识 */
  id: string
  /** 模型名称 */
  name: string
  /** 提供商 */
  provider: ModelProvider
  /** 适合的任务类型 */
  tasks: TaskType[]
  /** 最大输出token数 */
  maxTokens: number
  /** 上下文窗口大小 */
  contextWindow: number
  /** 优势 */
  strength: string[]
  /** 劣势 */
  weakness: string[]
}

/**
 * 预设模型配置
 */
export const MODEL_CONFIGS: ModelConfig[] = [
  // 写作模型 - 长上下文，速度优先
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'openai',
    tasks: ['writing'],
    maxTokens: 8192,
    contextWindow: 64000,
    strength: ['长上下文理解', '生成速度快', '成本低'],
    weakness: ['复杂推理能力较弱', '创意稍逊'],
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    tasks: ['writing'],
    maxTokens: 4096,
    contextWindow: 16385,
    strength: ['长上下文理解', '生成速度快', '生态完善'],
    weakness: ['复杂推理能力较弱', '创意稍逊'],
  },
  // 润色模型 - 高质量，复杂推理
  {
    id: 'claude-opus',
    name: 'Claude Opus',
    provider: 'claude',
    tasks: ['polishing'],
    maxTokens: 4096,
    contextWindow: 200000,
    strength: ['高质量输出', '复杂推理能力强', '创意丰富'],
    weakness: ['速度较慢', '成本较高'],
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    tasks: ['polishing'],
    maxTokens: 4096,
    contextWindow: 128000,
    strength: ['高质量输出', '复杂推理能力强', '多语言支持'],
    weakness: ['速度较慢', '成本较高'],
  },
  // 本地模型 - 隐私优先
  {
    id: 'ollama-qwen',
    name: 'Ollama + Qwen',
    provider: 'local',
    tasks: ['local'],
    maxTokens: 4096,
    contextWindow: 8192,
    strength: ['隐私保护', '离线可用', '成本为零'],
    weakness: ['性能受限', '需要本地资源'],
  },
  {
    id: 'ollama-llama',
    name: 'Ollama + Llama',
    provider: 'local',
    tasks: ['local'],
    maxTokens: 4096,
    contextWindow: 8192,
    strength: ['隐私保护', '离线可用', '成本为零'],
    weakness: ['性能受限', '需要本地资源'],
  },
  // Embedding 模型
  {
    id: 'bge-large-zh',
    name: 'BAAI/bge-large-zh',
    provider: 'openai',
    tasks: ['embedding'],
    maxTokens: 512,
    contextWindow: 512,
    strength: ['中文优化', '向量质量高', '开源免费'],
    weakness: ['仅支持中文', '非主流API格式'],
  },
  {
    id: 'text-embedding-3-large',
    name: 'text-embedding-3-large',
    provider: 'openai',
    tasks: ['embedding'],
    maxTokens: 8191,
    contextWindow: 8191,
    strength: ['通用性强', 'API兼容好', '向量维度可定制'],
    weakness: ['中文支持一般', '成本较高'],
  },
]

export type { ModelConfig as ModelConfigType }
