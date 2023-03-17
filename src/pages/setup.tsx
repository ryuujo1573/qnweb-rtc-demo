import {
  Avatar,
  Box,
  Button,
  Collapse,
  IconButton,
  Link,
  buttonClasses,
  colors,
  useTheme,
} from '@mui/material'
import { ChangeEvent, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { CustomTextField } from '../components'
import { updateUserId, updateUserIdTemp } from '../features/identitySlice'
import { error } from '../features/messageSlice'
import { changeColor, update } from '../features/settingSlice'
import { useAppDispatch, useAppSelector } from '../store'
import { checkRoomId, checkUserId, useDebounce } from '../utils'
import { decodeToken } from '../api'
import Qiniu from '../qiniu.svg'
import { useTopRightBox } from './layout'
import { createPortal } from 'react-dom'
import { CircleRounded } from '@mui/icons-material'

export default function SetupPage() {
  const theme = useTheme()
  const { userId } = useAppSelector((s) => s.identity)
  const { primaryColor } = useAppSelector((s) => s.settings)
  const dispatch = useAppDispatch()

  const [connectById, setConnectById] = useState(true)

  const navigate = useNavigate()

  const [roomInputValue, setRoomInputValue] = useState('')
  const [newUserId, setNewUserId] = useState('')
  const targetRef = useRef('room')

  const step1 = () => (
    <form
      id="nickname"
      onSubmit={(e) => {
        e.preventDefault()
        if (newUserId && checkUserId(newUserId)) {
          dispatch(updateUserId(newUserId))
        } else {
          dispatch(error({ message: '昵称限制为2~24个字符' }))
        }
      }}
    >
      <CustomTextField
        placeholder={'请输入昵称'}
        name="roomid"
        value={newUserId}
        onChange={(e) => setNewUserId(e.target.value.trim())}
      />
      <Link
        variant="body2"
        href="#"
        sx={{
          display: 'block',
          textAlign: 'end',
          padding: 1,
        }}
        onClick={() => dispatch(updateUserId('admin'))}
      >
        {'演示 admin 账号?'}
      </Link>
      <input type="submit" hidden />
    </form>
  )

  const step2 = () => (
    <form
      id="roomid"
      onSubmit={(e) => {
        e.preventDefault()
        const target = targetRef.current

        if (connectById) {
          const roomId = roomInputValue
          if (checkRoomId(roomId)) {
            // dispatch(fetchDeviceInfo())
            navigate(`/${target}/${roomId}`)
          } else {
            dispatch(
              error({
                message: '房间名限制3~64个字符，并且只能包含字母、数字或下划线',
              })
            )
          }
        } else {
          const roomToken = roomInputValue
          try {
            const { appId, userId, roomName } = decodeToken(roomToken)

            dispatch(update({ appId }))
            dispatch(updateUserIdTemp(userId))

            navigate(`/${target}/${roomName}`, {
              state: roomToken,
            })
          } catch {
            // debugger
            dispatch(error({ message: 'Token 值无效' }))
          }
        }
      }}
    >
      <CustomTextField
        autoFocus
        placeholder={connectById ? '请输入房间名' : '请输入 roomToken'}
        value={roomInputValue}
        onChange={(evt) => setRoomInputValue(evt.target.value)}
      />
      <Link
        variant="body2"
        href="#"
        underline="hover"
        sx={{
          display: 'block',
          textAlign: 'end',
          padding: 1,
        }}
        onClick={() => setConnectById(!connectById)}
      >
        {connectById ? '使用 roomToken ?' : '使用房间名?'}
      </Link>
      <input type="submit" hidden />
      <Box
        sx={{
          [`& > .${buttonClasses.root}`]: {
            fontSize: 16,
            padding: '14px',
            borderRadius: '114514px',
            color: theme.palette.text.primary,
            my: 1,
            fontWeight: 700,
          },
        }}
      >
        <Button fullWidth variant="contained" type="submit">
          会议房间
        </Button>
        <Button
          fullWidth
          variant="contained"
          type="submit"
          onClick={() => {
            targetRef.current = 'live'
          }}
        >
          直播房间
        </Button>
      </Box>
    </form>
  )

  const cornerBox = useTopRightBox()

  return (
    <>
      {cornerBox.current &&
        createPortal(
          <Box display="flex">
            <Collapse orientation="horizontal" in>
              {(
                [
                  'red',
                  'pink',
                  'purple',
                  'deepPurple',
                  'indigo',
                  'blue',
                  'lightBlue',
                  'cyan',
                  'teal',
                  'green',
                  'lightGreen',
                  'lime',
                  'yellow',
                  'amber',
                  'orange',
                  'deepOrange',
                  'brown',
                  'grey',
                  'blueGrey',
                ] as const satisfies readonly (keyof typeof colors)[]
              ).map((name) => {
                return (
                  <IconButton
                    key={name}
                    onClick={() => {
                      dispatch(changeColor(name))
                    }}
                  >
                    <CircleRounded
                      sx={{
                        color: colors[name].A200,
                      }}
                    />
                  </IconButton>
                )
              })}
            </Collapse>
          </Box>,
          cornerBox.current
        )}
      <Box
        component="main"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <Box
          sx={{
            width: '300px',
            height: '85px',
            bgcolor: theme.palette.primary.main,
            WebkitMaskImage: 'url(src/qiniu.svg)',
          }}
          className="logo"
        />

        {!userId ? step1() : step2()}
      </Box>
    </>
  )
}
