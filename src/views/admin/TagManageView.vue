<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { tagAPI } from "@/api/tag.ts";
import { ElMessage } from "element-plus";

interface Tag {
	id: number;
	name: string;
	usageCount: number;
	createTime: string;
}

// 响应式数据
const tags = ref<Tag[]>([]);
const searchKeyword = ref("");
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const isEditing = ref(false);
const tagToDelete = ref<Tag | null>(null);
const deleteError = ref("");

// 分页相关状态
const currentPage = ref(1);
const pageSize = ref(10);
const totalTags = ref(0);
const loading = ref(false);

// 表单数据
const tagForm = ref({
	id: null as number | null,
	name: "",
});

// 计算属性
const filteredTags = computed(() => {
	if (!searchKeyword.value) {
		return tags.value;
	}
	return tags.value.filter((tag) => tag.name.toLowerCase().includes(searchKeyword.value.toLowerCase()));
});

// 分页相关计算属性
const totalPages = computed(() => {
	return Math.ceil(totalTags.value / pageSize.value);
});

const hasNextPage = computed(() => {
	return currentPage.value < totalPages.value;
});

const hasPrevPage = computed(() => {
	return currentPage.value > 1;
});

// 生成页码数组（显示当前页前后各2页）
const getPageNumbers = computed(() => {
	const pages: number[] = [];
	const total = totalPages.value;
	const current = currentPage.value;
	
	if (total <= 7) {
		// 总页数小于等于7，显示所有页码
		for (let i = 1; i <= total; i++) {
			pages.push(i);
		}
	} else {
		// 总页数大于7，显示部分页码
		if (current <= 4) {
			// 当前页在前面
			for (let i = 1; i <= 5; i++) {
				pages.push(i);
			}
			pages.push(-1); // -1 表示省略号
			pages.push(total);
		} else if (current >= total - 3) {
			// 当前页在后面
			pages.push(1);
			pages.push(-1);
			for (let i = total - 4; i <= total; i++) {
				pages.push(i);
			}
		} else {
			// 当前页在中间
			pages.push(1);
			pages.push(-1);
			for (let i = current - 1; i <= current + 1; i++) {
				pages.push(i);
			}
			pages.push(-1);
			pages.push(total);
		}
	}
	
	return pages;
});

// 方法
const loadTags = async (page = currentPage.value, size = pageSize.value, keyword = searchKeyword.value) => {
	try {
		loading.value = true;
		const params = {
			page: page - 1, // 后端通常从0开始计数
			size,
			keyword: keyword || undefined
		};
		
		const response = await tagAPI.getTags(params);
		tags.value = response.data.data;
		totalTags.value = response.data.total || 0;
		currentPage.value = page;
	} catch (error) {
		console.error("获取标签列表失败:", error);
		ElMessage.error("获取标签列表失败，请稍后重试");
	} finally {
		loading.value = false;
	}
};

const editTag = (tag: Tag) => {
	isEditing.value = true;
	tagForm.value = {
		id: tag.id,
		name: tag.name,
	};
	showEditDialog.value = true;
};

const confirmDelete = (tag: Tag) => {
	tagToDelete.value = tag;
	deleteError.value = "";
	
	// 检查标签是否有关联文章
	if (tag.usageCount > 0) {
		deleteError.value = `该标签关联了 ${tag.usageCount} 篇文章，无法删除。请先移除相关文章中的该标签后再删除。`;
	}
	
	showDeleteDialog.value = true;
};

const saveTag = async () => {
	try {
		if (isEditing.value) {
			// 更新标签
			await tagAPI.updateTag(tagForm.value.id!.toString(), { name: tagForm.value.name });
			ElMessage.success("更新标签成功");
		} else {
			// 创建新标签
			await tagAPI.createTag(tagForm.value.name);
			ElMessage.success("创建标签成功");
		}
		// 重新加载标签列表以获取最新数据
		await loadTags();
		closeDialog();
	} catch (error) {
		console.error("保存标签失败:", error);
		if (isEditing.value) {
			ElMessage.error("更新标签失败，请稍后重试");
		} else {
			ElMessage.error("创建标签失败，请稍后重试");
		}
	}
};

