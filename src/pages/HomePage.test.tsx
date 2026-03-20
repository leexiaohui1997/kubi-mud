import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import HomePage from './HomePage'

describe('HomePage 组件', () => {
  it('应该正确渲染', () => {
    render(<HomePage />)
    expect(screen.getByText('HomePage')).toBeInTheDocument()
  })
})
