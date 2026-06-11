import { memo } from 'react'
import { useLocation } from 'react-router-dom'

const PlaceholderPage = () => {
  const { pathname } = useLocation()

  return (
    <div>
      <p>페이지 준비 중입니다.</p>
      <p>
        현재 경로: <code>{pathname}</code>
      </p>
    </div>
  )
}

const SPlaceholderPage = memo(PlaceholderPage)
SPlaceholderPage.displayName = 'SPlaceholderPage'

export default SPlaceholderPage
