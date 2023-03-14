import { Box, Button, Link, buttonClasses, useTheme } from '@mui/material'
import { ChangeEvent, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { CustomTextField } from '../components'
import { updateUserId, updateUserIdTemp } from '../features/identitySlice'
import { error } from '../features/messageSlice'
import { update } from '../features/settingSlice'
import { useAppDispatch, useAppSelector } from '../store'
import { checkRoomId, checkUserId, useDebounce } from '../utils'
import { decodeToken } from '../api'
import Qiniu from '../qiniu.svg'

export default function SetupPage() {
  const theme = useTheme()
  const { userId } = useAppSelector((s) => s.identity)
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
          color="secondary"
          onClick={() => {
            targetRef.current = 'live'
          }}
        >
          直播房间
        </Button>
      </Box>
    </form>
  )

  return (
    <>
      <Box
        component="main"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: '1',
        }}
      >
        <img src={Qiniu} alt="logo" width={300} className="logo" />

        {!userId ? step1() : step2()}
      </Box>
    </>
  )
}
