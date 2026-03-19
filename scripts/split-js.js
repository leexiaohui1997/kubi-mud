#!/usr/bin/env node
/**
 * split-js.js
 * 通用 JavaScript 文件拆分工具（方案 A：按代码结构类型拆分）
 *
 * 拆分标准：
 *   - components/   React 组件（React.createClass / class extends React.Component / 函数式组件）
 *   - classes/      普通类定义（class 关键字 / 构造函数 + prototype 模式）
 *   - functions/    独立工具函数（顶层 function 声明 / const fn = () => {}）
 *   - constants/    常量与配置（顶层 const/var/let 对象、数组、基本值）
 *   - index.js      入口文件（初始化逻辑、事件绑定、ReactDOM.render 等）
 *
 * 命名规范：
 *   - React 组件 / 类：PascalCase（如 GamePanel.js）
 *   - 函数 / 常量：camelCase（如 formatTime.js）
 *   - 同类型多个模块合并到同一文件时，使用 index.js 统一导出
 *
 * 用法：
 *   node scripts/split-js.js <源文件路径> <输出目录>
 *
 * 示例：
 *   node scripts/split-js.js ./kubition-advanture/src/main.js ./output/split
 *
 * 输出结构：
 *   <输出目录>/
 *   ├── components/
 *   │   ├── ComponentA.js
 *   │   ├── ComponentB.js
 *   │   └── index.js          ← 统一导出所有组件
 *   ├── classes/
 *   │   ├── ClassName.js
 *   │   └── index.js
 *   ├── functions/
 *   │   ├── functionName.js
 *   │   └── index.js
 *   ├── constants/
 *   │   └── constants.js      ← 所有常量合并到一个文件
 *   ├── index.js              ← 入口文件（初始化逻辑）
 *   └── DEPENDENCY_GRAPH.md  ← 依赖关系文档
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname, join } from 'path'

// ─── 加载 acorn 依赖 ──────────────────────────────────────────────────────────

let acorn, acornJsx

try {
  acorn = await import('acorn')
} catch {
  console.error('❌ 缺少依赖，请先安装：')
  console.error('   pnpm add acorn acorn-jsx --save-dev')
  process.exit(1)
}

try {
  // acorn-jsx 插件：让 acorn 能够解析 JSX 语法（<Component />, <div>...</div> 等）
  acornJsx = (await import('acorn-jsx')).default
} catch {
  console.error('❌ 缺少依赖，请先安装：')
  console.error('   pnpm add acorn-jsx --save-dev')
  process.exit(1)
}

// 创建支持 JSX 的 acorn 解析器
// acorn.Parser.extend() 将 JSX 插件注入到 acorn 解析器中
const JsxParser = acorn.Parser.extend(acornJsx())

// ─── 命令行参数解析 ───────────────────────────────────────────────────────────

/**
 * 解析命令行参数
 * @returns {{ srcFile: string, outDir: string }}
 */
function parseArgs() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    printUsage()
    process.exit(1)
  }

  return {
    srcFile: args[0],
    outDir: args[1],
  }
}

/** 打印使用帮助 */
function printUsage() {
  console.log('')
  console.log('用法：')
  console.log('  node scripts/split-js.js <源文件路径> <输出目录>')
  console.log('')
  console.log('示例：')
  console.log('  node scripts/split-js.js ./kubition-advanture/src/main.js ./output/split')
  console.log('')
}

// ─── 文件读取与 AST 解析 ──────────────────────────────────────────────────────

/**
 * 读取源文件内容
 * @param {string} filePath 文件绝对路径
 * @returns {string} 文件原始文本
 */
function readSource(filePath) {
  if (!existsSync(filePath)) {
    console.error(`❌ 文件不存在：${filePath}`)
    process.exit(1)
  }
  try {
    return readFileSync(filePath, 'utf-8')
  } catch (err) {
    console.error(`❌ 读取文件失败：${err.message}`)
    process.exit(1)
  }
}

