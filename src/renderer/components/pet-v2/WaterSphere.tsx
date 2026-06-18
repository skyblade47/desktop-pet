import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { WaterSphereParams } from './types'
import { createInkSphereMaterial, updateInkSphereUniforms } from './shaders/waterSphereMaterial'

interface WaterSphereProps {
  params: WaterSphereParams
}

/* ──────────── 外部 Fresnel 轮廓光 ──────────── */

const FresnelRim: React.FC<{
  radius: number
  color: THREE.Color
  strength: number
}> = ({ radius, color, strength }) => {
  const rimMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      uniforms: {
        uColor: { value: color },
        uStrength: { value: strength * 0.45 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vNormal = normalize(mat3(modelMatrix) * normal);
          vViewDir = normalize(cameraPosition - worldPos.xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        uniform vec3 uColor;
        uniform float uStrength;
        void main() {
          float fresnel = 1.0 - abs(dot(vNormal, vViewDir));
          float rim = pow(fresnel, 5.5);
          float glow = pow(fresnel, 10.0);
          float alpha = rim * 0.22 + glow * 0.06;
          alpha *= uStrength;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    })
  }, [color, strength])

  return (
    <mesh
      scale={1.025}
      renderOrder={1}
    >
      <sphereGeometry args={[radius, 96, 96]} />
      <primitive
        object={rimMat}
        attach="material"
      />
    </mesh>
  )
}

/* ──────────── 内部柔光（已禁用 — 避免同心圆底色块） ──────────── */

const InnerGlow: React.FC<{ radius: number }> = ({ radius: _radius }) => {
  // 暂时禁用，如需次表面散射效果，后续用 shader 实现
  return null
}

/* ──────────── 主组件 ──────────── */

const WaterSphere: React.FC<WaterSphereProps> = ({ params }) => {
  const sphereRef = useRef<THREE.Mesh>(null)

  const material = useMemo(() => createInkSphereMaterial(), [])

  const rimColor = useMemo(() => {
    const s = Math.max(0.15, Math.min(1, params.fresnelStrength))
    return new THREE.Color(s * 0.38, s * 0.6, s * 0.85)
  }, [params.fresnelStrength])

  useFrame((state) => {
    if (!sphereRef.current || !material) return

    // 滑块 → shader 参数映射
    const specPower = 30 + params.refractionStrength * 320 // 30 ~ 350
    const specStr = params.highlightStrength * 0.78 // 0 ~ 0.78
    const fresnelPower = 2.5 + params.fresnelStrength * 6.0 // 2.5 ~ 8.5
    const fresnelStr = 0.04 + params.fresnelStrength * 0.28 // 0.04 ~ 0.32
    const inkDensity = params.inkDensity // 0 ~ 1
    const inkSpread = params.inkSpread // 0 ~ 1
    const backlight = params.backlightStrength // 0 ~ 1
    const opacity = 0.42 + params.transparency * 0.52 // 0.42 ~ 0.94

    const elapsed = state.clock.getElapsedTime()

    // ══════════════════════════════════════════════════
    // 液体异步多轴缩放 — 取代均匀 setScalar
    //   各轴以不同频率/相位/幅度独立呼吸，
    //   模拟液体在各方向的异步形变而不是固体整体膨胀
    // ══════════════════════════════════════════════════
    if (params.breathEnabled) {
      const t = elapsed

      // 主轴呼吸 — 不同频率避免同步
      const scaleX = 1 + Math.sin(t * 0.75 + 0.0) * 0.022 // 横向慢
      const scaleY = 1 + Math.sin(t * 1.1 + 1.4) * 0.026 // 纵向略快、幅度略大（重力方向更软）
      const scaleZ = 1 + Math.sin(t * 0.92 + 2.8) * 0.019 // 深度方向互补

      sphereRef.current.scale.set(scaleX, scaleY, scaleZ)

      // 顶点级表面形变幅度（配合异步缩放增强液体感）
      const breathAmp = 1.0
      updateInkSphereUniforms(
        material,
        specPower,
        specStr,
        fresnelPower,
        fresnelStr,
        inkDensity,
        inkSpread,
        backlight,
        opacity,
        elapsed,
        breathAmp
      )
    } else {
      sphereRef.current.scale.set(1, 1, 1)
      updateInkSphereUniforms(
        material,
        specPower,
        specStr,
        fresnelPower,
        fresnelStr,
        inkDensity,
        inkSpread,
        backlight,
        opacity,
        elapsed,
        0.0
      )
    }

    sphereRef.current.rotation.y = Math.sin(elapsed * 0.18) * 0.08
  })

  return (
    <group>
      {/* 主球体：自定义 Ink Shader */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[params.radius, 96, 96]} />
        <primitive
          object={material}
          attach="material"
        />
      </mesh>

      {/* 外部 Fresnel 轮廓光 */}
      <FresnelRim
        radius={params.radius}
        color={rimColor}
        strength={params.fresnelStrength}
      />

      {/* 内部柔光 */}
      <InnerGlow radius={params.radius} />
    </group>
  )
}

export default WaterSphere
