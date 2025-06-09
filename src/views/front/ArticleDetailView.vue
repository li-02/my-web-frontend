<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import NavBar from "@/components/NavBar.vue";

import { articleAPI } from "@/api/article.ts";
import { ElMessage } from "element-plus";
import { MdPreview } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';


// 文章接口定义
interface Article {
	id: number;
	title: string;
	summary?: string;
	content: string;
	coverImage?: string;
	viewCount: number;
	likeCount: number;
	commentCount: number;
	readingTime: number;
	createTime: string;
	updateTime: string;
	publishTime?: string;
	status: string;
	categoryId?: number;
	categoryName?: string;
	isPinned: boolean;
	isAllowComment: boolean;
	isOriginal: boolean;
	accessType: string;
	password?: string;
	metaDescription?: string;
	metaKeywords?: string;
	wordCount?: number;
	tags?: string[];
}

// 大纲项接口定义
interface OutlineItem {
	id: string;
	title: string;
	level: number;
}

const route = useRoute();
const router = useRouter();

// 响应式数据
const article = ref<Article | null>(null);
const relatedArticles = ref<Article[]>([]);
const loading = ref(false);
const isLiked = ref(false);
const outline = ref<OutlineItem[]>([]);
const activeOutlineId = ref<string>('');
const showOutline = ref(false);
const isOutlineCollapsed = ref(false);

// 增加文章浏览次数
const incrementViewCount = async (articleId: string) => {
	try {
		// 从localStorage检查是否已经浏览过这篇文章（防止重复计数）
		const viewedArticles = JSON.parse(localStorage.getItem('viewedArticles') || '[]');
		const articleKey = `article_${articleId}`;
		
		// 检查是否在1小时内已经浏览过（防止刷新页面重复计数）
		const now = Date.now();
		const oneHour = 60 * 60 * 1000;
		const lastViewed = localStorage.getItem(articleKey);
		
		if (!lastViewed || (now - parseInt(lastViewed)) > oneHour) {
			// 调用API增加浏览次数
			await articleAPI.incrementViewCount(articleId);
			
			// 记录浏览时间
			localStorage.setItem(articleKey, now.toString());
			
			// 如果文章已加载，立即更新本地浏览次数
			if (article.value) {
				article.value.viewCount++;
			}
			
			console.log("浏览次数已增加");
		} else {
			console.log("1小时内已浏览过，不重复计数");
		}
	} catch (error: any) {
		// 增加浏览次数失败不影响文章正常显示
		console.error("增加浏览次数失败:", error);
	}
};

