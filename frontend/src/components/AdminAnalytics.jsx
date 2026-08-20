import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { BarChart3, TrendingUp, Eye, Loader2, Plus, Trash2, Save, Copy, Play, Pause, Square, ToggleLeft, ToggleRight, Bold, Italic, Underline, Type, Palette, Settings, ChevronDown } from 'lucide-react'

const EMOJIS = ['🔥','⭐','💰','🎉','🚀','💎','✅','📌','🎯','🏆','⚡','🌟','💼','📊','🆕','🔻','📣','💎','🔴','🟡','🟢','🔵','🟣','❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','❣️','💕','💞','💓','💗','💖','💘','💝']

const STYLE_PRESETS = {
  none: {},
  breaking: { bgColor: '#dc2626', textColor: '#ffffff', fontWeight: 'bold', borderRadius: '4px' },
  alert: { bgColor: '#f59e0b', textColor: '#000000', fontWeight: 'bold', borderRadius: '4px' },
  highlight: { bgColor: '#3b82f6', textColor: '#ffffff', fontWeight: 'bold', borderRadius: '4px' },
  sports: { bgColor: '#16a34a', textColor: '#ffffff', fontWeight: 'bold', borderRadius: '4px' },
  event: { bgColor: '#9333ea', textColor: '#ffffff', fontWeight: 'bold', borderRadius: '4px' },
  localbuzz: { bgColor: '#0891b2', textColor: '#ffffff', fontWeight: 'bold', borderRadius: '4px' },
}

