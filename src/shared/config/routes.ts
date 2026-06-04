export const routes = {
  home: '/',
  search: '/search',
  settings: '/settings',
  showDetails: (showId: string) => `/shows/${showId}`,
  showEdit: (showId: string) => `/shows/${showId}/edit`,
  showCreate: '/shows/create',
}
