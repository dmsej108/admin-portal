import { REMOTE_MODULES, type RemoteModuleConfig } from '@/lib/config/remoteModules'

function normalizePathname(pathname: string): string {
  const withoutQuery = pathname.split('?')[0]
  const trimmed = withoutQuery.replace(/\/+$/, '')
  return trimmed || '/'
}

function pathToRegex(pattern: string): RegExp {
  const regex = pattern
    .split('/')
    .filter(Boolean)
    .map((segment) => (segment.startsWith(':') ? '[^/]+' : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('/')

  return new RegExp(`^/${regex}/?$`)
}

function countDynamicSegments(path: string): number {
  return (path.match(/:/g) ?? []).length
}

const SORTED_MODULES = [...REMOTE_MODULES].sort((a, b) => {
  const dynamicDiff = countDynamicSegments(a.path) - countDynamicSegments(b.path)
  if (dynamicDiff !== 0) return dynamicDiff
  return b.path.length - a.path.length
})

export function matchRemoteRoute(pathname: string): RemoteModuleConfig | undefined {
  const normalized = normalizePathname(pathname)

  return SORTED_MODULES.find((entry) => pathToRegex(entry.path).test(normalized))
}

/** static export용 slug 경로 생성 (:param → placeholder) */
export function toStaticSlug(path: string): string[] | undefined {
  const segments = path
    .split('/')
    .filter(Boolean)
    .map((segment) => (segment.startsWith(':') ? '_' : segment))

  return segments.length > 0 ? segments : undefined
}
