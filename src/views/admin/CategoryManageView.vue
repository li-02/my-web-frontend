<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import type { Category, CategoryFormData, CategoryQueryParams } from "@/type/category";
import { categoryAPI } from "@/api/category";
import { ElMessage, ElMessageBox } from "element-plus";
import { formatDateTime } from "@/utils/dateFormat";

// 分类列表数据
const categories = ref<Category[]>([]);

// 表单相关
const showModal = ref(false);
const editingCategory = ref<Category | null>(null);
const formData = ref<CategoryFormData>({
	name: "",
	description: "",
});

// 搜索关键词
const searchKeyword = ref("");

// 分页数据
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const totalPages = ref(0);

// 加载状态
const loading = ref(false);

// 表单验证错误
const formErrors = ref<Record<string, string>>({});

// 过滤后的分类列表（实际显示的列表）
const filteredCategories = ref<Category[]>([]);

// 获取查询参数
const getQueryParams = (): CategoryQueryParams => ({
	page: currentPage.value - 1, // 后端API的page从0开始，前端从1开始显示
	pageSize: pageSize.value,
	keyword: searchKeyword.value.trim() || undefined,
});

// 加载分类列表
const loadCategories = async () => {
	try {
		loading.value = true;
		const params = getQueryParams();
		const response = await categoryAPI.getCategoriesList(params);

		if (response.code === 200) {
			categories.value = response.data.data;
			filteredCategories.value = response.data.data;
			total.value = response.data.total;
			totalPages.value = response.data.totalPages;
			// 后端返回的page是从0开始的，转换为前端的页码（从1开始）
			currentPage.value = response.data.page + 1;

			console.log("分类列表加载成功:", response.data);
			console.log("前端页码:", currentPage.value, "后端页码:", response.data.page);
		} else {
			ElMessage.error(response.message || "获取分类列表失败");
		}
	} catch (error: any) {
		console.error("获取分类列表失败:", error);
		ElMessage.error(error.response?.data?.message || "获取分类列表失败，请重试");
	} finally {
		loading.value = false;
	}
};

// 搜索分类
const searchCategories = () => {
	currentPage.value = 1; // 搜索时重置到第一页
	loadCategories();
};

// 重置搜索
const resetSearch = () => {
	searchKeyword.value = "";
	currentPage.value = 1;
	loadCategories();
};

// 打开新增分类模态框
const openCreateModal = () => {
	editingCategory.value = null;
	formData.value = {
		name: "",
		description: "",
	};
	formErrors.value = {};
	showModal.value = true;
};

// 打开编辑分类模态框
const openEditModal = (category: Category) => {
	editingCategory.value = category;
	formData.value = {
		name: category.name,
		description: category.description,
	};
	formErrors.value = {};
	showModal.value = true;
};

// 关闭模态框
const closeModal = () => {
	showModal.value = false;
	editingCategory.value = null;
	formData.value = {
		name: "",
		description: "",
	};
	formErrors.value = {};
};

// 验证表单
const validateForm = () => {
	formErrors.value = {};

	if (!formData.value.name.trim()) {
		formErrors.value.name = "分类名称不能为空";
	}

	if (formData.value.name.trim().length > 50) {
		formErrors.value.name = "分类名称不能超过50个字符";
	}

	if (formData.value.description.trim().length > 200) {
		formErrors.value.description = "分类描述不能超过200个字符";
	}

	// 检查名称是否重复
	const existingCategory = categories.value.find((cat) => cat.name === formData.value.name.trim() && (!editingCategory.value || cat.id !== editingCategory.value?.id));

	if (existingCategory) {
		formErrors.value.name = "分类名称已存在";
	}

	return Object.keys(formErrors.value).length === 0;
};

