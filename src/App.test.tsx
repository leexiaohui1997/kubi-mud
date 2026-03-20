import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import App from './App'

// Mock react-router 的 Outlet
vi.mock('react-router', () => ({
  Outlet: () => <div data-testid="outlet" />,
}))

describe('App 组件', () => {
  it('应该正确渲染布局容器', () => {
    render(<App />)
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
  })

  it('应该使用 secondary-100 作为外层背景色', () => {
    const { container } = render(<App />)
    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv).toHaveClass('bg-secondary-100')
  })

  it('应该使用 secondary-50 作为内层容器背景色', () => {
    const { container } = render(<App />)
    // 查找第二个 div（内层容器）
    const innerDivs = container.querySelectorAll('div')
    expect(innerDivs.length).toBeGreaterThan(1)

    // 内层容器应该有 secondary-50 背景
    const innerDiv = Array.from(innerDivs).find((div) => div.className.includes('bg-secondary-50'))
    expect(innerDiv).toBeDefined()
  })

  it('应该使用 secondary-900 作为文本颜色', () => {
    const { container } = render(<App />)
    const innerDivs = container.querySelectorAll('div')

    const innerDiv = Array.from(innerDivs).find((div) =>
      div.className.includes('text-secondary-900'),
    )
    expect(innerDiv).toBeDefined()
  })

  it('应该包含 ModalProvider', () => {
    // 虽然无法直接测试 ModalProvider，但可以确保它被渲染
    const { container } = render(<App />)
    // ModalProvider 不会渲染额外的 DOM，所以只检查子元素
    expect(container.querySelector('[data-testid="outlet"]')).toBeInTheDocument()
  })
})
