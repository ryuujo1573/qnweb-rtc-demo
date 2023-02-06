import { useMemo } from "react"
import { useAppDispatch, useAppSelector } from "../store"
import { changeTheme, selectTheme, ThemeCode } from "../features/settingSlice"
import { useTheme as useThemeVanilla } from "@mui/material"

export function useTheme() {
  const dispatch = useAppDispatch()
  const theme = useThemeVanilla()
  const themeCode = useAppSelector(selectTheme)

  return {
    ...theme,
    current: themeCode,
    change: function (mode: ThemeCode) {
      this.current = mode;
      console.log('mode:', mode);

      dispatch(changeTheme(mode));
    }
  }
}

export function debounce(fn: Function, interval: number) {
  let timeout = -1
  return (...args: any[]) => {
    if (timeout !== -1) {
      clearTimeout(timeout)
    }
    timeout = window.setTimeout(fn, interval, ...args)
  }
}

// export function useDebounce<T>(value: T, interval: number): T;

export const useDebounce = (fn: Function, interval: number) => useMemo(() => debounce(fn, interval), [interval])