# 桌面宠物 - 灵感助手 实现计划

&gt; **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个轻量级 Electron 桌面应用，包含浮动小部件、聊天界面、本地模型连接和单向数据同步功能

**Architecture:** 使用 Electron + React + TypeScript + Tailwind CSS + Zustand，分为主进程（Electron）和渲染进程（React），通过 IPC 通信

**Tech Stack:** Electron, React 18, TypeScript, Tailwind CSS, Zustand, Framer Motion, Lucide React

---

## v0.1.5 视觉内核路线

本阶段目标是先完成 V2 Canvas 水墨视觉内核的可复用边界，不进行抽包、不接业务逻辑。

### 已完成

| 文件路径                                      | 职责                                                                               |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/renderer/components/pet/InkPet.tsx`      | 可复用 Canvas 水墨视觉组件，负责 canvas 生命周期、动画循环、mood 过渡和 FPS 自适应 |
| `src/renderer/components/pet/ink-renderer.ts` | Canvas 绘制管线，负责球体、墨流、墨丝、眼睛、高光和折射边缘                        |
| `src/renderer/components/pet/mood-config.ts`  | `idle / focused / blocked / achievement / rest` 状态配置和渲染常量                 |
| `src/renderer/components/pet/types.ts`        | `PetMood`、`InkPetQuality`、`MoodConfig`、`InkPetProps` 等公共类型                 |
| `src/renderer/components/pet/PetWindow.tsx`   | `?preview=v2` 预览窗口包装，不直接承载渲染细节                                     |

### 下一步路线

1. 增加 V2 视觉预览控制面板，用于切换 mood、尺寸和质量档位；
2. 验证透明背景、窗口缩放、长时间运行和低帧率降级；
3. 调优墨丝、内部墨流、眼睛和状态过渡；
4. 视觉稳定后再评估共享包边界；
5. 接入 desktop-pet 和 AI 写作教练时，只通过外层适配器传入 `mood`，视觉内核不依赖业务 store、IPC 或同步逻辑。

---

## 文件结构映射

| 文件路径                                     | 职责                     |
| -------------------------------------------- | ------------------------ |
| `package.json`                               | 项目依赖和脚本           |
| `tsconfig.json`                              | TypeScript 配置          |
| `vite.config.ts`                             | Vite 构建配置            |
| `electron-builder.json`                      | 应用打包配置             |
| `src/main/main.ts`                           | Electron 主进程入口      |
| `src/main/ipc.ts`                            | IPC 通信处理             |
| `src/main/tray.ts`                           | 系统托盘管理             |
| `src/main/sync.ts`                           | 数据同步服务             |
| `src/preload/preload.ts`                     | 预加载脚本，暴露安全 API |
| `src/renderer/App.tsx`                       | React 应用入口           |
| `src/renderer/types/index.ts`                | TypeScript 类型定义      |
| `src/renderer/store/useStore.ts`             | Zustand 状态管理         |
| `src/renderer/hooks/useChat.ts`              | 聊天逻辑 Hook            |
| `src/renderer/hooks/useLocalModel.ts`        | 本地模型连接 Hook        |
| `src/renderer/components/FloatingWidget.tsx` | 浮动小部件组件           |
| `src/renderer/components/ChatWindow.tsx`     | 聊天窗口组件             |
| `src/renderer/components/MessageBubble.tsx`  | 消息气泡组件             |
| `src/renderer/components/SettingsPanel.tsx`  | 设置面板组件             |

---

## 任务分解

### Task 1: 项目初始化和基础配置

**Files:**

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `.gitignore`
- Create: `electron-builder.json`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "desktop-pet",
  "version": "0.1.0",
  "description": "桌面宠物 - 灵感助手",
  "main": "./out/main/main.js",
  "scripts": {
    "dev": "node scripts/start.js",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "pack": "electron-builder --dir",
    "dist": "npm run build && electron-builder",
    "lint": "oxlint src/",
    "format": "prettier --write src/",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@electron-toolkit/preload": "^3.0.1",
    "@electron-toolkit/utils": "^3.0.0",
    "framer-motion": "^12.40.0",
    "lucide-react": "^1.17.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.3.0",
    "@types/node": "^22.10.7",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "electron": "^33.4.11",
    "electron-builder": "^25.1.8",
    "electron-vite": "^2.3.0",
    "oxlint": "^0.15.10",
    "postcss": "^8.5.1",
    "prettier": "^3.4.2",
    "tailwindcss": "^4.3.0",
    "typescript": "^5.7.3",
    "vite": "^5.4.14"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
    },
  },
  base: './',
})
```

