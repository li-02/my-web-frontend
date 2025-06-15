<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { articleAPI } from "@/api/article.ts";
import { categoryAPI } from "@/api/category.ts";
import { ElMessage, ElMessageBox } from "element-plus";

// 定义文章类型（匹配数据库字段）
interface Article {
	id: number;
	title: string;
	slug?: string;
	content?: string;
	summary?: string;
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
	categoryName?: string; // 关联查询得到的分类名称
	isPinned: boolean;
	isAllowComment: boolean;
	isOriginal: boolean;
	accessType: string;
	password?: string;
	metaDescription?: string;
	metaKeywords?: string;
	wordCount?: number;
	tags?: string[]; // 标签数组（关联查询得到）
}

// 定义分类类型
interface Category {
	id: number;
	name: string;
	description?: string;
}

const router = useRouter();

// 文章列表数据
const articles = ref<Article[]>([]);
const loading = ref(false);
const categories = ref<Category[]>([]);

// 搜索和筛选
const searchKeyword = ref("");
const selectedStatus = ref("");
const selectedCategory = ref("");

// 分页数据
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(4);

// 选中的文章
const selectedArticles = ref<number[]>([]);

// 状态选项
const statusOptions = [
	{ label: "全部状态", value: "" },
	{ label: "已发布", value: "PUBLISHED" },
	{ label: "草稿", value: "DRAFT" },
	{ label: "已归档", value: "ARCHIVED" },
];

// 动态分类选项
const categoryOptions = computed(() => {
	const options = [{ label: "全部分类", value: "" }];
	categories.value.forEach(category => {
		options.push({ label: category.name, value: category.name });
	});
	return options;
});

// 获取状态显示文本
const getStatusText = (status: string) => {
	const statusMap: Record<string, string> = {
		PUBLISHED: "已发布",
		DRAFT: "草稿",
		ARCHIVED: "已归档",
	};
	return statusMap[status] || status;
};

// 获取状态样式类
const getStatusClass = (status: string) => {
	const classMap: Record<string, string> = {
		PUBLISHED: "published",
		DRAFT: "draft",
		ARCHIVED: "archived",
	};
	return classMap[status] || "";
};

// 创建新文章
const createArticle = () => {
	router.push("/admin/articles/create");
};

// 编辑文章
const editArticle = (id: number) => {
	router.push(`/admin/articles/edit/${id}`);
};

// 切换置顶状态
const togglePin = async (article: Article) => {
	try {
		const newPinStatus = !article.isPinned;
		await articleAPI.updatePinStatus(article.id.toString(), newPinStatus);
		
		article.isPinned = newPinStatus;
		ElMessage.success(`文章${newPinStatus ? '置顶' : '取消置顶'}成功`);
	} catch (error: any) {
		console.error("更新置顶状态失败:", error);
		ElMessage.error("更新置顶状态失败");
	}
};

// 切换发布状态
const togglePublish = async (article: Article) => {
	try {
		const newStatus = article.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
		await articleAPI.updatePublishStatus(article.id.toString(), newStatus);
		
		article.status = newStatus;
		const statusText = newStatus === "PUBLISHED" ? "发布" : "设为草稿";
		ElMessage.success(`文章${statusText}成功`);
	} catch (error: any) {
		console.error("更新发布状态失败:", error);
		ElMessage.error("更新发布状态失败");
	}
};

// 删除文章
const deleteArticle = async (id: number) => {
	try {
		await ElMessageBox.confirm(
			'确定要删除这篇文章吗？此操作不可撤销。',
			'删除确认',
			{
				confirmButtonText: '删除',
				cancelButtonText: '取消',
				type: 'warning',
			}
		);
		
		await articleAPI.deleteArticle(id.toString());
		ElMessage.success('文章删除成功');
		
		// 重新加载文章列表
		await loadArticles();
	} catch (error: any) {
		if (error !== 'cancel') {
			console.error("删除文章失败:", error);
			ElMessage.error(error.response?.data?.message || "删除文章失败");
		}
	}
};

