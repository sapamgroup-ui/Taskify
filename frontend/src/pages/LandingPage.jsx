import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ArrowRight, Loader2, Shield, Clock, CreditCard, Star, CheckCircle, Users, MapPin, Zap, ChevronRight, Play } from 'lucide-react'
import axios from 'axios'
import CategoryGrid from '../components/CategoryGrid'
import TaskCard from '../components/TaskCard'
import SwipeCards from '../components/SwipeCards'

const popularSearches = [
  'House Cleaning', 'Plumbing', 'Delivery', 'Photography', 'Web Development', 'Painting', 'Moving', 'Tutoring'
]

const testimonials = [
  { name: 'Priya Sharma', role: 'Tasker — Cleaning', avatar: 'P', rating: 4.9, text: 'Taskify changed my life. I earn ₹25,000/month doing what I love — cleaning homes. The platform is so easy to use.' },
  { name: 'Rahul Verma', role: 'Client — Plumbing', avatar: 'R', rating: 4.8, text: 'Posted a plumbing task at 9 AM, had a verified Tasker at my door by noon. Incredible service and fair prices.' },
  { name: 'Ananya Das', role: 'Tasker — Photography', avatar: 'A', rating: 4.7, text: 'As a photographer, Taskify helps me find clients without any marketing. The verification badge gives me credibility.' },
]

