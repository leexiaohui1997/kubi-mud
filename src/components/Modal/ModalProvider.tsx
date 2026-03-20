import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import ModalContext from './ModalContext'

interface ModalProviderProps {
  children: ReactNode
}

/**
 * ModalProvider
 * 统一挂载弹窗 DOM 节点，通过 Context 向子树提供 register / unregister 方法
 * 使用方式：在应用根部包裹 <ModalProvider>
 */
function ModalProvider({ children }: ModalProviderProps) {
  // 弹窗实例 Map：id -> ReactNode
  const [modals, setModals] = useState<Map<string, ReactNode>>(new Map())
  // 专用弹窗挂载容器节点（用 state 存储，挂载后触发重渲染以正确挂载 Portal）
  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  const register = useCallback((id: string, node: ReactNode) => {
    setModals((prev) => {
      const next = new Map(prev)
      next.set(id, node)
      return next
    })
  }, [])

  const unregister = useCallback((id: string) => {
    setModals((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  const contextValue = useMemo(() => ({ register, unregister }), [register, unregister])

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      {/* 弹窗专用挂载容器 */}
      <div ref={setContainer} id="modal-root" className="pointer-events-none absolute inset-0">
        {container &&
          Array.from(modals.values()).map((node, index) =>
            createPortal(node, container, String(index)),
          )}
      </div>
    </ModalContext.Provider>
  )
}

export default ModalProvider
