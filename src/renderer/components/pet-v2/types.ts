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
  /** 墨团流动参数 */
  blobFlowEnabled: boolean
  blobFlowCount: number
  blobRepulsion: number
  blobDamping: number
  blobSpring: number
  blobBrownian: number
  /** 表面张力（0-1），越大墨团越倾向于相互靠近形成整体 */
  blobSurfaceTension: number
  /** 合并阈值（0-1），越大墨团越容易合并 */
  blobMergeThreshold: number
  /** 分裂概率（0-1），越大墨团越容易分裂 */
  blobSplitChance: number
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
  blobFlowEnabled: true,
  blobFlowCount: 5,
  blobRepulsion: 0.45,
  blobDamping: 0.3,
  blobSpring: 0.25,
  blobBrownian: 0.12,
  blobSurfaceTension: 0.35,
  blobMergeThreshold: 0.5,
  blobSplitChance: 0.5,
}

export const DEFAULT_V2_STAGE_PARAMS: V2StageParams = {
  backgroundMode: 'dark',
  backgroundIntensity: 0.15,
  sphere: DEFAULT_WATER_SPHERE_PARAMS,
}
