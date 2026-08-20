import { Link } from 'react-router-dom'
import { Wrench, Truck, Trees, Paintbrush, Droplets, Zap, Camera, Globe, Code, BookOpen, Home, Briefcase, Hammer, Heart, CalendarDays, Utensils, Dog, Car, Shirt, Baby, Music, ShieldCheck, Scissors, Sofa } from 'lucide-react'

const categories = [
  { name: 'Cleaning', icon: Home, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
  { name: 'Handyman', icon: Wrench, color: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
  { name: 'Delivery', icon: Truck, color: 'bg-green-50 text-green-600 hover:bg-green-100' },
  { name: 'Gardening', icon: Trees, color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
  { name: 'Painting', icon: Paintbrush, color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
  { name: 'Plumbing', icon: Droplets, color: 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100' },
  { name: 'Electrical', icon: Zap, color: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' },
  { name: 'Moving', icon: Briefcase, color: 'bg-red-50 text-red-600 hover:bg-red-100' },
  { name: 'Photography', icon: Camera, color: 'bg-pink-50 text-pink-600 hover:bg-pink-100' },
  { name: 'Design', icon: Globe, color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' },
  { name: 'Web Dev', icon: Code, color: 'bg-violet-50 text-violet-600 hover:bg-violet-100' },
  { name: 'Tutoring', icon: BookOpen, color: 'bg-teal-50 text-teal-600 hover:bg-teal-100' },
  { name: 'Construction', icon: Hammer, color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
  { name: 'Catering', icon: Utensils, color: 'bg-rose-50 text-rose-600 hover:bg-rose-100' },
  { name: 'Event Planning', icon: CalendarDays, color: 'bg-fuchsia-50 text-fuchsia-600 hover:bg-fuchsia-100' },
  { name: 'Wedding', icon: Heart, color: 'bg-pink-50 text-pink-600 hover:bg-pink-100' },
  { name: 'Pet Care', icon: Dog, color: 'bg-lime-50 text-lime-600 hover:bg-lime-100' },
  { name: 'Car Wash', icon: Car, color: 'bg-sky-50 text-sky-600 hover:bg-sky-100' },
  { name: 'Tailoring', icon: Scissors, color: 'bg-violet-50 text-violet-600 hover:bg-violet-100' },
  { name: 'Babysitting', icon: Baby, color: 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100' },
  { name: 'Security', icon: ShieldCheck, color: 'bg-slate-50 text-slate-600 hover:bg-slate-100' },
  { name: 'Interior', icon: Sofa, color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' },
  { name: 'Music', icon: Music, color: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
  { name: 'Laundry', icon: Shirt, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
]

export default function CategoryGrid({ compact = false }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
      {categories.map((cat) => {
        const Icon = cat.icon
        return (
          <Link
            key={cat.name}
            to={`/category/${cat.name}`}
            className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl ${cat.color} transition-all duration-200 hover:scale-105 hover:shadow-md`}
          >
            <Icon size={20} className="mb-1 sm:mb-1.5" />
            <span className="font-medium text-[10px] sm:text-xs leading-tight text-center">{cat.name}</span>
          </Link>
        )
      })}
    </div>
  )
}

export { categories }
