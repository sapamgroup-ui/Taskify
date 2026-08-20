import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Users, ListTodo, TrendingUp, Search, Shield, Ban, CheckCircle, XCircle, Eye, Loader2, BarChart3, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const adminTabs = ['overview', 'users', 'tasks', 'reports', 'revenue']

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalUsers: 0, totalTasks: 0, totalRevenue: 0, activeTasks: 0 })
  const [users, setUsers] = useState([])
  const [tasks, setTasks] = useState([])
  const [reports, setReports] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [taskFilter, setTaskFilter] = useState('')

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      const [statsRes, usersRes, tasksRes, reportsRes] = await Promise.allSettled([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/users'),
        axios.get('/api/admin/tasks'),
        axios.get('/api/admin/reports'),
      ])
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data.users || [])
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data.tasks || [])
      if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.data.reports || [])
    } catch {
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAdminData() }, [])

  const toggleBlockUser = async (userId, blocked) => {
    try {
      await axios.put(`/api/admin/users/${userId}/${blocked ? 'unblock' : 'block'}`)
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, blocked: !blocked } : u))
      toast.success(`User ${blocked ? 'unblocked' : 'blocked'}`)
    } catch (err) {
      toast.error('Failed to update user')
    }
  }

  const resolveReport = async (reportId, action) => {
    try {
      await axios.put(`/api/admin/reports/${reportId}`, { status: action })
      setReports((prev) => prev.filter((r) => r.id !== reportId))
      toast.success(`Report ${action}`)
    } catch (err) {
      toast.error('Failed to update report')
    }
  }

  const filteredUsers = users.filter((u) => u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredTasks = tasks.filter((t) => {
    if (taskFilter && t.status !== taskFilter) return false
    if (searchQuery) return t.title?.toLowerCase().includes(searchQuery.toLowerCase())
    return true
  })

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers || users.length, icon: Users, color: 'text-primary-500', bg: 'bg-primary-50' },
    { label: 'Total Tasks', value: stats.totalTasks || tasks.length, icon: ListTodo, color: 'text-accent-500', bg: 'bg-accent-50' },
    { label: 'Revenue', value: `₹${stats.totalRevenue || 0}`, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Active Tasks', value: stats.activeTasks || tasks.filter((t) => t.status === 'in_progress').length, icon: TrendingUp, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield size={28} className="text-primary-500" />
          <h1 className="text-2xl font-extrabold text-gray-900">Admin Panel</h1>
        </div>

        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-6 overflow-x-auto">
          {adminTabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all capitalize whitespace-nowrap ${activeTab === tab ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {statCards.map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}><stat.icon size={20} className={stat.color} /></div>
                      </div>
                      <div className="text-2xl font-extrabold text-gray-900">{stat.value}</div>
                      <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 size={18} /> Recent Users</h3>
                    {users.slice(0, 5).map((u) => (
                      <div key={u.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center"><span className="text-xs font-bold text-primary-600">{u.name?.charAt(0)}</span></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.blocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{u.blocked ? 'Blocked' : 'Active'}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><AlertTriangle size={18} /> Pending Reports</h3>
                    {reports.length > 0 ? reports.slice(0, 5).map((r) => (
                      <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        <AlertTriangle size={14} className="text-yellow-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{r.reason || 'No reason'}</p>
                          <p className="text-xs text-gray-400">{r.reporter?.name} reported {r.type}</p>
                        </div>
                      </div>
                    )) : <p className="text-gray-500 text-sm text-center py-4">No pending reports</p>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search users..." className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">User</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Role</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Joined</th>
                          <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50 transition-all">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center"><span className="text-xs font-bold text-primary-600">{u.name?.charAt(0)}</span></div>
                                <span className="font-medium text-gray-900">{u.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-gray-500">{u.email}</td>
                            <td className="px-5 py-3"><span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full capitalize">{u.role}</span></td>
                            <td className="px-5 py-3"><span className={`text-xs font-medium px-2 py-1 rounded-full ${u.blocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{u.blocked ? 'Blocked' : 'Active'}</span></td>
                            <td className="px-5 py-3 text-gray-400 text-xs">{u.createdAt ? formatDistanceToNow(new Date(u.createdAt), { addSuffix: true }) : ''}</td>
                            <td className="px-5 py-3 text-right">
                              <button onClick={() => toggleBlockUser(u.id, u.blocked)} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${u.blocked ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                                {u.blocked ? 'Unblock' : 'Block'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredUsers.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No users found</p>}
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search tasks..." className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <select value={taskFilter} onChange={(e) => setTaskFilter(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Task</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Poster</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Category</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Budget</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Offers</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredTasks.map((t) => (
                          <tr key={t.id} className="hover:bg-gray-50 transition-all">
                            <td className="px-5 py-3 font-medium text-gray-900 max-w-[200px] truncate">{t.title}</td>
                            <td className="px-5 py-3 text-gray-500">{t.poster?.name || 'Unknown'}</td>
                            <td className="px-5 py-3"><span className="bg-accent-50 text-accent-600 text-xs font-medium px-2 py-1 rounded-full">{t.category}</span></td>
                            <td className="px-5 py-3 text-gray-700 font-medium">₹{t.budget?.min}-₹{t.budget?.max}</td>
                            <td className="px-5 py-3">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${t.status === 'open' ? 'bg-green-100 text-green-600' : t.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'}`}>
                                {t.status?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-gray-500">{t.offers?.length || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredTasks.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No tasks found</p>}
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Reports ({reports.length})</h2>
                {reports.length > 0 ? reports.map((r) => (
                  <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle size={16} className="text-yellow-500" />
                          <span className="font-semibold text-gray-900 text-sm">{r.reason || 'No reason specified'}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{r.type}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{r.description || r.additionalInfo || 'No additional details'}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>Reported by: <span className="text-gray-600">{r.reporter?.name || 'Anonymous'}</span></span>
                          <span>{r.createdAt ? formatDistanceToNow(new Date(r.createdAt), { addSuffix: true }) : ''}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => resolveReport(r.id, 'resolved')} className="flex items-center gap-1 bg-green-100 text-green-600 hover:bg-green-200 text-xs font-medium px-3 py-2 rounded-lg transition-all">
                          <CheckCircle size={14} /> Resolve
                        </button>
                        <button onClick={() => resolveReport(r.id, 'dismissed')} className="flex items-center gap-1 bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-medium px-3 py-2 rounded-lg transition-all">
                          <XCircle size={14} /> Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                    <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
                    <p className="text-gray-500">No pending reports</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'revenue' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-900">Revenue Analytics</h2>
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
                  <p className="text-blue-100 text-sm">Total Revenue</p>
                  <p className="text-4xl font-extrabold mt-1">₹{stats.totalRevenue || 0}</p>
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/10 rounded-xl p-4">
                      <p className="text-blue-100 text-xs">This Month</p>
                      <p className="text-xl font-bold">₹{Math.floor((stats.totalRevenue || 0) * 0.3)}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4">
                      <p className="text-blue-100 text-xs">Avg per Task</p>
                      <p className="text-xl font-bold">₹{stats.totalTasks ? Math.floor((stats.totalRevenue || 0) / stats.totalTasks) : 0}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4">
                      <p className="text-blue-100 text-xs">Platform Fee</p>
                      <p className="text-xl font-bold">10%</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-3">Revenue by Category</h3>
                  <div className="space-y-3">
                    {['Cleaning', 'Handyman', 'Delivery', 'Web Dev', 'Design'].map((cat) => {
                      const catTasks = tasks.filter((t) => t.category === cat)
                      const rev = catTasks.reduce((sum, t) => sum + ((t.budget?.min || 0) + (t.budget?.max || 0)) / 2 * 0.1, 0)
                      const pct = stats.totalRevenue ? (rev / stats.totalRevenue) * 100 : 0
                      return (
                        <div key={cat} className="flex items-center gap-3">
                          <span className="w-24 text-sm text-gray-600 font-medium">{cat}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }}></div></div>
                          <span className="w-16 text-right text-sm text-gray-500">₹{Math.floor(rev)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
