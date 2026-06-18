/**
 * 桌宠 V2 — 纯灰度颜色常量
 *
 * 严格约束：所有墨水颜色 R=G=B，零暖色/冷色偏移。
 * 这是防止 UI 木质色规范渗透到桌宠渲染的关键措施。
 */

// ---- 基础灰度阶梯 ----

/** 浓墨核心 — 实心黑，内部浓墨重心 */
export const INK_DENSE = '#000000'

/** 深墨边缘 — 浓墨团边缘扩散 */
export const INK_DEEP = '#1a1a1a'

/** 中墨主体 — 球内主体淡墨 */
export const INK_MEDIUM = '#4a4a4a'

/** 淡墨层次 — 墨丝起点色 */
export const INK_LIGHT = '#8a8a8a'

/** 极淡消散 — 墨丝末端/墨迹消退 */
export const INK_GHOST = '#c0c0c0'

/** 眼睛纯白 — 圆孔空洞 */
export const EYE_WHITE = '#ffffff'

/** 隔离白底 — 防桌面壁纸色渗透 */
export const ISOLATION_WHITE = 'rgba(255, 255, 255, 0.025)'

// ---- rgba() 快捷函数（保证 R=G=B） ----

/** 纯灰度 rgba 工厂函数。g 值范围 0-255 */
export function gray(value: number, alpha: number): string {
  const clamped = Math.max(0, Math.min(255, Math.round(value)))
  return `rgba(${clamped}, ${clamped}, ${clamped}, ${alpha})`
}

// ---- 预定义色调 ----

export const COLORS = {
  /** 球体底部淡墨层 start */
  bodyBaseStart: gray(90, 0.08),
  /** 球体底部淡墨层 mid */
  bodyBaseMid: gray(70, 0.25),
  /** 球体底部淡墨层 end */
  bodyBaseEnd: gray(35, 0.4),

  /** 浓墨块 core */
  denseCore: (density: number) => gray(5, density),
  /** 浓墨块 mid */
  denseMid: (density: number) => gray(15, density * 0.65),
  /** 浓墨块 end */
  denseEnd: gray(50, 0),

  /** S 线 stroke */
  sLineStroke: 'rgba(15, 15, 15, 1)',
  /** S 线墨点 */
  sLineDot: (alpha: number) => gray(10, alpha * 0.6),

  /** 边缘墨晕 start */
  edgeStart: 'rgba(45, 45, 45, 0)',
  /** 边缘墨晕 end */
  edgeEnd: (spread: number) => gray(25, spread * 0.35),

  /** 墨丝粒子 fill */
  particleFill: '#555555',

  /** 眼睛白色发光效果（非墨水色，但满足 R=G=B 以保证纯灰度主题） */
  eyeShadow: 'rgba(255, 255, 255, 0.25)',
} as const

// ---- 验证工具 ----

export function validateGrayscale(colorStr: string): boolean {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return true
  const [, r, g, b] = match.map(Number)
  return r === g && g === b
}

export const FORBIDDEN_COLORS = ['#d4c4b0', '#8b7355', '#4a3820', '#d48b5a']
