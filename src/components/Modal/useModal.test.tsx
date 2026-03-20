import { act, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ModalProvider from './ModalProvider'
import useModal from './useModal'

// 包裹 ModalProvider 的 wrapper
function wrapper({ children }: { children: ReactNode }) {
  return <ModalProvider>{children}</ModalProvider>
}

describe('useModal Hook - 基础行为', () => {
  it('应该返回 open 和 close 函数', () => {
    const { result } = renderHook(() => useModal(<p>内容</p>), { wrapper })
    expect(typeof result.current.open).toBe('function')
    expect(typeof result.current.close).toBe('function')
  })

  it('调用 open 后弹窗应该出现在 DOM 中', async () => {
    const { result } = renderHook(() => useModal(<p>弹窗内容</p>, { title: '测试标题' }), {
      wrapper,
    })

    act(() => {
      result.current.open()
    })

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  it('调用 close 后弹窗应该从 DOM 中移除', async () => {
    const { result } = renderHook(() => useModal(<p>弹窗内容</p>, { title: '测试标题' }), {
      wrapper,
    })

    act(() => {
      result.current.open()
    })

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    act(() => {
      result.current.close()
    })

    await waitFor(
      () => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      },
      { timeout: 500 },
    )
  })
})

describe('useModal Hook - 幂等性', () => {
  it('多次调用 open 不应重复创建弹窗', async () => {
    const { result } = renderHook(() => useModal(<p>内容</p>, { title: '标题' }), { wrapper })

    act(() => {
      result.current.open()
      result.current.open()
      result.current.open()
    })

    await waitFor(() => {
      expect(screen.getAllByRole('dialog')).toHaveLength(1)
    })
  })

  it('弹窗未打开时调用 close 不应报错', () => {
    const { result } = renderHook(() => useModal(<p>内容</p>), { wrapper })
    expect(() => {
      act(() => {
        result.current.close()
      })
    }).not.toThrow()
  })
})

describe('useModal Hook - 配置项', () => {
  it('应该将 title 传递给 Modal', async () => {
    const { result } = renderHook(() => useModal(<p>内容</p>, { title: '我的标题' }), { wrapper })

    act(() => {
      result.current.open()
    })

    await waitFor(() => {
      expect(screen.getByText('我的标题')).toBeInTheDocument()
    })
  })

  it('应该渲染传入的 content 内容', async () => {
    const { result } = renderHook(() => useModal(<p data-testid="modal-content">弹窗正文</p>), {
      wrapper,
    })

    act(() => {
      result.current.open()
    })

    await waitFor(() => {
      expect(screen.getByTestId('modal-content')).toBeInTheDocument()
    })
  })

  it('showCloseButton=false 时不应渲染关闭按钮', async () => {
    const { result } = renderHook(
      () => useModal(<p>内容</p>, { title: '标题', showCloseButton: false }),
      { wrapper },
    )

    act(() => {
      result.current.open()
    })

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: '关闭' })).not.toBeInTheDocument()
  })
})

describe('useModal Hook - 关闭按钮交互', () => {
  it('点击关闭按钮后弹窗应关闭', async () => {
    const user = userEvent.setup()
    const { result } = renderHook(
      () => useModal(<p>内容</p>, { title: '标题', showCloseButton: true }),
      { wrapper },
    )

    act(() => {
      result.current.open()
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '关闭' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: '关闭' }))

    await waitFor(
      () => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      },
      { timeout: 500 },
    )
  })

  it('关闭后应能再次打开（open 幂等重置）', async () => {
    const user = userEvent.setup()
    const { result } = renderHook(() => useModal(<p>内容</p>, { title: '标题' }), { wrapper })

    // 第一次打开
    act(() => {
      result.current.open()
    })
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // 点击关闭
    await user.click(screen.getByRole('button', { name: '关闭' }))
    await waitFor(
      () => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      },
      { timeout: 500 },
    )

    // 第二次打开
    act(() => {
      result.current.open()
    })
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })
})

describe('useModal Hook - 缺少 Provider 时的警告', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('未包裹 ModalProvider 时应输出警告', () => {
    renderHook(() => useModal(<p>内容</p>))
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('未找到 ModalProvider'))
  })
})

describe('useModal Hook - 组件卸载', () => {
  it('组件卸载后再调用 open/close 不应报错', () => {
    const { result, unmount } = renderHook(() => useModal(<p>内容</p>), { wrapper })

    act(() => {
      result.current.open()
    })

    expect(() => {
      unmount()
    }).not.toThrow()
  })
})
