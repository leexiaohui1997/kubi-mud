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
})
