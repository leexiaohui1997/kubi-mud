import { render, screen, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from './themeProvider'
import useTheme from './useTheme'

// 辅助测试组件
function TestConsumer() {
  const { theme, setTheme, toggleTheme, resolvedTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolvedTheme">{resolvedTheme}</span>
      <button onClick={() => setTheme('dark')}>设置为暗色</button>
      <button onClick={() => setTheme('light')}>设置为亮色</button>
      <button onClick={() => setTheme('system')}>设置为系统</button>
      <button onClick={toggleTheme}>切换主题</button>
    </div>
  )
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('ThemeProvider', () => {
  beforeEach(() => {
    // 清理 localStorage
    localStorage.clear()
    // 重置 document.documentElement 的类名
    document.documentElement.className = ''
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('基础功能', () => {
    it('应该提供 theme context', () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      )

      expect(screen.getByTestId('theme')).toBeInTheDocument()
      expect(screen.getByTestId('resolvedTheme')).toBeInTheDocument()
    })

    it('默认主题应该是 system', () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('system')
    })

    it('应该允许设置主题为 light', () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      )

      act(() => {
        screen.getByText('设置为亮色').click()
      })

      expect(screen.getByTestId('theme')).toHaveTextContent('light')
      expect(document.documentElement.classList.contains('light')).toBe(true)
    })

    it('应该允许设置主题为 dark', () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      )

      act(() => {
        screen.getByText('设置为暗色').click()
      })

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('应该允许设置主题为 system', () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      )

      // 先设置为 dark
      act(() => {
        screen.getByText('设置为暗色').click()
      })

      // 再设置为 system
      act(() => {
        screen.getByText('设置为系统').click()
      })

      expect(screen.getByTestId('theme')).toHaveTextContent('system')
    })
  })

  describe('DOM 操作', () => {
    it('应该在 root 元素上添加 light class', () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      )

      act(() => {
        screen.getByText('设置为亮色').click()
      })

      expect(document.documentElement.classList.contains('light')).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('应该在 root 元素上添加 dark class', () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      )

      act(() => {
        screen.getByText('设置为暗色').click()
      })

      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('light')).toBe(false)
    })

    it('切换主题时应该移除旧的 class 并添加新的', () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      )

      // 先设置为 light
      act(() => {
        screen.getByText('设置为亮色').click()
      })
      expect(document.documentElement.classList.contains('light')).toBe(true)

      // 再切换到 dark
      act(() => {
        screen.getByText('设置为暗色').click()
      })
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('light')).toBe(false)
    })
  })

  describe('localStorage 持久化', () => {
    it('应该将主题保存到 localStorage', () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      )

      act(() => {
        screen.getByText('设置为暗色').click()
      })

      expect(localStorage.getItem('kubi-mud-theme')).toBe('dark')
    })

    it('应该从 localStorage 读取保存的主题', () => {
      // 预先设置 localStorage
      localStorage.setItem('kubi-mud-theme', 'dark')

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    })

    it('localStorage 优先于默认值', () => {
      localStorage.setItem('kubi-mud-theme', 'light')

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('light')
    })
  })

  describe('toggleTheme 功能', () => {
    it('从 light 切换到 dark', () => {
      localStorage.setItem('kubi-mud-theme', 'light')

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      )

      act(() => {
        screen.getByText('切换主题').click()
      })

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    })

    it('从 dark 切换到 light', () => {
      localStorage.setItem('kubi-mud-theme', 'dark')

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      )

      act(() => {
        screen.getByText('切换主题').click()
      })

      expect(screen.getByTestId('theme')).toHaveTextContent('light')
    })
  })

  describe('resolvedTheme 计算', () => {
    it('当 theme 为 light 时，resolvedTheme 应该为 light', () => {
      localStorage.setItem('kubi-mud-theme', 'light')

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      )

      expect(screen.getByTestId('resolvedTheme')).toHaveTextContent('light')
    })

    it('当 theme 为 dark 时，resolvedTheme 应该为 dark', () => {
      localStorage.setItem('kubi-mud-theme', 'dark')

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      )

      expect(screen.getByTestId('resolvedTheme')).toHaveTextContent('dark')
    })

    it('当 theme 为 system 时，应该根据系统偏好设置 resolvedTheme', () => {
      // Mock matchMedia 返回暗色模式
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: true, // 模拟系统为暗色模式
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      )

      expect(screen.getByTestId('resolvedTheme')).toHaveTextContent('dark')
    })
  })

  describe('系统主题监听', () => {
    it.skip('应该监听系统主题变化（集成测试场景）', () => {
      // 这个测试需要更复杂的设置，在集成测试中验证
      // ThemeProvider 会在 useEffect 中监听 system 模式的变化
      expect(true).toBe(true)
    })

    it.skip('在 theme 不为 system 时不应该监听系统主题变化（集成测试场景）', () => {
      // 这个测试需要更复杂的设置，在集成测试中验证
      expect(true).toBe(true)
    })
  })
})
