<template>
  <div>
    <!-- 热门标签 -->
    <div class="mb-8">
      <h3 class="sidebar-title">热门标签</h3>
      <div class="flex flex-wrap gap-2">
        <a
          v-for="(tag, index) in tags"
          :key="index"
          href="#"
          class="tag"
          @click.prevent="handleTagClick(tag)"
        >
          {{ tag }}
        </a>
      </div>
    </div>

    <!-- 最近文章 -->
    <div>
      <h3 class="sidebar-title">最近文章</h3>
      <ul class="space-y-4">
        <li
          v-for="(post, index) in recentPosts"
          :key="index"
          class="recent-post-item"
        >
          <a
            href="#"
            class="recent-post-link"
            @click.prevent="handlePostClick(post)"
          >
            {{ post }}
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  tags: string[]
  recentPosts: string[]
}

defineProps<Props>()
</script>
<style scoped>
:root {
  --accent: #64ffda;
  --bg-primary: #0f1419;
  --text-secondary: #8892b0;
}

.sidebar-title {
  color: var(--accent);
  margin-bottom: 1rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.tag {
  background: rgba(100, 255, 218, 0.1);
  color: var(--accent);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  text-decoration: none;
  transition: all 0.3s ease;
}

.tag:hover {
  background: var(--accent);
  color: var(--bg-primary);
  transform: scale(1.05);
}

.recent-post-item {
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(100, 255, 218, 0.1);
}

.recent-post-item:last-child {
  border-bottom: none;
}

.recent-post-link {
  color: var(--text-secondary);
  font-size: 0.875rem;
  text-decoration: none;
  transition: color 0.3s ease;
  line-height: 1.6;
}

.recent-post-link:hover {
  color: var(--accent);
}
</style>

