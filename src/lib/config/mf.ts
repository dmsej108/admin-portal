/** Host가 참조하는 Remote manifest URL */
export const MF_MANIFEST_URL =
  import.meta.env.VITE_MF_MANIFEST_URL ?? 'http://localhost:5174/mf-manifest.json'

/** manifest fetch용 promise remote external (vite federation) */
export function createManifestRemoteExternal(manifestUrl: string): string {
  const encodedUrl = JSON.stringify(manifestUrl)
  return [
    `fetch(${encodedUrl})`,
    '.then((response) => {',
    '  if (!response.ok) {',
    '    throw new Error(`Failed to load MF manifest: ${response.status}`)',
    '  }',
    '  return response.json()',
    '})',
    '.then((manifest) => manifest.remotes.adminMarketing.remoteEntry)',
  ].join('')
}
