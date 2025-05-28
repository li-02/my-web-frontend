<script setup lang="ts">
import { ref, onMounted } from "vue";

// 统计数据
const stats = ref([
	{ title: "总文章数", value: 24, icon: "📝", color: "#1890ff" },
	{ title: "总浏览量", value: 8934, icon: "👁️", color: "#52c41a" },
	{ title: "评论数", value: 156, icon: "💬", color: "#fa8c16" },
	{ title: "分类数", value: 8, icon: "📁", color: "#722ed1" },
]);

// 最新文章数据
const recentArticles = ref([
	{
		id: 1,
		title: "Spring Boot 3.0 新特性深度解析",
		status: "已发布",
		category: "技术分享",
		views: 1250,
		createTime: "2024-03-15",
	},
	{
		id: 2,
		title: "Vue 3 Composition API 最佳实践",
		status: "草稿",
		category: "前端开发",
		views: 0,
		createTime: "2024-03-12",
	},
	{
		id: 3,
		title: "MySQL 8.0 性能优化实战指南",
		status: "已发布",
		category: "数据库",
		views: 856,
		createTime: "2024-03-08",
	},
]);

// 组件挂载时获取数据
onMounted(() => {
	// 这里后续可以调用API获取实际数据
	// loadDashboardData()
});

// 获取仪表盘数据的方法
const loadDashboardData = async () => {
	try {
		// 后续实现API调用
		// const [statsData, articlesData] = await Promise.all([
		//   dashboardAPI.getStats(),
		//   dashboardAPI.getRecentArticles()
		// ])
		// stats.value = statsData
		// recentArticles.value = articlesData
	} catch (error) {
		console.error("获取仪表盘数据失败:", error);
	}
};
</script>

<template>
	<div class="dashboard">
		<h2 class="page-title">仪表盘</h2>

		<!-- 统计卡片 -->
		<div class="stats-grid">
			<div v-for="(stat, index) in stats" :key="index" class="stat-card">
				<div class="stat-icon" :style="{ backgroundColor: stat.color }">
					<span>{{ stat.icon }}</span>
				</div>
				<div class="stat-info">
					<div class="stat-value">{{ stat.value }}</div>
					<div class="stat-title">{{ stat.title }}</div>
				</div>
			</div>
		</div>

		<!-- 最新文章 -->
		<div class="recent-articles">
			<div class="section-header">
				<h3>最新文章</h3>
				<router-link to="/admin/articles" class="view-all-btn"> 查看全部 →</router-link>
			</div>

			<div class="article-list">
				<div v-for="article in recentArticles" :key="article.id" class="article-item">
					<div class="article-info">
						<h4 class="article-title">{{ article.title }}</h4>
						<div class="article-meta">
							<span class="category">{{ article.category }}</span>
							<span class="date">{{ article.createTime }}</span>
							<span
								class="status"
								:class="{
									published: article.status === '已发布',
									draft: article.status === '草稿',
								}"
							>
								{{ article.status }}
							</span>
						</div>
					</div>
					<div class="article-stats">
						<span class="views">{{ article.views }} 浏览</span>
					</div>
				</div>
			</div>
		</div>

		<!-- 快速操作 -->
		<div class="quick-actions">
			<h3>快速操作</h3>
			<div class="action-grid">
				<router-link to="/admin/articles/create" class="action-card">
					<span class="action-icon">➕</span>
					<span class="action-text">新建文章</span>
				</router-link>

				<router-link to="/admin/categories" class="action-card">
					<span class="action-icon">📁</span>
					<span class="action-text">管理分类</span>
				</router-link>

				<router-link to="/admin/tags" class="action-card">
					<span class="action-icon">🏷️</span>
					<span class="action-text">管理标签</span>
				</router-link>

				<router-link to="/admin/comments" class="action-card">
					<span class="action-icon">💬</span>
					<span class="action-text">管理评论</span>
				</router-link>
			</div>
		</div>
	</div>
