'use client'
import { useState, useCallback, useEffect } from 'react'

interface Toast { id: string; message: string; type: 'success' | 'error' | 'info' }

let toastFn: ((msg: string, type?: Toast['type']) => void) | null = null

export function toast(message: string, type: Toast['type'] = 'info') {
  toastFn?.(message, type)
}

export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const add = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  useEffect(() => { toastFn = add; return () => { toastFn = null } }, [add])

  const BG = { success: '#4CAF50', error: '#F44336', info: '#1A1A1A' }

  return (
    <div style={{ position:'fixed', bottom:100, right:24, zIndex:1000, display:'flex', flexDirection:'column', gap:8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: BG[t.type], color:'white', padding:'12px 20px', borderRadius:16,
          fontSize:13, fontWeight:500, fontFamily:'Manrope,sans-serif',
          boxShadow:'0 4px 20px rgba(0,0,0,0.2)',
          animation:'toastIn 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
          maxWidth:300,
        }}>
          {t.message}
        </div>
      ))}
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </div>
  )
}
