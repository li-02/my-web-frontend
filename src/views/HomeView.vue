<template>
  <div class="min-h-screen bg-primary text-primary font-sans overflow-x-hidden">
    <!-- 导航栏 -->
    <nav
      :class="[
        'fixed top-0 w-full z-50 transition-all duration-300 nav-blur py-4',
        scrollY > 100 ? 'nav-scrolled' : ''
      ]"
    >
      <div class="max-w-6xl mx-auto flex justify-between items-center px-8">
        <a href="#" class="text-2xl font-bold text-accent nav-logo">
          我的博客
        </a>
        <ul class="hidden md:flex gap-8">
          <li v-for="(item, index) in navItems" :key="index">
            <a
              :href="`#${item.id}`"
              class="text-gray-400 font-medium nav-link"
              @click="smoothScroll"
            >
              {{ item.name }}
            </a>
          </li>
        </ul>
      </div>
    </nav>

    <main class="mt-20 max-w-6xl mx-auto px-8">
      <!-- 头部介绍区域 -->
      <section id="home" class="min-h-[60vh] flex items-center justify-center text-center relative overflow-hidden">
        <Particles />
        <div class="relative z-20 hero-content">
          <h1 class="text-4xl md:text-6xl font-bold mb-4 hero-title">
            欢迎来到我的博客
          </h1>
          <p class="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl leading-relaxed">
            分享技术见解，记录成长历程，探索数字世界的无限可能。在这里，我们一起学习、思考、创造。
          </p>
          <a
            href="#blog"
            class="inline-block px-8 py-4 text-black rounded-full font-semibold cta-button"
            @click="smoothScroll"
          >
            开始阅读
          </a>
        </div>
      </section>

      <!-- 博客文章区域 -->
      <section id="blog" class="py-16">
        <h2 class="text-center text-3xl md:text-4xl font-bold mb-12 text-white">
          最新文章
        </h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <ArticleCard
            v-for="(article, index) in articles"
            :key="index"
            :article="article"
          />
        </div>
      </section>
    </main>

    <!-- 侧边栏 -->
    <aside class="hidden xl:block fixed right-8 top-1/2 transform -translate-y-1/2 w-80 sidebar">
      <Sidebar :tags="tags" :recent-posts="recentPosts" />
    </aside>

    <!-- 页脚 -->
    <footer class="footer py-12 text-center mt-16">
      <div class="max-w-6xl mx-auto px-8">
        <div class="flex justify-center gap-4 mb-8">
          <a
            v-for="(social, index) in socialLinks"
            :key="index"
            href="#"
            :title="social.title"
            class="social-link"
          >
            {{ social.icon }}
          </a>
        </div>
        <p class="text-gray-400">
          &copy; 2024 我的博客. 用 ❤️ 创建
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import ArticleCard from './components/ArticleCard.vue'
import Particles from './components/Particles.vue'
import Sidebar from './components/Sidebar.vue'

interface NavItem {
  name: string
  id: string
}

interface Article {
  date: string
  category: string
  title: string
  excerpt: string
}

interface SocialLink {
  icon: string
  title: string
}

const scrollY = ref(0)

const navItems: NavItem[] = [
  { name: '首页', id: 'home' },
  { name: '博客', id: 'blog' },
  { name: '关于', id: 'about' },
  { name: '联系', id: 'contact' }
]

