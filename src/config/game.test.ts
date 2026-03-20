import { describe, expect, it } from 'vitest'

import { GAME_MARK, GAME_TITLE, GAME_VERSION } from './game'

describe('game 配置常量', () => {
  it('GAME_TITLE 应为非空字符串', () => {
    expect(GAME_TITLE).toBeTruthy()
    expect(typeof GAME_TITLE).toBe('string')
  })

  it('GAME_MARK 应为非空字符串', () => {
    expect(GAME_MARK).toBeTruthy()
    expect(typeof GAME_MARK).toBe('string')
  })

  it('GAME_VERSION 应符合语义化版本格式', () => {
    expect(GAME_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
