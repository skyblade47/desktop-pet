import * as fs from 'fs/promises'
import * as path from 'path'

export interface ImportResult {
  success: boolean
  filePath: string
  content?: string
  error?: string
}

export interface ImportOptions {
  merge?: boolean
  encoding?: string
}

const SUPPORTED_EXTENSIONS = ['.md', '.txt', '.docx', '.pdf'] as const

async function readTextFile(filePath: string, encoding = 'utf-8'): Promise<string> {
  return fs.readFile(filePath, { encoding: encoding as BufferEncoding })
}

async function parseDocx(filePath: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mammoth = require('mammoth')
  const result = await mammoth.extractRawText({ path: filePath })
  return result.value
}

async function parsePdf(filePath: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfParse = require('pdf-parse')
  const buffer = await fs.readFile(filePath)
  const data = await pdfParse(buffer)
  return data.text
}

async function importFileByExtension(
  filePath: string,
  ext: string
): Promise<{ content: string } | { error: string }> {
  switch (ext) {
    case '.md':
    case '.txt': {
      const content = await readTextFile(filePath)
      return { content }
    }
    case '.docx': {
      try {
        const content = await parseDocx(filePath)
        return { content }
      } catch {
        return { error: 'Failed to parse docx file. Please ensure docx library is installed.' }
      }
    }
    case '.pdf': {
      try {
        const content = await parsePdf(filePath)
        return { content }
      } catch {
        return { error: 'Failed to parse pdf file. Please ensure pdf-parse library is installed.' }
      }
    }
    default:
      return { error: `Unsupported file extension: ${ext}` }
  }
}

export async function importFile(filePath: string): Promise<ImportResult> {
  try {
    const ext = path.extname(filePath).toLowerCase()

    if (!SUPPORTED_EXTENSIONS.includes(ext as (typeof SUPPORTED_EXTENSIONS)[number])) {
      return {
        success: false,
        filePath,
        error: `Unsupported file type: ${ext}. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`,
      }
    }

    const result = await importFileByExtension(filePath, ext)

    if ('error' in result) {
      return {
        success: false,
        filePath,
        error: result.error,
      }
    }

    return {
      success: true,
      filePath,
      content: result.content,
    }
  } catch (error) {
    return {
      success: false,
      filePath,
      error: (error as Error).message,
    }
  }
}

export async function importBatch(filePaths: string[]): Promise<ImportResult[]> {
  const results = await Promise.all(filePaths.map((filePath) => importFile(filePath)))
  return results
}

export function isSupported(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase()
  return SUPPORTED_EXTENSIONS.includes(ext as (typeof SUPPORTED_EXTENSIONS)[number])
}

export function getSupportedExtensions(): readonly string[] {
  return SUPPORTED_EXTENSIONS
}
