export interface RemoteRegistryEntry {
  /** federation remote name (import 시 사용: adminMarketing/Page) */
  key: string
  /** remoteEntry URL 환경 변수 키 (.env / CI에서 설정) */
  remoteEntryEnvKey: string
  /** Remote 정적 CSS 경로 환경 변수 키 (GitHub Pages public 경로) */
  stylesPathEnvKey?: string
  /** false면 federation remotes에 등록하지 않음 */
  enabled?: boolean
}

/**
 * Remote registry — 새 repo(서비스) 추가 시 여기에 항목만 추가하면 됩니다.
 * 1. registry 항목 추가 (enabled: true)
 * 2. .env / deploy.yml에 remoteEntry URL 추가
 * 3. remoteModules.ts에 path + loader 1줄 추가 (pages/ 파일 추가 불필요)
 * 4. remote.d.ts에 module declare 추가 (타입용)
 */
export const REMOTE_REGISTRY: RemoteRegistryEntry[] = [
  {
    key: 'adminMarketing',
    remoteEntryEnvKey: 'NEXT_PUBLIC_MARKETING_REMOTE_ENTRY',
    stylesPathEnvKey: 'NEXT_PUBLIC_MARKETING_STYLES_PATH',
    enabled: true,
  },
  {
    key: 'adminPersonal',
    remoteEntryEnvKey: 'NEXT_PUBLIC_PERSONAL_REMOTE_ENTRY',
    enabled: false,
  },
  {
    key: 'adminCommon',
    remoteEntryEnvKey: 'NEXT_PUBLIC_COMMON_REMOTE_ENTRY',
    enabled: false,
  },
]

export function getEnabledRemotes(): RemoteRegistryEntry[] {
  return REMOTE_REGISTRY.filter((entry) => entry.enabled !== false)
}
