import { QNLocalAudioTrack, QNRemoteAudioTrack } from 'qnweb-rtc'
import React, { memo, useCallback, useEffect, useRef, useState } from 'react'

export type AudioWaveProps = {
  track: QNLocalAudioTrack | QNRemoteAudioTrack
} & React.DetailedHTMLProps<
  React.CanvasHTMLAttributes<HTMLCanvasElement>,
  HTMLCanvasElement
>

const AudioWave = memo(({ track, ...canvasProps }: AudioWaveProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [context, setContext] = useState<CanvasRenderingContext2D>()
  // note: this defaults to set dimensions as positioning parent
  // e.g.  A parent with `position: relative`
  const [size, setSize] = useState<[width: number, height: number]>()

  const frameRequestCallback = useCallback(() => {
    if (!context) return
    const color = 'lightblue'
    const [width, height] = size!

    // 时域/频域
    const timeData = track.getCurrentTimeDomainData()
    // const freqData = this.props.stream.getCurrentFrequencyData();
    // console.log(timeData)
    if (!timeData) return

    context.fillStyle = color
    context.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    context.lineWidth = 2
    context.fillRect(0, 0, width, height)
    context.beginPath()
    for (let i = 0; i < width; i += 1) {
      const scale = 1
      const dataIndex = Math.round(i * (timeData.length / width))

      const data = Math.round(scale * timeData[dataIndex] * (height / 255.0))
      if (i === 0) {
        context.moveTo(i, data)
      } else {
        context.lineTo(i, data)
      }
    }
    context.stroke()
    requestAnimationFrame(frameRequestCallback)
  }, [context, size])

  useEffect(() => {
    if (canvasRef.current == null) return
    const canvas = canvasRef.current

    canvas.style.height = '100%'
    canvas.style.width = '100%'

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    setSize([canvas.width, canvas.height])
    setContext(canvasRef.current.getContext('2d')!)

    requestAnimationFrame(frameRequestCallback)
  }, [canvasRef.current])

  return <canvas ref={canvasRef} {...canvasProps} />
})

export default AudioWave
