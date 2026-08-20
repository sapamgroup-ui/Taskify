import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Menu, X, Search, ChevronDown, User, LogOut, LayoutDashboard, MessageSquare, Shield, Bell, Plus, ShieldCheck, ChevronRight } from 'lucide-react'

const categoryMenuItems = [
  { name: 'Cleaning', slug: 'cleaning', icon: '🧹', popular: ['House Cleaning', 'Office Cleaning', 'Deep Cleaning'] },
  { name: 'Handyman', slug: 'handyman', icon: '🔧', popular: ['Furniture Assembly', 'Wall Mounting', 'Repairs'] },
  { name: 'Delivery', slug: 'delivery', icon: '📦', popular: ['Package Delivery', 'Grocery Shopping', 'Food Delivery'] },
  { name: 'Plumbing', slug: 'plumbing', icon: '🚿', popular: ['Leak Repair', 'Pipe Fitting', 'Bathroom Fix'] },
  { name: 'Electrical', slug: 'electrical', icon: '⚡', popular: ['Wiring', 'Switch Installation', 'Fan Repair'] },
  { name: 'Painting', slug: 'painting', icon: '🎨', popular: ['Interior Painting', 'Exterior Painting', 'Wall Texture'] },
  { name: 'Photography', slug: 'photography', icon: '📸', popular: ['Event Photography', 'Product Photos', 'Portrait'] },
  { name: 'Web Development', slug: 'web_development', icon: '💻', popular: ['Website Design', 'E-commerce', 'Mobile App'] },
  { name: 'Design', slug: 'design', icon: '🎨', popular: ['Logo Design', 'UI/UX', 'Graphic Design'] },
  { name: 'Tutoring', slug: 'tutoring', icon: '📚', popular: ['Math Tutor', 'Science Tutor', 'English Tutor'] },
  { name: 'Moving', slug: 'moving', icon: '🚚', popular: ['Home Shifting', 'Office Moving', 'Loading/Unloading'] },
  { name: 'Gardening', slug: 'gardening', icon: '🌱', popular: ['Lawn Mowing', 'Plant Care', 'Landscaping'] },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [postDropdownOpen, setPostDropdownOpen] = useState(false)
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const categoryRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setCategoryMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/tasks?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-1">
              <span className="text-2xl font-extrabold tracking-tight"><span className="text-primary-500">Task</span><span className="text-accent-500">ify</span></span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              {/* Categories Mega Menu */}
              <div className="relative" ref={categoryRef}>
                <button
                  onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
                  className="flex items-center gap-1 text-gray-700 hover:text-primary-500 font-medium text-sm px-3 py-2 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Explore <ChevronDown size={14} className={`transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {categoryMenuOpen && (
                  <div className="absolute left-0 mt-2 w-[600px] bg-white rounded-2xl shadow-2xl border border-gray-100 py-4 z-50">
                    <div className="px-4 pb-3 border-b border-gray-100 mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">All Categories</p>
                    </div>
                    <div className="grid grid-cols-3 gap-1 px-2">
                      {categoryMenuItems.map(cat => (
                        <Link
                          key={cat.slug}
                          to={`/category/${cat.slug}`}
                          onClick={() => setCategoryMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all group"
                        >
                          <span className="text-lg">{cat.icon}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900 group-hover:text-primary-500">{cat.name}</p>
                            <p className="text-[10px] text-gray-400">{cat.popular.slice(0, 2).join(', ')}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 px-4">
                      <Link to="/tasks" onClick={() => setCategoryMenuOpen(false)} className="text-primary-500 hover:text-primary-600 text-sm font-semibold flex items-center gap-1">
                        Browse All Tasks <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link to="/tasks" className="text-gray-700 hover:text-primary-500 font-medium text-sm px-3 py-2 rounded-lg hover:bg-gray-50 transition-all">
                Find Work
              </Link>
              <Link to="/post-task" className="text-gray-700 hover:text-primary-500 font-medium text-sm px-3 py-2 rounded-lg hover:bg-gray-50 transition-all">
                Hire a Tasker
              </Link>
              <Link to="/premium" className="text-gray-700 hover:text-primary-500 font-medium text-sm px-3 py-2 rounded-lg hover:bg-gray-50 transition-all">
                Pricing
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <form onSubmit={handleSearch} className="flex items-center bg-gray-100 rounded-full px-4 py-2 w-72 focus-within:ring-2 focus-within:ring-primary-500 focus-within:bg-white transition-all">
              <Search size={16} className="text-gray-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent w-full text-sm focus:outline-none placeholder-gray-400"
              />
            </form>

            {user ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => setPostDropdownOpen(!postDropdownOpen)}
                    className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md"
                  >
                    <Plus size={16} /> Post / Offer <ChevronDown size={14} className={`transition-transform ${postDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {postDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                      <Link to="/post-task?taskType=need_help" onClick={() => setPostDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all">
                        <span className="text-lg">🙋</span>
                        <div>
                          <p className="font-medium">Post a Task</p>
                          <p className="text-xs text-gray-400">Describe what you need done</p>
                        </div>
                      </Link>
                      <Link to="/post-task?taskType=offering_help" onClick={() => setPostDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all">
                        <span className="text-lg">💪</span>
                        <div>
                          <p className="font-medium">Offer Your Service</p>
                          <p className="text-xs text-gray-400">Find clients who need your skills</p>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown size={16} className={`text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                        <p className="text-gray-500 text-xs">{user.email}</p>
                      </div>
                      <Link to="/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all">
                        <LayoutDashboard size={16} /> Dashboard
                      </Link>
                      <Link to="/messages" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all">
                        <MessageSquare size={16} /> Messages
                      </Link>
                      <Link to={`/profile/${user.id}`} onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all">
                        <User size={16} /> My Profile
                      </Link>
                      <Link to="/dashboard?tab=settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all">
                        <Bell size={16} /> Settings
                      </Link>
                      {!user.verified && user.verification_status !== 'approved' && (
                        <Link to="/verify" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-all">
                          <ShieldCheck size={16} /> Get Verified
                        </Link>
                      )}
                      {user.role === 'admin' && (
                        <Link to="/admin" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all">
                          <Shield size={16} /> Admin Panel
                        </Link>
                      )}
                      <hr className="my-2 border-gray-100" />
                      <button onClick={() => { logout(); setDropdownOpen(false) }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-all">
                        <LogOut size={16} /> Log Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary-500 font-medium text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-all">
                  Log In
                </Link>
                <Link to="/register" className="bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-all">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3">
            <form onSubmit={handleSearch} className="flex items-center bg-gray-100 rounded-full px-4 py-2">
              <Search size={18} className="text-gray-400 mr-2" />
              <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent w-full text-sm focus:outline-none" />
            </form>
          </div>
          <div className="px-4 pb-4 space-y-1">
            <Link to="/tasks" onClick={() => setMobileOpen(false)} className="block py-2.5 text-gray-700 hover:text-primary-500 font-medium">Browse Tasks</Link>
            <Link to="/post-task" onClick={() => setMobileOpen(false)} className="block py-2.5 text-gray-700 hover:text-primary-500 font-medium">Post a Task</Link>
            <Link to="/premium" onClick={() => setMobileOpen(false)} className="block py-2.5 text-gray-700 hover:text-primary-500 font-medium">Pricing</Link>
            {user ? (
              <>
                <hr className="my-2 border-gray-100" />
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block py-2.5 text-gray-700 hover:text-primary-500 font-medium">Dashboard</Link>
                <Link to="/messages" onClick={() => setMobileOpen(false)} className="block py-2.5 text-gray-700 hover:text-primary-500 font-medium">Messages</Link>
                <Link to={`/profile/${user.id}`} onClick={() => setMobileOpen(false)} className="block py-2.5 text-gray-700 hover:text-primary-500 font-medium">My Profile</Link>
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="block py-2.5 text-gray-700 hover:text-primary-500 font-medium">Admin Panel</Link>
                )}
                <button onClick={() => { logout(); setMobileOpen(false) }} className="block py-2.5 text-red-600 font-medium w-full text-left">Log Out</button>
              </>
            ) : (
              <>
                <hr className="my-2 border-gray-100" />
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block py-2.5 text-gray-700 hover:text-primary-500 font-medium">Log In</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="block bg-primary-500 text-white text-center rounded-full font-semibold py-3 mt-2">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
