import { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import SContainer from '@/components/layout/Container'
import HomePage from '@/pages/HomePage'
import PlaceholderPage from '@/pages/PlaceholderPage'
import { mainMenu } from '@/lib/config/menu'
import { getRemoteLazyComponent } from '@/lib/config/remoteModules'
import { remoteMenuCodes, remoteRoutes } from '@/lib/config/remoteRoutes'

const leafRoutes = mainMenu
  .flatMap((main) => main.children.flatMap((sub) => sub.children))
  .filter((leaf) => !remoteMenuCodes.includes(leaf.menuCode))

const remotePageFallback = <div>페이지를 불러오는 중...</div>

function App() {
  return (
    <Routes>
      <Route element={<SContainer />}>
        <Route index element={<Navigate to="/marketing/event" replace />} />
        <Route path="/home" element={<HomePage />} />
        {remoteRoutes.map(({ path, remote, module }) => {
          const RemotePage = getRemoteLazyComponent(remote, module)
          return (
            <Route
              key={`${remote}/${module}`}
              path={path}
              element={
                <Suspense fallback={remotePageFallback}>
                  <RemotePage />
                </Suspense>
              }
            />
          )
        })}
        {leafRoutes.map((leaf) => (
          <Route key={leaf.menuCode} path={leaf.href} element={<PlaceholderPage />} />
        ))}
        <Route path="*" element={<PlaceholderPage />} />
      </Route>
    </Routes>
  )
}

export default App
