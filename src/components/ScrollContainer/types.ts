import type { CSSProperties, ReactNode } from 'react'

/** 滚动位置信息 */
export interface ScrollPosition {
  x: number
  y: number
}

/** 下拉刷新配置 */
export interface PullDownRefreshConfig {
  /** 触发刷新的下拉距离阈值，默认 90 */
  threshold?: number
  /** 刷新后停留的距离，默认 40 */
  stop?: number
}

/** 上拉加载配置 */
export interface PullUpLoadConfig {
  /** 触发加载的距离阈值，默认 0 */
  threshold?: number
}

/** 鼠标滚轮配置 */
export interface MouseWheelConfig {
  /** 鼠标滚轮滚动速度，默认 20 */
  speed?: number
  /** 是否启用惯性，默认 true */
  invert?: boolean
  /** 每次滚动的步长，默认 undefined */
  easeTime?: number
}

/** 回弹效果配置 */
export interface BounceConfig {
  top?: boolean
  bottom?: boolean
  left?: boolean
  right?: boolean
}

/** ScrollContainer 组件 Props */
export interface ScrollContainerProps {
  /** 子元素 */
  children: ReactNode

  // ========== 基础配置 ==========
  /** 容器样式 */
  style?: CSSProperties
  /** 容器类名 */
  className?: string
  /** 是否启用纵向滚动，默认 true */
  scrollY?: boolean
  /** 是否启用横向滚动，默认 false */
  scrollX?: boolean

  // ========== 下拉刷新 ==========
  /** 是否启用下拉刷新，默认 false */
  pullDownRefresh?: boolean | PullDownRefreshConfig
  /** 下拉刷新回调 */
  onPullDownRefresh?: () => Promise<void> | void

  // ========== 上拉加载 ==========
  /** 是否启用上拉加载，默认 false */
  pullUpLoad?: boolean | PullUpLoadConfig
  /** 上拉加载回调 */
  onPullUpLoad?: () => Promise<void> | void
  /** 是否还有更多数据，默认 true */
  hasMore?: boolean

  // ========== 滚动事件 ==========
  /** 滚动时回调，传递当前位置 */
  onScroll?: (pos: ScrollPosition) => void
  /** 滚动开始回调 */
  onScrollStart?: () => void
  /** 滚动结束回调 */
  onScrollEnd?: (pos: ScrollPosition) => void
  /** 触发 onScroll 的滚动阈值，默认 0 */
  scrollThreshold?: number

  // ========== 滚动行为 ==========
  /** 是否启用惯性滚动，默认 true */
  momentum?: boolean
  /** 回弹效果配置，默认 true */
  bounce?: boolean | BounceConfig
  /** 是否显示滚动条，默认 false */
  scrollbar?: boolean
  /** 滚动事件防抖时间（ms），默认 0 */
  debounceTime?: number

  // ========== 鼠标交互 ==========
  /** 是否启用鼠标滚轮，默认 true */
  mouseWheel?: boolean | MouseWheelConfig
  /** 鼠标滚轮速度（mouseWheel 为 true 时的快捷配置），默认 20 */
  mouseWheelSpeed?: number

  // ========== 自定义组件 ==========
  /** 自定义 loading 组件（下拉刷新和上拉加载共用） */
  loadingComponent?: ReactNode
  /** 自定义"没有更多数据"组件 */
  noMoreComponent?: ReactNode

  // ========== 无障碍 ==========
  /** 滚动区域的 aria-label，默认 "滚动区域" */
  ariaLabel?: string
}

/** 通过 ref 暴露的方法 */
export interface ScrollContainerRef {
  /** 滚动到指定位置 */
  scrollTo: (x: number, y: number, time?: number) => void
  /** 滚动到指定元素 */
  scrollToElement: (
    el: HTMLElement | string,
    time?: number,
    offsetX?: number | boolean,
    offsetY?: number | boolean,
  ) => void
  /** 刷新 better-scroll 实例（内容变化后调用） */
  refresh: () => void
  /** 获取当前滚动位置 */
  getScrollPosition: () => ScrollPosition
  /** 禁用滚动 */
  disable: () => void
  /** 启用滚动 */
  enable: () => void
}
