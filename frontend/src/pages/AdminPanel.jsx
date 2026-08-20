import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Users, ListTodo, TrendingUp, Search, Shield, Ban, CheckCircle, XCircle, Eye, Loader2, BarChart3, AlertTriangle, CreditCard, BadgeCheck, ChevronDown } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import AdminAnalytics from '../components/AdminAnalytics'

const adminTabs = ['overview', 'users', 'tasks', 'reports', 'subscriptions', 'verifications', 'analytics']

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalUsers: 0, totalTasks: 0, totalRevenue: 0, activeTasks: 0, completedTasks: 0 })
  const [users, setUsers] = useState([])
  const [tasks, setTasks] = useState([])
  const [reports, setReports] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [verifications, setVerifications] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [taskFilter, setTaskFilter] = useState('')

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      const [statsRes, usersRes, tasksRes, reportsRes, subsRes, verRes] = await Promise.allSettled([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/users'),
        axios.get('/api/admin/tasks'),
        axios.get('/api/admin/reports'),
        axios.get('/api/admin/subscriptions'),
        axios.get('/api/admin/verifications'),
      ])
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data.users || [])
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data.tasks || [])
      if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.data.reports || [])
      if (subsRes.status === 'fulfilled') setSubscriptions(subsRes.value.data.subscriptions || [])
      if (verRes.status === 'fulfilled') setVerifications(verRes.value.data.requests || [])
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
    } catch {
      toast.error('Failed to update user')
    }
  }

  const resolveReport = async (reportId, action) => {
    try {
      await axios.put(`/api/admin/reports/${reportId}`, { status: action })
      setReports((prev) => prev.filter((r) => r.id !== reportId))
      toast.success(`Report ${action}`)
    } catch {
      toast.error('Failed to update report')
    }
  }

  const assignPlan = async (userId, plan) => {
    try {
      await axios.put(`/api/admin/users/${userId}/subscription`, { plan })
      toast.success(`Plan updated to ${plan}`)
      fetchAdminData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update plan')
    }
  }

  const reviewVerification = async (requestId, status) => {
    try {
      await axios.put(`/api/admin/verifications/${requestId}`, { status, adminNotes: status === 'approved' ? 'Approved by admin' : '' })
      setVerifications((prev) => prev.filter((v) => v.id !== requestId))
      toast.success(`Verification ${status}`)
    } catch {
      toast.error('Failed to update verification')
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
    { label: 'Active Tasks', value: stats.activeTasks || tasks.filter((t) => t.status === 'open').length, icon: TrendingUp, color: 'text-yellow-500', bg: 'bg-yellow-50' },
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
            <button key={tab} onClick={() => { setActiveTab(tab); setSearchQuery('') }} className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all capitalize whitespace-nowrap ${activeTab === tab ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
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
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Plan</th>
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
                            <td className="px-5 py-3 text-gray-400 text-xs">{u.created_at ? formatDistanceToNow(new Date(u.created_at), { addSuffix: true }) : ''}</td>
                            <td className="px-5 py-3">
                              <div className="relative group">
                                <button className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-all">
                                  {subscriptions.find(s => s.user_id === u.id)?.plan || 'free'} <ChevronDown size={12} />
                                </button>
                                <div className="hidden group-hover:block absolute z-10 top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-32">
                                  {['free', 'per_reply', 'basic', 'premium'].map((plan) => (
                                    <button key={plan} onClick={() => assignPlan(u.id, plan)} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 capitalize">{plan.replace('_', ' ')}</button>
                                  ))}
                                </div>
                              </div>
                            </td>
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
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredTasks.map((t) => (
                          <tr key={t.id} className="hover:bg-gray-50 transition-all">
                            <td className="px-5 py-3 font-medium text-gray-900 max-w-[200px] truncate">{t.title}</td>
                            <td className="px-5 py-3 text-gray-500">{t.poster?.name || 'Unknown'}</td>
                            <td className="px-5 py-3"><span className="bg-accent-50 text-accent-600 text-xs font-medium px-2 py-1 rounded-full">{t.category}</span></td>
                            <td className="px-5 py-3 text-gray-700 font-medium">₹{t.budget_min}-{t.budget_max}</td>
                            <td className="px-5 py-3">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${t.status === 'open' ? 'bg-green-100 text-green-600' : t.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'}`}>
                                {t.status?.replace('_', ' ')}
                              </span>
                            </td>
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
                        <p className="text-sm text-gray-600 mb-2">{r.description || r.additional_info || 'No additional details'}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>Reported by: <span className="text-gray-600">{r.reporter?.name || 'Anonymous'}</span></span>
                          <span>{r.created_at ? formatDistanceToNow(new Date(r.created_at), { addSuffix: true }) : ''}</span>
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

            {activeTab === 'subscriptions' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Subscriptions</h2>
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">User</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Plan</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Posts</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Replies</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Started</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {subscriptions.map((s) => (
                          <tr key={s.id} className="hover:bg-gray-50 transition-all">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center"><span className="text-xs font-bold text-primary-600">{s.user?.name?.charAt(0) || '?'}</span></div>
                                <div>
                                  <p className="font-medium text-gray-900">{s.user?.name || 'Unknown'}</p>
                                  <p className="text-xs text-gray-400">{s.user?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3"><span className="bg-primary-50 text-primary-600 text-xs font-bold px-2 py-1 rounded-full capitalize">{s.plan?.replace('_', ' ')}</span></td>
                            <td className="px-5 py-3 text-gray-500">{s.posts_used}/{s.posts_limit === -1 ? '∞' : s.posts_limit}</td>
                            <td className="px-5 py-3 text-gray-500">{s.replies_used}/{s.replies_limit === -1 ? '∞' : s.replies_limit}</td>
                            <td className="px-5 py-3"><span className={`text-xs font-medium px-2 py-1 rounded-full ${s.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>{s.status}</span></td>
                            <td className="px-5 py-3 text-gray-400 text-xs">{s.start_date ? formatDistanceToNow(new Date(s.start_date), { addSuffix: true }) : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {subscriptions.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No subscriptions found</p>}
                </div>
              </div>
            )}

            {activeTab === 'verifications' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Pending Verifications ({verifications.length})</h2>
                {verifications.length > 0 ? verifications.map((v) => (
                  <div key={v.id} className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-primary-600">{v.user?.name?.charAt(0) || '?'}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{v.user?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-400">{v.user?.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>Submitted: {v.created_at ? formatDistanceToNow(new Date(v.created_at), { addSuffix: true }) : ''}</span>
                        </div>
                        {v.doc1_url && (
                          <div className="mt-3 flex gap-2">
                            <a href={v.doc1_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium"><Eye size={12} /> Doc 1</a>
                            {v.doc2_url && <a href={v.doc2_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium"><Eye size={12} /> Doc 2</a>}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => reviewVerification(v.id, 'approved')} className="flex items-center gap-1 bg-green-100 text-green-600 hover:bg-green-200 text-xs font-medium px-3 py-2 rounded-lg transition-all">
                          <BadgeCheck size={14} /> Approve
                        </button>
                        <button onClick={() => reviewVerification(v.id, 'rejected')} className="flex items-center gap-1 bg-red-100 text-red-600 hover:bg-red-200 text-xs font-medium px-3 py-2 rounded-lg transition-all">
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                    <BadgeCheck size={40} className="mx-auto text-green-400 mb-3" />
                    <p className="text-gray-500">No pending verification requests</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <AdminAnalytics />
            )}
          </>
        )}
      </div>
    </div>
  )
}
