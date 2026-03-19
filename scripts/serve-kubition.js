#!/usr/bin/env node

/**
 * kubition-advanture HTML 静态文件服务器
 * 用于启动 kubition-advanture 子仓库的 HTML 游戏
 */

import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

// ESM 中获取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 解析命令行参数
const args = process.argv.slice(2)
const argMap = {}

args.forEach((arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=')
    argMap[key] = value !== undefined ? value : true
  }
})

// 显示帮助信息
if (argMap.help || argMap.h) {
  console.log(`
kubition-advanture 静态文件服务器

用法: pnpm serve:kubition [选项]

选项:
  --port=<端口号>    指定服务器端口 (默认: 3000)
  --help, -h         显示帮助信息

示例:
  pnpm serve:kubition                    # 使用默认配置启动
  pnpm serve:kubition --port=8080        # 在 8080 端口启动
`)
  process.exit(0)
}

// 配置参数
const port = argMap.port || '3000'
const targetDir = path.resolve(__dirname, '../kubition-advanture')

console.log(`正在启动静态文件服务器...`)
console.log(`服务目录: ${targetDir}`)
console.log(`服务端口: ${port}`)

// 启动 serve 进程
const serveProcess = spawn('npx', ['serve', targetDir, '-p', port, '-s'], {
  shell: true,
  stdio: 'inherit',
})

// 处理进程退出
serveProcess.on('error', (err) => {
  console.error('启动服务器失败:', err.message)
  process.exit(1)
})

serveProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`服务器异常退出，退出码: ${code}`)
    process.exit(code)
  }
})

// 处理终止信号
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...')
  serveProcess.kill('SIGINT')
})

process.on('SIGTERM', () => {
  serveProcess.kill('SIGTERM')
})