// 解析文章大纲
const parseOutline = (content: string) => {
	const lines = content.split('\n');
	const outlineItems: OutlineItem[] = [];
	let headingCounter = 0;
	
	lines.forEach((line) => {
		const match = line.match(/^(#{1,6})\s+(.+)/);
		if (match) {
			headingCounter++;
			const level = match[1].length;
			const title = match[2].trim();
			const id = `heading-${headingCounter}`;
			
			outlineItems.push({
				id,
				title,
				level
			});
		}
	});
	
	return outlineItems;
};

// 给标题添加ID
const addHeadingIds = async () => {
	await nextTick();
	// 多次尝试获取预览元素，等待Markdown完全渲染
	let attempts = 0;
	const maxAttempts = 10;
	
	const tryAddIds = () => {
		const previewElement = document.querySelector('.markdown-content .md-editor-preview');
		if (!previewElement) {
			attempts++;
			if (attempts < maxAttempts) {
				setTimeout(tryAddIds, 100);
			}
			return;
		}
		
		const headings = previewElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
		if (headings.length === 0) {
			attempts++;
			if (attempts < maxAttempts) {
				setTimeout(tryAddIds, 100);
			}
			return;
		}
		
		let headingCounter = 0;
		headings.forEach((heading) => {
			headingCounter++;
			const id = `heading-${headingCounter}`;
			heading.id = id;
		});
		
		console.log(`成功为 ${headings.length} 个标题添加了ID`);
	};
	
	tryAddIds();
};

// 滚动到指定标题
const scrollToHeading = (id: string) => {
	const element = document.getElementById(id);
	if (element) {
		const offsetTop = element.offsetTop - 100; // 减去导航栏高度
		window.scrollTo({
			top: offsetTop,
			behavior: 'smooth'
		});
		activeOutlineId.value = id;
	}
};

// 监听滚动，更新当前激活的大纲项
const handleScroll = () => {
	const headings = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
	let currentId = '';
	
	headings.forEach((heading) => {
		const rect = heading.getBoundingClientRect();
		if (rect.top <= 150) { // 考虑导航栏高度
			currentId = heading.id;
		}
	});
	
	if (currentId) {
		activeOutlineId.value = currentId;
	}
};

// 加载文章详情
const loadArticle = async (articleId: string) => {
	try {
		loading.value = true;
		const response = await articleAPI.getArticle(articleId);
		article.value = response.data;
		
		// 解析文章大纲
		if (article.value?.content) {
			outline.value = parseOutline(article.value.content);
			showOutline.value = outline.value.length > 0;
		}
		
		// 调试：打印文章内容，检查代码块格式
		console.log("文章内容:", article.value?.content);
		
		// 文章加载成功后增加浏览次数
		await incrementViewCount(articleId);
		
		// 加载相关文章
		await loadRelatedArticles();
		
		// 给标题添加ID
		await addHeadingIds();
		
		console.log("文章详情加载成功:", article.value);
		console.log("文章大纲:", outline.value);
	} catch (error: any) {
		console.error("获取文章详情失败:", error);
		ElMessage.error("获取文章详情失败");
		article.value = null;
	} finally {
		loading.value = false;
	}
};

// 加载相关文章
const loadRelatedArticles = async () => {
	if (!article.value) return;
	
	try {
		// 根据分类获取相关文章
		const response = await articleAPI.getArticles({
			page: 0,
			size: 3,
			status: 'PUBLISHED',
			categoryId: article.value.categoryId
		});
		
		// 过滤掉当前文章
		const articles = response.data.content || response.data;
		relatedArticles.value = articles
			.filter((item: any) => item.id !== article.value!.id)
			.slice(0, 3);
			
	} catch (error: any) {
		console.error("获取相关文章失败:", error);
	}
};

// 格式化日期
const formatDate = (dateString: string) => {
	const date = new Date(dateString);
	return date.toLocaleDateString('zh-CN', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
};

// 切换点赞状态
const toggleLike = async () => {
	if (!article.value) return;
	
	try {
		// 这里应该调用点赞API
		// await articleAPI.toggleLike(article.value.id);
		
		isLiked.value = !isLiked.value;
		if (isLiked.value) {
			article.value.likeCount++;
			ElMessage.success("点赞成功");
		} else {
			article.value.likeCount--;
			ElMessage.success("取消点赞");
		}
	} catch (error: any) {
		console.error("点赞操作失败:", error);
		ElMessage.error("点赞操作失败");
	}
};

// 分享文章
const shareArticle = async () => {
	if (!article.value) return;
	
	try {
		const url = window.location.href;
		await navigator.clipboard.writeText(url);
		ElMessage.success("文章链接已复制到剪贴板");
	} catch (error) {
		console.error("分享失败:", error);
		ElMessage.error("分享失败");
	}
};

// 切换大纲折叠状态
const toggleOutline = () => {
	isOutlineCollapsed.value = !isOutlineCollapsed.value;
};

// 组件挂载时加载文章
onMounted(() => {
	const articleId = route.params.id as string;
	if (articleId) {
		loadArticle(articleId);
	} else {
		router.push("/articles");
	}
	
	// 添加滚动监听
	window.addEventListener('scroll', handleScroll);
});

// 组件卸载时移除监听
onUnmounted(() => {
	window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
	<div class="article-detail-page">
		<!-- 导航栏 -->
		<NavBar />
		
		<!-- 加载状态 -->
		<div v-if="loading" class="loading-state">
			<div class="loading-spinner">⏳</div>
			<div class="loading-text">正在加载文章...</div>
		</div>
		
		<!-- 文章未找到 -->
		<div v-else-if="!article" class="not-found-state">
			<div class="not-found-icon">😕</div>
			<div class="not-found-title">文章未找到</div>
			<div class="not-found-description">抱歉，您访问的文章不存在或已被删除</div>
			<router-link to="/articles" class="back-btn">返回文章列表</router-link>
		</div>
		
		<!-- 文章内容 -->
		<div v-else class="article-detail">
			<!-- 文章头部 -->
			<header class="article-header">
				<div class="header-content">
					<!-- 面包屑导航 -->
					<nav class="breadcrumb">
						<router-link to="/" class="breadcrumb-item">首页</router-link>
						<span class="breadcrumb-separator">></span>
						<router-link to="/articles" class="breadcrumb-item">文章列表</router-link>
						<span class="breadcrumb-separator">></span>
						<span class="breadcrumb-current">{{ article.title }}</span>
					</nav>
					
					<!-- 文章元信息 -->
					<div class="article-meta">
						<span class="article-date">📅 {{ formatDate(article.publishTime || article.createTime) }}</span>
						<span v-if="article.isOriginal" class="original-badge">原创</span>
						<div class="category-tags-group">
							<span class="article-category">{{ article.categoryName || '未分类' }}</span>
							<!-- 文章标签 -->
							<div v-if="article.tags && article.tags.length > 0" class="article-tags-inline">
								<span v-for="tag in article.tags" :key="tag" class="tag-inline">{{ tag }}</span>
							</div>
						</div>
						<span v-if="article.isPinned" class="pin-badge">📌 置顶</span>

					</div>
					
					<!-- 文章标题 -->
					<h1 class="article-title">{{ article.title }}</h1>
					
					<!-- 文章摘要 -->
					<!-- <p v-if="article.summary" class="article-summary">{{ article.summary }}</p> -->
					
					<!-- 文章统计 -->
					<div class="article-stats">
						<span class="stat-item">👁️ {{ article.viewCount }} 浏览</span>
						<!-- <span class="stat-item">❤️ {{ article.likeCount }} 点赞</span>
						<span class="stat-item">💬 {{ article.commentCount }} 评论</span> -->
						<span class="stat-item">⏱️ {{ article.readingTime }} 分钟阅读</span>
						<span class="stat-item">📝 {{ article.wordCount || 0 }} 字</span>
					</div>
				</div>
			</header>
			
			<!-- 封面图片 -->
			<div v-if="article.coverImage" class="article-cover">
				<img :src="article.coverImage" :alt="article.title" />
			</div>
			
			<!-- 文章正文 -->
			<main class="article-content">
				<div class="content-container">
					<!-- 文章大纲 -->
					<aside v-if="showOutline" class="article-outline" :class="{ 'collapsed': isOutlineCollapsed }">
						<div class="outline-header">
							<h3 class="outline-title">📑 文章目录</h3>
							<button 
								class="outline-toggle" 
								@click="toggleOutline"
								:title="isOutlineCollapsed ? '展开目录' : '折叠目录'"
							>
								{{ isOutlineCollapsed ? '📄' : '📋' }}
							</button>
						</div>
						<nav class="outline-nav" v-show="!isOutlineCollapsed">
							<ul class="outline-list">
								<li 
									v-for="item in outline" 
									:key="item.id"
									class="outline-item"
									:class="{
										'active': activeOutlineId === item.id,
										[`level-${item.level}`]: true
									}"
								>
									<a 
										:href="`#${item.id}`"
										@click.prevent="scrollToHeading(item.id)"
										class="outline-link"
									>
										{{ item.title }}
									</a>
								</li>
							</ul>
						</nav>
					</aside>
					
					<!-- 文章内容 -->
					<div class="content-wrapper" :class="{ 'with-outline': showOutline }">
						<!-- Markdown 内容渲染 -->
						<MdPreview 
							:modelValue="article.content" 
							theme="dark"
							previewTheme="github"
							codeTheme="github"
							:showCodeRowNumber="false"
							:tabSize="4"
							class="markdown-content custom-md-theme"
						/>
					</div>
				</div>
			</main>
			
			<!-- 文章底部 -->
			<footer class="article-footer">
				<div class="footer-content">
					<!-- 点赞和分享 -->
					<div class="article-actions">
						<!-- <button class="action-btn like-btn" :class="{ liked: isLiked }" @click="toggleLike">
							<span class="btn-icon">❤️</span>
							<span>{{ article.likeCount }}</span>
						</button> -->
						<button class="action-btn share-btn" @click="shareArticle">
							<span class="btn-icon">🔗</span>
							<span>分享</span>
						</button>
					</div>
					
					<!-- 相关文章推荐 -->
					<div v-if="relatedArticles.length > 0" class="related-articles">
						<h3 class="related-title">相关文章</h3>
						<div class="related-list">
							<router-link 
								v-for="related in relatedArticles" 
								:key="related.id"
								:to="`/article/${related.id}`"
								class="related-item"
							>
								<div v-if="related.coverImage" class="related-cover">
									<img :src="related.coverImage" :alt="related.title" />
								</div>
								<div class="related-content">
									<h4 class="related-title">{{ related.title }}</h4>
									<p class="related-excerpt">{{ related.summary }}</p>
									<span class="related-date">{{ formatDate(related.publishTime || related.createTime) }}</span>
								</div>
							</router-link>
						</div>
					</div>
					
					<!-- 返回按钮 -->
					<div class="back-to-list">
						<router-link to="/articles" class="back-btn">
							<span class="btn-icon">←</span>
							返回文章列表
						</router-link>
					</div>
				</div>
			</footer>
		</div>
	</div>
</template>

<style scoped>
.article-detail-page {
	min-height: 100vh;
	padding-top: 80px;
	background: var(--bg-primary);
}

/* 加载状态 */
.loading-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 4rem 2rem;
	text-align: center;
	min-height: 60vh;
}

.loading-spinner {
	font-size: 3rem;
	margin-bottom: 1rem;
	animation: spin 2s linear infinite;
}

.loading-text {
	color: var(--text-secondary);
	font-size: 1.1rem;
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

/* 未找到状态 */
.not-found-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 4rem 2rem;
	text-align: center;
	min-height: 60vh;
}

.not-found-icon {
	font-size: 4rem;
	margin-bottom: 1rem;
	opacity: 0.6;
}

.not-found-title {
	font-size: 1.5rem;
	font-weight: 600;
	color: var(--text-primary);
	margin-bottom: 0.5rem;
}

.not-found-description {
	color: var(--text-secondary);
	margin-bottom: 2rem;
}

/* 文章详情 */
.article-detail {
	max-width: 1300px;
	margin: 0 auto;
	padding: 0 2rem;
}

/* 文章头部 */
.article-header {
	padding: 2rem 0;
	border-bottom: 1px solid rgba(100, 255, 218, 0.1);
	margin-bottom: 2rem;
}

.header-content {
	text-align: center;
}

/* 面包屑导航 */
.breadcrumb {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	margin-bottom: 1.5rem;
	font-size: 0.875rem;
}

.breadcrumb-item {
	color: var(--text-secondary);
	text-decoration: none;
	transition: color 0.3s ease;
}

.breadcrumb-item:hover {
	color: var(--accent);
}

.breadcrumb-separator {
	color: var(--text-secondary);
	opacity: 0.5;
}

.breadcrumb-current {
	color: var(--text-primary);
	font-weight: 500;
	max-width: 200px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* 文章元信息 */
.article-meta {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 1rem;
	margin-bottom: 1.5rem;
	font-size: 0.875rem;
	color: var(--text-secondary);
	flex-wrap: wrap;
}

.article-date {
	display: flex;
	align-items: center;
	gap: 0.25rem;
}

/* 分类和标签组合 */
.category-tags-group {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex-wrap: wrap;
}

.article-category {
	background: rgba(100, 255, 218, 0.1);
	color: var(--accent);
	padding: 0.25rem 0.75rem;
	border-radius: 12px;
	font-size: 0.75rem;
	font-weight: 500;
}

/* 内联标签样式 */
.article-tags-inline {
	display: flex;
	align-items: center;
	gap: 0.25rem;
	flex-wrap: wrap;
}

.tag-inline {
	background: rgba(100, 255, 218, 0.05);
	color: var(--text-secondary);
	padding: 0.2rem 0.5rem;
	border-radius: 8px;
	font-size: 0.7rem;
	border: 1px solid rgba(100, 255, 218, 0.1);
	transition: all 0.3s ease;
}

.tag-inline:hover {
	background: rgba(100, 255, 218, 0.1);
	border-color: var(--accent);
	color: var(--accent);
}

.pin-badge {
	background: rgba(255, 193, 7, 0.1);
	color: #ffc107;
	padding: 0.25rem 0.5rem;
	border-radius: 8px;
	font-size: 0.75rem;
	font-weight: 500;
}

.original-badge {
	background: rgba(40, 167, 69, 0.1);
	color: #28a745;
	padding: 0.25rem 0.5rem;
	border-radius: 8px;
	font-size: 0.75rem;
	font-weight: 500;
}

/* 文章标题 */
.article-title {
	font-size: 2.5rem;
	font-weight: 700;
	color: var(--text-primary);
	line-height: 1.3;
	margin-bottom: 1rem;
}

/* 文章摘要 */
.article-summary {
	font-size: 1.1rem;
	color: var(--text-secondary);
	line-height: 1.6;
	margin-bottom: 1.5rem;
	max-width: 700px;
	margin-left: auto;
	margin-right: auto;
}

/* 文章统计 */
.article-stats {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 1.5rem;
	margin-bottom: 1.5rem;
	font-size: 0.875rem;
	color: var(--text-secondary);
	flex-wrap: wrap;
}

.stat-item {
	display: flex;
	align-items: center;
	gap: 0.25rem;
}



/* 封面图片 */
.article-cover {
	margin-bottom: 3rem;
	border-radius: 16px;
	overflow: hidden;
	box-shadow: 0 10px 30px var(--shadow);
}

.article-cover img {
	width: 100%;
	height: auto;
	max-height: 400px;
	object-fit: cover;
}

/* 文章正文 */
.article-content {
	margin-bottom: 3rem;
}

.content-container {
	display: flex;
	gap: 2rem;
	align-items: flex-start;
}

/* 文章大纲 */
.article-outline {
	position: sticky;
	top: 100px;
	width: 280px;
	flex-shrink: 0;
	background: rgba(26, 35, 50, 0.9);
	backdrop-filter: blur(15px);
	border-radius: 16px;
	border: 1px solid rgba(100, 255, 218, 0.1);
	padding: 1.5rem;
	max-height: calc(100vh - 120px);
	overflow-y: auto;
	z-index: 10;
}

.outline-header {
	margin-bottom: 1rem;
	padding-bottom: 0.75rem;
	border-bottom: 1px solid rgba(100, 255, 218, 0.1);
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.outline-title {
	font-size: 1rem;
	font-weight: 600;
	color: var(--text-primary);
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex: 1;
}

.outline-toggle {
	background: none;
	border: none;
	color: var(--text-secondary);
	cursor: pointer;
	font-size: 1rem;
	padding: 0.25rem;
	border-radius: 4px;
	transition: all 0.3s ease;
	opacity: 0.7;
	display: none; /* 默认隐藏，在移动端显示 */
}

.outline-toggle:hover {
	background: rgba(100, 255, 218, 0.1);
	color: var(--accent);
	opacity: 1;
}

.article-outline.collapsed {
	width: auto;
	min-width: 180px;
}

.article-outline.collapsed .outline-header {
	margin-bottom: 0;
	border-bottom: none;
	padding-bottom: 0;
}

.outline-nav {
	position: relative;
}

.outline-list {
	list-style: none;
	margin: 0;
	padding: 0;
}

.outline-item {
	margin-bottom: 0.25rem;
	position: relative;
}

.outline-link {
	display: block;
	padding: 0.5rem 0.75rem;
	color: var(--text-secondary);
	text-decoration: none;
	font-size: 0.875rem;
	line-height: 1.4;
	border-radius: 6px;
	transition: all 0.3s ease;
	border-left: 2px solid transparent;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.outline-link:hover {
	background: rgba(100, 255, 218, 0.05);
	color: var(--text-primary);
	border-left-color: rgba(100, 255, 218, 0.3);
}

.outline-item.active .outline-link {
	background: rgba(100, 255, 218, 0.1);
	color: var(--accent);
	border-left-color: var(--accent);
	font-weight: 500;
}

/* 不同级别的标题缩进 */
.outline-item.level-1 .outline-link {
	padding-left: 0.75rem;
	font-weight: 600;
}

.outline-item.level-2 .outline-link {
	padding-left: 1.25rem;
	font-size: 0.8rem;
}

.outline-item.level-3 .outline-link {
	padding-left: 1.75rem;
	font-size: 0.75rem;
}

.outline-item.level-4 .outline-link {
	padding-left: 2.25rem;
	font-size: 0.75rem;
	opacity: 0.8;
}

.outline-item.level-5 .outline-link {
	padding-left: 2.75rem;
	font-size: 0.7rem;
	opacity: 0.7;
}

.outline-item.level-6 .outline-link {
	padding-left: 3.25rem;
	font-size: 0.7rem;
	opacity: 0.6;
}

/* 自定义滚动条 */
.article-outline::-webkit-scrollbar {
	width: 4px;
}

.article-outline::-webkit-scrollbar-track {
	background: transparent;
}

.article-outline::-webkit-scrollbar-thumb {
	background: rgba(100, 255, 218, 0.2);
	border-radius: 2px;
}

.article-outline::-webkit-scrollbar-thumb:hover {
	background: rgba(100, 255, 218, 0.3);
}

.content-wrapper {
	background: rgba(26, 35, 50, 0.9);
	backdrop-filter: blur(15px);
	border-radius: 16px;
	padding: 3rem;
	border: 1px solid rgba(100, 255, 218, 0.1);
	flex: 1;
	min-width: 0;
}

.content-wrapper.with-outline {
	margin-left: 0;
}

/* Markdown 内容样式 - 自定义主题以匹配设计风格 */
.markdown-content {
	font-size: 1rem;
	line-height: 1.8;
}

/* 自定义 md-editor-v3 主题样式 */
.custom-md-theme {
	background: transparent !important;
}

/* 覆盖 md-editor-v3 的默认样式 */
.custom-md-theme :deep(.md-editor-preview) {
	background: transparent !important;
	color: var(--text-primary) !important;
}

.custom-md-theme :deep(.md-editor-preview-wrapper) {
	background: transparent !important;
	padding: 0 !important;
}

/* 修复代码块样式 */
.custom-md-theme :deep(.md-editor-preview pre) {
	background: var(--bg-tertiary) !important;
	border: 1px solid rgba(100, 255, 218, 0.1) !important;
	border-radius: 8px !important;
	margin: 1.5rem 0 !important;
	padding: 1rem !important;
	overflow-x: auto !important;
}

.custom-md-theme :deep(.md-editor-preview pre code) {
	background: transparent !important;
	color: var(--text-primary) !important;
	padding: 0 !important;
	white-space: pre !important;
	font-family: 'Fira Code', 'Courier New', monospace !important;
	font-size: 0.9rem !important;
	line-height: 1.5 !important;
}

/* 确保代码块的语言标识正确显示 */
.custom-md-theme :deep(.md-editor-preview .language-javascript),
.custom-md-theme :deep(.md-editor-preview .language-js),
.custom-md-theme :deep(.md-editor-preview .language-typescript),
.custom-md-theme :deep(.md-editor-preview .language-ts),
.custom-md-theme :deep(.md-editor-preview .language-html),
.custom-md-theme :deep(.md-editor-preview .language-css),
.custom-md-theme :deep(.md-editor-preview .language-json),
.custom-md-theme :deep(.md-editor-preview .language-python),
.custom-md-theme :deep(.md-editor-preview .language-java),
.custom-md-theme :deep(.md-editor-preview .language-cpp),
.custom-md-theme :deep(.md-editor-preview .language-c) {
	background: var(--bg-tertiary) !important;
	color: var(--text-primary) !important;
}

.custom-md-theme :deep(.md-editor-preview h1),
.custom-md-theme :deep(.md-editor-preview h2),
.custom-md-theme :deep(.md-editor-preview h3),
.custom-md-theme :deep(.md-editor-preview h4),
.custom-md-theme :deep(.md-editor-preview h5),
.custom-md-theme :deep(.md-editor-preview h6) {
	color: var(--text-primary) !important;
	border-bottom: 1px solid rgba(100, 255, 218, 0.1) !important;
	padding-bottom: 0.5rem;
	margin-top: 2rem;
	margin-bottom: 1rem;
	scroll-margin-top: 100px; /* 为滚动锚点留出导航栏空间 */
	position: relative;
}

/* 为标题添加锚点链接样式 */
.custom-md-theme :deep(.md-editor-preview h1:target),
.custom-md-theme :deep(.md-editor-preview h2:target),
.custom-md-theme :deep(.md-editor-preview h3:target),
.custom-md-theme :deep(.md-editor-preview h4:target),
.custom-md-theme :deep(.md-editor-preview h5:target),
.custom-md-theme :deep(.md-editor-preview h6:target) {
	background: rgba(100, 255, 218, 0.05) !important;
	padding: 0.5rem !important;
	margin: 2rem -0.5rem 1rem -0.5rem !important;
	border-radius: 8px !important;
	border-bottom: 2px solid var(--accent) !important;
	transition: all 0.3s ease !important;
}

.custom-md-theme :deep(.md-editor-preview p) {
	color: var(--text-primary) !important;
	margin-bottom: 1.5rem;
}

.custom-md-theme :deep(.md-editor-preview code) {
	background: rgba(100, 255, 218, 0.1) !important;
	color: var(--accent) !important;
	padding: 0.2rem 0.4rem !important;
	border-radius: 4px !important;
	font-family: 'Courier New', monospace !important;
}



.custom-md-theme :deep(.md-editor-preview blockquote) {
	border-left: 4px solid var(--accent) !important;
	background: rgba(100, 255, 218, 0.05) !important;
	padding: 1rem 1.5rem !important;
	margin: 1.5rem 0 !important;
	color: var(--text-secondary) !important;
	border-radius: 0 8px 8px 0 !important;
}

.custom-md-theme :deep(.md-editor-preview blockquote p) {
	color: var(--text-secondary) !important;
	margin-bottom: 0 !important;
}

.custom-md-theme :deep(.md-editor-preview ul),
.custom-md-theme :deep(.md-editor-preview ol) {
	color: var(--text-primary) !important;
	margin-bottom: 1.5rem;
}

.custom-md-theme :deep(.md-editor-preview li) {
	color: var(--text-primary) !important;
	margin-bottom: 0.5rem;
}

.custom-md-theme :deep(.md-editor-preview a) {
	color: var(--accent) !important;
	text-decoration: none !important;
	border-bottom: 1px solid transparent !important;
	transition: border-color 0.3s ease !important;
}

.custom-md-theme :deep(.md-editor-preview a:hover) {
	border-bottom-color: var(--accent) !important;
}

.custom-md-theme :deep(.md-editor-preview table) {
	border-collapse: collapse !important;
	margin: 1.5rem 0 !important;
	width: 100% !important;
	border: 1px solid rgba(100, 255, 218, 0.1) !important;
	border-radius: 8px !important;
	overflow: hidden !important;
}

.custom-md-theme :deep(.md-editor-preview th),
.custom-md-theme :deep(.md-editor-preview td) {
	border: 1px solid rgba(100, 255, 218, 0.1) !important;
	padding: 0.75rem 1rem !important;
	text-align: left !important;
	color: var(--text-primary) !important;
}

.custom-md-theme :deep(.md-editor-preview th) {
	background: rgba(100, 255, 218, 0.05) !important;
	font-weight: 600 !important;
}

.custom-md-theme :deep(.md-editor-preview tr:nth-child(even)) {
	background: rgba(100, 255, 218, 0.02) !important;
}

/* 代码行号样式 */
.custom-md-theme :deep(.md-editor-preview .code-block-wrapper) {
	border-radius: 8px !important;
	overflow: hidden !important;
}

.custom-md-theme :deep(.md-editor-preview .code-block-wrapper .code-block) {
	background: var(--bg-tertiary) !important;
}

.custom-md-theme :deep(.md-editor-preview .hljs) {
	background: var(--bg-tertiary) !important;
	color: var(--text-primary) !important;
}

/* 额外的代码块修复样式 */
.custom-md-theme :deep(.md-editor-preview code[class*="language-"]),
.custom-md-theme :deep(.md-editor-preview pre[class*="language-"]) {
	background: var(--bg-tertiary) !important;
	color: var(--text-primary) !important;
	white-space: pre-wrap !important;
	word-wrap: break-word !important;
}

/* 修复行内代码和代码块的区别 */
.custom-md-theme :deep(.md-editor-preview p code),
.custom-md-theme :deep(.md-editor-preview li code),
.custom-md-theme :deep(.md-editor-preview td code) {
	background: rgba(100, 255, 218, 0.1) !important;
	color: var(--accent) !important;
	padding: 0.2rem 0.4rem !important;
	border-radius: 4px !important;
	font-family: 'Fira Code', 'Courier New', monospace !important;
	white-space: nowrap !important;
}

/* 确保多行代码块的正确显示 */
.custom-md-theme :deep(.md-editor-preview pre) {
	white-space: pre !important;
	overflow-x: auto !important;
	overflow-y: hidden !important;
}

.markdown-content a {
	color: var(--accent);
	text-decoration: none;
	border-bottom: 1px solid transparent;
	transition: border-color 0.3s ease;
}

.markdown-content a:hover {
	border-bottom-color: var(--accent);
}

/* 文章底部 */
.article-footer {
	border-top: 1px solid rgba(100, 255, 218, 0.1);
	padding-top: 3rem;
}

.footer-content {
	text-align: center;
}

/* 文章操作 */
.article-actions {
	display: flex;
	justify-content: center;
	gap: 1rem;
	margin-bottom: 3rem;
}

.action-btn {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	background: var(--bg-secondary);
	color: var(--text-secondary);
	border: 1px solid rgba(100, 255, 218, 0.1);
	border-radius: 50px;
	cursor: pointer;
	transition: all 0.3s ease;
	font-size: 0.875rem;
}

.action-btn:hover {
	background: var(--accent);
	color: var(--bg-primary);
	border-color: var(--accent);
	transform: translateY(-2px);
}

.like-btn.liked {
	background: var(--accent);
	color: var(--bg-primary);
	border-color: var(--accent);
}

/* 相关文章 */
.related-articles {
	margin-bottom: 3rem;
}

.related-title {
	font-size: 1.25rem;
	font-weight: 600;
	color: var(--text-primary);
	margin-bottom: 1.5rem;
}

.related-list {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 1.5rem;
}

.related-item {
	display: flex;
	background: var(--bg-secondary);
	border-radius: 12px;
	padding: 1rem;
	border: 1px solid rgba(100, 255, 218, 0.1);
	text-decoration: none;
	transition: all 0.3s ease;
}

.related-item:hover {
	transform: translateY(-2px);
	box-shadow: 0 5px 15px var(--shadow);
	border-color: rgba(100, 255, 218, 0.2);
}

.related-cover {
	flex-shrink: 0;
	width: 60px;
	height: 60px;
	margin-right: 1rem;
	border-radius: 8px;
	overflow: hidden;
}

.related-cover img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.related-content {
	flex: 1;
}

.related-title {
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--text-primary);
	margin-bottom: 0.5rem;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.related-excerpt {
	font-size: 0.75rem;
	color: var(--text-secondary);
	margin-bottom: 0.5rem;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.related-date {
	font-size: 0.75rem;
	color: var(--text-secondary);
}

/* 返回按钮 */
.back-to-list {
	margin-bottom: 2rem;
}

.back-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	background: rgba(100, 255, 218, 0.1);
	color: var(--accent);
	text-decoration: none;
	border-radius: 50px;
	border: 1px solid var(--accent);
	transition: all 0.3s ease;
	font-weight: 500;
}

.back-btn:hover {
	background: var(--accent);
	color: var(--bg-primary);
	transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 1200px) {
	.article-outline {
		width: 240px;
	}
	
	.content-container {
		gap: 1.5rem;
	}
}

@media (max-width: 1024px) {
	.content-container {
		flex-direction: column;
	}
	
	.article-outline {
		position: relative;
		top: auto;
		width: 100%;
		max-height: 300px;
		order: -1;
		margin-bottom: 1rem;
	}
	
	.article-outline.collapsed {
		width: 100%;
		min-width: auto;
	}
	
	.outline-title {
		font-size: 0.9rem;
	}
	
	.outline-toggle {
		display: block;
	}
	
	.outline-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	
	.outline-item {
		margin-bottom: 0;
	}
	
	.outline-link {
		padding: 0.4rem 0.8rem;
		font-size: 0.75rem;
		white-space: nowrap;
		border-radius: 12px;
		border-left: none;
		background: rgba(100, 255, 218, 0.05);
	}
	
	.outline-item.level-1 .outline-link,
	.outline-item.level-2 .outline-link,
	.outline-item.level-3 .outline-link,
	.outline-item.level-4 .outline-link,
	.outline-item.level-5 .outline-link,
	.outline-item.level-6 .outline-link {
		padding-left: 0.8rem;
		font-size: 0.75rem;
		opacity: 1;
	}
	
	.outline-item.active .outline-link {
		background: rgba(100, 255, 218, 0.15);
		border-left: none;
	}
}

@media (max-width: 768px) {
	.article-detail {
		padding: 0 1rem;
	}
	
	.article-title {
		font-size: 1.75rem;
	}
	
	.content-wrapper {
		padding: 1.5rem;
	}
	
	.article-stats {
		gap: 1rem;
	}
	
	.article-meta {
		gap: 0.75rem;
	}
	
	.category-tags-group {
		gap: 0.25rem;
	}
	
	.tag-inline {
		font-size: 0.65rem;
		padding: 0.15rem 0.4rem;
	}
	
	.article-actions {
		flex-direction: column;
		align-items: center;
	}
	
	.related-list {
		grid-template-columns: 1fr;
	}
	
	.breadcrumb {
		flex-wrap: wrap;
	}
	
	.breadcrumb-current {
		max-width: 150px;
	}
	
	.article-outline {
		padding: 1rem;
		max-height: 200px;
	}
	
	.outline-list {
		gap: 0.25rem;
	}
	
	.outline-link {
		padding: 0.3rem 0.6rem;
		font-size: 0.7rem;
	}
}
</style> 