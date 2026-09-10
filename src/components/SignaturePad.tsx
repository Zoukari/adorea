'use client'
import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'

export interface SignaturePadRef {
  toDataURL: () => string
  isEmpty: () => boolean
  clear: () => void
}

interface Props {
  width?: number
  height?: number
  lineColor?: string
  bgColor?: string
}

const SignaturePad = forwardRef<SignaturePadRef, Props>(
  ({ width = 340, height = 140, lineColor = '#1A1A1A', bgColor = '#FFFFFF' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const drawing   = useRef(false)
    const empty     = useRef(true)

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      canvas.width  = width
      canvas.height = height
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)
      ctx.strokeStyle = lineColor
      ctx.lineWidth   = 1.5
      ctx.lineCap     = 'round'
      ctx.lineJoin    = 'round'
    }, [width, height, lineColor, bgColor])

    const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect()
      const src  = 'touches' in e ? e.touches[0] : e
      const scaleX = canvas.width  / rect.width
      const scaleY = canvas.height / rect.height
      return { x: (src.clientX - rect.left) * scaleX, y: (src.clientY - rect.top) * scaleY }
    }

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')!

      const start = (e: MouseEvent | TouchEvent) => {
        e.preventDefault()
        drawing.current = true; empty.current = false
        const pos = getPos(e, canvas)
        ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
      }
      const move = (e: MouseEvent | TouchEvent) => {
        e.preventDefault()
        if (!drawing.current) return
        const pos = getPos(e, canvas)
        ctx.lineTo(pos.x, pos.y); ctx.stroke()
      }
      const end = () => { drawing.current = false }

      canvas.addEventListener('mousedown',  start, { passive: false })
      canvas.addEventListener('mousemove',  move,  { passive: false })
      canvas.addEventListener('mouseup',    end)
      canvas.addEventListener('touchstart', start, { passive: false })
      canvas.addEventListener('touchmove',  move,  { passive: false })
      canvas.addEventListener('touchend',   end)
      return () => {
        canvas.removeEventListener('mousedown',  start)
        canvas.removeEventListener('mousemove',  move)
        canvas.removeEventListener('mouseup',    end)
        canvas.removeEventListener('touchstart', start)
        canvas.removeEventListener('touchmove',  move)
        canvas.removeEventListener('touchend',   end)
      }
    }, [])

    useImperativeHandle(ref, () => ({
      toDataURL: () => canvasRef.current?.toDataURL('image/png') || '',
      isEmpty:   () => empty.current,
      clear: () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        empty.current = true
      },
    }))

    return (
      <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%', height: height, display: 'block',
            border: '1.5px solid #EADCC8', borderRadius: 16,
            cursor: 'crosshair', touchAction: 'none',
            background: bgColor,
          }}
        />
        <button
          type="button"
          onClick={() => {
            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext('2d')!
            ctx.fillStyle = bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height)
            empty.current = true
          }}
          style={{
            position: 'absolute', bottom: 8, right: 8, background: 'transparent',
            border: '1px solid #EADCC8', borderRadius: 8, padding: '4px 10px',
            fontSize: 10, color: '#8A7A74', cursor: 'pointer', fontFamily: 'Manrope,sans-serif',
          }}
        >
          Effacer
        </button>
      </div>
    )
  }
)

SignaturePad.displayName = 'SignaturePad'
export default SignaturePad
