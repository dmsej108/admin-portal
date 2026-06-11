import { memo, useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import type { SComponentBaseProps } from '@/types/base'
import { mainMenu, type LeafMenuItem } from '@/lib/config/menu'
import SHeader from './Header'
import SSidebar from './Sidebar'
import SNavigations from './Navigations'

export interface SContainerProps extends SComponentBaseProps {}

const Container = ({ className }: SContainerProps) => {
  // region [Hooks]
  const { pathname } = useLocation()
  // endregion

  // region [Styles]
  const rootClass = useMemo(() => {
    const clazz: string[] = ['wrapper']
    if (className) clazz.push(className)
    return clazz.join(' ')
  }, [className])
  // endregion

  // region [Privates]
  const activeMain = useMemo(
    () => mainMenu.find((m) => pathname.startsWith(m.basePath)),
    [pathname],
  )
  const subMenuItems = activeMain?.children ?? []

  const activeLeaf = useMemo(() => {
    const leafMenus = subMenuItems.flatMap((g) => g.children)
    return leafMenus
      .filter(
        (leaf) =>
          pathname === leaf.href || pathname.startsWith(`${leaf.href}/`),
      )
      .reduce<LeafMenuItem | undefined>(
        (best, leaf) =>
          !best || leaf.href.length > best.href.length ? leaf : best,
        undefined,
      )
  }, [pathname, subMenuItems])
  // endregion

  return (
    <div className={rootClass}>
      <SHeader />
      <SSidebar menuItems={subMenuItems} />
      <div className="container">
        <SNavigations activeMenu={activeLeaf} />
        <div className="contents">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

const SContainer = memo(Container)
SContainer.displayName = 'SContainer'

export default SContainer