// 批量操作
const batchPublish = async () => {
	if (selectedArticles.value.length === 0) {
		ElMessage.warning("请选择要操作的文章");
		return;
	}
	
	try {
		await ElMessageBox.confirm(
			`确定要批量发布 ${selectedArticles.value.length} 篇文章吗？`,
			'批量发布确认',
			{
				confirmButtonText: '发布',
				cancelButtonText: '取消',
				type: 'info',
			}
		);
		
		await articleAPI.batchUpdateStatus(selectedArticles.value, 'PUBLISHED');
		
		selectedArticles.value = [];
		ElMessage.success("批量发布成功");
		await loadArticles();
	} catch (error: any) {
		if (error !== 'cancel') {
			console.error("批量发布失败:", error);
			ElMessage.error("批量发布失败");
		}
	}
};

const batchDelete = async () => {
	if (selectedArticles.value.length === 0) {
		ElMessage.warning("请选择要删除的文章");
		return;
	}
	
	try {
		await ElMessageBox.confirm(
			`确定要删除 ${selectedArticles.value.length} 篇文章吗？此操作不可撤销。`,
			'批量删除确认',
			{
				confirmButtonText: '删除',
				cancelButtonText: '取消',
				type: 'warning',
			}
		);
		
		await articleAPI.batchDelete(selectedArticles.value);
		
		selectedArticles.value = [];
		ElMessage.success("批量删除成功");
		await loadArticles();
	} catch (error: any) {
		if (error !== 'cancel') {
			console.error("批量删除失败:", error);
			ElMessage.error("批量删除失败");
		}
	}
};

// 全选/取消全选
const isAllSelected = ref(false);
const toggleSelectAll = () => {
	if (isAllSelected.value) {
		selectedArticles.value = [];
	} else {
		selectedArticles.value = articles.value.map((article) => article.id);
	}
	isAllSelected.value = !isAllSelected.value;
};

// 重置筛选
const resetFilters = () => {
	searchKeyword.value = "";
	selectedStatus.value = "";
	selectedCategory.value = "";
	searchArticles();
};

// 加载文章列表
const loadArticles = async () => {
	try {
		loading.value = true;
		const params: any = {
			page: currentPage.value - 1, // 后端通常从0开始
			size: pageSize.value,
		};
		
		// 添加搜索和筛选条件
		if (searchKeyword.value.trim()) {
			params.keyword = searchKeyword.value.trim();
		}
		if (selectedStatus.value) {
			params.status = selectedStatus.value;
		}
		if (selectedCategory.value) {
			// 根据分类名称找到分类ID
			const category = categories.value.find(cat => cat.name === selectedCategory.value);
			if (category) {
				params.categoryId = category.id;
			}
		}
		
		const response = await articleAPI.getArticles(params);
		articles.value = response.data.data;
		total.value = response.data.total || 0;	
		
		console.log("文章列表加载成功:", response.data);
	} catch (error: any) {
		console.error("获取文章列表失败:", error);
		ElMessage.error(error.response?.data?.message || "获取文章列表失败");
	} finally {
		loading.value = false;
	}
};

// 加载分类列表
const loadCategories = async () => {
	try {
		const response = await categoryAPI.getCategories();
		categories.value = response.data;
		console.log("分类列表加载成功:", response.data);
	} catch (error: any) {
		console.error("获取分类列表失败:", error);
		ElMessage.error(error.response?.data?.message || "获取分类列表失败");
	}
};

// 搜索文章
const searchArticles = async () => {
	currentPage.value = 1; // 重置到第一页
	await loadArticles();
};

// 分页改变
const handlePageChange = (page: number) => {
	currentPage.value = page;
	loadArticles();
};

