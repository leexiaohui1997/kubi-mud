import BScroll from '@better-scroll/core'
import MouseWheel from '@better-scroll/mouse-wheel'
import NestedScroll from '@better-scroll/nested-scroll'
import PullDown from '@better-scroll/pull-down'
import PullUp from '@better-scroll/pull-up'
import ScrollBar from '@better-scroll/scroll-bar'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

import type { ScrollContainerProps, ScrollContainerRef, ScrollPosition } from './types'
import './ScrollContainer.css'

// 注册 better-scroll 插件（eslint-disable 避免误判为 React Hook）
// eslint-disable-next-line react-hooks/rules-of-hooks
BScroll.use(PullDown)
// eslint-disable-next-line react-hooks/rules-of-hooks
BScroll.use(PullUp)
// eslint-disable-next-line react-hooks/rules-of-hooks
BScroll.use(MouseWheel)
// eslint-disable-next-line react-hooks/rules-of-hooks
BScroll.use(ScrollBar)
// eslint-disable-next-line react-hooks/rules-of-hooks
BScroll.use(NestedScroll)

/** 默认 loading 组件 */
function DefaultLoading() {
  return (
    <div className="flex items-center justify-center gap-1.5 py-1" aria-label="加载中">
      <span className="scroll-container-loading-dot" />
      <span className="scroll-container-loading-dot" />
      <span className="scroll-container-loading-dot" />
    </div>
  )
}

/** 默认"没有更多数据"组件 */
function DefaultNoMore() {
  return <div className="py-2 text-center text-[13px] text-[#bbb]">没有更多数据了</div>
}

