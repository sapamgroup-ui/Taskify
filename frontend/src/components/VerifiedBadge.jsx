import { ShieldCheck } from 'lucide-react'

export default function VerifiedBadge({ size = 'sm', className = '' }) {
  const sizes = {
    sm: 16,
    md: 20,
    lg: 28,
  }

  return (
    <ShieldCheck
      size={sizes[size] || sizes.sm}
      className={`text-blue-500 flex-shrink-0 ${className}`}
    />
  )
}