// 监听搜索关键字变化
watch(searchKeyword, (newValue, oldValue) => {
	// 当搜索框被清空时，自动重新搜索
	if (oldValue && oldValue.trim() && (!newValue || !newValue.trim())) {
		searchArticles();
	}
});

// 组件挂载时获取数据
onMounted(async () => {
	await Promise.all([
		loadCategories(),
		loadArticles()
	]);
});
</script>

<template>
	<div class="article-manage">
		<div class="page-header">
			<h2 class="page-title">文章管理</h2>
			<button class="create-btn" @click="createArticle">
				<span class="btn-icon">➕</span>
				新建文章
			</button>
		</div>

		<!-- 搜索和筛选区域 -->
		<div class="filter-section">
			<div class="filter-row">
				<div class="search-box">
					<input v-model="searchKeyword" type="text" placeholder="搜索文章标题..." class="search-input" @keyup.enter="searchArticles" />
					<button class="search-btn" @click="searchArticles">🔍</button>
				</div>

				<div class="filter-group">
					<select v-model="selectedStatus" class="filter-select" @change="searchArticles">
						<option v-for="option in statusOptions" :key="option.value" :value="option.value">
							{{ option.label }}
						</option>
					</select>

					<select v-model="selectedCategory" class="filter-select" @change="searchArticles">
						<option v-for="option in categoryOptions" :key="option.value" :value="option.value">
							{{ option.label }}
						</option>
					</select>

					<button class="reset-btn" @click="resetFilters">重置</button>
				</div>
			</div>

			<!-- 批量操作 -->
			<div v-if="selectedArticles.length > 0" class="batch-actions">
				<span class="selected-count">已选择 {{ selectedArticles.length }} 篇文章</span>
				<div class="batch-btns">
					<button class="batch-btn publish" @click="batchPublish">批量发布</button>
					<button class="batch-btn delete" @click="batchDelete">批量删除</button>
				</div>
			</div>
		</div>

		<!-- 加载状态 -->
		<div v-if="loading" class="loading-state">
			<div class="loading-spinner">⏳</div>
			<div class="loading-text">正在加载文章列表...</div>
		</div>

		<!-- 空状态 -->
		<div v-else-if="articles.length === 0" class="empty-state">
			<div class="empty-icon">📝</div>
			<div class="empty-title">暂无文章</div>
			<div class="empty-description">
				{{ searchKeyword || selectedStatus || selectedCategory ? '没有找到匹配的文章' : '还没有发布任何文章，点击上方按钮创建第一篇文章吧！' }}
			</div>
			<button v-if="!searchKeyword && !selectedStatus && !selectedCategory" class="empty-btn" @click="createArticle">
				创建第一篇文章
			</button>
		</div>

		<!-- 文章列表 -->
		<div v-else class="article-list">
			<div class="list-header">
				<label class="select-all">
					<input v-model="isAllSelected" type="checkbox" @change="toggleSelectAll" />
					<span class="checkmark"></span>
				</label>
				<div class="header-item title">标题</div>
				<div class="header-item status">状态</div>
				<div class="header-item category">分类</div>
				<div class="header-item views">浏览量</div>
				<div class="header-item date">更新时间</div>
				<div class="header-item actions">操作</div>
			</div>

			<div v-for="article in articles" :key="article.id" class="article-item">
				<label class="article-select">
					<input v-model="selectedArticles" :value="article.id" type="checkbox" />
					<span class="checkmark"></span>
				</label>

				<div class="article-title">
					<div class="title-main">
						<span v-if="article.isPinned" class="pin-icon" title="置顶">📌</span>
						<span v-if="article.isOriginal" class="original-badge">原</span>
						{{ article.title }}
					</div>
					<div class="article-tags">
						<span v-for="tag in article.tags" :key="tag" class="tag">{{ tag }}</span>
					</div>
				</div>

				<div class="article-status">
					<span class="status-badge" :class="getStatusClass(article.status)">
						{{ getStatusText(article.status) }}
					</span>
				</div>

				<div class="article-category">{{ article.categoryName || '未分类' }}</div>

				<div class="article-views">{{ article.viewCount }}</div>

				<div class="article-date">{{ article.updateTime }}</div>

				<div class="article-actions">
					<button class="action-btn edit" @click="editArticle(article.id)" title="编辑">✏️</button>
					<button class="action-btn pin" @click="togglePin(article)" :title="article.isPinned ? '取消置顶' : '置顶'">
						{{ article.isPinned ? "📌" : "📍" }}
					</button>
					<button class="action-btn publish" @click="togglePublish(article)" :title="article.status === 'PUBLISHED' ? '取消发布' : '发布'">
						{{ article.status === "PUBLISHED" ? "👁️" : "🚀" }}
					</button>
					<button class="action-btn delete" @click="deleteArticle(article.id)" title="删除">🗑️</button>
				</div>
			</div>
		</div>

		<!-- 分页组件 -->
		<div v-if="articles.length > 0" class="pagination">
			<div class="pagination-info">共 {{ total }} 篇文章，第 {{ currentPage }} / {{ Math.ceil(total / pageSize) }} 页</div>
			<div class="pagination-controls">
				<button class="page-btn" :disabled="currentPage === 1" @click="handlePageChange(currentPage - 1)">上一页</button>
				<span class="page-numbers">
					<button v-for="page in Math.ceil(total / pageSize)" :key="page" class="page-number" :class="{ active: page === currentPage }" @click="handlePageChange(page)">
						{{ page }}
					</button>
				</span>
				<button class="page-btn" :disabled="currentPage === Math.ceil(total / pageSize)" @click="handlePageChange(currentPage + 1)">下一页</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
