import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('App 组件', () => {
  it('应该正确渲染 Hello App 文本', () => {
    render(<App />)

    expect(screen.getByText('Hello App')).toBeInTheDocument()
  })

  it('应该渲染一个 div 元素', () => {
    const { container } = render(<App />)

    expect(container.querySelector('div')).toBeInTheDocument()
  })
})
