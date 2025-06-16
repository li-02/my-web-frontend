<script setup lang="ts">
import { ref, onMounted } from "vue";
import ArticleCard from "../../components/ArticleCard.vue";
import Particles from "../../components/Particles.vue";
import NavBar from "../../components/NavBar.vue";
import { articleAPI } from "@/api/article.ts";
import { ElMessage } from "element-plus";

// 更新Article接口以匹配后端数据结构
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
	// 为了兼容ArticleCard组件，添加这些字段
	date: string;
	category: string;
	excerpt: string;
}

interface SocialLink {
	icon: string;
	title: string;
}

const articles = ref<Article[]>([]);
const loading = ref(false);

const socialLinks: SocialLink[] = [
	{ icon: "🐙", title: "GitHub" },
	{ icon: "🐦", title: "Twitter" },
	{ icon: "💼", title: "LinkedIn" },
	{ icon: "📧", title: "Email" },
];

// 加载文章列表
const loadArticles = async () => {
	try {
		loading.value = true;
		const response = await articleAPI.getArticles({
			page: 0,
			size: 6, // 首页只显示6篇最新文章作为预览
			status: "PUBLISHED", // 只显示已发布的文章
		});

		// 转换数据格式以兼容ArticleCard组件
		const rawArticles = response.data.data.content || response.data.data;
		articles.value = rawArticles.map((article: any) => ({
			...article,
			date: article.publishTime || article.createTime,
			category: article.categoryName || "未分类",
			excerpt: article.summary || article.content?.substring(0, 150) + "..." || "暂无摘要",
		}));

		console.log("文章列表加载成功:", articles.value);
	} catch (error: any) {
		console.error("获取文章列表失败:", error);
		ElMessage.error("获取文章列表失败");
		// 如果API调用失败，使用默认的静态数据作为备选
		articles.value = [
			{
				id: 1,
				date: "2024-03-15",
				category: "技术分享",
				title: "Spring Boot 3.0 新特性深度解析",
				excerpt: "Spring Boot 3.0 带来了许多令人兴奋的新特性，包括对 Java 17 的原生支持、GraalVM 本地镜像优化，以及全新的观察性功能。本文将深入探讨这些新特性及其实际应用场景...",
				viewCount: 0,
				likeCount: 0,
				commentCount: 0,
				readingTime: 5,
				createTime: "2024-03-15",
				updateTime: "2024-03-15",
				status: "PUBLISHED",
				isPinned: false,
				isAllowComment: true,
				isOriginal: true,
				accessType: "PUBLIC",
			},
			{
				id: 2,
				date: "2024-03-12",
				category: "前端开发",
				title: "Vue 3 Composition API 最佳实践",
				excerpt: "Composition API 是 Vue 3 中最重要的新特性之一，它为我们提供了更灵活的组件逻辑组织方式。本文将通过实际案例，展示如何在项目中有效地使用 Composition API...",
				viewCount: 0,
				likeCount: 0,
				commentCount: 0,
				readingTime: 8,
				createTime: "2024-03-12",
				updateTime: "2024-03-12",
				status: "PUBLISHED",
				isPinned: false,
				isAllowComment: true,
				isOriginal: true,
				accessType: "PUBLIC",
			},
			{
				id: 3,
				date: "2024-03-08",
				category: "数据库",
				title: "MySQL 8.0 性能优化实战指南",
				excerpt: "数据库性能优化是后端开发中的重要课题。本文将从索引设计、查询优化、配置调优等多个维度，分享 MySQL 8.0 的性能优化实践经验，帮助你构建高性能的数据库系统...",
				viewCount: 0,
				likeCount: 0,
				commentCount: 0,
				readingTime: 12,
				createTime: "2024-03-08",
				updateTime: "2024-03-08",
				status: "PUBLISHED",
				isPinned: false,
				isAllowComment: true,
				isOriginal: true,
				accessType: "PUBLIC",
			},
			{
				id: 4,
				date: "2024-03-05",
				category: "架构设计",
				title: "微服务架构设计模式与实践",
				excerpt: "微服务架构已成为现代软件开发的主流选择。本文将深入探讨微服务的设计模式、服务拆分原则、以及在实际项目中的落地实践，为你的架构设计提供参考...",
				viewCount: 0,
				likeCount: 0,
				commentCount: 0,
				readingTime: 15,
				createTime: "2024-03-05",
				updateTime: "2024-03-05",
				status: "PUBLISHED",
				isPinned: false,
				isAllowComment: true,
				isOriginal: true,
				accessType: "PUBLIC",
			},
		] as Article[];
	} finally {
		loading.value = false;
	}
};

