import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { MapPin, Clock, Star, Send, ChevronLeft, ChevronRight, Flag, User, Calendar, Loader2, MessageSquare } from 'lucide-react'
import VerifiedBadge from '../components/VerifiedBadge'
import { formatDistanceToNow, format } from 'date-fns'
import CommentSection from '../components/CommentSection'

export default function TaskDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const [offer, setOffer] = useState({ amount: '', message: '', estimatedTime: '' })
  const [submitting, setSubmitting] = useState(false)
  const [reporting, setReporting] = useState(false)

  const fetchTask = async () => {
    try {
      const res = await axios.get(`/api/tasks/${id}`)
      setTask(res.data.task || res.data)
    } catch (err) {
      toast.error('Task not found')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTask() }, [id])

  const handleReport = async () => {
    if (!user) { toast.error('Please login to report'); return }
    const reason = prompt('Why are you reporting this task?')
    if (!reason) return
    try {
      setReporting(true)
      await axios.post('/api/reports', { type: 'task', targetId: task.id, reason })
      toast.success('Report submitted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report')
    } finally {
      setReporting(false)
    }
  }

  const handleMakeOffer = async (e) => {
    e.preventDefault()
    if (!user) { toast.error('Please login to make an offer'); return }
    try {
      setSubmitting(true)
      await axios.post(`/api/bids/${id}/offers`, {
        amount: Number(offer.amount),
        message: offer.message,
        estimatedTime: offer.estimatedTime,
      })
      toast.success('Offer submitted!')
      setOffer({ amount: '', message: '', estimatedTime: '' })
      fetchTask()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit offer')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
  if (!task) return <div className="min-h-screen flex items-center justify-center text-gray-500">Task not found</div>

  const photos = task.photos?.length ? task.photos : []

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/tasks" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-500 mb-4 transition-colors">
          <ChevronLeft size={16} /> Back to Tasks
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {photos.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="relative bg-gray-100 flex items-center justify-center" style={{ minHeight: '200px', maxHeight: '500px' }}>
                  <img src={photos[currentPhoto]} alt={task.title} className="max-w-full max-h-[500px] object-contain" />
                  {photos.length > 1 && (
                    <>
                      <button onClick={() => setCurrentPhoto((c) => (c - 1 + photos.length) % photos.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-md"><ChevronLeft size={20} /></button>
                      <button onClick={() => setCurrentPhoto((c) => (c + 1) % photos.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-md"><ChevronRight size={20} /></button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">{currentPhoto + 1} / {photos.length}</div>
                    </>
                  )}
                </div>
                {photos.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto">
                    {photos.map((p, i) => (
                      <button key={i} onClick={() => setCurrentPhoto(i)} className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${i === currentPhoto ? 'border-primary-500' : 'border-transparent'}`}>
                        <img src={p} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className="text-xs font-semibold text-accent-600 bg-accent-50 px-2.5 py-1 rounded-full">{task.category}</span>
                  <h1 className="text-2xl font-extrabold text-gray-900 mt-3">{task.title}</h1>
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 ${task.status === 'open' ? 'bg-green-100 text-green-700' : task.status === 'completed' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
                  {task.status?.replace('_', ' ').charAt(0).toUpperCase() + task.status?.replace('_', ' ').slice(1)}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-500">
                <span className="flex items-center gap-1">₹{task.budget_min || task.budget?.min} - ₹{task.budget_max || task.budget?.max}</span>
                <span className="flex items-center gap-1"><MapPin size={16} /> {task.location?.city || task.location}</span>
                {task.scheduled_date && <span className="flex items-center gap-1"><Calendar size={16} /> {format(new Date(task.scheduled_date), 'dd MMM yyyy')}</span>}
                <span className="flex items-center gap-1"><Clock size={16} /> {task.created_at ? formatDistanceToNow(new Date(task.created_at), { addSuffix: true }) : ''}</span>
              </div>

              <div className="prose max-w-none text-gray-600 whitespace-pre-line">{task.description}</div>
            </div>

            {user && task.status === 'open' && task.poster?.id !== user.id && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Make an Offer</h2>
                <form onSubmit={handleMakeOffer} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Price (₹)</label>
                      <input type="number" value={offer.amount} onChange={(e) => setOffer({ ...offer, amount: e.target.value })} placeholder="Enter amount" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Estimated Time</label>
                      <input type="text" value={offer.estimatedTime} onChange={(e) => setOffer({ ...offer, estimatedTime: e.target.value })} placeholder="e.g. 2-3 hours" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                    <textarea value={offer.message} onChange={(e) => setOffer({ ...offer, message: e.target.value })} placeholder="Why are you the best person for this task?" rows={3} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none" />
                  </div>
                  <button type="submit" disabled={submitting} className="bg-accent-500 hover:bg-accent-600 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
                    {submitting ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : <><Send size={18} /> Submit Offer</>}
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Offers ({task.offers?.length || 0})</h2>
              {task.offers?.length > 0 ? (
                <div className="space-y-4">
                  {task.offers.map((o, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                      <Link to={`/profile/${o.tasker?.id}`} className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-primary-200 transition-colors">
                        <span className="font-semibold text-primary-600 text-sm">{o.tasker?.name?.charAt(0) || 'T'}</span>
                      </Link>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <Link to={`/profile/${o.tasker?.id}`} className="font-semibold text-gray-900 hover:text-primary-500 text-sm">{o.tasker?.name}</Link>
                          <span className="font-bold text-primary-600">₹{o.amount}</span>
                        </div>
                        {o.estimatedTime && <p className="text-xs text-gray-400 mt-0.5">Est. {o.estimatedTime}</p>}
                        <p className="text-sm text-gray-600 mt-1">{o.message}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: 5 }, (_, si) => (
                            <Star key={si} size={12} className={si < (o.tasker?.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                          ))}
                          <span className="text-xs text-gray-400 ml-1">({o.tasker?.totalReviews || o.tasker?.total_reviews || 0})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No offers yet. Be the first to bid!</p>
              )}
            </div>

            <CommentSection taskId={task.id} />
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Posted by</h3>
              <Link to={`/profile/${task.poster?.id}`} className="flex items-center gap-3 group">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-primary-600">{task.poster?.name?.charAt(0) || 'U'}</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-gray-900 group-hover:text-primary-500 transition-colors">{task.poster?.name}</p>
                    {task.poster?.verified && <VerifiedBadge size="sm" />}
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} size={12} className={i < (task.poster?.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">({task.poster?.totalReviews || task.poster?.total_reviews || 0})</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Member since {task.poster?.created_at ? new Date(task.poster.created_at).getFullYear() : '2024'}</p>
                </div>
              </Link>
              {user && user.id !== task.poster?.id && (
                <Link to="/messages" className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border border-primary-500 text-primary-500 rounded-lg font-medium text-sm hover:bg-primary-50 transition-all">
                  <MessageSquare size={16} /> Contact
                </Link>
              )}
            </div>

            <button onClick={handleReport} disabled={reporting} className="w-full flex items-center justify-center gap-2 py-2.5 text-gray-400 hover:text-red-500 border border-gray-200 rounded-lg text-sm font-medium transition-all hover:border-red-200 disabled:opacity-50">
              <Flag size={16} /> {reporting ? 'Reporting...' : 'Report Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
