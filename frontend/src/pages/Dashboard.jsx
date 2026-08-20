import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import TaskCard from '../components/TaskCard'
import ReviewCard from '../components/ReviewCard'
import { LayoutDashboard, ListTodo, Target, Wallet, Star, Settings, CheckCircle2, Clock, TrendingUp, Loader2, User } from 'lucide-react'

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'posted', label: 'My Tasks', icon: ListTodo },
  { id: 'offers', label: 'My Offers', icon: Target },
  { id: 'active', label: 'Active', icon: Clock },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
  { id: 'earnings', label: 'Earnings', icon: Wallet },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Dashboard() {
  const { user, updateProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ postedTasks: [], offeredTasks: [], activeTasks: [], completedTasks: [], reviews: [], earnings: 0 })
  const [settingsForm, setSettingsForm] = useState({ name: '', email: '', phone: '', bio: '', upiId: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingSettings, setSavingSettings] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/dashboard')
      setData(res.data)
      if (res.data.user) {
        setSettingsForm({
          name: res.data.user.name || '',
          email: res.data.user.email || '',
          phone: res.data.user.phone || '',
          bio: res.data.user.bio || '',
          upiId: res.data.user.upiId || res.data.user.upi_id || '',
        })
      }
    } catch {
      setSettingsForm({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        bio: user?.bio || '',
        upiId: user?.upiId || user?.upi_id || '',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboard() }, [])

  const handleSettingsSubmit = async (e) => {
    e.preventDefault()
    setSavingSettings(true)
    await updateProfile(settingsForm)
    setSavingSettings(false)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setChangingPassword(true)
    try {
      await axios.put('/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success('Password changed!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const stats = [
    { label: 'Tasks Posted', value: data.postedTasks?.length || 0, icon: ListTodo, color: 'text-primary-500', bg: 'bg-primary-50' },
    { label: 'Tasks Completed', value: data.completedTasks?.length || 0, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Total Earnings', value: `₹${data.earnings || 0}`, icon: TrendingUp, color: 'text-accent-500', bg: 'bg-accent-50' },
    { label: 'Pending Tasks', value: data.activeTasks?.length || 0, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-24">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-primary-600">{user?.name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.role === 'admin' ? 'Admin' : user?.role === 'tasker' ? 'Tasker' : 'Poster'}</p>
                </div>
              </div>
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <tab.icon size={18} /> {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-extrabold text-gray-900">Dashboard</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {stats.map((stat) => (
                        <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}><stat.icon size={20} className={stat.color} /></div>
                            <TrendingUp size={16} className="text-gray-300" />
                          </div>
                          <div className="text-2xl font-extrabold text-gray-900">{stat.value}</div>
                          <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                      <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
                      {data.postedTasks?.slice(0, 3).map((task) => (
                        <Link key={task.id} to={`/tasks/${task.id}`} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-2 transition-all">
                          <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center"><ListTodo size={14} className="text-primary-500" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{task.title}</p>
                            <p className="text-xs text-gray-400">₹{task.budget?.min}-₹{task.budget?.max}</p>
                          </div>
                          <span className="text-xs text-gray-400">{task.status}</span>
                        </Link>
                      ))}
                      {(!data.postedTasks || data.postedTasks.length === 0) && <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>}
                    </div>
                  </div>
                )}

                {activeTab === 'posted' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-extrabold text-gray-900">My Posted Tasks</h2>
                      <Link to="/post-task" className="bg-accent-500 hover:bg-accent-600 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-all">Post New Task</Link>
                    </div>
                    {data.postedTasks?.length > 0 ? (
                      <div className="space-y-3">{data.postedTasks.map((t) => <TaskCard key={t.id} task={t} />)}</div>
                    ) : <div className="bg-white rounded-xl border border-gray-100 p-12 text-center"><p className="text-gray-500">No tasks posted yet</p></div>}
                  </div>
                )}

                {activeTab === 'offers' && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-extrabold text-gray-900">My Offers</h2>
                    {data.offeredTasks?.length > 0 ? (
                      <div className="space-y-3">{data.offeredTasks.map((t) => <TaskCard key={t.id} task={t} />)}</div>
                    ) : <div className="bg-white rounded-xl border border-gray-100 p-12 text-center"><p className="text-gray-500">No offers made yet</p></div>}
                  </div>
                )}

                {activeTab === 'active' && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-extrabold text-gray-900">Active Tasks</h2>
                    {data.activeTasks?.length > 0 ? (
                      <div className="space-y-3">{data.activeTasks.map((t) => <TaskCard key={t.id} task={t} />)}</div>
                    ) : <div className="bg-white rounded-xl border border-gray-100 p-12 text-center"><p className="text-gray-500">No active tasks</p></div>}
                  </div>
                )}

                {activeTab === 'completed' && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-extrabold text-gray-900">Completed Tasks</h2>
                    {data.completedTasks?.length > 0 ? (
                      <div className="space-y-3">{data.completedTasks.map((t) => <TaskCard key={t.id} task={t} />)}</div>
                    ) : <div className="bg-white rounded-xl border border-gray-100 p-12 text-center"><p className="text-gray-500">No completed tasks yet</p></div>}
                  </div>
                )}

                {activeTab === 'earnings' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-extrabold text-gray-900">Earnings & Wallet</h2>
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
                      <p className="text-blue-100 text-sm">Total Earnings</p>
                      <p className="text-4xl font-extrabold mt-1">₹{data.earnings || 0}</p>
                      <div className="mt-4 flex gap-3">
                        <button className="bg-white text-primary-600 font-semibold py-2 px-5 rounded-lg text-sm hover:bg-gray-100 transition-all">Withdraw</button>
                        <button className="border border-white/30 text-white font-medium py-2 px-5 rounded-lg text-sm hover:bg-white/10 transition-all">View History</button>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                      <h3 className="font-bold text-gray-900 mb-3">Recent Transactions</h3>
                      <p className="text-gray-500 text-sm text-center py-4">No transactions yet</p>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-extrabold text-gray-900">My Reviews</h2>
                    {data.reviews?.length > 0 ? (
                      <div className="space-y-4">{data.reviews.map((r) => <ReviewCard key={r.id} review={r} />)}</div>
                    ) : <div className="bg-white rounded-xl border border-gray-100 p-12 text-center"><Star size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No reviews yet</p></div>}
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-extrabold text-gray-900">Settings</h2>
                    <form onSubmit={handleSettingsSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2"><User size={18} /> Profile Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                          <input type="text" value={settingsForm.name} onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                          <input type="email" value={settingsForm.email} onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                          <input type="tel" value={settingsForm.phone} onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">UPI ID</label>
                          <input type="text" value={settingsForm.upiId} onChange={(e) => setSettingsForm({ ...settingsForm, upiId: e.target.value })} placeholder="name@upi" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                        <textarea value={settingsForm.bio} onChange={(e) => setSettingsForm({ ...settingsForm, bio: e.target.value })} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" placeholder="Tell us about yourself..." />
                      </div>
                      <button type="submit" disabled={savingSettings} className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-all disabled:opacity-50">
                        {savingSettings ? 'Saving...' : 'Save Changes'}
                      </button>
                    </form>

                    <form onSubmit={handlePasswordChange} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
                      <h3 className="font-bold text-gray-900">Change Password</h3>
                      <div className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                          <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                          <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                          <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                      </div>
                      <button type="submit" disabled={changingPassword} className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-all disabled:opacity-50">
                        {changingPassword ? 'Changing...' : 'Change Password'}
                      </button>
                    </form>

                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                      <h3 className="font-bold text-gray-900 mb-4">Notification Preferences</h3>
                      <div className="space-y-3">
                        {['Email notifications for new offers', 'SMS notifications for messages', 'Push notifications for task updates', 'Marketing emails'].map((pref) => (
                          <label key={pref} className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                            <span className="text-sm text-gray-700">{pref}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
