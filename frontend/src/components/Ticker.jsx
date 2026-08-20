import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function Ticker() {
  const [config, setConfig] = useState(null)
  const [paused, setPaused] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const res = await axios.get('/api/analytics/ticker')
        if (res.data?.data) setConfig(res.data.data)
      } catch { setConfig(null) }
    }
    fetchTicker()
  }, [])

  if (!config || !config.enabled || !config.items || config.items.length === 0) return null

  const {
    items = [],
    bgColor = '#1a1a2e',
    textColor = '#ffffff',
    fontSize = '14px',
    fontFamily = 'Inter, system-ui, sans-serif',
    speed = 'normal',
    direction = 'rtl',
    gap = 30,
    showDividers = true,
    dividerStyle = '|',
    pauseOnHover = false,
    textShadow = false,
    borderColor = '',
    borderWidth = 0,
    borderRadius = 0,
    padding = 'medium',
    label = 'NOW BUZZING',
    labelBg = '#e94560',
    labelColor = '#ffffff'
  } = config

  const speedMap = { slow: '40s', normal: '25s', fast: '15s' }
  const animSpeed = speedMap[speed] || '25s'
  const paddingMap = { small: '8px 16px', medium: '10px 20px', large: '14px 28px' }
  const itemPadding = paddingMap[padding] || '10px 20px'

  const renderItems = () => {
    return items.map((item, idx) => {
      const itemStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        padding: item.padding || itemPadding,
        gap: '8px',
        color: item.textColor || textColor,
        fontWeight: item.fontWeight || 'normal',
        fontStyle: item.fontStyle || 'normal',
        textDecoration: item.textDecoration || 'none',
        fontSize: item.fontSize || fontSize,
        fontFamily: item.fontFamily || fontFamily,
        backgroundColor: item.bgColor || 'transparent',
        borderRadius: item.borderRadius || '0',
        border: item.borderColor ? `1px solid ${item.borderColor}` : 'none',
        ...(textShadow ? { textShadow: '0 1px 3px rgba(0,0,0,0.4)' } : {})
      }
      return (
        <span key={item.id || idx} style={itemStyle}>
          {item.html ? <span dangerouslySetInnerHTML={{ __html: item.html }} /> : item.text}
          {showDividers && idx < items.length - 1 && (
            <span style={{ opacity: 0.5, margin: '0 4px', color: textColor }}>{dividerStyle}</span>
          )}
        </span>
      )
    })
  }

  const animDir = direction === 'ltr' ? 'reverse' : 'normal'

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        backgroundColor: bgColor,
        height: 'auto',
        minHeight: '40px',
        display: 'flex',
        alignItems: 'center',
        borderTop: borderWidth ? `${borderWidth}px solid ${borderColor || 'transparent'}` : 'none',
        borderBottom: borderWidth ? `${borderWidth}px solid ${borderColor || 'transparent'}` : 'none',
        borderRadius: borderRadius ? `${borderRadius}px` : '0'
      }}
      onMouseEnter={() => pauseOnHover && setPaused(true)}
      onMouseLeave={() => pauseOnHover && setPaused(false)}
    >
      {label && (
        <div style={{ backgroundColor: labelBg, color: labelColor, padding: '8px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {label}
        </div>
      )}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          animation: `ticker-scroll ${animSpeed} linear infinite ${animDir}`,
          animationPlayState: paused ? 'paused' : 'running',
          whiteSpace: 'nowrap',
          fontSize,
          fontFamily,
          color: textColor,
          fontWeight: 500,
          gap: `${gap}px`,
          paddingLeft: '16px'
        }}
      >
        <span style={{ display: 'flex', gap: `${gap}px`, paddingRight: `${gap}px` }}>{renderItems()}</span>
        <span style={{ display: 'flex', gap: `${gap}px`, paddingRight: `${gap}px` }}>{renderItems()}</span>
      </div>
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
