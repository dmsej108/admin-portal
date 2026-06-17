import { NextFederationPlugin } from '@module-federation/nextjs-mf'

const isProd = process.env.NODE_ENV === 'production'
const basePath = isProd ? (process.env.NEXT_PUBLIC_BASE_PATH ?? '') : ''

const REMOTE_REGISTRY = [
  {
    key: 'adminMarketing',
    remoteEntryEnvKey: 'NEXT_PUBLIC_MARKETING_REMOTE_ENTRY',
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

const DEV_REMOTE_DEFAULTS = {
  adminMarketing: 'http://localhost:3001/_next/static/chunks/remoteEntry.js',
}

function buildFederationRemotes(isServer) {
  const location = isServer ? 'ssr' : 'chunks'
  const remotes = {}

  for (const entry of REMOTE_REGISTRY) {
    if (entry.enabled === false) continue

    const envUrl = process.env[entry.remoteEntryEnvKey]
    const devDefault = DEV_REMOTE_DEFAULTS[entry.key]
    const baseUrl = envUrl ?? (process.env.NODE_ENV === 'production' ? undefined : devDefault)

    if (!baseUrl) continue

    const remoteEntry = baseUrl.includes('/chunks/')
      ? baseUrl.replace('/chunks/', `/${location}/`)
      : baseUrl

    remotes[entry.key] = `${entry.key}@${remoteEntry}`
  }

  return remotes
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  ...(basePath && { basePath, assetPrefix: basePath }),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  webpack(config, options) {
    const remotes = buildFederationRemotes(options.isServer)

    config.plugins.push(
      new NextFederationPlugin({
        name: 'adminPortal',
        filename: 'static/chunks/remoteEntry.js',
        dts: false,
        remotes,
        shared: {},
        extraOptions: {
          exposePages: true,
        },
      }),
    )

    return config
  },
}

export default nextConfig
