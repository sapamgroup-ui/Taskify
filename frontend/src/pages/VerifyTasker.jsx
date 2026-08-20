import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { ShieldCheck, Upload, CheckCircle, Clock, XCircle, Loader2, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function VerifyTasker() {
  const { user } = useAuth()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [doc1, setDoc1] = useState(null)
  const [doc2, setDoc2] = useState(null)
  const [verification, setVerification] = useState(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get('/api/verification/status')
        setStatus(res.data.status || 'none')
        setVerification(res.data.verification || null)
      } catch {
        setStatus('none')
      } finally {
        setLoading(false)
      }
    }
    fetchStatus()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!doc1 || !doc2) {
      toast.error('Please upload both documents')
      return
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('document1', doc1)
      formData.append('document2', doc2)
      await axios.post('/api/verification/request', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Verification request submitted!')
      setStatus('pending')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit verification request')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-500 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
            <ShieldCheck size={48} className="text-white" />
          </div>

          <div className="p-8">
            {status === 'approved' ? (
              <div className="text-center">
                <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
                <h1 className="text-2xl font-extrabold text-gray-900 mb-2">You are verified ✓</h1>
                <p className="text-gray-500 mb-2">Your account has been verified.</p>
                {verification?.verifiedAt && (
                  <p className="text-sm text-gray-400">Verified on {new Date(verification.verifiedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                )}
              </div>
            ) : status === 'pending' ? (
              <div className="text-center">
                <Clock size={64} className="mx-auto text-yellow-500 mb-4" />
                <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Verification under review</h1>
                <p className="text-gray-500">Our team is reviewing your documents. This usually takes within 48 hours.</p>
              </div>
            ) : status === 'rejected' ? (
              <div className="text-center">
                <XCircle size={64} className="mx-auto text-red-500 mb-4" />
                <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Verification Rejected</h1>
                {verification?.rejectionReason && (
                  <p className="text-gray-500 mb-4">Reason: {verification.rejectionReason}</p>
                )}
                <p className="text-gray-500 mb-6">You can re-apply with updated documents.</p>
                <button
                  onClick={() => setStatus('none')}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-all"
                >
                  Re-Apply
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Become a Verified Tasker</h1>
                  <p className="text-gray-500 leading-relaxed">
                    Get verified to build trust. Verified taskers get a badge, higher visibility, and clients trust you more.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
                  <h3 className="font-bold text-blue-900 mb-2">Requirements</h3>
                  <p className="text-sm text-blue-700">You need 2 forms of government-issued ID (Aadhaar, PAN, Passport, Driver's License)</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-5 mb-8">
                  <h3 className="font-bold text-gray-900 mb-3">How it works</h3>
                  <ol className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <span className="text-sm text-gray-600">Upload two ID documents</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <span className="text-sm text-gray-600">Pay ₹1,000/year verification fee</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <span className="text-sm text-gray-600">Our team reviews within 48 hours</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                      <span className="text-sm text-gray-600">Get your verified badge</span>
                    </li>
                  </ol>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Document 1</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload size={24} className="mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">{doc1 ? doc1.name : 'Click to upload (Image/PDF)'}</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setDoc1(e.target.files[0])} />
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Document 2</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload size={24} className="mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">{doc2 ? doc2.name : 'Click to upload (Image/PDF)'}</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setDoc2(e.target.files[0])} />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !doc1 || !doc2}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <><Loader2 size={18} className="animate-spin" /> Submitting...</>
                    ) : (
                      <><ShieldCheck size={18} /> Submit Verification Request</>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
