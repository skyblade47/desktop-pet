import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js'

let db: SqlJsDatabase | null = null
let sqlJsInstance: SqlJsStatic | null = null
let initPromise: Promise<SqlJsStatic> | null = null

/**
 * 获取共享 SQL.js 实例
 */
const getSqlJs = async (): Promise<SqlJsStatic> => {
  if (sqlJsInstance) {
    return sqlJsInstance
  }

  if (initPromise) {
    return initPromise
  }

  console.log('[Database] 初始化 SQL.js...')

  initPromise = initSqlJs({
    locateFile: (file) => {
      // 优先从 node_modules 加载
      try {
        const nodeModulesPath = path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist')
        return `file://${path.join(nodeModulesPath, file)}`
      } catch (error) {
        console.warn('[Database] 无法定位 SQL.js 文件:', file)
        return file
      }
    },
  })
    .then((sql) => {
      sqlJsInstance = sql
      console.log('[Database] SQL.js 初始化成功')
      return sql
    })
    .catch((error) => {
      console.error('[Database] SQL.js 初始化失败:', error)
      // 重置，允许下次重试
      initPromise = null
      throw error
    })

  return initPromise
}

/**
 * 初始化数据库
 */
export const initDatabase = async (): Promise<void> => {
  try {
    const SQL = await getSqlJs()

    const userDataPath = app.getPath('userData')
    const dbPath = path.join(userDataPath, 'desktop-pet.db')

    // 如果数据库文件存在，加载它
    if (fs.existsSync(dbPath)) {
      try {
        const fileBuffer = fs.readFileSync(dbPath)
        db = new SQL.Database(fileBuffer)
        console.log('[Database] 数据库加载成功:', dbPath)
      } catch (error) {
        console.error('[Database] 数据库加载失败:', error)
        db = new SQL.Database()
      }
    } else {
      db = new SQL.Database()
      console.log('[Database] 新建数据库:', dbPath)
    }

    // 创建表
    createTables()

    // 保存到文件
    saveDatabase()
  } catch (error) {
    console.error('[Database] 初始化数据库失败:', error)
    // 不抛出错误，让应用继续运行
  }
}

/**
 * 保存数据库到文件
 */
const saveDatabase = (): void => {
  if (!db) return

  try {
    const userDataPath = app.getPath('userData')
    const dbPath = path.join(userDataPath, 'desktop-pet.db')

    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbPath, buffer)
  } catch (error) {
    console.error('[Database] 保存数据库失败:', error)
  }
}

/**
 * 创建所有表
 */
const createTables = (): void => {
  if (!db) return

  try {
    // 项目表
    db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)

    // 知识项表
    db.run(`
      CREATE TABLE IF NOT EXISTS knowledge_items (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        importance TEXT DEFAULT 'medium',
        verified INTEGER DEFAULT 0,
        metadata TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `)

    // 记忆提升候选表
    db.run(`
      CREATE TABLE IF NOT EXISTS memory_promotion_candidates (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        source_block_id TEXT,
        source_agent TEXT,
        confidence REAL DEFAULT 0.5,
        status TEXT DEFAULT 'pending',
        reviewed_at INTEGER,
        reviewed_by TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `)

    // 创建索引
    db.run(`CREATE INDEX IF NOT EXISTS idx_memory_promotion_project ON memory_promotion_candidates(project_id, status)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_knowledge_items_project ON knowledge_items(project_id)`)
  } catch (error) {
    console.error('[Database] 创建表失败:', error)
  }
}

/**
 * 获取数据库实例
 */
export const getDatabase = (): SqlJsDatabase | null => db

// ==================== 项目相关方法 ====================

export const createProject = (data: { id: string; name: string; description?: string }): void => {
  if (!db) return

  const now = Date.now()
  db.run(`INSERT INTO projects (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`, [
    data.id,
    data.name,
    data.description || '',
    now,
    now,
  ])
  saveDatabase()
}

export const getProjects = (): Array<{
  id: string
  name: string
  description: string
  createdAt: number
  updatedAt: number
}> => {
  if (!db) return []

  try {
    const result = db.exec(`SELECT * FROM projects ORDER BY created_at DESC`)
    if (result.length === 0) return []

    return result[0].values.map((row) => ({
      id: row[0] as string,
      name: row[1] as string,
      description: row[2] as string,
      createdAt: row[3] as number,
      updatedAt: row[4] as number,
    }))
  } catch (error) {
    console.error('[Database] getProjects 失败:', error)
    return []
  }
}

export const getProject = (
  id: string
): {
  id: string
  name: string
  description: string
  createdAt: number
  updatedAt: number
} | null => {
  if (!db) return null

  try {
    const result = db.exec(`SELECT * FROM projects WHERE id = ?`, [id])
    if (result.length === 0 || result[0].values.length === 0) return null

    const row = result[0].values[0]
    return {
      id: row[0] as string,
      name: row[1] as string,
      description: row[2] as string,
      createdAt: row[3] as number,
      updatedAt: row[4] as number,
    }
  } catch (error) {
    console.error('[Database] getProject 失败:', error)
    return null
  }
}

// ==================== 知识项相关方法 ====================