onMounted(() => {
	// 加载文章数据
	loadArticles();
});
</script>

<template>
	<div class="w-full">
		<!-- 导航栏 -->
		<NavBar />

		<div class="main-content">
			<!-- 头部介绍区域 -->
			<section class="hero" id="home">
				<Particles />
				<div class="hero-content">
					<h1>欢迎来到我的博客</h1>
					<p>分享技术见解，记录成长历程，探索数字世界的无限可能。在这里，我们一起学习、思考、创造。</p>
					<router-link to="/articles" class="cta-button"> 开始阅读 </router-link>
				</div>
			</section>

			<!-- 博客文章区域 -->
			<section class="blog-section" id="blog">
				<h2 class="section-title">最新文章</h2>

				<!-- 加载状态 -->
				<div v-if="loading" class="loading-state">
					<div class="loading-spinner">⏳</div>
					<div class="loading-text">正在加载文章...</div>
				</div>

				<!-- 空状态 -->
				<div v-else-if="articles.length === 0" class="empty-state">
					<div class="empty-icon">📝</div>
					<div class="empty-title">暂无文章</div>
					<div class="empty-description">还没有发布任何文章，敬请期待！</div>
				</div>

				<!-- 文章列表 -->
				<div v-else>
					<div class="articles-grid">
						<ArticleCard v-for="article in articles" :key="article.id" :article="article" />
					</div>

					<!-- 查看更多按钮 -->
					<div class="view-more-section">
						<router-link to="/articles" class="view-more-btn">
							<span class="btn-icon">📚</span>
							查看所有文章
							<span class="btn-arrow">→</span>
						</router-link>
					</div>
				</div>
			</section>
		</div>

		<!-- 页脚 -->
		<div class="page-footer">
			<div class="footer-content w-full">
				<div class="social-links">
					<a v-for="(social, index) in socialLinks" :key="index" href="#" :title="social.title">
						{{ social.icon }}
					</a>
				</div>
				<p>&copy; 2024 我的博客. 用 ❤️ 创建</p>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* 主页面 */
.main-content {
	width: 100%;
	padding: 0;
	margin: 0;
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
	padding: 0 2rem;
}

.hero-content {
	z-index: 2;
	animation: fadeInUp 1s ease-out;
	max-width: 800px;
	margin: 0 auto;
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
	padding: 4rem 2rem;
}

.section-title {
	text-align: center;
	font-size: 2.5rem;
	font-weight: 700;
	margin-bottom: 3rem;
	color: var(--text-primary);
	max-width: 1400px;
	margin-left: auto;
	margin-right: auto;
	margin-bottom: 3rem;
}

.articles-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, 350px);
	gap: 2rem;
	margin-bottom: 3rem;
	max-width: 1400px;
	margin-left: auto;
	margin-right: auto;
	justify-content: center;
}

/* 页脚 */
.page-footer {
	background: var(--bg-secondary);
	padding: 3rem 0;
	text-align: center;
	margin-top: 4rem;
	border-top: 1px solid rgba(100, 255, 218, 0.1);
}

.footer-content {
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

/* 查看更多按钮 */
.view-more-section {
	display: flex;
	justify-content: center;
	margin-top: 3rem;
}

.view-more-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 1rem 2rem;
	background: rgba(100, 255, 218, 0.1);
	color: var(--accent);
	text-decoration: none;
	border-radius: 50px;
	font-weight: 600;
	border: 2px solid var(--accent);
	transition: all 0.3s ease;
	font-size: 1rem;
}

.view-more-btn:hover {
	background: var(--accent);
	color: var(--bg-primary);
	transform: translateY(-2px);
	box-shadow: 0 10px 30px rgba(100, 255, 218, 0.3);
}

.view-more-btn .btn-icon {
	font-size: 1.1rem;
}

.view-more-btn .btn-arrow {
	transition: transform 0.3s ease;
}

.view-more-btn:hover .btn-arrow {
	transform: translateX(5px);
}

/* 响应式设计 */
@media (max-width: 768px) {
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
