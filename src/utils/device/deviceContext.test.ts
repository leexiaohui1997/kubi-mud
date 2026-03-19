import { describe, expect, it } from 'vitest'

import { getDeviceType } from './deviceContext'

import { DEVICE_BREAKPOINT } from '@/constants/device'

describe('getDeviceType 函数', () => {
  it('对于大于 PC 断点值的比例应该返回 pc', () => {
    const result = getDeviceType(DEVICE_BREAKPOINT.pc + 0.1)
    expect(result).toBe('pc')
  })

  it('对于在 mobile 和 pc 之间的比例应该返回 mobile', () => {
    // 由于 pc 的断点是 1，mobile 的断点是 0
    // 当 ratio <= 1 且 ratio > 0 时，应该返回 mobile
    const result = getDeviceType(0.5)
    expect(result).toBe('mobile')
  })

  it('对于小于等于 mobile 断点值的比例应该返回 undefined', () => {
    // 由于 mobile 的断点是 0，任何正数都会大于 0
    // 只有当 ratio <= 0 时才会返回 undefined
    const result = getDeviceType(0)
    expect(result).toBeUndefined()
  })

  it('对于有效的屏幕比例应该正确判断设备类型', () => {
    // 典型的桌面显示器比例（横屏）
    expect(getDeviceType(1.77)).toBe('pc') // 16:9
    expect(getDeviceType(1.6)).toBe('pc') // 16:10
    expect(getDeviceType(1.33)).toBe('pc') // 4:3

    // 移动设备通常是竖屏或接近正方形
    expect(getDeviceType(0.56)).toBe('mobile') // 9:16 竖屏
    expect(getDeviceType(0.75)).toBe('mobile') // 3:4 竖屏
    expect(getDeviceType(0.8)).toBe('mobile') // 4:5 竖屏
  })

  it('对于边界值应该正确处理', () => {
    // 刚好等于断点值时，ratio > breakpoint 为 false
    expect(getDeviceType(DEVICE_BREAKPOINT.mobile)).toBeUndefined() // 0 > 0 为 false
    expect(getDeviceType(DEVICE_BREAKPOINT.pc)).toBe('mobile') // 1 > 1 为 false，但 1 > 0 为 true
  })
})
