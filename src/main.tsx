import './assets/styles/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import router from './router'
import { DeviceProvider } from './utils/device/deviceProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DeviceProvider>
      <RouterProvider router={router} />
    </DeviceProvider>
  </StrictMode>,
)
