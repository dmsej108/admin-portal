import { memo, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import type { SComponentBaseProps } from '@/types/base'
import { mainMenu } from '@/lib/config/menu'
import { BASE_PATH } from '@/lib/config/site'

export interface SHeaderProps extends SComponentBaseProps {}

const Header = ({ className }: SHeaderProps) => {
  const router = useRouter()
  const pathname = router.asPath.split('?')[0]

  const activeKey = useMemo(
    () => mainMenu.find((m) => pathname.startsWith(m.basePath))?.key,
    [pathname],
  )

  const rootClass = useMemo(() => {
    const clazz: string[] = ['header_top']
    if (className) clazz.push(className)
    return clazz.join(' ')
  }, [className])

  const onLogoClick = useCallback(() => {
    router.push('/marketing/event')
  }, [router])

  const onMenuClick = useCallback(
    (basePath: string, firstHref?: string) => {
      router.push(firstHref ?? basePath)
    },
    [router],
  )

  return (
    <div className={rootClass}>
      <div className="logo" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
        <img
          src={`${BASE_PATH}/image/common/KB_s_kr3.jpg`}
          alt="logo"
          style={{ height: '40px', width: 'auto' }}
        />
      </div>
      <div className="utils">
        <nav className="menu">
          <ul>
            {mainMenu.map((item) => (
              <li
                key={item.key}
                className={activeKey === item.key ? 'active' : ''}
                onClick={() =>
                  onMenuClick(
                    item.basePath,
                    item.children[0]?.children[0]?.href,
                  )
                }
              >
                {item.label}
              </li>
            ))}
          </ul>
        </nav>
        <div className="user_info">
          <span className="account_name">계정명(관리자)</span>
          <span className="login_link">로그아웃</span>
        </div>
      </div>
    </div>
  )
}

const SHeader = memo(Header)
SHeader.displayName = 'SHeader'

export default SHeader
