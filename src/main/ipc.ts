import {
  setupAppHandlers,
  setupConfigHandlers,
  setupProjectHandlers,
  setupFsHandlers,
  setupLlmHandlers,
  setupSyncHandlers,
  setupMemoryPromotionHandlers,
} from './controllers'

export const setupIPC = (): void => {
  setupAppHandlers()
  setupConfigHandlers()
  setupProjectHandlers()
  setupFsHandlers()
  setupLlmHandlers()
  setupSyncHandlers()
  setupMemoryPromotionHandlers()
}
