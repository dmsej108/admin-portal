import { memo } from 'react'

const HomePage = () => {
  return (
    <div>
      <p>관리자 포털에 오신 것을 환영합니다.</p>
      <p>상단 메뉴와 좌측 사이드바에서 원하는 메뉴를 선택하세요.</p>
    </div>
  )
}

const SHomePage = memo(HomePage)
SHomePage.displayName = 'SHomePage'

export default SHomePage
