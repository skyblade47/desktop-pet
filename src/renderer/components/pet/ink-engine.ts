/**
 * 桌宠 V2 — 墨丝曲线引擎 (P1)
 *
 * 核心职责：管理墨丝的生成、物理模拟、生命周期和渲染。
 * 所有颜色均通过 gray() 工厂函数约束 R=G=B，杜绝暖/冷色偏移。
 */

import { gray, validateGrayscale } from './color-palette'

// ==========================================
// P1-1: 墨丝轨迹数据结构
// ==========================================

export interface BezierSegment {
  x1: number
  y1: number
  cp1x: number
  cp1y: number
  cp2x: number
  cp2y: number
  x2: number
  y2: number
}

export type TrailPhase = 'birth' | 'growing' | 'stable' | 'fading' | 'dead'

export interface InkTrail {
  id: number
  segments: BezierSegment[]
  birth: number
  life: number
  phase: TrailPhase
  progress: number
  spiralAngle: number
  originX: number
  originY: number
  maxWidth: number
  segmentCount: number
  baseDistance: number
  rotationOffset: number
}

// ==========================================
// P1-2: 墨丝生成器
// ==========================================

let nextTrailId = 0

export interface TrailSpawnConfig {
  cx: number
  cy: number
  sphereR: number
  rotationAngle: number
  elapsed: number
}

function seededRandom(seed: number): number {
  const safeSeed = Number.isFinite(seed) ? seed : 0
  const x = Math.sin(safeSeed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export function spawnInkTrail(config: TrailSpawnConfig): InkTrail {
  const { cx, cy, sphereR, rotationAngle, elapsed } = config

  const seed = elapsed * 1000 + nextTrailId
  const baseAngle = seededRandom(seed) * Math.PI * 2
  const spiralOffset = Math.PI / 6 + seededRandom(seed + 1) * (Math.PI / 6)
  const emitAngle = rotationAngle + baseAngle + spiralOffset

  const originX = cx + Math.cos(baseAngle) * sphereR * 0.98
  const originY = cy + Math.sin(baseAngle) * sphereR * 0.98

  const life = 3 + seededRandom(seed + 2) * 5
  const segmentCount = 3 + Math.floor(seededRandom(seed + 3) * 4)
  const baseDistance = 50 + seededRandom(seed + 4) * 70
  const maxWidth = 0.3 + seededRandom(seed + 5) * 0.9
  const rotationOffset = seededRandom(seed + 6) * Math.PI * 2

  const segments = buildTrailSegments(originX, originY, emitAngle, baseDistance, segmentCount, 1)

  return {
    id: nextTrailId++,
    segments,
    birth: elapsed,
    life,
    phase: 'birth',
    progress: 0,
    spiralAngle: emitAngle,
    originX,
    originY,
    maxWidth,
    segmentCount,
    baseDistance,
    rotationOffset,
  }
}

// ==========================================
// P1-5: 墨丝螺旋物理
// ==========================================

function valueNoise2D(x: number, y: number, seed: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy

  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)

  const n00 = seededRandom(ix * 37 + iy * 73 + seed * 17)
  const n10 = seededRandom((ix + 1) * 37 + iy * 73 + seed * 17)
  const n01 = seededRandom(ix * 37 + (iy + 1) * 73 + seed * 17)
  const n11 = seededRandom((ix + 1) * 37 + (iy + 1) * 73 + seed * 17)

  const nx0 = n00 + (n10 - n00) * sx
  const nx1 = n01 + (n11 - n01) * sx

  return nx0 + (nx1 - nx0) * sy
}

function fbm(x: number, y: number, seed: number, octaves: number = 3): number {
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxValue = 0

  for (let i = 0; i < octaves; i++) {
    value += amplitude * valueNoise2D(x * frequency, y * frequency, seed + i)
    maxValue += amplitude
    amplitude *= 0.5
    frequency *= 2
  }

  return value / maxValue
}

function buildTrailSegments(
  originX: number,
  originY: number,
  emitAngle: number,
  baseDistance: number,
  count: number,
  growRatio: number
): BezierSegment[] {
  const segments: BezierSegment[] = []
  const segDist = baseDistance / count

  let x1 = originX
  let y1 = originY

  const activeCount = Math.max(1, Math.ceil(count * growRatio))

  for (let i = 0; i < activeCount; i++) {
    const progress = (i + 1) / count
    const spiralTwist = progress * 0.8
    const angle = emitAngle + spiralTwist
    const noise = fbm(x1 * 0.01, y1 * 0.01 + progress * 5, 42, 3)
    const perturbAngle = angle + (noise - 0.5) * 0.4

    const x2 = x1 + Math.cos(perturbAngle) * segDist
    const y2 = y1 + Math.sin(perturbAngle) * segDist

    const cpStrength = segDist * 0.3
    const cp1x = x1 + Math.cos(angle - 0.3) * cpStrength
    const cp1y = y1 + Math.sin(angle - 0.3) * cpStrength
    const cp2x = x2 - Math.cos(perturbAngle + 0.3) * cpStrength
    const cp2y = y2 - Math.sin(perturbAngle + 0.3) * cpStrength

    segments.push({ x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2 })

    x1 = x2
    y1 = y2
  }

  return segments
}

// ==========================================
// P1-4: 墨丝生命周期管理
// ==========================================

const PHASE_THRESHOLDS = {
  birthEnd: 0.08,
  growingEnd: 0.35,
  stableEnd: 0.65,
} as const

const TRAIL_LAYER_SPLIT = 0.4
const TRAIL_MAX_ALPHA = 0.8

export function updateTrail(trail: InkTrail, elapsed: number): TrailPhase {
  const age = elapsed - trail.birth
  trail.progress = Math.min(1, age / trail.life)
  const p = trail.progress

  if (p < PHASE_THRESHOLDS.birthEnd) {
    trail.phase = 'birth'
  } else if (p < PHASE_THRESHOLDS.growingEnd) {
    trail.phase = 'growing'
  } else if (p < PHASE_THRESHOLDS.stableEnd) {
    trail.phase = 'stable'
  } else {
    trail.phase = 'fading'
  }

  if (trail.phase === 'birth' || trail.phase === 'growing') {
    const growRatio = Math.min(1, p / PHASE_THRESHOLDS.growingEnd)
    trail.segments = buildTrailSegments(
      trail.originX,
      trail.originY,
      trail.spiralAngle,
      trail.baseDistance,
      trail.segmentCount,
      growRatio
    )
  }

  if (trail.phase === 'fading') {
    const fadeProgress = (p - PHASE_THRESHOLDS.stableEnd) / (1 - PHASE_THRESHOLDS.stableEnd)
    const shrinkRatio = Math.max(0, 1 - fadeProgress)
    if (shrinkRatio > 0) {
      const visibleCount = Math.max(1, Math.ceil(trail.segmentCount * shrinkRatio))
      trail.segments = trail.segments.slice(0, visibleCount)
    }
  }

  if (trail.progress >= 1) {
    trail.phase = 'dead'
  }

  return trail.phase
}

export function updateTrails(trails: InkTrail[], elapsed: number): InkTrail[] {
  for (const t of trails) {
    updateTrail(t, elapsed)
  }
  return trails.filter((t) => t.phase !== 'dead')
}

// ==========================================
// P1-3: 墨丝渲染器
// ==========================================

function getTrailAlpha(trail: InkTrail): number {
  const p = trail.progress

  if (p < PHASE_THRESHOLDS.birthEnd) {
    return (p / PHASE_THRESHOLDS.birthEnd) * TRAIL_MAX_ALPHA
  }
  if (p < PHASE_THRESHOLDS.stableEnd) {
    return TRAIL_MAX_ALPHA
  }
  const fadeP = (p - PHASE_THRESHOLDS.stableEnd) / (1 - PHASE_THRESHOLDS.stableEnd)
  return TRAIL_MAX_ALPHA * (1 - fadeP)
}

export interface TrailRenderContext {
  ctx: CanvasRenderingContext2D
  layer: 'far' | 'near'
}

function drawTrail(ctx: CanvasRenderingContext2D, trail: InkTrail): void {
  const { segments, maxWidth, id } = trail
  if (segments.length === 0) return

  const alpha = getTrailAlpha(trail)
  if (alpha <= 0.01) return

  const seed = (id * 127 + Math.floor(trail.progress * 100)) % 100
  const widthWobble = 1 + (seededRandom(seed) - 0.5) * 0.3
  const lineWidth = maxWidth * widthWobble

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const segProgress = i / segments.length

    const segAlpha = alpha * (1 - segProgress * 0.7)
    if (segAlpha <= 0.01) continue

    ctx.globalAlpha = segAlpha

    const segWidth = lineWidth * Math.max(0.3, 1 - segProgress * 0.5)
    ctx.lineWidth = segWidth

    const grayValue = Math.round(26 + segProgress * 112)
    ctx.strokeStyle = gray(grayValue, segAlpha)

    ctx.beginPath()
    ctx.moveTo(seg.x1, seg.y1)
    ctx.bezierCurveTo(seg.cp1x, seg.cp1y, seg.cp2x, seg.cp2y, seg.x2, seg.y2)
    ctx.stroke()
  }

  ctx.restore()
}

