import type { ReactNode } from 'react'

/** Modal 基础组件 Props */
export interface ModalProps {
  /** 是否显示弹窗 */
  open: boolean
  /** 弹窗标题 */
  title?: ReactNode
  /** 底部内容 */
  footer?: ReactNode
  /** 内容区域是否去除 padding，默认 false */
  noPadding?: boolean
  /** 点击遮罩层是否关闭，默认 true */
  maskClosable?: boolean
  /** 是否显示关闭按钮（×），默认 true */
  showCloseButton?: boolean
  /** 关闭回调 */
  onClose?: () => void
  /** 弹窗内容 */
  children?: ReactNode
}

/** useModal 配置项 */
export interface UseModalOptions {
  /** 弹窗标题 */
  title?: ReactNode
  /** 底部内容 */
  footer?: ReactNode
  /** 点击遮罩层是否关闭，默认 true */
  maskClosable?: boolean
  /** 内容区域是否去除 padding，默认 false */
  noPadding?: boolean
  /** 是否显示关闭按钮（×），默认 true */
  showCloseButton?: boolean
}

/** useModal 返回值 */
export interface UseModalReturn {
  /** 打开弹窗（幂等） */
  open: () => void
  /** 关闭弹窗 */
  close: () => void
}

/** ModalContext 提供的值 */
export interface ModalContextValue {
  /** 注册一个弹窗实例，返回唯一 id */
  register: (id: string, node: ReactNode) => void
  /** 注销一个弹窗实例 */
  unregister: (id: string) => void
}
