<template>
  <article
    class="article-card"
    :class="{ 'card-visible': isVisible }"
    ref="cardRef"
  >
    <!-- 顶部渐变条 -->
    <div class="card-gradient-top" />

    <!-- 文章元信息 -->
    <div class="flex items-center gap-4 mb-4 text-sm text-gray-400">
      <div class="flex items-center gap-2">
        <span>📅</span>
        <span>{{ article.date }}</span>
      </div>
      <span class="article-category">
        {{ article.category }}
      </span>
    </div>

    <!-- 文章标题 -->
    <h3 class="text-xl font-semibold mb-4 text-white leading-tight">
      {{ article.title }}
    </h3>

    <!-- 文章摘要 -->
    <p class="text-gray-400 mb-6 leading-relaxed">
      {{ article.excerpt }}
    </p>

    <!-- 阅读更多链接 -->
    <a
      href="#"
      class="read-more-link"
      @click.prevent="readMore"
    >
      阅读全文 →
    </a>
  </article>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Article {
  date: string
  category: string
  title: string
  excerpt: string
}

interface Props {
  article: Article
}

defineProps<Props>()

const cardRef = ref<HTMLElement>()
const isVisible = ref(false)

const readMore = () => {
  // 这里可以添加路由跳转或其他逻辑
  console.log('阅读更多')
}

onMounted(() => {
  // 滚动动画观察器
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible.value = true
          observer.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }
  )

  if (cardRef.value) {
    observer.observe(cardRef.value)
  }
})
</script>

<style scoped>
:root {
  --bg-secondary: #1a2332;
  --accent: #64ffda;
  --shadow: rgba(0, 0, 0, 0.3);
}

.article-card {
  background: var(--bg-secondary);
  border-radius: 1.5rem;
  padding: 2rem;
  transition: all 0.3s ease;
  border: 1px solid rgba(100, 255, 218, 0.1);
  position: relative;
  overflow: hidden;
  opacity: 0;
  transform: translateY(2rem);
}

.card-visible {
  opacity: 1;
  transform: translateY(0);
}

.article-card:hover {
  transform: translateY(-0.75rem);
  box-shadow: 0 20px 40px var(--shadow);
}

.card-gradient-top {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.article-card:hover .card-gradient-top {
  transform: scaleX(1);
}

.article-category {
  background: rgba(100, 255, 218, 0.1);
  color: var(--accent);
  padding: 0.25rem 0.75rem;
  border-radius: 1.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.read-more-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--accent);
  font-weight: 500;
  transition: gap 0.3s ease;
}

.article-card:hover .read-more-link {
  gap: 1rem;
}
</style>