const deleteTag = async () => {
	try {
		if (tagToDelete.value) {
			// 再次检查是否有关联文章
			if (tagToDelete.value.usageCount > 0) {
				deleteError.value = `该标签关联了 ${tagToDelete.value.usageCount} 篇文章，无法删除。请先移除相关文章中的该标签后再删除。`;
				return;
			}
			
			await tagAPI.deleteTag(tagToDelete.value.id);
			// 重新加载标签列表以获取最新数据
			await loadTags();
			closeDeleteDialog();
			ElMessage.success("删除标签成功");
		}
	} catch (error) {
		console.error("删除标签失败:", error);
		deleteError.value = "删除标签失败，请稍后重试";
		ElMessage.error("删除标签失败，请稍后重试");
	}
};

const closeDialog = () => {
	showCreateDialog.value = false;
	showEditDialog.value = false;
	isEditing.value = false;
	tagForm.value = { id: null, name: "" };
};

const closeDeleteDialog = () => {
	showDeleteDialog.value = false;
	tagToDelete.value = null;
	deleteError.value = "";
};

const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString("zh-CN");
};

// 分页相关方法
const changePage = (page: number) => {
	if (page >= 1 && page <= totalPages.value) {
		loadTags(page);
	}
};

const handleSearch = () => {
	currentPage.value = 1;
	loadTags(1, pageSize.value, searchKeyword.value);
};

// 重置搜索
const resetSearch = () => {
	searchKeyword.value = "";
	currentPage.value = 1;
	loadTags(1, pageSize.value, "");
};

// 监听搜索关键词变化
let searchTimer: number | null = null;
const onSearchInput = () => {
	if (searchTimer) {
		clearTimeout(searchTimer);
	}
	searchTimer = setTimeout(() => {
		handleSearch();
	}, 500);
};

// 组件挂载时加载数据
onMounted(() => {
	loadTags();
});
</script>

