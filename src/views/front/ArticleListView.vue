<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import NavBar from "@/components/NavBar.vue";

import { articleAPI } from "@/api/article.ts";
import { categoryAPI } from "@/api/category.ts";
import { ElMessage } from "element-plus";

// 文章接口定义
interface Article {
	id: number;
	title: string;
	summary?: string;
	content?: string;
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
	// 为了兼容ArticleCard组件
	date: string;
	category: string;
	excerpt: string;
}

// 分类接口定义
interface Category {
	id: number;
	name: string;
	description?: string;
}

const router = useRouter();

// 响应式数据
const articles = ref<Article[]>([]);
const categories = ref<Category[]>([]);
const loading = ref(false);

// 搜索和筛选
const searchKeyword = ref("");
const selectedCategory = ref("");

// 图片预览
const showImagePreview = ref(false);
const previewImageUrl = ref("");

// 分页数据
const currentPage = ref(0);
const pageSize = ref(12);
const totalElements = ref(0);
const totalPages = ref(0);

// 计算可见的页码
const visiblePages = computed(() => {
	const pages = [];
	const start = Math.max(1, currentPage.value - 2);
	const end = Math.min(totalPages.value, currentPage.value + 3);

	for (let i = start; i <= end; i++) {
		pages.push(i);
	}

	return pages;
});

// 加载分类列表
const loadCategories = async () => {
	try {
		const response = await categoryAPI.getCategories();
		categories.value = response.data;
	} catch (error: any) {
		console.error("获取分类列表失败:", error);
	}
};

// 加载文章列表
const loadArticles = async () => {
	try {
		loading.value = true;
		const params: any = {
			page: currentPage.value,
			size: pageSize.value,
			status: "PUBLISHED",
		};

		// 添加搜索和筛选条件
		if (searchKeyword.value.trim()) {
			params.keyword = searchKeyword.value.trim();
		}
		if (selectedCategory.value) {
			params.categoryId = selectedCategory.value;
		}

		const response = await articleAPI.getArticles(params);

		// 处理分页数据
		if (response.data.data.content) {
			// 分页响应格式
			articles.value = response.data.data.content.map((article: any) => ({
				...article,
				date: article.publishTime || article.createTime,
				category: article.categoryName || "未分类",
				excerpt: article.summary || article.content?.substring(0, 150) + "..." || "暂无摘要",
			}));
			totalElements.value = response.data.data.totalElements;
			totalPages.value = response.data.data.totalPages;
		} else {
			// 简单数组响应格式
			articles.value = response.data.data.map((article: any) => ({
				...article,
				date: article.publishTime || article.createTime,
				category: article.categoryName || "未分类",
				excerpt: article.summary || article.content?.substring(0, 150) + "..." || "暂无摘要",
			}));
			totalElements.value = response.data.data.length;
			totalPages.value = Math.ceil(response.data.data.length / pageSize.value);
		}

		console.log("文章列表加载成功:", articles.value);
	} catch (error: any) {
		console.error("获取文章列表失败:", error);
		ElMessage.error("获取文章列表失败");
	} finally {
		loading.value = false;
	}
};

// 搜索文章
const searchArticles = async () => {
	currentPage.value = 0; // 重置到第一页
	await loadArticles();
};

// 重置筛选
const resetFilters = () => {
	searchKeyword.value = "";
	selectedCategory.value = "";
	searchArticles();
};

// 分页改变
const changePage = (page: number) => {
	currentPage.value = page;
	loadArticles();
	// 滚动到页面顶部
	window.scrollTo({ top: 0, behavior: "smooth" });
};

