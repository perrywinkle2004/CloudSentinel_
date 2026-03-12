import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const scanUpload = (formData) =>
  api.post('/scan/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export const scanSimulate = (provider, service, scenario) =>
  api.post('/scan/simulate', { provider, service, scenario })

export const getScanOptions = () => api.get('/scan/options')

export const getHistory = (limit = 50) => api.get(`/history/?limit=${limit}`)

export const getLatestScan = () => api.get('/scan/latest')

export const getIssues = () => api.get('/issues/')

export const getFixSuggestions = () => api.get('/fix-suggestions/')

export const generateSecureConfig = (config, findings) =>
  api.post('/secure-config/generate', { config, findings })

export const askAdvisor = (question, scan_context = null) =>
  api.post('/advisor/ask', { question, scan_context })

export const getQuickQuestions = () => api.get('/advisor/quick-questions')

export const loginReq = (credentials) => api.post('/auth/login', credentials)

export const signupReq = (userData) => api.post('/auth/register', userData)

export const scanConfiguration = (config) => {
  if (config.provider && config.service && config.scenario && Object.keys(config).length === 3) {
    return scanSimulate(config.provider, config.service, config.scenario);
  }
  const fd = new FormData();
  fd.append('text', JSON.stringify(config));
  return scanUpload(fd);
}

export const getThreatIntel = (scanResult) =>
  api.post('/threat-intel/analyze', scanResult)

