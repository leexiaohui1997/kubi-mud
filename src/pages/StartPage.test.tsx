import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// 使用可变对象，方便在测试中动态修改 mock 值
const mockGame = {
  GAME_TITLE: '超苦逼冒险者',
  GAME_MARK: 'MUD复刻版',
  GAME_VERSION: '1.0.0',
}

vi.mock('@/config/game', () => mockGame)

// 每次重置模块缓存后动态 import，确保所有模块（含 ModalContext）使用同一实例
async function renderStartPage() {
  vi.resetModules()
  vi.mock('@/config/game', () => mockGame)
  // ModalProvider 与 StartPage 必须在同一次 resetModules 后 import，
  // 保证它们共享同一个 ModalContext 实例
  const [{ default: ModalProvider }, { default: StartPage }] = await Promise.all([
    import('@/components/Modal/ModalProvider'),
    import('./StartPage'),
  ])
  render(
    <ModalProvider>
      <StartPage />
    </ModalProvider>,
  )
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

describe('StartPage 组件 - 弹窗交互', () => {
  it('点击「读取存档」按钮应打开弹窗并显示标题', async () => {
    const user = userEvent.setup()
    await renderStartPage()

    await user.click(screen.getByRole('button', { name: '读取存档' }))

    await waitFor(() => {
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      // 在弹窗内部查找标题，避免与按钮文字冲突
      expect(within(dialog).getByText('读取存档')).toBeInTheDocument()
    })
  })

  it('点击「游戏设置」按钮应打开弹窗并显示标题', async () => {
    const user = userEvent.setup()
    await renderStartPage()

    await user.click(screen.getByRole('button', { name: '游戏设置' }))

    await waitFor(() => {
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      // 在弹窗内部查找标题，避免与按钮文字冲突
      expect(within(dialog).getByText('游戏设置')).toBeInTheDocument()
    })
  })

  it('点击弹窗关闭按钮后弹窗应关闭', async () => {
    const user = userEvent.setup()
    await renderStartPage()

    // 打开弹窗
    await user.click(screen.getByRole('button', { name: '读取存档' }))
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // 点击关闭按钮
    await user.click(screen.getByRole('button', { name: '关闭' }))

    // 等待离开动画结束后 DOM 卸载（200ms timeout）
    await waitFor(
      () => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      },
      { timeout: 500 },
    )
  })

  it('弹窗内应显示「暂未实现」占位内容', async () => {
    const user = userEvent.setup()
    await renderStartPage()

    await user.click(screen.getByRole('button', { name: '读取存档' }))

    await waitFor(() => {
      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByText('暂未实现')).toBeInTheDocument()
    })
  })
})
