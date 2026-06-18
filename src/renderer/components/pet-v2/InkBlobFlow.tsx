import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ──────────── 墨团流动物理参数 ──────────── */

export interface InkBlobFlowParams {
  enabled: boolean
  count: number
  repulsion: number
  damping: number
  spring: number
  brownian: number
  sphereRadius: number
  density: number
  /** 表面张力强度（0-1），越大墨团越倾向于相互靠近形成整体 */
  surfaceTension: number
  /** 合并阈值（0-1），越大越容易合并 */
  mergeThreshold: number
  /** 分裂概率（0-1），越大越容易分裂 */
  splitChance: number
}

export const DEFAULT_INK_BLOB_FLOW_PARAMS: InkBlobFlowParams = {
  enabled: true,
  count: 5,
  repulsion: 0.45,
  damping: 0.3,
  spring: 0.25,
  brownian: 0.12,
  sphereRadius: 1.45,
  density: 0.8,
  surfaceTension: 0.35,
  mergeThreshold: 0.5,
  splitChance: 0.5,
}

/* ──────────── 常量 ──────────── */

const MIN_DIST = 0.001
const MAX_SPEED = 0.6
const REPULSION_RADIUS_SCALE = 1.5
const BOUNDARY_STIFFNESS = 8.0
const TIME_SCALE = 2.5

const MERGE_DURATION = 0.85        // 合并动画时长（秒）
const MERGE_COOLDOWN = 2.5         // 合并后冷却
const RESPAWN_DELAY_MIN = 2.0      // 重生最短延迟
const RESPAWN_DELAY_MAX = 5.0      // 重生最长延迟
const BUD_DURATION = 1.0           // 分裂动画时长
const BUD_COOLDOWN = 3.0           // 分裂后冷却
const MIN_ACTIVE_COUNT = 2         // 最少保留活跃数

const STRETCH_START_FACTOR = 1.8
const STRETCH_MAX_FACTOR = 0.7
const MAX_STRETCH = 0.32
const MAX_SQUISH = 0.14
const SURFACE_TENSION_FACTOR = 1.2
const MAX_BRIDGE_COUNT = 4

/* ──────────── 物理状态 ──────────── */

interface BlobPhysics {
  pos: THREE.Vector3
  vel: THREE.Vector3
  mass: number
  baseRadius: number
  displayRadius: number
  active: boolean
  isMain: boolean

  // ── 合并状态 ──
  mergeTarget: number
  mergeProgress: number
  isMergeAbsorber: boolean

  // ── 分裂状态 ──
  budTarget: number
  budProgress: number

  // ── 计时 ──
  lastMergeTime: number
  lastBudTime: number
  respawnTimer: number

  // ── 邻近变形 ──
  nearestDist: number
  nearestDir: THREE.Vector3
  stretchAmount: number
  squishAmount: number
  tensionForce: THREE.Vector3
}

interface MergePair {
  a: number
  b: number
  progress: number
}

/* ──────────── 不透明墨团 Shader ──────────── */

function createOpaqueBlobMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: false,
    depthWrite: true,
    depthTest: true,
    uniforms: {
      uLightDir: { value: new THREE.Vector3(-0.52, 0.68, 0.45) },
      uSpecColor: { value: new THREE.Color('#d0e8f8') },
      uFresnelColor: { value: new THREE.Color('#6098b8') },
      uAmbient: { value: 0.12 },
      uDiffuseStrength: { value: 0.82 },
      uSpecPower: { value: 200.0 },
      uSpecStrength: { value: 0.55 },
      uFresnelPower: { value: 4.5 },
      uFresnelStrength: { value: 0.18 },
      uTime: { value: 0 },
      uBreathAmplitude: { value: 0.28 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      uniform float uTime;
      uniform float uBreathAmplitude;

      float computeDisplacement(vec3 dir) {
        float wave1 = sin(dir.x * 2.8 + uTime * 0.52) * cos(dir.z * 2.2 + uTime * 0.44) * 0.028;
        float wave2 = sin(dir.y * 2.1 + dir.z * 1.7 + uTime * 0.58) * 0.016;
        float wave3 = cos(dir.x * 4.0 - uTime * 1.3) * sin(dir.y * 3.8 + uTime * 1.2) * 0.005;
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
        vWorldPos = worldPos.xyz;
        vNormal = normalize(mat3(modelMatrix) * pertNormal);
        vViewDir = normalize(cameraPosition - worldPos.xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(deformed, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      uniform vec3 uLightDir;
      uniform vec3 uSpecColor;
      uniform vec3 uFresnelColor;
      uniform float uAmbient;
      uniform float uDiffuseStrength;
      uniform float uSpecPower;
      uniform float uSpecStrength;
      uniform float uFresnelPower;
      uniform float uFresnelStrength;

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewDir);
        vec3 L = normalize(uLightDir);

        float NdotL = max(dot(N, L), 0.0);
        float diffuse = uAmbient + NdotL * uDiffuseStrength;

        vec3 H = normalize(L + V);
        float spec = pow(max(dot(N, H), 0.0), uSpecPower) * uSpecStrength;
        float softSpec = pow(max(dot(N, H), 0.0), uSpecPower * 0.06) * uSpecStrength * 0.10;

        float NdotL_neg = max(dot(N, -L), 0.0);
        float backGlow = NdotL_neg * 0.04;

        float fresnel = 1.0 - abs(dot(N, V));
        float rim = pow(fresnel, uFresnelPower) * uFresnelStrength;
        float rimSoft = pow(fresnel, uFresnelPower * 3.0) * uFresnelStrength * 0.08;

        vec3 bodyColor = vec3(0.02, 0.035, 0.06);

        vec3 color = bodyColor * diffuse;
        color += uSpecColor * (spec + softSpec);
        color += uFresnelColor * (rim + rimSoft);
        color += bodyColor * backGlow;

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  })
}

/* ──────────── 工具函数 ──────────── */

function randomPositionInSphere(
  radius: number,
  maxRadius: number,
  existing: THREE.Vector3[],
  minSeparation: number,
): THREE.Vector3 {
  const pos = new THREE.Vector3()
  for (let attempt = 0; attempt < 50; attempt++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = radius * (0.25 + Math.random() * 0.55)
    pos.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
    )
    let tooClose = false
    for (const ex of existing) {
      if (pos.distanceTo(ex) < minSeparation) {
        tooClose = true
        break
      }
    }
    if (pos.length() > maxRadius) continue
    if (!tooClose) return pos
  }
  pos.set(
    (Math.random() - 0.5) * radius,
    (Math.random() - 0.5) * radius,
    (Math.random() - 0.5) * radius,
  )
  pos.clampLength(0, maxRadius)
  return pos
}

function createBlobStates(count: number, sphereRadius: number): BlobPhysics[] {
  const states: BlobPhysics[] = []
  const existingPositions: THREE.Vector3[] = []
  const maxRadius = sphereRadius * 0.75
  const minSeparation = sphereRadius * 0.2

  for (let i = 0; i < count; i++) {
    const pos = randomPositionInSphere(sphereRadius, maxRadius, existingPositions, minSeparation)
    existingPositions.push(pos)
    const isMain = i === 0
    const baseR = isMain ? sphereRadius * 0.22 : sphereRadius * (0.08 + Math.random() * 0.08)
    states.push({
      pos,
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.04,
        (Math.random() - 0.5) * 0.04,
        (Math.random() - 0.5) * 0.04,
      ),
      mass: isMain ? 2.5 : 0.7 + Math.random() * 0.6,
      baseRadius: baseR,
      displayRadius: baseR,
      active: true,
      isMain,
      mergeTarget: -1,
      mergeProgress: 0,
      isMergeAbsorber: false,
      budTarget: -1,
      budProgress: 0,
      lastMergeTime: -999,
      lastBudTime: -999,
      respawnTimer: 0,
      nearestDist: Infinity,
      nearestDir: new THREE.Vector3(),
      stretchAmount: 0,
      squishAmount: 0,
      tensionForce: new THREE.Vector3(),
    })
  }
  return states
}

