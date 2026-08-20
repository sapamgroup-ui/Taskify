import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { User, Phone, MapPin, Upload, X, Link as LinkIcon, Video, Briefcase, Settings, CreditCard, Mail, Lock, Loader2, Camera, Plus, DollarSign } from 'lucide-react'

const CATEGORIES = [
  'Home Cleaning', 'Plumbing', 'Electrical', 'Painting', 'Carpentry',
  'Moving', 'Gardening', 'Tutoring', 'Photography', 'Web Development',
  'Design', 'Writing'
]

export default function EditProfile() {
  const { user, updateProfile, fetchUser } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('basic')
  const [saving, setSaving] = useState(false)
  const photoInputRef = useRef(null)
  const videoFileInputRef = useRef(null)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    bio: '',
    city: '',
    state: '',
    avatar: '',
    portfolioPhotos: [],
    portfolioVideoUrl: '',
    portfolioVideoFile: '',
    skills: [],
    workCategories: [],
    hourlyRate: '',
    upiId: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })

  const [skillInput, setSkillInput] = useState('')
  const [videoPreview, setVideoPreview] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        bio: user.bio || '',
        city: user.location?.city || (typeof user.location === 'string' ? user.location.split(',')[0]?.trim() : '') || '',
        state: user.location?.state || (typeof user.location === 'string' ? user.location.split(',')[1]?.trim() : '') || '',
        avatar: user.avatar || '',
        portfolioPhotos: user.portfolio_photos || user.portfolioPhotos || [],
        portfolioVideoUrl: user.portfolio_video_url || user.portfolioVideoUrl || '',
        portfolioVideoFile: user.portfolio_video_file || user.portfolioVideoFile || '',
        skills: user.skills || [],
        workCategories: user.work_categories || user.workCategories || [],
        hourlyRate: user.hourly_rate || user.hourlyRate || '',
        upiId: user.upi_id || user.upiId || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    setUploadingPhoto(true)
    try {
      const res = await axios.post('/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm((prev) => ({ ...prev, avatar: res.data.url || res.data.fileUrl }))
      toast.success('Avatar uploaded')
    } catch {
      toast.error('Failed to upload avatar')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handlePortfolioPhotoUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    if (form.portfolioPhotos.length + files.length > 10) {
      toast.error('Maximum 10 photos allowed')
      return
    }
    setUploadingPhoto(true)
    try {
      const urls = []
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await axios.post('/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        urls.push(res.data.url || res.data.fileUrl)
      }
      setForm((prev) => ({ ...prev, portfolioPhotos: [...prev.portfolioPhotos, ...urls] }))
      toast.success(`${files.length} photo(s) uploaded`)
    } catch {
      toast.error('Failed to upload photos')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const removePortfolioPhoto = (index) => {
    setForm((prev) => ({ ...prev, portfolioPhotos: prev.portfolioPhotos.filter((_, i) => i !== index) }))
  }

  const handleVideoFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Video must be under 10MB')
      return
    }
    const formData = new FormData()
    formData.append('file', file)
    setUploadingPhoto(true)
    try {
      const res = await axios.post('/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      const url = res.data.url || res.data.fileUrl
      setForm((prev) => ({ ...prev, portfolioVideoFile: url }))
      setVideoPreview(url)
      toast.success('Video uploaded')
    } catch {
      toast.error('Failed to upload video')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !form.skills.includes(s)) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, s] }))
      setSkillInput('')
    }
  }

  const removeSkill = (skill) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }))
  }

  const toggleCategory = (cat) => {
    setForm((prev) => ({
      ...prev,
      workCategories: prev.workCategories.includes(cat)
        ? prev.workCategories.filter((c) => c !== cat)
        : [...prev.workCategories, cat],
    }))
  }

  const handleSaveBasic = async () => {
    setSaving(true)
    try {
      await updateProfile({
        name: form.name,
        phone: form.phone,
        bio: form.bio,
        location: { city: form.city, state: form.state },
        avatar: form.avatar,
      })
      await fetchUser()
    } catch {
    } finally {
      setSaving(false)
    }
  }

  const handleSavePortfolio = async () => {
    setSaving(true)
    try {
      await axios.put('/api/users/portfolio', {
        portfolio_photos: form.portfolioPhotos,
        portfolio_video_url: form.portfolioVideoUrl,
        portfolio_video_file: form.portfolioVideoFile,
      })
      await fetchUser()
      toast.success('Portfolio updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save portfolio')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveWork = async () => {
    setSaving(true)
    try {
      await axios.put('/api/users/portfolio', {
        skills: form.skills,
        work_categories: form.workCategories,
        hourly_rate: form.hourlyRate ? Number(form.hourlyRate) : null,
      })
      await fetchUser()
      toast.success('Work info updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save work info')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSettings = async () => {
    if (form.newPassword && form.newPassword !== form.confirmNewPassword) {
      toast.error('Passwords do not match')
      return
    }
    setSaving(true)
    try {
      if (form.upiId || form.email) {
        await axios.put('/api/users/portfolio', { upi_id: form.upiId })
      }
      if (form.email !== user.email) {
        await updateProfile({ email: form.email })
      }
      if (form.newPassword) {
        await axios.put('/api/auth/profile', {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        })
      }
      await fetchUser()
      toast.success('Settings updated!')
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmNewPassword: '' }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'portfolio', label: 'Portfolio', icon: Camera },
    { id: 'work', label: 'Work', icon: Briefcase },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Edit Profile</h1>

        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 flex-1 py-2.5 px-3 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'basic' && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                {form.avatar ? (
                  <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-primary-600">{form.name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <div>
                <button
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="text-sm font-medium text-primary-500 hover:text-primary-600 flex items-center gap-1"
                >
                  {uploadingPhoto ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploadingPhoto ? 'Uploading...' : 'Change Avatar'}
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
              <textarea name="bio" value={form.bio} onChange={handleChange} rows={4} placeholder="Tell us about yourself..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" name="city" value={form.city} onChange={handleChange} placeholder="City" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                <input type="text" name="state" value={form.state} onChange={handleChange} placeholder="State" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
            </div>

            <button onClick={handleSaveBasic} disabled={saving} className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
              {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : 'Save Changes'}
            </button>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Photo Gallery</h3>
              <p className="text-sm text-gray-500 mb-4">Upload up to 10 photos to showcase your work</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {form.portfolioPhotos.map((photo, i) => (
                  <div key={i} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group">
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePortfolioPhoto(i)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {form.portfolioPhotos.length < 10 && (
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-all"
                  >
                    {uploadingPhoto ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <>
                        <Plus size={24} />
                        <span className="text-xs font-medium">Add Photo</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePortfolioPhotoUpload}
                className="hidden"
              />
              <p className="text-xs text-gray-400">{form.portfolioPhotos.length}/10 photos</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Video</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">YouTube / Vimeo URL</label>
                  <div className="relative">
                    <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      name="portfolioVideoUrl"
                      value={form.portfolioVideoUrl}
                      onChange={handleChange}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Or upload video (max 10MB)</label>
                  <button
                    onClick={() => videoFileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="w-full border-2 border-dashed border-gray-300 rounded-xl py-8 flex flex-col items-center gap-2 text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-all"
                  >
                    <Video size={32} />
                    <span className="text-sm font-medium">
                      {uploadingPhoto ? 'Uploading...' : form.portfolioVideoFile ? 'Video uploaded - click to replace' : 'Click to upload video'}
                    </span>
                    <span className="text-xs text-gray-400">MP4, MOV up to 10MB</span>
                  </button>
                  <input
                    ref={videoFileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileUpload}
                    className="hidden"
                  />
                </div>
                {(videoPreview || form.portfolioVideoFile) && (
                  <video
                    src={videoPreview || form.portfolioVideoFile}
                    controls
                    className="w-full rounded-xl"
                  />
                )}
              </div>
            </div>

            <button onClick={handleSavePortfolio} disabled={saving} className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
              {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : 'Save Portfolio'}
            </button>
          </div>
        )}

        {activeTab === 'work' && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                  placeholder="Add a skill and press Enter"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button onClick={addSkill} className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all">
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.skills.map((skill) => (
                  <span key={skill} className="bg-primary-50 text-primary-700 text-sm font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="hover:text-primary-900">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work Categories</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all text-left ${
                      form.workCategories.includes(cat)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Hourly Rate (₹)</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="hourlyRate"
                  value={form.hourlyRate}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <button onClick={handleSaveWork} disabled={saving} className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
              {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : 'Save Work Info'}
            </button>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Payment</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">UPI ID</label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="upiId"
                    value={form.upiId}
                    onChange={handleChange}
                    placeholder="yourname@upi"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Email</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="password" name="currentPassword" value={form.currentPassword} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="password" name="newPassword" value={form.newPassword} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="password" name="confirmNewPassword" value={form.confirmNewPassword} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handleSaveSettings} disabled={saving} className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
              {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : 'Save Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
