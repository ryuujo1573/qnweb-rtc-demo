import type { AlertColor } from "@mui/material"
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface MessageState {
  current?: {
    message: string,
    severity?: AlertColor,
    autoHideDuration?: number,
    anchorOrigin?: { vertical: V, horizontal: H },
  }
}

const initialState: MessageState = {}

type V = ['top', 'bottom'][number]

type H = ['left', 'center', 'right'][number]

type MessageActionPayload = Exclude<MessageState['current'], undefined>

export const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    error(state, { payload }: PayloadAction<MessageActionPayload>) {
      state.current = {
        ...payload,
        severity: 'error',
      }
    },
    warning(state, { payload }: PayloadAction<MessageActionPayload>) {
      state.current = {
        ...payload,
        severity: 'warning',
      }
    },
    info(state, { payload }: PayloadAction<MessageActionPayload>) {
      state.current = state.current = {
        ...payload,
        severity: 'info',
      }
    },
    success(state, { payload }: PayloadAction<MessageActionPayload>) {
      state.current = state.current = {
        ...payload,
        severity: 'success',
      }
    },
    message(state, { payload }: PayloadAction<MessageActionPayload>) {
      state.current = state.current = {
        ...payload,
        severity: 'error',
      }
    },
    reset(state) {
      state.current = undefined
    }
  }
})

export default messageSlice.reducer
export const { error, warning, info, success, message, reset } = messageSlice.actions

// export function showMessage() {
// }