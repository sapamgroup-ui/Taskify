import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import TaskCard from '../components/TaskCard'
import { Search, SlidersHorizontal, X, MapPin, ChevronDown, Grid, List, Map, Loader2 } from 'lucide-react'

const categoryOptions = ['Cleaning', 'Handyman', 'Delivery', 'Gardening', 'Painting', 'Plumbing', 'Electrical', 'Moving', 'Photography', 'Design', 'Web Dev', 'Tutoring', 'Construction', 'Catering', 'Event Planning', 'Wedding', 'Pet Care', 'Car Wash', 'Tailoring', 'Babysitting', 'Security', 'Interior', 'Music', 'Laundry']
const categoryMap = {
  'Cleaning': 'cleaning', 'Handyman': 'handyman', 'Delivery': 'delivery',
  'Gardening': 'gardening', 'Painting': 'painting', 'Plumbing': 'plumbing',
  'Electrical': 'electrical', 'Moving': 'moving', 'Photography': 'photography',
  'Design': 'design', 'Web Dev': 'web_development', 'Tutoring': 'tutoring',
  'Construction': 'construction', 'Catering': 'catering', 'Event Planning': 'event_planning',
  'Wedding': 'wedding', 'Pet Care': 'pet_care', 'Car Wash': 'car_wash',
  'Tailoring': 'tailoring', 'Babysitting': 'babysitting', 'Security': 'security',
  'Interior': 'interior', 'Music': 'music', 'Laundry': 'laundry'
}
const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'budget_high', label: 'Budget: High to Low' },
  { value: 'budget_low', label: 'Budget: Low to High' },
  { value: 'most_offers', label: 'Most Offers' },
]

export default function BrowseTasks() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    taskType: '',
    minBudget: '',
    maxBudget: '',
    location: '',
    status: '',
    sortBy: 'newest',
    page: 1,
  })

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, val]) => {
        if (val) {
          if (key === 'category' && categoryMap[val]) {
            params.set(key, categoryMap[val])
          } else {
            params.set(key, val)
          }
        }
      })
      const res = await axios.get(`/api/tasks?${params.toString()}`)
      setTasks(res.data.tasks || [])
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTasks() }, [filters])

  const handleSearch = (e) => {
    e.preventDefault()
    setFilters((f) => ({ ...f, page: 1 }))
  }

  const toggleCategory = (cat) => {
    setFilters((f) => ({ ...f, category: f.category === cat ? '' : cat, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({ search: '', category: '', taskType: '', minBudget: '', maxBudget: '', location: '', status: '', sortBy: 'newest', page: 1 })
    setSearchParams({})
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search tasks..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button type="button" onClick={() => setFilters({ ...filters, taskType: '', page: 1 })} className={`px-3 py-2.5 text-sm font-medium transition-all ${filters.taskType === '' ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`}>All</button>
              <button type="button" onClick={() => setFilters({ ...filters, taskType: 'need_help', page: 1 })} className={`px-3 py-2.5 text-sm font-medium transition-all ${filters.taskType === 'need_help' ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`}>Need Help</button>
              <button type="button" onClick={() => setFilters({ ...filters, taskType: 'offering_help', page: 1 })} className={`px-3 py-2.5 text-sm font-medium transition-all ${filters.taskType === 'offering_help' ? 'bg-accent-50 text-accent-600' : 'text-gray-600 hover:bg-gray-50'}`}>Offering Help</button>
            </div>
            <button type="button" onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg font-medium text-sm transition-all ${showFilters ? 'bg-primary-50 border-primary-300 text-primary-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              <SlidersHorizontal size={16} /> Filters
            </button>
            <select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value, page: 1 })} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="hidden sm:flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button type="button" onClick={() => setViewMode('grid')} className={`p-2.5 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}><Grid size={16} /></button>
              <button type="button" onClick={() => setViewMode('list')} className={`p-2.5 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}><List size={16} /></button>
              <button type="button" className="p-2.5 text-gray-400 hover:text-gray-600"><Map size={16} /></button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {showFilters && (
            <aside className="w-64 flex-shrink-0 hidden lg:block">
              <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-36">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Filters</h3>
                  <button onClick={clearFilters} className="text-xs text-primary-500 hover:text-primary-600 font-medium">Clear All</button>
                </div>

                <div className="mb-5">
                  <h4 className="font-semibold text-gray-800 text-sm mb-2">Category</h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {categoryOptions.map((cat) => (
                      <label key={cat} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                        <input type="checkbox" checked={filters.category === cat} onChange={() => toggleCategory(cat)} className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                        {cat}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <h4 className="font-semibold text-gray-800 text-sm mb-2">Budget Range</h4>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Min" value={filters.minBudget} onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <span className="text-gray-400">-</span>
                    <input type="number" placeholder="Max" value={filters.maxBudget} onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>

                <div className="mb-5">
                  <h4 className="font-semibold text-gray-800 text-sm mb-2">Location</h4>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="City or pincode" value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 text-sm mb-2">Status</h4>
                  <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                    <option value="">All</option>
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </aside>
          )}

          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500"><span className="font-semibold text-gray-900">{pagination.total || tasks.length}</span> tasks found</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-500">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) }))} disabled={pagination.page === 1} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-30 hover:bg-gray-50 transition-all">
                  Previous
                </button>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setFilters((f) => ({ ...f, page: p }))} className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${p === pagination.page ? 'bg-primary-500 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setFilters((f) => ({ ...f, page: Math.min(pagination.pages, f.page + 1) }))} disabled={pagination.page === pagination.pages} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-30 hover:bg-gray-50 transition-all">
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
