// 认证相关API
import api from '@/api/index.ts'

export const authAPI = {
  // 管理员登录
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),

  // 验证token
  validateToken: () => api.get('/auth/validate'),

  // 登出
  logout: () => api.post('/auth/logout'),
}

