---
name: unit-test
description: 本 skill 用于指导在 kubi-mud 项目中编写高质量的单元测试。
---

# 单元测试编写 Skill

## 概述

本 skill 用于指导在 kubi-mud 项目中编写高质量的单元测试。

## 技术栈

- **测试框架**: Vitest
- **测试环境**: jsdom
- **React 测试**: @testing-library/react
- **断言扩展**: @testing-library/jest-dom

## 测试文件命名规范

- 测试文件应与被测试文件同名，添加 `.test.ts` 或 `.test.tsx` 后缀
- 位置：与被测试文件同目录
- 示例：`App.tsx` → `App.test.tsx`

## 测试模板

### 1. React 组件测试模板

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ComponentName from './ComponentName'

describe('ComponentName 组件', () => {
  it('应该正确渲染', () => {
    render(<ComponentName />)
    // 添加断言
  })

  it('应该正确处理用户交互', async () => {
    const { user } = render(<ComponentName />)
    // 添加交互测试
  })
})
```

### 2. 工具函数测试模板

```ts
import { describe, expect, it } from 'vitest'

import { functionName } from './module'

describe('functionName 函数', () => {
  it('对于有效输入应返回预期值', () => {
    expect(functionName('input')).toBe('expected')
  })

  it('应该正确处理边界情况', () => {
    expect(functionName('')).toBe('')
  })
})
```

### 3. 自定义 Hook 测试模板

```tsx
import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useCustomHook } from './useCustomHook'

describe('useCustomHook Hook', () => {
  it('应该返回初始状态', () => {
    const { result } = renderHook(() => useCustomHook())
    expect(result.current).toBeDefined()
  })

  it('执行操作后应该更新状态', () => {
    const { result } = renderHook(() => useCustomHook())

    act(() => {
      result.current.doSomething()
    })

    expect(result.current.value).toBe('expected')
  })
})
```

### 4. 异步操作测试模板

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import AsyncComponent from './AsyncComponent'

describe('AsyncComponent 组件', () => {
  it('应该加载并显示数据', async () => {
    render(<AsyncComponent />)

    await waitFor(() => {
      expect(screen.getByText('Data loaded')).toBeInTheDocument()
    })
  })
})
```

## 最佳实践

### 1. 测试组织结构

- 使用 `describe` 对相关测试进行分组
- 测试描述应清晰表达测试意图
- 遵循 AAA 模式：Arrange（准备）、Act（执行）、Assert（断言）

### 2. 查询元素优先级

按以下优先级选择查询方法：

1. `getByRole` - 最推荐，基于可访问性
2. `getByLabelText` - 表单元素
3. `getByPlaceholderText` - 输入框
4. `getByText` - 文本内容
5. `getByTestId` - 最后手段

### 3. Mock 使用

```ts
// Mock 模块
vi.mock('./api', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'mocked' }),
}))

// Mock 函数
const mockCallback = vi.fn()

// 清除 Mock
afterEach(() => {
  vi.clearAllMocks()
})
```

### 4. 测试覆盖范围

- 测试正常路径和边界情况
- 测试错误处理
- 测试用户交互
- 避免测试实现细节

## 常用命令

```bash
# 运行所有测试
pnpm test

# 运行一次测试（推荐使用）
pnpm test:run

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行特定测试文件
pnpm test:run path/to/test.test.ts
```

## 注意事项

1. **使用中文编写测试描述**：`describe` 和 `it` 的描述文字应使用中文，提高可读性
2. 测试文件应导入 `vitest` 的全局函数（`describe`, `it`, `expect` 等）
3. React 组件测试需要导入 `@testing-library/react`
4. 使用 `@` 路径别名引用源码
5. 异步测试使用 `async/await` 和 `waitFor`
6. 保持测试独立，避免测试间依赖
7. **使用 `vi.resetModules()` 时，所有依赖同一 Context 的模块必须一起动态 import**：`vi.resetModules()` 会清空模块缓存，若静态 import 的 Provider 和动态 import 的组件持有不同 Context 实例，Context 将无法传递。正确做法是在 `resetModules()` 后用 `Promise.all` 同时动态 import 所有相关模块：

   ```ts
   async function renderComponent() {
     vi.resetModules()
     const [{ default: Provider }, { default: Component }] = await Promise.all([
       import('@/components/SomeProvider'),
       import('./SomeComponent'),
     ])
     render(<Provider><Component /></Provider>)
   }
   ```

8. **查询弹窗/局部区域内的文本时，用 `within()` 限定范围**：当弹窗标题与页面上其他元素文字相同时，`getByText()` 会匹配到多个元素报错。应先获取容器元素，再用 `within()` 在其内部查询：

   ```ts
   // ❌ 可能匹配到多个元素
   expect(screen.getByText('读取存档')).toBeInTheDocument()

   // ✅ 限定在 dialog 内部查找
   const dialog = screen.getByRole('dialog')
   expect(within(dialog).getByText('读取存档')).toBeInTheDocument()
   ```

9. **不能在组件渲染体中对外部变量赋值（React 纯函数规则）**：ESLint 禁止在组件渲染中修改外部变量。测试中若需捕获 Context 值，应通过 prop 回调传出，赋值发生在回调内部而非渲染体中：

   ```ts
   // ❌ 直接赋值外部变量（ESLint 报错）
   let ctxValue: unknown
   function Consumer() {
     ctxValue = useContext(MyContext)
     return null
   }

   // ✅ 通过 prop 回调传出
   let capturedCtx: unknown
   function Consumer({ onCapture }: { onCapture: (ctx: unknown) => void }) {
     const ctx = useContext(MyContext)
     onCapture(ctx)
     return null
   }
   render(<Provider><Consumer onCapture={(ctx) => { capturedCtx = ctx }} /></Provider>)
   ```

10. **组件有离开动画时，关闭后需等待 DOM 卸载再断言**：若组件关闭时有延迟动画（如 200ms），立即断言元素不存在会失败。应为 `waitFor` 设置足够的 `timeout`：

    ```ts
    await waitFor(
      () => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      },
      { timeout: 500 },
    )
    ```
