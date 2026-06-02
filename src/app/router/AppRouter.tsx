import { Navigate, Route, Routes } from 'react-router-dom'
import { lazy } from 'react'

import { routes } from '@/shared/config/routes'

const HomePage = lazy(() => import('@/pages/home/HomePage').then((module) => ({ default: module.HomePage })))
const SearchPage = lazy(() =>
  import('@/pages/search/SearchPage').then((module) => ({ default: module.SearchPage })),
)
const SettingsPage = lazy(() =>
  import('@/pages/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })),
)
const ShowDetailsPage = lazy(() =>
  import('@/pages/show-details/ShowDetailsPage').then((module) => ({
    default: module.ShowDetailsPage,
  })),
)
const ShowEditPage = lazy(() =>
  import('@/features/show-edit/ShowEditPage').then((module) => ({
    default: module.ShowEditPage,
  })),
)

export function AppRouter() {
  return (
    <Routes>
      <Route path={routes.home} element={<HomePage />} />
      <Route path={routes.search} element={<SearchPage />} />
      <Route path={routes.settings} element={<SettingsPage />} />
      <Route path="/shows/:showId" element={<ShowDetailsPage />} />
      <Route path="/shows/:showId/edit" element={<ShowEditPage />} />
      <Route path="*" element={<Navigate to={routes.home} replace />} />
    </Routes>
  )
}
