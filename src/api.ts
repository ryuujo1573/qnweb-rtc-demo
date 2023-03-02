import QNRTC from 'qnweb-rtc'
import { checkDevices } from './features/settingSlice'
import { store } from './store'

// expose global instance
export const client = QNRTC.createClient()
// define handler and set callback
const check = () => store.dispatch(checkDevices())

navigator.mediaDevices.ondevicechange = check
check()
