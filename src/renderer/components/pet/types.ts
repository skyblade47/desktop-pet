import type { CSSProperties } from 'react'

export type PetMood = 'idle' | 'focused' | 'blocked' | 'achievement' | 'rest'

export type InkPetQuality = 'auto' | 'high' | 'low'

export interface MoodConfig {
  rotationSpeed: number
  inkDensity: number
  inkSpread: number
  taijiSpeed: number
  eyeScale: number
  breathingAmp: number
  breathingPeriod: number
}

export interface FpsMonitor {
  times: number[]
  currentFps: number
  degraded: boolean
  trailMax: number
}

export interface InkPetProps {
  mood?: PetMood
  size?: number | string
  quality?: InkPetQuality
  className?: string
  style?: CSSProperties
  onClick?: () => void
}
