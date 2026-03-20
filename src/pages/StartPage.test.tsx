import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import StartPage from './StartPage'

// Mock useModal Hook
vi.mock('@/components/Modal/useModal', () => ({
  default: () => ({
    open: vi.fn(),
  }),
}))

// Mock 游戏配置 - 使用简单 mock，不依赖外部变量
vi.mock('@/config/game', () => ({
  GAME_TITLE: '测试游戏标题',
  GAME_MARK: '测试副标题',
  GAME_VERSION: '1.0.0',
}))

describe('StartPage 组件', () => {
  // 注意：由于 vi.mock 是静态的，无法在测试中动态修改
  // 这个 beforeEach 仅作为文档说明默认值
  beforeEach(() => {
    // 默认配置已在 mock 中设置:
    // GAME_TITLE: '测试游戏标题'
    // GAME_MARK: '测试副标题'
    // GAME_VERSION: '1.0.0'
  })
  it('应该正确渲染所有元素', () => {
    render(<StartPage />)

    // 检查标题是否存在
    const title = screen.getByText('测试游戏标题')
    expect(title).toBeInTheDocument()

    // 检查副标题是否存在
    const mark = screen.getByText('测试副标题')
    expect(mark).toBeInTheDocument()

    // 检查版本号是否存在
    const version = screen.getByText('v1.0.0')
    expect(version).toBeInTheDocument()

    // 检查三个按钮是否存在
    expect(screen.getByText('开始游戏')).toBeInTheDocument()
    expect(screen.getByText('读取存档')).toBeInTheDocument()
    expect(screen.getByText('游戏设置')).toBeInTheDocument()
  })

  it('应该使用正确的主题颜色类名', () => {
    const { container } = render(<StartPage />)

    // 检查标题颜色 - text-primary-300
    const title = container.querySelector('h1')
    expect(title).toHaveClass('text-primary-300')

    // 检查副标题颜色 - text-primary-300/60
    const mark = container.querySelector('p.text-sm')
    expect(mark).toHaveClass('text-primary-300/60')

    // 检查版本号颜色 - text-primary-300/40
    const version = container.querySelector('p.text-xs')
    expect(version).toHaveClass('text-primary-300/40')
  })

  it('按钮应该使用正确的样式类名', () => {
    const { container } = render(<StartPage />)

    // 获取所有按钮
    const buttons = container.querySelectorAll('button')

    // 检查每个按钮的公共样式
    buttons.forEach((button) => {
      expect(button).toHaveClass('border-primary-300/40')
      expect(button).toHaveClass('text-primary-300')
      expect(button).toHaveClass('hover:border-primary-300')
      expect(button).toHaveClass('hover:bg-primary-300/10')
    })

    // 检查"开始游戏"按钮
    expect(buttons[0]).toHaveTextContent('开始游戏')

    // 检查"读取存档"按钮
    expect(buttons[1]).toHaveTextContent('读取存档')

    // 检查"游戏设置"按钮
    expect(buttons[2]).toHaveTextContent('游戏设置')
  })

  it('应该具有正确的布局结构', () => {
    const { container } = render(<StartPage />)

    // 检查主容器布局
    const mainContainer = container.firstChild as HTMLElement
    expect(mainContainer).toHaveClass('flex')
    expect(mainContainer).toHaveClass('h-full')
    expect(mainContainer).toHaveClass('flex-col')
    expect(mainContainer).toHaveClass('items-center')
    expect(mainContainer).toHaveClass('justify-center')

    // 检查标题区域
    const titleSection = mainContainer.children[0]
    expect(titleSection).toHaveClass('flex')
    expect(titleSection).toHaveClass('flex-col')
    expect(titleSection).toHaveClass('items-center')
    expect(titleSection).toHaveClass('gap-2')

    // 检查按钮区域
    const buttonSection = mainContainer.children[1]
    expect(buttonSection).toHaveClass('flex')
    expect(buttonSection).toHaveClass('w-48')
    expect(buttonSection).toHaveClass('flex-col')
    expect(buttonSection).toHaveClass('gap-3')
  })

  it('应该根据条件渲染标题元素', () => {
    // 验证当 GAME_TITLE 有值时渲染 h1 标签
    const { container } = render(<StartPage />)

    const h1Elements = container.querySelectorAll('h1')
    expect(h1Elements.length).toBe(1)
    expect(h1Elements[0]).toHaveClass('text-4xl')
    expect(h1Elements[0]).toHaveClass('font-bold')
  })

  it('按钮应该具有可访问性属性', () => {
    const { container } = render(<StartPage />)

    const buttons = container.querySelectorAll('button')

    // 检查按钮是否可以被聚焦（基本可访问性）
    buttons.forEach((button) => {
      expect(button).not.toHaveAttribute('disabled')
    })
  })

  it('应该应用响应式类名', () => {
    const { container } = render(<StartPage />)

    const buttons = container.querySelectorAll('button')

    // 检查是否包含 pc:cursor-pointer 类名
    buttons.forEach((button) => {
      // Tailwind 的自定义变体会在类名中保留
      expect(button.className).toContain('pc:cursor-pointer')
    })
  })
})
