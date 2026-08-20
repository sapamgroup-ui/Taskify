import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import CategoryGrid from '../components/CategoryGrid'
import { Upload, X, MapPin, Calendar, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Image } from 'lucide-react'

const steps = ['Task Type', 'Category', 'Details', 'Location', 'Budget', 'Schedule', 'Review']

export default function PostTask() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    taskType: searchParams.get('taskType') || 'need_help',
    category: searchParams.get('category') || '',
    title: '',
    description: '',
    photos: [],
    location: { address: '', city: '', state: '', pincode: '' },
    budget: { min: '', max: '' },
    scheduledDate: '',
    scheduledTime: '',
  })

  const updateForm = (updates) => setForm((prev) => ({ ...prev, ...updates }))
  const updateLocation = (updates) => setForm((prev) => ({ ...prev, location: { ...prev.location, ...updates } }))
  const updateBudget = (updates) => setForm((prev) => ({ ...prev, budget: { ...prev.budget, ...updates } }))

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files)
    if (form.photos.length + files.length > 5) { toast.error('Max 5 photos allowed'); return }
    const newPhotos = files.map((file) => ({ file, preview: URL.createObjectURL(file) }))
    updateForm({ photos: [...form.photos, ...newPhotos] })
  }

  const removePhoto = (index) => {
    const photos = [...form.photos]
    URL.revokeObjectURL(photos[index].preview)
    photos.splice(index, 1)
    updateForm({ photos })
  }

  const categoryMap = {
    'Cleaning': 'cleaning', 'Handyman': 'handyman', 'Delivery': 'delivery',
    'Gardening': 'gardening', 'Painting': 'painting', 'Plumbing': 'plumbing',
    'Electrical': 'electrical', 'Moving': 'moving', 'Photography': 'photography',
    'Design': 'design', 'Web Dev': 'web_development', 'Tutoring': 'tutoring',
    'Construction': 'construction', 'Catering': 'catering', 'Event Planning': 'event_planning',
    'Wedding': 'wedding', 'Pet Care': 'pet_care', 'Car Wash': 'car_wash',
    'Tailoring': 'tailoring', 'Babysitting': 'babysitting', 'Security': 'security',
    'Interior': 'interior', 'Music': 'music', 'Laundry': 'laundry', 'Other': 'other'
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const formData = new FormData()
      formData.append('category', categoryMap[form.category] || form.category)
      formData.append('taskType', form.taskType)
      formData.append('title', form.title)
      formData.append('description', form.description)
      formData.append('location_address', form.location.address)
      formData.append('location_city', form.location.city)
      formData.append('location_state', form.location.state)
      formData.append('location_pincode', form.location.pincode)
      formData.append('budget_min', Number(form.budget.min))
      formData.append('budget_max', Number(form.budget.max))
      if (form.scheduledDate) formData.append('scheduledDate', form.scheduledDate)
      if (form.scheduledTime) formData.append('scheduledTime', form.scheduledTime)
      form.photos.forEach((p) => formData.append('photos', p.file))

      const res = await axios.post('/api/tasks', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Task posted successfully!')
      navigate(`/tasks/${res.data.task.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post task')
    } finally {
      setSubmitting(false)
    }
  }

  const canNext = () => {
    switch (currentStep) {
      case 0: return form.taskType
      case 1: return form.category
      case 2: return form.title && form.description
      case 3: return form.location.city
      case 4: return form.budget.min && form.budget.max
      case 5: return true
      default: return true
    }
  }

  const wordCount = form.description.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-3">
              {steps.map((step, i) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center gap-2 ${i <= currentStep ? 'text-primary-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i < currentStep ? 'bg-primary-500 text-white' : i === currentStep ? 'bg-primary-100 text-primary-600 ring-2 ring-primary-500' : 'bg-gray-100 text-gray-400'}`}>
                      {i < currentStep ? <CheckCircle2 size={16} /> : i + 1}
                    </div>
                    <span className="text-xs font-medium hidden sm:inline">{step}</span>
                  </div>
                  {i < steps.length - 1 && <div className={`w-8 sm:w-12 h-0.5 mx-1 ${i < currentStep ? 'bg-primary-500' : 'bg-gray-200'}`}></div>}
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 pb-6">
            {currentStep === 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">What would you like to do?</h2>
                <p className="text-gray-500 text-sm mb-6">Choose whether you need help or are offering your services</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={() => updateForm({ taskType: 'need_help' })} className={`p-6 rounded-xl text-left border-2 transition-all ${form.taskType === 'need_help' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="text-3xl mb-3">🙋</div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">I Need Help</h3>
                    <p className="text-sm text-gray-500">Post a task and get offers from Taskers</p>
                  </button>
                  <button onClick={() => updateForm({ taskType: 'offering_help' })} className={`p-6 rounded-xl text-left border-2 transition-all ${form.taskType === 'offering_help' ? 'border-accent-500 bg-accent-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="text-3xl mb-3">💪</div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">I'm a Tasker</h3>
                    <p className="text-sm text-gray-500">Offer your services and find clients</p>
                  </button>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{form.taskType === 'need_help' ? 'What do you need done?' : 'What service do you offer?'}</h2>
                <p className="text-gray-500 text-sm mb-6">Choose a category that best describes your {form.taskType === 'need_help' ? 'task' : 'service'}</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {['Cleaning', 'Handyman', 'Delivery', 'Gardening', 'Painting', 'Plumbing', 'Electrical', 'Moving', 'Photography', 'Design', 'Web Dev', 'Tutoring', 'Other'].map((cat) => (
                    <button key={cat} onClick={() => updateForm({ category: cat })} className={`py-3 px-3 rounded-xl text-sm font-medium border-2 transition-all ${form.category === cat ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Task Details</h2>
                <p className="text-gray-500 text-sm mb-6">Describe your task in detail</p>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Task Title</label>
                    <input type="text" value={form.title} onChange={(e) => updateForm({ title: e.target.value })} placeholder="e.g. Help me move furniture" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" maxLength={100} />
                    <span className="text-xs text-gray-400 mt-1 block text-right">{form.title.length}/100</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                    <textarea value={form.description} onChange={(e) => updateForm({ description: e.target.value })} placeholder="Describe what needs to be done, any specific requirements, tools needed, etc." rows={5} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none" />
                    <span className="text-xs text-gray-400 mt-1 block text-right">{wordCount} words</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Photos (optional, max 5)</label>
                    <div className="flex flex-wrap gap-3">
                      {form.photos.map((photo, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                          <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><X size={12} /></button>
                        </div>
                      ))}
                      {form.photos.length < 5 && (
                        <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 transition-all">
                          <Image size={20} className="text-gray-400" />
                          <span className="text-xs text-gray-400 mt-1">Add</span>
                          <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Where do you need it done?</h2>
                <p className="text-gray-500 text-sm mb-6">Add your location so we can find Taskers near you</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Street Address</label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
                      <input type="text" value={form.location.address} onChange={(e) => updateLocation({ address: e.target.value })} placeholder="123 Main Street" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                      <input type="text" value={form.location.city} onChange={(e) => updateLocation({ city: e.target.value })} placeholder="Mumbai" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                      <input type="text" value={form.location.state} onChange={(e) => updateLocation({ state: e.target.value })} placeholder="Maharashtra" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Pincode</label>
                    <input type="text" value={form.location.pincode} onChange={(e) => updateLocation({ pincode: e.target.value })} placeholder="400001" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Set your budget</h2>
                <p className="text-gray-500 text-sm mb-6">How much are you willing to pay?</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Minimum (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                        <input type="number" min="1" value={form.budget.min} onChange={(e) => updateBudget({ min: e.target.value })} placeholder="500" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Maximum (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                        <input type="number" min="1" value={form.budget.max} onChange={(e) => updateBudget({ max: e.target.value })} placeholder="2000" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                    <p className="font-medium">Tip: Set a competitive budget to attract more Taskers.</p>
                    <p className="mt-1 text-blue-600">AllTasker charges a small service fee on completed tasks.</p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">When do you need it done?</h2>
                <p className="text-gray-500 text-sm mb-6">Choose a date and time (optional)</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Date</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="date" value={form.scheduledDate} onChange={(e) => updateForm({ scheduledDate: e.target.value })} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Time</label>
                    <select value={form.scheduledTime} onChange={(e) => updateForm({ scheduledTime: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                      <option value="">Any time</option>
                      <option value="morning">Morning (8am - 12pm)</option>
                      <option value="afternoon">Afternoon (12pm - 5pm)</option>
                      <option value="evening">Evening (5pm - 9pm)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Review Your Task</h2>
                <p className="text-gray-500 text-sm mb-6">Make sure everything looks good before posting</p>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-primary-600 bg-primary-100 px-2.5 py-1 rounded-full">{form.category}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{form.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 whitespace-pre-line">{form.description}</p>
                    {form.photos.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {form.photos.map((p, i) => (
                          <img key={i} src={p.preview} alt="" className="w-16 h-16 rounded-lg object-cover" />
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <span className="text-gray-400 text-xs">Budget</span>
                        <p className="font-bold text-primary-600">₹{form.budget.min} - ₹{form.budget.max}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <span className="text-gray-400 text-xs">Location</span>
                        <p className="font-semibold text-gray-900">{form.location.city}{form.location.state ? `, ${form.location.state}` : ''}</p>
                      </div>
                      {form.scheduledDate && (
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <span className="text-gray-400 text-xs">Date</span>
                          <p className="font-semibold text-gray-900">{form.scheduledDate}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
              <button onClick={() => setCurrentStep((s) => s - 1)} disabled={currentStep === 0} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ArrowLeft size={18} /> Back
              </button>
              {currentStep < steps.length - 1 ? (
                <button onClick={() => setCurrentStep((s) => s + 1)} disabled={!canNext()} className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  Next <ArrowRight size={18} />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50">
                  {submitting ? <><Loader2 size={18} className="animate-spin" /> Posting...</> : form.taskType === 'offering_help' ? 'Offer Service' : 'Post Task'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
