import { Star } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function ReviewCard({ review }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < (review.rating || 0))

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="font-semibold text-primary-600 text-sm">{review.reviewer?.name?.charAt(0) || 'A'}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-gray-900 text-sm">{review.reviewer?.name || 'Anonymous'}</h4>
            <span className="text-xs text-gray-400">
              {review.createdAt ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }) : ''}
            </span>
          </div>
          <div className="flex items-center gap-0.5 mb-2">
            {stars.map((filled, i) => (
              <Star key={i} size={14} className={filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
            ))}
            <span className="text-xs text-gray-500 ml-1">{review.rating}/5</span>
          </div>
          <p className="text-sm text-gray-600">{review.comment}</p>
        </div>
      </div>
    </div>
  )
}
