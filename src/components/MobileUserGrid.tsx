import { Avatar, Box } from '@mui/material'
import { QNConnectionState } from 'qnweb-rtc'
import { Pagination } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'

import type { RemoteUser } from '../features/roomSlice'
import { stringToColor } from '../utils'

import 'swiper/css'
import 'swiper/css/pagination'

export default function MobileUserGrid2x2(props: { users: RemoteUser[] }) {
  const demo: RemoteUser[] = new Array(11).fill(0).map((_, i) => ({
    userID: `C${i}eeper`,
    state: QNConnectionState.CONNECTED,
    trackIds: [],
  }))

  const parts: RemoteUser[][] = []
  demo.forEach((_, i, array) => {
    const n = 4
    // truncate digits using bitwise ops
    const period = (i / n) >> 0
    if (i % n == 0) {
      parts.push(array.slice(period * n, period * n + n))
    }
  })

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
      }}
    >
      <Swiper pagination modules={[Pagination]}>
        {parts.map((page) => (
          <SwiperSlide>
            <Box
              sx={{
                display: 'grid',
                height: '100%',
                width: '100%',
                gap: '.2ch',
                grid: '1fr 1fr / 1fr 1fr',
              }}
            >
              {page.map((user, index, users) => {
                const color = stringToColor(user.userID) + '80'
                const bgcolor = stringToColor(user.userID)

                let gridArea = (() => {
                  switch (users.length) {
                    case 1:
                      return '1 / 1 / span 3 / span 3'
                    case 2:
                      return 'auto / 1 / auto / span 3'
                    case 3:
                      return 'auto'
                    default:
                      return 'auto'
                  }
                })()

                return (
                  <Box
                    key={user.userID}
                    sx={{
                      // flex: '1 1 40%',
                      display: 'flex',
                      border: 0.5,
                      gridArea,
                    }}
                  >
                    <Avatar
                      sx={{
                        margin: 'auto',
                        bgcolor,
                        color,
                        textTransform: 'uppercase',
                        '&>span': {
                          fontSize: '80%',
                          color: '#fff',
                          mixBlendMode: 'difference',
                        },
                      }}
                      children={<span>{user.userID.slice(0, 2)}</span>}
                    />
                  </Box>
                )
              })}
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  )
}
