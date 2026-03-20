import { Outlet } from 'react-router'

import { ModalProvider } from './components/Modal'

function App() {
  return (
    <div className="relative flex h-dvh w-dvw items-center justify-center bg-olive-950">
      <div className="relative flex h-full max-w-200 flex-col overflow-hidden bg-neutral-900 text-olive-50 select-none pc:aspect-square mobile:w-full">
        <ModalProvider>
          <Outlet />
        </ModalProvider>
      </div>
    </div>
  )
}

export default App
