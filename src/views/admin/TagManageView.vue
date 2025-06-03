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
			<div class="search-box">
				<input v-model="searchKeyword" type="text" placeholder="搜索标签名称..." class="search-input" />
				<span class="search-icon">🔍</span>
			</div>
		</div>

		<!-- 标签统计 -->
		<div class="stats-section">
			<div class="stat-item">
				<span class="stat-value">{{ filteredTags.length }}</span>
				<span class="stat-label">总标签数</span>
			</div>
			<div class="stat-item">
				<span class="stat-value">{{ totalArticleCount }}</span>
				<span class="stat-label">关联文章数</span>
			</div>
		</div>

		<!-- 标签列表 -->
		<div class="tags-grid">
			<div v-for="tag in filteredTags" :key="tag.id" class="tag-card">
				<div class="tag-info">
					<div class="tag-name"># {{ tag.name }}</div>
					<div class="tag-meta">
						<span class="article-count">{{ tag.articleCount }} 篇文章</span>
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
		<div v-if="filteredTags.length === 0" class="empty-state">
			<div class="empty-icon">🏷️</div>
			<div class="empty-title">暂无标签</div>
			<div class="empty-description">还没有创建任何标签，点击上方按钮创建第一个标签吧！</div>
		</div>

		<!-- 创建/编辑标签对话框 -->
		<div v-if="showCreateDialog || showEditDialog" class="dialog-overlay" @click="closeDialog">
			<div class="dialog" @click.stop>
				<div class="dialog-header">
					<h3>{{ isEditing ? '编辑标签' : '新建标签' }}</h3>
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
						{{ isEditing ? '保存' : '创建' }}
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
					<p>确定要删除标签 <strong>"{{ tagToDelete?.name }}"</strong> 吗？</p>
					<p class="warning-text">此操作不可撤销，删除后该标签将从所有文章中移除。</p>
				</div>
				<div class="dialog-footer">
					<button class="btn btn-secondary" @click="closeDeleteDialog">取消</button>
					<button class="btn btn-danger" @click="deleteTag">确定删除</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { tagAPI } from "@/api/tag.ts";

interface Tag {
	id: number;
	name: string;
	articleCount: number;
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

const totalArticleCount = computed(() => {
	return tags.value.reduce((total, tag) => total + tag.articleCount, 0);
});

// 方法
const loadTags = async () => {
	try {
		// 模拟数据，实际应该调用API
		tags.value = [
			{ id: 1, name: "Vue.js", articleCount: 8, createTime: "2024-01-15" },
			{ id: 2, name: "Spring Boot", articleCount: 12, createTime: "2024-01-20" },
			{ id: 3, name: "数据库", articleCount: 6, createTime: "2024-02-01" },
			{ id: 4, name: "前端开发", articleCount: 15, createTime: "2024-02-10" },
			{ id: 5, name: "后端开发", articleCount: 10, createTime: "2024-02-15" },
			{ id: 6, name: "微服务", articleCount: 4, createTime: "2024-03-01" },
			{ id: 7, name: "性能优化", articleCount: 3, createTime: "2024-03-05" },
			{ id: 8, name: "架构设计", articleCount: 7, createTime: "2024-03-10" },
		];
		// const response = await tagAPI.getTags();
		// tags.value = response.data;
	} catch (error) {
		console.error("获取标签列表失败:", error);
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
	showDeleteDialog.value = true;
};

const saveTag = async () => {
	try {
		if (isEditing.value) {
			// 更新标签
			// await tagAPI.updateTag(tagForm.value.id!, tagForm.value);
			const index = tags.value.findIndex((t) => t.id === tagForm.value.id);
			if (index !== -1) {
				tags.value[index].name = tagForm.value.name;
			}
		} else {
			// 创建新标签
			// const response = await tagAPI.createTag(tagForm.value);
			const newTag: Tag = {
				id: Date.now(),
				name: tagForm.value.name,
				articleCount: 0,
				createTime: new Date().toISOString().split("T")[0],
			};
			tags.value.unshift(newTag);
		}
		closeDialog();
	} catch (error) {
		console.error("保存标签失败:", error);
	}
};

const deleteTag = async () => {
	try {
		if (tagToDelete.value) {
			// await tagAPI.deleteTag(tagToDelete.value.id.toString());
			const index = tags.value.findIndex((t) => t.id === tagToDelete.value!.id);
			if (index !== -1) {
				tags.value.splice(index, 1);
			}
		}
		closeDeleteDialog();
	} catch (error) {
		console.error("删除标签失败:", error);
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
};

const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString("zh-CN");
};

// 组件挂载时加载数据
onMounted(() => {
	loadTags();
});
</script>

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
}

.search-box {
	position: relative;
	max-width: 400px;
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

/* 统计区域 */
.stats-section {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 16px;
	margin-bottom: 24px;
}

.stat-item {
	background: rgba(26, 35, 50, 0.8);
	border-radius: 12px;
	padding: 20px;
	border: 1px solid rgba(100, 255, 218, 0.1);
	text-align: center;
}

.stat-value {
	display: block;
	font-size: 28px;
	font-weight: 600;
	color: var(--accent);
	margin-bottom: 4px;
}

.stat-label {
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

	.stats-section {
		grid-template-columns: 1fr;
	}
}
</style>
