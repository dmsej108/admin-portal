import { useLayoutEffect } from 'react'
import { REMOTE_STYLE_URLS } from '@/lib/config/remoteStyles'

const loadedStyles = new Set<string>()

export function useRemoteStyles(remote: string) {
  useLayoutEffect(() => {
    const href = REMOTE_STYLE_URLS[remote]
    if (!href || loadedStyles.has(href)) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.dataset.remote = remote
    document.head.appendChild(link)
    loadedStyles.add(href)
  }, [remote])
}
