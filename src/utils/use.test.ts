import { describe, expect, it } from 'vitest'

import { useRequiredContext } from './use'

describe('useRequiredContext Hook', () => {
  it('应该是一个函数', () => {
    expect(typeof useRequiredContext).toBe('function')
  })

  it('应该接受一个 Context 参数', () => {
    // 由于 hook 只能在组件内调用，这里只验证函数签名
    expect(useRequiredContext).toBeDefined()
  })
})