/**
 * 将源代码解析为 AST
 * 解析策略（按优先级依次尝试，直到成功）：
 *   1. JSX + module 模式：支持 import/export 和 JSX 语法
 *   2. JSX + script 模式：支持旧式全局声明 + JSX 语法（如 React.createClass）
 *   3. 纯 module 模式：不含 JSX（兜底）
 *   4. 纯 script 模式：最宽松的兜底模式
 *
 * @param {string} code 源代码字符串
 * @returns {{ ast: object, sourceType: string }}
 */
function parseCode(code) {
  // ── 尝试 1：JSX + module 模式 ──────────────────────────────────────────────
  try {
    const ast = JsxParser.parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      // 保留注释位置信息，用于后续提取注释
      onComment: [],
    })
    return { ast, sourceType: 'module (JSX)' }
  } catch {
    /* 继续尝试下一种模式 */
  }

  // ── 尝试 2：JSX + script 模式（兼容旧代码，如 React.createClass 等）────────
  try {
    const ast = JsxParser.parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'script',
      onComment: [],
    })
    return { ast, sourceType: 'script (JSX)' }
  } catch {
    /* 继续尝试下一种模式 */
  }

  // ── 尝试 3：纯 module 模式（无 JSX）──────────────────────────────────────
  try {
    const ast = acorn.parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      onComment: [],
    })
    return { ast, sourceType: 'module' }
  } catch {
    /* 继续尝试下一种模式 */
  }

  // ── 尝试 4：纯 script 模式（最宽松的兜底）────────────────────────────────
  try {
    const ast = acorn.parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'script',
      onComment: [],
    })
    return { ast, sourceType: 'script' }
  } catch (err) {
    console.error(`❌ 代码解析失败（所有模式均不支持该语法）：${err.message}`)
    process.exit(1)
  }
}

// ─── 代码片段提取工具 ─────────────────────────────────────────────────────────

/**
 * 从源代码中按 AST 节点的位置范围提取原始代码片段
 * 同时向前查找紧贴该节点的注释（行注释 // 和块注释 /* *\/）
 *
 * @param {string} code 完整源代码
 * @param {object} node AST 节点（含 start/end 位置）
 * @param {string} [leadingComment=''] 前置注释文本（已提取好的）
 * @returns {string} 包含注释的代码片段
 */
function extractCodeSlice(code, node, leadingComment = '') {
  const slice = code.slice(node.start, node.end)
  if (leadingComment) {
    return leadingComment + '\n' + slice
  }
  return slice
}

/**
 * 提取节点前的紧贴注释
 * 策略：从节点 start 位置向前扫描，收集紧贴的 // 或 /* 注释
 *
 * @param {string} code 完整源代码
 * @param {number} nodeStart 节点起始位置
 * @returns {string} 注释文本（含换行），若无则返回空字符串
 */
function extractLeadingComment(code, nodeStart) {
  // 取节点前的文本，最多向前看 2000 个字符
  const lookback = code.slice(Math.max(0, nodeStart - 2000), nodeStart)
  const lines = lookback.split('\n')

  const commentLines = []
  // 从最后一行（紧贴节点的那行）向前扫描
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim()
    if (trimmed === '') {
      // 空行：如果已经收集到注释，停止；否则继续向前
      if (commentLines.length > 0) break
      continue
    }
    // 行注释
    if (trimmed.startsWith('//')) {
      commentLines.unshift(lines[i])
      continue
    }
    // 块注释结束行（*/）
    if (trimmed.endsWith('*/')) {
      // 向前找到块注释开始行（/*）
      commentLines.unshift(lines[i])
      for (let j = i - 1; j >= 0; j--) {
        commentLines.unshift(lines[j])
        if (lines[j].trim().startsWith('/*')) break
      }
      break
    }
    // 遇到非注释、非空行，停止
    break
  }

  return commentLines.length > 0 ? commentLines.join('\n') : ''
}

// ─── 类型判断工具 ─────────────────────────────────────────────────────────────

/**
 * 判断一个 AST 节点是否是 React 组件
 * 识别以下模式：
 *   1. React.createClass({ ... })
 *   2. class X extends React.Component / React.PureComponent
 *   3. 函数名首字母大写 + 函数体内有 JSX（return <...>）
 *
 * @param {object} node AST 节点
 * @param {string} name 变量/函数名
 * @returns {boolean}
 */
