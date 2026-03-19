import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { DeviceContext } from '../device/deviceContext'

import { useReponsiveClass } from './useReponsiveClass'

describe('useReponsiveClass Hook', () => {
  const createWrapper = (deviceType: 'pc' | 'mobile') => {
    return ({ children }: { children: React.ReactNode }) => (
      <DeviceContext.Provider
        value={{
          innerWidth: deviceType === 'pc' ? 1920 : 375,
          innerHeight: deviceType === 'pc' ? 1080 : 667,
          deviceType,
        }}
      >
        {children}
      </DeviceContext.Provider>
    )
  }

  beforeEach(() => {
    // 清理之前的类名
    document.documentElement.classList.remove('is-pc', 'is-mobile')
  })

  afterEach(() => {
    // 清理测试添加的类名
    document.documentElement.classList.remove('is-pc', 'is-mobile')
    vi.clearAllMocks()
  })

  it('应该在挂载时添加对应的设备类名', () => {
    renderHook(() => useReponsiveClass(), {
      wrapper: createWrapper('pc'),
    })

    expect(document.documentElement.classList.contains('is-pc')).toBe(true)
  })

  it('应该正确处理移动设备类型', () => {
    renderHook(() => useReponsiveClass(), {
      wrapper: createWrapper('mobile'),
    })

    expect(document.documentElement.classList.contains('is-mobile')).toBe(true)
  })

  it('应该在卸载时移除类名', () => {
    const { unmount } = renderHook(() => useReponsiveClass(), {
      wrapper: createWrapper('pc'),
    })

    expect(document.documentElement.classList.contains('is-pc')).toBe(true)

    unmount()

    expect(document.documentElement.classList.contains('is-pc')).toBe(false)
  })

  it('应该在设备类型改变时更新类名', () => {
    let currentDeviceType: 'pc' | 'mobile' = 'pc'

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <DeviceContext.Provider
        value={{
          innerWidth: currentDeviceType === 'pc' ? 1920 : 375,
          innerHeight: currentDeviceType === 'pc' ? 1080 : 667,
          deviceType: currentDeviceType,
        }}
      >
        {children}
      </DeviceContext.Provider>
    )

    const { rerender } = renderHook(() => useReponsiveClass(), {
      wrapper: Wrapper,
    })

    expect(document.documentElement.classList.contains('is-pc')).toBe(true)
    expect(document.documentElement.classList.contains('is-mobile')).toBe(false)

    // 切换到移动设备
    currentDeviceType = 'mobile'
    rerender()

    expect(document.documentElement.classList.contains('is-pc')).toBe(false)
    expect(document.documentElement.classList.contains('is-mobile')).toBe(true)
  })
})
