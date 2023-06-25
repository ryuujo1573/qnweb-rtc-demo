import Layout from './layout'
import SetupPage from './setup'
import RoomPage from './room'
import LiveRoomPage from './live'
import ErrorPage from './error'
import { createBrowserRouter } from 'react-router-dom'
import { createElement } from 'react'

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: createElement(Layout),
      caseSensitive: true,
      errorElement: createElement(ErrorPage),
      children: [
        { index: true, element: createElement(SetupPage) },
        {
          path: 'room',
          children: [
            { index: true, element: createElement(RoomPage) },
            { path: ':roomId', element: createElement(RoomPage) },
          ],
        },
        {
          path: 'live/:liveId',
          element: createElement(LiveRoomPage),
        },
      ],
    },
  ],
  {
    basename: import.meta.env['BASE_URL'],
  },
)
export default router
export { Layout, SetupPage, RoomPage, LiveRoomPage, ErrorPage }
