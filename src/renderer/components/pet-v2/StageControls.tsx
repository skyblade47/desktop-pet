import React from 'react'
import type { V2StageParams, WaterSphereParams } from './types'

interface StageControlsProps {
  params: V2StageParams
  onChange: (params: V2StageParams) => void
}

const clampNumber = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value))
}

const StageControls: React.FC<StageControlsProps> = ({ params, onChange }) => {
  const updateSphere = <K extends keyof WaterSphereParams>(key: K, value: WaterSphereParams[K]) => {
    onChange({
      ...params,
      sphere: { ...params.sphere, [key]: value },
    })
  }

  return (
    <aside className="v2-stage-controls">
      <div className="v2-stage-controls__header">
        <span>桌宠 V2 / P1</span>
        <strong>墨水球体</strong>
      </div>

      <label>
        墨色密度 (inkDensity)
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={params.sphere.inkDensity}
          onChange={(e) => updateSphere('inkDensity', Number(e.target.value))}
        />
      </label>

      <label>
        晕染扩散 (inkSpread)
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={params.sphere.inkSpread}
          onChange={(e) => updateSphere('inkSpread', Number(e.target.value))}
        />
      </label>

      <label>
        高光强度 (specularStrength)
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={params.sphere.highlightStrength}
          onChange={(e) => updateSphere('highlightStrength', Number(e.target.value))}
        />
      </label>

      <label>
        高光锐度 (specPower)
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={params.sphere.refractionStrength}
          onChange={(e) => updateSphere('refractionStrength', Number(e.target.value))}
        />
      </label>

      <label>
        背光透射 (backlight)
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={params.sphere.backlightStrength}
          onChange={(e) => updateSphere('backlightStrength', Number(e.target.value))}
        />
      </label>

      <label>
        球体不透明度
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={params.sphere.transparency}
          onChange={(e) => updateSphere('transparency', Number(e.target.value))}
        />
      </label>

      <label>
        边缘光 (Fresnel)
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={params.sphere.fresnelStrength}
          onChange={(e) => updateSphere('fresnelStrength', Number(e.target.value))}
        />
      </label>

      <label>
        背景明暗
        <input
          type="range"
          min="0"
          max="0.8"
          step="0.01"
          value={params.backgroundIntensity}
          onChange={(e) => onChange({ ...params, backgroundIntensity: clampNumber(Number(e.target.value), 0, 1) })}
        />
      </label>

      <label className="v2-stage-controls__check">
        <input
          type="checkbox"
          checked={params.sphere.breathEnabled}
          onChange={(e) => updateSphere('breathEnabled', e.target.checked)}
        />
        开启呼吸动画
      </label>

      <p className="v2-stage-controls__note">
        Lambert + 背光透射 + Blinn-Phong + Fresnel
        <br />
        墨色密度场模拟左上浓墨/右下淡灰色。
      </p>
    </aside>
  )
}

export default StageControls
