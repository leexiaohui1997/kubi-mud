import { useEffect, useMemo, useState } from 'react'

import { DeviceContext, getDeviceType } from './deviceContext'

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [innerWidth, setInnerWidth] = useState(window.innerWidth)
  const [innerHeight, setInnerHeight] = useState(window.innerHeight)

  const deviceType = useMemo(
    () => getDeviceType(innerWidth / innerHeight),
    [innerWidth, innerHeight],
  )

  useEffect(() => {
    const handleResize = () => {
      setInnerWidth(window.innerWidth)
      setInnerHeight(window.innerHeight)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  useEffect(() => {
    const type = deviceType
    const domEl = document.documentElement
    domEl.classList.add(`is-${type}`)
    return () => domEl.classList.remove(`is-${type}`)
  }, [deviceType])

  return (
    <DeviceContext.Provider
      value={{
        innerWidth,
        innerHeight,
        deviceType,
      }}
    >
      {children}
    </DeviceContext.Provider>
  )
}