</template>

<style scoped>
.dashboard {
	padding: 24px;
}

.page-title {
	font-size: 24px;
	font-weight: 600;
	color: var(--text-primary);
	margin-bottom: 24px;
}

/* 统计卡片 */
.stats-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 20px;
	margin-bottom: 32px;
}

.stat-card {
	background: rgba(26, 35, 50, 0.8);
	border-radius: 12px;
	padding: 24px;
	border: 1px solid rgba(100, 255, 218, 0.1);
	display: flex;
	align-items: center;
	gap: 16px;
	transition:
		transform 0.3s ease,
		box-shadow 0.3s ease;
}

.stat-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.stat-icon {
	width: 50px;
	height: 50px;
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 20px;
}

.stat-info {
	flex: 1;
}

.stat-value {
	font-size: 28px;
	font-weight: 600;
	color: var(--text-primary);
	margin-bottom: 4px;
}

.stat-title {
	color: var(--text-secondary);
	font-size: 14px;
}

/* 最新文章 */
.recent-articles {
	background: rgba(26, 35, 50, 0.8);
	border-radius: 12px;
	padding: 24px;
	border: 1px solid rgba(100, 255, 218, 0.1);
	margin-bottom: 32px;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
}

.section-header h3 {
	color: var(--text-primary);
	font-size: 18px;
	font-weight: 600;
}

.view-all-btn {
	color: var(--accent);
	text-decoration: none;
	font-size: 14px;
	font-weight: 500;
	transition: color 0.3s ease;
}

.view-all-btn:hover {
	color: var(--accent-hover);
}

.article-list {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.article-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px 0;
	border-bottom: 1px solid rgba(100, 255, 218, 0.1);
}

.article-item:last-child {
	border-bottom: none;
}

.article-info {
	flex: 1;
}

.article-title {
	color: var(--text-primary);
	font-size: 16px;
	font-weight: 500;
	margin-bottom: 8px;
	line-height: 1.4;
}

.article-meta {
	display: flex;
	gap: 12px;
	font-size: 12px;
}

.category {
	background: rgba(100, 255, 218, 0.1);
	color: var(--accent);
	padding: 2px 8px;
	border-radius: 4px;
}

.date {
	color: var(--text-secondary);
}

.status {
	font-weight: 500;
	padding: 2px 8px;
	border-radius: 4px;
}

.status.published {
	color: #52c41a;
	background: rgba(82, 196, 26, 0.1);
}

.status.draft {
	color: #fa8c16;
	background: rgba(250, 140, 22, 0.1);
}

.article-stats {
	color: var(--text-secondary);
	font-size: 14px;
}

/* 快速操作 */
.quick-actions {
	background: rgba(26, 35, 50, 0.8);
	border-radius: 12px;
	padding: 24px;
	border: 1px solid rgba(100, 255, 218, 0.1);
}

.quick-actions h3 {
	color: var(--text-primary);
	font-size: 18px;
	font-weight: 600;
	margin-bottom: 20px;
}

.action-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 16px;
}

.action-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding: 20px;
	background: rgba(36, 45, 61, 0.6);
	border: 1px solid rgba(100, 255, 218, 0.1);
	border-radius: 8px;
	text-decoration: none;
	color: var(--text-secondary);
	transition: all 0.3s ease;
}

.action-card:hover {
	color: var(--accent);
	background: rgba(100, 255, 218, 0.05);
	border-color: rgba(100, 255, 218, 0.2);
	transform: translateY(-2px);
}

.action-icon {
	font-size: 24px;
}

.action-text {
	font-size: 14px;
	font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
	.dashboard {
		padding: 16px;
	}

	.stats-grid {
		grid-template-columns: 1fr;
		gap: 16px;
	}

	.action-grid {
		grid-template-columns: repeat(2, 1fr);
	}

	.article-item {
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
	}
}
</style>