const articles: Article[] = [
  {
    date: '2024-03-15',
    category: '技术分享',
    title: 'Spring Boot 3.0 新特性深度解析',
    excerpt: 'Spring Boot 3.0 带来了许多令人兴奋的新特性，包括对 Java 17 的原生支持、GraalVM 本地镜像优化，以及全新的观察性功能。本文将深入探讨这些新特性及其实际应用场景...'
  },
  {
    date: '2024-03-12',
    category: '前端开发',
    title: 'Vue 3 Composition API 最佳实践',
    excerpt: 'Composition API 是 Vue 3 中最重要的新特性之一，它为我们提供了更灵活的组件逻辑组织方式。本文将通过实际案例，展示如何在项目中有效地使用 Composition API...'
  },
  {
    date: '2024-03-08',
    category: '数据库',
    title: 'MySQL 8.0 性能优化实战指南',
    excerpt: '数据库性能优化是后端开发中的重要课题。本文将从索引设计、查询优化、配置调优等多个维度，分享 MySQL 8.0 的性能优化实践经验，帮助你构建高性能的数据库系统...'
  },
  {
    date: '2024-03-05',
    category: '架构设计',
    title: '微服务架构设计模式与实践',
    excerpt: '微服务架构已成为现代软件开发的主流选择。本文将深入探讨微服务的设计模式、服务拆分原则、以及在实际项目中的落地实践，为你的架构设计提供参考...'
  }
]

const tags: string[] = ['Spring Boot', 'Vue.js', 'MySQL', 'Redis', 'Docker', 'Java', 'JavaScript', '微服务']

const recentPosts: string[] = [
  'Spring Boot 3.0 新特性深度解析',
  'Vue 3 Composition API 最佳实践',
  'MySQL 8.0 性能优化实战指南',
  '微服务架构设计模式与实践',
  'Docker 容器化部署完整指南'
]

const socialLinks: SocialLink[] = [
  { icon: '🐙', title: 'GitHub' },
  { icon: '🐦', title: 'Twitter' },
  { icon: '💼', title: 'LinkedIn' },
  { icon: '📧', title: 'Email' }
]

const handleScroll = () => {
  scrollY.value = window.scrollY
}

const smoothScroll = (event: Event) => {
  event.preventDefault()
  const target = event.target as HTMLAnchorElement
  const href = target.getAttribute('href')
  if (href?.startsWith('#')) {
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style>
/* 自定义颜色变量 */
:root {
  --bg-primary: #0f1419;
  --bg-secondary: #1a2332;
  --bg-tertiary: #242d3d;
  --text-primary: #e6f1ff;
  --text-secondary: #8892b0;
  --accent: #64ffda;
  --accent-hover: #4ecdc4;
}

/* 主题色 */
.bg-primary { background-color: var(--bg-primary); }
.text-primary { color: var(--text-primary); }
.text-accent { color: var(--accent); }

/* 字体 */
.font-sans {
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 导航栏样式 */
.nav-blur {
  backdrop-filter: blur(20px);
  background: rgba(15, 20, 25, 0.9);
}

.nav-scrolled {
  background: rgba(15, 20, 25, 0.95);
}

.nav-logo {
  transition: transform 0.3s ease;
}

.nav-logo:hover {
  transform: scale(1.05);
}

.nav-link {
  position: relative;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: var(--accent);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--accent);
  transition: width 0.3s ease;
}

.nav-link:hover::after {
  width: 100%;
}

/* Hero区域动画 */
.hero-content {
  animation: fadeInUp 1s ease-out;
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

/* 标题渐变 */
.hero-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* CTA按钮 */
.cta-button {
  background: var(--accent);
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(100, 255, 218, 0.3);
}

.cta-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 40px rgba(100, 255, 218, 0.4);
  background: var(--accent-hover);
}

/* 侧边栏 */
.sidebar {
  background: var(--bg-secondary);
  padding: 2rem;
  border-radius: 1.5rem;
  border: 1px solid rgba(100, 255, 218, 0.1);
  backdrop-filter: blur(20px);
}

/* 页脚 */
.footer {
  background: var(--bg-secondary);
  border-top: 1px solid rgba(100, 255, 218, 0.1);
}

.social-link {
  width: 3rem;
  height: 3rem;
  background: var(--bg-tertiary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 1.125rem;
}

.social-link:hover {
  background: var(--accent);
  color: var(--bg-primary);
  transform: translateY(-3px);
}

/* 响应式 */
@media (max-width: 768px) {
  .nav-links {
    display: none;
  }
}
</style>
