import { Outlet } from 'react-router'

function App() {
  return (
    <div className="relative flex h-dvh w-dvw items-center justify-center bg-olive-950">
      <div className="flex h-full max-w-200 flex-col overflow-hidden bg-neutral-900 text-olive-50 pc:aspect-square mobile:w-full">
        <Outlet />
      </div>
    </div>
  )
}

export default App
