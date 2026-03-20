import './assets/styles/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import router from './router'
import { DeviceProvider } from './utils/device/deviceProvider.tsx'
import { ThemeProvider } from './utils/theme/themeProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <DeviceProvider>
        <RouterProvider router={router} />
      </DeviceProvider>
    </ThemeProvider>
  </StrictMode>,
)
