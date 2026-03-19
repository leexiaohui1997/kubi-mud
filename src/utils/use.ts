import { useContext } from 'react'

export function useRequiredContext<T>(context: React.Context<T | undefined>) {
  const value = useContext(context)

  if (value === undefined) {
    console.log(context)
    throw new Error(`${context.displayName} 必须在 Provider 内使用`)
  }

  return value
}
