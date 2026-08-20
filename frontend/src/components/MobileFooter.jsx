import { Link, useLocation } from 'react-router-dom'
import { Home, Search, Plus, MessageSquare, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function MobileFooter() {
  const { user } = useAuth()
  const location = useLocation()

  const tabs = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Browse', path: '/tasks' },
    { icon: Plus, label: 'Post', path: '/post-task', isCenter: true },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: User, label: 'Profile', path: '/dashboard' },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          if (tab.isCenter) {
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="relative -mt-6 flex items-center justify-center"
              >
                <div className="w-14 h-14 bg-accent-500 rounded-full flex items-center justify-center shadow-lg shadow-accent-500/30 border-4 border-white">
                  <Plus size={26} className="text-white" strokeWidth={3} />
                </div>
              </Link>
            )
          }

          const Icon = tab.icon
          const active = isActive(tab.path)

          return (
            <Link
              key={tab.path}
              to={user ? tab.path : (tab.path === '/messages' || tab.path === '/dashboard') ? '/login' : tab.path}
              className="flex flex-col items-center justify-center gap-0.5 w-14"
            >
              <div className="relative">
                <Icon
                  size={22}
                  className={active ? 'text-primary-500' : 'text-gray-400'}
                  strokeWidth={active ? 2.5 : 2}
                />
                {tab.label === 'Messages' && user?.unreadMessages > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {user.unreadMessages > 9 ? '9+' : user.unreadMessages}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${active ? 'text-primary-500' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
