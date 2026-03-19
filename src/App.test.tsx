import { render, screen } from '@testing-library/react'
import { describe, expect, it, beforeEach, afterEach } from 'vitest'

import App from './App'
import { DeviceProvider } from './utils/device/deviceProvider'

describe('App 组件', () => {
  beforeEach(() => {
    // 清理之前的设备类名
    document.documentElement.classList.remove('is-pc', 'is-mobile')
  })

  afterEach(() => {
    // 清理测试添加的类名
    document.documentElement.classList.remove('is-pc', 'is-mobile')
  })

  it('应该正确渲染 Hello App 文本', () => {
    render(
      <DeviceProvider>
        <App />
      </DeviceProvider>,
    )

    expect(screen.getByText('Hello App')).toBeInTheDocument()
  })

  it('应该渲染一个 div 元素', () => {
    const { container } = render(
      <DeviceProvider>
        <App />
      </DeviceProvider>,
    )

    expect(container.querySelector('div')).toBeInTheDocument()
  })
})
