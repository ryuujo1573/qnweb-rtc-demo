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
