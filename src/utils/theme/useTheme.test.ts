import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import useTheme from './useTheme'

describe('useTheme Hook', () => {
  it('在 ThemeProvider 外部使用时应该抛出错误', () => {
    // 模拟在 ThemeProvider 外部使用 useTheme
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useTheme())
    }).toThrow('useTheme 必须在 ThemeProvider 内部使用')

    errorSpy.mockRestore()
  })
})
