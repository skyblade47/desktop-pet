import React from 'react'
import type { V2StageParams, WaterSphereParams } from './types'

interface StageControlsProps {
  params: V2StageParams
  onChange: (params: V2StageParams) => void
}

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}

const SliderRow: React.FC<SliderRowProps> = ({ label, value, min, max, step, onChange }) => (
  <label>
    <span className="v2-stage-controls__label-row">
      {label}
      <span className="v2-stage-controls__value">{step >= 1 ? value.toFixed(0) : value.toFixed(2)}</span>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </label>
)

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

      <SliderRow
        label="墨色密度"
        value={params.sphere.inkDensity}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => updateSphere('inkDensity', v)}
      />

      <SliderRow
        label="晕染扩散"
        value={params.sphere.inkSpread}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => updateSphere('inkSpread', v)}
      />

      <SliderRow
        label="墨团大小"
        value={params.sphere.blobSize}
        min={0.05}
        max={1}
        step={0.01}
        onChange={(v) => updateSphere('blobSize', v)}
      />

      <SliderRow
        label="墨团浓度"
        value={params.sphere.blobDensity}
        min={0.1}
        max={1}
        step={0.01}
        onChange={(v) => updateSphere('blobDensity', v)}
      />

      <SliderRow
        label="高光强度"
        value={params.sphere.highlightStrength}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => updateSphere('highlightStrength', v)}
      />

      <SliderRow
        label="高光锐度"
        value={params.sphere.refractionStrength}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => updateSphere('refractionStrength', v)}
      />

      <SliderRow
        label="背光透射"
        value={params.sphere.backlightStrength}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => updateSphere('backlightStrength', v)}
      />

      <SliderRow
        label="波澜强度"
        value={params.sphere.breathAmplitude}
        min={0}
        max={3}
        step={0.01}
        onChange={(v) => updateSphere('breathAmplitude', v)}
      />

      <SliderRow
        label="气泡密度"
        value={params.sphere.bubbleCount}
        min={0}
        max={30}
        step={1}
        onChange={(v) => updateSphere('bubbleCount', v)}
      />

      <SliderRow
        label="球体不透明度"
        value={params.sphere.transparency}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => updateSphere('transparency', v)}
      />

      <SliderRow
        label="边缘光"
        value={params.sphere.fresnelStrength}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => updateSphere('fresnelStrength', v)}
      />

      {/* ─── 墨团流动物理控制 ─── */}

      <div className="v2-stage-controls__section-header">墨团流动物理</div>

      <label className="v2-stage-controls__checkbox-label">
        <input
          type="checkbox"
          checked={params.sphere.blobFlowEnabled}
          onChange={(e) => updateSphere('blobFlowEnabled', e.target.checked)}
        />
        <span>启用物理流动</span>
      </label>

      {params.sphere.blobFlowEnabled && (
        <>
          <SliderRow
            label="墨团数量"
            value={params.sphere.blobFlowCount}
            min={2}
            max={8}
            step={1}
            onChange={(v) => updateSphere('blobFlowCount', v)}
          />

          <SliderRow
            label="墨团排斥力"
            value={params.sphere.blobRepulsion}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => updateSphere('blobRepulsion', v)}
          />

          <SliderRow
            label="流体阻尼"
            value={params.sphere.blobDamping}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => updateSphere('blobDamping', v)}
          />

          <SliderRow
            label="中心聚合力"
            value={params.sphere.blobSpring}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => updateSphere('blobSpring', v)}
          />

          <SliderRow
            label="布朗扰动"
            value={params.sphere.blobBrownian}
            min={0}
            max={0.5}
            step={0.01}
            onChange={(v) => updateSphere('blobBrownian', v)}
          />

          <SliderRow
            label="表面张力"
            value={params.sphere.blobSurfaceTension}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => updateSphere('blobSurfaceTension', v)}
          />

          <SliderRow
            label="合并阈值"
            value={params.sphere.blobMergeThreshold}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => updateSphere('blobMergeThreshold', v)}
          />

          <SliderRow
            label="分裂概率"
            value={params.sphere.blobSplitChance}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => updateSphere('blobSplitChance', v)}
          />
        </>
      )}

      <div className="v2-stage-controls__mode-switch">
        <span>背景模式</span>
        <div className="v2-stage-controls__mode-buttons">
          <button
            type="button"
            className={params.backgroundMode === 'dark' ? 'is-active' : ''}
            onClick={() => onChange({ ...params, backgroundMode: 'dark' })}
          >
            深色
          </button>
          <button
            type="button"
            className={params.backgroundMode === 'light' ? 'is-active' : ''}
            onClick={() => onChange({ ...params, backgroundMode: 'light' })}
          >
            浅色
          </button>
          <button
            type="button"
            className={params.backgroundMode === 'wood' ? 'is-active' : ''}
            onClick={() => onChange({ ...params, backgroundMode: 'wood' })}
          >
            原木色
          </button>
        </div>
      </div>

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

      <p className="v2-stage-controls__note">
        Lambert + 背光透射 + Blinn-Phong + Fresnel
        <br />
        清澈水球 + 墨核心模式。呼吸为默认基态。
      </p>
    </aside>
  )
}

export default StageControls
