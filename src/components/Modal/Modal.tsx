import { useEffect, useRef, useState } from 'react'

import type { ModalProps } from './types'

/**
 * Modal 弹窗基础组件
 * 由遮罩层、头部（标题 + 关闭按钮）、内容区、底部四个区域组成
 */
function Modal({
  open,
  title,
  footer,
  noPadding = false,
  maskClosable = false,
  showCloseButton = true,
  onClose,
  children,
}: ModalProps) {
  // 控制 DOM 是否挂载（动画结束后卸载）
  const [mounted, setMounted] = useState(open)
  // 控制动画状态：entering | entered | leaving
  const [animState, setAnimState] = useState<'entering' | 'entered' | 'leaving'>(
    open ? 'entering' : 'leaving',
  )
  // 用于收集所有异步任务句柄，统一在 cleanup 中取消
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const rafsRef = useRef<number[]>([])

  useEffect(() => {
    // 清理上一次 effect 遗留的所有异步任务
    timersRef.current.forEach(clearTimeout)
    rafsRef.current.forEach(cancelAnimationFrame)
    timersRef.current = []
    rafsRef.current = []

    if (open) {
      // 用双 rAF 触发进入动画：第1帧挂载 DOM + 设置初始状态，第2帧触发 transition
      const raf1 = requestAnimationFrame(() => {
        setMounted(true)
        setAnimState('entering')
        const raf2 = requestAnimationFrame(() => setAnimState('entered'))
        rafsRef.current.push(raf2)
      })
      rafsRef.current.push(raf1)
    } else {
      // 用 setTimeout(0) 异步触发离开动画，避免 effect 内同步 setState 产生级联渲染
      const t1 = setTimeout(() => setAnimState('leaving'), 0)
      // 动画结束后卸载 DOM（与 CSS transition duration 保持一致）
      const t2 = setTimeout(() => setMounted(false), 200)
      timersRef.current.push(t1, t2)
    }

    return () => {
      timersRef.current.forEach(clearTimeout)
      rafsRef.current.forEach(cancelAnimationFrame)
      timersRef.current = []
      rafsRef.current = []
    }
  }, [open])

  if (!mounted) return null

  // 头部是否渲染：有标题 或 显示关闭按钮时渲染
  const showHeader = Boolean(title) || showCloseButton !== false

  const handleMaskClick = () => {
    if (maskClosable !== false) {
      onClose?.()
    }
  }

  // 动画样式映射
  const overlayClass =
    animState === 'entered' ? 'opacity-100' : animState === 'entering' ? 'opacity-0' : 'opacity-0'

  const panelClass =
    animState === 'entered'
      ? 'opacity-100 translate-y-0'
      : animState === 'entering'
        ? 'opacity-0 translate-y-4'
        : 'opacity-0 translate-y-4'

  return (
    /* 遮罩层 */
    <div
      role="presentation"
      className={`absolute inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${overlayClass} pointer-events-auto p-6`}
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={handleMaskClick}
      onKeyDown={(e) => e.key === 'Escape' && handleMaskClick()}
    >
      {/* 弹窗主体，阻止点击冒泡到遮罩 */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : '弹窗'}
        className={`relative flex w-full max-w-md flex-col border border-amber-300/40 bg-neutral-900 text-amber-300 shadow-lg shadow-black/50 transition-all duration-200 ${panelClass}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        {showHeader && (
          <div className="flex items-center justify-between border-b border-amber-300/20 px-4 py-3">
            <span className="text-sm font-semibold tracking-wider text-amber-300">
              {title ?? ''}
            </span>
            {showCloseButton !== false && (
              <button
                className="ml-4 flex h-6 w-6 items-center justify-center text-amber-300/60 transition-colors hover:text-amber-300 pc:cursor-pointer"
                onClick={onClose}
                aria-label="关闭"
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* 内容区 */}
        <div className={`flex-1 overflow-auto ${noPadding ? '' : 'p-4'}`}>{children}</div>

        {/* 底部 */}
        {footer && <div className="border-t border-amber-300/20 px-4 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export default Modal
