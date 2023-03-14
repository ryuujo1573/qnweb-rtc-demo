import QNRTC, {
  QNConnectionState as QState,
  QNConnectionDisconnectedInfo,
  QNRemoteTrack,
} from 'qnweb-rtc'
import { message } from './features/messageSlice'
import { checkDevices } from './features/settingSlice'
import {
  stateChanged,
  userJoined,
  userLeft,
  subscribe,
  unsubscribe,
} from './features/webrtcSlice'
import { store } from './store'

// expose global instance
export const client = QNRTC.createClient()
// define handler and set callback
const check = () => store.dispatch(checkDevices())

{
  navigator.mediaDevices.ondevicechange = check
  client.addListener(
    'connection-state-changed',
    (state: QState, info?: QNConnectionDisconnectedInfo) => {
      if (info && info.errorMessage) {
        store.dispatch(
          message({ message: 'disconnected:' + info.errorMessage })
        )
      }
      store.dispatch(stateChanged(state))
    }
  )
  client.addListener('user-joined', (userID: string, userData?: string) => {
    store.dispatch(
      userJoined({
        userID,
        userData,
        state: QState.CONNECTED,
        trackIds: [],
      })
    )
  })
  client.addListener('user-left', (userID: string) => {
    store.dispatch(userLeft(userID))
  })
  client.addListener(
    'user-published',
    async (uid: string, qntracks: QNRemoteTrack[]) => {
      store.dispatch(subscribe(qntracks))
    }
  )
  client.addListener(
    'user-unpublished',
    async (uid: string, qntracks: QNRemoteTrack[]) => {
      store.dispatch(unsubscribe(qntracks))
    }
  )
}

export function getRtmpUrl(path: string, serialNum?: string | number): string {
  const base = `rtmp://pili-publish.qnsdk.com/sdk-live/${path}`
  if (serialNum) {
    return base + `?serialnum=${serialNum}`
  }
  return base
}

const API_BASE = 'https://api-demo.qnsdk.com/v1/rtc'
export async function fetchToken({
  roomId,
  appId,
  userId,
}: {
  roomId: string
  appId: string
  userId: string
}) {
  const resp = await fetch(
    `${API_BASE}/token/admin/app/${appId}/room/${roomId}/user/${userId}?bundleId=demo-rtc.qnsdk.com`
  )
  return await resp.text()
}

export function decodeToken(token: string) {
  const jsonBase64 = token.split(':').pop()!
  try {
    const message: {
      appId: string
      expireAt: number
      permission: 'user' | 'admin'
      roomName: string
      userId: string
    } = JSON.parse(window.atob(jsonBase64))
    return message
  } catch {
    throw new Error('Token 值无效')
  }
}

export async function listUsers({
  appId,
  roomId,
}: {
  appId: string
  roomId: string
}): Promise<string[]> {
  const resp = await fetch(`${API_BASE}/users/app/${appId}/room/${roomId}`)
  return (await resp.json())['users'].map((v: { userId: string }) => v.userId)
}
