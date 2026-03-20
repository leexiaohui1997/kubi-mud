import { useContext } from 'react'

import { ThemeContext } from './themeContext'

export default function useTheme() {
  const context = useContext(ThemeContext)

  if (context === undefined) {
    throw new Error('useTheme 必须在 ThemeProvider 内部使用')
  }

  return context
}
