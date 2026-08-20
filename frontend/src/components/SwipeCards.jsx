import { useState, useRef } from 'react'
import { MapPin, Clock, Users, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function SwipeCards({ tasks, onBrowseAll }) {
  const [cards, setCards] = useState(tasks)
  const [gone] = useState(() => new Set())
  const [swiped, setSwiped] = useState([])
  const [dragging, setDragging] = useState(false)
  const [dir, setDir] = useState(0)
  const cardRef = useRef(null)
  const startX = useRef(0)
  const currentX = useRef(0)

  const handleStart = (clientX) => {
    startX.current = clientX
    currentX.current = 0
    setDragging(true)
  }

  const handleMove = (clientX) => {
    if (!dragging) return
    const dx = clientX - startX.current
    currentX.current = dx
    setDir(dx > 0 ? 1 : -1)
    if (cardRef.current) {
      const rotation = dx * 0.08
      const opacity = Math.min(Math.abs(dx) / 120, 1)
      cardRef.current.style.transform = `translateX(${dx}px) rotate(${rotation}deg)`
      cardRef.current.style.opacity = 1 - opacity * 0.3
    }
  }

  const handleEnd = () => {
    if (!dragging) return
    setDragging(false)
    const threshold = 100
    if (Math.abs(currentX.current) > threshold) {
      flyOut(dir)
    } else {
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.4s ease, opacity 0.4s ease'
        cardRef.current.style.transform = 'translateX(0px) rotate(0deg)'
        cardRef.current.style.opacity = 1
        setTimeout(() => {
          if (cardRef.current) {
            cardRef.current.style.transition = ''
          }
        }, 400)
      }
      setDir(0)
    }
  }

  const flyOut = (direction) => {
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.4s ease, opacity 0.4s ease'
      cardRef.current.style.transform = `translateX(${direction * 600}px) rotate(${direction * 30}deg)`
      cardRef.current.style.opacity = 0
    }
    const top = cards[0]
    gone.add(top.id)
    setSwiped(prev => [top, ...prev])
    setTimeout(() => {
      setCards(prev => prev.slice(1))
      setDir(0)
    }, 350)
  }

  const undo = () => {
    if (swiped.length === 0) return
    const last = swiped[0]
    setSwiped(prev => prev.slice(1))
    setCards(prev => [last, ...prev])
    gone.delete(last.id)
  }

  const remaining = cards.length
  const showCards = cards.slice(0, 4)

  if (tasks.length === 0) return null

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-sm mx-auto" style={{ height: '420px' }}>
        {showCards.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <div className="text-5xl mb-3">🎉</div>
            <p className="font-semibold text-gray-600">All tasks swiped!</p>
            <button onClick={onBrowseAll} className="mt-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition-all">
              Browse All Tasks
            </button>
          </div>
        ) : (
          [...showCards].reverse().map((task, ri) => {
            const i = showCards.length - 1 - ri
            const isTop = i === 0
            return (
              <div
                key={task.id}
                ref={isTop ? cardRef : null}
                className="absolute inset-0 rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden select-none"
                style={{
                  zIndex: showCards.length - ri,
                  transform: isTop ? undefined : `scale(${1 - ri * 0.04}) translateY(${ri * 8}px)`,
                  opacity: isTop ? 1 : 1 - ri * 0.15,
                }}
                onMouseDown={isTop ? (e) => handleStart(e.clientX) : undefined}
                onMouseMove={isTop ? (e) => handleMove(e.clientX) : undefined}
                onMouseUp={isTop ? handleEnd : undefined}
                onMouseLeave={isTop ? handleEnd : undefined}
                onTouchStart={isTop ? (e) => handleStart(e.touches[0].clientX) : undefined}
                onTouchMove={isTop ? (e) => handleMove(e.touches[0].clientX) : undefined}
                onTouchEnd={isTop ? handleEnd : undefined}
              >
                {isTop && dir !== 0 && (
                  <div className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-opacity ${Math.abs(currentX.current) > 60 ? 'opacity-100' : 'opacity-0'}`}>
                    <div className={`text-6xl font-extrabold ${dir > 0 ? 'text-green-500' : 'text-red-500'} -rotate-12 border-4 ${dir > 0 ? 'border-green-500' : 'border-red-500'} rounded-xl px-4 py-1`}>
                      {dir > 0 ? 'BID' : 'SKIP'}
                    </div>
                  </div>
                )}
                <div className="h-44 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center relative">
                  <span className="text-6xl">{getCategoryEmoji(task.category)}</span>
                  {task.photos?.length > 0 && (
                    <img src={task.photos[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-accent-600 bg-accent-50 px-2 py-0.5 rounded-full">{task.category}</span>
                    <span className="font-bold text-primary-600">₹{task.budget?.min} - ₹{task.budget?.max}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">{task.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{task.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {task.location?.city && <span className="flex items-center gap-1"><MapPin size={12} /> {task.location.city}</span>}
                    {task.createdAt && <span className="flex items-center gap-1"><Clock size={12} /> {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>}
                    <span className="flex items-center gap-1"><Users size={12} /> {task.offers?.length || 0}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="flex items-center gap-4 mt-5">
        <button onClick={() => { if (showCards.length > 0) flyOut(-1) }} className="w-14 h-14 rounded-full bg-white border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 flex items-center justify-center transition-all shadow-sm">
          <ChevronLeft size={28} />
        </button>
        {swiped.length > 0 && (
          <button onClick={undo} className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-400 flex items-center justify-center transition-all">
            <RotateCcw size={18} />
          </button>
        )}
        <button onClick={() => { if (showCards.length > 0) flyOut(1) }} className="w-14 h-14 rounded-full bg-white border-2 border-green-200 text-green-500 hover:bg-green-50 hover:border-green-400 flex items-center justify-center transition-all shadow-sm">
          <ChevronRight size={28} />
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-3">{remaining} tasks remaining</p>
    </div>
  )
}

function getCategoryEmoji(cat) {
  const map = {
    cleaning: '🧹', handyman: '🔧', delivery: '📦', gardening: '🌿', painting: '🎨',
    plumbing: '🚿', electrical: '⚡', moving: '🚛', photography: '📸', design: '🎨',
    web_development: '💻', tutoring: '📚', cooking: '🍳', fitness: '💪', other: '📋',
  }
  return map[cat] || '📋'
}
