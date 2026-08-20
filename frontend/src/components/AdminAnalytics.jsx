import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { BarChart3, TrendingUp, Eye, Users, Loader2, Plus, Trash2, Save, Palette } from 'lucide-react'

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ticker, setTicker] = useState({ items: [], bgColor: '#1a1a2e', textColor: '#ffffff', fontSize: '14px', fontFamily: 'Inter, system-ui, sans-serif', speed: '20s' })
  const [savingTicker, setSavingTicker] = useState(false)
  const [newItem, setNewItem] = useState({ text: '', emoji: '🔹' })

  useEffect(() => {
    fetchStats()
    fetchTicker()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/analytics/dashboard')
      setStats(res.data)
    } catch (err) {
      console.error('Failed to load analytics', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTicker = async () => {
    try {
      const res = await axios.get('/api/analytics/ticker')
      if (res.data?.config) setTicker(res.data.config)
    } catch {}
  }

  const saveTicker = async () => {
    setSavingTicker(true)
    try {
      await axios.put('/api/analytics/ticker', ticker)
      toast.success('Ticker updated!')
    } catch (err) {
      toast.error('Failed to save ticker')
    } finally {
      setSavingTicker(false)
    }
  }

  const addTickerItem = () => {
    if (!newItem.text.trim()) return toast.error('Enter ticker text')
    setTicker({ ...ticker, items: [...ticker.items, { ...newItem }] })
    setNewItem({ text: '', emoji: '🔹' })
  }

  const removeTickerItem = (idx) => {
    setTicker({ ...ticker, items: ticker.items.filter((_, i) => i !== idx) })
  }

  const updateTickerItem = (idx, field, value) => {
    const items = [...ticker.items]
    items[idx] = { ...items[idx], [field]: value }
    setTicker({ ...ticker, items })
  }

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-primary-500" /></div>

  const emojiOptions = ['🔹', '✨', '🎉', '🔥', '💰', '⭐', '🎯', '📌', '💫', '🏆', '🚀', '💎', '✅', '🌟', '💼', '📊', '🆕', '⚡']

  return (
    <div className="space-y-8">
      {/* Analytics Overview */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 size={20} /> Analytics Dashboard</h3>
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
              <p className="text-2xl font-extrabold text-primary-600">{stats.popularCategories?.[0]?.category || '—'}</p>
            </div>
          </div>
        )}

        {/* Popular Categories Chart */}
        {stats?.popularCategories?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><TrendingUp size={16} /> Popular Categories</h4>
            <div className="space-y-2">
              {stats.popularCategories.map((cat, i) => {
                const max = stats.popularCategories[0]?.count || 1
                const pct = Math.round((cat.count / max) * 100)
                return (
                  <div key={cat.category} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-24 truncate">{cat.category}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div className="bg-primary-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-10 text-right">{cat.count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent Events */}
        {stats?.recentEvents?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Eye size={16} /> Recent Events</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium">Event</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Time</th>
                  </tr>
                </thead>
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

      {/* Ticker Editor */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">📢 Ticker Tape Editor</h3>
        <p className="text-xs text-gray-500 mb-4">Create a scrolling announcement bar that appears below the header. Add items with emoji and text.</p>

        {/* Ticker Items */}
        <div className="space-y-2 mb-4">
          {ticker.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
              <span className="text-xl cursor-pointer" onClick={() => {
                const emojis = ['🔹', '✨', '🎉', '🔥', '💰', '⭐', '🎯', '📌', '💫', '🏆', '🚀', '💎', '✅', '🌟', '💼', '📊', '🆕', '⚡']
                const ci = emojis.indexOf(item.emoji)
                updateTickerItem(idx, 'emoji', emojis[(ci + 1) % emojis.length])
              }}>{item.emoji}</span>
              <input
                type="text"
                value={item.text}
                onChange={(e) => updateTickerItem(idx, 'text', e.target.value)}
                className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Ticker text..."
              />
              <button onClick={() => removeTickerItem(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        {/* Add New Item */}
        <div className="flex items-center gap-2 mb-6">
          <select value={newItem.emoji} onChange={(e) => setNewItem({ ...newItem, emoji: e.target.value })} className="text-xl border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500">
            {emojiOptions.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <input
            type="text"
            value={newItem.text}
            onChange={(e) => setNewItem({ ...newItem, text: e.target.value })}
            className="flex-1 text-sm px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Add announcement text..."
            onKeyDown={(e) => e.key === 'Enter' && addTickerItem()}
          />
          <button onClick={addTickerItem} className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1"><Plus size={14} /> Add</button>
        </div>

        {/* Styling Controls */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Background</label>
            <div className="flex items-center gap-2">
              <input type="color" value={ticker.bgColor} onChange={(e) => setTicker({ ...ticker, bgColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
              <input type="text" value={ticker.bgColor} onChange={(e) => setTicker({ ...ticker, bgColor: e.target.value })} className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Text Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={ticker.textColor} onChange={(e) => setTicker({ ...ticker, textColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
              <input type="text" value={ticker.textColor} onChange={(e) => setTicker({ ...ticker, textColor: e.target.value })} className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Font Size</label>
            <select value={ticker.fontSize} onChange={(e) => setTicker({ ...ticker, fontSize: e.target.value })} className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg">
              <option value="12px">12px</option>
              <option value="13px">13px</option>
              <option value="14px">14px</option>
              <option value="16px">16px</option>
              <option value="18px">18px</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Font Family</label>
            <select value={ticker.fontFamily} onChange={(e) => setTicker({ ...ticker, fontFamily: e.target.value })} className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg">
              <option value="Inter, system-ui, sans-serif">Inter</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="Courier New, monospace">Courier</option>
              <option value="Verdana, sans-serif">Verdana</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Speed</label>
            <select value={ticker.speed} onChange={(e) => setTicker({ ...ticker, speed: e.target.value })} className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg">
              <option value="30s">Slow</option>
              <option value="20s">Medium</option>
              <option value="12s">Fast</option>
            </select>
          </div>
        </div>

        {/* Preview */}
        {ticker.items.length > 0 && (
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Preview</label>
            <div className="w-full overflow-hidden rounded-lg" style={{ backgroundColor: ticker.bgColor, height: '40px', display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', animation: `ticker ${ticker.speed} linear infinite`, whiteSpace: 'nowrap', fontSize: ticker.fontSize, fontFamily: ticker.fontFamily, color: ticker.textColor, fontWeight: 500 }}>
                <span>{ticker.items.map(item => `${item.emoji} ${item.text}`).join('   •   ')}</span>
                <span style={{ marginLeft: '48px' }}>{ticker.items.map(item => `${item.emoji} ${item.text}`).join('   •   ')}</span>
              </div>
            </div>
          </div>
        )}

        <button onClick={saveTicker} disabled={savingTicker} className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
          {savingTicker ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Ticker
        </button>
      </div>
    </div>
  )
}
