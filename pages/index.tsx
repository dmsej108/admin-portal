import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/marketing/event')
  }, [router])

  return null
}
