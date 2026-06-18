/**
 * 桌宠 V2 — 水墨墨球 Canvas 渲染引擎
 *
 * P0 架构：窗口 350×350 / 纯灰度 / 8 层渲染管线 / FPS 自适应降级
 */

import { useEffect, useRef } from 'react'
import { COLORS, ISOLATION_WHITE } from './color-palette'
import {
  createInkEngine,
  tickInkEngine,
  drawTrails,
  getSpawnInterval,
  type InkEngine,
  type InkTrail,
} from './ink-engine'

type PetMood = 'idle' | 'focused' | 'blocked' | 'achievement' | 'rest'

interface MoodConfig {
  rotationSpeed: number
  inkDensity: number
  inkSpread: number
  taijiSpeed: number
  eyeScale: number
  breathingAmp: number
  breathingPeriod: number
}

const MOOD_CONFIGS: Record<PetMood, MoodConfig> = {
  idle: {
    rotationSpeed: 0.3,
    inkDensity: 0.6,
    inkSpread: 0.4,
    taijiSpeed: 0.5,
    eyeScale: 1.0,
    breathingAmp: 0.03,
    breathingPeriod: 6,
  },
  focused: {
    rotationSpeed: 0.5,
    inkDensity: 0.85,
    inkSpread: 0.2,
    taijiSpeed: 0.3,
    eyeScale: 0.9,
    breathingAmp: 0.02,
    breathingPeriod: 4,
  },
  blocked: {
    rotationSpeed: 0.15,
    inkDensity: 0.35,
    inkSpread: 0.7,
    taijiSpeed: 0.8,
    eyeScale: 1.15,
    breathingAmp: 0.05,
    breathingPeriod: 3,
  },
  achievement: {
    rotationSpeed: 1.2,
    inkDensity: 0.9,
    inkSpread: 0.8,
    taijiSpeed: 1.5,
    eyeScale: 0.8,
    breathingAmp: 0.08,
    breathingPeriod: 2,
  },
  rest: {
    rotationSpeed: 0.1,
    inkDensity: 0.2,
    inkSpread: 0.15,
    taijiSpeed: 0.2,
    eyeScale: 1.05,
    breathingAmp: 0.01,
    breathingPeriod: 10,
  },
}

const SPHERE_RADIUS_RATIO = 0.38
const TRAIL_MAX_BASE = 30
const TRAIL_MAX_MIN = 8
const FPS_WINDOW_SIZE = 60
const FPS_DEGRADE_THRESHOLD = 45
const FPS_RESTORE_THRESHOLD = 55
const DEGRADE_POLL_INTERVAL = 2

interface FpsMonitor {
  times: number[]
  currentFps: number
  degraded: boolean
  trailMax: number
}

function createFpsMonitor(): FpsMonitor {
  return { times: [], currentFps: 60, degraded: false, trailMax: TRAIL_MAX_BASE }
}

function updateFpsMonitor(m: FpsMonitor, now: number): void {
  m.times.push(now)
  if (m.times.length > FPS_WINDOW_SIZE) m.times.shift()
  if (m.times.length >= 2) {
    const elapsed = (m.times[m.times.length - 1] - m.times[0]) / 1000
    m.currentFps = elapsed > 0 ? (m.times.length - 1) / elapsed : 60
  }
}

function applyDegradation(m: FpsMonitor): void {
  if (m.degraded && m.currentFps > FPS_RESTORE_THRESHOLD) {
    m.degraded = false
    m.trailMax = Math.min(m.trailMax + 8, TRAIL_MAX_BASE)
  } else if (!m.degraded && m.currentFps < FPS_DEGRADE_THRESHOLD) {
    m.degraded = true
    m.trailMax = Math.max(TRAIL_MAX_MIN, m.trailMax - 8)
  } else if (m.degraded && m.currentFps < FPS_DEGRADE_THRESHOLD) {
    m.trailMax = Math.max(TRAIL_MAX_MIN, m.trailMax - 5)
  }
}

const LIGHT_DIR = { x: -0.55, y: -0.65 }