const ScrollContainer = forwardRef<ScrollContainerRef, ScrollContainerProps>(
  (
    {
      children,
      style,
      className,
      scrollY = true,
      scrollX = false,
      pullDownRefresh = false,
      onPullDownRefresh,
      pullUpLoad = false,
      onPullUpLoad,
      hasMore = true,
      onScroll,
      onScrollStart,
      onScrollEnd,
      scrollThreshold = 0,
      momentum = true,
      bounce = true,
      scrollbar = false,
      debounceTime = 0,
      mouseWheel = true,
      mouseWheelSpeed = 20,
      loadingComponent,
      noMoreComponent,
      ariaLabel = '滚动区域',
    },
    ref,
  ) => {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const bsRef = useRef<BScroll | null>(null)
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // 下拉刷新状态
    const [pullDownState, setPullDownState] = useState<'idle' | 'pulling' | 'loading'>('idle')
    // 上拉加载状态
    const [pullUpState, setPullUpState] = useState<'idle' | 'loading' | 'noMore'>('idle')

    // 解析 pullDownRefresh 配置
    const pullDownConfig =
      pullDownRefresh === true
        ? { threshold: 90, stop: 40 }
        : pullDownRefresh === false
          ? null
          : { threshold: 90, stop: 40, ...pullDownRefresh }

    // 解析 pullUpLoad 配置
    const pullUpConfig =
      pullUpLoad === true
        ? { threshold: 0 }
        : pullUpLoad === false
          ? null
          : { threshold: 0, ...pullUpLoad }

    // 解析 mouseWheel 配置
    const mouseWheelConfig =
      mouseWheel === true
        ? {
            speed: mouseWheelSpeed,
            invert: false,
            easeTime: 300,
          }
        : mouseWheel === false
          ? false
          : {
              speed: mouseWheelSpeed,
              invert: false,
              easeTime: 300,
              ...mouseWheel,
            }

    // 解析 bounce 配置
    const bounceConfig =
      bounce === true
        ? { top: true, bottom: true, left: true, right: true }
        : bounce === false
          ? false
          : bounce

    // 初始化 better-scroll
    useEffect(() => {
      if (!wrapperRef.current) return

      const options: Record<string, unknown> = {
        scrollY,
        scrollX,
        momentum,
        bounce: bounceConfig,
        probeType: onScroll || onScrollStart || onScrollEnd ? 3 : 0,
        // 鼠标拖拽支持
        click: true,
        // 鼠标滚轮
        mouseWheel: mouseWheelConfig,
        // 滚动条
        scrollbar: scrollbar ? { fade: true, interactive: true } : false,
        // 下拉刷新
        pullDownRefresh: pullDownConfig || false,
        // 上拉加载
        pullUpLoad: pullUpConfig || false,
        // 嵌套滚动：由插件自动处理内外层滚动边界传递
        nestedScroll: true,
      }

      const bs = new BScroll(wrapperRef.current, options)
      bsRef.current = bs

      // 监听下拉刷新
      if (pullDownConfig && onPullDownRefresh) {
        bs.on('pullingDown', async () => {
          setPullDownState('loading')
          try {
            await onPullDownRefresh()
          } finally {
            bs.finishPullDown()
            setPullDownState('idle')
            // 刷新后需要重新计算高度
            setTimeout(() => bs.refresh(), 50)
          }
        })

        bs.on('enterThreshold', () => {
          setPullDownState('pulling')
        })

        bs.on('leaveThreshold', () => {
          setPullDownState('idle')
        })
      }

      // 监听上拉加载
      if (pullUpConfig && onPullUpLoad) {
        bs.on('pullingUp', async () => {
          setPullUpState('loading')
          try {
            await onPullUpLoad()
          } finally {
            bs.finishPullUp()
            if (!hasMore) {
              setPullUpState('noMore')
            } else {
              setPullUpState('idle')
            }
            setTimeout(() => bs.refresh(), 50)
          }
        })
      }

      // 监听滚动事件
      if (onScroll) {
        bs.on('scroll', (pos: ScrollPosition) => {
          if (scrollThreshold > 0) {
            const distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y)
            if (distance < scrollThreshold) return
          }
          if (debounceTime > 0) {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
            debounceTimerRef.current = setTimeout(() => onScroll(pos), debounceTime)
          } else {
            onScroll(pos)
          }
        })
      }

      if (onScrollStart) {
        bs.on('scrollStart', onScrollStart)
      }

      if (onScrollEnd) {
        bs.on('scrollEnd', (pos: ScrollPosition) => onScrollEnd(pos))
      }

      // 键盘滚动支持（无障碍）
      const handleKeyDown = (e: KeyboardEvent) => {
        const STEP = 40
        const PAGE_STEP = 200
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault()
            bs.scrollBy(0, -STEP, 300)
            break
          case 'ArrowUp':
            e.preventDefault()
            bs.scrollBy(0, STEP, 300)
            break
          case 'ArrowRight':
            e.preventDefault()
            bs.scrollBy(-STEP, 0, 300)
            break
          case 'ArrowLeft':
            e.preventDefault()
            bs.scrollBy(STEP, 0, 300)
            break
          case 'PageDown':
            e.preventDefault()
            bs.scrollBy(0, -PAGE_STEP, 300)
            break
          case 'PageUp':
            e.preventDefault()
            bs.scrollBy(0, PAGE_STEP, 300)
            break
          case 'Home':
            e.preventDefault()
            bs.scrollTo(0, 0, 300)
            break
          case 'End':
            e.preventDefault()
            bs.scrollTo(0, bs.maxScrollY, 300)
            break
        }
      }

      const wrapperEl = wrapperRef.current
      wrapperEl.addEventListener('keydown', handleKeyDown)

      return () => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        wrapperEl.removeEventListener('keydown', handleKeyDown)
        bs.destroy()
        bsRef.current = null
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // hasMore 变化时更新上拉加载状态
    useEffect(() => {
      if (!hasMore) {
        setPullUpState('noMore')
      } else {
        setPullUpState((prev) => (prev === 'noMore' ? 'idle' : prev))
      }
    }, [hasMore])

    // 内容变化 / 容器尺寸变化时自动刷新（通过 ResizeObserver 监听）
    // 同时监听 wrapper 容器本身，确保 resize / orientationchange 后也能正确 refresh
    useEffect(() => {
      if (!wrapperRef.current) return
      const contentEl = wrapperRef.current.firstElementChild
      if (!contentEl) return

      const observer = new ResizeObserver(() => {
        bsRef.current?.refresh()
      })
      // 监听内容元素（内容高度/宽度变化）
      observer.observe(contentEl)
      // 监听容器元素（窗口 resize / orientationchange 导致容器尺寸变化）
      observer.observe(wrapperRef.current)

      return () => observer.disconnect()
    }, [children])

    // 暴露 ref 方法
    useImperativeHandle(
      ref,
      () => ({
        scrollTo: (x, y, time = 300) => {
          bsRef.current?.scrollTo(x, y, time)
        },
        scrollToElement: (el, time = 300, offsetX = false, offsetY = false) => {
          bsRef.current?.scrollToElement(el as HTMLElement, time, offsetX, offsetY)
        },
        refresh: () => {
          bsRef.current?.refresh()
        },
        getScrollPosition: () => {
          const bs = bsRef.current
          return { x: bs?.x ?? 0, y: bs?.y ?? 0 }
        },
        disable: () => {
          bsRef.current?.disable()
        },
        enable: () => {
          bsRef.current?.enable()
        },
      }),
      [],
    )

    const loadingNode = loadingComponent ?? <DefaultLoading />
    const noMoreNode = noMoreComponent ?? <DefaultNoMore />

    return (
      <div
        ref={wrapperRef}
        className={['relative overflow-hidden outline-none', className].filter(Boolean).join(' ')}
        style={style}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
      >
        {/* better-scroll 直接子元素作为 content，横向模式需要 w-max 让宽度由内容撑开 */}
        <div className={scrollX ? 'w-max' : 'relative'}>
          {/* 下拉刷新区域 */}
          {pullDownConfig && (
            <div
              className={[
                'absolute -top-15 right-0 left-0 flex h-15 items-center justify-center text-sm text-[#999] transition-transform duration-200',
                pullDownState === 'pulling' ? 'text-[#666]' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-live="polite"
              aria-atomic="true"
            >
              {pullDownState === 'loading' ? (
                <div className="flex items-center justify-center">{loadingNode}</div>
              ) : pullDownState === 'pulling' ? (
                <div className="text-sm text-[#999]">释放立即刷新</div>
              ) : (
                <div className="text-sm text-[#999]">下拉刷新</div>
              )}
            </div>
          )}

          {/* 主内容 */}
          {children}

          {/* 上拉加载区域 */}
          {pullUpConfig && (
            <div
              className="flex min-h-11 items-center justify-center py-3"
              aria-live="polite"
              aria-atomic="true"
            >
              {pullUpState === 'loading' ? (
                <div className="flex items-center justify-center">{loadingNode}</div>
              ) : pullUpState === 'noMore' ? (
                noMoreNode
              ) : (
                <div className="text-sm text-[#999]">上拉加载更多</div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  },
)

ScrollContainer.displayName = 'ScrollContainer'

export { ScrollContainer }
export type { ScrollContainerProps, ScrollContainerRef, ScrollPosition }
