import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Send, Search, Image, Paperclip, Loader2, MessageSquare, ChevronLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function Messages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeConvo, setActiveConvo] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef(null)

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/messages/conversations')
      setConversations(res.data.conversations || [])
    } catch {
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchConversations() }, [])

  const fetchMessages = async (convo) => {
    try {
      const res = await axios.get(`/api/messages/${convo.taskId}/${convo._id}`)
      setMessages(res.data.messages || [])
      setActiveConvo(convo)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch {
      toast.error('Failed to load messages')
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConvo) return
    try {
      setSending(true)
      await axios.post('/api/messages', {
        taskId: activeConvo.taskId,
        receiverId: activeConvo._id,
        content: newMessage
      })
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        content: newMessage,
        sender_id: user.id,
        created_at: new Date().toISOString()
      }])
      setNewMessage('')
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = conversations.filter((c) => {
    const name = c.otherUser?.name || ''
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || c.task?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="min-h-[80vh] bg-gray-50">
      <div className="max-w-6xl mx-auto h-[80vh] flex bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className={`w-full sm:w-80 border-r border-gray-200 flex flex-col ${activeConvo ? 'hidden sm:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">Messages</h2>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search conversations..." className="w-full pl-9 pr-3 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10"><Loader2 size={24} className="animate-spin text-primary-500" /></div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((convo, idx) => (
                <button key={`${convo.taskId}-${convo._id}-${idx}`} onClick={() => fetchMessages(convo)} className={`w-full flex items-start gap-3 p-4 hover:bg-gray-50 transition-all text-left border-b border-gray-50 ${activeConvo?._id === convo._id && activeConvo?.taskId === convo.taskId ? 'bg-primary-50 border-l-2 border-l-primary-500' : ''}`}>
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-semibold text-primary-600 text-sm">{convo.otherUser?.name?.charAt(0) || 'U'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 text-sm truncate">{convo.otherUser?.name || 'Unknown'}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {convo.lastMessageTime ? formatDistanceToNow(new Date(convo.lastMessageTime), { addSuffix: false }) : ''}
                      </span>
                    </div>
                    {convo.task && <p className="text-xs text-accent-500 mt-0.5 truncate">Re: {convo.task.title}</p>}
                    <p className="text-xs text-gray-500 truncate mt-0.5">{convo.lastMessage || 'No messages yet'}</p>
                    {convo.unreadCount > 0 && <span className="inline-flex items-center justify-center w-5 h-5 bg-primary-500 text-white text-xs font-bold rounded-full mt-1">{convo.unreadCount}</span>}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-12"><MessageSquare size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-gray-500 text-sm">No conversations yet</p></div>
            )}
          </div>
        </div>

        <div className={`flex-1 flex flex-col ${activeConvo ? 'flex' : 'hidden sm:flex'}`}>
          {activeConvo ? (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white">
                <button onClick={() => setActiveConvo(null)} className="sm:hidden text-gray-500 hover:text-gray-700"><ChevronLeft size={20} /></button>
                <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="font-semibold text-primary-600 text-sm">{activeConvo.otherUser?.name?.charAt(0) || 'U'}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{activeConvo.otherUser?.name}</p>
                  {activeConvo.task && <p className="text-xs text-accent-500">Re: {activeConvo.task.title}</p>}
                </div>
              </div>

              {activeConvo.task && (
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MessageSquare size={12} /> Task: <span className="font-medium text-gray-700">{activeConvo.task.title}</span>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((msg) => {
                  const isMine = msg.sender_id === user?.id
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs sm:max-w-sm rounded-2xl px-4 py-2.5 ${isMine ? 'bg-primary-500 text-white rounded-br-md' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'}`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
                          {msg.created_at ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }) : ''}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="p-4 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                  <button type="button" className="text-gray-400 hover:text-gray-600 p-2"><Paperclip size={18} /></button>
                  <button type="button" className="text-gray-400 hover:text-gray-600 p-2"><Image size={18} /></button>
                  <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all" />
                  <button type="submit" disabled={!newMessage.trim() || sending} className="bg-primary-500 hover:bg-primary-600 text-white p-2.5 rounded-full transition-all disabled:opacity-30">
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">Your Messages</h3>
                <p className="text-gray-500 text-sm">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
