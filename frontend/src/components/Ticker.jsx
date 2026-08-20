import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Ticker() {
  const [config, setConfig] = useState(null)

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const res = await axios.get('/api/analytics/ticker')
        if (res.data?.config?.items?.length > 0) {
          setConfig(res.data.config)
        }
      } catch {
        setConfig(null)
      }
    }
    fetchTicker()
  }, [])

  if (!config || !config.items || config.items.length === 0) return null

  const {
    items = [],
    bgColor = '#1a1a2e',
    textColor = '#ffffff',
    fontSize = '14px',
    fontFamily = 'Inter, system-ui, sans-serif',
    speed = '20s'
  } = config

  const tickerContent = items.map(item => {
    const emoji = item.emoji || '🔹'
    return `<span style="display:inline-flex;align-items:center;gap:8px;white-space:nowrap;padding:0 24px;">${emoji} <span>${item.text}</span></span>`
  }).join('')

  return (
    <div
      className="w-full overflow-hidden"
      style={{ backgroundColor: bgColor, height: '40px', display: 'flex', alignItems: 'center' }}
    >
      <div
        className="ticker-scroll"
        style={{
          display: 'flex',
          animation: `ticker ${speed} linear infinite`,
          whiteSpace: 'nowrap',
          fontSize,
          fontFamily,
          color: textColor,
          fontWeight: 500,
        }}
      >
        <span dangerouslySetInnerHTML={{ __html: tickerContent }} />
        <span dangerouslySetInnerHTML={{ __html: tickerContent }} />
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
