import React, { useMemo } from 'react'
import * as THREE from 'three'

function createEyeMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uLightDir: { value: new THREE.Vector3(-0.52, 0.68, 0.45) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vNormal = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      uniform vec3 uLightDir;

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewDir);

        float fresnel = 1.0 - abs(dot(N, V));
        float rim = pow(fresnel, 3.5) * 0.3;

        vec3 L = normalize(uLightDir);
        vec3 H = normalize(L + V);
        float spec = pow(max(dot(N, H), 0.0), 120.0) * 0.55;

        float shade = 0.35 + spec;
        vec3 color = vec3(0.85, 0.92, 1.0) * shade;
        float alpha = 0.4 + rim * 0.5 + spec * 0.5;

        gl_FragColor = vec4(color, alpha);
      }
    `,
  })
}

const Eyes: React.FC = () => {
  const material = useMemo(() => createEyeMaterial(), [])

  return (
    <group>
      <mesh position={[-0.25, 0.55, 0.75]}>
        <sphereGeometry args={[0.09, 24, 24]} />
        <primitive object={material} attach="material" />
      </mesh>
      <mesh position={[0.25, 0.55, 0.75]}>
        <sphereGeometry args={[0.09, 24, 24]} />
        <primitive object={material} attach="material" />
      </mesh>
    </group>
  )
}

export default Eyes
