import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ArrowRight, Loader2 } from 'lucide-react'
import axios from 'axios'
import CategoryGrid from '../components/CategoryGrid'
import TaskCard from '../components/TaskCard'
import SwipeCards from '../components/SwipeCards'

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [swipeTasks, setSwipeTasks] = useState([])
  const [latestTasks, setLatestTasks] = useState([])
  const [loadingSwipe, setLoadingSwipe] = useState(true)
  const [loadingLatest, setLoadingLatest] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const navigate = useNavigate()
  const loadMoreRef = useRef(null)

  useEffect(() => {
    const fetchSwipe = async () => {
      try {
        const res = await axios.get('/api/tasks?sortBy=newest&limit=40&status=open')
        setSwipeTasks(res.data.tasks || [])
      } catch { setSwipeTasks([]) } finally { setLoadingSwipe(false) }
    }
    fetchSwipe()
  }, [])

  const fetchLatest = useCallback(async (pageNum, append = false) => {
    try {
      setLoadingLatest(true)
      const res = await axios.get(`/api/tasks?sortBy=newest&limit=12&page=${pageNum}&status=open`)
      const newTasks = res.data.tasks || []
      setLatestTasks(prev => append ? [...prev, ...newTasks] : newTasks)
      setHasMore(newTasks.length === 12)
    } catch { if (!append) setLatestTasks([]); setHasMore(false) } finally { setLoadingLatest(false) }
  }, [])

  useEffect(() => { fetchLatest(1) }, [fetchLatest])

  useEffect(() => {
    if (!hasMore || loadingLatest) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) { setPage(p => { const n = p + 1; fetchLatest(n, true); return n }) } },
      { threshold: 0.1 }
    )
    if (loadMoreRef.current) observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingLatest, fetchLatest])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/tasks?search=${encodeURIComponent(searchQuery.trim())}`)
  }

  return (
    <div>
      {/* Hero - very compact */}
      <section className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-5 left-5 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-5 w-56 h-56 bg-accent-500 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 md:py-10 relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-2xl md:text-4xl font-extrabold mb-2 leading-tight">
              Get <span className="text-accent-400">Anything</span> Done
            </h1>
            <p className="text-sm md:text-base text-blue-100 mb-5">
              Find trusted local Taskers. Set your price, pick your Tasker, get it done.
            </p>
            <form onSubmit={handleSearch} className="max-w-lg mx-auto flex bg-white rounded-full overflow-hidden shadow-2xl p-0.5">
              <div className="flex-1 flex items-center px-4">
                <Search size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                <input type="text" placeholder="What do you need done?" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full py-2 text-gray-800 focus:outline-none text-sm" />
              </div>
              <button type="submit" className="bg-accent-500 hover:bg-accent-600 text-white font-bold px-5 py-2 rounded-full transition-all shadow-lg">Search</button>
            </form>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs">
              <Link to="/post-task" className="bg-white/15 hover:bg-white/25 text-white font-semibold px-4 py-1.5 rounded-full transition-all backdrop-blur-sm">Post a Task — Free</Link>
              <Link to="/register" className="bg-accent-500 hover:bg-accent-600 text-white font-semibold px-4 py-1.5 rounded-full transition-all shadow-md">Become a Tasker</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Swipeable Cards - Tinder style */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Swipe to discover tasks</h2>
              <p className="text-xs text-gray-500">Swipe right to bid, left to skip</p>
            </div>
            <Link to="/tasks" className="text-primary-500 hover:text-primary-600 font-semibold text-xs flex items-center gap-1">Browse All <ArrowRight size={12} /></Link>
          </div>
          {loadingSwipe ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-primary-500" /></div>
          ) : (
            <SwipeCards tasks={swipeTasks} onBrowseAll={() => navigate('/tasks')} />
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Browse by Category</h2>
            <Link to="/tasks" className="text-primary-500 hover:text-primary-600 font-semibold text-xs flex items-center gap-1">View All <ArrowRight size={12} /></Link>
          </div>
          <CategoryGrid compact />
        </div>
      </section>

      {/* Latest Tasks - infinite scroll */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Latest Tasks</h2>
              <p className="text-xs text-gray-500">{latestTasks.length} tasks — new ones daily</p>
            </div>
            <Link to="/tasks" className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-4 py-1.5 rounded-lg text-xs transition-all">Browse All</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestTasks.map(t => <TaskCard key={t.id} task={t} />)}
          </div>
          <div ref={loadMoreRef} className="flex items-center justify-center py-8">
            {loadingLatest && <Loader2 size={24} className="animate-spin text-primary-500" />}
            {!hasMore && latestTasks.length > 0 && <p className="text-xs text-gray-400">You've seen all tasks</p>}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-extrabold text-gray-900">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Post Your Task', desc: 'Describe what you need, set your budget. 2 minutes.', color: 'bg-primary-500' },
              { step: '2', title: 'Get Offers', desc: 'Taskers send offers. Compare prices and reviews.', color: 'bg-accent-500' },
              { step: '3', title: 'Get It Done', desc: 'Pick your Tasker, chat, pay securely when done.', color: 'bg-green-500' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className={`w-10 h-10 ${item.color} text-white rounded-full flex items-center justify-center text-lg font-extrabold mx-auto mb-2`}>{item.step}</div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                <p className="text-gray-500 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-10 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-extrabold text-gray-900">Simple Pricing</h2>
            <p className="text-xs text-gray-500 mt-1">Posting is always free. Taskers pay to reply.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {[
              { name: 'Free', price: '₹0', desc: '2 posts/mo, 1 reply/mo', color: 'border-gray-200', badge: '' },
              { name: 'Per Reply', price: '₹50', desc: '1 reply per purchase', color: 'border-primary-200', badge: '' },
              { name: 'Basic', price: '₹200/mo', desc: '7 posts + 7 replies/mo', color: 'border-accent-200', badge: 'Popular' },
              { name: 'Premium', price: '₹500/mo', desc: 'Unlimited everything', color: 'border-green-200', badge: 'Best Value' },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-xl border-2 ${plan.color} p-4 text-center relative`}>
                {plan.badge && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-accent-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{plan.badge}</span>}
                <p className="font-bold text-gray-900 text-sm">{plan.name}</p>
                <p className="text-xl font-extrabold text-primary-600 mt-1">{plan.price}</p>
                <p className="text-[10px] text-gray-500 mt-1">{plan.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <Link to="/premium" className="text-primary-500 hover:text-primary-600 font-semibold text-xs">View all plans →</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 bg-gradient-to-r from-accent-500 to-accent-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl md:text-2xl font-extrabold mb-2">Ready to Get Started?</h2>
          <p className="text-accent-100 text-sm mb-5">Post your first task or sign up to earn as a Tasker.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/post-task" className="bg-white text-accent-600 hover:bg-gray-100 font-bold py-2 px-6 rounded-full transition-all shadow-lg text-sm">Post a Task</Link>
            <Link to="/register" className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-6 rounded-full transition-all shadow-lg border-2 border-white/30 text-sm">Become a Tasker</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