.article-manage {
	padding: 24px;
}

.page-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
}

.page-title {
	font-size: 24px;
	font-weight: 600;
	color: var(--text-primary);
}

.create-btn {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 24px;
	background: var(--accent);
	color: var(--bg-primary);
	border: none;
	border-radius: 8px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.3s ease;
}

.create-btn:hover {
	background: var(--accent-hover);
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(100, 255, 218, 0.3);
}

.btn-icon {
	font-size: 16px;
}

/* 筛选区域 */
.filter-section {
	background: rgba(26, 35, 50, 0.8);
	border-radius: 12px;
	padding: 20px;
	border: 1px solid rgba(100, 255, 218, 0.1);
	margin-bottom: 24px;
}

.filter-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
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
	padding: 10px 16px;
	background: transparent;
	border: none;
	color: var(--text-primary);
	font-size: 14px;
}

.search-input:focus {
	outline: none;
}

.search-input::placeholder {
	color: var(--text-secondary);
}

.search-btn {
	padding: 10px 16px;
	background: var(--accent);
	color: var(--bg-primary);
	border: none;
	border-radius: 6px;
	cursor: pointer;
	transition: background 0.3s ease;
}

.search-btn:hover {
	background: var(--accent-hover);
}

.filter-group {
	display: flex;
	align-items: center;
	gap: 12px;
}

.filter-select {
	padding: 10px 16px;
	background: var(--bg-tertiary);
	border: 1px solid rgba(100, 255, 218, 0.1);
	border-radius: 6px;
	color: var(--text-primary);
	font-size: 14px;
	cursor: pointer;
}

.filter-select:focus {
	outline: none;
	border-color: var(--accent);
}

.reset-btn {
	padding: 10px 16px;
	background: transparent;
	border: 1px solid rgba(100, 255, 218, 0.3);
	border-radius: 6px;
	color: var(--text-secondary);
	cursor: pointer;
	transition: all 0.3s ease;
}

.reset-btn:hover {
	color: var(--accent);
	border-color: var(--accent);
}