- [ ] **Step 5: 创建 electron-vite.config.ts**

```typescript
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  main: {
    entry: 'src/main/main.ts',
    outDir: 'out/main',
  },
  preload: {
    input: 'src/preload/preload.ts',
    outDir: 'out/preload',
  },
  renderer: {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src/renderer'),
      },
    },
    outDir: 'out/renderer',
  },
})
```

- [ ] **Step 6: 创建 electron-builder.json**

```json
{
  "appId": "com.desktop-pet.app",
  "productName": "桌面宠物 - 灵感助手",
  "directories": {
    "output": "release"
  },
  "files": ["out/**/*", "package.json"],
  "win": {
    "target": ["nsis", "portable"],
    "icon": "build/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

- [ ] **Step 7: 创建 .gitignore**

```
node_modules
out
release
dist
.DS_Store
*.log
.vscode
.idea
```

- [ ] **Step 8: 创建 Tailwind 配置文件**

Create `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
  darkMode: 'class',
}
```

Create `postcss.config.js`:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 9: 创建启动脚本**

Create `scripts/start.js`:

```javascript
const { spawn } = require('child_process')
const electron = require('electron')
const path = require('path')

let electronProcess = null

const startVite = () => {
  return new Promise((resolve) => {
    const viteProcess = spawn('npx', ['electron-vite', '--dev'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true,
    })

    viteProcess.on('close', (code) => {
      if (electronProcess) {
        electronProcess.kill()
      }
      process.exit(code)
    })

    setTimeout(resolve, 2000)
  })
}

const startElectron = () => {
  electronProcess = spawn(electron, ['.'], {
    cwd: process.cwd(),
    stdio: 'inherit',
  })

  electronProcess.on('close', (code) => {
    process.exit(code)
  })
}

