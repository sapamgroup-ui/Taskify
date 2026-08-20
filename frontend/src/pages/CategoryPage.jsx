import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import TaskCard from '../components/TaskCard'
import { ChevronLeft, Loader2 } from 'lucide-react'

const displayNameMap = {
  cleaning: 'Cleaning', handyman: 'Handyman', delivery: 'Delivery',
  gardening: 'Gardening', painting: 'Painting', plumbing: 'Plumbing',
  electrical: 'Electrical', moving: 'Moving', photography: 'Photography',
  design: 'Design', web_development: 'Web Dev', tutoring: 'Tutoring',
  construction: 'Construction', catering: 'Catering', event_planning: 'Event Planning',
  wedding: 'Wedding', pet_care: 'Pet Care', car_wash: 'Car Wash',
  tailoring: 'Tailoring', babysitting: 'Babysitting', security: 'Security',
  interior: 'Interior', music: 'Music', laundry: 'Laundry'
}

export default function CategoryPage() {
  const { categoryName } = useParams()
  const dbCategory = categoryName.toLowerCase().replace(/\s+/g, '_')
  const displayName = displayNameMap[dbCategory] || categoryName
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('need_help')

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`/api/tasks?category=${encodeURIComponent(dbCategory)}&taskType=${activeTab}`)
        setTasks(res.data.tasks || [])
      } catch {
        setTasks([])
      } finally {
        setLoading(false)
      }
    }
    fetchTasks()
  }, [dbCategory, activeTab])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/tasks" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-500 mb-6 transition-colors">
          <ChevronLeft size={16} /> Back to Explore
        </Link>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">{displayName}</h1>

        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setActiveTab('need_help')}
            className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
              activeTab === 'need_help'
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            Need Help
          </button>
          <button
            onClick={() => setActiveTab('offering_help')}
            className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
              activeTab === 'offering_help'
                ? 'bg-accent-500 text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            Offering Help
          </button>
        </div>

        <div className="mb-6">
          <Link
            to={`/post-task?taskType=${activeTab}&category=${encodeURIComponent(displayName)}`}
            className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold text-sm px-6 py-3 rounded-full transition-all shadow-sm hover:shadow-md"
          >
            {activeTab === 'need_help' ? 'Post a Task' : 'Offer Your Service'}
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary-500" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-500">Be the first to {activeTab === 'need_help' ? 'post a task' : 'offer your service'} in this category!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
