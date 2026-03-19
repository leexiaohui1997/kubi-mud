import { useEffect } from 'react'

import { DeviceContext } from '../device/deviceContext'
import { useRequiredContext } from '../use'

export function useReponsiveClass() {
  const { deviceType } = useRequiredContext(DeviceContext)

  useEffect(() => {
    const type = deviceType
    const domEl = document.documentElement
    domEl.classList.add(`is-${type}`)
    return () => domEl.classList.remove(`is-${type}`)
  }, [deviceType])
}