function isReactComponent(node, name) {
  // 模式 1：React.createClass(...)
  if (
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    node.callee.object.name === 'React' &&
    node.callee.property.name === 'createClass'
  ) {
    return true
  }

  // 模式 2：class X extends React.Component / React.PureComponent
  if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
    if (node.superClass) {
      const sc = node.superClass
      // extends React.Component
      if (sc.type === 'MemberExpression' && sc.object.name === 'React') return true
      // extends Component（需要 import { Component } from 'react'）
      if (sc.type === 'Identifier' && (sc.name === 'Component' || sc.name === 'PureComponent'))
        return true
    }
  }

  // 模式 3：函数名首字母大写（React 组件命名约定）
  if (name && /^[A-Z]/.test(name)) {
    if (
      node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression'
    ) {
      return true
    }
    // var/const MyComp = React.createClass(...)
    if (node.type === 'CallExpression') {
      return true
    }
  }

  return false
}

/**
 * 判断一个节点是否是普通类（非 React 组件）
 * @param {object} node AST 节点
 * @param {string} name 类名
 * @returns {boolean}
 */
function isClass(node, name) {
  if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
    // 排除 React 组件
    if (!isReactComponent(node, name)) return true
  }
  return false
}

/**
 * 判断一个节点是否是工具函数（非组件、非类方法）
 * @param {object} node AST 节点
 * @param {string} name 函数名
 * @returns {boolean}
 */
function isUtilFunction(node, name) {
  if (
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression'
  ) {
    // 排除 React 组件（首字母大写）
    if (name && /^[A-Z]/.test(name)) return false
    return true
  }
  return false
}

/**
 * 判断一个节点是否是常量/配置
 * 识别：对象字面量、数组字面量、基本值（字符串、数字、布尔）
 * @param {object} node AST 节点
 * @returns {boolean}
 */
function isConstant(node) {
  return (
    node.type === 'ObjectExpression' ||
    node.type === 'ArrayExpression' ||
    node.type === 'Literal' ||
    node.type === 'TemplateLiteral'
  )
}

// ─── 核心：遍历 AST，收集顶层声明 ────────────────────────────────────────────

/**
 * 代码模块描述对象
 * @typedef {Object} CodeModule
 * @property {string} name       模块名（变量名/函数名/类名）
 * @property {string} type       类型：'component' | 'class' | 'function' | 'constant' | 'entry'
 * @property {string} code       原始代码片段（含注释）
 * @property {number} start      在源文件中的起始位置
 * @property {number} end        在源文件中的结束位置
 * @property {string[]} refs     该模块引用的其他模块名（用于依赖分析）
 */

/**
 * 遍历 AST 顶层节点，识别并分类所有声明
 *
 * @param {object} ast 解析后的 AST
 * @param {string} code 原始源代码
 * @returns {CodeModule[]} 识别出的模块列表
 */
