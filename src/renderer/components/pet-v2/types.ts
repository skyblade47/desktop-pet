export type BackgroundMode = 'dark' | 'light' | 'wood'

export interface WaterSphereParams {
  radius: number
  transparency: number
  fresnelStrength: number
  highlightStrength: number
  refractionStrength: number
  inkDensity: number
  inkSpread: number
  backlightStrength: number
  breathAmplitude: number
  bubbleCount: number
  blobSize: number
  blobDensity: number
  inkMarksStrength: number
}

export interface V2StageParams {
  backgroundMode: BackgroundMode
  backgroundIntensity: number
  sphere: WaterSphereParams
}

export const DEFAULT_WATER_SPHERE_PARAMS: WaterSphereParams = {
  radius: 1.45,
  transparency: 0.18,
  fresnelStrength: 0.65,
  highlightStrength: 0.75,
  refractionStrength: 0.55,
  inkDensity: 0.22,
  inkSpread: 0.18,
  backlightStrength: 0.48,
  breathAmplitude: 1.85,
  bubbleCount: 12,
  blobSize: 0.72,
  blobDensity: 0.8,
  inkMarksStrength: 0.35,
}

export const DEFAULT_V2_STAGE_PARAMS: V2StageParams = {
  backgroundMode: 'dark',
  backgroundIntensity: 0.15,
  sphere: DEFAULT_WATER_SPHERE_PARAMS,
}
