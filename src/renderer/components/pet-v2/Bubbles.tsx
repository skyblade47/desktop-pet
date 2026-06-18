import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface BubbleData {
  basePos: [number, number, number]
  radius: number
  speed: number
  phase: number
  driftAmp: number
  driftFreq: number
}

function createBubbleMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
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
      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewDir);
        float fresnel = 1.0 - abs(dot(N, V));

        float rim = pow(fresnel, 4.5) * 0.7;
        float core = pow(1.0 - fresnel, 1.5) * 0.06;

        float alpha = rim + core;
        vec3 color = vec3(0.76, 0.92, 1.0);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  })
}

function generateBubbleData(count: number, sphereRadius: number): BubbleData[] {
  const data: BubbleData[] = []
  const innerRadius = sphereRadius * 0.7

  for (let i = 0; i < count; i++) {
    let x = (Math.random() - 0.5) * 2 * innerRadius
    let y = (Math.random() - 0.5) * 2 * innerRadius
    let z = (Math.random() - 0.5) * 2 * innerRadius

    const dist = Math.sqrt(x * x + y * y + z * z)
    if (dist < sphereRadius * 0.18) {
      const r = sphereRadius * 0.18 + Math.random() * (innerRadius - sphereRadius * 0.18)
      const s = r / dist
      x *= s
      y *= s
      z *= s
    }

    if (dist > innerRadius) {
      const s = (innerRadius * 0.92) / dist
      x *= s
      y *= s
      z *= s
    }

    data.push({
      basePos: [x, y, z],
      radius: 0.003 + Math.random() * 0.012,
      speed: 0.08 + Math.random() * 0.22,
      phase: Math.random() * Math.PI * 2,
      driftAmp: 0.04 + Math.random() * 0.1,
      driftFreq: 0.3 + Math.random() * 0.6,
    })
  }

  return data
}

const BubbleInstance: React.FC<{
  data: BubbleData
  material: THREE.ShaderMaterial
}> = ({ data, material }) => {
  const ref = useRef<THREE.Mesh>(null)
  const geo = useMemo(() => new THREE.SphereGeometry(1, 12, 12), [])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    const b = data
    ref.current.position.set(
      b.basePos[0] + Math.sin(t * b.driftFreq + b.phase) * b.driftAmp,
      b.basePos[1] + Math.sin(t * b.speed + b.phase * 2.3) * b.driftAmp * 1.5,
      b.basePos[2] + Math.cos(t * b.driftFreq * 0.7 + b.phase) * b.driftAmp
    )
    ref.current.scale.setScalar(b.radius)
  })

  return (
    <mesh
      ref={ref}
      geometry={geo}
      material={material}
      renderOrder={2}
    />
  )
}

const Bubbles: React.FC<{ count: number; sphereRadius: number }> = ({ count, sphereRadius }) => {
  const material = useMemo(() => createBubbleMaterial(), [])

  const bubbleData = useMemo(() => {
    const n = Math.max(0, Math.min(30, Math.round(count)))
    return generateBubbleData(n, sphereRadius)
  }, [count, sphereRadius])

  return (
    <group>
      {bubbleData.map((b, i) => (
        <BubbleInstance
          key={i}
          data={b}
          material={material}
        />
      ))}
    </group>
  )
}

export default Bubbles
