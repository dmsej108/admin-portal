import type { Remotes } from '@originjs/vite-plugin-federation'
import {
  getEnabledRemotes,
  type RemoteRegistryEntry,
} from '../src/lib/config/mf.registry'

export function resolveManifestUrl(
  entry: RemoteRegistryEntry,
  env: Record<string, string>,
): string {
  const url = env[entry.manifestEnvKey]

  if (!url) {
    throw new Error(
      [
        `Missing ${entry.manifestEnvKey} for remote "${entry.key}".`,
        'Set manifest URL in .env.development, .env.production, or CI env.',
        'See .env.example',
      ].join(' '),
    )
  }

  return url
}

/** manifest fetch용 promise remote external (vite federation) */
export function createManifestRemoteExternal(
  manifestUrl: string,
  remoteKey: string,
): string {
  const encodedUrl = JSON.stringify(manifestUrl)
  const encodedKey = JSON.stringify(remoteKey)

  return [
    `fetch(${encodedUrl})`,
    '.then((response) => {',
    '  if (!response.ok) {',
    `    throw new Error('Failed to load MF manifest (${remoteKey}): ' + response.status);`,
    '  }',
    '  return response.json();',
    '})',
    '.then((manifest) => {',
    `  const remote = manifest.remotes[${encodedKey}];`,
    '  if (!remote || !remote.remoteEntry) {',
    `    throw new Error('remoteEntry not found in manifest for ${remoteKey}');`,
    '  }',
    '  return remote.remoteEntry;',
    '})',
  ].join('')
}

export function buildFederationRemotes(env: Record<string, string>): Remotes {
  return Object.fromEntries(
    getEnabledRemotes().map((entry) => [
      entry.key,
      {
        external: createManifestRemoteExternal(
          resolveManifestUrl(entry, env),
          entry.key,
        ),
        externalType: 'promise',
        format: 'esm',
        from: 'vite',
      },
    ]),
  )
}