<template>
	<div class="tag-manage">
		<div class="page-header">
			<h2 class="page-title">标签管理</h2>
			<button class="create-btn" @click="showCreateDialog = true">
				<span class="btn-icon">➕</span>
				新建标签
			</button>
		</div>

		<!-- 搜索和筛选区域 -->
		<div class="search-section">
			<div class="search-left">
				<div class="search-box">
					<input 
						v-model="searchKeyword" 
						type="text" 
						placeholder="搜索标签名称..." 
						class="search-input" 
						@input="onSearchInput"
						@keyup.enter="handleSearch"
					/>
					<span class="search-icon">🔍</span>
				</div>
				<button class="reset-btn" @click="resetSearch" title="重置搜索">
					<span>🔄</span>
					重置
				</button>
			</div>
			<div class="search-right">
				<div class="total-count">
					<span class="count-value">{{ totalTags }}</span>
					<span class="count-label">总标签数</span>
				</div>
			</div>
		</div>

		<!-- 加载状态 -->
		<div v-if="loading" class="loading-state">
			<div class="loading-spinner"></div>
			<div class="loading-text">加载中...</div>
		</div>

		<!-- 标签列表 -->
		<div v-else class="tags-grid">
			<div v-for="tag in tags" :key="tag.id" class="tag-card">
				<div class="tag-info">
					<div class="tag-name"># {{ tag.name }}</div>
					<div class="tag-meta">
						<span class="article-count">{{ tag.usageCount }} 篇文章</span>
						<span class="create-date">{{ formatDate(tag.createTime) }}</span>
					</div>
				</div>
				<div class="tag-actions">
					<button class="action-btn edit-btn" @click="editTag(tag)" title="编辑">
						<span>✏️</span>
					</button>
					<button class="action-btn delete-btn" @click="confirmDelete(tag)" title="删除">
						<span>🗑️</span>
					</button>
				</div>
			</div>
		</div>

		<!-- 空状态 -->
		<div v-if="!loading && tags.length === 0" class="empty-state">
			<div class="empty-icon">🏷️</div>
			<div class="empty-title">暂无标签</div>
			<div class="empty-description">
				{{ searchKeyword ? '没有找到相关标签，请尝试其他关键词' : '还没有创建任何标签，点击上方按钮创建第一个标签吧！' }}
			</div>
		</div>

		<!-- 分页组件 -->
		<div v-if="!loading && totalPages > 1" class="pagination-section">
			<div class="pagination-info">
				第 {{ currentPage }} 页，共 {{ totalPages }} 页，总共 {{ totalTags }} 条记录
			</div>
			
			<div class="pagination">
				<button 
					class="page-btn" 
					:disabled="!hasPrevPage" 
					@click="changePage(currentPage - 1)"
				>
					上一页
				</button>
				
				<div class="page-numbers">
					<template v-for="page in getPageNumbers" :key="page">
						<span v-if="page === -1" class="page-ellipsis">...</span>
						<button 
							v-else
							class="page-btn" 
							:class="{ active: page === currentPage }"
							@click="changePage(page)"
						>
							{{ page }}
						</button>
					</template>
				</div>
				
				<button 
					class="page-btn" 
					:disabled="!hasNextPage" 
					@click="changePage(currentPage + 1)"
				>
					下一页
				</button>
			</div>
		</div>

		<!-- 创建/编辑标签对话框 -->
		<div v-if="showCreateDialog || showEditDialog" class="dialog-overlay" @click="closeDialog">
			<div class="dialog" @click.stop>
				<div class="dialog-header">
					<h3>{{ isEditing ? "编辑标签" : "新建标签" }}</h3>
					<button class="close-btn" @click="closeDialog">✕</button>
				</div>
				<div class="dialog-body">
					<div class="form-group">
						<label class="form-label">标签名称</label>
						<input v-model="tagForm.name" type="text" class="form-input" placeholder="请输入标签名称" maxlength="20" />
						<div class="input-hint">标签名称最多20个字符</div>
					</div>
				</div>
				<div class="dialog-footer">
					<button class="btn btn-secondary" @click="closeDialog">取消</button>
					<button class="btn btn-primary" @click="saveTag" :disabled="!tagForm.name.trim()">
						{{ isEditing ? "保存" : "创建" }}
					</button>
				</div>
			</div>
		</div>

		<!-- 删除确认对话框 -->
		<div v-if="showDeleteDialog" class="dialog-overlay" @click="closeDeleteDialog">
			<div class="dialog delete-dialog" @click.stop>
				<div class="dialog-header">
					<h3>确认删除</h3>
					<button class="close-btn" @click="closeDeleteDialog">✕</button>
				</div>
				<div class="dialog-body">
					<p>
						确定要删除标签 <strong>"{{ tagToDelete?.name }}"</strong> 吗？
					</p>
					<p v-if="deleteError" class="error-text">{{ deleteError }}</p>
					<p v-else class="warning-text">此操作不可撤销，删除后该标签将从所有文章中移除。</p>
				</div>
				<div class="dialog-footer">
					<button class="btn btn-secondary" @click="closeDeleteDialog">取消</button>
					<button 
						class="btn btn-danger" 
						@click="deleteTag" 
						:disabled="!!deleteError"
					>
						确定删除
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.tag-manage {
	padding: 24px;
}

/* 页面头部 */
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
	margin: 0;
}

.create-btn {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 20px;
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
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(100, 255, 218, 0.3);
}

.btn-icon {
	font-size: 14px;
}

