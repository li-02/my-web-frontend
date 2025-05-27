<template>
  <div class="min-h-screen overflow-x-hidden">
    <!-- 导航栏 -->
    <nav
      :class="[
        'nav',
        scrollY > 100 ? 'nav-scrolled' : ''
      ]"
    >
      <div class="nav-container">
        <a href="#" class="logo">
          我的博客
        </a>
        <ul class="nav-links">
          <li v-for="(item, index) in navItems" :key="index">
            <a
              :href="`#${item.id}`"
              @click="smoothScroll"
            >
              {{ item.name }}
            </a>
          </li>
        </ul>
      </div>
    </nav>

    <main>
      <!-- 头部介绍区域 -->
      <section class="hero" id="home">
        <Particles />
        <div class="hero-content">
          <h1>欢迎来到我的博客</h1>
          <p>分享技术见解，记录成长历程，探索数字世界的无限可能。在这里，我们一起学习、思考、创造。</p>
          <a
            href="#blog"
            class="cta-button"
            @click="smoothScroll"
          >
            开始阅读
          </a>
        </div>
      </section>

      <!-- 博客文章区域 -->
      <section class="blog-section" id="blog">
        <h2 class="section-title">最新文章</h2>
        <div class="articles-grid">
          <ArticleCard
            v-for="(article, index) in articles"
            :key="index"
            :article="article"
          />
        </div>
      </section>
    </main>

    <!-- 侧边栏 -->
    <aside class="sidebar">
      <Sidebar :tags="tags" :recent-posts="recentPosts" />
    </aside>

    <!-- 页脚 -->
    <footer>
      <div class="footer-content">
        <div class="social-links">
          <a
            v-for="(social, index) in socialLinks"
            :key="index"
            href="#"
            :title="social.title"
          >
            {{ social.icon }}
          </a>
        </div>
        <p>&copy; 2024 我的博客. 用 ❤️ 创建</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import ArticleCard from '../components/ArticleCard.vue'
import Particles from '../components/Particles.vue'

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

<style scoped>
:root {
  --bg-primary: #0f1419;
  --bg-secondary: #1a2332;
  --bg-tertiary: #242d3d;
  --text-primary: #e6f1ff;
  --text-secondary: #8892b0;
  --accent: #64ffda;
  --accent-hover: #4ecdc4;
  --gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --shadow: rgba(0, 0, 0, 0.3);
}

body {
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  overflow-x: hidden;
}

/* 导航栏 */
.nav {
  position: fixed;
  top: 0;
  width: 100%;
  background: rgba(15, 20, 25, 0.9);
  backdrop-filter: blur(20px);
  z-index: 1000;
  padding: 1rem 0;
  transition: all 0.3s ease;
}

.nav-scrolled {
  background: rgba(15, 20, 25, 0.95);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
  text-decoration: none;
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
}

.nav-links {
  display: flex;
  gap: 2rem;
  list-style: none;
}

.nav-links a {
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
  position: relative;
}

.nav-links a:hover {
  color: var(--accent);
}

.nav-links a::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--accent);
  transition: width 0.3s ease;
}

.nav-links a:hover::after {
  width: 100%;
}

/* 主页面 */
main {
  margin-top: 80px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 2rem;
}

/* 头部介绍区域 */
.hero {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-content {
  z-index: 2;
  animation: fadeInUp 1s ease-out;
}

.hero h1 {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: var(--gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero p {
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  max-width: 600px;
}

.cta-button {
  display: inline-block;
  padding: 1rem 2rem;
  background: var(--accent);
  color: var(--bg-primary);
  text-decoration: none;
  border-radius: 50px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(100, 255, 218, 0.3);
}

.cta-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 40px rgba(100, 255, 218, 0.4);
  background: var(--accent-hover);
}

/* 博客文章区域 */
.blog-section {
  padding: 4rem 0;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 3rem;
  color: var(--text-primary);
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

/* 侧边栏 */
.sidebar {
  position: fixed;
  right: 2rem;
  top: 50%;
  transform: translateY(-50%);
  background: var(--bg-secondary);
  padding: 2rem;
  border-radius: 20px;
  width: 300px;
  border: 1px solid rgba(100, 255, 218, 0.1);
  backdrop-filter: blur(20px);
}

/* 页脚 */
footer {
  background: var(--bg-secondary);
  padding: 3rem 0;
  text-align: center;
  margin-top: 4rem;
  border-top: 1px solid rgba(100, 255, 218, 0.1);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.social-links {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.social-links a {
  width: 50px;
  height: 50px;
  background: var(--bg-tertiary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.3s ease;
}

.social-links a:hover {
  background: var(--accent);
  color: var(--bg-primary);
  transform: translateY(-3px);
}

/* 动画 */
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

/* 响应式设计 */
@media (max-width: 1024px) {
  .sidebar {
    display: none;
  }
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }

  .hero h1 {
    font-size: 2.5rem;
  }

  .articles-grid {
    grid-template-columns: 1fr;
  }

  main {
    padding: 0 1rem;
  }
}
</style>