const FONT_OPTIONS = ['Inter', 'Arial', 'Georgia', 'Verdana', 'Courier New', 'Poppins', 'Roboto', 'Montserrat']
const SPEED_OPTIONS = [{ label: 'Slow', value: 'slow' }, { label: 'Normal', value: 'normal' }, { label: 'Fast', value: 'fast' }]
const DIR_OPTIONS = [{ label: 'Right to Left', value: 'rtl' }, { label: 'Left to Right', value: 'ltr' }]
const PADDING_OPTIONS = [{ label: 'Small (8px)', value: 'small' }, { label: 'Medium (14px)', value: 'medium' }, { label: 'Large (20px)', value: 'large' }]
const DIVIDER_OPTIONS = ['|', '•', '—', '/', '·', '|']

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div onClick={() => onChange(!checked)} className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'}`}>
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`}></div>
      </div>
      <span className="text-sm text-gray-700 font-medium">{label}</span>
    </label>
  )
}

export default function AdminAnalytics() {
  const [tab, setTab] = useState('analytics')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Ticker state
  const [ticker, setTicker] = useState({
    enabled: false, items: [], bgColor: '#1a1a2e', textColor: '#ffffff', fontSize: '14px',
    fontFamily: 'Inter, system-ui, sans-serif', speed: 'normal', direction: 'rtl', gap: 30,
    seamlessLoop: true, showDividers: true, dividerStyle: '|', pauseOnHover: false, textShadow: false,
    borderColor: '', borderWidth: 0, borderRadius: 0, padding: 'medium',
    label: 'NOW BUZZING', labelBg: '#e94560', labelColor: '#ffffff'
  })
  const [selectedItemIdx, setSelectedItemIdx] = useState(-1)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [editField, setEditField] = useState('')
  const previewRef = useRef(null)
  const [previewPaused, setPreviewPaused] = useState(false)

  useEffect(() => { fetchStats(); fetchTicker() }, [])

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/analytics/dashboard')
      setStats(res.data?.data || res.data)
    } catch {} finally { setLoading(false) }
  }

  const fetchTicker = async () => {
    try {
      const res = await axios.get('/api/analytics/ticker')
      if (res.data?.data) setTicker(res.data.data)
    } catch {}
  }

  const saveTicker = async () => {
    setSaving(true)
    try {
      await axios.put('/api/analytics/ticker', ticker)
      toast.success('Ticker saved and published!')
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const addItem = () => {
    const newItem = { id: Date.now().toString(36), text: 'New announcement', html: 'New announcement', bgColor: '', textColor: '', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', fontSize: '', fontFamily: '', padding: '', borderRadius: '', borderColor: '', borderWidth: 0 }
    setTicker({ ...ticker, items: [...ticker.items, newItem] })
    setSelectedItemIdx(ticker.items.length)
  }

  const duplicateItem = (idx) => {
    const copy = { ...ticker.items[idx], id: Date.now().toString(36) }
    const items = [...ticker.items]
    items.splice(idx + 1, 0, copy)
    setTicker({ ...ticker, items })
    setSelectedItemIdx(idx + 1)
  }

  const removeItem = (idx) => {
    const items = ticker.items.filter((_, i) => i !== idx)
    setTicker({ ...ticker, items })
    if (selectedItemIdx >= items.length) setSelectedItemIdx(items.length - 1)
  }

  const updateItem = (idx, field, value) => {
    const items = [...ticker.items]
    items[idx] = { ...items[idx], [field]: value }
    setTicker({ ...ticker, items })
  }

  const applyPreset = (preset) => {
    const style = STYLE_PRESETS[preset]
    if (selectedItemIdx >= 0 && ticker.items[selectedItemIdx]) {
      updateItem(selectedItemIdx, 'bgColor', style.bgColor || '')
      updateItem(selectedItemIdx, 'textColor', style.textColor || '')
      updateItem(selectedItemIdx, 'fontWeight', style.fontWeight || 'normal')
      updateItem(selectedItemIdx, 'borderRadius', style.borderRadius || '')
    }
  }

  const insertEmoji = (emoji) => {
    if (selectedItemIdx >= 0 && ticker.items[selectedItemIdx]) {
      const item = ticker.items[selectedItemIdx]
      const newText = (item.text || '') + emoji
      updateItem(selectedItemIdx, 'text', newText)
      updateItem(selectedItemIdx, 'html', newText)
    }
    setShowEmojiPicker(false)
  }

  const updateItemStyle = (field, value) => {
    if (selectedItemIdx >= 0 && ticker.items[selectedItemIdx]) {
      updateItem(selectedItemIdx, field, value)
    }
  }

  const selectedItem = selectedItemIdx >= 0 ? ticker.items[selectedItemIdx] : null
  const itemBg = selectedItem?.bgColor || ticker.bgColor
  const itemColor = selectedItem?.textColor || ticker.textColor

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-primary-500" /></div>

  return (
    <div className="space-y-6">
      {/* Tab Switch */}
      <div className="flex gap-2 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('analytics')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${tab === 'analytics' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}><BarChart3 size={14} className="inline mr-1" /> Analytics</button>
        <button onClick={() => setTab('ticker')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${tab === 'ticker' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}><Type size={14} className="inline mr-1" /> Ticker Tape</button>
      </div>

      {/* ============ ANALYTICS TAB ============ */}
      {tab === 'analytics' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Total Events</p>
              <p className="text-2xl font-extrabold text-gray-900">{stats.totalEvents || 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Categories Tracked</p>
              <p className="text-2xl font-extrabold text-gray-900">{stats.eventsByCategory ? Object.keys(stats.eventsByCategory).length : 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Page Views (7d)</p>
              <p className="text-2xl font-extrabold text-gray-900">{stats.eventsByDate ? Object.values(stats.eventsByDate).reduce((a, b) => a + b, 0) : 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Top Category</p>
              <p className="text-2xl font-extrabold text-primary-600">{stats.popularCategories?.[0]?.name || '—'}</p>
            </div>
          </div>
          {stats.popularCategories?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><TrendingUp size={16} /> Popular Categories</h4>
              <div className="space-y-2">
                {stats.popularCategories.map((cat) => {
                  const max = stats.popularCategories[0]?.count || 1
                  return (
                    <div key={cat.name} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-24 truncate">{cat.name}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden"><div className="bg-primary-500 h-full rounded-full" style={{ width: `${(cat.count / max) * 100}%` }}></div></div>
                      <span className="text-xs font-bold text-gray-700 w-10 text-right">{cat.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {stats.recentEvents?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Eye size={16} /> Recent Events</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-gray-500 border-b"><th className="pb-2 font-medium">Event</th><th className="pb-2 font-medium">Category</th><th className="pb-2 font-medium">Time</th></tr></thead>
                  <tbody>
                    {stats.recentEvents.slice(0, 20).map((ev, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2 text-gray-900 font-medium">{ev.event}</td>
                        <td className="py-2 text-gray-500">{ev.category || '—'}</td>
                        <td className="py-2 text-gray-400 text-xs">{ev.timestamp ? new Date(ev.timestamp).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ TICKER EDITOR TAB ============ */}
      {tab === 'ticker' && (
        <div className="space-y-5">
          {/* Enable Toggle + Save */}
          <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4">
            <Toggle checked={ticker.enabled} onChange={(v) => setTicker({ ...ticker, enabled: v })} label={ticker.enabled ? 'Ticker is LIVE on website' : 'Ticker is hidden from website'} />
            <button onClick={saveTicker} disabled={saving} className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 shadow-sm">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save & Publish
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* LEFT: Items + Settings */}
            <div className="space-y-4">
              {/* Items List */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-sm">Ticker Tape Items ({ticker.items.length})</h3>
                </div>
                <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto">
                  {ticker.items.map((item, idx) => (
                    <div key={item.id || idx} onClick={() => setSelectedItemIdx(idx)} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-sm ${selectedItemIdx === idx ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50 hover:bg-gray-100 border border-transparent'}`}>
                      <span className="w-5 text-xs text-gray-400 font-bold">{idx + 1}</span>
                      <span className="flex-1 truncate text-gray-700">{item.text}</span>
                      <button onClick={(e) => { e.stopPropagation(); duplicateItem(idx) }} className="text-gray-400 hover:text-blue-500 p-0.5"><Copy size={12} /></button>
                      <button onClick={(e) => { e.stopPropagation(); removeItem(idx) }} className="text-gray-400 hover:text-red-500 p-0.5"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={addItem} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"><Plus size={12} /> Add Item</button>
                  <button onClick={() => duplicateItem(Math.max(0, ticker.items.length - 1))} disabled={ticker.items.length === 0} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-40"><Copy size={12} /> Duplicate</button>
                </div>
              </div>

              {/* Ticker Settings */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-1"><Settings size={14} /> Ticker Settings</h3>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Speed</label>
                    <select value={ticker.speed} onChange={(e) => setTicker({ ...ticker, speed: e.target.value })} className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500">
                      {SPEED_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Direction</label>
                    <select value={ticker.direction} onChange={(e) => setTicker({ ...ticker, direction: e.target.value })} className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500">
                      {DIR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Gap (px)</label>
                    <input type="number" value={ticker.gap} onChange={(e) => setTicker({ ...ticker, gap: Number(e.target.value) })} className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Toggle checked={ticker.seamlessLoop} onChange={(v) => setTicker({ ...ticker, seamlessLoop: v })} label="Seamless Loop (Endless)" />
                  <Toggle checked={ticker.pauseOnHover} onChange={(v) => setTicker({ ...ticker, pauseOnHover: v })} label="Pause on Hover" />
                  <Toggle checked={ticker.showDividers} onChange={(v) => setTicker({ ...ticker, showDividers: v })} label="Show Dividers" />
                  <Toggle checked={ticker.textShadow} onChange={(v) => setTicker({ ...ticker, textShadow: v })} label="Text Shadow" />
                </div>
                {ticker.showDividers && (
                  <div className="mt-2">
                    <label className="text-[10px] text-gray-500 mb-1 block">Divider Style</label>
                    <div className="flex gap-1">
                      {DIVIDER_OPTIONS.map(d => (
                        <button key={d} onClick={() => setTicker({ ...ticker, dividerStyle: d })} className={`w-8 h-8 rounded border text-sm font-bold ${ticker.dividerStyle === d ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{d}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Label Settings */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="font-bold text-gray-900 text-sm mb-3">Label (Left Badge)</h3>
                <input type="text" value={ticker.label} onChange={(e) => setTicker({ ...ticker, label: e.target.value })} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg mb-2 focus:ring-1 focus:ring-primary-500" placeholder="NOW BUZZING" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Label BG</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={ticker.labelBg} onChange={(e) => setTicker({ ...ticker, labelBg: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                      <input type="text" value={ticker.labelBg} onChange={(e) => setTicker({ ...ticker, labelBg: e.target.value })} className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Label Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={ticker.labelColor} onChange={(e) => setTicker({ ...ticker, labelColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                      <input type="text" value={ticker.labelColor} onChange={(e) => setTicker({ ...ticker, labelColor: e.target.value })} className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MIDDLE: Item Editor + Preview */}
            <div className="space-y-4">
              {/* Live Preview */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-sm">Live Preview (Endless Loop)</h3>
                  <div className="flex gap-1">
                    <button onClick={() => setPreviewPaused(false)} className={`p-1.5 rounded ${!previewPaused ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}><Play size={14} /></button>
                    <button onClick={() => setPreviewPaused(true)} className={`p-1.5 rounded ${previewPaused ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}><Pause size={14} /></button>
                  </div>
                </div>
                <div className="w-full overflow-hidden rounded-lg" style={{ backgroundColor: ticker.bgColor, minHeight: '44px', display: 'flex', alignItems: 'center', borderTop: ticker.borderWidth ? `${ticker.borderWidth}px solid ${ticker.borderColor}` : 'none', borderBottom: ticker.borderWidth ? `${ticker.borderWidth}px solid ${ticker.borderColor}` : 'none', borderRadius: ticker.borderRadius ? `${ticker.borderRadius}px` : undefined }}>
                  {ticker.label && <div style={{ backgroundColor: ticker.labelBg, color: ticker.labelColor, padding: '8px 14px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px', whiteSpace: 'nowrap', flexShrink: 0 }}>{ticker.label}</div>}
                  <div ref={previewRef} style={{ display: 'flex', animation: `ticker-scroll ${ticker.speed === 'slow' ? '40s' : ticker.speed === 'fast' ? '15s' : '25s'} linear infinite ${ticker.direction === 'ltr' ? 'reverse' : 'normal'}`, animationPlayState: previewPaused ? 'paused' : 'running', whiteSpace: 'nowrap', gap: `${ticker.gap}px`, paddingLeft: '16px', color: ticker.textColor, fontSize: ticker.fontSize, fontFamily: ticker.fontFamily }}>
                    <span style={{ display: 'flex', gap: `${ticker.gap}px`, paddingRight: `${ticker.gap}px` }}>
                      {ticker.items.map((item, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', color: item.textColor || ticker.textColor, fontWeight: item.fontWeight || 'normal', fontStyle: item.fontStyle || 'normal', textDecoration: item.textDecoration || 'none', fontSize: item.fontSize || ticker.fontSize, fontFamily: item.fontFamily || ticker.fontFamily, backgroundColor: item.bgColor || 'transparent', padding: item.padding || '4px 8px', borderRadius: item.borderRadius || '0', border: item.borderColor ? `1px solid ${item.borderColor}` : 'none' }}>
                          {item.text}{ticker.showDividers && i < ticker.items.length - 1 && <span style={{ opacity: 0.5, margin: '0 8px' }}>{ticker.dividerStyle}</span>}
                        </span>
                      ))}
                    </span>
                    <span style={{ display: 'flex', gap: `${ticker.gap}px`, paddingRight: `${ticker.gap}px` }}>
                      {ticker.items.map((item, i) => (
                        <span key={`dup-${i}`} style={{ display: 'inline-flex', alignItems: 'center', color: item.textColor || ticker.textColor, fontWeight: item.fontWeight || 'normal', fontStyle: item.fontStyle || 'normal', textDecoration: item.textDecoration || 'none', fontSize: item.fontSize || ticker.fontSize, fontFamily: item.fontFamily || ticker.fontFamily, backgroundColor: item.bgColor || 'transparent', padding: item.padding || '4px 8px', borderRadius: item.borderRadius || '0', border: item.borderColor ? `1px solid ${item.borderColor}` : 'none' }}>
                          {item.text}{ticker.showDividers && i < ticker.items.length - 1 && <span style={{ opacity: 0.5, margin: '0 8px' }}>{ticker.dividerStyle}</span>}
                        </span>
                      ))}
                    </span>
                  </div>
                  <style>{`@keyframes ticker-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`}</style>
                </div>
                {ticker.items.length > 0 && <p className="text-[10px] text-gray-400 mt-2">The ticker is endless. Items loop seamlessly.</p>}
              </div>

              {/* Edit Selected Item */}
              {selectedItem && (
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <h3 className="font-bold text-gray-900 text-sm mb-3">Edit Selected Item</h3>
                  {/* Text Input */}
                  <textarea value={selectedItem.text} onChange={(e) => updateItem(selectedItemIdx, 'text', e.target.value)} rows={2} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg mb-3 focus:ring-1 focus:ring-primary-500 resize-none" placeholder="Ticker text..." />
                  {/* Style Toolbar */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <select value={selectedItem.fontFamily || ''} onChange={(e) => updateItemStyle('fontFamily', e.target.value)} className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg">
                      <option value="">Default Font</option>
                      {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <select value={selectedItem.fontSize || ''} onChange={(e) => updateItemStyle('fontSize', e.target.value)} className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg w-16">
                      <option value="">Size</option>
                      <option value="10px">10</option><option value="12px">12</option><option value="14px">14</option><option value="16px">16</option><option value="18px">18</option><option value="20px">20</option><option value="24px">24</option>
                    </select>
                    <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-1">
                      <div className="relative">
                        <input type="color" value={selectedItem.textColor || itemColor} onChange={(e) => updateItemStyle('textColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-6" />
                        <div className="w-6 h-7 flex items-center justify-center"><Type size={12} style={{ color: selectedItem.textColor || itemColor }} /></div>
                      </div>
                      <div className="w-px h-5 bg-gray-200"></div>
                      <div className="relative">
                        <input type="color" value={selectedItem.bgColor || 'transparent'} onChange={(e) => updateItemStyle('bgColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-6" />
                        <div className="w-6 h-7 flex items-center justify-center"><div className="w-3 h-3 rounded border" style={{ backgroundColor: selectedItem.bgColor || '#fff', borderColor: '#ccc' }}></div></div>
                      </div>
                    </div>
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button onClick={() => updateItemStyle('fontWeight', selectedItem.fontWeight === 'bold' ? 'normal' : 'bold')} className={`p-1.5 ${selectedItem.fontWeight === 'bold' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}><Bold size={12} /></button>
                      <button onClick={() => updateItemStyle('fontStyle', selectedItem.fontStyle === 'italic' ? 'normal' : 'italic')} className={`p-1.5 ${selectedItem.fontStyle === 'italic' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}><Italic size={12} /></button>
                      <button onClick={() => updateItemStyle('textDecoration', selectedItem.textDecoration === 'underline' ? 'none' : 'underline')} className={`p-1.5 ${selectedItem.textDecoration === 'underline' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}><Underline size={12} /></button>
                    </div>
                    <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 relative">😊</button>
                  </div>
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="bg-white border border-gray-200 rounded-xl p-3 mb-3 shadow-lg">
                      <div className="grid grid-cols-10 gap-1">
                        {EMOJIS.map(e => (
                          <button key={e} onClick={() => insertEmoji(e)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-lg">{e}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Item-specific overrides */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="text-[10px] text-gray-500 mb-1 block">Item BG Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={selectedItem.bgColor || '#ffffff'} onChange={(e) => updateItemStyle('bgColor', e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
                        <input type="text" value={selectedItem.bgColor || ''} onChange={(e) => updateItemStyle('bgColor', e.target.value)} className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg" placeholder="Transparent" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 mb-1 block">Item Text Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={selectedItem.textColor || '#000000'} onChange={(e) => updateItemStyle('textColor', e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
                        <input type="text" value={selectedItem.textColor || ''} onChange={(e) => updateItemStyle('textColor', e.target.value)} className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg" placeholder="Default" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 mb-1 block">Border Radius</label>
                      <input type="text" value={selectedItem.borderRadius || ''} onChange={(e) => updateItemStyle('borderRadius', e.target.value)} className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 mb-1 block">Border Color</label>
                      <input type="color" value={selectedItem.borderColor || '#000000'} onChange={(e) => updateItemStyle('borderColor', e.target.value)} className="w-full h-8 rounded border cursor-pointer" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 mb-1 block">Padding</label>
                      <input type="text" value={selectedItem.padding || ''} onChange={(e) => updateItemStyle('padding', e.target.value)} className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg" placeholder="4px 8px" />
                    </div>
                  </div>
                  {/* Style Presets */}
                  <div className="mt-3">
                    <label className="text-[10px] text-gray-500 mb-1 block">Quick Presets</label>
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(STYLE_PRESETS).map(p => (
                        <button key={p} onClick={() => applyPreset(p)} className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-gray-200 hover:shadow transition-all" style={STYLE_PRESETS[p].bgColor ? { backgroundColor: STYLE_PRESETS[p].bgColor, color: STYLE_PRESETS[p].textColor } : {}}>{p === 'none' ? 'NONE' : p.replace(/([A-Z])/g, ' $1').trim()}</button>
                      ))}
                    </div>
                  </div>
                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => { updateItemStyle('bgColor', ''); updateItemStyle('textColor', ''); updateItemStyle('fontWeight', 'normal'); updateItemStyle('fontStyle', 'normal'); updateItemStyle('textDecoration', 'none'); updateItemStyle('fontSize', ''); updateItemStyle('fontFamily', ''); }} className="flex-1 text-xs py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Reset Text Style</button>
                    <button onClick={() => { updateItemStyle('bgColor', ''); updateItemStyle('borderColor', ''); updateItemStyle('borderWidth', 0); updateItemStyle('borderRadius', ''); }} className="flex-1 text-xs py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Reset Background</button>
                    <button onClick={() => duplicateItem(selectedItemIdx)} className="flex-1 text-xs py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Duplicate</button>
                    <button onClick={() => removeItem(selectedItemIdx)} className="flex-1 text-xs py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium">Delete</button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Global Settings */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-sm">Background Settings</h3>
                  <Toggle checked={!!ticker.bgColor} onChange={(v) => setTicker({ ...ticker, bgColor: v ? '#1a1a2e' : '' })} label="" />
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Background Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={ticker.bgColor || '#1a1a2e'} onChange={(e) => setTicker({ ...ticker, bgColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                      <input type="text" value={ticker.bgColor} onChange={(e) => setTicker({ ...ticker, bgColor: e.target.value })} className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={ticker.textColor} onChange={(e) => setTicker({ ...ticker, textColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                      <input type="text" value={ticker.textColor} onChange={(e) => setTicker({ ...ticker, textColor: e.target.value })} className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Border Color (optional)</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={ticker.borderColor || '#000000'} onChange={(e) => setTicker({ ...ticker, borderColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                      <input type="text" value={ticker.borderColor} onChange={(e) => setTicker({ ...ticker, borderColor: e.target.value })} className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg" placeholder="None" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 mb-1 block">Border Width</label>
                      <input type="number" value={ticker.borderWidth} onChange={(e) => setTicker({ ...ticker, borderWidth: Number(e.target.value) })} className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 mb-1 block">Border Radius</label>
                      <input type="number" value={ticker.borderRadius} onChange={(e) => setTicker({ ...ticker, borderRadius: Number(e.target.value) })} className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Padding</label>
                    <select value={ticker.padding} onChange={(e) => setTicker({ ...ticker, padding: e.target.value })} className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg">
                      {PADDING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="font-bold text-gray-900 text-sm mb-3">Global Font</h3>
                <select value={ticker.fontFamily} onChange={(e) => setTicker({ ...ticker, fontFamily: e.target.value })} className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg mb-2">
                  {FONT_OPTIONS.map(f => <option key={f} value={`${f}, system-ui, sans-serif`}>{f}</option>)}
                </select>
                <select value={ticker.fontSize} onChange={(e) => setTicker({ ...ticker, fontSize: e.target.value })} className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg">
                  <option value="11px">11px</option><option value="12px">12px</option><option value="13px">13px</option><option value="14px">14px</option><option value="16px">16px</option><option value="18px">18px</option>
                </select>
              </div>

              {/* Item Preview */}
              {selectedItem && (
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <h3 className="font-bold text-gray-900 text-sm mb-3">Item Preview</h3>
                  <div className="w-full overflow-hidden rounded-lg p-3 flex items-center justify-center" style={{ backgroundColor: selectedItem.bgColor || ticker.bgColor || '#1a1a2e', minHeight: '44px' }}>
                    <span style={{ color: selectedItem.textColor || ticker.textColor, fontWeight: selectedItem.fontWeight || 'normal', fontStyle: selectedItem.fontStyle || 'normal', textDecoration: selectedItem.textDecoration || 'none', fontSize: selectedItem.fontSize || ticker.fontSize, fontFamily: selectedItem.fontFamily || ticker.fontFamily, padding: selectedItem.padding || '4px 12px', borderRadius: selectedItem.borderRadius || '0', border: selectedItem.borderColor ? `1px solid ${selectedItem.borderColor}` : 'none' }}>
                      {selectedItem.text}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
