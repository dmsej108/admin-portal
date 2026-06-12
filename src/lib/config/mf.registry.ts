export interface RemoteRegistryEntry {
  /** federation remote name (import 시 사용: adminMarketing/Page) */
  key: string
  /** manifest URL 환경 변수 키 (.env / CI에서 설정) */
  manifestEnvKey: string
  /** false면 vite federation remotes에 등록하지 않음 */
  enabled?: boolean
}

/**
 * Remote registry — 새 repo 추가 시 여기에 항목만 추가하면 됩니다.
 * 1. registry 항목 추가 (enabled: true)
 * 2. .env.development / .env.production / deploy.yml에 manifest URL 추가
 * 3. remoteRoutes에 라우트 추가
 * 4. remoteModules에 lazy loader 추가
 * 5. remote.d.ts에 module declare 추가
 */
export const REMOTE_REGISTRY: RemoteRegistryEntry[] = [
  {
    key: 'adminMarketing',
    manifestEnvKey: 'VITE_MF_MARKETING_MANIFEST_URL',
    enabled: true,
  },
  {
    key: 'adminPersonal',
    manifestEnvKey: 'VITE_MF_PERSONAL_MANIFEST_URL',
    enabled: false,
  },
  {
    key: 'adminCommon',
    manifestEnvKey: 'VITE_MF_COMMON_MANIFEST_URL',
    enabled: false,
  },
]

export function getEnabledRemotes(): RemoteRegistryEntry[] {
  return REMOTE_REGISTRY.filter((entry) => entry.enabled !== false)
}