function drawSphereBody(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, breathing: number): void {
  const effectiveR = r * (1 + breathing)
  const lightX = cx + LIGHT_DIR.x * effectiveR * 0.8
  const lightY = cy + LIGHT_DIR.y * effectiveR * 0.8

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, effectiveR, 0, Math.PI * 2)
  ctx.clip()

  const ambientGrad = ctx.createRadialGradient(cx, cy, effectiveR * 0.3, cx, cy, effectiveR)
  ambientGrad.addColorStop(0, 'rgba(25, 25, 25, 0.15)')
  ambientGrad.addColorStop(0.6, 'rgba(18, 18, 18, 0.25)')
  ambientGrad.addColorStop(1, 'rgba(10, 10, 10, 0.35)')
  ctx.fillStyle = ambientGrad
  ctx.fillRect(cx - effectiveR, cy - effectiveR, effectiveR * 2, effectiveR * 2)

  const diffuseGrad = ctx.createRadialGradient(lightX, lightY, 0, cx, cy, effectiveR * 1.05)
  diffuseGrad.addColorStop(0, 'rgba(60, 60, 60, 0.22)')
  diffuseGrad.addColorStop(0.4, 'rgba(40, 40, 40, 0.12)')
  diffuseGrad.addColorStop(0.75, 'rgba(8, 8, 8, 0.0)')
  diffuseGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)')
  ctx.fillStyle = diffuseGrad
  ctx.fillRect(cx - effectiveR, cy - effectiveR, effectiveR * 2, effectiveR * 2)

  const rimX = cx - LIGHT_DIR.x * effectiveR * 0.5
  const rimY = cy - LIGHT_DIR.y * effectiveR * 0.5
  const rimGrad = ctx.createRadialGradient(cx, cy, effectiveR * 0.75, rimX, rimY, effectiveR * 1.0)
  rimGrad.addColorStop(0, 'rgba(0, 0, 0, 0)')
  rimGrad.addColorStop(0.7, 'rgba(50, 50, 50, 0.06)')
  rimGrad.addColorStop(1, 'rgba(35, 35, 35, 0.12)')
  ctx.fillStyle = rimGrad
  ctx.fillRect(cx - effectiveR, cy - effectiveR, effectiveR * 2, effectiveR * 2)

  ctx.restore()
}

function calcRefractionOffset(x: number, y: number, cx: number, cy: number, r: number): { dx: number; dy: number } {
  if (r <= 0) return { dx: 0, dy: 0 }
  const dist = Math.hypot(x - cx, y - cy)
  if (dist < 0.01) return { dx: 0, dy: 0 }
  const distFromCenter = dist / r
  const refractStrength = distFromCenter * 3.0
  const dirX = (cx - x) / dist
  const dirY = (cy - y) / dist
  return { dx: dirX * refractStrength, dy: dirY * refractStrength }
}

function drawInternalInk(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  time: number,
  config: MoodConfig,
  breathing: number
): void {
  const effectiveR = r * (1 + breathing)

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, effectiveR, 0, Math.PI * 2)
  ctx.clip()

  const taijiAngle = time * config.taijiSpeed * 0.3
  const rawDarkX = cx - effectiveR * 0.22 + Math.sin(taijiAngle) * effectiveR * 0.08
  const rawDarkY = cy - effectiveR * 0.18 + Math.cos(taijiAngle) * effectiveR * 0.08
  const refr = calcRefractionOffset(rawDarkX, rawDarkY, cx, cy, effectiveR)
  const darkX = rawDarkX + refr.dx
  const darkY = rawDarkY + refr.dy

  const darkGrad = ctx.createRadialGradient(darkX, darkY, 0, darkX, darkY, effectiveR * 0.45)
  darkGrad.addColorStop(0, COLORS.denseCore(config.inkDensity))
  darkGrad.addColorStop(0.4, COLORS.denseMid(config.inkDensity))
  darkGrad.addColorStop(1, COLORS.denseEnd)
  ctx.fillStyle = darkGrad
  ctx.fillRect(cx - effectiveR, cy - effectiveR, effectiveR * 2, effectiveR * 2)

  const sAlpha = config.inkDensity * 0.4
  ctx.globalAlpha = sAlpha
  ctx.strokeStyle = COLORS.sLineStroke
  ctx.lineWidth = effectiveR * 0.04

  const cp1 = { x: cx - effectiveR * 0.3, y: cy - effectiveR * 0.45 }
  const cp2 = { x: cx + effectiveR * 0.3, y: cy + effectiveR * 0.45 }
  const cp1Refr = calcRefractionOffset(cp1.x, cp1.y, cx, cy, effectiveR)
  const cp2Refr = calcRefractionOffset(cp2.x, cp2.y, cx, cy, effectiveR)
  const cp1x = cp1.x + cp1Refr.dx
  const cp1y = cp1.y + cp1Refr.dy
  const cp2x = cp2.x + cp2Refr.dx
  const cp2y = cp2.y + cp2Refr.dy

  ctx.beginPath()
  ctx.moveTo(cx - effectiveR * 0.5, cy - effectiveR * 0.25)
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, cx + effectiveR * 0.5, cy + effectiveR * 0.25)
  ctx.stroke()

  for (let i = 0; i < 6; i++) {
    const t = i / 5
    const t2 = t * t
    const sx =
      (1 - t) ** 3 * (cx - effectiveR * 0.5) +
      3 * (1 - t) ** 2 * t * cp1x +
      3 * (1 - t) * t2 * cp2x +
      t ** 3 * (cx + effectiveR * 0.5)
    const sy =
      (1 - t) ** 3 * (cy - effectiveR * 0.25) +
      3 * (1 - t) ** 2 * t * cp1y +
      3 * (1 - t) * t2 * cp2y +
      t ** 3 * (cy + effectiveR * 0.25)
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, effectiveR * 0.1)
    sg.addColorStop(0, COLORS.sLineDot(sAlpha))
    sg.addColorStop(1, COLORS.denseEnd)
    ctx.fillStyle = sg
    ctx.beginPath()
    ctx.arc(sx, sy, effectiveR * 0.08, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalAlpha = 1

  const edgeGrad = ctx.createRadialGradient(cx, cy, effectiveR * 0.85, cx, cy, effectiveR)
  edgeGrad.addColorStop(0, COLORS.edgeStart)
  edgeGrad.addColorStop(1, COLORS.edgeEnd(config.inkSpread))
  ctx.fillStyle = edgeGrad
  ctx.fillRect(cx - effectiveR, cy - effectiveR, effectiveR * 2, effectiveR * 2)

  ctx.restore()
}

