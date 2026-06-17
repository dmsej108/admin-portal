import { useEffect } from 'react'
import { getEnabledRemotes } from '@/lib/config/mf.registry'

const loadedStyles = new Set<string>()

function resolveRemoteStylesUrl(remoteKey: string): string | undefined {
  const entry = getEnabledRemotes().find((item) => item.key === remoteKey)
  if (!entry?.stylesPathEnvKey) return undefined

  const stylesPath = process.env[entry.stylesPathEnvKey]
  if (!stylesPath) return undefined

  const remoteEntry = process.env[entry.remoteEntryEnvKey]
  if (!remoteEntry) return stylesPath

  try {
    const origin = new URL(remoteEntry).origin
    return `${origin}${stylesPath.startsWith('/') ? stylesPath : `/${stylesPath}`}`
  } catch {
    return stylesPath
  }
}

export function useRemoteStyles(remote: string) {
  useEffect(() => {
    const href = resolveRemoteStylesUrl(remote)
    if (!href || loadedStyles.has(href)) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.dataset.remote = remote
    document.head.appendChild(link)
    loadedStyles.add(href)
  }, [remote])
}
