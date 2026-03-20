import { render, screen, act } from '@testing-library/react'
import { useContext } from 'react'
import { describe, expect, it } from 'vitest'

import ModalContext from './ModalContext'
import ModalProvider from './ModalProvider'

// 辅助组件：通过 context 注册一个弹窗节点
function RegisterHelper({
  id,
  content,
  onRegister,
}: {
  id: string
  content: React.ReactNode
  onRegister?: () => void
}) {
  const ctx = useContext(ModalContext)
  if (ctx && onRegister === undefined) {
    // 首次渲染时注册
  }
  return (
    <button
      onClick={() => {
        ctx?.register(id, content)
        onRegister?.()
      }}
    >
      注册
    </button>
  )
}

function UnregisterHelper({ id }: { id: string }) {
  const ctx = useContext(ModalContext)
  return <button onClick={() => ctx?.unregister(id)}>注销</button>
}

describe('ModalProvider 组件', () => {
  it('应该正确渲染子节点', () => {
    render(
      <ModalProvider>
        <div data-testid="child">子内容</div>
      </ModalProvider>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('应该渲染 modal-root 容器', () => {
    render(
      <ModalProvider>
        <div />
      </ModalProvider>,
    )
    expect(document.getElementById('modal-root')).toBeInTheDocument()
  })

  it('应该向子树提供非空的 ModalContext', () => {
    let capturedCtx: unknown
    function Consumer({ onCapture }: { onCapture: (ctx: unknown) => void }) {
      const ctx = useContext(ModalContext)
      onCapture(ctx)
      return null
    }
    render(
      <ModalProvider>
        <Consumer
          onCapture={(ctx) => {
            capturedCtx = ctx
          }}
        />
      </ModalProvider>,
    )
    expect(capturedCtx).not.toBeNull()
    expect(typeof (capturedCtx as { register: unknown }).register).toBe('function')
    expect(typeof (capturedCtx as { unregister: unknown }).unregister).toBe('function')
  })

  it('register 后应该将节点渲染到 modal-root 中', async () => {
    render(
      <ModalProvider>
        <RegisterHelper id="test-1" content={<div data-testid="modal-content">弹窗内容</div>} />
      </ModalProvider>,
    )

    await act(async () => {
      screen.getByRole('button', { name: '注册' }).click()
    })

    expect(screen.getByTestId('modal-content')).toBeInTheDocument()
  })

  it('unregister 后应该将节点从 modal-root 中移除', async () => {
    render(
      <ModalProvider>
        <RegisterHelper id="test-2" content={<div data-testid="modal-content-2">弹窗内容2</div>} />
        <UnregisterHelper id="test-2" />
      </ModalProvider>,
    )

    // 先注册
    await act(async () => {
      screen.getByRole('button', { name: '注册' }).click()
    })
    expect(screen.getByTestId('modal-content-2')).toBeInTheDocument()

    // 再注销
    await act(async () => {
      screen.getByRole('button', { name: '注销' }).click()
    })
    expect(screen.queryByTestId('modal-content-2')).not.toBeInTheDocument()
  })

  it('多次 register 同一 id 应该覆盖而非重复渲染', async () => {
    render(
      <ModalProvider>
        <RegisterHelper id="test-3" content={<div data-testid="modal-dup">内容</div>} />
      </ModalProvider>,
    )

    await act(async () => {
      screen.getByRole('button', { name: '注册' }).click()
    })
    await act(async () => {
      screen.getByRole('button', { name: '注册' }).click()
    })

    // 同一 id 只应出现一次
    expect(screen.getAllByTestId('modal-dup')).toHaveLength(1)
  })
})