export function drawTrails(trails: InkTrail[], renderCtx: TrailRenderContext): void {
  const { ctx, layer } = renderCtx

  for (const trail of trails) {
    const isFar = trail.progress < TRAIL_LAYER_SPLIT
    if (layer === 'far' && !isFar) continue
    if (layer === 'near' && isFar) continue
    drawTrail(ctx, trail)
  }
}

// ==========================================
// 墨丝管理器（对外 API）
// ==========================================

export interface InkEngine {
  trails: InkTrail[]
  lastSpawnTime: number
  spawnInterval: number
}

export function createInkEngine(): InkEngine {
  return {
    trails: [],
    lastSpawnTime: 0,
    spawnInterval: 0.5,
  }
}

export function getSpawnInterval(inkDensity: number): number {
  return 0.3 + (1 - inkDensity) * 1.4
}

export function tickInkEngine(
  engine: InkEngine,
  elapsed: number,
  _dt: number,
  spawnConfig: TrailSpawnConfig,
  maxTrails: number = 30
): void {
  if (engine.trails.length < maxTrails && elapsed - engine.lastSpawnTime > engine.spawnInterval) {
    engine.trails.push(spawnInkTrail(spawnConfig))
    engine.lastSpawnTime = elapsed
  }

  engine.trails = updateTrails(engine.trails, elapsed)
}

export function validateEngineColors(): boolean {
  const testColors = [gray(26, 0.8), gray(138, 0.5), gray(192, 0)]
  return testColors.every(validateGrayscale)
}
