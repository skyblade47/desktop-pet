import { useEffect, useRef } from 'react'
import {
  DEGRADE_POLL_INTERVAL,
  FPS_DEGRADE_THRESHOLD,
  FPS_RESTORE_THRESHOLD,
  FPS_WINDOW_SIZE,
  MOOD_CONFIGS,
  SPHERE_RADIUS_RATIO,
  TRAIL_MAX_BASE,
  TRAIL_MAX_MIN,
} from './mood-config'
import { createInkEngine, getSpawnInterval, tickInkEngine, type InkEngine } from './ink-engine'
import { renderInkPetFrame } from './ink-renderer'
import type { FpsMonitor, InkPetProps, MoodConfig, PetMood } from './types'

function createFpsMonitor(quality: InkPetProps['quality']): FpsMonitor {
  if (quality === 'low') return { times: [], currentFps: 60, degraded: true, trailMax: TRAIL_MAX_MIN }
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

function applyDegradation(m: FpsMonitor, quality: InkPetProps['quality']): void {
  if (quality === 'high') {
    m.degraded = false
    m.trailMax = TRAIL_MAX_BASE
    return
  }

  if (quality === 'low') {
    m.degraded = true
    m.trailMax = TRAIL_MAX_MIN
    return
  }

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

function blendMoodConfig(current: MoodConfig, target: MoodConfig, t: number): MoodConfig {
  const lerp = (a: number, b: number) => a + (b - a) * t
  return {
    rotationSpeed: lerp(current.rotationSpeed, target.rotationSpeed),
    inkDensity: lerp(current.inkDensity, target.inkDensity),
    inkSpread: lerp(current.inkSpread, target.inkSpread),
    taijiSpeed: lerp(current.taijiSpeed, target.taijiSpeed),
    eyeScale: lerp(current.eyeScale, target.eyeScale),
    breathingAmp: lerp(current.breathingAmp, target.breathingAmp),
    breathingPeriod: lerp(current.breathingPeriod, target.breathingPeriod),
  }
}

export function InkPet({ mood = 'idle', size = '100%', quality = 'auto', className, style, onClick }: InkPetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const inkEngineRef = useRef<InkEngine>(createInkEngine())
  const startTimeRef = useRef<number>(performance.now())
  const moodRef = useRef<PetMood>(mood)
  const targetMoodRef = useRef<PetMood>(mood)
  const transitionRef = useRef<number>(1)
  const fpsMonRef = useRef<FpsMonitor>(createFpsMonitor(quality))
  const lastDegradeCheckRef = useRef<number>(0)

  useEffect(() => {
    if (targetMoodRef.current !== mood) {
      targetMoodRef.current = mood
      transitionRef.current = 0
    }
  }, [mood])

  useEffect(() => {
    fpsMonRef.current = createFpsMonitor(quality)
  }, [quality])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = window.devicePixelRatio || 1
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
      const dpr = window.devicePixelRatio || 1

      updateFpsMonitor(fpsMonRef.current, now)
      if (elapsed - lastDegradeCheckRef.current > DEGRADE_POLL_INTERVAL) {
        applyDegradation(fpsMonRef.current, quality)
        lastDegradeCheckRef.current = elapsed
      }

      if (transitionRef.current < 1) {
        transitionRef.current = Math.min(1, transitionRef.current + dt * 2.5)
      }

      const currentMood = moodRef.current
      const targetMood = targetMoodRef.current
      const config = MOOD_CONFIGS[currentMood]
      const targetConfig = MOOD_CONFIGS[targetMood]
      const t = transitionRef.current
      const blended = blendMoodConfig(config, targetConfig, t)

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

      renderInkPetFrame({
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
  }, [quality])

  return (
    <div
      className={className}
      style={
        {
          width: size,
          height: size,
          background: 'transparent',
          overflow: 'hidden',
          cursor: onClick ? 'grab' : 'default',
          userSelect: 'none',
          WebkitAppRegion: onClick ? 'drag' : 'no-drag',
          ...style,
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
