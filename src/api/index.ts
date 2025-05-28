// src/api/index.ts
import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 在请求头中添加token
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    // 统一错误处理
    // 请求缺少有效的身份验证凭证
    if (error.response?.status === 401) {
      // 清除token并跳转到登录页
      localStorage.removeItem('admin_token')
      window.location.href = '/dreamory-admin-login'
    }
    return Promise.reject(error)
  },
)

export default api
