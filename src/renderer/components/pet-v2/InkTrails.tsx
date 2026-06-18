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
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uStrength;

      void main() {
        float fadeEnds = smoothstep(0.0, 0.08, vUv.x) * (1.0 - smoothstep(0.85, 1.0, vUv.x));
        float edgeSoft = smoothstep(0.0, 0.38, vUv.y) * (1.0 - smoothstep(0.62, 1.0, vUv.y));

        float alpha = fadeEnds * edgeSoft * 0.45 * uStrength;
        vec3 color = vec3(0.018, 0.035, 0.065);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  })
}

function createTrailCurve(
  radius: number,
  axis: THREE.Vector3,
  startAngle: number,
  sweep: number,
  tilt: number,
  wobbleAmp: number
): THREE.CatmullRomCurve3 {
  const points: THREE.Vector3[] = []
  const steps = 40
  const axisN = axis.clone().normalize()
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axisN)

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const angle = startAngle + sweep * t
    const wobble = Math.sin(t * Math.PI * 3.5) * wobbleAmp * (1.0 - Math.abs(t - 0.5) * 2.0)

    const r = radius + wobble
    const flat = new THREE.Vector3(Math.cos(angle), Math.sin(angle) * tilt, 0).normalize().multiplyScalar(r)
    flat.applyQuaternion(q)
    points.push(flat)
  }
  return new THREE.CatmullRomCurve3(points)
}

const TRAIL_DEFS = [
  { axis: [0.45, 0.82, 0.35], start: 0.3, sweep: 4.9, tilt: 0.55, wobble: 0.12, r: 0.07 },
  { axis: [-0.55, 0.55, 0.62], start: 1.2, sweep: 4.2, tilt: 0.42, wobble: 0.08, r: 0.06 },
  { axis: [0.72, 0.28, -0.63], start: 2.8, sweep: 4.7, tilt: 0.6, wobble: 0.1, r: 0.065 },
  { axis: [-0.32, -0.78, 0.54], start: 3.8, sweep: 4.4, tilt: 0.38, wobble: 0.13, r: 0.055 },
  { axis: [0.15, 0.7, -0.7], start: 1.0, sweep: 3.8, tilt: 0.5, wobble: 0.09, r: 0.05 },
  { axis: [-0.7, -0.15, 0.7], start: 5.0, sweep: 3.5, tilt: 0.48, wobble: 0.11, r: 0.06 },
]

const InkTrails: React.FC<InkTrailsProps> = ({ sphereRadius, strength }) => {
  const groupRef = useRef<THREE.Group>(null)
  const material = useMemo(() => createTrailMaterial(), [])

  const trails = useMemo(() => {
    return TRAIL_DEFS.map((def) => {
      const axis = new THREE.Vector3(def.axis[0], def.axis[1], def.axis[2]).normalize()
      const curve = createTrailCurve(sphereRadius * 1.06, axis, def.start, def.sweep, def.tilt, def.wobble)
      const geo = new THREE.TubeGeometry(curve, 72, def.r, 10, false)
      return geo
    })
  }, [sphereRadius])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    material.uniforms.uTime.value = t
    material.uniforms.uStrength.value = strength
    groupRef.current.rotation.y = Math.sin(t * 0.1) * 0.12
    groupRef.current.rotation.x = Math.cos(t * 0.13) * 0.06
  })

  return (
    <group ref={groupRef}>
      {trails.map((geo, i) => (
        <mesh
          key={i}
          geometry={geo}
        >
          <primitive
            object={material}
            attach="material"
          />
        </mesh>
      ))}
    </group>
  )
}

export default InkTrails