// 保存分类
const saveCategory = async () => {
	if (!validateForm()) {
		return;
	}

	try {
		if (editingCategory.value) {
			// 编辑分类
			console.log("更新分类:", editingCategory.value);
			await categoryAPI.updateCategory(editingCategory.value.id, formData.value.name.trim(), formData.value.description.trim());

			// 更新本地数据
			const index = categories.value.findIndex((cat) => cat.id === editingCategory.value!.id);
			if (index > -1) {
				categories.value[index] = {
					...categories.value[index],
					name: formData.value.name.trim(),
					description: formData.value.description.trim(),
					updateTime: new Date().toISOString(),
				};
				// 同步更新过滤后的列表
				const filteredIndex = filteredCategories.value.findIndex((cat) => cat.id === editingCategory.value!.id);
				if (filteredIndex > -1) {
					filteredCategories.value[filteredIndex] = categories.value[index];
				}
			}

			ElMessage.success("分类更新成功");
		} else {
			// 新增分类
			console.log("新增分类");
			await categoryAPI.createCategory({
				name: formData.value.name.trim(),
				description: formData.value.description.trim(),
			});

			// 重新加载分类列表以获取最新数据
			await loadCategories();
			ElMessage.success("分类创建成功");
		}

		closeModal();
	} catch (error: any) {
		console.error("保存分类失败:", error);
		ElMessage.error(error.response?.data?.message || "保存分类失败，请重试");
	}
};

// 删除分类
const deleteCategory = async (category: Category) => {
	const articleCount = category.articleCount || 0;
	if (articleCount > 0) {
		ElMessageBox.alert(`该分类下还有 ${articleCount} 篇文章，无法删除`, "无法删除", {
			confirmButtonText: "知道了",
			type: "warning",
			customClass: "custom-message-box",
		});
		return;
	}

	try {
		await ElMessageBox.confirm(`确定要删除分类"${category.name}"吗？此操作不可恢复。`, "删除确认", {
			confirmButtonText: "确定删除",
			cancelButtonText: "取消",
			type: "warning",
			customClass: "custom-message-box",
			confirmButtonClass: "custom-confirm-btn",
			cancelButtonClass: "custom-cancel-btn",
		});

		await categoryAPI.deleteCategory(category.id);
		// 重新加载分类列表
		await loadCategories();
		ElMessage.success("分类删除成功");
	} catch (error: any) {
		if (error !== "cancel") {
			console.error("删除分类失败:", error);
			ElMessage.error(error.response?.data?.message || "删除分类失败，请重试");
		}
	}
};

// 分页改变
const handlePageChange = (page: number) => {
	currentPage.value = page;
	loadCategories();
};

// 组件挂载时获取数据
onMounted(() => {
	loadCategories();
});
</script>

