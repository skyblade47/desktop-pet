import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface InkTrailsProps {
  sphereRadius: number
  strength: number
}

function createTrailMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uStrength: { value: 1.0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      uniform float uTime;
      uniform float uStrength;

      float hash(vec3 p) {
        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
      }
      float noise3D(vec3 p) {
        vec3 i = floor(p); vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
              mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
          mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
              mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y),
          f.z);
      }
      float fbm(vec3 p) {
        float v = 0.0; float a = 0.5; vec3 shift = vec3(100.0);
        for (int i = 0; i < 3; i++) { v += a * noise3D(p); p = p * 2.0 + shift; a *= 0.5; }
        return v;
      }

      void main() {
        // 沿飘带方向渐隐（两端消失）
        float fadeX = smoothstep(0.0, 0.15, vUv.x) * (1.0 - smoothstep(0.80, 1.0, vUv.x));

        // 横向：边缘羽毛状淡出
        float fadeY = smoothstep(0.0, 0.45, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));

        // FBM 噪声 → 不规则水墨分布
        float n1 = fbm(vWorldPos * 12.0 + uTime * 0.04);
        float n2 = fbm(vWorldPos * 8.5 + vec3(2.0, 5.0, 3.0) - uTime * 0.03);
        float n3 = fbm(vWorldPos * 6.0 + vec3(-3.0, 1.0, -2.0) + uTime * 0.05);

        // 阈值化 → 干笔飞白效果：高低转折处才有墨
        float ink = smoothstep(0.40, 0.62, n1) * 0.55;
        ink += smoothstep(0.38, 0.58, n2) * 0.28;
        ink += smoothstep(0.44, 0.60, n3) * 0.17;

        // 随机断笔：有些区域完全不留墨
        float breakMask = fbm(vWorldPos * 5.0 + vec3(7.0)) * 0.7 + 0.3;
        ink *= smoothstep(0.40, 0.52, breakMask);

        // 叠加微弱的连续底色（避免完全空白）
        float bg = fbm(vWorldPos * 15.0 + uTime * 0.06) * 0.05;

        float warp = fbm(vWorldPos * 4.0 + uTime * 0.07) * 0.18;

        float alpha = (ink + bg + warp) * fadeX * fadeY * uStrength;
        alpha = clamp(alpha, 0.0, 0.68);

        vec3 color = vec3(0.015, 0.03, 0.06);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  })
}

function buildRibbonGeometry(
  curve: THREE.CatmullRomCurve3,
  width: number,
  segments: number
): THREE.BufferGeometry {
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const pt = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t).normalize()

    // 用切线和一个世界方向构建横向向量
    const up = new THREE.Vector3(0, 1, 0)
    let perp = new THREE.Vector3().crossVectors(tangent, up).normalize()
    if (perp.length() < 0.01) {
      perp = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(1, 0, 0)).normalize()
    }

    const w = width * 0.5
    const a = pt.clone().addScaledVector(perp, w)
    const b = pt.clone().addScaledVector(perp, -w)

    positions.push(a.x, a.y, a.z)
    positions.push(b.x, b.y, b.z)

    const u = t
    uvs.push(u, 1, u, 0)
  }

  for (let i = 0; i < segments; i++) {
    const i0 = i * 2
    const i1 = i0 + 1
    const i2 = i0 + 2
    const i3 = i0 + 3
    indices.push(i0, i1, i2, i1, i3, i2)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

function createCurve(
  radius: number,
  axis: THREE.Vector3,
  startAngle: number,
  sweep: number,
  tilt: number,
  wobbleAmp: number,
  wobbleFreq: number
): THREE.CatmullRomCurve3 {
  const points: THREE.Vector3[] = []
  const steps = 50
  const axisN = axis.clone().normalize()
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axisN)

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const angle = startAngle + sweep * t
    const wobble = Math.sin(t * Math.PI * wobbleFreq + i * 0.5) * wobbleAmp * (1.0 - Math.abs(t - 0.5) * 2.2)

    const r = radius + wobble
    const flat = new THREE.Vector3(Math.cos(angle), Math.sin(angle) * tilt, Math.sin(angle) * 0.3)
      .normalize()
      .multiplyScalar(r)
    flat.applyQuaternion(q)
    points.push(flat)
  }
  return new THREE.CatmullRomCurve3(points)
}

const TRAIL_DEFS = [
  { axis: [0.45, 0.82, 0.35], start: 0.3, sweep: 4.9, tilt: 0.55, wobble: 0.06, freq: 3.5, width: 0.08 },
  { axis: [-0.55, 0.55, 0.62], start: 1.2, sweep: 4.2, tilt: 0.42, wobble: 0.08, freq: 4.0, width: 0.06 },
  { axis: [0.72, 0.28, -0.63], start: 2.8, sweep: 4.7, tilt: 0.6, wobble: 0.05, freq: 3.0, width: 0.09 },
  { axis: [-0.32, -0.78, 0.54], start: 3.8, sweep: 4.4, tilt: 0.38, wobble: 0.07, freq: 4.5, width: 0.05 },
  { axis: [0.15, 0.7, -0.7], start: 1.0, sweep: 3.8, tilt: 0.5, wobble: 0.09, freq: 3.8, width: 0.07 },
  { axis: [-0.7, -0.15, 0.7], start: 5.0, sweep: 3.5, tilt: 0.48, wobble: 0.06, freq: 4.2, width: 0.075 },
  { axis: [0.6, -0.5, 0.62], start: 0.5, sweep: 5.2, tilt: 0.45, wobble: 0.07, freq: 3.3, width: 0.055 },
  { axis: [-0.4, 0.75, -0.52], start: 2.0, sweep: 3.6, tilt: 0.52, wobble: 0.08, freq: 5.0, width: 0.065 },
  { axis: [0.85, 0.1, 0.52], start: 4.0, sweep: 4.0, tilt: 0.35, wobble: 0.05, freq: 3.7, width: 0.07 },
  { axis: [-0.2, -0.65, -0.73], start: 6.0, sweep: 3.2, tilt: 0.55, wobble: 0.09, freq: 4.8, width: 0.06 },
]

const InkTrails: React.FC<InkTrailsProps> = ({ sphereRadius, strength }) => {
  const groupRef = useRef<THREE.Group>(null)
  const material = useMemo(() => createTrailMaterial(), [])

  const trails = useMemo(() => {
    return TRAIL_DEFS.map((def) => {
      const axis = new THREE.Vector3(def.axis[0], def.axis[1], def.axis[2]).normalize()
      const curve = createCurve(
        sphereRadius * 1.07,
        axis,
        def.start,
        def.sweep,
        def.tilt,
        def.wobble,
        def.freq
      )
      const geo = buildRibbonGeometry(curve, def.width, 80)
      return geo
    })
  }, [sphereRadius])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    material.uniforms.uTime.value = t
    material.uniforms.uStrength.value = strength
    groupRef.current.rotation.y = Math.sin(t * 0.08) * 0.1
    groupRef.current.rotation.x = Math.cos(t * 0.1) * 0.05
  })

  return (
    <group ref={groupRef}>
      {trails.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <primitive object={material} attach="material" />
        </mesh>
      ))}
    </group>
  )
}

export default InkTrails