/* 搜索区域 */
.search-section {
	background: rgba(26, 35, 50, 0.8);
	border-radius: 12px;
	padding: 20px;
	border: 1px solid rgba(100, 255, 218, 0.1);
	margin-bottom: 24px;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.search-left {
	display: flex;
	align-items: center;
	gap: 16px;
	width: 50%;
}

.search-box {
	position: relative;
	flex: 1;
}

.search-input {
	width: 100%;
	padding: 12px 40px 12px 16px;
	background: var(--bg-tertiary);
	border: 1px solid rgba(100, 255, 218, 0.1);
	border-radius: 8px;
	color: var(--text-primary);
	font-size: 14px;
	transition: all 0.3s ease;
}

.search-input:focus {
	outline: none;
	border-color: var(--accent);
	box-shadow: 0 0 0 3px rgba(100, 255, 218, 0.1);
}

.search-input::placeholder {
	color: var(--text-secondary);
}

.search-icon {
	position: absolute;
	right: 12px;
	top: 50%;
	transform: translateY(-50%);
	color: var(--text-secondary);
	font-size: 14px;
}

.reset-btn {
	background: none;
	border: none;
	color: var(--text-secondary);
	font-size: 14px;
	cursor: pointer;
	padding: 4px;
	border-radius: 4px;
	transition: all 0.3s ease;
}

.reset-btn:hover {
	background: rgba(100, 255, 218, 0.1);
	color: var(--accent);
}

.search-right {
	display: flex;
	align-items: center;
	gap: 8px;
}

.total-count {
	text-align: center;
}

.count-value {
	display: block;
	font-size: 28px;
	font-weight: 600;
	color: var(--accent);
	margin-bottom: 4px;
}

.count-label {
	color: var(--text-secondary);
	font-size: 14px;
}



/* 标签网格 */
.tags-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 16px;
	margin-bottom: 24px;
}

.tag-card {
	background: rgba(26, 35, 50, 0.8);
	border-radius: 12px;
	padding: 20px;
	border: 1px solid rgba(100, 255, 218, 0.1);
	display: flex;
	justify-content: space-between;
	align-items: center;
	transition: all 0.3s ease;
}

.tag-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
	border-color: rgba(100, 255, 218, 0.2);
}

.tag-info {
	flex: 1;
}

.tag-name {
	font-size: 16px;
	font-weight: 600;
	color: var(--accent);
	margin-bottom: 8px;
}

.tag-meta {
	display: flex;
	gap: 16px;
	font-size: 12px;
	color: var(--text-secondary);
}

.article-count {
	background: rgba(100, 255, 218, 0.1);
	padding: 2px 8px;
	border-radius: 4px;
}

.tag-actions {
	display: flex;
	gap: 8px;
}

.action-btn {
	width: 32px;
	height: 32px;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;
	font-size: 14px;
}

.edit-btn {
	background: rgba(24, 144, 255, 0.1);
	color: #1890ff;
}

.edit-btn:hover {
	background: rgba(24, 144, 255, 0.2);
}

.delete-btn {
	background: rgba(255, 107, 107, 0.1);
	color: #ff6b6b;
}

.delete-btn:hover {
	background: rgba(255, 107, 107, 0.2);
}

/* 空状态 */
.empty-state {
	text-align: center;
	padding: 60px 20px;
	color: var(--text-secondary);
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
}

/* 加载状态 */
.loading-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60px 20px;
	gap: 16px;
}

.loading-spinner {
	width: 40px;
	height: 40px;
	border: 3px solid rgba(100, 255, 218, 0.1);
	border-top: 3px solid var(--accent);
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

.loading-text {
	color: var(--text-secondary);
	font-size: 14px;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

/* 分页组件 */
.pagination-section {
	margin-top: 32px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
}

.pagination {
	display: flex;
	align-items: center;
	gap: 8px;
}

.page-btn {
	padding: 8px 12px;
	border: 1px solid rgba(100, 255, 218, 0.1);
	background: var(--bg-tertiary);
	color: var(--text-secondary);
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.3s ease;
	font-size: 14px;
	min-width: 40px;
}

.page-btn:hover:not(:disabled) {
	background: rgba(100, 255, 218, 0.1);
	color: var(--accent);
	border-color: var(--accent);
}

.page-btn.active {
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
	align-items: center;
	gap: 4px;
}

.page-ellipsis {
	padding: 8px 12px;
	color: var(--text-secondary);
	font-size: 14px;
}

.pagination-info {
	color: var(--text-secondary);
	font-size: 14px;
}

/* 对话框样式 */
.dialog-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	backdrop-filter: blur(4px);
}

.dialog {
	background: var(--bg-secondary);
	border-radius: 12px;
	border: 1px solid rgba(100, 255, 218, 0.1);
	min-width: 400px;
	max-width: 90vw;
	max-height: 90vh;
	overflow: hidden;
	animation: dialogAppear 0.3s ease-out;
}

.dialog-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20px 24px;
	border-bottom: 1px solid rgba(100, 255, 218, 0.1);
}

