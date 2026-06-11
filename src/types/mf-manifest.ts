export type MfRemoteManifestEntry = {
  name: string
  version: string
  remoteEntry: string
}

export type MfManifest = {
  schemaVersion: number
  generatedAt: string
  remotes: {
    adminMarketing: MfRemoteManifestEntry
  }
}