.batch-actions {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 16px;
	padding: 12px 16px;
	background: rgba(100, 255, 218, 0.05);
	border-radius: 8px;
	border: 1px solid rgba(100, 255, 218, 0.1);
}

.selected-count {
	color: var(--accent);
	font-weight: 500;
	font-size: 14px;
}

.batch-btns {
	display: flex;
	gap: 8px;
}

.batch-btn {
	padding: 8px 16px;
	border: none;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.3s ease;
}

.batch-btn.publish {
	background: #52c41a;
	color: white;
}

.batch-btn.publish:hover {
	background: #389e0d;
}

.batch-btn.delete {
	background: #ff6b6b;
	color: white;
}

.batch-btn.delete:hover {
	background: #ff5252;
}

/* 文章列表 */
.article-list {
	background: rgba(26, 35, 50, 0.8);
	border-radius: 12px;
	border: 1px solid rgba(100, 255, 218, 0.1);
	overflow: hidden;
	margin-bottom: 24px;
}

.list-header {
	display: grid;
	grid-template-columns: 50px 1fr 120px 120px 100px 140px 140px;
	gap: 16px;
	padding: 16px 20px;
	background: rgba(36, 45, 61, 0.6);
	border-bottom: 1px solid rgba(100, 255, 218, 0.1);
	font-weight: 600;
	color: var(--text-primary);
	font-size: 14px;
}

.header-item {
	display: flex;
	align-items: center;
}

.select-all {
	display: flex;
	align-items: center;
	cursor: pointer;
}

.article-item {
	display: grid;
	grid-template-columns: 50px 1fr 120px 120px 100px 140px 140px;
	gap: 16px;
	padding: 16px 20px;
	border-bottom: 1px solid rgba(100, 255, 218, 0.05);
	transition: background 0.3s ease;
}

.article-item:hover {
	background: rgba(100, 255, 218, 0.02);
}

.article-item:last-child {
	border-bottom: none;
}

.article-select {
	display: flex;
	align-items: center;
	cursor: pointer;
}

/* 复选框样式 */
.select-all input[type="checkbox"],
.article-select input[type="checkbox"] {
	display: none;
}

.checkmark {
	width: 18px;
	height: 18px;
	border: 2px solid rgba(100, 255, 218, 0.3);
	border-radius: 4px;
	position: relative;
	transition: all 0.3s ease;
}

.select-all input[type="checkbox"]:checked + .checkmark,
.article-select input[type="checkbox"]:checked + .checkmark {
	background: var(--accent);
	border-color: var(--accent);
}

.select-all input[type="checkbox"]:checked + .checkmark::after,
.article-select input[type="checkbox"]:checked + .checkmark::after {
	content: "";
	position: absolute;
	left: 5px;
	top: 1px;
	width: 4px;
	height: 8px;
	border: solid var(--bg-primary);
	border-width: 0 2px 2px 0;
	transform: rotate(45deg);
}

