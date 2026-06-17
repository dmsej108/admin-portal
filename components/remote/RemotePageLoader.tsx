import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import { useRemoteStyles } from '@/components/remote/useRemoteStyles'

interface RemotePageLoaderProps {
  loader: () => Promise<{ default: ComponentType }>
  remote: string
}

export default function RemotePageLoader({ loader, remote }: RemotePageLoaderProps) {
  useRemoteStyles(remote)

  const RemotePage = dynamic(loader, {
    ssr: false,
    loading: () => <div>페이지를 불러오는 중...</div>,
  })

  return <RemotePage />
}