function collectModules(ast, code) {
  const modules = []

  // 只遍历顶层语句（Program.body）
  for (const node of ast.body) {
    // ── 1. function 声明 ──────────────────────────────────────────────────────
    if (node.type === 'FunctionDeclaration' && node.id) {
      const name = node.id.name
      const comment = extractLeadingComment(code, node.start)
      const snippet = extractCodeSlice(code, node, comment)

      if (isReactComponent(node, name)) {
        modules.push({
          name,
          type: 'component',
          code: snippet,
          start: node.start,
          end: node.end,
          refs: [],
        })
      } else {
        modules.push({
          name,
          type: 'function',
          code: snippet,
          start: node.start,
          end: node.end,
          refs: [],
        })
      }
      continue
    }

    // ── 2. class 声明 ─────────────────────────────────────────────────────────
    if (node.type === 'ClassDeclaration' && node.id) {
      const name = node.id.name
      const comment = extractLeadingComment(code, node.start)
      const snippet = extractCodeSlice(code, node, comment)

      if (isReactComponent(node, name)) {
        modules.push({
          name,
          type: 'component',
          code: snippet,
          start: node.start,
          end: node.end,
          refs: [],
        })
      } else {
        modules.push({
          name,
          type: 'class',
          code: snippet,
          start: node.start,
          end: node.end,
          refs: [],
        })
      }
      continue
    }

    // ── 3. var / const / let 声明 ─────────────────────────────────────────────
    if (node.type === 'VariableDeclaration') {
      for (const declarator of node.declarations) {
        if (!declarator.id || declarator.id.type !== 'Identifier') continue
        const name = declarator.id.name
        const init = declarator.init

        if (!init) {
          // 无初始值的声明，归入常量
          const comment = extractLeadingComment(code, node.start)
          const snippet = extractCodeSlice(code, node, comment)
          modules.push({
            name,
            type: 'constant',
            code: snippet,
            start: node.start,
            end: node.end,
            refs: [],
          })
          continue
        }

        const comment = extractLeadingComment(code, node.start)
        // 提取整个 VariableDeclaration（含 var/const/let 关键字）
        const snippet = extractCodeSlice(code, node, comment)

        if (isReactComponent(init, name)) {
          modules.push({
            name,
            type: 'component',
            code: snippet,
            start: node.start,
            end: node.end,
            refs: [],
          })
        } else if (isClass(init, name)) {
          modules.push({
            name,
            type: 'class',
            code: snippet,
            start: node.start,
            end: node.end,
            refs: [],
          })
        } else if (isUtilFunction(init, name)) {
          modules.push({
            name,
            type: 'function',
            code: snippet,
            start: node.start,
            end: node.end,
            refs: [],
          })
        } else if (isConstant(init)) {
          modules.push({
            name,
            type: 'constant',
            code: snippet,
            start: node.start,
            end: node.end,
            refs: [],
          })
        } else {
          // 其他情况（如函数调用结果赋值等），归入常量
          modules.push({
            name,
            type: 'constant',
            code: snippet,
            start: node.start,
            end: node.end,
            refs: [],
          })
        }
      }
      continue
    }

    // ── 4. 表达式语句（如 ReactDOM.render(...)、事件绑定等）────────────────────
    if (node.type === 'ExpressionStatement') {
      const comment = extractLeadingComment(code, node.start)
      const snippet = extractCodeSlice(code, node, comment)
      // 表达式语句通常是初始化/入口逻辑
      modules.push({
        name: '__entry__',
        type: 'entry',
        code: snippet,
        start: node.start,
        end: node.end,
        refs: [],
      })
      continue
    }

    // ── 5. import / export 声明（已是模块化代码）────────────────────────────────
    if (
      node.type === 'ImportDeclaration' ||
      node.type === 'ExportNamedDeclaration' ||
      node.type === 'ExportDefaultDeclaration'
    ) {
      const comment = extractLeadingComment(code, node.start)
      const snippet = extractCodeSlice(code, node, comment)
      modules.push({
        name: '__entry__',
        type: 'entry',
        code: snippet,
        start: node.start,
        end: node.end,
        refs: [],
      })
      continue
    }
  }

  return modules
}

// ─── 依赖分析 ─────────────────────────────────────────────────────────────────

/**
 * 分析每个模块的代码，找出它引用了哪些其他模块
 * 策略：在模块代码中查找其他模块名的标识符出现
 *
 * @param {CodeModule[]} modules 所有模块列表
 * @returns {CodeModule[]} 填充了 refs 字段的模块列表
 */
function analyzeDependencies(modules) {
  // 收集所有已知模块名（排除入口）
  const knownNames = new Set(modules.filter((m) => m.name !== '__entry__').map((m) => m.name))

  for (const mod of modules) {
    if (mod.name === '__entry__') continue

    const refs = new Set()
    // 在当前模块代码中查找其他模块名的出现
    // 使用正则匹配标识符（单词边界确保精确匹配）
    for (const name of knownNames) {
      if (name === mod.name) continue
      // \b 确保是完整的标识符，而非子字符串
      const pattern = new RegExp(`\\b${escapeRegex(name)}\\b`)
      if (pattern.test(mod.code)) {
        refs.add(name)
      }
    }
    mod.refs = Array.from(refs)
  }

  return modules
}

