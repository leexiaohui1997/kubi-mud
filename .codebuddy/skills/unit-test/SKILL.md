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
