import { Link } from 'react-router-dom'

const footerLinks = {
  'For Clients': [
    { name: 'Post a Task', path: '/post-task' },
    { name: 'Browse Taskers', path: '/tasks' },
    { name: 'How It Works', path: '/#how-it-works' },
    { name: 'Pricing', path: '/premium' },
  ],
  'For Taskers': [
    { name: 'Find Work', path: '/tasks' },
    { name: 'Become a Tasker', path: '/register' },
    { name: 'Get Verified', path: '/verify' },
    { name: 'Success Stories', path: '/' },
  ],
  'Company': [
    { name: 'About Us', path: '/' },
    { name: 'Contact', path: '/' },
    { name: 'Blog', path: '/' },
    { name: 'Careers', path: '/' },
  ],
  'Support': [
    { name: 'Help Center', path: '/' },
    { name: 'Trust & Safety', path: '/' },
    { name: 'Terms of Service', path: '/' },
    { name: 'Privacy Policy', path: '/' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-1 mb-3">
              <span className="text-xl font-extrabold tracking-tight">
                <span className="text-primary-400">Task</span>
                <span className="text-accent-400">ify</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              India's #1 local task marketplace. Find trusted Taskers or earn with your skills.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-primary-500 rounded-full flex items-center justify-center transition-all">
                <span className="text-xs font-bold text-white">f</span>
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-primary-500 rounded-full flex items-center justify-center transition-all">
                <span className="text-xs font-bold text-white">t</span>
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-primary-500 rounded-full flex items-center justify-center transition-all">
                <span className="text-xs font-bold text-white">in</span>
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold text-white text-sm mb-3">{title}</h3>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-sm text-gray-500 hover:text-white transition-colors">{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">&copy; 2026 Taskify. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>Made with ❤️ in India</span>
            <span>v1.2</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
