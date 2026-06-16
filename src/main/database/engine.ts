import { app } from 'electron'
import path from 'path'
import fs from 'fs'

/**
 * 统一数据库引擎接口
 */
export interface DatabaseEngine {
  exec(sql: string): Promise<void>
  run(sql: string, params?: unknown[]): Promise<void>
  get<T>(sql: string, params?: unknown[]): Promise<T | null>
  all<T>(sql: string, params?: unknown[]): Promise<T[]>
  close(): Promise<void>
}

/**
 * 创建 better-sqlite3 引擎（原生，性能优先）
 */
async function createBetterSqlite3Engine(dbPath: string): Promise<DatabaseEngine> {
  // 动态导入 better-sqlite3
  const BetterSqlite3 = (await import('better-sqlite3')).default

  const db = new BetterSqlite3(dbPath)

  console.log('[Database] 使用 better-sqlite3 引擎:', dbPath)

  return {
    exec(sql: string): Promise<void> {
      db.exec(sql)
      return Promise.resolve()
    },

    run(sql: string, params?: unknown[]): Promise<void> {
      db.prepare(sql).run(...(params ?? []))
      return Promise.resolve()
    },

    get<T>(sql: string, params?: unknown[]): Promise<T | null> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stmt = db.prepare(sql) as any
      stmt.bind(params ?? [])
      if (stmt.step()) {
        const row = stmt.getAsObject() as T
        stmt.free()
        return Promise.resolve(row)
      }
      stmt.free()
      return Promise.resolve(null)
    },

    all<T>(sql: string, params?: unknown[]): Promise<T[]> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stmt = db.prepare(sql) as any
      stmt.bind(params ?? [])
      const rows: T[] = []
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as T)
      }
      stmt.free()
      return Promise.resolve(rows)
    },

    close(): Promise<void> {
      db.close()
      return Promise.resolve()
    },
  }
}

/**
 * 创建 sql.js 引擎（WASM，回退方案）
 */
async function createSqlJsEngine(dbPath: string): Promise<DatabaseEngine> {
  const initSqlJs = (await import('sql.js')).default

  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      try {
        const nodeModulesPath = path.join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist')
        return `file://${path.join(nodeModulesPath, file)}`
      } catch {
        return file
      }
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any = null

  // 加载已有数据库或创建新数据库
  if (fs.existsSync(dbPath)) {
    try {
      const fileBuffer = fs.readFileSync(dbPath)
      db = new SQL.Database(fileBuffer)
    } catch {
      db = new SQL.Database()
    }
  } else {
    db = new SQL.Database()
  }

  console.log('[Database] 使用 sql.js 引擎:', dbPath)

  // 保存数据库到文件
  const save = (): void => {
    if (!db) return
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbPath, buffer)
  }

  return {
    exec(sql: string): Promise<void> {
      if (!db) return Promise.resolve()
      db.run(sql)
      save()
      return Promise.resolve()
    },

    run(sql: string, params?: unknown[]): Promise<void> {
      if (!db) return Promise.resolve()
      db.run(sql, params as (string | number | null | Uint8Array)[])
      save()
      return Promise.resolve()
    },

    get<T>(sql: string, params?: unknown[]): Promise<T | null> {
      if (!db) return Promise.resolve(null)
      const stmt = db.prepare(sql)
      if (params) stmt.bind(params as (string | number | null | Uint8Array)[])
      if (stmt.step()) {
        const row = stmt.getAsObject() as T
        stmt.free()
        return Promise.resolve(row)
      }
      stmt.free()
      return Promise.resolve(null)
    },

    all<T>(sql: string, params?: unknown[]): Promise<T[]> {
      if (!db) return Promise.resolve([])
      const stmt = db.prepare(sql)
      if (params) stmt.bind(params as (string | number | null | Uint8Array)[])
      const rows: T[] = []
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as T)
      }
      stmt.free()
      return Promise.resolve(rows)
    },

    close(): Promise<void> {
      if (db) {
        save()
        db.close()
        db = null
      }
      return Promise.resolve()
    },
  }
}

/**
 * 检测 better-sqlite3 是否可用
 */
function isBetterSqlite3Available(): boolean {
  try {
    // better-sqlite3 是原生模块，在 Electron 主进程中可用
    // 通过检查模块是否存在来判断
    require.resolve('better-sqlite3')
    return true
  } catch {
    return false
  }
}

/**
 * 创建数据库引擎
 * 优先使用 better-sqlite3，不可用时回退到 sql.js
 */
export async function createDatabaseEngine(): Promise<DatabaseEngine> {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'desktop-pet.db')

  if (isBetterSqlite3Available()) {
    try {
      return await createBetterSqlite3Engine(dbPath)
    } catch (error) {
      console.warn('[Database] better-sqlite3 初始化失败，回退到 sql.js:', error)
      return await createSqlJsEngine(dbPath)
    }
  }

  console.log('[Database] better-sqlite3 不可用，使用 sql.js')
  return await createSqlJsEngine(dbPath)
}