/**
 * 转义正则表达式特殊字符
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ─── 文件生成 ─────────────────────────────────────────────────────────────────

/**
 * 确保目录存在，不存在则递归创建
 * @param {string} dirPath
 */
function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }
}

/**
 * 将字符串写入文件
 * @param {string} filePath
 * @param {string} content
 */
function writeFile(filePath, content) {
  ensureDir(dirname(filePath))
  writeFileSync(filePath, content, 'utf-8')
  console.log(`  ✅ 已生成：${filePath}`)
}

/**
 * 为模块代码生成 export 语句
 * 根据模块类型和名称，在代码末尾追加 export
 *
 * @param {CodeModule} mod
 * @returns {string} 带 export 的完整代码
 */
function wrapWithExport(mod) {
  const { name, code } = mod

  // 如果代码已经包含 export，不重复添加
  if (/^\s*export\s/.test(code)) return code

  // 在代码末尾追加具名导出
  return `${code}\n\nexport { ${name} };\n`
}

/**
 * 生成各分类目录下的 index.js（统一导出文件）
 *
 * @param {string} dirPath 目录路径
 * @param {CodeModule[]} mods 该目录下的所有模块
 */
function generateIndexFile(dirPath, mods) {
  // 过滤掉入口模块
  const named = mods.filter((m) => m.name !== '__entry__')
  if (named.length === 0) return

  const lines = ['/**', ' * index.js - 统一导出文件（由 split-js.js 自动生成）', ' */', '']

  for (const mod of named) {
    // 使用相对路径导入同目录下的文件
    lines.push(`export { ${mod.name} } from './${mod.name}.js';`)
  }

  lines.push('')
  writeFile(join(dirPath, 'index.js'), lines.join('\n'))
}

// ─── 依赖关系文档生成 ─────────────────────────────────────────────────────────

/**
 * 生成 Markdown 格式的依赖关系文档
 *
 * @param {CodeModule[]} modules 所有模块
 * @param {string} srcFile 源文件路径
 * @param {string} outDir 输出目录
 * @returns {string} Markdown 文本
 */
