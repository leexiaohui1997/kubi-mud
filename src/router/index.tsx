import { createMemoryRouter } from 'react-router'

import App from '@/App'
import StartPage from '@/pages/StartPage'

const router = createMemoryRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <StartPage />,
      },
    ],
  },
])

export default router