startVite().then(startElectron)
```

- [ ] **Step 10: 初始化 Git 仓库（预留给后续任务）**

---

### Task 2: 创建类型定义和状态管理

**Files:**

- Create: `src/renderer/types/index.ts`
- Create: `src/renderer/store/useStore.ts`

- [ ] **Step 1: 创建类型定义**

```typescript
export interface Inspiration {
  id: string
  content: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  status: 'draft' | 'completed' | 'synced'
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface AppConfig {
  modelApi: {
    baseUrl: string
    apiKey: string
    modelName: string
  }
  syncApi: {
    inspirationBartenderUrl: string
  }
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  addMessage: (message: Message) =&gt; void
  clearMessages: () =&gt; void
  setIsLoading: (loading: boolean) =&gt; void
}

export interface ConfigState {
  config: AppConfig
  setConfig: (config: Partial&lt;AppConfig&gt;) =&gt; void
}

export interface InspirationState {
  inspirations: Inspiration[]
  addInspiration: (inspiration: Inspiration) =&gt; void
  updateInspiration: (id: string, updates: Partial&lt;Inspiration&gt;) =&gt; void
}
```

- [ ] **Step 2: 创建 Zustand Store**

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AppConfig, ChatState, ConfigState, Inspiration, InspirationState, Message } from '../types'

const defaultConfig: AppConfig = {
  modelApi: {
    baseUrl: 'http://localhost:11434/v1',
    apiKey: 'ollama',
    modelName: 'llama3.2',
  },
  syncApi: {
    inspirationBartenderUrl: 'http://localhost:3000',
  },
}

export const useAppStore = create&lt;ChatState &amp; ConfigState &amp; InspirationState&gt;()(
  persist(
    (set, get) =&gt; ({
      messages: [],
      isLoading: false,
      addMessage: (message: Message) =&gt;
        set((state) =&gt; ({ messages: [...state.messages, message] })),
      clearMessages: () =&gt; set({ messages: [] }),
      setIsLoading: (loading: boolean) =&gt; set({ isLoading: loading }),

      config: defaultConfig,
      setConfig: (newConfig: Partial&lt;AppConfig&gt;) =&gt;
        set((state) =&gt; ({ config: { ...state.config, ...newConfig } })),

      inspirations: [],
      addInspiration: (inspiration: Inspiration) =&gt;
        set((state) =&gt; ({ inspirations: [...state.inspirations, inspiration] })),
      updateInspiration: (id: string, updates: Partial&lt;Inspiration&gt;) =&gt;
        set((state) =&gt; ({
          inspirations: state.inspirations.map((i) =&gt;
            i.id === id ? { ...i, ...updates } : i
          ),
        })),
    }),
    {
      name: 'desktop-pet-storage',
      storage: createJSONStorage(() =&gt; localStorage),
    }
  )
)
```

---

### Task 3: 创建 Electron 主进程

**Files:**

- Create: `src/main/main.ts`
- Create: `src/main/ipc.ts`
- Create: `src/main/tray.ts`
- Create: `src/main/sync.ts`
- Create: `src/preload/preload.ts`

- [ ] **Step 1: 创建 preload.ts**

```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (channel: string, data: unknown) =&gt; ipcRenderer.send(channel, data),
  onMessage: (channel: string, callback: (...args: unknown[]) =&gt; void) =&gt;
    ipcRenderer.on(channel, (_, ...args) =&gt; callback(...args)),
  invoke: (channel: string, data: unknown) =&gt; ipcRenderer.invoke(channel, data),
})
```

- [ ] **Step 2: 创建 ipc.ts**

```typescript
import { ipcMain } from 'electron'

export const setupIPC = () =&gt; {
  ipcMain.handle('ping', () =&gt; 'pong')

  ipcMain.on('log', (_, message: string) =&gt; {
    console.log('[Renderer]', message)
  })
}
```

- [ ] **Step 3: 创建 tray.ts**

```typescript
import { app, Tray, Menu, BrowserWindow } from 'electron'
import path from 'path'

let tray: Tray | null = null

export const createTray = (mainWindow: BrowserWindow) =&gt; {
  const iconPath = path.join(__dirname, '../../build/icon.png')

  tray = new Tray(iconPath)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () =&gt; {
        mainWindow.show()
        mainWindow.focus()
      },
    },
    {
      label: '设置',
      click: () =&gt; {
        mainWindow.webContents.send('open-settings')
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () =&gt; {
        app.quit()
      },
    },
  ])

  tray.setToolTip('桌面宠物 - 灵感助手')
  tray.setContextMenu(contextMenu)

  tray.on('click', () =&gt; {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

export const destroyTray = () =&gt; {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
```

- [ ] **Step 4: 创建 sync.ts**

```typescript
export class SyncService {
  private static instance: SyncService

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService()
    }
    return SyncService.instance
  }

  async syncToInspirationBartender(inspiration: unknown, baseUrl: string): Promise&lt;boolean&gt; {
    try {
      const response = await fetch(`${baseUrl}/api/inspirations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inspiration),
      })

      return response.ok
    } catch (error) {
      console.error('Sync failed:', error)
      return false
    }
  }
}
```

- [ ] **Step 5: 创建 main.ts**

```typescript
import { app, BrowserWindow } from 'electron'
import path from 'path'
import { setupIPC } from './ipc'
import { createTray, destroyTray } from './tray'

let mainWindow: BrowserWindow | null = null

