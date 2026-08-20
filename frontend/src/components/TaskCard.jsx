import { Link } from 'react-router-dom'
import { MapPin, Clock, Users, Tag } from 'lucide-react'
import VerifiedBadge from './VerifiedBadge'
import { formatDistanceToNow } from 'date-fns'

const statusColors = {
  open: 'bg-green-100 text-green-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function TaskCard({ task }) {
  const postedTime = task.createdAt ? formatDistanceToNow(new Date(task.createdAt), { addSuffix: true }) : ''

  return (
    <Link to={`/tasks/${task.id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-primary-200 transition-all duration-200 cursor-pointer">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-500 transition-colors truncate text-lg">{task.title}</h3>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${statusColors[task.status] || 'bg-gray-100 text-gray-600'}`}>
            {task.status?.replace('_', ' ').charAt(0).toUpperCase() + task.status?.replace('_', ' ').slice(1)}
          </span>
        </div>

        {task.category && (
          <div className="flex items-center gap-1.5 mb-3">
            <Tag size={14} className="text-accent-500" />
            <span className="text-sm text-accent-600 font-medium bg-accent-50 px-2 py-0.5 rounded">{task.category}</span>
          </div>
        )}

        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{task.description}</p>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          {task.budget && (
            <span className="font-bold text-primary-600">
              ₹{task.budget.min} - ₹{task.budget.max}
            </span>
          )}
          {task.location && (
            <span className="flex items-center gap-1"><MapPin size={14} /> {task.location?.city || task.location}</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            {task.poster?.verified && <VerifiedBadge size="sm" />}
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={12} /> {postedTime}
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Users size={12} /> {task.offers?.length || 0} offers
          </span>
        </div>
      </div>
    </Link>
  )
}
