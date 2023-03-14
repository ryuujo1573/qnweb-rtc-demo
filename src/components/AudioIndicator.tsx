import { Slider, SliderProps, sliderClasses, styled } from '@mui/material'
import { QNLocalAudioTrack } from 'qnweb-rtc'
import { useEffect, useState } from 'react'

const AudioIndicator = styled(
  (
    props: SliderProps & {
      audioTrack: QNLocalAudioTrack
    }
  ) => {
    const { audioTrack, ...overrides } = props
    const [volumn, setCurrentVolumn] = useState(0)
    useEffect(() => {
      const timer = setInterval(() => {
        const v = audioTrack.getVolumeLevel()
        setCurrentVolumn(v ?? 0)
      })
      return () => {
        clearInterval(timer)
      }
    }, [])
    return <Slider {...overrides} value={volumn} max={1} disabled />
  }
)({
  [`& .${sliderClasses.thumb}`]: {
    width: 0,
  },
  [`& .${sliderClasses.track}`]: {
    border: 'none',
  },
})

export default AudioIndicator
