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
