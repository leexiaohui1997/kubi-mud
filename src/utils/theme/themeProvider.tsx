import { useEffect, useMemo, useState } from 'react'

import { ThemeContext, type ResolvedTheme, type Theme } from './themeContext'

const THEME_STORAGE_KEY = 'kubi-mud-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system'

    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    return stored || 'system'
  })

  const [systemDarkMode, setSystemDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      setSystemDarkMode(mediaQuery.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // 计算实际主题（处理 system 情况）
  const resolvedTheme = useMemo(() => {
    if (theme === 'system') {
      return systemDarkMode ? 'dark' : 'light'
    }
    return theme as ResolvedTheme
  }, [theme, systemDarkMode])

  // 应用主题到 DOM
  useEffect(() => {
    const root = document.documentElement

    // 移除所有主题类
    root.classList.remove('dark', 'light')

    // 应用实际主题
    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.add('light')
    }
  }, [resolvedTheme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
