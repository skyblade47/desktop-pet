import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../ipc-channels'
import { memoryPromotionService } from '../harness/memory-promotion-service'

export const setupMemoryPromotionHandlers = (): void => {
  // 创建记忆提升候选
  ipcMain.handle(
    IPC_CHANNELS.MEMORY_PROMOTION_CREATE,
    (
      _,
      data: {
        projectId: string
        type: 'fact' | 'character_trait' | 'plot_point' | 'setting' | 'relationship'
        content: string
        sourceBlockId?: string
        sourceAgent?: string
        confidence?: number
      }
    ) => {
      try {
        const candidate = memoryPromotionService.createCandidate(data)
        return { success: true, data: candidate }
      } catch (error) {
        console.error('[IPC] memoryPromotion:create failed:', error)
        return { success: false, error: (error as Error).message }
      }
    }
  )

  // 获取待处理的记忆提升候选
  ipcMain.handle(IPC_CHANNELS.MEMORY_PROMOTION_GET_PENDING, (_, projectId: string) => {
    try {
      const candidates = memoryPromotionService.getPendingCandidates(projectId)
      return { success: true, data: candidates }
    } catch (error) {
      console.error('[IPC] memoryPromotion:getPending failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取所有记忆提升候选
  ipcMain.handle(IPC_CHANNELS.MEMORY_PROMOTION_GET_ALL, (_, projectId: string) => {
    try {
      const candidates = memoryPromotionService.getAllCandidates(projectId)
      return { success: true, data: candidates }
    } catch (error) {
      console.error('[IPC] memoryPromotion:getAll failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 批准记忆提升候选
  ipcMain.handle(IPC_CHANNELS.MEMORY_PROMOTION_APPROVE, async (_, candidateId: string) => {
    try {
      const result = await memoryPromotionService.approveCandidate(candidateId)
      return result
    } catch (error) {
      console.error('[IPC] memoryPromotion:approve failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 拒绝记忆提升候选
  ipcMain.handle(IPC_CHANNELS.MEMORY_PROMOTION_REJECT, (_, candidateId: string) => {
    try {
      memoryPromotionService.rejectCandidate(candidateId)
      return { success: true }
    } catch (error) {
      console.error('[IPC] memoryPromotion:reject failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 删除记忆提升候选
  ipcMain.handle(IPC_CHANNELS.MEMORY_PROMOTION_DELETE, (_, candidateId: string) => {
    try {
      memoryPromotionService.deleteCandidate(candidateId)
      return { success: true }
    } catch (error) {
      console.error('[IPC] memoryPromotion:delete failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 批量批准记忆提升候选
  ipcMain.handle(IPC_CHANNELS.MEMORY_PROMOTION_APPROVE_BATCH, async (_, candidateIds: string[]) => {
    try {
      const result = await memoryPromotionService.approveCandidates(candidateIds)
      return { success: true, data: { approvedCount: result.success, failedCount: result.failed } }
    } catch (error) {
      console.error('[IPC] memoryPromotion:approveBatch failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })
}
