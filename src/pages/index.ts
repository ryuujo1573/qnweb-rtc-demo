import Layout from './layout'
import SetupPage from './setup'
import RoomPage from './room'
import LiveRoomPage from './live'
import ErrorPage from './error'
import { createHashRouter } from 'react-router-dom'
import { createElement } from 'react'

const router = createHashRouter(
  [
    {
      path: '/',
      element: createElement(Layout),
      errorElement: createElement(ErrorPage),
      children: [
        {
          path: '',
          element: createElement(SetupPage),
        },
        {
          path: 'room/:roomId',
          element: createElement(RoomPage),
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
