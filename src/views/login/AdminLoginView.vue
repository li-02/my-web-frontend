<template>
  <div class="admin-login">
    <!-- 返回首页按钮 -->
    <div class="back-home">
      <router-link to="/" class="back-link"> ← 返回首页</router-link>
    </div>

    <!-- 粒子背景效果 -->
    <Particles />

    <!-- 登录表单区域 -->
    <div class="login-container">
      <div class="login-card">
        <!-- Logo和标题 -->
        <div class="login-header">
          <h1 class="login-title">管理员登录</h1>
          <p class="login-subtitle">欢迎回来，开始管理你的博客内容</p>
        </div>

        <!-- 登录表单 -->
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="username" class="form-label">用户名</label>
            <input
              id="username"
              v-model="loginForm.username"
              type="text"
              class="form-input"
              placeholder="请输入用户名"
              required
            />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">密码</label>
            <input
              id="password"
              v-model="loginForm.password"
              type="password"
              class="form-input"
              placeholder="请输入密码"
              required
            />
          </div>

          <div class="form-group">
            <label class="checkbox-wrapper">
              <input v-model="loginForm.rememberMe" type="checkbox" class="checkbox" />
              <span class="checkmark"></span>
              <span class="checkbox-text">记住我</span>
            </label>
          </div>

          <button type="submit" class="login-button" :disabled="isLoading">
            <span v-if="!isLoading">登录</span>
            <span v-else class="loading-text">
              <span class="loading-spinner"></span>
              登录中...
            </span>
          </button>
        </form>

        <!-- 错误提示 -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import Particles from '../../components/Particles.vue'
import { authAPI } from '@/api/auth.ts'

const router = useRouter()

const loginForm = reactive({
  username: '',
  password: '',
  rememberMe: false,
})

const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    errorMessage.value = '请填写完整的登录信息'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    // 调用后端登录API
    const response = await authAPI.login({
      username: loginForm.username,
      password: loginForm.password,
    })

    // 保存token
    if (response.token) {
      localStorage.setItem('admin_token', response.token)

      // 如果选择了记住我，设置更长的过期时间
      if (loginForm.rememberMe) {
        localStorage.setItem('remember_me', 'true')
      }

      // 登录成功后跳转到管理后台
      router.push('/admin/dashboard')
    }
  } catch (error: any) {
    console.error('登录失败:', error)
    errorMessage.value = error.response?.data?.message || '登录失败，请检查用户名和密码'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.admin-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);
}

.back-home {
  position: fixed;
  top: 2rem;
  left: 2rem;
  z-index: 1000;
}

.back-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  background: rgba(26, 35, 50, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(100, 255, 218, 0.1);
  transition: all 0.3s ease;
}

.back-link:hover {
  color: var(--accent);
  background: rgba(26, 35, 50, 0.9);
  transform: translateX(-5px);
}

.login-container {
  z-index: 2;
  width: 100%;
  max-width: 450px;
  padding: 0 2rem;
}

.login-card {
  background: rgba(26, 35, 50, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(100, 255, 218, 0.1);
  border-radius: 20px;
  padding: 3rem;
  position: relative;
  overflow: hidden;
  animation: fadeInUp 0.8s ease-out;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--gradient);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: var(--gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.login-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.5;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
}

.form-input {
  padding: 1rem 1.25rem;
  background: var(--bg-tertiary);
  border: 1px solid rgba(100, 255, 218, 0.1);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(100, 255, 218, 0.1);
  background: rgba(36, 45, 61, 0.8);
}

.form-input::placeholder {
  color: var(--text-secondary);
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.checkbox {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(100, 255, 218, 0.3);
  border-radius: 4px;
  position: relative;
  transition: all 0.3s ease;
}

.checkbox:checked + .checkmark {
  background: var(--accent);
  border-color: var(--accent);
}

.checkbox:checked + .checkmark::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 2px;
  width: 6px;
  height: 10px;
  border: solid var(--bg-primary);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.login-button {
  padding: 1rem 2rem;
  background: var(--accent);
  color: var(--bg-primary);
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  position: relative;
  overflow: hidden;
}

.login-button:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(100, 255, 218, 0.3);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.loading-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid var(--bg-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-message {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.2);
  border-radius: 8px;
  color: #ff6b6b;
  font-size: 0.9rem;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-container {
    padding: 0 1rem;
  }

  .login-card {
    padding: 2rem;
  }

  .login-title {
    font-size: 2rem;
  }

  .back-home {
    top: 1rem;
    left: 1rem;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
