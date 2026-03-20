import { createContext } from 'react'

import type { ModalContextValue } from './types'

/**
 * Modal 上下文
 * 由 ModalProvider 提供，useModal 消费
 */
const ModalContext = createContext<ModalContextValue | null>(null)

export default ModalContext
