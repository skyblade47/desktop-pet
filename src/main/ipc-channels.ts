// IPC 通道常量定义
// 遵循 domain:action 命名约定

export const IPC_CHANNELS = {
  // 应用
  APP_GET_VERSION: 'app:getVersion',
  APP_PING: 'ping',
  APP_LOG: 'log',

  // 配置
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',

  // 项目
  PROJECT_CREATE: 'project:create',
  PROJECT_OPEN: 'project:open',
  PROJECT_SAVE: 'project:save',

  // 文件系统
  FS_READ_FILE: 'fs:readFile',
  FS_WRITE_FILE: 'fs:writeFile',
  FS_READ_DIR: 'fs:readDir',
  FS_DELETE: 'fs:delete',
  FS_EXISTS: 'fs:exists',

  // LLM
  LLM_CHAT: 'llm:chat',
  LLM_STREAM_CHAT: 'llm:streamChat',

  // 同步
  SYNC_ADD_INSPIRATION: 'sync:addInspiration',
  SYNC_TRIGGER: 'sync:trigger',
  SYNC_GET_DEVICES: 'sync:getDevices',
  SYNC_GET_QUEUE: 'sync:getQueue',
  SYNC_GET_SENT: 'sync:getSent',
  SYNC_SET_INTERVAL: 'sync:setInterval',
  SYNC_GET_CONFIG: 'sync:getConfig',
  SYNC_UPDATE_CONFIG: 'sync:updateConfig',

  // 记忆提升
  MEMORY_PROMOTION_CREATE: 'memoryPromotion:create',
  MEMORY_PROMOTION_GET_PENDING: 'memoryPromotion:getPending',
  MEMORY_PROMOTION_GET_ALL: 'memoryPromotion:getAll',
  MEMORY_PROMOTION_APPROVE: 'memoryPromotion:approve',
  MEMORY_PROMOTION_REJECT: 'memoryPromotion:reject',
  MEMORY_PROMOTION_DELETE: 'memoryPromotion:delete',
  MEMORY_PROMOTION_APPROVE_BATCH: 'memoryPromotion:approveBatch',
} as const

export type IPCChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
