import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import type { SComponentBaseProps } from '@/types/base'
import type { SubMenuItem } from '@/lib/config/menu'

export interface SSidebarProps extends SComponentBaseProps {
  menuItems: SubMenuItem[]
}

const Sidebar = ({ className, menuItems }: SSidebarProps) => {
  const router = useRouter()
  const pathname = router.asPath.split('?')[0]

  const getInitialOpen = useCallback(() => {
    const active = menuItems.find((m) => pathname.startsWith(m.basePath))
    return active ? active.key : (menuItems[0]?.key ?? null)
  }, [menuItems, pathname])

  const [openKey, setOpenKey] = useState<string | null>(getInitialOpen)

  const rootClass = useMemo(() => {
    const clazz: string[] = ['sidebar']
    if (className) clazz.push(className)
    return clazz.join(' ')
  }, [className])

  const findBestMatch = useCallback(
    (children: SubMenuItem['children']) =>
      children
        .filter(
          (leaf) =>
            pathname === leaf.href || pathname.startsWith(`${leaf.href}/`),
        )
        .reduce<(typeof children)[0] | null>(
          (best, leaf) =>
            !best || leaf.href.length > best.href.length ? leaf : best,
          null,
        ),
    [pathname],
  )

  const onToggleGroup = useCallback((key: string) => {
    setOpenKey((prev) => (prev === key ? null : key))
  }, [])

  const onLeafClick = useCallback(
    (href: string) => {
      router.push(href)
    },
    [router],
  )

  useEffect(() => {
    const active = menuItems.find((m) => pathname.startsWith(m.basePath))
    if (active) setOpenKey(active.key)
  }, [pathname, menuItems])

  return (
    <aside className={rootClass}>
      <nav>
        <ul className="sidebar_group_list">
          {menuItems.map((group) => {
            const isGroupActive = pathname.startsWith(group.basePath)
            const isOpen = openKey === group.key
            const bestMatch = findBestMatch(group.children)

            return (
              <li key={group.key} className="sidebar_group_item">
                <button
                  type="button"
                  className={`sidebar_group_btn${isGroupActive ? ' active' : ''}${isOpen ? ' open' : ''}`}
                  onClick={() => onToggleGroup(group.key)}
                >
                  {group.label}
                </button>
                {isOpen && (
                  <ul className="sidebar_leaf_list">
                    {group.children.map((leaf) => {
                      const isLeafActive = bestMatch?.menuCode === leaf.menuCode
                      return (
                        <li key={leaf.menuCode}>
                          <span
                            className={`sidebar_leaf_link${isLeafActive ? ' active' : ''}`}
                            onClick={() => onLeafClick(leaf.href)}
                            title={leaf.label}
                          >
                            {leaf.label}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

const SSidebar = memo(Sidebar)
SSidebar.displayName = 'SSidebar'

export default SSidebar
