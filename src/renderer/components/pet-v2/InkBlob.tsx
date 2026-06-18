import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface InkBlobProps {
  params: {
    blobSize: number
    blobDensity: number
  }
}

function createInkBlobMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uLightDir: { value: new THREE.Vector3(-0.52, 0.68, 0.45) },
      uSpecColor: { value: new THREE.Color('#e8f6ff') },
      uFresnelColor: { value: new THREE.Color('#6098b8') },
      uAmbient: { value: 0.08 },
      uDiffuseStrength: { value: 0.78 },
      uSpecPower: { value: 180.0 },
      uSpecStrength: { value: 0.62 },
      uFresnelPower: { value: 5.5 },
      uFresnelStrength: { value: 0.14 },
      uDensity: { value: 0.8 },
      uTime: { value: 0 },
      uBreathAmplitude: { value: 0.6 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      uniform float uTime;
      uniform float uBreathAmplitude;

      float computeDisplacement(vec3 dir) {
        float wave1 = sin(dir.x * 2.8 + uTime * 0.52) * cos(dir.z * 2.2 + uTime * 0.44) * 0.038;
        float wave2 = sin(dir.y * 2.1 + dir.z * 1.7 + uTime * 0.58) * 0.022;
        float wave3 = cos(dir.x * 4.0 - uTime * 1.3) * sin(dir.y * 3.8 + uTime * 1.2) * 0.006;
        return (wave1 + wave2 + wave3) * uBreathAmplitude;
      }

      void main() {
        vec3 dir = normalize(position);

        float disp0 = computeDisplacement(dir);

        const float EPS = 0.015;
        vec3 up = abs(dir.y) > 0.999 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
        vec3 tangent1 = normalize(cross(dir, up));
        vec3 tangent2 = cross(dir, tangent1);

        vec3 sample1 = normalize(dir + tangent1 * EPS);
        vec3 sample2 = normalize(dir + tangent2 * EPS);
        float disp1 = computeDisplacement(sample1);
        float disp2 = computeDisplacement(sample2);

        float gradU = (disp1 - disp0) / EPS;
        float gradV = (disp2 - disp0) / EPS;

        vec3 pertNormal = normalize(dir - tangent1 * gradU - tangent2 * gradV);

        vec3 deformed = position + dir * disp0;

        vec4 worldPos = modelMatrix * vec4(deformed, 1.0);
        vNormal = normalize(mat3(modelMatrix) * pertNormal);
        vViewDir = normalize(cameraPosition - worldPos.xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(deformed, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      uniform vec3 uLightDir;
      uniform vec3 uSpecColor;
      uniform vec3 uFresnelColor;
      uniform float uAmbient;
      uniform float uDiffuseStrength;
      uniform float uSpecPower;
      uniform float uSpecStrength;
      uniform float uFresnelPower;
      uniform float uFresnelStrength;
      uniform float uDensity;

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewDir);
        vec3 L = normalize(uLightDir);

        float NdotL = max(dot(N, L), 0.0);
        float diffuse = uAmbient + NdotL * uDiffuseStrength;

        vec3 H = normalize(L + V);
        float spec = pow(max(dot(N, H), 0.0), uSpecPower) * uSpecStrength;
        float softSpec = pow(max(dot(N, H), 0.0), uSpecPower * 0.06) * uSpecStrength * 0.08;

        float NdotL_neg = max(dot(N, -L), 0.0);
        float backGlow = NdotL_neg * 0.06;

        float fresnel = 1.0 - abs(dot(N, V));
        float rim = pow(fresnel, uFresnelPower) * uFresnelStrength;
        float rimSoft = pow(fresnel, uFresnelPower * 3.0) * uFresnelStrength * 0.10;

        vec3 bodyColor = vec3(0.025, 0.045, 0.07);

        vec3 color = bodyColor * diffuse;
        color += uSpecColor * (spec + softSpec);
        color += uFresnelColor * (rim + rimSoft);
        color += bodyColor * backGlow;

        float alpha = (0.68 + diffuse * 0.28) * uDensity;
        alpha += (rim + rimSoft) * 0.2;

        gl_FragColor = vec4(color, alpha);
      }
    `,
  })
}

const MICRO_BLOB_COUNT = 4

const InkBlob: React.FC<InkBlobProps> = ({ params }) => {
  const mainRef = useRef<THREE.Mesh>(null)
  const microRefs = useRef<(THREE.Mesh | null)[]>(Array.from({ length: MICRO_BLOB_COUNT }, () => null))
  const material = useMemo(() => createInkBlobMaterial(), [])

  const totalBaseScale = 0.15 + params.blobSize * 0.5
  // 微团的基准大小 = 主团的 38%，分裂时可长到 60%
  const microBaseScale = totalBaseScale * 0.38

  // 每个微团的随机相位
  const phases = useMemo(() => Array.from({ length: MICRO_BLOB_COUNT }, () => Math.random() * Math.PI * 2), [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    // ─── 主墨团位置 ───
    const mainCx = -0.15 + Math.sin(t * 0.3 + 0.7) * 0.08
    const mainCy = 0.2 + Math.sin(t * 0.4 + 2.1) * 0.06
    const mainCz = 0.08 + Math.cos(t * 0.35 + 1.3) * 0.07

    // ─── 罗夏分裂力 ───
    const raw = Math.sin(t * 0.22 + 0.3) * 0.55 + Math.sin(t * 0.31 + 1.8) * 0.35
    // clamp01-ish：峰值时刻分裂力 ≈ 1，谷底 ≈ 0
    const splitForce = Math.max(0, raw * 1.1 + 0.1)
    // 平滑：分裂力 = 1 时主团缩至 55%，分裂力 = 0 时主团保持 100%
    const splitFactor = Math.min(splitForce * 1.5, 1.0)

    // ─── 主团缩放：分裂时缩小 ───
    const mainScale = totalBaseScale * (1.0 - splitFactor * 0.45)
    if (mainRef.current) {
      mainRef.current.position.set(mainCx, mainCy, mainCz)
      mainRef.current.scale.setScalar(mainScale)
    }

    // ─── 微团 ───
    for (let i = 0; i < MICRO_BLOB_COUNT; i++) {
      const ref = microRefs.current[i]
      if (!ref) continue

      const sign = i % 2 === 0 ? 1 : -1
      const phase = phases[i]

      // 分裂越强，微团离主团越远
      const dist = 0.03 + splitFactor * 0.32

      // 微团散布方向：双侧对称 + 上下微偏 + 前后微偏
      const angleY = phase + splitFactor * 0.6
      const spreadX = sign * dist
      const spreadY = Math.sin(angleY) * dist * 0.5
      const spreadZ = Math.cos(angleY) * dist * 0.35

      ref.position.set(
        mainCx + spreadX,
        mainCy + spreadY,
        mainCz + spreadZ
      )

      // 分裂力越强微团越大（"碎片"更明显）
      const microScale = microBaseScale * (0.7 + splitFactor * 1.5)
      ref.scale.setScalar(microScale)

      // 分裂力越强微团越不透明（不分裂时几乎看不见）
      ref.visible = splitFactor > 0.06
    }

    material.uniforms.uTime.value = t
    material.uniforms.uDensity.value = params.blobDensity
  })

  return (
    <group>
      {/* 主墨团 */}
      <mesh ref={mainRef} position={[-0.15, 0.2, 0.08]} scale={totalBaseScale}>
        <sphereGeometry args={[1, 48, 48]} />
        <primitive object={material} attach="material" />
      </mesh>

      {/* 微墨团 — 罗夏分裂 */}
      {Array.from({ length: MICRO_BLOB_COUNT }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            microRefs.current[i] = el
          }}
          scale={microBaseScale}
        >
          <sphereGeometry args={[1, 32, 32]} />
          <primitive object={material} attach="material" />
        </mesh>
      ))}
    </group>
  )
}

export default InkBlob
