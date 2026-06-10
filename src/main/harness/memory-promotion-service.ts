import { v4 as uuidv4 } from 'uuid'
import log from 'electron-log'
import {
  createMemoryPromotionCandidate,
  getMemoryPromotionCandidates,
  getMemoryPromotionCandidate,
  updateMemoryPromotionCandidate,
  deleteMemoryPromotionCandidate,
  createKnowledgeItem,
} from '../database'

export interface MemoryPromotionCandidate {
  id: string
  projectId: string
  type: 'fact' | 'character_trait' | 'plot_point' | 'setting' | 'relationship'
  content: string
  sourceBlockId?: string | null
  sourceAgent?: string | null
  confidence?: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: number
}

const MEMORY_TYPES = ['fact', 'character_trait', 'plot_point', 'setting', 'relationship'] as const
type MemoryType = (typeof MEMORY_TYPES)[number]

export class MemoryPromotionService {
  /**
   * Create a candidate for memory promotion
   * Called by AI agents when they discover important facts/settings
   */
  createCandidate(data: {
    projectId: string
    type: MemoryType
    content: string
    sourceBlockId?: string
    sourceAgent?: string
    confidence?: number
  }): MemoryPromotionCandidate {
    const id = `mp_${uuidv4()}`
    const now = Date.now()

    createMemoryPromotionCandidate({
      id,
      projectId: data.projectId,
      type: data.type,
      content: data.content,
      sourceBlockId: data.sourceBlockId,
      sourceAgent: data.sourceAgent,
      confidence: data.confidence ?? 0.5,
    })

    log.info(`[MemoryPromotion] Created candidate ${id} for project ${data.projectId}`)

    return {
      id,
      projectId: data.projectId,
      type: data.type,
      content: data.content,
      sourceBlockId: data.sourceBlockId,
      sourceAgent: data.sourceAgent,
      confidence: data.confidence ?? 0.5,
      createdAt: now,
      status: 'pending',
    }
  }

  /**
   * Get all pending candidates for a project
   */
  getPendingCandidates(projectId: string): MemoryPromotionCandidate[] {
    const rows = getMemoryPromotionCandidates(projectId, 'pending')
    return rows.map(this.deserialize)
  }

  /**
   * Get all candidates (any status) for a project
   */
  getAllCandidates(projectId: string): MemoryPromotionCandidate[] {
    const rows = getMemoryPromotionCandidates(projectId)
    return rows.map(this.deserialize)
  }

  /**
   * Approve a candidate - promote to knowledge base
   */
  async approveCandidate(candidateId: string): Promise<{
    success: boolean
    error?: string
    knowledgeItemId?: string
  }> {
    const candidate = getMemoryPromotionCandidate(candidateId)
    if (!candidate) {
      return { success: false, error: 'Candidate not found' }
    }

    if (candidate.status !== 'pending') {
      return { success: false, error: 'Candidate already reviewed' }
    }

    try {
      // Determine target knowledge base based on type
      const knowledgeType = this.mapToKnowledgeType(candidate.type)

      // Create knowledge item
      const knowledgeItemId = await this.promoteToKnowledge({
        projectId: candidate.projectId,
        type: knowledgeType,
        title: this.extractTitle(candidate.content),
        content: candidate.content,
        sourceBlockId: candidate.sourceBlockId ?? undefined,
      })

      // Update candidate status
      updateMemoryPromotionCandidate(candidateId, {
        status: 'approved',
        reviewedAt: Date.now(),
        reviewedBy: 'user',
      })

      log.info(`[MemoryPromotion] Approved candidate ${candidateId} -> knowledge ${knowledgeItemId}`)

      return { success: true, knowledgeItemId }
    } catch (err) {
      log.error('[MemoryPromotion] Failed to approve candidate:', err)
      return { success: false, error: (err as Error).message }
    }
  }

  /**
   * Reject a candidate
   */
  rejectCandidate(candidateId: string): void {
    updateMemoryPromotionCandidate(candidateId, {
      status: 'rejected',
      reviewedAt: Date.now(),
      reviewedBy: 'user',
    })
    log.info(`[MemoryPromotion] Rejected candidate ${candidateId}`)
  }

  /**
   * Batch approve candidates
   */
  async approveCandidates(candidateIds: string[]): Promise<{
    success: number
    failed: number
  }> {
    let success = 0
    let failed = 0

    for (const id of candidateIds) {
      const result = await this.approveCandidate(id)
      if (result.success) success++
      else failed++
    }

    return { success, failed }
  }

  /**
   * Delete candidate (cleanup)
   */
  deleteCandidate(candidateId: string): void {
    deleteMemoryPromotionCandidate(candidateId)
  }

  private mapToKnowledgeType(memoryType: string): string {
    switch (memoryType) {
      case 'fact':
        return 'fact'
      case 'character_trait':
        return 'fact'
      case 'plot_point':
        return 'fact'
      case 'setting':
        return 'setting'
      case 'relationship':
        return 'relationship'
      default:
        return 'fact'
    }
  }

  private extractTitle(content: string): string {
    // Extract first sentence or first 50 chars as title
    const firstSentence = content.split(/[.。!！?？]/)[0]
    return firstSentence.slice(0, 50) + (firstSentence.length > 50 ? '...' : '')
  }

  private async promoteToKnowledge(data: {
    projectId: string
    type: string
    title: string
    content: string
    sourceBlockId?: string
  }): Promise<string> {
    const id = `ki_${uuidv4()}`

    createKnowledgeItem({
      id,
      projectId: data.projectId,
      type: data.type,
      title: data.title,
      content: data.content,
      importance: 'medium',
      verified: true,
      metadata: JSON.stringify({ source: 'memory_promotion', sourceBlockId: data.sourceBlockId }),
    })

    return id
  }

  private deserialize(row: {
    id: string
    projectId: string
    type: string
    content: string
    sourceBlockId: string | null
    sourceAgent: string | null
    confidence: number
    status: string
    createdAt: number
  }): MemoryPromotionCandidate {
    return {
      id: row.id,
      projectId: row.projectId,
      type: row.type as MemoryPromotionCandidate['type'],
      content: row.content,
      sourceBlockId: row.sourceBlockId,
      sourceAgent: row.sourceAgent,
      confidence: row.confidence,
      createdAt: row.createdAt,
      status: row.status as MemoryPromotionCandidate['status'],
    }
  }
}

export const memoryPromotionService = new MemoryPromotionService()
