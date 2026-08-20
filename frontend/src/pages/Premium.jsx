import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Check, Crown, MessageCircle, Zap, Star, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: '',
    description: 'Get started with basic features',
    color: 'gray',
    features: [
      '1 reply per month',
      '2 posts per month',
      'Basic profile',
      'Browse all tasks',
    ],
  },
  {
    id: 'per_reply',
    name: 'Per Reply',
    price: '₹50',
    period: 'per reply',
    description: 'Pay only when you need to reply',
    color: 'accent',
    features: [
      '1 reply per purchase',
      'One-off payment, no commitment',
      'Enhanced profile badge',
      'Browse all tasks',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '₹200',
    period: '/month',
    description: 'Great for occasional users',
    color: 'primary',
    features: [
      '7 replies per month',
      '7 posts per month',
      'Premium profile badge',
      'Priority support',
      'Browse all tasks',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₹500',
    period: '/month',
    description: 'Best value — includes Verified badge',
    color: 'primary',
    popular: true,
    features: [
      '50 replies per month',
      '50 posts per month',
      'Verified Tasker badge',
      'Premium profile badge',
      'Priority support',
      'Browse all tasks',
      'Early access to new features',
    ],
  },
  {
    id: 'verified',
    name: 'Verified Tasker',
    price: '₹1,000',
    period: '/year',
    description: 'Get verified and build trust',
    color: 'blue',
    features: [
      'Verified badge on profile',
      'Higher search ranking',
      'Increased client trust',
      'Priority support',
    ],
  },
]

export default function Premium() {
  const { user } = useAuth()
  const [purchasing, setPurchasing] = useState(null)

  const handleBuy = async (planId) => {
    if (!user) {
      toast.error('Please login to purchase a plan')
      return
    }
    setPurchasing(planId)
    try {
      const res = await axios.post('/api/subscriptions', { plan: planId })
      toast.success(res.data.message || 'Subscription activated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to purchase plan')
    } finally {
      setPurchasing(null)
    }
  }

  const currentPlan = user?.subscription?.plan || 'free'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-500 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Crown size={16} /> Premium Plans
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Choose Your Plan</h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Posting tasks is always free. Upgrade to unlock commenting and premium features.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-6 mb-8">
          {plans.map((plan) => {
            const isActive = currentPlan === plan.id
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl border-2 p-6 transition-all ${
                  plan.popular
                    ? 'border-primary-500 shadow-lg shadow-primary-500/10'
                    : isActive
                    ? 'border-green-500'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                    <Star size={12} className="fill-white" /> Most Popular
                  </div>
                )}

                {isActive && (
                  <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Current Plan
                  </div>
                )}

                <div className="text-center mb-6 pt-2">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    {plan.period && <span className="text-gray-500 text-sm">{plan.period}</span>}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check size={16} className={`mt-0.5 flex-shrink-0 ${
                        plan.popular ? 'text-primary-500' : plan.color === 'accent' ? 'text-accent-500' : 'text-gray-400'
                      }`} />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleBuy(plan.id)}
                  disabled={isActive || purchasing === plan.id}
                  className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    isActive
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-md hover:shadow-lg'
                      : plan.color === 'accent'
                      ? 'bg-accent-500 hover:bg-accent-600 text-white shadow-md hover:shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {purchasing === plan.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : isActive ? (
                    'Current Plan'
                  ) : plan.id === 'per_reply' ? (
                    <><Zap size={16} /> Get Started</>
                  ) : plan.id === 'basic' ? (
                    <><MessageCircle size={16} /> Choose Basic</>
                  ) : plan.id === 'premium' ? (
                    <>                    <Crown size={16} /> Subscribe Now</>
                  ) : plan.id === 'verified' ? (
                    <Link to="/verify" onClick={() => setPurchasing(null)}><ShieldCheck size={16} /> Get Verified</Link>
                  ) : (
                    'Free'
                  )}
                </button>
              </div>
            )
          })}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
          <MessageCircle size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">Posting and browsing are free.</span>{' '}
            Upgrade your plan to reply to tasks and post more.
          </p>
        </div>
      </div>
    </div>
  )
}
