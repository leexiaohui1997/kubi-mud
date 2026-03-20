import { useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'

import Modal from './Modal'
import ModalContext from './ModalContext'

import type { UseModalOptions, UseModalReturn } from './types'

/**
 * useModal Hook
 * 命令式控制弹窗的打开与关闭
 *
 * @example
 * const { open, close } = useModal(<Content />, { title: '标题' })
 * <div onClick={open} />
 */
function useModal(content: ReactNode, options: UseModalOptions = {}): UseModalReturn {
  const { title, footer, maskClosable, noPadding, showCloseButton } = options

  const ctx = useContext(ModalContext)
  const id = useId()
  // 当前弹窗是否处于打开状态
  const [isOpen, setIsOpen] = useState(false)
  // 用 ref 追踪最新 isOpen，避免闭包陷阱
  const isOpenRef = useRef(false)
  // 用 ref 稳定 content 引用，避免 JSX 每次渲染产生新对象触发 effect 无限循环
  const contentRef = useRef<ReactNode>(content)

  // 在 effect 中同步最新 content，避免在渲染阶段直接写 ref
  useEffect(() => {
    contentRef.current = content
  })

  // 缺少 Provider 时警告
  if (!ctx) {
    console.warn('[useModal] 未找到 ModalProvider，请在应用根部包裹 <ModalProvider>')
  }

  const close = useCallback(() => {
    if (!isOpenRef.current) return
    isOpenRef.current = false
    setIsOpen(false)
  }, [])

  const open = useCallback(() => {
    // 幂等：已打开时不重复创建
    if (isOpenRef.current) return
    isOpenRef.current = true
    setIsOpen(true)
  }, [])

  // 同步弹窗节点到 ModalProvider
  useEffect(() => {
    if (!ctx) return

    const node = (
      <Modal
        open={isOpen}
        title={title}
        footer={footer}
        maskClosable={maskClosable}
        noPadding={noPadding}
        showCloseButton={showCloseButton}
        onClose={() => {
          // 遮罩/关闭按钮关闭后同步状态，使 open() 可再次触发
          isOpenRef.current = false
          setIsOpen(false)
        }}
      >
        {contentRef.current}
      </Modal>
    )

    ctx.register(id, node)

    return () => {
      // 组件 unmount 时自动注销，防止内存泄漏
      ctx.unregister(id)
    }
  }, [ctx, id, isOpen, title, footer, maskClosable, noPadding, showCloseButton, close])

  // 组件 unmount 时自动关闭
  useEffect(() => {
    return () => {
      isOpenRef.current = false
    }
  }, [])

  return { open, close }
}

export default useModal
