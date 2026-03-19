#!/usr/bin/env node
/**
 * extract-variable.js
 * 通用 JavaScript 变量提取工具
 * 基于 ESTree 规范的 AST 解析，从 JS 文件中提取指定变量并输出为 JSON 文件
 *
 * 用法：
 *   node scripts/extract-variable.js <源文件路径> <变量名> [输出文件路径] [--format=pretty|jsonlines]
 *
 * 示例：
 *   node scripts/extract-variable.js ./src/data_item.js ITEM_DATA
 *   node scripts/extract-variable.js ./src/data_item.js ITEM_DATA ./output/items.json --format=jsonlines
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// 检查并加载 acorn 依赖
let acorn, acornWalk
try {
  acorn = await import('acorn')
  acornWalk = await import('acorn-walk')
} catch {
  console.error('❌ 缺少依赖，请先安装：')
  console.error('   pnpm add acorn acorn-walk --save-dev')
  console.error('   或：npm install acorn acorn-walk --save-dev')
  process.exit(1)
}

const { parse } = acorn
const { simple: walkSimple } = acornWalk

// ─── 命令行参数解析 ───────────────────────────────────────────────────────────

/**
 * 解析命令行参数
 * @returns {{ srcFile: string, varName: string, outFile: string|null, format: 'pretty'|'jsonlines' }}
 */
function parseArgs() {
  const args = process.argv.slice(2)

  // 提取 --format 参数
  let format = 'pretty'
  const formatArg = args.find((a) => a.startsWith('--format='))
  if (formatArg) {
    const val = formatArg.split('=')[1]
    if (val !== 'pretty' && val !== 'jsonlines') {
      console.error(`❌ 不支持的输出格式：${val}，可选值：pretty | jsonlines`)
      process.exit(1)
    }
    format = val
  }

  // 过滤掉 --format 参数，剩余为位置参数
  const positional = args.filter((a) => !a.startsWith('--'))

  if (positional.length < 2) {
    printUsage()
    process.exit(1)
  }

  const srcFile = positional[0]
  const varName = positional[1]
  const outFile = positional[2] || null

  return { srcFile, varName, outFile, format }
}

/** 打印使用帮助 */
function printUsage() {
  console.log('')
  console.log('用法：')
  console.log(
    '  node scripts/extract-variable.js <源文件路径> <变量名> [输出文件路径] [--format=pretty|jsonlines]',
  )
  console.log('')
  console.log('参数说明：')
  console.log('  <源文件路径>      必填，要解析的 JavaScript 文件路径')
  console.log('  <变量名>          必填，要提取的变量名称')
  console.log('  [输出文件路径]    可选，输出 JSON 文件路径（默认：scripts/data/<变量名>.json）')
  console.log('  --format=pretty      可选，正常格式化 JSON 输出（默认）')
  console.log('  --format=jsonlines   可选，JSON Lines 格式输出（每行一条数据）')
  console.log('')
  console.log('示例：')
  console.log('  node scripts/extract-variable.js ./src/data_item.js ITEM_DATA')
  console.log(
    '  node scripts/extract-variable.js ./src/data_item.js ITEM_DATA ./output/items.json --format=jsonlines',
  )
}

// ─── AST 解析 ─────────────────────────────────────────────────────────────────

/**
 * 读取并解析 JS 文件为 AST
 * @param {string} filePath 文件绝对路径
 * @returns {import('acorn').Node} AST 根节点
 */
function parseFile(filePath) {
  if (!existsSync(filePath)) {
    console.error(`❌ 文件不存在：${filePath}`)
    process.exit(1)
  }

  let code
  try {
    code = readFileSync(filePath, 'utf-8')
  } catch (err) {
    console.error(`❌ 读取文件失败：${err.message}`)
    process.exit(1)
  }

  try {
    return parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
    })
  } catch (err) {
    // 尝试以 script 模式解析
    try {
      return parse(code, {
        ecmaVersion: 'latest',
        sourceType: 'script',
      })
    } catch {
      console.error(`❌ 代码解析失败（语法错误）：${err.message}`)
      process.exit(1)
    }
  }
}

// ─── 变量定位 ─────────────────────────────────────────────────────────────────

/**
 * 在 AST 中查找指定变量名的初始化值节点
 * @param {import('acorn').Node} ast
 * @param {string} varName
 * @returns {import('acorn').Node|null}
 */
function findVariableNode(ast, varName) {
  let found = null

  walkSimple(ast, {
    VariableDeclaration(node) {
      for (const declarator of node.declarations) {
        if (declarator.id && declarator.id.name === varName && declarator.init) {
          found = declarator.init
        }
      }
    },
    // 同时支持 export const / export default
    ExportNamedDeclaration(node) {
      if (node.declaration && node.declaration.type === 'VariableDeclaration') {
        for (const declarator of node.declaration.declarations) {
          if (declarator.id && declarator.id.name === varName && declarator.init) {
            found = declarator.init
          }
        }
      }
    },
  })

  return found
}