<template>
	<div class="category-manage">
		<div class="page-header">
			<h2 class="page-title">分类管理</h2>
			<button class="create-btn" @click="openCreateModal">
				<span class="btn-icon">➕</span>
				新增分类
			</button>
		</div>

		<!-- 搜索区域 -->
		<div class="search-section">
			<div class="search-box">
				<input v-model="searchKeyword" type="text" placeholder="搜索分类名称或描述..." class="search-input" @keyup.enter="searchCategories" />
				<button class="search-btn" @click="searchCategories">🔍</button>
			</div>
			<button class="reset-btn" @click="resetSearch">重置</button>
		</div>

		<!-- 分类统计 -->
		<div class="stats-section">
			<div class="stat-card">
				<div class="stat-icon">📁</div>
				<div class="stat-info">
					<div class="stat-value">{{ total }}</div>
					<div class="stat-label">总分类数</div>
				</div>
			</div>
			<div class="stat-card">
				<div class="stat-icon">📝</div>
				<div class="stat-info">
					<div class="stat-value">{{ categories.reduce((sum, cat) => sum + (cat.articleCount || 0), 0) }}</div>
					<div class="stat-label">总文章数</div>
				</div>
			</div>
		</div>

		<!-- 分类列表 -->
		<div class="category-list">
			<div class="list-header">
				<div class="header-item name">分类名称</div>
				<div class="header-item description">描述</div>
				<div class="header-item count">文章数</div>
				<div class="header-item date">创建时间</div>
				<div class="header-item actions">操作</div>
			</div>

			<!-- 加载状态 -->
			<div v-if="loading" class="loading-state">
				<div class="loading-icon">⏳</div>
				<div class="loading-text">正在加载分类列表...</div>
			</div>

			<div v-else-if="filteredCategories.length === 0" class="empty-state">
				<div class="empty-icon">📂</div>
				<div class="empty-text">
					{{ searchKeyword ? "没有找到匹配的分类" : "暂无分类数据" }}
				</div>
				<button v-if="!searchKeyword" class="empty-btn" @click="openCreateModal">创建第一个分类</button>
			</div>

			<div v-else v-for="category in filteredCategories" :key="category.id" class="category-item">
				<div class="category-name">
					<div class="name-text">{{ category.name }}</div>
				</div>

				<div class="category-description">
					<div class="description-text">
						{{ category.description || "暂无描述" }}
					</div>
				</div>

				<div class="category-count">
					<span class="count-badge" :class="{ 'has-articles': (category.articleCount || 0) > 0 }">
						{{ category.articleCount || 0 }}
					</span>
				</div>

				<div class="category-date">{{ formatDateTime(category.createTime) }}</div>

				<div class="category-actions">
					<button class="action-btn edit" @click="openEditModal(category)" title="编辑">✏️</button>
					<button
						class="action-btn delete"
						@click="deleteCategory(category)"
						:disabled="(category.articleCount || 0) > 0"
						:title="(category.articleCount || 0) > 0 ? '该分类下有文章，无法删除' : '删除'"
					>
						🗑️
					</button>
				</div>
			</div>
		</div>

		<!-- 分页组件 -->
		<div v-if="filteredCategories.length > 0" class="pagination">
			<div class="pagination-info">共 {{ total }} 个分类，第 {{ currentPage }} / {{ totalPages }} 页</div>
			<div class="pagination-controls">
				<button class="page-btn" :disabled="currentPage === 1" @click="handlePageChange(currentPage - 1)">上一页</button>
				<span class="page-numbers">
					<button v-for="page in totalPages" :key="page" class="page-number" :class="{ active: page === currentPage }" @click="handlePageChange(page)">
						{{ page }}
					</button>
				</span>
				<button class="page-btn" :disabled="currentPage === totalPages" @click="handlePageChange(currentPage + 1)">下一页</button>
			</div>
		</div>

		<!-- 新增/编辑分类模态框 -->
		<div v-if="showModal" class="modal-overlay" @click="closeModal">
			<div class="modal-content" @click.stop>
				<div class="modal-header">
					<h3 class="modal-title">
						{{ editingCategory ? "编辑分类" : "新增分类" }}
					</h3>
					<button class="modal-close" @click="closeModal">✕</button>
				</div>

				<form @submit.prevent="saveCategory" class="modal-form">
					<div class="form-group">
						<label for="categoryName" class="form-label">分类名称 <span class="required">*</span></label>
						<input id="categoryName" v-model="formData.name" type="text" class="form-input" :class="{ error: formErrors.name }" placeholder="请输入分类名称" maxlength="50" />
						<div v-if="formErrors.name" class="error-text">{{ formErrors.name }}</div>
						<div class="input-hint">{{ formData.name.length }}/50</div>
					</div>

					<div class="form-group">
						<label for="categoryDescription" class="form-label">分类描述</label>
						<textarea
							id="categoryDescription"
							v-model="formData.description"
							class="form-textarea"
							:class="{ error: formErrors.description }"
							placeholder="请输入分类描述（可选）"
							maxlength="200"
							rows="4"
						></textarea>
						<div v-if="formErrors.description" class="error-text">{{ formErrors.description }}</div>
						<div class="input-hint">{{ formData.description.length }}/200</div>
					</div>

					<div class="form-actions">
						<button type="button" class="cancel-btn" @click="closeModal">取消</button>
						<button type="submit" class="submit-btn">
							{{ editingCategory ? "更新" : "创建" }}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</template>

