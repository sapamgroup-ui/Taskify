import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-1">
            <span className="text-xl font-extrabold tracking-tight">
              <span className="text-primary-400">Task</span>
              <span className="text-accent-400">ify</span>
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/tasks" className="hover:text-white transition-colors">Browse</Link>
            <Link to="/post-task" className="hover:text-white transition-colors">Post Task</Link>
            <Link to="/premium" className="hover:text-white transition-colors">Premium</Link>
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm text-gray-500">&copy; 2026 Taskify. All rights reserved.</p>
            <p className="text-xs text-gray-600 mt-1">v1.1</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