.dialog-header h3 {
	color: var(--text-primary);
	font-size: 18px;
	font-weight: 600;
	margin: 0;
}

.close-btn {
	background: none;
	border: none;
	color: var(--text-secondary);
	font-size: 18px;
	cursor: pointer;
	padding: 4px;
	border-radius: 4px;
	transition: all 0.3s ease;
}

.close-btn:hover {
	background: rgba(100, 255, 218, 0.1);
	color: var(--accent);
}

.dialog-body {
	padding: 24px;
}

.dialog-footer {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	padding: 20px 24px;
	border-top: 1px solid rgba(100, 255, 218, 0.1);
}

/* 表单样式 */
.form-group {
	margin-bottom: 20px;
}

.form-label {
	display: block;
	color: var(--text-primary);
	font-weight: 500;
	margin-bottom: 8px;
	font-size: 14px;
}

.form-input {
	width: 100%;
	padding: 12px 16px;
	background: var(--bg-tertiary);
	border: 1px solid rgba(100, 255, 218, 0.1);
	border-radius: 8px;
	color: var(--text-primary);
	font-size: 14px;
	transition: all 0.3s ease;
}

.form-input:focus {
	outline: none;
	border-color: var(--accent);
	box-shadow: 0 0 0 3px rgba(100, 255, 218, 0.1);
}

.input-hint {
	font-size: 12px;
	color: var(--text-secondary);
	margin-top: 4px;
}

/* 按钮样式 */
.btn {
	padding: 10px 20px;
	border: none;
	border-radius: 6px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.3s ease;
	font-size: 14px;
}

.btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.btn-primary {
	background: var(--accent);
	color: var(--bg-primary);
}

.btn-primary:hover:not(:disabled) {
	background: var(--accent-hover);
}

.btn-secondary {
	background: var(--bg-tertiary);
	color: var(--text-secondary);
	border: 1px solid rgba(100, 255, 218, 0.1);
}

.btn-secondary:hover {
	background: rgba(100, 255, 218, 0.1);
	color: var(--text-primary);
}

.btn-danger {
	background: #ff6b6b;
	color: white;
}

.btn-danger:hover {
	background: #ff5252;
}

.delete-dialog .dialog-body {
	text-align: center;
}

.warning-text {
	color: var(--text-secondary);
	font-size: 14px;
	margin-top: 8px;
}

.error-text {
	color: #ff6b6b;
	font-size: 14px;
	margin-top: 8px;
	font-weight: 500;
}

/* 动画 */
@keyframes dialogAppear {
	from {
		opacity: 0;
		transform: scale(0.9) translateY(-20px);
	}
	to {
		opacity: 1;
		transform: scale(1) translateY(0);
	}
}

/* 响应式设计 */
@media (max-width: 768px) {
	.tag-manage {
		padding: 16px;
	}

	.page-header {
		flex-direction: column;
		gap: 16px;
		align-items: stretch;
	}

	.tags-grid {
		grid-template-columns: 1fr;
	}

	.dialog {
		min-width: auto;
		margin: 16px;
	}

	.search-section {
		flex-direction: column;
		align-items: stretch;
		gap: 16px;
	}

	.search-left {
		justify-content: center;
	}

	.search-right {
		justify-content: center;
	}



	.pagination-section {
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	.pagination {
		flex-wrap: wrap;
		justify-content: center;
	}

	.pagination-info {
		font-size: 12px;
		text-align: center;
	}
}
</style>
