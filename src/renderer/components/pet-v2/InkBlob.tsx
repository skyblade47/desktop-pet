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
        // 波1：绕 Y 轴的缓慢旋转涟漪（不同于球体的 y 轴主导波）
        float wave1 = sin(dir.x * 2.8 + uTime * 0.52) * cos(dir.z * 2.2 + uTime * 0.44) * 0.038;

        // 波2：斜向波动（不同于球体的 xz 波）
        float wave2 = sin(dir.y * 2.1 + dir.z * 1.7 + uTime * 0.58) * 0.022;

        // 波3：中等频率涟漪（不同于球体的高频波）
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

const InkBlob: React.FC<InkBlobProps> = ({ params }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const material = useMemo(() => createInkBlobMaterial(), [])

  const baseScale = 0.15 + params.blobSize * 0.5

  useFrame((state) => {
    if (!meshRef.current || !material) return

    const t = state.clock.getElapsedTime()

    const cx = -0.15 + Math.sin(t * 0.3 + 0.7) * 0.08
    const cy = 0.2 + Math.sin(t * 0.4 + 2.1) * 0.06
    const cz = 0.08 + Math.cos(t * 0.35 + 1.3) * 0.07

    meshRef.current.position.set(cx, cy, cz)
    meshRef.current.scale.setScalar(baseScale)

    material.uniforms.uTime.value = t
    material.uniforms.uDensity.value = params.blobDensity
  })

  return (
    <mesh ref={meshRef} position={[-0.15, 0.2, 0.08]} scale={baseScale}>
      <sphereGeometry args={[1, 48, 48]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

export default InkBlob
