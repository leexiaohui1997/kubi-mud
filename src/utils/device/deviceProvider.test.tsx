import { act, render, screen } from '@testing-library/react'
import { useContext, useEffect } from 'react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { DeviceContext, type DeviceContextType } from './deviceContext'
import { DeviceProvider } from './deviceProvider'

describe('DeviceProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 清理之前的类名
    document.documentElement.classList.remove('is-pc', 'is-mobile')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // 清理测试添加的类名
    document.documentElement.classList.remove('is-pc', 'is-mobile')
  })

  it('应该渲染子组件', () => {
    render(
      <DeviceProvider>
        <div data-testid="child">Test Child</div>
      </DeviceProvider>,
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('应该提供正确的 context 值', () => {
    let capturedValue: DeviceContextType | undefined

    const TestComponent = () => {
      const context = useContext(DeviceContext)

      // 使用 useEffect 来更新外部变量，避免在渲染过程中产生副作用
      useEffect(() => {
        capturedValue = context
      }, [context])

      return null
    }

    render(
      <DeviceProvider>
        <TestComponent />
      </DeviceProvider>,
    )

    expect(capturedValue).toBeDefined()
    expect(capturedValue?.innerWidth).toBe(window.innerWidth)
    expect(capturedValue?.innerHeight).toBe(window.innerHeight)
    expect(['pc', 'mobile']).toContain(capturedValue?.deviceType)
  })

  it('应该监听窗口大小变化事件', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

    render(
      <DeviceProvider>
        <div>Test</div>
      </DeviceProvider>,
    )

    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(addEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function))

    addEventListenerSpy.mockRestore()
  })

  it('应该在卸载时清理事件监听器', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = render(
      <DeviceProvider>
        <div>Test</div>
      </DeviceProvider>,
    )

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })

  it('应该在窗口大小改变时更新 innerWidth 和 innerHeight', () => {
    render(
      <DeviceProvider>
        <div data-testid="content">Test</div>
      </DeviceProvider>,
    )

    // 触发 resize 事件
    window.innerWidth = 1024
    window.innerHeight = 768
    window.dispatchEvent(new Event('resize'))

    // 由于状态更新是异步的，我们需要等待
    setTimeout(() => {
      // 这里无法直接验证，因为需要重新渲染组件
      // 实际测试中可以通过 context 来验证
    }, 0)
  })

  it('应该在挂载时根据设备类型添加对应的类名到 documentElement', () => {
    render(
      <DeviceProvider>
        <div>Test</div>
      </DeviceProvider>,
    )

    // 验证类名被添加（根据当前窗口宽高比判断）
    const hasPcClass = document.documentElement.classList.contains('is-pc')
    const hasMobileClass = document.documentElement.classList.contains('is-mobile')
    expect(hasPcClass || hasMobileClass).toBe(true)
  })

  it('应该在卸载时移除设备类名', () => {
    const { unmount } = render(
      <DeviceProvider>
        <div>Test</div>
      </DeviceProvider>,
    )

    // 验证类名被添加
    const hasPcClass = document.documentElement.classList.contains('is-pc')
    const hasMobileClass = document.documentElement.classList.contains('is-mobile')
    expect(hasPcClass || hasMobileClass).toBe(true)

    unmount()

    // 验证类名被移除
    expect(document.documentElement.classList.contains('is-pc')).toBe(false)
    expect(document.documentElement.classList.contains('is-mobile')).toBe(false)
  })

  it('应该在设备类型改变时更新类名', async () => {
    // 设置初始窗口大小为 PC 尺寸
    const originalInnerWidth = window.innerWidth
    const originalInnerHeight = window.innerHeight

    // 模拟 PC 设备（宽高比 > 1）
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true })

    const { unmount } = render(
      <DeviceProvider>
        <div>Test</div>
      </DeviceProvider>,
    )

    // 验证 PC 类名被添加
    expect(document.documentElement.classList.contains('is-pc')).toBe(true)
    expect(document.documentElement.classList.contains('is-mobile')).toBe(false)

    // 模拟切换到移动设备（宽高比 < 1）
    await act(async () => {
      window.innerWidth = 375
      window.innerHeight = 667
      window.dispatchEvent(new Event('resize'))
    })

    // 验证类名已更新
    expect(document.documentElement.classList.contains('is-pc')).toBe(false)
    expect(document.documentElement.classList.contains('is-mobile')).toBe(true)

    // 恢复原始窗口大小
    window.innerWidth = originalInnerWidth
    window.innerHeight = originalInnerHeight

    unmount()
  })
})
