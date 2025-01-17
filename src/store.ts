import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux'
import settings from './features/settingSlice'
import identity from './features/identitySlice'
import message from './features/messageSlice'
import room from './features/roomSlice'
import stream from './features/streamSlice'

export const store = configureStore({
  reducer: {
    settings,
    identity,
    message,
    room,
    stream,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
export type ThunkAPI = {
  dispatch: AppDispatch
  state: RootState
}