const trustStats = [
  { number: '10,000+', label: 'Verified Taskers' },
  { number: '50,000+', label: 'Tasks Completed' },
  { number: '25+', label: 'Cities' },
  { number: '4.8★', label: 'Average Rating' },
]

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [swipeTasks, setSwipeTasks] = useState([])
  const [latestTasks, setLatestTasks] = useState([])
  const [loadingSwipe, setLoadingSwipe] = useState(true)
  const [loadingLatest, setLoadingLatest] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [howTab, setHowTab] = useState('client')
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
      {/* Hero Section — Upwork-inspired with animated background */}
      <section className="relative bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900 text-white overflow-hidden min-h-[520px] flex items-center">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-primary-500 rounded-full blur-[128px] opacity-20 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent-500 rounded-full blur-[128px] opacity-15 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600 rounded-full blur-[200px] opacity-10"></div>
          {/* Grid pattern */}
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 relative z-10 w-full">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Left — Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-5 border border-white/10">
                <Zap size={14} className="text-accent-400" />
                <span className="text-xs font-medium text-gray-200">India's #1 Local Task Marketplace</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
                Get <span className="text-accent-400">Anything</span><br />Done.
              </h1>
              <p className="text-base text-gray-300 mb-6 max-w-lg leading-relaxed">
                Find trusted local Taskers for any job — from home cleaning to web development. Set your price, pick your Tasker, get it done.
              </p>

              <form onSubmit={handleSearch} className="flex bg-white rounded-full overflow-hidden shadow-2xl p-1 max-w-xl mb-4">
                <div className="flex-1 flex items-center px-5">
                  <Search size={18} className="text-gray-400 mr-3 flex-shrink-0" />
                  <input type="text" placeholder="What do you need done?" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full py-3 text-gray-800 focus:outline-none text-sm" />
                </div>
                <button type="submit" className="bg-accent-500 hover:bg-accent-600 text-white font-bold px-8 py-3 rounded-full transition-all shadow-lg text-sm whitespace-nowrap">Search</button>
              </form>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-xs text-gray-400">Popular:</span>
                {popularSearches.map(s => (
                  <button key={s} onClick={() => navigate(`/tasks?search=${encodeURIComponent(s)}`)} className="text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full transition-all border border-white/5">{s}</button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link to="/post-task" className="bg-accent-500 hover:bg-accent-600 text-white font-bold px-7 py-3 rounded-full transition-all shadow-lg shadow-accent-500/25 text-sm">Post a Task — Free</Link>
                <Link to="/register" className="bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3 rounded-full transition-all backdrop-blur-sm border border-white/10 text-sm">Become a Tasker</Link>
              </div>
            </div>

            {/* Right — Floating Cards */}
            <div className="hidden md:block relative h-[400px]">
              <div className="absolute top-4 right-8 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 w-72 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center"><CheckCircle size={20} className="text-white" /></div>
                  <div>
                    <p className="text-sm font-semibold">Task Completed!</p>
                    <p className="text-xs text-gray-300">House cleaning — ₹800</p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-12 left-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 w-64 animate-bounce" style={{ animationDuration: '3s', animationDelay: '1s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center"><Star size={18} className="text-white fill-white" /></div>
                  <div>
                    <p className="text-sm font-semibold">New Review</p>
                    <p className="text-xs text-gray-300">★★★★★ "Excellent work!"</p>
                  </div>
                </div>
              </div>
              <div className="absolute top-1/2 right-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 w-56 animate-bounce" style={{ animationDuration: '3s', animationDelay: '2s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center"><CreditCard size={18} className="text-white" /></div>
                  <div>
                    <p className="text-sm font-semibold">Payment Received</p>
                    <p className="text-xs text-gray-300">₹2,500 credited</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 max-w-3xl">
            {trustStats.map(stat => (
              <div key={stat.label} className="text-center bg-white/5 backdrop-blur-sm rounded-xl py-3 px-4 border border-white/10">
                <p className="text-xl font-extrabold text-white">{stat.number}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Swipeable Cards */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Swipe to discover tasks</h2>
              <p className="text-sm text-gray-500">Swipe right to bid, left to skip</p>
            </div>
            <Link to="/tasks" className="text-primary-500 hover:text-primary-600 font-semibold text-sm flex items-center gap-1">Browse All <ArrowRight size={14} /></Link>
          </div>
          {loadingSwipe ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-primary-500" /></div>
          ) : (
            <SwipeCards tasks={swipeTasks} onBrowseAll={() => navigate('/tasks')} />
          )}
        </div>
      </section>

      {/* Categories — Enhanced with skill tags */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900">Find freelancers for every type of work</h2>
            <p className="text-sm text-gray-500 mt-1">Choose a category to see popular skills</p>
          </div>
          <CategoryGrid compact />
          <div className="text-center mt-6">
            <Link to="/tasks" className="text-primary-500 hover:text-primary-600 font-semibold text-sm flex items-center gap-1 justify-center">Browse All Tasks <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      {/* Latest Tasks — infinite scroll */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Latest Tasks</h2>
              <p className="text-sm text-gray-500">{latestTasks.length} tasks — new ones daily</p>
            </div>
            <Link to="/tasks" className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-all">Browse All</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestTasks.map(t => <TaskCard key={t.id} task={t} />)}
          </div>
          <div ref={loadMoreRef} className="flex items-center justify-center py-8">
            {loadingLatest && <Loader2 size={24} className="animate-spin text-primary-500" />}
            {!hasMore && latestTasks.length > 0 && <p className="text-sm text-gray-400">You've seen all tasks</p>}
          </div>
        </div>
      </section>

      {/* How It Works — Upwork-style dual flow */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">How Taskify Works</h2>
            <p className="text-sm text-gray-500 max-w-lg mx-auto">From posting a task to getting it done — it's simple, fast, and secure.</p>
          </div>

          {/* Toggle */}
          <div className="flex justify-center mb-10">
            <div className="bg-gray-100 rounded-full p-1 flex">
              <button onClick={() => setHowTab('client')} className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${howTab === 'client' ? 'bg-primary-500 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}>
                For Clients
              </button>
              <button onClick={() => setHowTab('tasker')} className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${howTab === 'tasker' ? 'bg-accent-500 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}>
                For Taskers
              </button>
            </div>
          </div>

          {howTab === 'client' ? (
            <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {[
                { step: '1', title: 'Post Your Task', desc: 'Describe what you need, set your budget. Takes 2 minutes.', icon: '📋', color: 'bg-primary-500' },
                { step: '2', title: 'Get Proposals', desc: 'Taskers send offers. Compare prices, reviews, and profiles.', icon: '📩', color: 'bg-primary-600' },
                { step: '3', title: 'Hire & Collaborate', desc: 'Pick your Tasker. Chat, share files, track progress.', icon: '🤝', color: 'bg-accent-500' },
                { step: '4', title: 'Pay When Done', desc: 'Review the work. Pay securely only after you approve.', icon: '✅', color: 'bg-green-500' },
              ].map((item) => (
                <div key={item.step} className="text-center relative">
                  {item.step !== '4' && <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-gray-200"></div>}
                  <div className={`w-14 h-14 ${item.color} text-white rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg`}>{item.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {[
                { step: '1', title: 'Create Your Profile', desc: 'Showcase your skills, experience, and portfolio.', icon: '👤', color: 'bg-accent-500' },
                { step: '2', title: 'Find Tasks', desc: 'Browse tasks that match your skills. Swipe or search.', icon: '🔍', color: 'bg-accent-600' },
                { step: '3', title: 'Submit Proposals', desc: 'Pitch your services. Set your price and timeline.', icon: '📝', color: 'bg-primary-500' },
                { step: '4', title: 'Get Paid', desc: 'Complete the work. Get paid securely to your account.', icon: '💰', color: 'bg-green-500' },
              ].map((item) => (
                <div key={item.step} className="text-center relative">
                  {item.step !== '4' && <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-gray-200"></div>}
                  <div className={`w-14 h-14 ${item.color} text-white rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg`}>{item.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link to={howTab === 'client' ? '/post-task' : '/register'} className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg text-sm">
              {howTab === 'client' ? 'Post Your First Task' : 'Start Earning Today'} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Taskify — Trust Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Why choose Taskify?</h2>
            <p className="text-sm text-gray-500 max-w-lg mx-auto">We make it easy to find trusted local help or earn money with your skills.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            {[
              { icon: <Shield size={28} className="text-primary-500" />, title: 'Verified Taskers', desc: 'Every Tasker goes through identity verification. Check ratings, reviews, and completed tasks before hiring.' },
              { icon: <Clock size={28} className="text-accent-500" />, title: 'Fast Matching', desc: 'Post a task and get offers within minutes. Compare proposals and hire the best fit — not the first one.' },
              { icon: <CreditCard size={28} className="text-green-500" />, title: 'Secure Payments', desc: 'Your money is held safely until the work is done. Pay only when you approve the completed task.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={14} className={`fill-${i < Math.floor(t.rating) ? 'accent' : 'gray'}-400 text-${i < Math.floor(t.rating) ? 'accent' : 'gray'}-400`} />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">{t.rating}</span>
                </div>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-sm">{t.avatar}</div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing — Upwork-style comparison */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Simple, Transparent Pricing</h2>
            <p className="text-sm text-gray-500">Posting tasks is always free. Taskers choose a plan that fits their needs.</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Free',
                  price: '₹0',
                  period: 'forever',
                  desc: 'Get started, explore the platform',
                  features: ['2 posts per month', '1 reply per month', 'Basic profile', 'Browse all tasks', 'Standard support'],
                  cta: 'Get Started Free',
                  popular: false,
                  color: 'border-gray-200',
                },
                {
                  name: 'Basic',
                  price: '₹200',
                  period: '/month',
                  desc: 'For active Taskers and posters',
                  features: ['7 posts per month', '7 replies per month', 'Priority support', 'Premium profile badge', 'Higher search ranking', 'Early access to features'],
                  cta: 'Choose Basic',
                  popular: true,
                  color: 'border-primary-500',
                },
                {
                  name: 'Premium',
                  price: '₹500',
                  period: '/month',
                  desc: 'Unlimited everything',
                  features: ['Unlimited posts', 'Unlimited replies', 'Priority support', 'Premium profile badge', 'Highest search ranking', 'Early access to features', 'Dedicated account manager'],
                  cta: 'Subscribe Premium',
                  popular: false,
                  color: 'border-accent-500',
                },
              ].map(plan => (
                <div key={plan.name} className={`rounded-2xl border-2 ${plan.color} p-6 relative bg-white hover:shadow-lg transition-all ${plan.popular ? 'shadow-lg scale-[1.02]' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                      <Star size={12} className="fill-white" /> Most Popular
                    </div>
                  )}
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.name}</h3>
                  <p className="text-xs text-gray-500 mb-4">{plan.desc}</p>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-sm text-gray-500">{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5">
                        <CheckCircle size={16} className="mt-0.5 flex-shrink-0 text-green-500" />
                        <span className="text-sm text-gray-600">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/premium" className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${plan.popular ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>

            {/* Per Reply option */}
            <div className="mt-6 bg-gradient-to-r from-accent-50 to-primary-50 rounded-2xl p-6 border border-accent-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Just need one reply?</h3>
                <p className="text-sm text-gray-500">Pay ₹50 per reply — no subscription needed. One-off payment, use it when you need it.</p>
              </div>
              <Link to="/premium" className="bg-accent-500 hover:bg-accent-600 text-white font-semibold px-6 py-2.5 rounded-full text-sm whitespace-nowrap transition-all shadow-md">Get Per Reply — ₹50</Link>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link to="/premium" className="text-primary-500 hover:text-primary-600 font-semibold text-sm">Compare all plans including Verified Tasker →</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Ready to Get Started?</h2>
              <p className="text-primary-100 text-sm mb-5 max-w-md">Join thousands of Indians who are getting things done — or earning money doing what they love.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/post-task" className="bg-white text-primary-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-full transition-all shadow-lg text-sm text-center">Post a Task</Link>
                <Link to="/register" className="bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg text-sm text-center border-2 border-white/30">Become a Tasker</Link>
              </div>
            </div>
            <div className="hidden md:flex justify-end">
              <div className="grid grid-cols-2 gap-4">
                {trustStats.map(stat => (
                  <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                    <p className="text-2xl font-extrabold">{stat.number}</p>
                    <p className="text-xs text-primary-200">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