.article-title {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.title-main {
	display: flex;
	align-items: center;
	gap: 8px;
	color: var(--text-primary);
	font-weight: 500;
	line-height: 1.4;
}

.pin-icon {
	color: var(--accent);
	font-size: 14px;
}

.original-badge {
	background: var(--accent);
	color: var(--bg-primary);
	padding: 2px 6px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 600;
}

.article-tags {
	display: flex;
	gap: 6px;
	flex-wrap: wrap;
}

.tag {
	background: rgba(100, 255, 218, 0.1);
	color: var(--accent);
	padding: 2px 8px;
	border-radius: 12px;
	font-size: 12px;
	font-weight: 500;
}

.article-status {
	display: flex;
	align-items: center;
}

.status-badge {
	padding: 4px 12px;
	border-radius: 16px;
	font-size: 12px;
	font-weight: 500;
}

.status-badge.published {
	background: rgba(82, 196, 26, 0.1);
	color: #52c41a;
}

.status-badge.draft {
	background: rgba(250, 140, 22, 0.1);
	color: #fa8c16;
}

.status-badge.archived {
	background: rgba(140, 140, 140, 0.1);
	color: #8c8c8c;
}

.article-category,
.article-views,
.article-date {
	display: flex;
	align-items: center;
	color: var(--text-secondary);
	font-size: 14px;
}

.article-actions {
	display: flex;
	align-items: center;
	gap: 8px;
}

.action-btn {
	width: 32px;
	height: 32px;
	border: none;
	border-radius: 6px;
	background: transparent;
	color: var(--text-secondary);
	cursor: pointer;
	transition: all 0.3s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 14px;
}

.action-btn:hover {
	background: rgba(100, 255, 218, 0.1);
	color: var(--accent);
}

.action-btn.delete:hover {
	background: rgba(255, 107, 107, 0.1);
	color: #ff6b6b;
}

/* 分页 */
.pagination {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px 0;
}

.pagination-info {
	color: var(--text-secondary);
	font-size: 14px;
}

.pagination-controls {
	display: flex;
	align-items: center;
	gap: 8px;
}

.page-btn {
	padding: 8px 16px;
	background: transparent;
	border: 1px solid rgba(100, 255, 218, 0.3);
	border-radius: 6px;
	color: var(--text-secondary);
	cursor: pointer;
	transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
	color: var(--accent);
	border-color: var(--accent);
}

.page-btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.page-numbers {
	display: flex;
	gap: 4px;
}

.page-number {
	width: 36px;
	height: 36px;
	border: 1px solid rgba(100, 255, 218, 0.3);
	border-radius: 6px;
	background: transparent;
	color: var(--text-secondary);
	cursor: pointer;
	transition: all 0.3s ease;
	display: flex;
	align-items: center;
	justify-content: center;
}

.page-number:hover {
	color: var(--accent);
	border-color: var(--accent);
}

.page-number.active {
	background: var(--accent);
	color: var(--bg-primary);
	border-color: var(--accent);
}

/* 加载状态 */
.loading-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60px 20px;
	color: var(--text-secondary);
}

.loading-spinner {
	font-size: 32px;
	margin-bottom: 16px;
	animation: spin 2s linear infinite;
}

.loading-text {
	font-size: 16px;
	color: var(--text-secondary);
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

/* 空状态 */
.empty-state {
	text-align: center;
	padding: 60px 20px;
	color: var(--text-secondary);
	background: rgba(26, 35, 50, 0.8);
	border-radius: 12px;
	border: 1px solid rgba(100, 255, 218, 0.1);
	margin-bottom: 24px;
}

.empty-icon {
	font-size: 48px;
	margin-bottom: 16px;
}

.empty-title {
	font-size: 18px;
	font-weight: 500;
	color: var(--text-primary);
	margin-bottom: 8px;
}

.empty-description {
	font-size: 14px;
	line-height: 1.5;
	margin-bottom: 24px;
}

.empty-btn {
	padding: 12px 24px;
	background: var(--accent);
	color: var(--bg-primary);
	border: none;
	border-radius: 8px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.3s ease;
}

.empty-btn:hover {
	background: var(--accent-hover);
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(100, 255, 218, 0.3);
}

/* 响应式设计 */
@media (max-width: 1200px) {
	.list-header,
	.article-item {
		grid-template-columns: 50px 1fr 100px 100px 80px 120px 120px;
	}
}

@media (max-width: 768px) {
	.article-manage {
		padding: 16px;
	}

	.filter-row {
		flex-direction: column;
		gap: 12px;
		align-items: stretch;
	}

	.search-box {
		max-width: none;
	}

	.list-header,
	.article-item {
		grid-template-columns: 40px 1fr 80px 100px;
		font-size: 12px;
	}

	.article-category,
	.article-views,
	.article-date {
		display: none;
	}

	.pagination {
		flex-direction: column;
		gap: 12px;
	}
}
</style>
