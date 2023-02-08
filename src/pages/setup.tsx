import { Link, Typography, useTheme } from "@mui/material"
import QNRTC from "qnweb-rtc"
import { ChangeEvent, useState } from "react"
import { useNavigate } from 'react-router-dom'

import { CustomTextField } from "../components"
import { updateNickname } from "../features/identitySlice"
import { error } from "../features/messageSlice"
import { useAppDispatch, useAppSelector } from "../store"
import { checkNickname, checkRoomId, useDebounce } from "../utils"


export default function SetupPage() {
  const theme = useTheme()
  const { auth, nickname } = useAppSelector((s) => s.identity)
  const dispatch = useAppDispatch()

  const [connectById, setConnectById] = useState(true)

  const navigate = useNavigate()

  const textChangeHandler = useDebounce((event: ChangeEvent<HTMLInputElement>) => {
    const roomId = event.target.value

    if (roomId.length && !checkRoomId(roomId)) {
      console.error(event.target.value)
      // todo: debounce changes and show error tints
    }
  }, 1500)

  const [newNickname, setNickname] = useState<string>()

  const step1 = () => <form
    onSubmit={e => {
      e.preventDefault()
      if (newNickname && checkNickname(newNickname)) {
        dispatch(updateNickname(newNickname))
      } else {
        dispatch(error({ message: '昵称限制为2~24个字符' }))
      }
    }}
  >
    <CustomTextField key='nickname'
      placeholder={'请输入昵称'}
      name='roomid'
      value={newNickname}
      onChange={e => setNickname(e.target.value.trim())} />
    <Link variant='body2' href="#" sx={{
      display: 'block',
      textAlign: 'end',
      padding: 1
    }} onClick={() => dispatch(updateNickname('admin'))}>{'演示 admin 账号?'}</Link>
    <input type='submit' hidden />
  </form>

  const step2 = () => <form
    onSubmit={(e) => {
      e.preventDefault()
      const roomId = (e.currentTarget.elements.namedItem('roomid') as HTMLInputElement).value
      if (checkRoomId(roomId)) {
        navigate('/room/' + roomId)
      } else {
        dispatch(error({
          message: '房间名限制3~64个字符，并且只能包含字母、数字或下划线',
        }))
      }
    }}
  >
    <CustomTextField key='roomid'
      autoFocus
      placeholder={connectById ? '请输入房间名' : '请输入 roomToken'}
      name='roomid'
      onChange={textChangeHandler} />
    <Link variant='body2' href="#" underline='hover' sx={{
      display: 'block',
      textAlign: 'end',
      padding: 1
    }} onClick={() => setConnectById(!connectById)}>{connectById ? '使用 roomToken ?' : '使用房间名?'}</Link>
    <input type='submit' hidden />
  </form>
  return <><header>
    gone~
  </header>
    <main>
      <img src='/qiniu.svg' alt='logo' width={300} className='logo' />
      {auth ? step2() : step1()}
    </main>
    <footer>
      <Typography variant='body2' textAlign='center'>
        DEMO VERSION: <b color={theme.palette.secondary.main}>{import.meta.env.VITE_APP_VERSION}: {import.meta.env.VITE_APP_LATEST_COMMIT_HASH}</b>
        <br />
        SDK VERSION: <b color={theme.palette.secondary.main}>{QNRTC.VERSION}</b>
      </Typography>
    </footer>
  </>
}