export const createKnowledgeItem = (data: {
  id: string
  projectId: string
  type: string
  title: string
  content: string
  importance?: string
  verified?: boolean
  metadata?: string
}): void => {
  if (!db) return

  const now = Date.now()
  db.run(
    `INSERT INTO knowledge_items (id, project_id, type, title, content, importance, verified, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.id,
      data.projectId,
      data.type,
      data.title,
      data.content,
      data.importance || 'medium',
      data.verified ? 1 : 0,
      data.metadata || '{}',
      now,
      now,
    ]
  )
  saveDatabase()
}

export const getKnowledgeItems = (
  projectId: string
): Array<{
  id: string
  projectId: string
  type: string
  title: string
  content: string
  importance: string
  verified: boolean
  metadata: string
  createdAt: number
  updatedAt: number
}> => {
  if (!db) return []

  try {
    const result = db.exec(`SELECT * FROM knowledge_items WHERE project_id = ? ORDER BY created_at DESC`, [projectId])
    if (result.length === 0) return []

    return result[0].values.map((row) => ({
      id: row[0] as string,
      projectId: row[1] as string,
      type: row[2] as string,
      title: row[3] as string,
      content: row[4] as string,
      importance: row[5] as string,
      verified: row[6] === 1,
      metadata: row[7] as string,
      createdAt: row[8] as number,
      updatedAt: row[9] as number,
    }))
  } catch (error) {
    console.error('[Database] getKnowledgeItems 失败:', error)
    return []
  }
}

export const deleteKnowledgeItemsByProject = (projectId: string): void => {
  if (!db) return
  db.run(`DELETE FROM knowledge_items WHERE project_id = ?`, [projectId])
  saveDatabase()
}

// ==================== 记忆提升候选相关方法 ====================

export const createMemoryPromotionCandidate = (data: {
  id: string
  projectId: string
  type: string
  content: string
  sourceBlockId?: string
  sourceAgent?: string
  confidence?: number
}): void => {
  if (!db) return

  const now = Date.now()
  db.run(
    `INSERT INTO memory_promotion_candidates (id, project_id, type, content, source_block_id, source_agent, confidence, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.id,
      data.projectId,
      data.type,
      data.content,
      data.sourceBlockId || null,
      data.sourceAgent || null,
      data.confidence ?? 0.5,
      'pending',
      now,
      now,
    ]
  )
  saveDatabase()
}

export const getMemoryPromotionCandidates = (
  projectId: string,
  status?: string
): Array<{
  id: string
  projectId: string
  type: string
  content: string
  sourceBlockId: string | null
  sourceAgent: string | null
  confidence: number
  status: string
  reviewedAt: number | null
  reviewedBy: string | null
  createdAt: number
  updatedAt: number
}> => {
  if (!db) return []

  try {
    let query = `SELECT * FROM memory_promotion_candidates WHERE project_id = ?`
    const params: (string | number)[] = [projectId]

    if (status) {
      query += ` AND status = ?`
      params.push(status)
    }

    query += ` ORDER BY created_at DESC`

    const result = db.exec(query, params)
    if (result.length === 0) return []

    return result[0].values.map((row) => ({
      id: row[0] as string,
      projectId: row[1] as string,
      type: row[2] as string,
      content: row[3] as string,
      sourceBlockId: row[4] as string | null,
      sourceAgent: row[5] as string | null,
      confidence: row[6] as number,
      status: row[7] as string,
      reviewedAt: row[8] as number | null,
      reviewedBy: row[9] as string | null,
      createdAt: row[10] as number,
      updatedAt: row[11] as number,
    }))
  } catch (error) {
    console.error('[Database] getMemoryPromotionCandidates 失败:', error)
    return []
  }
}

export const getMemoryPromotionCandidate = (
  id: string
): {
  id: string
  projectId: string
  type: string
  content: string
  sourceBlockId: string | null
  sourceAgent: string | null
  confidence: number
  status: string
  reviewedAt: number | null
  reviewedBy: string | null
  createdAt: number
  updatedAt: number
} | null => {
  if (!db) return null

  try {
    const result = db.exec(`SELECT * FROM memory_promotion_candidates WHERE id = ?`, [id])
    if (result.length === 0 || result[0].values.length === 0) return null

    const row = result[0].values[0]
    return {
      id: row[0] as string,
      projectId: row[1] as string,
      type: row[2] as string,
      content: row[3] as string,
      sourceBlockId: row[4] as string | null,
      sourceAgent: row[5] as string | null,
      confidence: row[6] as number,
      status: row[7] as string,
      reviewedAt: row[8] as number | null,
      reviewedBy: row[9] as string | null,
      createdAt: row[10] as number,
      updatedAt: row[11] as number,
    }
  } catch (error) {
    console.error('[Database] getMemoryPromotionCandidate 失败:', error)
    return null
  }
}

export const updateMemoryPromotionCandidate = (
  id: string,
  data: { status: string; reviewedAt: number; reviewedBy: string }
): void => {
  if (!db) return

  const now = Date.now()
  db.run(
    `UPDATE memory_promotion_candidates SET status = ?, reviewed_at = ?, reviewed_by = ?, updated_at = ? WHERE id = ?`,
    [data.status, data.reviewedAt, data.reviewedBy, now, id]
  )
  saveDatabase()
}

export const deleteMemoryPromotionCandidate = (id: string): void => {
  if (!db) return
  db.run(`DELETE FROM memory_promotion_candidates WHERE id = ?`, [id])
  saveDatabase()
}
