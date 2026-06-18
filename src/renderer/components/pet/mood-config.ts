import type { MoodConfig, PetMood } from './types'

export const MOOD_CONFIGS: Record<PetMood, MoodConfig> = {
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

export const SPHERE_RADIUS_RATIO = 0.38
export const TRAIL_MAX_BASE = 30
export const TRAIL_MAX_MIN = 8
export const FPS_WINDOW_SIZE = 60
export const FPS_DEGRADE_THRESHOLD = 45
export const FPS_RESTORE_THRESHOLD = 55
export const DEGRADE_POLL_INTERVAL = 2
