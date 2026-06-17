/** Next.js는 process.env.NEXT_PUBLIC_* 정적 참조만 클라이언트 번들에 인라인함 */
const MARKETING_REMOTE_ENTRY = process.env.NEXT_PUBLIC_MARKETING_REMOTE_ENTRY ?? ''
const MARKETING_STYLES_PATH =
  process.env.NEXT_PUBLIC_MARKETING_STYLES_PATH ??
  (process.env.NODE_ENV === 'production' ? '/admin-marketing/styles/admin.css' : '/styles/admin.css')

function toAbsoluteStylesUrl(remoteEntry: string, stylesPath: string): string {
  if (!remoteEntry) {
    return stylesPath.startsWith('http') ? stylesPath : stylesPath
  }

  try {
    const origin = new URL(remoteEntry).origin
    const path = stylesPath.startsWith('/') ? stylesPath : `/${stylesPath}`
    return `${origin}${path}`
  } catch {
    return stylesPath
  }
}

export const REMOTE_STYLE_URLS: Record<string, string> = {
  adminMarketing: toAbsoluteStylesUrl(MARKETING_REMOTE_ENTRY, MARKETING_STYLES_PATH),
}
