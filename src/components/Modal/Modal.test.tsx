import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Modal from './Modal'

describe('Modal 组件 - 基础渲染', () => {
  it('open=true 时应渲染弹窗', () => {
    render(<Modal open={true}>内容</Modal>)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('open=false 时不应渲染弹窗', () => {
    render(<Modal open={false}>内容</Modal>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('应正确渲染 children 内容', () => {
    render(<Modal open={true}>弹窗内容文字</Modal>)
    expect(screen.getByText('弹窗内容文字')).toBeInTheDocument()
  })

  it('应正确渲染标题', () => {
    render(
      <Modal open={true} title="测试标题">
        内容
      </Modal>,
    )
    expect(screen.getByText('测试标题')).toBeInTheDocument()
  })

  it('应正确渲染底部内容', () => {
    render(
      <Modal open={true} footer={<button>确认</button>}>
        内容
      </Modal>,
    )
    expect(screen.getByRole('button', { name: '确认' })).toBeInTheDocument()
  })

  it('无 footer 时不渲染底部区域', () => {
    render(<Modal open={true}>内容</Modal>)
    // 只有关闭按钮，没有其他按钮
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveAttribute('aria-label', '关闭')
  })
})

describe('Modal 组件 - 关闭按钮', () => {
  it('默认显示关闭按钮', () => {
    render(<Modal open={true}>内容</Modal>)
    expect(screen.getByRole('button', { name: '关闭' })).toBeInTheDocument()
  })

  it('showCloseButton=false 时不显示关闭按钮', () => {
    render(
      <Modal open={true} showCloseButton={false}>
        内容
      </Modal>,
    )
    expect(screen.queryByRole('button', { name: '关闭' })).not.toBeInTheDocument()
  })

  it('点击关闭按钮应触发 onClose 回调', async () => {
    const onClose = vi.fn()
    render(
      <Modal open={true} onClose={onClose}>
        内容
      </Modal>,
    )
    await userEvent.click(screen.getByRole('button', { name: '关闭' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('Modal 组件 - 头部渲染', () => {
  it('有标题时渲染头部', () => {
    render(
      <Modal open={true} title="标题">
        内容
      </Modal>,
    )
    expect(screen.getByText('标题')).toBeInTheDocument()
  })

  it('showCloseButton=false 且无标题时不渲染头部', () => {
    render(
      <Modal open={true} showCloseButton={false}>
        内容
      </Modal>,
    )
    // 没有头部，也没有关闭按钮
    expect(screen.queryByRole('button', { name: '关闭' })).not.toBeInTheDocument()
  })
})

describe('Modal 组件 - 遮罩关闭', () => {
  it('maskClosable=true 时点击遮罩应触发 onClose', async () => {
    const onClose = vi.fn()
    render(
      <Modal open={true} maskClosable={true} onClose={onClose}>
        内容
      </Modal>,
    )
    // 点击遮罩层（role="presentation"）
    await userEvent.click(screen.getByRole('presentation'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('maskClosable=false 时点击遮罩不触发 onClose', async () => {
    const onClose = vi.fn()
    render(
      <Modal open={true} maskClosable={false} onClose={onClose}>
        内容
      </Modal>,
    )
    await userEvent.click(screen.getByRole('presentation'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('点击弹窗主体不应触发 onClose（阻止冒泡）', async () => {
    const onClose = vi.fn()
    render(
      <Modal open={true} maskClosable={true} onClose={onClose}>
        内容
      </Modal>,
    )
    await userEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('Modal 组件 - aria 属性', () => {
  it('弹窗应有 aria-modal="true"', () => {
    render(<Modal open={true}>内容</Modal>)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('字符串标题时 aria-label 应为标题文字', () => {
    render(
      <Modal open={true} title="我的弹窗">
        内容
      </Modal>,
    )
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', '我的弹窗')
  })

  it('无标题时 aria-label 应为默认值"弹窗"', () => {
    render(<Modal open={true}>内容</Modal>)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', '弹窗')
  })
})

describe('Modal 组件 - 动画与挂载', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('open 从 true 变为 false 后，延迟 200ms 卸载 DOM', async () => {
    const { rerender } = render(<Modal open={true}>内容</Modal>)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    rerender(<Modal open={false}>内容</Modal>)
    // 200ms 前仍挂载
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    vi.advanceTimersByTime(200)
    // 200ms 后卸载
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
