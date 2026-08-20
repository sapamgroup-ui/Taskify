import axios from 'axios'

export const trackEvent = async (event, data = {}) => {
  try {
    await axios.post('/api/analytics/track', {
      event,
      ...data,
      timestamp: new Date().toISOString()
    })
  } catch {
    // Silently fail - analytics should never break the UI
  }
}

export const trackCategoryClick = (category) => {
  trackEvent('category_click', { category })
}

export const trackTaskView = (taskId, category) => {
  trackEvent('task_view', { taskId, category })
}

export const trackSearch = (query) => {
  trackEvent('search', { query })
}

export const trackPageView = (page) => {
  trackEvent('page_view', { page })
}
