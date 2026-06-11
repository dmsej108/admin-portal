import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import SContainer from '@/components/layout/Container'
import HomePage from '@/pages/HomePage'
import PlaceholderPage from '@/pages/PlaceholderPage'
import { mainMenu } from '@/lib/config/menu'

const EventListPage = lazy(() => import('adminMarketing/EventListPage'))
const EventRegistPage = lazy(() => import('adminMarketing/EventRegistPage'))
const EventDetailPage = lazy(() => import('adminMarketing/EventDetailPage'))

const leafRoutes = mainMenu
  .flatMap((main) => main.children.flatMap((sub) => sub.children))
  .filter((leaf) => !['EV_LIST', 'EV_CREATE'].includes(leaf.menuCode))

const remotePageFallback = <div>페이지를 불러오는 중...</div>

function App() {
  return (
    <Routes>
      <Route element={<SContainer />}>
        <Route index element={<Navigate to="/marketing/event" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route
          path="/marketing/event"
          element={
            <Suspense fallback={remotePageFallback}>
              <EventListPage />
            </Suspense>
          }
        />
        <Route
          path="/marketing/event/regist"
          element={
            <Suspense fallback={remotePageFallback}>
              <EventRegistPage />
            </Suspense>
          }
        />
        <Route
          path="/marketing/event/detail/:eventId"
          element={
            <Suspense fallback={remotePageFallback}>
              <EventDetailPage />
            </Suspense>
          }
        />
        {leafRoutes.map((leaf) => (
          <Route key={leaf.menuCode} path={leaf.href} element={<PlaceholderPage />} />
        ))}
        <Route path="*" element={<PlaceholderPage />} />
      </Route>
    </Routes>
  )
}

export default App
