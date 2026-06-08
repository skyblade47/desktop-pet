/**
 * 同步服务
 * 负责将灵感数据同步到灵感调酒师
 */
export class SyncService {
  private static instance: SyncService
  
  /**
   * 获取单例实例
   */
  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService()
    }
    return SyncService.instance
  }
  
  /**
   * 将灵感同步到灵感调酒师
   * @param inspiration 灵感数据
   * @param baseUrl 灵感调酒师 API 地址
   * @returns 是否同步成功
   */
  async syncToInspirationBartender(
    inspiration: unknown,
    baseUrl: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`${baseUrl}/api/inspirations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inspiration),
      })
      
      return response.ok
    } catch (error) {
      console.error('Sync failed:', error)
      return false
    }
  }
}
