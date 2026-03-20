import { describe, expect, it, vi } from 'vitest'

// Mock 依赖组件，避免渲染真实 DOM
vi.mock('@/App', () => ({ default: () => <div data-testid="app" /> }))
vi.mock('@/pages/StartPage', () => ({ default: () => <div data-testid="start-page" /> }))

describe('router 路由配置', () => {
  it('应该成功创建路由实例', async () => {
    const { default: router } = await import('./index')
    expect(router).toBeDefined()
  })

  it('路由初始路径应为 /', async () => {
    const { default: router } = await import('./index')
    expect(router.state.location.pathname).toBe('/')
  })
})
