import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Send, Reply, ChevronDown, ChevronUp, Loader2, MessageCircle, Crown } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

function Comment({ comment, taskId, onReply, depth = 0 }) {
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showReplies, setShowReplies] = useState(depth === 0)
  const { user } = useAuth()

  const handleReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return
    setSubmitting(true)
    try {
      await onReply(replyText, comment._id || comment.id)
      setReplyText('')
      setShowReplyInput(false)
    } catch {
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 sm:ml-12' : ''}`}>
      <div className="flex gap-3 py-3">
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-primary-600">
            {comment.user?.name?.charAt(0) || comment.author?.name?.charAt(0) || 'U'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {comment.user?.name || comment.author?.name || 'Anonymous'}
            </span>
            <span className="text-xs text-gray-400">
              {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : ''}
            </span>
          </div>
          <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-line">{comment.text || comment.content}</p>
          {user && depth < 2 && (
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary-500 mt-1.5 font-medium transition-colors"
            >
              <Reply size={12} /> Reply
            </button>
          )}
        </div>
      </div>

      {showReplyInput && (
        <form onSubmit={handleReply} className="ml-11 mb-3 flex gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoFocus
          />
          <button
            type="submit"
            disabled={submitting || !replyText.trim()}
            className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-lg transition-all disabled:opacity-50 flex-shrink-0"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </form>
      )}

      {comment.replies?.length > 0 && (
        <div className="ml-8 sm:ml-11">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium mb-1"
          >
            {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
          </button>
          {showReplies && (
            <div className="space-y-0">
              {comment.replies.map((reply) => (
                <Comment
                  key={reply._id || reply.id}
                  comment={reply}
                  taskId={taskId}
                  onReply={onReply}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CommentSection({ taskId, onCommentCount }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [canComment, setCanComment] = useState(true)
  const [commentCount, setCommentCount] = useState(0)

  const fetchComments = async () => {
    try {
      const res = await axios.get(`/api/tasks/${taskId}/comments`)
      const data = res.data.comments || res.data
      setComments(Array.isArray(data) ? data : [])
      const count = Array.isArray(data) ? data.length : 0
      setCommentCount(count)
      onCommentCount?.(count)
    } catch {
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [taskId])

  const handlePostComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      await axios.post(`/api/tasks/${taskId}/comments`, { text: newComment })
      setNewComment('')
      fetchComments()
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to post comment'
      if (msg.includes('upgrade') || msg.includes('premium') || msg.includes('limit')) {
        setCanComment(false)
      }
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (text, parentCommentId) => {
    await axios.post(`/api/tasks/${taskId}/comments`, { text, parentCommentId })
    fetchComments()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle size={18} className="text-gray-400" />
          <h2 className="text-lg font-bold text-gray-900">Comments</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle size={18} className="text-gray-400" />
        <h2 className="text-lg font-bold text-gray-900">Comments ({commentCount})</h2>
      </div>

      {comments.length > 0 ? (
        <div className="divide-y divide-gray-100 mb-4">
          {comments.map((comment) => (
            <Comment
              key={comment._id || comment.id}
              comment={comment}
              taskId={taskId}
              onReply={handleReply}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm text-center py-6">No comments yet. Start the conversation!</p>
      )}

      {user ? (
        canComment ? (
          <form onSubmit={handlePostComment} className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary-600">{user.name?.charAt(0) || 'U'}</span>
            </div>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="bg-primary-500 hover:bg-primary-600 text-white p-2.5 rounded-full transition-all disabled:opacity-50 flex-shrink-0"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        ) : (
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <div className="flex items-center justify-center gap-2 text-amber-600 mb-2">
              <Crown size={16} />
              <span className="text-sm font-medium">Free plan limit reached (1 comment/month)</span>
            </div>
            <Link
              to="/premium"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:shadow-lg transition-all"
            >
              <Crown size={14} /> Upgrade to Premium
            </Link>
          </div>
        )
      ) : (
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium text-sm">
            Log in to comment
          </Link>
        </div>
      )}
    </div>
  )
}
