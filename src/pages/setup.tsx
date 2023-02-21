import { Box, Link, useTheme } from '@mui/material'
import { ChangeEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { CustomTextField } from '../components'
import { updateUserId } from '../features/identitySlice'
import { error } from '../features/messageSlice'
import { useAppDispatch, useAppSelector } from '../store'
import { checkUserId, checkRoomId, useDebounce } from '../utils'

export default function SetupPage() {
  const theme = useTheme()
  const { auth, userId: nickname } = useAppSelector((s) => s.identity)
  const dispatch = useAppDispatch()

  const [connectById, setConnectById] = useState(true)

  const navigate = useNavigate()

  const textChangeHandler = useDebounce(
    (event: ChangeEvent<HTMLInputElement>) => {
      const roomId = event.target.value

      if (roomId.length && !checkRoomId(roomId)) {
        console.error(event.target.value)
        // todo: debounce changes and show error tints
      }
    },
    1500
  )

  const [newUserId, setNewUserId] = useState('')

  const step1 = () => (
    <form
      key="nickname"
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
      key="roomid"
      onSubmit={(e) => {
        e.preventDefault()
        const roomId = (
          e.currentTarget.elements.namedItem('roomid') as HTMLInputElement
        ).value
        if (checkRoomId(roomId)) {
          // dispatch(fetchDeviceInfo())
          navigate('/room/' + roomId)
        } else {
          dispatch(
            error({
              message: '房间名限制3~64个字符，并且只能包含字母、数字或下划线',
            })
          )
        }
      }}
    >
      <CustomTextField
        autoFocus
        placeholder={connectById ? '请输入房间名' : '请输入 roomToken'}
        name="roomid"
        onChange={textChangeHandler}
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
        <img src="qiniu.svg" alt="logo" width={300} className="logo" />
        {auth && nickname ? step2() : step1()}
      </Box>
    </>
  )
}
