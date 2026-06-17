import { REMOTE_MODULES } from './remoteModules'

export interface RemoteRouteConfig {
  path: string
  remote: string
  module: string
  menuCodes?: string[]
}

/** URL → remote/module 매핑 (REMOTE_MODULES에서 파생) */
export const remoteRoutes: RemoteRouteConfig[] = REMOTE_MODULES.map(
  ({ path, remote, module, menuCodes }) => ({
    path,
    remote,
    module,
    menuCodes,
  }),
)

export const remoteMenuCodes = remoteRoutes.flatMap((route) => route.menuCodes ?? [])
