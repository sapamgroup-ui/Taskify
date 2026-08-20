import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import ReviewCard from '../components/ReviewCard'
import TaskCard from '../components/TaskCard'
import { MapPin, Calendar, Star, Shield, CheckCircle2, Clock, Award, Flag, MessageSquare, Loader2, Briefcase, Edit, Play } from 'lucide-react'
import VerifiedBadge from '../components/VerifiedBadge'
import { formatDistanceToNow } from 'date-fns'

export default function UserProfile() {
  const { id } = useParams()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('about')
  const [userTasks, setUserTasks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/api/users/${id}`)
        setProfile(res.data.user || res.data)
      } catch (err) {
        toast.error('User not found')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [id])

  useEffect(() => {
    if (activeTab === 'posts' && id) {
      const fetchTasks = async () => {
        setLoadingTasks(true)
        try {
          const res = await axios.get(`/api/tasks?posterId=${id}&limit=50`)
          setUserTasks(res.data.tasks || [])
        } catch { setUserTasks([]) } finally { setLoadingTasks(false) }
      }
      fetchTasks()
    }
  }, [activeTab, id])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
  if (!profile) return <div className="min-h-screen flex items-center justify-center text-gray-500">User not found</div>

  const tabs = ['about', 'posts', 'reviews', 'portfolio']

  const isOwnProfile = currentUser && currentUser.id === profile.id
  const portfolioPhotos = profile.portfolio_photos || profile.portfolioPhotos || []
  const portfolioVideoUrl = profile.portfolio_video_url || profile.portfolioVideoUrl || ''
  const portfolioVideoFile = profile.portfolio_video_file || profile.portfolioVideoFile || ''
  const workCategories = profile.work_categories || profile.workCategories || []
  const hourlyRate = profile.hourly_rate || profile.hourlyRate

  const getEmbedUrl = (url) => {
    if (!url) return ''
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    return url
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-600"></div>
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
              <div className="w-24 h-24 bg-white rounded-2xl border-4 border-white shadow-md flex items-center justify-center">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <span className="text-3xl font-extrabold text-primary-600">{profile.name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <div className="flex-1 mt-2 sm:mt-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-gray-900">{profile.name}</h1>
                  {(profile.verified || profile.verification_status === 'approved') && <VerifiedBadge size="sm" />}
                </div>
                {isOwnProfile && !profile.verified && profile.verification_status !== 'approved' && (
                  <Link to="/verify" className="text-sm text-blue-500 hover:text-blue-600 font-medium mt-1 inline-block">Get Verified →</Link>
                )}
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  {profile.location && <span className="flex items-center gap-1"><MapPin size={14} /> {typeof profile.location === 'string' ? profile.location : `${profile.location.city || ''}${profile.location.city && profile.location.state ? ', ' : ''}${profile.location.state || ''}`}</span>}
                  <span className="flex items-center gap-1"><Calendar size={14} /> Member since {profile.createdAt ? new Date(profile.createdAt).getFullYear() : '2024'}</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={16} className={i < (profile.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                  ))}
                  <span className="text-sm text-gray-500 ml-1">{profile.rating?.toFixed(1) || '0.0'} ({profile.totalReviews || profile.total_reviews || 0} reviews)</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4 sm:mt-0">
                {isOwnProfile ? (
                  <Link to="/edit-profile" className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2.5 px-5 rounded-lg transition-all text-sm shadow-sm">
                    <Edit size={16} /> Edit Profile
                  </Link>
                ) : (
                  <>
                    {currentUser && (
                      <button className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2.5 px-5 rounded-lg transition-all text-sm shadow-sm">
                        <MessageSquare size={16} /> Contact
                      </button>
                    )}
                    {currentUser && (
                      <button className="flex items-center gap-2 border border-gray-300 text-gray-600 hover:border-red-300 hover:text-red-500 font-medium py-2.5 px-4 rounded-lg transition-all text-sm">
                        <Flag size={16} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              {[
                { label: 'Completed Tasks', value: profile.completedTasks || profile.completed_tasks || 0, icon: CheckCircle2 },
                { label: 'Completion Rate', value: `${profile.completionRate || profile.completion_rate || 0}%`, icon: Award },
                { label: 'Response Time', value: profile.responseTime || profile.response_time || '< 1hr', icon: Clock },
                { label: 'Member Since', value: profile.createdAt ? new Date(profile.createdAt).getFullYear() : '2024', icon: Calendar },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-50 rounded-xl p-4 text-center">
                  <stat.icon size={20} className="mx-auto mb-1 text-primary-500" />
                  <div className="font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-1 mt-6 bg-white rounded-xl border border-gray-100 p-1">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all capitalize ${activeTab === tab ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === 'about' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
              {profile.bio && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{profile.bio}</p>
                </div>
              )}
              {profile.skills?.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <span key={skill} className="bg-primary-50 text-primary-700 text-sm font-medium px-3 py-1.5 rounded-full">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
              {workCategories.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Work Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {workCategories.map((cat) => (
                      <span key={cat} className="bg-accent-50 text-accent-700 text-sm font-medium px-3 py-1.5 rounded-full">{cat}</span>
                    ))}
                  </div>
                </div>
              )}
              {hourlyRate && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Hourly Rate</h3>
                  <span className="text-lg font-bold text-primary-600">₹{hourlyRate}/hr</span>
                </div>
              )}
              {!profile.bio && (!profile.skills || profile.skills.length === 0) && workCategories.length === 0 && !hourlyRate && (
                <p className="text-gray-500 text-sm text-center py-8">No information added yet.</p>
              )}
            </div>
          )}

          {activeTab === 'posts' && (
            <div>
              {loadingTasks ? (
                <div className="flex items-center justify-center py-12"><Loader2 size={28} className="animate-spin text-primary-500" /></div>
              ) : userTasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userTasks.map(task => <TaskCard key={task.id} task={task} />)}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                  <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No posts yet</p>
                  {isOwnProfile && (
                    <Link to="/post-task" className="inline-flex items-center gap-2 mt-3 text-primary-500 hover:text-primary-600 font-medium text-sm">
                      Post your first task
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {profile.reviews?.length > 0 ? (
                profile.reviews.map((review) => <ReviewCard key={review.id} review={review} />)
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                  <Star size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No reviews yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              {portfolioPhotos.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Photo Gallery</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {portfolioPhotos.map((photo, i) => (
                      <div key={i} className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(portfolioVideoUrl || portfolioVideoFile) && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Video</h3>
                  {portfolioVideoUrl && (
                    <div className="aspect-video rounded-xl overflow-hidden mb-3">
                      <iframe
                        src={getEmbedUrl(portfolioVideoUrl)}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  )}
                  {portfolioVideoFile && (
                    <div className="aspect-video rounded-xl overflow-hidden bg-gray-900">
                      <video src={portfolioVideoFile} controls className="w-full h-full" />
                    </div>
                  )}
                </div>
              )}

              {portfolioPhotos.length === 0 && !portfolioVideoUrl && !portfolioVideoFile && (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                  <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No portfolio items yet</p>
                  {isOwnProfile && (
                    <Link to="/edit-profile" className="inline-flex items-center gap-2 mt-3 text-primary-500 hover:text-primary-600 font-medium text-sm">
                      <Edit size={14} /> Add portfolio items
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
