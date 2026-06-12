import { lazy, type LazyExoticComponent, type ComponentType } from 'react'

type RemoteModuleLoader = () => Promise<{ default: ComponentType }>

/**
 * Remote lazy loader registry
 * dynamic import는 정적 문자열이어야 federation이 인식합니다.
 */
const remoteModuleLoaders: Record<string, Record<string, RemoteModuleLoader>> = {
  adminMarketing: {
    EventListPage: () => import('adminMarketing/EventListPage'),
    EventRegistPage: () => import('adminMarketing/EventRegistPage'),
    EventDetailPage: () => import('adminMarketing/EventDetailPage'),
  },
  // adminPersonal: {
  //   MainPage: () => import('adminPersonal/MainPage'),
  // },
  // adminCommon: {
  //   CodePage: () => import('adminCommon/CodePage'),
  // },
}

const lazyCache = new Map<string, LazyExoticComponent<ComponentType>>()

export function getRemoteLazyComponent(
  remote: string,
  module: string,
): LazyExoticComponent<ComponentType> {
  const cacheKey = `${remote}/${module}`
  const cached = lazyCache.get(cacheKey)
  if (cached) return cached

  const loader = remoteModuleLoaders[remote]?.[module]
  if (!loader) {
    throw new Error(`Remote module not registered: ${cacheKey}`)
  }

  const component = lazy(loader)
  lazyCache.set(cacheKey, component)
  return component
}