// 格式化日期
const formatDate = (dateString: string) => {
	const date = new Date(dateString);
	return date
		.toLocaleDateString("zh-CN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		})
		.replace(/\//g, "-");
};

// 阅读文章 - 跳转到文章详情页
const readArticle = (articleId: number) => {
	router.push(`/articles/${articleId}`);
};

// 预览图片
const previewImage = (imageUrl: string, event: Event) => {
	event.stopPropagation(); // 阻止事件冒泡，避免触发文章跳转
	previewImageUrl.value = imageUrl;
	showImagePreview.value = true;
};

// 关闭图片预览
const closeImagePreview = () => {
	showImagePreview.value = false;
	previewImageUrl.value = "";
};

// 监听搜索关键字变化
watch(searchKeyword, (newValue, oldValue) => {
	// 当搜索框被清空时，自动重新搜索
	if (oldValue && oldValue.trim() && (!newValue || !newValue.trim())) {
		searchArticles();
	}
});

// 组件挂载时初始化
onMounted(async () => {
	console.log("ArticleListView mounted, DynamicBackground should be visible");
	await Promise.all([loadCategories(), loadArticles()]);
});
</script>

<template>
	<div class="article-list-page">
		<!-- 导航栏 -->
		<NavBar />

		<!-- 页面头部 -->
		<!-- <div class="page-header">
			<div class="header-content">
				<h1 class="page-title">文章列表</h1>
				<p class="page-description">探索技术世界，分享知识见解</p>
			</div>
		</div> -->

		<!-- 搜索和筛选区域 -->
		<div class="filter-section">
			<div class="filter-container">
				<div class="search-box">
					<input v-model="searchKeyword" type="text" placeholder="搜索文章标题..." class="search-input" @keyup.enter="searchArticles" />
					<button class="search-btn" @click="searchArticles">🔍</button>
				</div>

				<div class="filter-group">
					<select v-model="selectedCategory" class="filter-select" @change="searchArticles">
						<option value="">全部分类</option>
						<option v-for="category in categories" :key="category.id" :value="category.id">
							{{ category.name }}
						</option>
					</select>
					<button class="reset-btn" @click="resetFilters">重置</button>
				</div>
			</div>
		</div>

		<!-- 文章列表区域 -->
		<div class="articles-section">
			<!-- 加载状态 -->
			<div v-if="loading" class="loading-state">
				<div class="loading-spinner">⏳</div>
				<div class="loading-text">正在加载文章...</div>
			</div>

			<!-- 空状态 -->
			<div v-else-if="articles.length === 0" class="empty-state">
				<div class="empty-icon">📝</div>
				<div class="empty-title">
					{{ searchKeyword || selectedCategory ? "没有找到匹配的文章" : "暂无文章" }}
				</div>
				<div class="empty-description">
					{{ searchKeyword || selectedCategory ? "尝试调整搜索条件或筛选器" : "还没有发布任何文章，敬请期待！" }}
				</div>
			</div>

			<!-- 文章列表 -->
			<div v-else>
				<div class="articles-list">
					<article v-for="article in articles" :key="article.id" class="article-item" @click="readArticle(article.id)">
						<!-- 封面图片 -->
						<div v-if="article.coverImage" class="article-cover" @click="previewImage(article.coverImage, $event)">
							<img :src="article.coverImage" :alt="article.title" />
							<div class="cover-overlay">
								<span class="preview-icon">🔍</span>
							</div>
						</div>

						<!-- 文章内容 -->
						<div class="article-content">
							<div class="article-meta">
								<span class="article-date">📅 {{ formatDate(article.date) }}</span>
								<span class="article-category">{{ article.category }}</span>
								<div class="article-tags" v-if="article.tags && article.tags.length > 0">
									<span v-for="tag in article.tags" :key="tag" class="tag">{{ tag }}</span>
								</div>
								<span v-if="article.isPinned" class="pin-badge">📌 置顶</span>
								<span v-if="article.isOriginal" class="original-badge">原创</span>
							</div>

							<h2 class="article-title">{{ article.title }}</h2>

							<p class="article-excerpt">{{ article.excerpt }}</p>

							<div class="article-stats">
								<span class="stat-item">👁️ {{ article.viewCount }}</span>
								<!-- <span class="stat-item">❤️ {{ article.likeCount }}</span>
								<span class="stat-item">💬 {{ article.commentCount }}</span> -->
								<span class="stat-item">🔤 {{ article.wordCount }}字</span>
								<span class="stat-item">⏱️ {{ article.readingTime }}分钟</span>
							</div>
						</div>
					</article>
				</div>

				<!-- 分页组件 -->
				<div v-if="totalPages > 1" class="pagination">
					<div class="pagination-info">共 {{ totalElements }} 篇文章，第 {{ currentPage + 1 }} / {{ totalPages }} 页</div>
					<div class="pagination-controls">
						<button class="page-btn" :disabled="currentPage === 0" @click="changePage(currentPage - 1)">上一页</button>

						<div class="page-numbers">
							<button v-for="page in visiblePages" :key="page" class="page-number" :class="{ active: page - 1 === currentPage }" @click="changePage(page - 1)">
								{{ page }}
							</button>
						</div>

						<button class="page-btn" :disabled="currentPage === totalPages - 1" @click="changePage(currentPage + 1)">下一页</button>
					</div>
				</div>
			</div>
		</div>

		<!-- 图片预览弹窗 -->
		<div v-if="showImagePreview" class="image-preview-modal" @click="closeImagePreview">
			<div class="preview-container">
				<img :src="previewImageUrl" alt="预览图片" class="preview-image" @click.stop />
				<button class="close-btn" @click="closeImagePreview">✕</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
.article-list-page {
	min-height: 100vh;
	padding-top: 80px; /* 为固定导航栏留出空间 */
	background: var(--bg-primary);
}

/* 页面头部 */
.page-header {
	background: linear-gradient(135deg, rgba(15, 20, 25, 0.9), rgba(26, 35, 50, 0.9));
	padding: 4rem 2rem;
	text-align: center;
	margin-bottom: 3rem;
}

.header-content {
	max-width: 800px;
	margin: 0 auto;
}

.page-title {
	font-size: 3rem;
	font-weight: 700;
	margin-bottom: 1rem;
	background: var(--gradient);
	-webkit-background-clip: text;
	background-clip: text;
	-webkit-text-fill-color: transparent;
}

.page-description {
	font-size: 1.2rem;
	color: var(--text-secondary);
	margin: 0;
}

/* 筛选区域 */
.filter-section {
	padding: 0 2rem;
	margin-bottom: 3rem;
}

.filter-container {
	max-width: 1400px;
	margin: 0 auto;
	display: flex;
	justify-content: flex-start;
	align-items: center;
	gap: 2rem;
	background: rgba(26, 35, 50, 0.8);
	border-radius: 12px;
	padding: 1.5rem;
	border: 1px solid rgba(100, 255, 218, 0.1);
}

.search-box {
	display: flex;
	align-items: center;
	background: var(--bg-tertiary);
	border-radius: 8px;
	padding: 2px;
	border: 1px solid rgba(100, 255, 218, 0.1);
	flex: 1;
	max-width: 400px;
}

.search-input {
	flex: 1;
	padding: 12px 16px;
	background: transparent;
	border: none;
	color: var(--text-primary);
	font-size: 14px;
	outline: none;
}

.search-input::placeholder {
	color: var(--text-secondary);
}

.search-btn {
	padding: 12px 16px;
	background: var(--accent);
	color: var(--bg-primary);
	border: none;
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.3s ease;
	font-size: 14px;
}

.search-btn:hover {
	background: var(--accent-hover);
}

.filter-group {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.filter-select {
	padding: 12px 16px;
	background: var(--bg-tertiary);
	border: 1px solid rgba(100, 255, 218, 0.1);
	border-radius: 8px;
	color: var(--text-primary);
	font-size: 14px;
	cursor: pointer;
	outline: none;
	min-width: 120px;
}

.filter-select:focus {
	border-color: var(--accent);
}

.reset-btn {
	padding: 12px 20px;
	background: transparent;
	color: var(--text-secondary);
	border: 1px solid rgba(100, 255, 218, 0.2);
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.3s ease;
	font-size: 14px;
}

.reset-btn:hover {
	color: var(--accent);
	border-color: var(--accent);
}

/* 文章区域 */
.articles-section {
	padding: 0 2rem;
	max-width: 1400px;
	margin: 0 auto;
}

.articles-list {
	display: flex;
	flex-direction: column;
	gap: 2rem;
	margin-bottom: 3rem;
}

.article-item {
	display: flex;
	background: rgba(26, 35, 50, 0.8);
	backdrop-filter: blur(10px);
	border-radius: 16px;
	padding: 1.5rem;
	border: 1px solid rgba(100, 255, 218, 0.1);
	transition: all 0.3s ease;
	cursor: pointer;
	overflow: hidden;
}

.article-item:hover {
	transform: translateY(-2px);
	box-shadow: 0 10px 30px var(--shadow);
	border-color: rgba(100, 255, 218, 0.2);
}

.article-cover {
	flex-shrink: 0;
	width: 200px;
	height: 150px;
	margin-right: 1.5rem;
	border-radius: 12px;
	overflow: hidden;
	position: relative;
	cursor: pointer;
}

.article-cover img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.3s ease;
}

.article-item:hover .article-cover img {
	transform: scale(1.05);
}

.cover-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0;
	transition: opacity 0.3s ease;
}

.article-cover:hover .cover-overlay {
	opacity: 1;
}

.preview-icon {
	color: white;
	font-size: 1.5rem;
	pointer-events: none;
}

.article-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.article-meta {
	display: flex;
	align-items: center;
	gap: 1rem;
	font-size: 0.875rem;
	color: var(--text-secondary);
	flex-wrap: wrap;
}

.article-date {
	display: flex;
	align-items: center;
	gap: 0.25rem;
}

.article-category {
	background: rgba(100, 255, 218, 0.1);
	color: var(--accent);
	padding: 0.25rem 0.75rem;
	border-radius: 12px;
	font-size: 0.75rem;
	font-weight: 500;
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

.article-title {
	font-size: 1.5rem;
	font-weight: 600;
	color: var(--text-primary);
	line-height: 1.4;
	margin: 0;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.article-excerpt {
	color: var(--text-secondary);
	line-height: 1.6;
	margin: 0;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.article-stats {
	display: flex;
	align-items: center;
	gap: 1rem;
	font-size: 0.875rem;
	color: var(--text-secondary);
	flex-wrap: wrap;
}

.stat-item {
	display: flex;
	align-items: center;
	gap: 0.25rem;
}

.article-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	align-items: center;
}

.tag {
	background: rgba(100, 255, 218, 0.05);
	color: var(--text-secondary);
	padding: 0.25rem 0.5rem;
	border-radius: 8px;
	font-size: 0.75rem;
	border: 1px solid rgba(100, 255, 218, 0.1);
}

/* 加载状态 */
.loading-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 4rem 2rem;
	text-align: center;
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
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

/* 空状态 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 4rem 2rem;
	text-align: center;
}

.empty-icon {
	font-size: 4rem;
	margin-bottom: 1rem;
	opacity: 0.6;
}

.empty-title {
	font-size: 1.5rem;
	font-weight: 600;
	color: var(--text-primary);
	margin-bottom: 0.5rem;
}

.empty-description {
	color: var(--text-secondary);
	font-size: 1rem;
	max-width: 400px;
}

/* 分页组件 */
.pagination {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1rem;
	padding: 2rem 0;
	border-top: 1px solid rgba(100, 255, 218, 0.1);
}

.pagination-info {
	color: var(--text-secondary);
	font-size: 14px;
}

.pagination-controls {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.page-btn {
	padding: 8px 16px;
	background: var(--bg-tertiary);
	color: var(--text-primary);
	border: 1px solid rgba(100, 255, 218, 0.1);
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.3s ease;
	font-size: 14px;
}

.page-btn:hover:not(:disabled) {
	background: var(--accent);
	color: var(--bg-primary);
	border-color: var(--accent);
}

.page-btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.page-numbers {
	display: flex;
	gap: 0.5rem;
}

.page-number {
	width: 36px;
	height: 36px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--bg-tertiary);
	color: var(--text-primary);
	border: 1px solid rgba(100, 255, 218, 0.1);
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.3s ease;
	font-size: 14px;
}

.page-number:hover {
	background: var(--accent);
	color: var(--bg-primary);
	border-color: var(--accent);
}

.page-number.active {
	background: var(--accent);
	color: var(--bg-primary);
	border-color: var(--accent);
}

/* 图片预览弹窗 */
.image-preview-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.9);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	backdrop-filter: blur(10px);
	animation: fadeIn 0.3s ease;
}

.preview-container {
	position: relative;
	max-width: 95vw;
	max-height: 95vh;
	display: flex;
	align-items: center;
	justify-content: center;
}

.preview-image {
	max-width: 150%;
	max-height: 150%;
	object-fit: contain;
	border-radius: 8px;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	animation: zoomIn 0.3s ease;
}

.close-btn {
	position: absolute;
	top: -50px;
	right: -50px;
	width: 40px;
	height: 40px;
	background: rgba(255, 255, 255, 0.1);
	border: 2px solid rgba(255, 255, 255, 0.3);
	border-radius: 50%;
	color: white;
	font-size: 18px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;
	backdrop-filter: blur(10px);
}

.close-btn:hover {
	background: rgba(255, 255, 255, 0.2);
	border-color: rgba(255, 255, 255, 0.5);
	transform: scale(1.1);
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes zoomIn {
	from {
		transform: scale(0.8);
		opacity: 0;
	}
	to {
		transform: scale(1);
		opacity: 1;
	}
}

/* 响应式设计 */
@media (max-width: 768px) {
	.page-title {
		font-size: 2rem;
	}

	.filter-container {
		flex-direction: column;
		gap: 1rem;
	}

	.search-box {
		max-width: none;
	}

	.article-item {
		flex-direction: column;
		padding: 1rem;
	}

	.article-cover {
		width: 100%;
		height: 200px;
		margin-right: 0;
		margin-bottom: 1rem;
	}

	.article-title {
		font-size: 1.25rem;
	}

	.article-meta {
		gap: 0.5rem;
	}

	.article-stats {
		gap: 0.75rem;
	}

	.pagination-controls {
		flex-wrap: wrap;
		justify-content: center;
	}

	.close-btn {
		top: -40px;
		right: -40px;
		width: 35px;
		height: 35px;
		font-size: 16px;
	}

	.preview-container {
		max-width: 95vw;
		max-height: 95vh;
	}

	.preview-image {
		max-width: 100%;
		max-height: 100%;
	}
}
</style>