/* ──────────── 主组件 ──────────── */

const InkBlobFlow: React.FC<{ params: InkBlobFlowParams }> = ({ params }) => {
  // ── 预分配临时对象 ──
  const _diff = useRef(new THREE.Vector3())
  const _force = useRef(new THREE.Vector3())
  const _tempVec = useRef(new THREE.Vector3())
  const _randDir = useRef(new THREE.Vector3())
  const _stretchAxis = useRef(new THREE.Vector3())
  const _localStretch = useRef(new THREE.Vector3(1, 1, 1))
  const _quat = useRef(new THREE.Quaternion())
  const _bridgePos = useRef(new THREE.Vector3())
  const _bridgeDir = useRef(new THREE.Vector3())

  // ── 共享 shader + 几何体 ──
  const sharedMaterial = useMemo(() => createOpaqueBlobMaterial(), [])
  const geo32 = useMemo(() => new THREE.SphereGeometry(1, 32, 32), [])
  const geo48 = useMemo(() => new THREE.SphereGeometry(1, 48, 48), [])
  const geoBridge = useMemo(() => new THREE.SphereGeometry(1, 16, 8), [])

  // ── 状态 ──
  const blobStates = useRef<BlobPhysics[]>([])
  const blobRefs = useRef<(THREE.Mesh | null)[]>([])
  const bridgeRefs = useRef<(THREE.Mesh | null)[]>([])
  const mergePairs = useRef<MergePair[]>([])
  const initialized = useRef(false)
  const prevCount = useRef(params.count)
  const totalTime = useRef(0)

  // ── 初始化 / 重建 ──
  if (!initialized.current || prevCount.current !== params.count) {
    blobStates.current = createBlobStates(Math.round(params.count), params.sphereRadius)
    blobRefs.current = Array.from({ length: blobStates.current.length }, () => null)
    bridgeRefs.current = Array.from({ length: MAX_BRIDGE_COUNT }, () => null)
    mergePairs.current = []
    prevCount.current = params.count
    initialized.current = true
  }

  // ═════════════════════════════════════════════════════
  // 每帧主循环
  // ═════════════════════════════════════════════════════

  useFrame((state, delta) => {
    if (!params.enabled) return

    const dt = Math.min(delta * TIME_SCALE, 0.1)
    totalTime.current += dt
    const tNow = totalTime.current
    const states = blobStates.current
    const n = states.length
    const maxRadius = params.sphereRadius * 0.82

    const repulsionStrength = params.repulsion * 0.08
    const dampingStrength = params.damping * 2.5
    const springStrength = params.spring * 1.2
    const brownianStrength = params.brownian * 0.02
    const surfaceTensionStrength = params.surfaceTension * 0.04
    const repulsionRadius =
      params.sphereRadius * REPULSION_RADIUS_SCALE * (0.6 + params.repulsion * 0.4)

    // ═══════════════════════════════════════════
    // 阶段 0：重生管理
    // ═══════════════════════════════════════════

    for (let i = 0; i < n; i++) {
      const blob = states[i]
      if (!blob.active && blob.respawnTimer > 0) {
        blob.respawnTimer -= dt
        if (blob.respawnTimer <= 0) {
          blob.respawnTimer = 0
          blob.active = true
          blob.baseRadius = params.sphereRadius * (0.08 + Math.random() * 0.08)
          blob.displayRadius = blob.baseRadius
          blob.mass = 0.7 + Math.random() * 0.6
          blob.mergeTarget = -1
          blob.mergeProgress = 0
          blob.isMergeAbsorber = false
          blob.budTarget = -1
          blob.budProgress = 0
          // 在球体边缘附近生成
          const theta = Math.random() * Math.PI * 2
          const phi = Math.acos(2 * Math.random() - 1)
          const r = maxRadius * (0.4 + Math.random() * 0.2)
          blob.pos.set(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi),
          )
          blob.vel.set(
            (Math.random() - 0.5) * 0.06,
            (Math.random() - 0.5) * 0.06,
            (Math.random() - 0.5) * 0.06,
          )
        }
      }
    }

    // ═══════════════════════════════════════════
    // 阶段 1：力积累（仅活跃且非"被吸收中"的墨团）
    // ═══════════════════════════════════════════

    for (let i = 0; i < n; i++) {
      const blob = states[i]
      if (!blob.active) continue
      // 正在被吸收的墨团不参与物理
      if (blob.mergeTarget >= 0 && !blob.isMergeAbsorber) continue

      const force = _force.current.set(0, 0, 0)

      // A1. 墨团间排斥力
      for (let j = 0; j < n; j++) {
        if (i === j || !states[j].active) continue
        if (states[j].mergeTarget >= 0 && !states[j].isMergeAbsorber) continue
        _diff.current.copy(blob.pos).sub(states[j].pos)
        const dist = _diff.current.length()
        if (dist < repulsionRadius && dist > MIN_DIST) {
          const strength = repulsionStrength / (dist * dist)
          _diff.current.normalize().multiplyScalar(strength)
          force.add(_diff.current)
        }
      }

      // A2. 表面张力
      if (surfaceTensionStrength > 0) {
        let nearestDist = Infinity
        let nearestIdx = -1
        for (let j = 0; j < n; j++) {
          if (i === j || !states[j].active) continue
          if (states[j].mergeTarget >= 0 && !states[j].isMergeAbsorber) continue
          const dist = blob.pos.distanceTo(states[j].pos)
          if (dist < nearestDist) {
            nearestDist = dist
            nearestIdx = j
          }
        }
        const tensionRange =
          (blob.displayRadius +
            (nearestIdx >= 0 ? states[nearestIdx].displayRadius : 0)) *
          SURFACE_TENSION_FACTOR

        if (nearestIdx >= 0 && nearestDist < tensionRange && nearestDist < repulsionRadius * 1.1) {
          const normalizedDist = nearestDist / tensionRange
          if (normalizedDist > 0.15 && normalizedDist < 0.95) {
            const t = (normalizedDist - 0.15) / 0.8
            const attractForce =
              Math.exp(-((t - 0.5) * (t - 0.5)) / 0.08) * surfaceTensionStrength
            _diff.current
              .copy(states[nearestIdx].pos)
              .sub(blob.pos)
              .normalize()
              .multiplyScalar(attractForce)
            force.add(_diff.current)
            blob.tensionForce.copy(_diff.current)
          } else {
            blob.tensionForce.set(0, 0, 0)
          }
        } else {
          blob.tensionForce.set(0, 0, 0)
        }
        blob.nearestDist = nearestDist
        if (nearestIdx >= 0) {
          blob.nearestDir.copy(states[nearestIdx].pos).sub(blob.pos).normalize()
        }
      }

      // A3. 中心弹簧
      const distFromCenter = blob.pos.length()
      if (distFromCenter > 0.01) {
        _tempVec.current
          .copy(blob.pos)
          .normalize()
          .multiplyScalar(-springStrength * distFromCenter)
        force.add(_tempVec.current)
      }

      // A4. 阻尼
      _tempVec.current.copy(blob.vel).multiplyScalar(-dampingStrength)
      force.add(_tempVec.current)

      // A5. 布朗扰动
      if (brownianStrength > 0) {
        const tc = state.clock.getElapsedTime()
        _randDir.current.set(
          Math.sin(tc * 7.3 + i * 2.1) * 0.7 + Math.cos(tc * 5.1 + i) * 0.3,
          Math.cos(tc * 6.4 + i * 1.7) * 0.6 + Math.sin(tc * 8.2 + i * 0.9) * 0.4,
          Math.sin(tc * 5.8 + i * 2.5) * 0.5 + Math.cos(tc * 7.6 + i * 1.2) * 0.5,
        )
        _randDir.current.normalize().multiplyScalar(brownianStrength)
        force.add(_randDir.current)
      }

      // A6. 边界
      const dist = blob.pos.length()
      const effectiveMax = maxRadius - blob.displayRadius
      if (dist > effectiveMax) {
        const penetration = dist - effectiveMax
        _tempVec.current
          .copy(blob.pos)
          .normalize()
          .multiplyScalar(-BOUNDARY_STIFFNESS * penetration)
        force.add(_tempVec.current)
      }

      // A7. 半隐式 Euler 积分
      force.divideScalar(blob.mass)
      blob.vel.add(force.multiplyScalar(dt))
      const speed = blob.vel.length()
      if (speed > MAX_SPEED) {
        blob.vel.multiplyScalar(MAX_SPEED / speed)
      }
      blob.pos.add(_tempVec.current.copy(blob.vel).multiplyScalar(dt))

      // A8. 硬边界
      const finalDist = blob.pos.length()
      const hardMax = maxRadius - blob.displayRadius
      if (finalDist > hardMax && finalDist > MIN_DIST) {
        blob.pos.normalize().multiplyScalar(hardMax)
        const normal = _tempVec.current.copy(blob.pos).normalize()
        const vn = blob.vel.dot(normal)
        if (vn > 0) {
          blob.vel.addScaledVector(normal, -vn * 1.3)
        }
      }
    }

    // ═══════════════════════════════════════════
    // 阶段 2：合并检测 + 动画更新
    // ═══════════════════════════════════════════

    mergePairs.current = []

    for (let i = 0; i < n; i++) {
      const blob = states[i]
      if (!blob.active) continue

      // ── 2a. 处理进行中的合并动画 ──
      if (blob.mergeTarget >= 0) {
        blob.mergeProgress += dt / MERGE_DURATION

        if (blob.mergeProgress >= 1.0) {
          blob.mergeProgress = 1.0
          if (blob.isMergeAbsorber) {
            const partner = states[blob.mergeTarget]
            // 吸收方：增长半径（体积守恒×0.85 散溢）
            const combinedVol =
              Math.pow(blob.baseRadius, 3) + Math.pow(partner.baseRadius, 3)
            blob.baseRadius = Math.pow(combinedVol, 1 / 3) * 0.85
            blob.displayRadius = blob.baseRadius
            blob.mass = Math.min(blob.mass + partner.mass * 0.6, 5.0)
            blob.lastMergeTime = tNow

            // 被吸收方：变为不活跃
            partner.active = false
            partner.displayRadius = 0
            partner.respawnTimer =
              RESPAWN_DELAY_MIN + Math.random() * (RESPAWN_DELAY_MAX - RESPAWN_DELAY_MIN)
          }
          blob.mergeTarget = -1
          blob.mergeProgress = 0
          blob.isMergeAbsorber = false
        } else if (blob.isMergeAbsorber) {
          // 记录合并对（用于液桥渲染）
          mergePairs.current.push({
            a: i,
            b: blob.mergeTarget,
            progress: blob.mergeProgress,
          })
        }
        continue
      }

      // ── 2b. 检测新合并 ──

      // 冷却期
      if (tNow - blob.lastMergeTime < MERGE_COOLDOWN) continue
      // 主墨团不可被吸收
      if (blob.isMain) continue

      // 确保至少保留 MIN_ACTIVE_COUNT 个活跃
      const activeCount = states.filter(
        (s) => s.active && s.mergeTarget < 0,
      ).length
      if (activeCount <= MIN_ACTIVE_COUNT) continue

      const mergeThreshold = params.mergeThreshold

      for (let j = 0; j < n; j++) {
        if (i === j || !states[j].active) continue
        if (states[j].mergeTarget >= 0) continue
        if (tNow - states[j].lastMergeTime < MERGE_COOLDOWN) continue
        // 保证主墨团是吸收方
        if (states[j].isMain && blob.isMain) continue

        _diff.current.copy(blob.pos).sub(states[j].pos)
        const dist = _diff.current.length()
        const combinedRadius = blob.displayRadius + states[j].displayRadius
        // 合并距离 = 半径之和 × (0.15 + threshold × 1.0)
        const mergeDist = combinedRadius * (0.15 + mergeThreshold * 1.0)

        if (dist < mergeDist && dist > MIN_DIST) {
          // 确定吸收方（主墨团 > 较大的 > 随机的）
          let aIdx = i
          let bIdx = j
          if (states[j].isMain) {
            aIdx = j
            bIdx = i
          } else if (!blob.isMain && states[j].displayRadius > blob.displayRadius) {
            aIdx = j
            bIdx = i
          }

          const absorber = states[aIdx]
          const absorbed = states[bIdx]

          absorber.mergeTarget = bIdx
          absorber.mergeProgress = 0
          absorber.isMergeAbsorber = true

          absorbed.mergeTarget = aIdx
          absorbed.mergeProgress = 0
          absorbed.isMergeAbsorber = false

          break
        }
      }
    }

    // ═══════════════════════════════════════════
    // 阶段 3：分裂检测 + 动画（大墨团在高能量时分出新墨团）
    // ═══════════════════════════════════════════

    if (params.splitChance > 0.01) {
      for (let i = 0; i < n; i++) {
        const blob = states[i]
        if (!blob.active) continue
        if (blob.mergeTarget >= 0) continue
        if (blob.budTarget >= 0) continue
        if (blob.baseRadius < params.sphereRadius * 0.10) continue
        if (tNow - blob.lastMergeTime < MERGE_COOLDOWN) continue
        if (tNow - blob.lastBudTime < BUD_COOLDOWN) continue

        const activeCount = states.filter(
          (s) => s.active && s.mergeTarget < 0,
        ).length
        if (activeCount >= params.count) continue

        // 找到可用的不活跃墨团作为子墨团
        let childIdx = -1
        for (let j = 0; j < n; j++) {
          if (!states[j].active && states[j].respawnTimer <= 0) {
            childIdx = j
            break
          }
        }
        if (childIdx < 0) continue

        // 概率 = 速度 × splitChance × 0.5
        const speed = blob.vel.length()
        const splitProb = speed * 8.0 * params.splitChance * dt * 0.5
        if (Math.random() >= splitProb) continue

        // ── 执行分裂 ──
        const child = states[childIdx]

        // 子墨团从父墨团边缘分离
        _tempVec.current
          .copy(blob.vel)
          .normalize()
          .multiplyScalar(blob.displayRadius * 1.6)
        child.pos.copy(blob.pos).add(_tempVec.current)
        child.vel
          .copy(blob.vel)
          .multiplyScalar(1.4)
          .add(
            _randDir.current
              .set(
                (Math.random() - 0.5) * 0.03,
                (Math.random() - 0.5) * 0.03,
                (Math.random() - 0.5) * 0.03,
              ),
          )

        child.baseRadius = blob.baseRadius * (0.35 + Math.random() * 0.15)
        child.displayRadius = child.baseRadius * 0.25  // 从小开始
        child.mass = blob.mass * 0.25
        child.active = true
        child.isMain = false
        child.mergeTarget = -1
        child.mergeProgress = 0
        child.isMergeAbsorber = false
        child.lastBudTime = tNow
        child.respawnTimer = 0

        // 父墨团缩小
        const parentVol = Math.pow(blob.baseRadius, 3)
        const childVol = Math.pow(child.baseRadius, 3)
        blob.baseRadius = Math.pow(Math.max(0.0001, parentVol - childVol), 1 / 3)
        blob.displayRadius = blob.baseRadius
        blob.mass *= 0.72
        blob.lastBudTime = tNow

        blob.budTarget = childIdx
        blob.budProgress = 0
        child.budTarget = i
        child.budProgress = 0

        break  // 一次只分裂一个
      }
    }

    // ── 更新分裂动画进度 ──
    for (let i = 0; i < n; i++) {
      const blob = states[i]
      if (blob.budTarget < 0 || !blob.active) continue
      blob.budProgress += dt / BUD_DURATION
      if (blob.budProgress >= 1.0) {
        blob.budProgress = 0
        blob.budTarget = -1
      }
    }

    // ═══════════════════════════════════════════
    // 阶段 4：邻近变形计算
    // ═══════════════════════════════════════════

    for (let i = 0; i < n; i++) {
      const blob = states[i]
      if (!blob.active) {
        blob.stretchAmount = 0
        blob.squishAmount = 0
        continue
      }

      let nearestDist = Infinity
      let nearestIdx = -1
      for (let j = 0; j < n; j++) {
        if (i === j || !states[j].active) continue
        if (states[j].mergeTarget >= 0 && !states[j].isMergeAbsorber) continue
        const d = blob.pos.distanceTo(states[j].pos)
        if (d < nearestDist) {
          nearestDist = d
          nearestIdx = j
        }
      }
      blob.nearestDist = nearestDist

      if (nearestIdx >= 0) {
        const neighbor = states[nearestIdx]
        const combinedRadius = blob.displayRadius + neighbor.displayRadius
        const stretchStart = combinedRadius * STRETCH_START_FACTOR
        const stretchEnd = combinedRadius * STRETCH_MAX_FACTOR

        if (nearestDist < stretchStart && nearestDist > MIN_DIST) {
          const t = 1.0 - (nearestDist - stretchEnd) / (stretchStart - stretchEnd)
          const clampedT = Math.max(0, Math.min(1, t))
          const smoothT = clampedT * clampedT * (3 - 2 * clampedT)
          blob.stretchAmount = smoothT * MAX_STRETCH
          blob.squishAmount = smoothT * MAX_SQUISH
          blob.nearestDir.copy(neighbor.pos).sub(blob.pos).normalize()
        } else {
          blob.stretchAmount = 0
          blob.squishAmount = 0
        }
      } else {
        blob.stretchAmount = 0
        blob.squishAmount = 0
      }
    }

    // ═══════════════════════════════════════════
    // 阶段 5：更新 mesh 变换
    // ═══════════════════════════════════════════

    for (let i = 0; i < n; i++) {
      const ref = blobRefs.current[i]
      if (!ref) continue
      const blob = states[i]

      if (!blob.active) {
        ref.visible = false
        continue
      }
      ref.visible = true

      let renderPos = blob.pos
      let renderRadius = blob.displayRadius

      // ── 合并动画中的位置/缩放覆盖 ──

      if (blob.mergeTarget >= 0 && !blob.isMergeAbsorber) {
        // 被吸收方：向吸收方滑动 + 缩小
        const absorber = states[blob.mergeTarget]
        const p = blob.mergeProgress
        // ease-in-out 再乘二次方，让滑动在末尾加速
        const ep = p * p * (3 - 2 * p)
        renderPos = _tempVec.current.copy(blob.pos).lerp(absorber.pos, ep * ep + 0.05)
        // 半径缩小，末尾骤降（模拟被"吸入"）
        const shrink = p < 0.7 ? 1 - p * 0.3 : (1 - p) / 0.3 * 0.7
        renderRadius = blob.displayRadius * Math.max(0.01, shrink)
      }

      if (blob.mergeTarget >= 0 && blob.isMergeAbsorber) {
        // 吸收方：轻微膨胀
        const p = blob.mergeProgress
        const ep = p * p * (3 - 2 * p)
        renderRadius = blob.baseRadius * (1 + ep * 0.25)
      }

      // ── 分裂动画中的子墨团增长 ──
      if (blob.budTarget >= 0 && blob.baseRadius < params.sphereRadius * 0.10) {
        const p = Math.min(blob.budProgress, 1)
        const ep = p * p * (3 - 2 * p)
        renderRadius = blob.baseRadius * (0.25 + ep * 0.75)
      }

      const depthFactor =
        0.85 + (1.0 - renderPos.length() / params.sphereRadius) * 0.15
      const baseScale = renderRadius * depthFactor

      // 变形：合并中的墨团禁止拉伸变形，用生理合并代替
      const canDeform = blob.mergeTarget < 0
      if (canDeform && blob.stretchAmount > 0.001 && blob.nearestDist < 100) {
        _stretchAxis.current.copy(blob.nearestDir)
        _quat.current.setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          _stretchAxis.current,
        )
        const stretchS = 1.0 + blob.stretchAmount
        const squishS = 1.0 - blob.squishAmount
        _localStretch.current.set(
          baseScale * squishS,
          baseScale * squishS,
          baseScale * stretchS,
        )
        ref.position.copy(renderPos)
        ref.quaternion.copy(_quat.current)
        ref.scale.copy(_localStretch.current)
      } else {
        ref.position.copy(renderPos)
        ref.quaternion.identity()
        ref.scale.setScalar(baseScale)
      }
    }

    // ── 更新液桥 mesh ──
    for (let bi = 0; bi < MAX_BRIDGE_COUNT; bi++) {
      const bridge = bridgeRefs.current[bi]
      if (!bridge) continue
      if (bi < mergePairs.current.length) {
        const pair = mergePairs.current[bi]
        const blobA = states[pair.a]
        const blobB = states[pair.b]
        if (!blobA.active || !blobB.active) {
          bridge.visible = false
          continue
        }
        bridge.visible = true

        // 桥接位置：两个墨团的中点
        _bridgePos.current.copy(blobA.pos).add(blobB.pos).multiplyScalar(0.5)
        bridge.position.copy(_bridgePos.current)

        // 桥接缩放
        _bridgeDir.current.copy(blobA.pos).sub(blobB.pos)
        const bridgeLen = _bridgeDir.current.length()
        _bridgeDir.current.normalize()
        const avgR = (blobA.displayRadius + blobB.displayRadius) * 0.22
        const neckWidth = avgR * (1 - pair.progress * 0.5)
        bridge.scale.set(neckWidth, neckWidth, bridgeLen * 0.5)

        // 旋转
        _quat.current.setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          _bridgeDir.current,
        )
        bridge.quaternion.copy(_quat.current)

        // 合并越深，液桥越窄
        const alpha = pair.progress < 0.5 ? 1 : 2 * (1 - pair.progress)
        ;(bridge.material as THREE.ShaderMaterial).uniforms.uDiffuseStrength.value =
          0.82 * alpha
        ;(bridge.material as THREE.ShaderMaterial).uniforms.uSpecStrength.value =
          0.55 * alpha
      } else {
        bridge.visible = false
      }
    }

    // ── 更新时间 uniform ──
    sharedMaterial.uniforms.uTime.value = state.clock.getElapsedTime()
  })

  return (
    <group renderOrder={0}>
      {/* 液桥 mesh（合并中的连接颈） */}
      {Array.from({ length: MAX_BRIDGE_COUNT }, (_, i) => (
        <mesh
          key={`bridge-${i}`}
          ref={(el) => {
            bridgeRefs.current[i] = el
          }}
          visible={false}
          renderOrder={-1}
        >
          <primitive object={geoBridge} attach="geometry" />
          <meshBasicMaterial
            color="#111822"
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}

      {/* 墨团 */}
      {blobStates.current.map((blob, i) => {
        const isMain = blob.isMain
        return (
          <mesh
            key={i}
            ref={(el) => {
              blobRefs.current[i] = el
            }}
            visible={blob.active}
            position={blob.pos.toArray() as [number, number, number]}
            scale={[
              blob.displayRadius,
              blob.displayRadius,
              blob.displayRadius,
            ]}
          >
            <primitive
              object={isMain ? geo48 : geo32}
              attach="geometry"
            />
            <primitive object={sharedMaterial} attach="material" />
          </mesh>
        )
      })}
    </group>
  )
}

export default InkBlobFlow