function drawEyes(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  time: number,
  mood: PetMood,
  config: MoodConfig
): void {
  const eyeSpacing = r * 0.22
  const eyeY = cy - r * 0.05
  const baseRx = r * 0.16
  const baseRy = r * 0.2
  const scale = config.eyeScale

  const tremor = mood === 'blocked' ? Math.sin(time * 14) * r * 0.025 : 0

  const eyes = [
    { ex: cx - eyeSpacing + tremor, ey: eyeY },
    { ex: cx + eyeSpacing - tremor, ey: eyeY },
  ]

  for (const { ex, ey } of eyes) {
    ctx.save()
    ctx.shadowColor = COLORS.eyeShadow
    ctx.shadowBlur = r * 0.04
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.ellipse(ex, ey, baseRx * scale, baseRy * scale, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

function drawFarTrails(ctx: CanvasRenderingContext2D, trails: InkTrail[]): void {
  drawTrails(trails, { ctx, layer: 'far' })
}

function drawNearTrails(ctx: CanvasRenderingContext2D, trails: InkTrail[]): void {
  drawTrails(trails, { ctx, layer: 'near' })
}

function drawSpecularHighlight(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  breathing: number
): void {
  const effectiveR = r * (1 + breathing)

  const hx = cx - effectiveR * 0.28 + breathing * effectiveR * 0.06
  const hy = cy - effectiveR * 0.22 + breathing * effectiveR * 0.04

  const hrx = effectiveR * 0.18 * (1 + breathing * 0.3)
  const hry = effectiveR * 0.1 * (1 - breathing * 0.2)

  const tilt = -0.25

  ctx.save()
  ctx.translate(hx, hy)
  ctx.rotate(tilt)

  const specGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, hrx)
  specGrad.addColorStop(0, 'rgba(200, 200, 200, 0.55)')
  specGrad.addColorStop(0.3, 'rgba(180, 180, 180, 0.25)')
  specGrad.addColorStop(0.7, 'rgba(140, 140, 140, 0.06)')
  specGrad.addColorStop(1, 'rgba(120, 120, 120, 0)')

  ctx.fillStyle = specGrad
  ctx.beginPath()
  ctx.ellipse(0, 0, hrx, hry, 0, 0, Math.PI * 2)
  ctx.fill()

  const hotGrad = ctx.createRadialGradient(-hrx * 0.15, -hry * 0.15, 0, 0, 0, hrx * 0.35)
  hotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)')
  hotGrad.addColorStop(0.5, 'rgba(230, 230, 230, 0.15)')
  hotGrad.addColorStop(1, 'rgba(200, 200, 200, 0)')

  ctx.fillStyle = hotGrad
  ctx.beginPath()
  ctx.ellipse(-hrx * 0.1, -hry * 0.1, hrx * 0.32, hry * 0.32, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

function drawRefractionEdge(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, breathing: number): void {
  const effectiveR = r * (1 + breathing)
  const insetR = effectiveR - 2.5

  ctx.save()

  const edgeGlow = ctx.createRadialGradient(cx, cy, insetR, cx, cy, effectiveR + 0.5)
  edgeGlow.addColorStop(0, 'rgba(0, 0, 0, 0)')
  edgeGlow.addColorStop(0.5, 'rgba(55, 55, 55, 0.08)')
  edgeGlow.addColorStop(1, 'rgba(70, 70, 70, 0)')

  ctx.fillStyle = edgeGlow
  ctx.beginPath()
  ctx.arc(cx, cy, effectiveR + 0.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

interface RenderContext {
  ctx: CanvasRenderingContext2D
  w: number
  h: number
  cx: number
  cy: number
  r: number
  elapsed: number
  mood: PetMood
  config: MoodConfig
  breathing: number
  rotationAngle: number
  inkEngine: InkEngine
  fpsMon: FpsMonitor
}

function executeRenderPipeline(rc: RenderContext): void {
  const { ctx, w, h, cx, cy, r, elapsed, mood, config, breathing, inkEngine } = rc
  const trails = inkEngine.trails

  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = ISOLATION_WHITE
  ctx.fillRect(0, 0, w, h)

  drawFarTrails(ctx, trails)
  drawSphereBody(ctx, cx, cy, r, breathing)
  drawRefractionEdge(ctx, cx, cy, r, breathing)
  drawInternalInk(ctx, cx, cy, r, elapsed, config, breathing)
  drawNearTrails(ctx, trails)
  drawEyes(ctx, cx, cy, r, elapsed, mood, config)
  drawSpecularHighlight(ctx, cx, cy, r, breathing)
}

interface PetWindowProps {
  onClick?: () => void
}

export function PetWindow({ onClick }: PetWindowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const inkEngineRef = useRef<InkEngine>(createInkEngine())
  const startTimeRef = useRef<number>(performance.now())
  const moodRef = useRef<PetMood>('idle')
  const targetMoodRef = useRef<PetMood>('idle')
  const transitionRef = useRef<number>(1)
  const fpsMonRef = useRef<FpsMonitor>(createFpsMonitor())
  const lastDegradeCheckRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth
      const h = parent.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
    }
    resize()
    window.addEventListener('resize', resize)

    let lastTime = performance.now()

    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now
      const elapsed = (now - startTimeRef.current) / 1000

      updateFpsMonitor(fpsMonRef.current, now)
      if (elapsed - lastDegradeCheckRef.current > DEGRADE_POLL_INTERVAL) {
        applyDegradation(fpsMonRef.current)
        lastDegradeCheckRef.current = elapsed
      }

      if (transitionRef.current < 1) {
        transitionRef.current = Math.min(1, transitionRef.current + dt * 2.5)
      }

      const currentMood = moodRef.current
      const targetMood = targetMoodRef.current
      const cfg = MOOD_CONFIGS[currentMood]
      const tgtConfig = MOOD_CONFIGS[targetMood]
      const t = transitionRef.current

      const lerp = (a: number, b: number) => a + (b - a) * t
      const blended: MoodConfig = {
        rotationSpeed: lerp(cfg.rotationSpeed, tgtConfig.rotationSpeed),
        inkDensity: lerp(cfg.inkDensity, tgtConfig.inkDensity),
        inkSpread: lerp(cfg.inkSpread, tgtConfig.inkSpread),
        taijiSpeed: lerp(cfg.taijiSpeed, tgtConfig.taijiSpeed),
        eyeScale: lerp(cfg.eyeScale, tgtConfig.eyeScale),
        breathingAmp: lerp(cfg.breathingAmp, tgtConfig.breathingAmp),
        breathingPeriod: lerp(cfg.breathingPeriod, tgtConfig.breathingPeriod),
      }

      moodRef.current = t >= 1 ? targetMood : currentMood

      const w = canvas.width / dpr
      const h = canvas.height / dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const cx = w / 2
      const cy = h / 2
      const r = Math.min(w, h) * SPHERE_RADIUS_RATIO
      const rotationAngle = elapsed * blended.rotationSpeed
      const breathing = Math.sin((elapsed / blended.breathingPeriod) * Math.PI * 2) * blended.breathingAmp

      const engine = inkEngineRef.current
      const trailMax = fpsMonRef.current.trailMax
      engine.spawnInterval = getSpawnInterval(blended.inkDensity)
      tickInkEngine(engine, elapsed, dt, { cx, cy, sphereR: r, rotationAngle, elapsed }, trailMax)

      executeRenderPipeline({
        ctx,
        w,
        h,
        cx,
        cy,
        r,
        elapsed,
        mood: moodRef.current,
        config: blended,
        breathing,
        rotationAngle,
        inkEngine: engine,
        fpsMon: fpsMonRef.current,
      })

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div
      style={
        {
          width: '100vw',
          height: '100vh',
          background: 'transparent',
          overflow: 'hidden',
          cursor: onClick ? 'grab' : 'default',
          userSelect: 'none',
          WebkitAppRegion: onClick ? 'drag' : 'no-drag',
        } as React.CSSProperties
      }
      onClick={onClick}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', background: 'transparent' }}
      />
    </div>
  )
}
