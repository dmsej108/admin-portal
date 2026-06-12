export interface RemoteRouteConfig {
  path: string
  remote: string
  module: string
  /** Placeholder 라우트에서 제외할 menuCode */
  menuCodes?: string[]
}

/** Remote 페이지 라우트 — 새 페이지 추가 시 여기에 등록 */
export const remoteRoutes: RemoteRouteConfig[] = [
  {
    path: '/marketing/event',
    remote: 'adminMarketing',
    module: 'EventListPage',
    menuCodes: ['EV_LIST'],
  },
  {
    path: '/marketing/event/regist',
    remote: 'adminMarketing',
    module: 'EventRegistPage',
    menuCodes: ['EV_CREATE'],
  },
  {
    path: '/marketing/event/detail/:eventId',
    remote: 'adminMarketing',
    module: 'EventDetailPage',
  },
]

export const remoteMenuCodes = remoteRoutes.flatMap((route) => route.menuCodes ?? [])
