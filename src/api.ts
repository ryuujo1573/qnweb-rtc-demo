import QNRTC, { QNConnectionDisconnectedInfo, QNConnectionState } from "qnweb-rtc"
import { success } from "./features/messageSlice"
import { updateState } from "./features/webrtcSlice"
import { store } from './store'

export const client = QNRTC.createClient()

// TODO: SDK auto typing.
const stateChangedHandler = (state: QNConnectionState, info?: QNConnectionDisconnectedInfo) => {
  store.dispatch(updateState(state))

  info && console.log('disconnected:', info)
}

client.addListener('connection-state-changed', stateChangedHandler)
store.dispatch(success({ message: 'loaded!' }))

// client.removeListener('connection-state-changed', stateChangedHandler)
