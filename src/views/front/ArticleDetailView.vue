<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
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

const route = useRoute();
const router = useRouter();

// 响应式数据
const article = ref<Article | null>(null);
const relatedArticles = ref<Article[]>([]);
const loading = ref(false);
const isLiked = ref(false);

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

// 加载文章详情
const loadArticle = async (articleId: string) => {
	try {
		loading.value = true;
		const response = await articleAPI.getArticle(articleId);
		article.value = response.data;
		
		// 调试：打印文章内容，检查代码块格式
		console.log("文章内容:", article.value?.content);
		
		// 文章加载成功后增加浏览次数
		await incrementViewCount(articleId);
		
		// 加载相关文章
		await loadRelatedArticles();
		
		console.log("文章详情加载成功:", article.value);
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

// 组件挂载时加载文章
onMounted(() => {
	const articleId = route.params.id as string;
	if (articleId) {
		loadArticle(articleId);
	} else {
		router.push("/articles");
	}
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
						<span class="article-category">{{ article.categoryName || '未分类' }}</span>
						<span v-if="article.isPinned" class="pin-badge">📌 置顶</span>
						<span v-if="article.isOriginal" class="original-badge">原创</span>
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
					
					<!-- 文章标签 -->
					<div v-if="article.tags && article.tags.length > 0" class="article-tags">
						<span v-for="tag in article.tags" :key="tag" class="tag">{{ tag }}</span>
					</div>
				</div>
			</header>
			
			<!-- 封面图片 -->
			<div v-if="article.coverImage" class="article-cover">
				<img :src="article.coverImage" :alt="article.title" />
			</div>
			
			<!-- 文章正文 -->
			<main class="article-content">
				<div class="content-wrapper">
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
	max-width: 900px;
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

/* 文章标签 */
.article-tags {
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.tag {
	background: rgba(100, 255, 218, 0.05);
	color: var(--text-secondary);
	padding: 0.25rem 0.75rem;
	border-radius: 12px;
	font-size: 0.75rem;
	border: 1px solid rgba(100, 255, 218, 0.1);
	transition: all 0.3s ease;
}

.tag:hover {
	background: rgba(100, 255, 218, 0.1);
	border-color: var(--accent);
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

.content-wrapper {
	background: var(--bg-secondary);
	border-radius: 16px;
	padding: 3rem;
	border: 1px solid rgba(100, 255, 218, 0.1);
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
}
</style> 