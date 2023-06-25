import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { App } from './app'
import { store } from './store'
import { checkDevices } from './features/settingSlice'
import debug from 'debug'
debug.enable('qnrtc:*')

import './index.css'

const root = document.getElementById('root')!
function isActiveNumberInput(
  t: Element | null,
): t is Element & { blur(): void } {
  return t != null && 'type' in t && t.type === 'number'
}
document.addEventListener('wheel', function (event) {
  if (isActiveNumberInput(document.activeElement)) {
    document.activeElement.blur()
  }
})
store.dispatch(checkDevices())
createRoot(root).render(
  <>
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  </>,
)
