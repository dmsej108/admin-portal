import type { AppProps } from 'next/app'
import '@dmsej108/design-system/dist/index.css'
import '@/styles/reset.css'
import '@/styles/common.css'
import '@/styles/layout.css'
import ShellLayout from '@/components/layout/ShellLayout'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ShellLayout>
      <Component {...pageProps} />
    </ShellLayout>
  )
}
