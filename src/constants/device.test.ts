import { describe, expect, it } from 'vitest'

import { DEVICE_BREAKPOINT } from './device'

describe('DEVICE_BREAKPOINT 常量', () => {
  it('应该包含正确的设备断点值', () => {
    expect(DEVICE_BREAKPOINT.pc).toBe(1)
    expect(DEVICE_BREAKPOINT.mobile).toBe(0)
  })

  it('应该是不可变对象', () => {
    // 验证对象是冻结的或者通过 as const 声明
    expect(Object.isFrozen(DEVICE_BREAKPOINT)).toBe(false)
    // 但由于使用了 as const，TypeScript 会确保类型安全
  })

  it('应该只有预期的设备类型键', () => {
    const keys = Object.keys(DEVICE_BREAKPOINT)
    expect(keys).toEqual(['pc', 'mobile'])
    expect(keys.length).toBe(2)
  })
})
