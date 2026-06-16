export type TaskPriority = 'high' | 'normal' | 'low'

export interface Task {
  id: string
  run: () => void | Promise<void>
}

type TaskWithPriority = Task & { priority: TaskPriority; scheduledAt: number }

export class TaskScheduler {
  private queue: TaskWithPriority[] = []
  private isRunning = false
  private defaultBatchSize = 5
  private defaultDelayMs = 50

  schedule(task: Task, priority: TaskPriority = 'normal'): () => void {
    const taskWithPriority: TaskWithPriority = {
      ...task,
      priority,
      scheduledAt: Date.now(),
    }
    this.queue.push(taskWithPriority)
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return a.scheduledAt - b.scheduledAt
    })
    this.process()

    return () => {
      this.cancel(task.id)
    }
  }

  scheduleBatch(
    tasks: Task[],
    batchSize = this.defaultBatchSize,
    delayMs = this.defaultDelayMs
  ): () => void {
    const taskIds = new Set(tasks.map((t) => t.id))
    let currentIndex = 0

    const runNextBatch = async () => {
      if (currentIndex >= tasks.length) return

      const batch = tasks.slice(currentIndex, currentIndex + batchSize)
      currentIndex += batchSize

      const promises = batch.map((task) => Promise.resolve(task.run()))
      await Promise.all(promises)

      if (currentIndex < tasks.length) {
        setTimeout(runNextBatch, delayMs)
      }
    }

    setTimeout(runNextBatch, 0)

    return () => {
      taskIds.forEach((id) => this.cancel(id))
    }
  }

  private cancel(taskId: string): void {
    const index = this.queue.findIndex((t) => t.id === taskId)
    if (index !== -1) {
      this.queue.splice(index, 1)
    }
  }

  private process(): void {
    if (this.isRunning || this.queue.length === 0) return
    this.isRunning = true

    const runTask = async () => {
      const task = this.queue.shift()
      if (!task) {
        this.isRunning = false
        return
      }

      try {
        await Promise.resolve(task.run())
      } catch (error) {
        console.error(`[TaskScheduler] Task ${task.id} failed:`, error)
      }

      if (this.queue.length > 0) {
        setTimeout(runTask, 0)
      } else {
        this.isRunning = false
      }
    }

    setTimeout(runTask, 0)
  }
}
