import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Ticker from './components/Ticker'
import Footer from './components/Footer'
import MobileFooter from './components/MobileFooter'
import InstallBanner from './components/InstallBanner'
import useBackHandler from './hooks/useBackHandler'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import BrowseTasks from './pages/BrowseTasks'
import TaskDetail from './pages/TaskDetail'
import PostTask from './pages/PostTask'
import UserProfile from './pages/UserProfile'
import Dashboard from './pages/Dashboard'
import Messages from './pages/Messages'
import AdminPanel from './pages/AdminPanel'
import EditProfile from './pages/EditProfile'
import CategoryPage from './pages/CategoryPage'
import Premium from './pages/Premium'
import VerifyTasker from './pages/VerifyTasker'
import ProtectedRoute from './components/ProtectedRoute'

function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold text-gray-200">404</h1>
        <p className="text-gray-500 mt-2">Page not found</p>
        <a href="/" className="inline-block mt-4 bg-primary-500 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-primary-600 transition-all">Go Home</a>
      </div>
    </div>
  )
}

function AppContent() {
  useBackHandler()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <Ticker />
      <main className="flex-1 pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/tasks" element={<BrowseTasks />} />
          <Route path="/category/:categoryName" element={<CategoryPage />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/post-task" element={<ProtectedRoute><PostTask /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/verify" element={<ProtectedRoute><VerifyTasker /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <MobileFooter />
      <InstallBanner />
    </div>
  )
}

function App() {
  return <AppContent />
}

export default App