<style scoped>
.category-manage {
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

/* 搜索区域 */
.search-section {
	display: flex;
	gap: 16px;
	margin-bottom: 24px;
}

.search-box {
	display: flex;
	align-items: center;
	background: rgba(26, 35, 50, 0.8);
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

/* 统计区域 */
.stats-section {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 20px;
	margin-bottom: 24px;
}

.stat-card {
	background: rgba(26, 35, 50, 0.8);
	border-radius: 12px;
	padding: 20px;
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
	width: 48px;
	height: 48px;
	border-radius: 12px;
	background: rgba(100, 255, 218, 0.1);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 20px;
}

.stat-info {
	flex: 1;
}

.stat-value {
	font-size: 24px;
	font-weight: 600;
	color: var(--text-primary);
	margin-bottom: 4px;
}

.stat-label {
	color: var(--text-secondary);
	font-size: 14px;
}

/* 分类列表 */
.category-list {
	background: rgba(26, 35, 50, 0.8);
	border-radius: 12px;
	border: 1px solid rgba(100, 255, 218, 0.1);
	overflow: hidden;
	margin-bottom: 24px;
}

.list-header {
	display: grid;
	grid-template-columns: 1fr 2fr 120px 140px 120px;
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

.loading-state {
	padding: 60px 20px;
	text-align: center;
	color: var(--text-secondary);
}

.loading-icon {
	font-size: 48px;
	margin-bottom: 16px;
	opacity: 0.7;
	animation: pulse 1.5s ease-in-out infinite;
}

.loading-text {
	font-size: 16px;
	color: var(--text-secondary);
}

.empty-state {
	padding: 60px 20px;
	text-align: center;
	color: var(--text-secondary);
}

.empty-icon {
	font-size: 48px;
	margin-bottom: 16px;
	opacity: 0.5;
}

.empty-text {
	font-size: 16px;
	margin-bottom: 20px;
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
	transform: translateY(-2px);
}

.category-item {
	display: grid;
	grid-template-columns: 1fr 2fr 120px 140px 120px;
	gap: 16px;
	padding: 16px 20px;
	border-bottom: 1px solid rgba(100, 255, 218, 0.05);
	transition: background 0.3s ease;
}

.category-item:hover {
	background: rgba(100, 255, 218, 0.02);
}

.category-item:last-child {
	border-bottom: none;
}

.category-name {
	display: flex;
	align-items: center;
}

.name-text {
	color: var(--text-primary);
	font-weight: 500;
	font-size: 16px;
}

.category-description {
	display: flex;
	align-items: center;
}

.description-text {
	color: var(--text-secondary);
	font-size: 14px;
	line-height: 1.4;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.category-count {
	display: flex;
	align-items: center;
}

.count-badge {
	background: rgba(140, 140, 140, 0.1);
	color: #8c8c8c;
	padding: 4px 12px;
	border-radius: 16px;
	font-size: 12px;
	font-weight: 500;
}

.count-badge.has-articles {
	background: rgba(100, 255, 218, 0.1);
	color: var(--accent);
}

.category-date {
	display: flex;
	align-items: center;
	color: var(--text-secondary);
	font-size: 14px;
}

.category-actions {
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

.action-btn:hover:not(:disabled) {
	background: rgba(100, 255, 218, 0.1);
	color: var(--accent);
}

.action-btn.delete:hover:not(:disabled) {
	background: rgba(255, 107, 107, 0.1);
	color: #ff6b6b;
}

.action-btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
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

/* 模态框 */
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 2000;
	backdrop-filter: blur(4px);
}

.modal-content {
	background: var(--bg-secondary);
	border-radius: 12px;
	border: 1px solid rgba(100, 255, 218, 0.1);
	width: 90%;
	max-width: 500px;
	max-height: 90vh;
	overflow: auto;
	animation: modalSlideIn 0.3s ease-out;
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20px 24px;
	border-bottom: 1px solid rgba(100, 255, 218, 0.1);
}

.modal-title {
	font-size: 18px;
	font-weight: 600;
	color: var(--text-primary);
}

.modal-close {
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
}

.modal-close:hover {
	background: rgba(255, 107, 107, 0.1);
	color: #ff6b6b;
}

.modal-form {
	padding: 24px;
}

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

.required {
	color: #ff6b6b;
}

.form-input,
.form-textarea {
	width: 100%;
	padding: 12px 16px;
	background: var(--bg-tertiary);
	border: 1px solid rgba(100, 255, 218, 0.1);
	border-radius: 8px;
	color: var(--text-primary);
	font-size: 14px;
	transition: all 0.3s ease;
	resize: vertical;
}

.form-input:focus,
.form-textarea:focus {
	outline: none;
	border-color: var(--accent);
	box-shadow: 0 0 0 3px rgba(100, 255, 218, 0.1);
}

.form-input.error,
.form-textarea.error {
	border-color: #ff6b6b;
}

.form-input::placeholder,
.form-textarea::placeholder {
	color: var(--text-secondary);
}

.error-text {
	color: #ff6b6b;
	font-size: 12px;
	margin-top: 4px;
}

.input-hint {
	color: var(--text-secondary);
	font-size: 12px;
	margin-top: 4px;
	text-align: right;
}

.form-actions {
	display: flex;
	gap: 12px;
	justify-content: flex-end;
	margin-top: 24px;
}

.cancel-btn {
	padding: 10px 20px;
	background: transparent;
	border: 1px solid rgba(100, 255, 218, 0.3);
	border-radius: 6px;
	color: var(--text-secondary);
	cursor: pointer;
	transition: all 0.3s ease;
}

.cancel-btn:hover {
	color: var(--accent);
	border-color: var(--accent);
}

.submit-btn {
	padding: 10px 20px;
	background: var(--accent);
	color: var(--bg-primary);
	border: none;
	border-radius: 6px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.3s ease;
}

.submit-btn:hover {
	background: var(--accent-hover);
}

/* 响应式设计 */
@media (max-width: 1200px) {
	.list-header,
	.category-item {
		grid-template-columns: 1fr 1.5fr 100px 120px 100px;
	}
}

@media (max-width: 768px) {
	.category-manage {
		padding: 16px;
	}

	.search-section {
		flex-direction: column;
	}

	.search-box {
		max-width: none;
	}

	.stats-section {
		grid-template-columns: 1fr;
	}

	.list-header,
	.category-item {
		grid-template-columns: 1fr 80px 80px;
		font-size: 12px;
	}

	.category-description,
	.category-date {
		display: none;
	}

	.modal-content {
		width: 95%;
		margin: 20px;
	}

	.modal-form {
		padding: 20px;
	}

	.form-actions {
		flex-direction: column;
	}

	.pagination {
		flex-direction: column;
		gap: 12px;
	}
}

@keyframes modalSlideIn {
	from {
		opacity: 0;
		transform: translateY(-20px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes pulse {
	0%,
	100% {
		opacity: 0.7;
	}
	50% {
		opacity: 1;
	}
}

/* ElementPlus MessageBox 自定义样式 */
:global(.custom-message-box) {
	background: var(--bg-secondary) !important;
	border: 1px solid rgba(100, 255, 218, 0.2) !important;
	border-radius: 12px !important;
	box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3) !important;
}

:global(.custom-message-box .el-message-box__header) {
	background: transparent !important;
	border-bottom: 1px solid rgba(100, 255, 218, 0.1) !important;
	padding: 20px 24px 16px !important;
}

:global(.custom-message-box .el-message-box__title) {
	color: var(--text-primary) !important;
	font-weight: 600 !important;
	font-size: 18px !important;
}

:global(.custom-message-box .el-message-box__content) {
	padding: 20px 24px !important;
	color: var(--text-secondary) !important;
	background: transparent !important;
}

:global(.custom-message-box .el-message-box__message) {
	color: var(--text-secondary) !important;
	font-size: 15px !important;
	line-height: 1.5 !important;
}

:global(.custom-message-box .el-message-box__btns) {
	padding: 16px 24px 20px !important;
	background: transparent !important;
	border-top: 1px solid rgba(100, 255, 218, 0.1) !important;
}

:global(.custom-message-box .el-button) {
	border-radius: 8px !important;
	font-weight: 500 !important;
	padding: 10px 20px !important;
	transition: all 0.3s ease !important;
}

:global(.custom-message-box .custom-confirm-btn) {
	background: #ff6b6b !important;
	border-color: #ff6b6b !important;
	color: white !important;
}

:global(.custom-message-box .custom-confirm-btn:hover) {
	background: #ff5252 !important;
	border-color: #ff5252 !important;
	transform: translateY(-1px) !important;
	box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3) !important;
}

:global(.custom-message-box .custom-cancel-btn) {
	background: transparent !important;
	border: 1px solid rgba(100, 255, 218, 0.3) !important;
	color: var(--text-secondary) !important;
}

:global(.custom-message-box .custom-cancel-btn:hover) {
	border-color: var(--accent) !important;
	color: var(--accent) !important;
	background: rgba(100, 255, 218, 0.05) !important;
}

:global(.custom-message-box .el-button--primary) {
	background: var(--accent) !important;
	border-color: var(--accent) !important;
	color: var(--bg-primary) !important;
}

:global(.custom-message-box .el-button--primary:hover) {
	background: var(--accent-hover) !important;
	border-color: var(--accent-hover) !important;
	transform: translateY(-1px) !important;
	box-shadow: 0 4px 12px rgba(100, 255, 218, 0.3) !important;
}

:global(.custom-message-box .el-message-box__close) {
	color: var(--text-secondary) !important;
	font-size: 16px !important;
}

:global(.custom-message-box .el-message-box__close:hover) {
	color: #ff6b6b !important;
}

/* 警告图标样式 */
:global(.custom-message-box .el-message-box__status.el-icon) {
	color: #f39c12 !important;
	font-size: 20px !important;
}
</style>
