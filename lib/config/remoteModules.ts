import type { ComponentType } from 'react'

export interface RemoteModuleConfig {
  path: string
  remote: string
  module: string
  menuCodes?: string[]
  loader: () => Promise<{ default: ComponentType }>
}

/**
 * Remote 페이지 단일 등록소 — 새 페이지 연결 시 여기에 항목 1개만 추가
 * (pages/ 폴더에 라우트 파일 추가 불필요)
 */
export const REMOTE_MODULES: RemoteModuleConfig[] = [
  {
    path: '/marketing/event',
    remote: 'adminMarketing',
    module: 'EventListPage',
    menuCodes: ['EV_LIST'],
    loader: () => import('adminMarketing/EventListPage'),
  },
  {
    path: '/marketing/event/regist',
    remote: 'adminMarketing',
    module: 'EventRegistPage',
    menuCodes: ['EV_CREATE'],
    loader: () => import('adminMarketing/EventRegistPage'),
  },
  {
    path: '/marketing/event/detail/:eventId',
    remote: 'adminMarketing',
    module: 'EventDetailPage',
    loader: () => import('adminMarketing/EventDetailPage'),
  },
]

export function getUniqueRemotes(): string[] {
  return [...new Set(REMOTE_MODULES.map((entry) => entry.remote))]
}
