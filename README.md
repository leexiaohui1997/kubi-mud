# kubi-mud

🚀 一个现代化的 MUD（Multi-User Dungeon）游戏开发框架，基于 React 19 构建，提供沉浸式的文字冒险游戏开发体验。

## 技术栈

- **前端框架**：React 19 + TypeScript
- **构建工具**：Vite 8
- **样式方案**：Tailwind CSS v4
- **包管理器**：pnpm
- **代码规范**：ESLint 9 + Prettier
- **提交规范**：Commitlint + Husky

## 环境要求

- Node.js = 22.19.0
- pnpm = 10.32.1

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 其他脚本

| 命令                  | 说明                               |
| --------------------- | ---------------------------------- |
| `pnpm dev`            | 启动开发服务器                     |
| `pnpm build`          | 构建生产版本                       |
| `pnpm preview`        | 预览生产构建                       |
| `pnpm lint`           | 运行 ESLint 检查                   |
| `pnpm format`         | 格式化代码                         |
| `pnpm format:check`   | 检查代码格式                       |
| `pnpm serve:kubition` | 启动 kubition-advanture 游戏服务器 |

### 启动游戏

`kubition-advanture` 是以子仓库形式集成的 HTML 游戏，需通过本地 HTTP 服务器运行（直接打开 `index.html` 会因浏览器跨域限制导致资源加载失败）。

```bash
# 使用默认配置启动（端口 3000）
pnpm serve:kubition

# 指定端口
pnpm serve:kubition --port=8080

# 查看帮助
pnpm serve:kubition --help
```