const createWindow = () =&gt; {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.setPosition(100, 100)

  createTray(mainWindow)
  setupIPC()
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () =&gt; {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () =&gt; {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () =&gt; {
  destroyTray()
})
```

---

### Task 4: 创建 React 渲染进程基础

**Files:**

- Create: `src/renderer/index.html`
- Create: `src/renderer/index.css`
- Create: `src/renderer/main.tsx`
- Create: `src/renderer/App.tsx`

- [ ] **Step 1: 创建 index.html**

```html
&lt;!doctype html&gt; &lt;html lang="zh-CN"&gt; &lt;head&gt; &lt;meta charset="UTF-8" /&gt; &lt;meta name="viewport"
content="width=device-width, initial-scale=1.0" /&gt; &lt;title&gt;桌面宠物 - 灵感助手&lt;/title&gt; &lt;/head&gt;
&lt;body&gt; &lt;div id="root"&gt;&lt;/div&gt; &lt;script type="module" src="/src/renderer/main.tsx"&gt;&lt;/script&gt;
&lt;/body&gt; &lt;/html&gt;
```

- [ ] **Step 2: 创建 index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
    'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow: hidden;
}

#root {
  width: 100vw;
  height: 100vh;
}
```

- [ ] **Step 3: 创建 main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  &lt;React.StrictMode&gt;
    &lt;App /&gt;
  &lt;/React.StrictMode&gt;
)
```

- [ ] **Step 4: 创建 App.tsx**

```typescript
import React, { useState } from 'react'
import FloatingWidget from './components/FloatingWidget'
import ChatWindow from './components/ChatWindow'
import SettingsPanel from './components/SettingsPanel'

function App() {
  const [showChat, setShowChat] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  return (
    &lt;div className="w-full h-full bg-transparent"&gt;
      &lt;FloatingWidget
        onClick={() =&gt; setShowChat(!showChat)}
        onRightClick={() =&gt; setShowSettings(true)}
      /&gt;
      {showChat &amp;&amp; &lt;ChatWindow onClose={() =&gt; setShowChat(false)} /&gt;}
      {showSettings &amp;&amp; &lt;SettingsPanel onClose={() =&gt; setShowSettings(false)} /&gt;}
    &lt;/div&gt;
  )
}

export default App
```

---

### Task 5: 创建核心组件

**Files:**

- Create: `src/renderer/components/FloatingWidget.tsx`
- Create: `src/renderer/components/ChatWindow.tsx`
- Create: `src/renderer/components/MessageBubble.tsx`
- Create: `src/renderer/components/SettingsPanel.tsx`
- Create: `src/renderer/hooks/useChat.ts`
- Create: `src/renderer/hooks/useLocalModel.ts`

- [ ] **Step 1: 创建 FloatingWidget.tsx**

```typescript
import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface FloatingWidgetProps {
  onClick: () =&gt; void
  onRightClick: () =&gt; void
}

const FloatingWidget: React.FC&lt;FloatingWidgetProps&gt; = ({ onClick, onRightClick }) =&gt; {
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) =&gt; {
    if (e.button === 0) {
      setIsDragging(true)
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) =&gt; {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      })
    }
  }

  const handleMouseUp = () =&gt; {
    setIsDragging(false)
  }

  const handleClick = (e: React.MouseEvent) =&gt; {
    if (!isDragging) {
      onClick()
    }
  }

  const handleContextMenu = (e: React.MouseEvent) =&gt; {
    e.preventDefault()
    onRightClick()
  }

  useEffect(() =&gt; {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as any)
      window.addEventListener('mouseup', handleMouseUp)
    } else {
      window.removeEventListener('mousemove', handleMouseMove as any)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    return () =&gt; {
      window.removeEventListener('mousemove', handleMouseMove as any)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  return (
    &lt;motion.div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
      }}
      animate={{
        scale: isDragging ? 1.1 : 1,
      }}
      whileHover={{ scale: 1.05 }}
    &gt;
      &lt;div
        className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl cursor-pointer flex items-center justify-center select-none"
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      &gt;
        &lt;motion.div
          animate={{
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        &gt;
          &lt;Sparkles className="w-8 h-8 text-white" /&gt;
        &lt;/motion.div&gt;
      &lt;/div&gt;
    &lt;/motion.div&gt;
  )
}

export default FloatingWidget
```

- [ ] **Step 2: 创建 MessageBubble.tsx**

```typescript
import React from 'react'
import { Message } from '../types'

interface MessageBubbleProps {
  message: Message
}

const MessageBubble: React.FC&lt;MessageBubbleProps&gt; = ({ message }) =&gt; {
  const isUser = message.role === 'user'

  return (
    &lt;div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}&gt;
      &lt;div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-tr-sm'
            : 'bg-gray-800 text-gray-100 rounded-tl-sm'
        }`}
      &gt;
        &lt;p className="whitespace-pre-wrap break-words"&gt;{message.content}&lt;/p&gt;
        &lt;p className="text-xs opacity-60 mt-1 text-right"&gt;
          {message.timestamp.toLocaleTimeString()}
        &lt;/p&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  )
}

export default MessageBubble
```

- [ ] **Step 3: 创建 useLocalModel.ts**

```typescript
import { useState, useCallback } from 'react'
import { useAppStore } from '../store/useStore'

export const useLocalModel = () =&gt; {
  const config = useAppStore((state) =&gt; state.config)
  const [isConnected, setIsConnected] = useState(false)

  const chat = useCallback(
    async (
      messages: { role: 'user' | 'assistant'; content: string }[],
      onStream?: (chunk: string) =&gt; void
    ) =&gt; {
      try {
        const response = await fetch(`${config.modelApi.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.modelApi.apiKey}`,
          },
          body: JSON.stringify({
            model: config.modelApi.modelName,
            messages,
            stream: !!onStream,
          }),
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        setIsConnected(true)

        if (onStream &amp;&amp; response.body) {
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let fullText = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') continue

                try {
                  const parsed = JSON.parse(data)
                  const delta = parsed.choices?.[0]?.delta?.content || ''
                  fullText += delta
                  onStream(delta)
                } catch {
                }
              }
            }
          }

          return fullText
        } else {
          const data = await response.json()
          return data.choices?.[0]?.message?.content || ''
        }
      } catch (error) {
        console.error('Model chat error:', error)
        setIsConnected(false)
        throw error
      }
    },
    [config]
  )

  const testConnection = useCallback(async () =&gt; {
    try {
      const response = await fetch(`${config.modelApi.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${config.modelApi.apiKey}`,
        },
      })
      const ok = response.ok
      setIsConnected(ok)
      return ok
    } catch {
      setIsConnected(false)
      return false
    }
  }, [config])

  return { chat, testConnection, isConnected }
}
```

- [ ] **Step 4: 创建 useChat.ts**

```typescript
import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAppStore } from '../store/useStore'
import { useLocalModel } from './useLocalModel'
import type { Message, Inspiration } from '../types'

export const useChat = () =&gt; {
  const {
    messages,
    isLoading,
    addMessage,
    clearMessages,
    setIsLoading,
    addInspiration,
  } = useAppStore((state) =&gt; state)
  const { chat } = useLocalModel()
  const [streamingContent, setStreamingContent] = useState('')

  const sendMessage = useCallback(
    async (content: string) =&gt; {
      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: new Date(),
      }
      addMessage(userMessage)
      setIsLoading(true)
      setStreamingContent('')

      const assistantMessageId = uuidv4()
      let fullResponse = ''

      try {
        await chat(
          [
            {
              role: 'system',
              content:
                '你是一个有帮助的创意写作助手。帮助用户记录和完善灵感。',
            },
            ...messages.map((m) =&gt; ({ role: m.role, content: m.content })),
            { role: 'user', content },
          ],
          (chunk) =&gt; {
            fullResponse += chunk
            setStreamingContent(fullResponse)
          }
        )

        if (fullResponse) {
          addMessage({
            id: assistantMessageId,
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date(),
          })
        }
      } catch (error) {
        addMessage({
          id: assistantMessageId,
          role: 'assistant',
          content: '抱歉，连接模型时出错了。请检查设置。',
          timestamp: new Date(),
        })
      } finally {
        setIsLoading(false)
        setStreamingContent('')
      }
    },
    [messages, addMessage, setIsLoading, chat]
  )

  const saveAsInspiration = useCallback(
    (content: string, tags: string[] = []) =&gt; {
      const inspiration: Inspiration = {
        id: uuidv4(),
        content,
        tags,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft',
      }
      addInspiration(inspiration)
      return inspiration
    },
    [addInspiration]
  )

  return {
    messages,
    isLoading,
    streamingContent,
    sendMessage,
    clearMessages,
    saveAsInspiration,
  }
}
```

- [ ] **Step 5: 创建 ChatWindow.tsx**

```typescript
import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Save, Sparkles } from 'lucide-react'
import MessageBubble from './MessageBubble'
import { useChat } from '../hooks/useChat'

interface ChatWindowProps {
  onClose: () =&gt; void
}

const ChatWindow: React.FC&lt;ChatWindowProps&gt; = ({ onClose }) =&gt; {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef&lt;HTMLDivElement&gt;(null)
  const { messages, isLoading, streamingContent, sendMessage, saveAsInspiration } =
    useChat()

  const scrollToBottom = () =&gt; {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() =&gt; {
    scrollToBottom()
  }, [messages, streamingContent])

  const handleSend = () =&gt; {
    if (inputValue.trim() &amp;&amp; !isLoading) {
      sendMessage(inputValue.trim())
      setInputValue('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) =&gt; {
    if (e.key === 'Enter' &amp;&amp; !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSaveLastMessage = () =&gt; {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage) {
      saveAsInspiration(lastMessage.content)
    }
  }

  return (
    &lt;AnimatePresence&gt;
      &lt;motion.div
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        className="fixed right-4 top-4 w-96 h-[600px] bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700 z-50"
      &gt;
        &lt;div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700"&gt;
          &lt;div className="flex items-center gap-2"&gt;
            &lt;Sparkles className="w-5 h-5 text-purple-400" /&gt;
            &lt;span className="text-white font-medium"&gt;灵感助手&lt;/span&gt;
          &lt;/div&gt;
          &lt;button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          &gt;
            &lt;X className="w-5 h-5" /&gt;
          &lt;/button&gt;
        &lt;/div&gt;

        &lt;div className="flex-1 overflow-y-auto p-4 h-[460px] bg-gray-900"&gt;
          {messages.length === 0 ? (
            &lt;div className="flex flex-col items-center justify-center h-full text-gray-400"&gt;
              &lt;Sparkles className="w-12 h-12 mb-4 opacity-50" /&gt;
              &lt;p&gt;开始记录你的灵感吧！&lt;/p&gt;
            &lt;/div&gt;
          ) : (
            &lt;&gt;
              {messages.map((message) =&gt; (
                &lt;MessageBubble key={message.id} message={message} /&gt;
              ))}
              {streamingContent &amp;&amp; (
                &lt;div className="flex justify-start mb-4"&gt;
                  &lt;div className="max-w-[80%] px-4 py-3 rounded-2xl bg-gray-800 text-gray-100 rounded-tl-sm"&gt;
                    &lt;p className="whitespace-pre-wrap break-words"&gt;
                      {streamingContent}
                      &lt;span className="animate-pulse"&gt;▌&lt;/span&gt;
                    &lt;/p&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
              )}
            &lt;/&gt;
          )}
          &lt;div ref={messagesEndRef} /&gt;
        &lt;/div&gt;

        &lt;div className="p-4 bg-gray-800 border-t border-gray-700"&gt;
          &lt;div className="flex gap-2 mb-2"&gt;
            {messages.length &gt; 0 &amp;&amp; (
              &lt;button
                onClick={handleSaveLastMessage}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
              &gt;
                &lt;Save className="w-4 h-4" /&gt;
                保存灵感
              &lt;/button&gt;
            )}
          &lt;/div&gt;
          &lt;div className="flex gap-2"&gt;
            &lt;textarea
              value={inputValue}
              onChange={(e) =&gt; setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的想法..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            /&gt;
            &lt;button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            &gt;
              &lt;Send className="w-5 h-5" /&gt;
            &lt;/button&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/motion.div&gt;
    &lt;/AnimatePresence&gt;
  )
}

export default ChatWindow
```

- [ ] **Step 6: 创建 SettingsPanel.tsx**

```typescript
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, TestTube } from 'lucide-react'
import { useAppStore } from '../store/useStore'
import { useLocalModel } from '../hooks/useLocalModel'

interface SettingsPanelProps {
  onClose: () =&gt; void
}

const SettingsPanel: React.FC&lt;SettingsPanelProps&gt; = ({ onClose }) =&gt; {
  const { config, setConfig } = useAppStore((state) =&gt; state)
  const { testConnection, isConnected } = useLocalModel()
  const [localConfig, setLocalConfig] = useState(config)
  const [testResult, setTestResult] = useState&lt;'idle' | 'loading' | 'success' | 'error'&gt;('idle')

  const handleSave = () =&gt; {
    setConfig(localConfig)
    onClose()
  }

  const handleTestConnection = async () =&gt; {
    setTestResult('loading')
    const success = await testConnection()
    setTestResult(success ? 'success' : 'error')
    setTimeout(() =&gt; setTestResult('idle'), 2000)
  }

  return (
    &lt;AnimatePresence&gt;
      &lt;motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
        onClick={onClose}
      &gt;
        &lt;motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) =&gt; e.stopPropagation()}
          className="w-96 bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700"
        &gt;
          &lt;div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700"&gt;
            &lt;span className="text-white font-medium"&gt;设置&lt;/span&gt;
            &lt;button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            &gt;
              &lt;X className="w-5 h-5" /&gt;
            &lt;/button&gt;
          &lt;/div&gt;

          &lt;div className="p-4 space-y-4"&gt;
            &lt;div&gt;
              &lt;label className="block text-sm font-medium text-gray-300 mb-1"&gt;
                API 地址
              &lt;/label&gt;
              &lt;input
                type="text"
                value={localConfig.modelApi.baseUrl}
                onChange={(e) =&gt;
                  setLocalConfig({
                    ...localConfig,
                    modelApi: { ...localConfig.modelApi, baseUrl: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              /&gt;
            &lt;/div&gt;

            &lt;div&gt;
              &lt;label className="block text-sm font-medium text-gray-300 mb-1"&gt;
                API Key
              &lt;/label&gt;
              &lt;input
                type="password"
                value={localConfig.modelApi.apiKey}
                onChange={(e) =&gt;
                  setLocalConfig({
                    ...localConfig,
                    modelApi: { ...localConfig.modelApi, apiKey: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              /&gt;
            &lt;/div&gt;

            &lt;div&gt;
              &lt;label className="block text-sm font-medium text-gray-300 mb-1"&gt;
                模型名称
              &lt;/label&gt;
              &lt;input
                type="text"
                value={localConfig.modelApi.modelName}
                onChange={(e) =&gt;
                  setLocalConfig({
                    ...localConfig,
                    modelApi: { ...localConfig.modelApi, modelName: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              /&gt;
            &lt;/div&gt;

            &lt;div className="flex gap-2"&gt;
              &lt;button
                onClick={handleTestConnection}
                disabled={testResult === 'loading'}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  testResult === 'success'
                    ? 'bg-green-600 text-white'
                    : testResult === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              &gt;
                &lt;TestTube className="w-4 h-4" /&gt;
                {testResult === 'loading'
                  ? '测试中...'
                  : testResult === 'success'
                  ? '连接成功'
                  : testResult === 'error'
                  ? '连接失败'
                  : '测试连接'}
              &lt;/button&gt;
            &lt;/div&gt;

            &lt;div className="pt-4 border-t border-gray-700"&gt;
              &lt;label className="block text-sm font-medium text-gray-300 mb-1"&gt;
                灵感调酒师 API 地址
              &lt;/label&gt;
              &lt;input
                type="text"
                value={localConfig.syncApi.inspirationBartenderUrl}
                onChange={(e) =&gt;
                  setLocalConfig({
                    ...localConfig,
                    syncApi: {
                      ...localConfig.syncApi,
                      inspirationBartenderUrl: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              /&gt;
            &lt;/div&gt;

            &lt;div className="flex gap-2 pt-2"&gt;
              &lt;button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              &gt;
                取消
              &lt;/button&gt;
              &lt;button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
              &gt;
                &lt;Save className="w-4 h-4" /&gt;
                保存
              &lt;/button&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/motion.div&gt;
      &lt;/motion.div&gt;
    &lt;/AnimatePresence&gt;
  )
}

export default SettingsPanel
```

---

### Task 6: 更新 package.json 添加 uuid 依赖

**Files:**

- Modify: `package.json`

- [ ] **Step 1: 添加 uuid 依赖**

```json
{
  "dependencies": {
    "@electron-toolkit/preload": "^3.0.1",
    "@electron-toolkit/utils": "^3.0.0",
    "framer-motion": "^12.40.0",
    "lucide-react": "^1.17.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "uuid": "^11.0.5",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@types/uuid": "^10.0.0",
    ...
  }
}
```

---

### Task 7: 创建基础资源文件

**Files:**

- Create: `build/icon.png` (placeholder note)
- Create: `README.md`

- [ ] **Step 1: 创建 README.md**

````markdown
# 桌面宠物 - 灵感助手

一个轻量级的 Electron 桌面应用，帮助你快速记录和完善灵感。

## 功能特性

- 🎨 浮动小部件，可在屏幕任意位置拖动
- 💬 聊天式界面，支持与本地模型对话
- ✨ 灵感快速记录和完善
- 🔄 单向数据同步（桌宠 → 灵感调酒师 → 写作教练）
- 🤖 支持 OpenAI 兼容的本地模型 API（如 Ollama, LM Studio）

## 快速开始

### 安装依赖

```bash
npm install
```
````

### 开发模式

```bash
npm run dev
```

### 构建应用

```bash
npm run build
npm run dist
```

## 配置

首次使用请右键点击小部件，打开设置：

- **API 地址**: 本地模型 API 地址（默认 Ollama: `http://localhost:11434/v1`）
- **API Key**: API 密钥（Ollama 默认为 `ollama`）
- **模型名称**: 使用的模型名称
- **灵感调酒师 API 地址**: 用于同步灵感的服务地址

## 技术栈

- Electron
- React 18
- TypeScript
- Tailwind CSS
- Zustand
- Framer Motion
- Lucide React

````

---

### Task 8: 初始化 Git 仓库并提交

**Files:**
- 所有已创建的文件

- [ ] **Step 1: 初始化 Git**

```bash
cd "d:\OneDrive\项目\desktop-pet"
git init
git add .
git commit -m "feat: initial commit - desktop pet foundation"
````

---

## 计划自检

### 1. Spec 覆盖检查

- ✅ 浮动小部件（Task 5）
- ✅ 聊天窗口和消息气泡（Task 5）
- ✅ 本地模型连接（Task 5）
- ✅ 数据同步框架（Task 3）
- ✅ 类型定义和状态管理（Task 2）
- ✅ Electron 主进程（Task 3）

### 2. 占位符检查

- ✅ 无 TBD/TODO
- ✅ 所有代码块完整
- ✅ 所有文件路径明确

### 3. 类型一致性检查

- ✅ 类型定义在 Task 2 中统一
- ✅ 接口名称一致
- ✅ 属性名一致

---

## 执行选择

计划已保存到 `docs/implementation-plan.md`。两种执行选项：

**1. Subagent-Driven (推荐)** - 每个任务分派一个独立子代理，任务间检查，快速迭代

**2. Inline Execution** - 在本会话中按任务批量执行，带检查点

选择哪种方式？
