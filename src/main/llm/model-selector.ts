/**
 * 模型选择器 - 根据任务类型选择最佳模型
 */
import { MODEL_CONFIGS, type ModelConfig, type TaskType } from './model-config'

export class ModelSelector {
  private models: ModelConfig[]

  constructor(models: ModelConfig[] = MODEL_CONFIGS) {
    this.models = models
  }

  /**
   * 根据任务类型选择最佳模型
   * @param taskType 任务类型
   * @param context 可选的上下文信息，用于更精细的选择
   * @returns 最佳模型配置
   */
  selectModel(taskType: TaskType, context?: { contextLength?: number; priority?: 'speed' | 'quality' }): ModelConfig {
    const candidates = this.models.filter((m) => m.tasks.includes(taskType))

    if (candidates.length === 0) {
      throw new Error(`没有找到支持任务类型 ${taskType} 的模型`)
    }

    // 如果有上下文信息，进行精细化选择
    if (context) {
      // 优先考虑上下文窗口大小
      if (context.contextLength !== undefined) {
        const contextCandidates = candidates.filter((m) => m.contextWindow >= context.contextLength!)
        if (contextCandidates.length > 0) {
          // 根据优先级进一步筛选
          if (context.priority === 'speed') {
            // 速度优先：选择上下文窗口较大且输出快的模型
            return contextCandidates.sort((a, b) => {
              // 本地模型速度最快
              if (a.provider === 'local' && b.provider !== 'local') return -1
              if (b.provider === 'local' && a.provider !== 'local') return 1
              // 然后按上下文窗口排序
              return b.contextWindow - a.contextWindow
            })[0]
          } else if (context.priority === 'quality') {
            // 质量优先：选择能力强的模型
            return contextCandidates.sort((a, b) => {
              // Claude 质量最高
              if (a.provider === 'claude' && b.provider !== 'claude') return -1
              if (b.provider === 'claude' && a.provider !== 'claude') return 1
              // 然后按上下文窗口排序
              return b.contextWindow - a.contextWindow
            })[0]
          }
        }
      }
    }

    // 默认选择策略：按任务类型返回第一个候选
    return candidates[0]
  }

  /**
   * 获取模型配置
   * @param modelId 模型ID
   * @returns 模型配置，未找到返回 undefined
   */
  getModelConfig(modelId: string): ModelConfig | undefined {
    return this.models.find((m) => m.id === modelId)
  }

  /**
   * 获取所有模型配置
   */
  getAllModels(): ModelConfig[] {
    return [...this.models]
  }

  /**
   * 按任务类型获取所有可用模型
   */
  getModelsByTask(taskType: TaskType): ModelConfig[] {
    return this.models.filter((m) => m.tasks.includes(taskType))
  }
}

// 默认实例
export const modelSelector = new ModelSelector()
