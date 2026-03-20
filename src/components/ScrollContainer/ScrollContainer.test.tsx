import { render, screen, act, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { ScrollContainer } from './ScrollContainer'

import type { ScrollContainerRef } from './types'

// ===== Mock ResizeObserver（jsdom 不支持）=====
const mockResizeObserverDisconnect = vi.fn()
const mockResizeObserverObserve = vi.fn()
class MockResizeObserver {
  observe = mockResizeObserverObserve
  disconnect = mockResizeObserverDisconnect
  unobserve = vi.fn()
}
vi.stubGlobal('ResizeObserver', MockResizeObserver)

// ===== Mock better-scroll 相关模块 =====

/** BScroll mock 实例，每个测试前重新创建 */
const bsMock = {
  x: 0,
  y: 0,
  maxScrollY: -500,
  _events: {} as Record<string, ((...args: unknown[]) => void)[]>,
  on: vi.fn(),
  emit(event: string, ...args: unknown[]) {
    const handlers = this._events[event] || []
    handlers.forEach((h) => h(...args))
  },
  destroy: vi.fn(),
  refresh: vi.fn(),
  scrollTo: vi.fn(),
  scrollToElement: vi.fn(),
  scrollBy: vi.fn(),
  disable: vi.fn(),
  enable: vi.fn(),
  finishPullDown: vi.fn(),
  finishPullUp: vi.fn(),
}

vi.mock('@better-scroll/core', () => {
  function MockBScroll(this: typeof bsMock) {
    // 将 bsMock 的所有属性复制到 this
    Object.assign(this, bsMock)
    // 重写 on，使其真正注册事件到 bsMock._events
    this.on = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!bsMock._events[event]) bsMock._events[event] = []
      bsMock._events[event].push(handler)
    })
  }
  MockBScroll.use = vi.fn()
  return { default: MockBScroll }
})

vi.mock('@better-scroll/pull-down', () => ({ default: {} }))
vi.mock('@better-scroll/pull-up', () => ({ default: {} }))
vi.mock('@better-scroll/mouse-wheel', () => ({ default: {} }))
vi.mock('@better-scroll/scroll-bar', () => ({ default: {} }))
vi.mock('@better-scroll/nested-scroll', () => ({ default: {} }))

// ===== 测试套件 =====

