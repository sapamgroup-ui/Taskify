import { useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function useBackHandler() {
  const navigate = useNavigate()
  const location = useLocation()
  const lastBackPress = useRef(0)
  const exitToastRef = useRef(null)

  const handleBack = useCallback(() => {
    const path = location.pathname
    if (path === '/' || path === '/login' || path === '/register') {
      const now = Date.now()
      if (now - lastBackPress.current < 2000) {
        if (exitToastRef.current) {
          clearTimeout(exitToastRef.current)
          exitToastRef.current = null
        }
        window.history.back()
        setTimeout(() => {
          try { window.close() } catch {}
        }, 100)
      } else {
        lastBackPress.current = now
        toast('Press back again to exit', {
          duration: 2000,
          icon: '👋',
          style: { borderRadius: '12px', background: '#1f2937', color: '#fff' }
        })
      }
    } else {
      navigate(-1)
    }
  }, [location.pathname, navigate])

  useEffect(() => {
    window.history.pushState({ page: location.pathname }, '', location.pathname)

    const onPopState = (e) => {
      e.preventDefault()
      handleBack()
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleBack()
      }
    }

    window.addEventListener('popstate', onPopState)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [handleBack, location.pathname])

  useEffect(() => {
    window.history.pushState({ page: location.pathname }, '', location.pathname)
  }, [location.pathname])
}
