// 设备断点
export const DEVICE_BREAKPOINT = {
  pc: 1,
  mobile: 0,
} as const

// 设备类型
export type DeviceType = keyof typeof DEVICE_BREAKPOINT
