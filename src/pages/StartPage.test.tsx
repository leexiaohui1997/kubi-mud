import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// 使用可变对象，方便在测试中动态修改 mock 值
const mockGame = {
  GAME_TITLE: '超苦逼冒险者',
  GAME_MARK: 'MUD复刻版',
  GAME_VERSION: '1.0.0',
}

vi.mock('@/config/game', () => mockGame)

// 每次重置模块缓存后动态 import，确保拿到最新 mock 值
async function renderStartPage() {
  vi.resetModules()
  vi.mock('@/config/game', () => mockGame)
  const { default: StartPage } = await import('./StartPage')
  render(<StartPage />)
}

describe('StartPage 组件', () => {
  beforeEach(() => {
    mockGame.GAME_TITLE = '超苦逼冒险者'
    mockGame.GAME_MARK = 'MUD复刻版'
    mockGame.GAME_VERSION = '1.0.0'
  })

  it('应该正确渲染游戏标题', async () => {
    await renderStartPage()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('超苦逼冒险者')
  })

  it('应该正确渲染标记小字', async () => {
    await renderStartPage()
    expect(screen.getByText('MUD复刻版')).toBeInTheDocument()
  })

  it('应该正确渲染版本号（带 v 前缀）', async () => {
    await renderStartPage()
    expect(screen.getByText('v1.0.0')).toBeInTheDocument()
  })

  it('应该渲染三个操作按钮', async () => {
    await renderStartPage()
    expect(screen.getByRole('button', { name: '开始游戏' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '读取存档' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '游戏设置' })).toBeInTheDocument()
  })
})

describe('StartPage 组件 - 空值处理', () => {
  it('GAME_TITLE 为空时不渲染标题', async () => {
    mockGame.GAME_TITLE = ''
    await renderStartPage()
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
  })

  it('GAME_MARK 为空时不渲染标记小字', async () => {
    mockGame.GAME_MARK = ''
    await renderStartPage()
    expect(screen.queryByText('MUD复刻版')).not.toBeInTheDocument()
  })

  it('GAME_VERSION 为空时不渲染版本号', async () => {
    mockGame.GAME_VERSION = ''
    await renderStartPage()
    expect(screen.queryByText(/^v/)).not.toBeInTheDocument()
  })
})
