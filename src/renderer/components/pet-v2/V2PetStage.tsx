import React from 'react'
import { Canvas } from '@react-three/fiber'
import WaterSphere from './WaterSphere'
import type { V2StageParams } from './types'
import * as THREE from 'three'

interface V2PetStageProps {
  params: V2StageParams
}

const V2PetStage: React.FC<V2PetStageProps> = ({ params }) => {
  const background = `rgba(4, 8, 14, ${params.backgroundIntensity})`

  return (
    <div
      className="v2-pet-stage"
      style={{ background }}
    >
      <Canvas
        camera={{ position: [0, 0, 4.8], fov: 42 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.2
          gl.outputColorSpace = THREE.SRGBColorSpace
        }}
        fallback={<div className="v2-preview-fallback">当前环境不支持 WebGL，无法显示 V2 水滴球体预览。</div>}
      >
        {/* 极低环境光 — 保留暗面最低可见度 */}
        <ambientLight
          intensity={0.12}
          color="#203048"
        />

        {/* 主方向光（左上）— 制造明暗半球 */}
        <directionalLight
          position={[-3.8, 5.0, 4.2]}
          intensity={3.5}
          color="#ffffff"
        />

        {/* 背光（右下）— 穿透球体的透射光，水珠"晶莹"的核心 */}
        <pointLight
          position={[2.2, -3.5, -1.5]}
          intensity={1.8}
          color="#6ab8e0"
        />

        {/* 底部柔光补光 — 弱化暗面死黑 */}
        <pointLight
          position={[0.5, -4.5, 0.6]}
          intensity={0.35}
          color="#3a6080"
        />

        <WaterSphere params={params.sphere} />
      </Canvas>
    </div>
  )
}

export default V2PetStage
