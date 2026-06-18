export interface WaterSphereParams {
  radius: number
  transparency: number
  fresnelStrength: number
  highlightStrength: number
  refractionStrength: number
  inkDensity: number
  inkSpread: number
  backlightStrength: number
  breathEnabled: boolean
}

export interface V2StageParams {
  backgroundIntensity: number
  sphere: WaterSphereParams
}

export const DEFAULT_WATER_SPHERE_PARAMS: WaterSphereParams = {
  radius: 1.45,
  transparency: 0.42,
  fresnelStrength: 0.65,
  highlightStrength: 0.75,
  refractionStrength: 0.55,
  inkDensity: 0.7,
  inkSpread: 0.55,
  backlightStrength: 0.48,
  breathEnabled: false,
}

export const DEFAULT_V2_STAGE_PARAMS: V2StageParams = {
  backgroundIntensity: 0.15,
  sphere: DEFAULT_WATER_SPHERE_PARAMS,
}
