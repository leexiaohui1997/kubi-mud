import { createContext } from 'react'

import { DEVICE_BREAKPOINT, type DeviceType } from '@/constants/device'

export interface DeviceContextType {
  innerWidth: number
  innerHeight: number
  deviceType: DeviceType
}

export const DeviceContext = createContext<DeviceContextType | undefined>(undefined)

/**
 * 根据屏幕宽高比获取设备类型
 * @param ratio 屏幕宽高比
 * @returns 设备类型
 */
export function getDeviceType(ratio: number): DeviceType {
  const types = (Object.keys(DEVICE_BREAKPOINT) as DeviceType[]).sort(
    (a, b) => DEVICE_BREAKPOINT[b] - DEVICE_BREAKPOINT[a],
  )

  return types.find((a) => ratio > DEVICE_BREAKPOINT[a])!
}