// ─── AST 节点转换为 JS 值 ─────────────────────────────────────────────────────

/**
 * 递归将 AST 节点转换为 JavaScript 值
 * @param {import('acorn').Node} node
 * @returns {*}
 */
function astNodeToValue(node) {
  if (!node) return null

  switch (node.type) {
    case 'Literal':
      return node.value

    case 'TemplateLiteral':
      // 仅支持无表达式的模板字符串
      if (node.expressions.length === 0) {
        return node.quasis[0].value.cooked
      }
      return null

    case 'UnaryExpression':
      // 处理负数：-1
      if (node.operator === '-' && node.argument.type === 'Literal') {
        return -node.argument.value
      }
      return null

    case 'ArrayExpression':
      return node.elements.map((el) => (el ? astNodeToValue(el) : null))

    case 'ObjectExpression': {
      const obj = {}
      for (const prop of node.properties) {
        if (prop.type === 'SpreadElement') continue
        const key =
          prop.key.type === 'Identifier'
            ? prop.key.name
            : prop.key.type === 'Literal'
              ? String(prop.key.value)
              : null
        if (key !== null) {
          obj[key] = astNodeToValue(prop.value)
        }
      }
      return obj
    }

    case 'Identifier':
      // 标识符（如 undefined、null 等）
      if (node.name === 'undefined') return undefined
      if (node.name === 'null') return null
      if (node.name === 'true') return true
      if (node.name === 'false') return false
      // 其他标识符引用无法静态解析，返回变量名字符串作为占位
      return `[ref:${node.name}]`

    default:
      return null
  }
}

// ─── JSON 输出 ────────────────────────────────────────────────────────────────

/**
 * 将数据格式化为指定格式的字符串
 * @param {*} data
 * @param {'pretty'|'jsonlines'} format
 * @returns {string}
 */
function formatOutput(data, format) {
  if (format === 'jsonlines') {
    // JSON Lines：每行一条数据
    if (Array.isArray(data)) {
      return data.map((item) => JSON.stringify(item)).join('\n') + '\n'
    }
    // 对象类型：整体用 {} 包裹，每个顶层属性单独一行，行间逗号分隔
    if (typeof data === 'object' && data !== null) {
      const lines = Object.entries(data).map(
        ([k, v]) => `${JSON.stringify(k)}:${JSON.stringify(v)}`,
      )
      return '{\n' + lines.join(',\n') + '\n}\n'
    }
    return JSON.stringify(data) + '\n'
  }

  // pretty：标准格式化 JSON
  return JSON.stringify(data, null, 2) + '\n'
}

/**
 * 写入文件，自动创建目录
 * @param {string} outPath
 * @param {string} content
 */
function writeOutput(outPath, content) {
  const dir = dirname(outPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(outPath, content, 'utf-8')
}

// ─── 统计数据条数 ─────────────────────────────────────────────────────────────

/**
 * 统计数据条数（用于成功提示）
 * @param {*} data
 * @returns {number}
 */
function countItems(data) {
  if (Array.isArray(data)) return data.length
  if (typeof data === 'object' && data !== null) return Object.keys(data).length
  return 1
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────

;(async function main() {
  const { srcFile, varName, outFile, format } = parseArgs()

  // 解析源文件路径（相对于当前工作目录）
  const srcPath = resolve(process.cwd(), srcFile)

  // 确定输出路径
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const defaultOutPath = resolve(__dirname, 'data', `${varName}.json`)
  const outPath = outFile ? resolve(process.cwd(), outFile) : defaultOutPath

  console.log(`\n📂 源文件：${srcPath}`)
  console.log(`🔍 变量名：${varName}`)
  console.log(`📄 输出格式：${format}`)
  console.log(`💾 输出路径：${outPath}\n`)

  // 1. 解析 AST
  console.log('⏳ 正在解析 AST...')
  const ast = parseFile(srcPath)

  // 2. 查找变量节点
  console.log(`⏳ 正在查找变量 ${varName}...`)
  const varNode = findVariableNode(ast, varName)

  if (!varNode) {
    console.error(`❌ 未找到变量：${varName}`)
    console.error(`   请确认变量名是否正确，以及变量是否在文件顶层声明`)
    process.exit(1)
  }

  // 3. 转换为 JS 值
  console.log('⏳ 正在转换数据...')
  const data = astNodeToValue(varNode)

  // 4. 格式化输出
  const output = formatOutput(data, format)

  // 5. 写入文件
  try {
    writeOutput(outPath, output)
  } catch (err) {
    console.error(`❌ 写入文件失败：${err.message}`)
    process.exit(1)
  }

  const count = countItems(data)
  console.log(`✅ 提取成功！共 ${count} 条数据`)
  console.log(`📁 已输出到：${outPath}\n`)
})()
