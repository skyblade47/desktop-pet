import React, { useState } from 'react'
import StageControls from '../components/pet-v2/StageControls'
import V2PetStage from '../components/pet-v2/V2PetStage'
import { DEFAULT_V2_STAGE_PARAMS, type V2StageParams } from '../components/pet-v2/types'

const V2Preview: React.FC = () => {
  const [params, setParams] = useState<V2StageParams>(DEFAULT_V2_STAGE_PARAMS)

  return (
    <main className="v2-preview-page">
      <section className="v2-preview-hero">
        <div>
          <p className="v2-preview-kicker">Desktop Pet V2 Preview</p>
          <h1>水滴球体阶段</h1>
          <p>
            当前只验证透明水滴球体。V1 桌宠保持不变，墨迹、眼睛、交互和业务功能均未接入。
          </p>
        </div>
      </section>

      <section className="v2-preview-workbench">
        <V2PetStage params={params} />
        <StageControls params={params} onChange={setParams} />
      </section>
    </main>
  )
}

export default V2Preview
