import { useRouter } from 'next/router'

export default function PlaceholderPage() {
  const router = useRouter()
  const pathname = router.asPath.split('?')[0]

  return (
    <div>
      <p>페이지 준비 중입니다.</p>
      <p>
        현재 경로: <code>{pathname}</code>
      </p>
    </div>
  )
}
