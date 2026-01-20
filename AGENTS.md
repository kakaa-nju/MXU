# MXU 项目指南

本文档旨在帮助开发者（包括 AI）快速了解 MXU 项目结构，以便参与开发。

## 项目概述

**MXU** 是一个基于 [MaaFramework ProjectInterface V2](https://github.com/MaaXYZ/MaaFramework/blob/main/docs/zh_cn/3.3-ProjectInterfaceV2协议.md) 协议的通用 GUI 客户端，使用 Tauri 2 + React 19 + TypeScript 构建。

它解析符合 PI V2 标准的 `interface.json` 文件，为 MaaFramework 生态中的自动化项目提供开箱即用的图形界面。

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 桌面框架 | Tauri | 2.x |
| 后端语言 | Rust | 1.70+ |
| 前端框架 | React | 19.x |
| 类型系统 | TypeScript | 5.8+ |
| 样式方案 | Tailwind CSS | 4.x |
| 状态管理 | Zustand | 5.x |
| 国际化 | i18next + react-i18next | - |
| 拖拽排序 | @dnd-kit | - |
| 图标 | Lucide React | - |
| 构建工具 | Vite | 7.x |

## 目录结构

```text
MXU/
├── src/                          # 前端源码
│   ├── App.tsx                   # 应用主入口
│   ├── main.tsx                  # React 挂载点
│   ├── index.css                 # 全局样式 (Tailwind)
│   ├── components/               # UI 组件
│   │   ├── TabBar.tsx            # 顶部标签栏（多开实例）
│   │   ├── TaskList.tsx          # 任务列表
│   │   ├── TaskItem.tsx          # 单个任务项
│   │   ├── OptionEditor.tsx      # 任务选项编辑器
│   │   ├── AddTaskPanel.tsx      # 添加任务面板
│   │   ├── Toolbar.tsx           # 底部工具栏（运行/停止按钮）
│   │   ├── ConnectionPanel.tsx   # 连接设置面板
│   │   ├── DeviceSelector.tsx    # 设备选择器
│   │   ├── ResourceSelector.tsx  # 资源选择器
│   │   ├── ScreenshotPanel.tsx   # 实时截图面板
│   │   ├── LogsPanel.tsx         # 运行日志面板
│   │   ├── SettingsPage.tsx      # 设置页面
│   │   ├── DashboardView.tsx     # 中控台视图
│   │   ├── SchedulePanel.tsx     # 定时执行面板
│   │   ├── UpdatePanel.tsx       # 更新面板
│   │   ├── UpdateInfoCard.tsx    # 更新信息卡片
│   │   ├── InstallConfirmModal.tsx # 安装确认模态框
│   │   ├── WelcomeDialog.tsx     # 欢迎弹窗
│   │   ├── ContextMenu.tsx       # 右键菜单
│   │   └── index.ts              # 组件导出
│   ├── stores/                   # 状态管理
│   │   └── appStore.ts           # Zustand 全局状态
│   ├── services/                 # 服务层
│   │   ├── maaService.ts         # MaaFramework 服务（封装 Tauri 命令）
│   │   ├── configService.ts      # 配置文件读写服务
│   │   ├── interfaceLoader.ts    # interface.json 加载器
│   │   ├── updateService.ts      # 更新服务（MirrorChyan/GitHub）
│   │   ├── contentResolver.ts    # 内容解析（Markdown 渲染等）
│   │   └── index.ts              # 服务导出
│   ├── types/                    # 类型定义
│   │   ├── interface.ts          # ProjectInterface V2 协议类型
│   │   ├── config.ts             # MXU 配置文件类型
│   │   └── maa.ts                # MaaFramework 相关类型
│   ├── i18n/                     # 国际化
│   │   ├── index.ts              # i18next 配置
│   │   └── locales/
│   │       ├── zh-CN.ts          # 简体中文
│   │       └── en-US.ts          # 英文
│   └── utils/                    # 工具函数
│       ├── index.ts              # 通用工具
│       ├── logger.ts             # 日志系统
│       ├── pipelineOverride.ts   # Pipeline 覆盖参数构建
│       └── useMaaCallbackLogger.ts # MAA 回调日志 Hook
├── src-tauri/                    # Rust 后端
│   ├── src/
│   │   ├── main.rs               # Windows 入口
│   │   ├── lib.rs                # Tauri 应用初始化
│   │   ├── maa_ffi.rs            # MaaFramework FFI 绑定
│   │   └── maa_commands.rs       # Tauri 命令实现
│   ├── tauri.conf.json           # Tauri 配置
│   ├── Cargo.toml                # Rust 依赖
│   └── capabilities/             # Tauri 权限配置
├── public/                       # 静态资源
├── index.html                    # HTML 入口
├── package.json                  # 前端依赖
├── vite.config.ts                # Vite 配置
├── tsconfig.json                 # TypeScript 配置
└── tailwind.config.js            # Tailwind 配置（如有）
```

## 核心概念

### 1. ProjectInterface V2 协议

MXU 解析 `interface.json` 文件，该文件定义了：

- **controller**: 控制器列表（Adb/Win32/PlayCover/Gamepad）
- **resource**: 资源包列表（每个资源包包含 pipeline 路径）
- **task**: 可执行的任务列表，包含 entry（入口节点）和 option（可配置选项）
- **option**: 选项定义（select/switch/input 类型）
- **agent**: Agent 配置（用于自定义识别器/动作）

### 2. 多实例架构

- 每个标签页代表一个独立的**实例 (Instance)**
- 每个实例有独立的：控制器连接、资源加载、任务列表、运行状态
- 实例状态在 `appStore.ts` 中管理

### 3. MaaFramework FFI

Rust 后端通过 `libloading` 动态加载 MaaFramework 库：

- `maa_ffi.rs`: 定义 FFI 类型和函数指针，实现动态加载
- `maa_commands.rs`: 实现 Tauri 命令，供前端调用

### 4. 状态管理 (Zustand)

`appStore.ts` 管理所有应用状态：

- 主题、语言、当前页面
- ProjectInterface 数据
- 多开实例列表和活动实例
- 运行时状态（连接状态、资源加载状态、任务状态）
- 日志、截图流等

状态变化会自动触发配置保存（防抖 500ms）。

### 5. 配置文件

用户配置保存在 `mxu-{项目名}.json`：

```json
{
  "version": "1.0",
  "instances": [...],  // 实例配置
  "settings": {        // 应用设置
    "theme": "light",
    "language": "zh-CN",
    "windowSize": { "width": 1000, "height": 618 },
    "mirrorChyan": { "cdk": "", "channel": "stable" }
  },
  "recentlyClosed": []  // 最近关闭的实例
}
```

## 开发注意事项

### 前端开发

1. **组件规范**
   - 使用函数组件 + Hooks
   - 使用 Tailwind CSS 进行样式设计
   - 使用 Lucide React 图标

2. **状态管理**
   - 全局状态使用 Zustand (`useAppStore`)
   - 组件本地状态使用 `useState`
   - 避免 prop drilling，优先使用 store

3. **国际化**
   - 所有用户可见文本必须使用 i18n
   - 在 `src/i18n/locales/` 中添加翻译
   - 同步更新中英文

4. **Tauri 环境检测**
   - 使用 `isTauri()` 检测是否在 Tauri 环境
   - 浏览器环境用于开发调试，功能受限

### Rust 后端开发

1. **FFI 绑定 (`maa_ffi.rs`)**
   - 新增 MaaFramework API 需要添加函数指针类型和加载逻辑
   - 注意平台差异（Windows/macOS/Linux 动态库命名）

2. **Tauri 命令 (`maa_commands.rs`)**
   - 命令使用 `#[tauri::command]` 宏
   - 异步操作通过回调事件通知前端（`maa-callback`）
   - 记得在 `lib.rs` 中注册新命令

3. **内存安全**
   - MaaFramework 句柄在 `InstanceRuntime` 中管理
   - `Drop` trait 确保资源正确释放
   - 原始指针已实现 `Send + Sync`（MaaFramework API 是线程安全的）

### 新增功能检查清单

- [ ] 前端组件实现
- [ ] Zustand 状态添加（如需要）
- [ ] Tauri 命令实现（如需要）
- [ ] 在 `lib.rs` 中注册 Tauri 命令
- [ ] 更新中英文国际化文本
- [ ] 更新类型定义（`types/` 目录）

## 常见开发场景

### 添加新的 Tauri 命令

1. 在 `maa_commands.rs` 中实现命令函数
2. 在 `lib.rs` 的 `invoke_handler` 中注册
3. 在 `maaService.ts` 中添加前端调用封装

### 添加新的配置项

1. 在 `types/config.ts` 中添加类型定义
2. 在 `appStore.ts` 中添加状态和 setter
3. 在 `generateConfig()` 中添加序列化逻辑
4. 在 `importConfig()` 中添加反序列化逻辑
5. 在 `useAppStore.subscribe` 中确保状态变化触发保存

### 添加新的 UI 组件

1. 在 `src/components/` 中创建组件文件
2. 在 `components/index.ts` 中导出
3. 使用 Tailwind CSS 样式，遵循现有设计风格
4. 如有用户可见文本，添加 i18n 支持

## 调试技巧

1. **前端调试**
   - 开发模式下可以使用 F12 打开开发者工具
   - 日志输出到控制台和 `exe/debug/` 目录

2. **后端调试**
   - Rust 日志输出到 `exe/debug/mxu-tauri.log`
   - Agent 输出到 `exe/debug/mxu-agent.log`

3. **MAA 回调调试**
   - 前端监听 `maa-callback` 事件
   - 使用 `useMaaCallbackLogger` Hook 自动记录

## 相关资源

- [MaaFramework](https://github.com/MaaXYZ/MaaFramework) - 底层自动化框架
- [ProjectInterface V2 协议](https://github.com/MaaXYZ/MaaFramework/blob/main/docs/zh_cn/3.3-ProjectInterfaceV2协议.md)
- [Tauri 文档](https://tauri.app/v2/)
- [React 文档](https://react.dev/)
- [Zustand 文档](https://zustand-demo.pmnd.rs/)