describe('ScrollContainer 组件', () => {
  beforeEach(() => {
    // 重置所有 mock 状态
    bsMock._events = {}
    bsMock.x = 0
    bsMock.y = 0
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ===== 基础渲染 =====
  describe('基础渲染', () => {
    it('应该正确渲染子元素', () => {
      render(
        <ScrollContainer style={{ height: '300px' }}>
          <div>测试内容</div>
        </ScrollContainer>,
      )
      expect(screen.getByText('测试内容')).toBeInTheDocument()
    })

    it('应该渲染带有 role="region" 的容器', () => {
      render(
        <ScrollContainer ariaLabel="测试滚动区域">
          <div>内容</div>
        </ScrollContainer>,
      )
      expect(screen.getByRole('region', { name: '测试滚动区域' })).toBeInTheDocument()
    })

    it('应该应用自定义 className', () => {
      render(
        <ScrollContainer className="my-scroll">
          <div>内容</div>
        </ScrollContainer>,
      )
      expect(document.querySelector('.my-scroll')).toBeInTheDocument()
    })

    it('应该应用自定义 style', () => {
      const { container } = render(
        <ScrollContainer style={{ height: '200px' }}>
          <div>内容</div>
        </ScrollContainer>,
      )
      // wrapper 是 forwardRef 返回的根 div（role="region"）
      const wrapper = container.firstElementChild as HTMLElement
      expect(wrapper.style.height).toBe('200px')
    })

    it('默认 ariaLabel 应为"滚动区域"', () => {
      render(
        <ScrollContainer>
          <div>内容</div>
        </ScrollContainer>,
      )
      expect(screen.getByRole('region', { name: '滚动区域' })).toBeInTheDocument()
    })
  })

  // ===== BScroll 实例管理 =====
  describe('BScroll 实例管理', () => {
    it('挂载时应注册事件监听', () => {
      render(
        <ScrollContainer onScroll={vi.fn()}>
          <div>内容</div>
        </ScrollContainer>,
      )
      // 注册了 scroll 事件
      expect(bsMock._events['scroll']).toBeDefined()
    })

    it('卸载时应销毁 BScroll 实例', () => {
      const { unmount } = render(
        <ScrollContainer>
          <div>内容</div>
        </ScrollContainer>,
      )
      unmount()
      expect(bsMock.destroy).toHaveBeenCalledTimes(1)
    })
  })

  // ===== ref 方法 =====
  describe('ref 暴露的方法', () => {
    it('应该通过 ref 调用 scrollTo', () => {
      const ref = createRef<ScrollContainerRef>()
      render(
        <ScrollContainer ref={ref}>
          <div>内容</div>
        </ScrollContainer>,
      )
      act(() => {
        ref.current?.scrollTo(0, -100, 300)
      })
      expect(bsMock.scrollTo).toHaveBeenCalledWith(0, -100, 300)
    })

    it('应该通过 ref 调用 refresh', () => {
      const ref = createRef<ScrollContainerRef>()
      render(
        <ScrollContainer ref={ref}>
          <div>内容</div>
        </ScrollContainer>,
      )
      act(() => {
        ref.current?.refresh()
      })
      expect(bsMock.refresh).toHaveBeenCalledTimes(1)
    })

    it('应该通过 ref 调用 disable 和 enable', () => {
      const ref = createRef<ScrollContainerRef>()
      render(
        <ScrollContainer ref={ref}>
          <div>内容</div>
        </ScrollContainer>,
      )
      act(() => {
        ref.current?.disable()
        ref.current?.enable()
      })
      expect(bsMock.disable).toHaveBeenCalledTimes(1)
      expect(bsMock.enable).toHaveBeenCalledTimes(1)
    })

    it('应该通过 ref 获取当前滚动位置', () => {
      const ref = createRef<ScrollContainerRef>()
      bsMock.x = -10
      bsMock.y = -50
      render(
        <ScrollContainer ref={ref}>
          <div>内容</div>
        </ScrollContainer>,
      )
      const pos = ref.current?.getScrollPosition()
      expect(pos).toEqual({ x: -10, y: -50 })
    })
  })

  // ===== 下拉刷新 =====
  describe('下拉刷新功能', () => {
    it('启用下拉刷新时应显示下拉提示文字', () => {
      render(
        <ScrollContainer pullDownRefresh onPullDownRefresh={vi.fn()}>
          <div>内容</div>
        </ScrollContainer>,
      )
      expect(screen.getByText('下拉刷新')).toBeInTheDocument()
    })

    it('未启用下拉刷新时不应显示下拉提示', () => {
      render(
        <ScrollContainer>
          <div>内容</div>
        </ScrollContainer>,
      )
      expect(screen.queryByText('下拉刷新')).not.toBeInTheDocument()
    })

    it('触发 pullingDown 事件时应调用 onPullDownRefresh 回调', async () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined)
      render(
        <ScrollContainer pullDownRefresh onPullDownRefresh={onRefresh}>
          <div>内容</div>
        </ScrollContainer>,
      )
      await act(async () => {
        bsMock.emit('pullingDown')
      })
      expect(onRefresh).toHaveBeenCalledTimes(1)
    })

    it('刷新完成后应调用 finishPullDown', async () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined)
      render(
        <ScrollContainer pullDownRefresh onPullDownRefresh={onRefresh}>
          <div>内容</div>
        </ScrollContainer>,
      )
      await act(async () => {
        bsMock.emit('pullingDown')
      })
      await waitFor(() => {
        expect(bsMock.finishPullDown).toHaveBeenCalledTimes(1)
      })
    })

    it('刷新过程中应显示 loading 动画', async () => {
      let resolveRefresh!: () => void
      const onRefresh = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveRefresh = resolve
          }),
      )
      render(
        <ScrollContainer pullDownRefresh onPullDownRefresh={onRefresh}>
          <div>内容</div>
        </ScrollContainer>,
      )
      act(() => {
        bsMock.emit('pullingDown')
      })
      // 刷新中应显示 loading 节点（DefaultLoading 包含 aria-label="加载中"）
      await waitFor(() => {
        expect(screen.getAllByLabelText('加载中').length).toBeGreaterThan(0)
      })
      // 清理：完成刷新
      await act(async () => {
        resolveRefresh()
      })
    })

    it('支持自定义 loading 组件', async () => {
      let resolveRefresh!: () => void
      const onRefresh = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveRefresh = resolve
          }),
      )
      render(
        <ScrollContainer
          pullDownRefresh
          onPullDownRefresh={onRefresh}
          loadingComponent={<div data-testid="custom-loading">自定义加载中</div>}
        >
          <div>内容</div>
        </ScrollContainer>,
      )
      act(() => {
        bsMock.emit('pullingDown')
      })
      await waitFor(() => {
        expect(screen.getByTestId('custom-loading')).toBeInTheDocument()
      })
      await act(async () => {
        resolveRefresh()
      })
    })
  })

  // ===== 上拉加载 =====
  describe('上拉加载功能', () => {
    it('启用上拉加载时应显示上拉提示文字', () => {
      render(
        <ScrollContainer pullUpLoad onPullUpLoad={vi.fn()}>
          <div>内容</div>
        </ScrollContainer>,
      )
      expect(screen.getByText('上拉加载更多')).toBeInTheDocument()
    })

    it('未启用上拉加载时不应显示上拉提示', () => {
      render(
        <ScrollContainer>
          <div>内容</div>
        </ScrollContainer>,
      )
      expect(screen.queryByText('上拉加载更多')).not.toBeInTheDocument()
    })

    it('触发 pullingUp 事件时应调用 onPullUpLoad 回调', async () => {
      const onLoad = vi.fn().mockResolvedValue(undefined)
      render(
        <ScrollContainer pullUpLoad onPullUpLoad={onLoad} hasMore>
          <div>内容</div>
        </ScrollContainer>,
      )
      await act(async () => {
        bsMock.emit('pullingUp')
      })
      expect(onLoad).toHaveBeenCalledTimes(1)
    })

    it('加载完成后应调用 finishPullUp', async () => {
      const onLoad = vi.fn().mockResolvedValue(undefined)
      render(
        <ScrollContainer pullUpLoad onPullUpLoad={onLoad} hasMore>
          <div>内容</div>
        </ScrollContainer>,
      )
      await act(async () => {
        bsMock.emit('pullingUp')
      })
      await waitFor(() => {
        expect(bsMock.finishPullUp).toHaveBeenCalledTimes(1)
      })
    })

    it('hasMore 为 false 时应显示"没有更多数据了"', () => {
      render(
        <ScrollContainer pullUpLoad onPullUpLoad={vi.fn()} hasMore={false}>
          <div>内容</div>
        </ScrollContainer>,
      )
      expect(screen.getByText('没有更多数据了')).toBeInTheDocument()
    })

    it('支持自定义"没有更多数据"组件', () => {
      render(
        <ScrollContainer
          pullUpLoad
          onPullUpLoad={vi.fn()}
          hasMore={false}
          noMoreComponent={<div data-testid="custom-no-more">已经到底了</div>}
        >
          <div>内容</div>
        </ScrollContainer>,
      )
      expect(screen.getByTestId('custom-no-more')).toBeInTheDocument()
    })

    it('加载过程中应显示 loading 动画', async () => {
      let resolveLoad!: () => void
      const onLoad = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveLoad = resolve
          }),
      )
      render(
        <ScrollContainer pullUpLoad onPullUpLoad={onLoad} hasMore>
          <div>内容</div>
        </ScrollContainer>,
      )
      act(() => {
        bsMock.emit('pullingUp')
      })
      // 加载中应显示 loading 节点（DefaultLoading 包含 aria-label="加载中"）
      await waitFor(() => {
        expect(screen.getAllByLabelText('加载中').length).toBeGreaterThan(0)
      })
      await act(async () => {
        resolveLoad()
      })
    })
  })

  // ===== 滚动事件监听 =====
  describe('滚动事件监听', () => {
    it('滚动时应触发 onScroll 回调并传递位置信息', () => {
      const onScroll = vi.fn()
      render(
        <ScrollContainer onScroll={onScroll}>
          <div>内容</div>
        </ScrollContainer>,
      )
      act(() => {
        bsMock.emit('scroll', { x: 0, y: -100 })
      })
      expect(onScroll).toHaveBeenCalledWith({ x: 0, y: -100 })
    })

    it('滚动开始时应触发 onScrollStart 回调', () => {
      const onScrollStart = vi.fn()
      render(
        <ScrollContainer onScrollStart={onScrollStart}>
          <div>内容</div>
        </ScrollContainer>,
      )
      act(() => {
        bsMock.emit('scrollStart')
      })
      expect(onScrollStart).toHaveBeenCalledTimes(1)
    })

    it('滚动结束时应触发 onScrollEnd 回调', () => {
      const onScrollEnd = vi.fn()
      render(
        <ScrollContainer onScrollEnd={onScrollEnd}>
          <div>内容</div>
        </ScrollContainer>,
      )
      act(() => {
        bsMock.emit('scrollEnd', { x: 0, y: -200 })
      })
      expect(onScrollEnd).toHaveBeenCalledWith({ x: 0, y: -200 })
    })

    it('配置 scrollThreshold 时，未超过阈值不应触发 onScroll', () => {
      const onScroll = vi.fn()
      render(
        <ScrollContainer onScroll={onScroll} scrollThreshold={50}>
          <div>内容</div>
        </ScrollContainer>,
      )
      act(() => {
        // 距离 = sqrt(0^2 + 30^2) = 30 < 50，不触发
        bsMock.emit('scroll', { x: 0, y: -30 })
      })
      expect(onScroll).not.toHaveBeenCalled()
    })

    it('配置 scrollThreshold 时，超过阈值应触发 onScroll', () => {
      const onScroll = vi.fn()
      render(
        <ScrollContainer onScroll={onScroll} scrollThreshold={50}>
          <div>内容</div>
        </ScrollContainer>,
      )
      act(() => {
        // 距离 = sqrt(0^2 + 100^2) = 100 > 50，触发
        bsMock.emit('scroll', { x: 0, y: -100 })
      })
      expect(onScroll).toHaveBeenCalledWith({ x: 0, y: -100 })
    })
  })

  // ===== 横向滚动 =====
  describe('横向滚动', () => {
    it('scrollX=true 时内容容器应有 w-max class', () => {
      const { container } = render(
        <ScrollContainer scrollX scrollY={false} style={{ height: 140 }}>
          <div>横向内容</div>
        </ScrollContainer>,
      )
      // better-scroll 直接子元素（content div）在 scrollX 时应有 w-max
      const contentDiv = container.firstElementChild?.firstElementChild as HTMLElement
      expect(contentDiv.classList.contains('w-max')).toBe(true)
    })

    it('mouseWheel=false 时不应注册 scroll 事件（不干预滚轮）', () => {
      render(
        <ScrollContainer scrollX scrollY={false} mouseWheel={false}>
          <div>横向内容</div>
        </ScrollContainer>,
      )
      // mouseWheel=false 时不注册任何 scroll 事件，滚轮交给浏览器原生处理
      expect(bsMock._events['scroll']).toBeUndefined()
    })
  })

  // ===== 无障碍访问 =====
  describe('无障碍访问支持', () => {
    it('容器应有 tabIndex=0 支持键盘聚焦', () => {
      const { container } = render(
        <ScrollContainer>
          <div>内容</div>
        </ScrollContainer>,
      )
      const wrapper = container.firstElementChild as HTMLElement
      expect(wrapper.tabIndex).toBe(0)
    })

    it('容器应有 role="region"', () => {
      render(
        <ScrollContainer>
          <div>内容</div>
        </ScrollContainer>,
      )
      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('下拉刷新区域应有 aria-live="polite"', () => {
      render(
        <ScrollContainer pullDownRefresh onPullDownRefresh={vi.fn()}>
          <div>内容</div>
        </ScrollContainer>,
      )
      // 下拉刷新区域是 pullDownConfig 渲染的 div，带有 aria-live
      const pullDownEl = document.querySelector('[aria-live="polite"]')
      expect(pullDownEl).toBeInTheDocument()
    })

    it('上拉加载区域应有 aria-live="polite"', () => {
      render(
        <ScrollContainer pullUpLoad onPullUpLoad={vi.fn()}>
          <div>内容</div>
        </ScrollContainer>,
      )
      const pullUpEl = document.querySelector('[aria-live="polite"]')
      expect(pullUpEl).toBeInTheDocument()
    })
  })
})
