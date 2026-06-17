# desktop-pet 项目开发规则

> **版本**: 1.0
> **创建日期**: 2026-06-17
> **同步自**: [WORK_PRINCIPLES.md](file:///d:/Projects/ai-writing-coach/desktop-pet/docs/WORK_PRINCIPLES.md)
> **最后更新**: 2026-06-17

---

## 🚨 必须遵守的铁律

### 1. 每次任务必须启动双 Subagent（原则二）

> **同一个 AI 不能既当运动员又当裁判。编写和检查必须由不同的 subagent 完成。**

```
用户需求
    │
    ▼
┌─────────────────────────────────────┐
│  Coder Subagent (general_purpose_task) │
│  - 编写代码                           │
│  - 遵循设计方案                        │
│  - 遵循简洁优先原则                     │
└────────────────┬────────────────────┘
                 │ 产出：代码
                 ▼
┌─────────────────────────────────────┐
│  Reviewer Subagent (search)             │
│  - 只给审查意见，不修改代码              │
│  - 输出审查报告                         │
└────────────────┬────────────────────┘
                 │ 审查报告
                 ▼
          审查通过？
          ↙      ↘
        是        否
        ↓         ↓
     提交     Coder 修复(≤3轮)
                 │
                 ▼
           复查通过？ → 提交
           否则上报 Main Agent
```

### 2. Reviewer Subagent 禁止事项

| Reviewer 可以 | Reviewer 不可以 |
|--------------|----------------|
| ✅ 指出问题位置（文件+行号） | ❌ 直接修改代码 |
| ✅ 说明原因和影响 | ❌ 使用 replace_in_file / write_to_file |
| ✅ 给出修复建议 | ❌ 以"帮你改好了"方式操作 |
| ✅ 标注严重程度 | ❌ 模糊表述（"可能有问题"） |

### 3. 功能对齐检查（原则零）

每次开始任何任务前，必须检查：

```
□ 这项改动是否符合"灵感快速记录和完善"的定位？
□ 是否在禁止方向清单中？（修改同步架构、破坏 API 兼容性）
□ 是否仅针对灵感记录场景？
```

---

## 📁 核心文档路径

| 文档 | 路径 |
|------|------|
| 工作原则 | `docs/WORK_PRINCIPLES.md` |
| 产品规范 | `SPEC.md` |
| 设计文档 | `docs/design.md` |
| 代码规范 | `CODE_STANDARDS.md` |
| 实现计划 | `docs/implementation-plan.md` |
| 错误库 | `docs/ERROR_LIBRARY.md` |

---

## 📂 项目架构概览

```
desktop-pet/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── main.ts             # 主入口
│   │   ├── ipc.ts              # IPC 通信
│   │   ├── tray.ts             # 托盘管理
│   │   ├── controllers/        # 控制器模块
│   │   │   ├── app-controller.ts
│   │   │   ├── config-controller.ts
│   │   │   ├── llm-controller.ts
│   │   │   ├── sync-controller.ts
│   │   │   └── memory-promotion-controller.ts
│   │   ├── sync/               # 同步模块
│   │   │   ├── discovery.ts    # 设备发现
│   │   │   ├── server.ts       # HTTP 服务器
│   │   │   ├── syncManager.ts  # 同步管理器
│   │   │   └── types.ts
│   │   ├── llm/                # LLM 模块
│   │   │   ├── model-config.ts
│   │   │   └── model-selector.ts
│   │   └── database/           # 数据库
│   │       └── engine.ts
│   │
│   ├── preload/                # 预加载脚本
│   │   └── preload.ts
│   │
│   └── renderer/               # React 渲染进程
│       ├── components/
│       │   ├── FloatingWidget.tsx
│       │   ├── ChatWindow.tsx
│       │   ├── MessageBubble.tsx
│       │   ├── SettingsPanel.tsx
│       │   └── MemoryPromotionPanel.tsx
│       ├── hooks/
│       │   ├── useChat.ts
│       │   └── useLocalModel.ts
│       ├── store/
│       │   └── useStore.ts
│       └── types/
│           └── index.ts
│
├── docs/
│   ├── design.md
│   ├── implementation-plan.md
│   ├── ERROR_LIBRARY.md
│   └── WORK_PRINCIPLES.md
│
├── package.json
├── tsconfig.json
├── electron-vite.config.ts
├── CODE_STANDARDS.md
└── SPEC.md
```

---

## 🔄 数据同步架构

```
桌面宠物 (Desktop Pet) [端口: 3001]
    ↓ [单向]
灵感调酒师 (Inspiration Bartender) [端口: 3002]
    ↓ [单向]
AI写作教练 (AI Writing Coach) [端口: 3003]
```

---

## 📋 快速参考

### 工作流程（每次任务）

1. **功能对齐检查** → 通过后继续
2. **设计方案** → 形成文档（简洁优先）
3. **Coder Subagent 编写** → general_purpose_task
4. **Reviewer Subagent 审查** → search（只给意见）
5. **Coder Subagent 修复** → 如审查不通过
6. **Reviewer Subagent 复查** → 循环直至通过
7. **完整检查** → typecheck → oxlint → prettier
8. **提交并推送**

### 快速检查清单

```
开始任务前:
□ 功能对齐检查通过？（原则零）
□ 有设计方案？（原则一）
□ 计划使用 Coder + Reviewer 双 subagent？（原则二）
□ 查阅了 ERROR_LIBRARY.md 避免重复踩坑？（原则三）
□ 有可复用的现有代码？（原则四）

任务完成后:
□ typecheck 通过？（npm run typecheck）
□ oxlint 通过？（npm run lint）
□ prettier 格式化？（npm run format）
□ 更新 ERROR_LIBRARY.md？（原则三）
```

### 禁止方向（除非用户明确批准）

| 禁止方向 | 原因 |
|---------|------|
| 修改核心同步架构 | 违背"单向数据流"设计 |
| 破坏与灵感调酒师的兼容性 | 需保持 API 接口一致 |
| 全自动流水线 | 违背"用户主导全程" |

---

## 🛠️ 技术栈

- **Electron** - 桌面应用框架
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Zustand** - 状态管理
- **Framer Motion** - 动画效果
- **Lucide React** - 图标库

---

## 📝 代码规范

必须遵循 `CODE_STANDARDS.md` 中的所有规定：

1. **TypeScript 类型定义** - 优先使用 `interface`，避免 `any`
2. **React 组件** - 函数组件 + 命名导出
3. **组件结构** - Hooks → useMemo → useCallback → useEffect → 渲染
4. **Zustand Store** - 遵循标准 Store 结构
5. **IPC 通信** - 使用 `domain:action` 命名格式
6. **日志规范** - 统一日志标签格式

---

## Karpathy 四原则

| 原则 | 说明 |
|------|------|
| **K1: 编码前思考** | 不要假设，不要隐藏困惑，呈现权衡 |
| **K2: 简洁优先** | 用最少的代码解决问题，不要过度推测 |
| **K3: 精准修改** | 只碰必须碰的，只清理自己造成的混乱 |
| **K4: 目标驱动** | 定义成功标准，循环验证直到达成 |

---

*规则结束*
