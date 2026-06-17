import type { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import PlaceholderPage from '@/components/pages/PlaceholderPage'
import RemotePageLoader from '@/components/remote/RemotePageLoader'
import { REMOTE_MODULES } from '@/lib/config/remoteModules'
import { matchRemoteRoute, toStaticSlug } from '@/lib/utils/matchRemoteRoute'

export default function DynamicRemotePage() {
  const router = useRouter()
  const matched = matchRemoteRoute(router.asPath)

  if (!matched) {
    return <PlaceholderPage />
  }

  return <RemotePageLoader loader={matched.loader} remote={matched.remote} />
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = REMOTE_MODULES.map((entry) => {
    const slug = toStaticSlug(entry.path)
    return slug ? { params: { slug } } : null
  }).filter((path): path is { params: { slug: string[] } } => path !== null)

  return {
    paths,
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps = async () => ({
  props: {},
})
