# 📋 错误库

> **版本**: 1.0
> **创建日期**: 2026-06-16
> **用途**: 记录开发过程中遇到的错误及解决方案，避免重复踩坑

---

## 错误分类

- 类型错误
- 运行时错误
- 逻辑错误
- 规范违反
- 架构问题

---

## 已记录错误

### [E-001] Electron 二进制缺失导致 `npm run dev` 启动失败

| 字段         | 内容                                                                                                                                                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **错误ID**   | E-001                                                                                                                                                                                                                                   |
| **发现日期** | 2026-06-18                                                                                                                                                                                                                              |
| **严重程度** | 中等                                                                                                                                                                                                                                    |
| **涉及文件** | `node_modules/electron`, `scripts/start.js`, `package.json`                                                                                                                                                                             |
| **错误类型** | 本地依赖安装错误                                                                                                                                                                                                                        |
| **错误描述** | 执行 `npm run dev` 时抛出 `Electron failed to install correctly, please delete node_modules/electron and try installing again`                                                                                                          |
| **错误原因** | 本地 Electron 安装脚本未正确执行，`node_modules/electron/dist/electron.exe` 缺失。npm 新策略可能拦截 install scripts，导致 Electron 包存在但二进制未下载。                                                                              |
| **修复方案** | 运行 `npm approve-scripts electron esbuild` 允许必要安装脚本，并重新执行依赖安装；若仍失败，删除 `node_modules/electron` 后重新 `npm install`。                                                                                         |
| **预防措施** | 保留 `package.json` 中的 `allowScripts` 配置；预览失败时先检查 `Test-Path node_modules\\electron\\dist\\electron.exe`；无法启动 Electron 时可用 `npx vite --host 127.0.0.1 --port 5174 src/renderer` 先验证 renderer 与 `?preview=v2`。 |

---

_文档结束_
