import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      const dismissed = localStorage.getItem('taskify_install_dismissed')
      if (!dismissed) {
        setShowBanner(true)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
      localStorage.setItem('taskify_install_dismissed', 'true')
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('taskify_install_dismissed', 'true')
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-50">
      <div className="bg-primary-500 text-white rounded-2xl p-4 shadow-xl flex items-center gap-3 max-w-md mx-auto">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Download size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">Install Taskify</p>
          <p className="text-xs text-white/80">Add to your home screen for the best experience</p>
        </div>
        <button onClick={handleInstall} className="bg-white text-primary-500 font-bold text-xs px-4 py-2 rounded-xl flex-shrink-0 hover:bg-white/90 transition-all">
          Install
        </button>
        <button onClick={handleDismiss} className="text-white/60 hover:text-white p-1 flex-shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