function generateDependencyDoc(modules, srcFile, outDir) {
  const named = modules.filter((m) => m.name !== '__entry__')

  // 按类型分组
  const groups = {
    component: named.filter((m) => m.type === 'component'),
    class: named.filter((m) => m.type === 'class'),
    function: named.filter((m) => m.type === 'function'),
    constant: named.filter((m) => m.type === 'constant'),
  }

  const typeLabel = {
    component: 'React 组件',
    class: '类',
    function: '工具函数',
    constant: '常量/配置',
  }

  const typeDir = {
    component: 'components',
    class: 'classes',
    function: 'functions',
    constant: 'constants',
  }

  const lines = [
    '# 依赖关系文档',
    '',
    `> 由 \`split-js.js\` 自动生成`,
    `> 源文件：\`${srcFile}\``,
    `> 输出目录：\`${outDir}\``,
    '',
    '---',
    '',
    '## 模块统计',
    '',
    `| 类型 | 数量 |`,
    `|------|------|`,
    `| React 组件 | ${groups.component.length} |`,
    `| 类 | ${groups.class.length} |`,
    `| 工具函数 | ${groups.function.length} |`,
    `| 常量/配置 | ${groups.constant.length} |`,
    `| **合计** | **${named.length}** |`,
    '',
    '---',
    '',
  ]

  // 各类型详情
  for (const [type, mods] of Object.entries(groups)) {
    if (mods.length === 0) continue

    lines.push(`## ${typeLabel[type]}（${mods.length} 个）`)
    lines.push('')
    lines.push('| 模块名 | 文件路径 | 依赖的模块 |')
    lines.push('|--------|----------|------------|')

    for (const mod of mods) {
      const filePath =
        type === 'constant' ? `constants/constants.js` : `${typeDir[type]}/${mod.name}.js`
      const deps = mod.refs.length > 0 ? mod.refs.join(', ') : '—'
      lines.push(`| \`${mod.name}\` | \`${filePath}\` | ${deps} |`)
    }

    lines.push('')
  }

  // 依赖关系图（Mermaid）
  lines.push('---')
  lines.push('')
  lines.push('## 依赖关系图（Mermaid）')
  lines.push('')
  lines.push('```mermaid')
  lines.push('graph TD')

  // 只展示有依赖关系的模块，避免图过于复杂
  const hasDeps = named.filter((m) => m.refs.length > 0)
  if (hasDeps.length === 0) {
    lines.push('  note["暂未检测到模块间依赖关系"]')
  } else {
    for (const mod of hasDeps) {
      for (const ref of mod.refs) {
        lines.push(`  ${mod.name} --> ${ref}`)
      }
    }
  }

  lines.push('```')
  lines.push('')

  return lines.join('\n')
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────

;(async function main() {
  const { srcFile, outDir } = parseArgs()

  // 解析路径（相对于当前工作目录）
  const srcPath = resolve(process.cwd(), srcFile)
  const outPath = resolve(process.cwd(), outDir)

  console.log('\n🔪 JS 文件拆分工具')
  console.log('─'.repeat(50))
  console.log(`📂 源文件：${srcPath}`)
  console.log(`📁 输出目录：${outPath}`)
  console.log('─'.repeat(50))

  // ── Step 1：读取源文件 ────────────────────────────────────────────────────
  console.log('\n⏳ Step 1/5：读取源文件...')
  const code = readSource(srcPath)
  console.log(
    `   文件大小：${(code.length / 1024).toFixed(1)} KB，共 ${code.split('\n').length} 行`,
  )

  // ── Step 2：解析 AST ──────────────────────────────────────────────────────
  console.log('\n⏳ Step 2/5：解析 AST...')
  const { ast, sourceType } = parseCode(code)
  console.log(`   解析模式：${sourceType}`)

  // ── Step 3：识别并分类模块 ────────────────────────────────────────────────
  console.log('\n⏳ Step 3/5：识别并分类模块...')
  const modules = collectModules(ast, code)

  // 统计各类型数量
  const stats = { component: 0, class: 0, function: 0, constant: 0, entry: 0 }
  for (const m of modules) stats[m.type] = (stats[m.type] || 0) + 1

  console.log(`   识别结果：`)
  console.log(`     React 组件：${stats.component} 个`)
  console.log(`     类：${stats.class} 个`)
  console.log(`     工具函数：${stats.function} 个`)
  console.log(`     常量/配置：${stats.constant} 个`)
  console.log(`     入口逻辑：${stats.entry} 条语句`)

  // ── Step 4：分析依赖关系 ──────────────────────────────────────────────────
  console.log('\n⏳ Step 4/5：分析模块间依赖关系...')
  analyzeDependencies(modules)
  const depsCount = modules.filter((m) => m.refs.length > 0).length
  console.log(`   发现 ${depsCount} 个模块存在依赖关系`)

  // ── Step 5：生成输出文件 ──────────────────────────────────────────────────
  console.log('\n⏳ Step 5/5：生成输出文件...')

  // 按类型分组
  const components = modules.filter((m) => m.type === 'component')
  const classes = modules.filter((m) => m.type === 'class')
  const functions = modules.filter((m) => m.type === 'function')
  const constants = modules.filter((m) => m.type === 'constant')
  const entries = modules.filter((m) => m.type === 'entry')

  // ── 5a. 生成 components/ ──────────────────────────────────────────────────
  if (components.length > 0) {
    console.log(`\n  📦 components/（${components.length} 个组件）`)
    const compDir = join(outPath, 'components')
    for (const mod of components) {
      writeFile(join(compDir, `${mod.name}.js`), wrapWithExport(mod))
    }
    generateIndexFile(compDir, components)
  }

  // ── 5b. 生成 classes/ ─────────────────────────────────────────────────────
  if (classes.length > 0) {
    console.log(`\n  📦 classes/（${classes.length} 个类）`)
    const classDir = join(outPath, 'classes')
    for (const mod of classes) {
      writeFile(join(classDir, `${mod.name}.js`), wrapWithExport(mod))
    }
    generateIndexFile(classDir, classes)
  }

  // ── 5c. 生成 functions/ ───────────────────────────────────────────────────
  if (functions.length > 0) {
    console.log(`\n  📦 functions/（${functions.length} 个函数）`)
    const funcDir = join(outPath, 'functions')
    for (const mod of functions) {
      writeFile(join(funcDir, `${mod.name}.js`), wrapWithExport(mod))
    }
    generateIndexFile(funcDir, functions)
  }

  // ── 5d. 生成 constants/constants.js（所有常量合并到一个文件）──────────────
  if (constants.length > 0) {
    console.log(`\n  📦 constants/（${constants.length} 个常量，合并到 constants.js）`)
    const constDir = join(outPath, 'constants')
    const constLines = ['/**', ' * constants.js - 常量与配置（由 split-js.js 自动生成）', ' */', '']
    const exportNames = []
    for (const mod of constants) {
      constLines.push(mod.code)
      constLines.push('')
      exportNames.push(mod.name)
    }
    // 统一导出所有常量
    constLines.push(`export { ${exportNames.join(', ')} };`)
    constLines.push('')
    writeFile(join(constDir, 'constants.js'), constLines.join('\n'))
  }

  // ── 5e. 生成 index.js（入口文件）─────────────────────────────────────────
  {
    console.log(`\n  📦 index.js（入口文件）`)
    const indexLines = [
      '/**',
      ' * index.js - 入口文件（由 split-js.js 自动生成）',
      ' * 包含原文件中的初始化逻辑、事件绑定、ReactDOM.render 等顶层表达式',
      ' */',
      '',
    ]

    // 导入各模块（如果有的话）
    if (components.length > 0) {
      indexLines.push(`// 导入 React 组件`)
      indexLines.push(
        `import { ${components.map((m) => m.name).join(', ')} } from './components/index.js';`,
      )
    }
    if (classes.length > 0) {
      indexLines.push(`// 导入类`)
      indexLines.push(
        `import { ${classes.map((m) => m.name).join(', ')} } from './classes/index.js';`,
      )
    }
    if (functions.length > 0) {
      indexLines.push(`// 导入工具函数`)
      indexLines.push(
        `import { ${functions.map((m) => m.name).join(', ')} } from './functions/index.js';`,
      )
    }
    if (constants.length > 0) {
      indexLines.push(`// 导入常量`)
      indexLines.push(
        `import { ${constants.map((m) => m.name).join(', ')} } from './constants/constants.js';`,
      )
    }

    if (entries.length > 0) {
      indexLines.push('')
      indexLines.push(
        '// ─── 入口逻辑 ───────────────────────────────────────────────────────────────',
      )
      indexLines.push('')
      for (const entry of entries) {
        indexLines.push(entry.code)
        indexLines.push('')
      }
    }

    writeFile(join(outPath, 'index.js'), indexLines.join('\n'))
  }

  // ── 5f. 生成依赖关系文档 ──────────────────────────────────────────────────
  {
    console.log(`\n  📄 DEPENDENCY_GRAPH.md（依赖关系文档）`)
    const docContent = generateDependencyDoc(modules, srcFile, outDir)
    writeFile(join(outPath, 'DEPENDENCY_GRAPH.md'), docContent)
  }

  // ── 完成 ──────────────────────────────────────────────────────────────────
  const totalFiles =
    components.length +
    classes.length +
    functions.length +
    (constants.length > 0 ? 1 : 0) +
    (components.length > 0 ? 1 : 0) + // components/index.js
    (classes.length > 0 ? 1 : 0) + // classes/index.js
    (functions.length > 0 ? 1 : 0) + // functions/index.js
    2 // index.js + DEPENDENCY_GRAPH.md

  console.log('\n' + '─'.repeat(50))
  console.log(`✅ 拆分完成！共生成 ${totalFiles} 个文件`)
  console.log(`📁 输出目录：${outPath}`)
  console.log('─'.repeat(50) + '\n')
})()
