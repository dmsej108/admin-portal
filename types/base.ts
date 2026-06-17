import type { CSSProperties, ReactNode } from 'react'

export interface SComponentBaseProps {
  id?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}
