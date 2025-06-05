<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { MdEditor } from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import { articleAPI } from "@/api/article.ts";
import { categoryAPI } from "@/api/category.ts";
import { uploadAPI } from "@/api/upload.ts";
import type { Category } from "@/type/category";
import { ElMessage } from "element-plus";

const router = useRouter();
const route = useRoute();

// 响应式数据
const isEditing = ref(false);
const showSaveMessage = ref(false);
const saveMessage = ref("");
const newTag = ref("");
const categories = ref<Category[]>([]);

// 编辑器配置
const editorHeight = ref("600px");
const editorTheme = ref("dark");
const previewTheme = ref("github");
const codeTheme = ref("atom");

// 工具栏配置
const toolbars = [
	"bold",
	"underline",
	"italic",
	"strikeThrough",
	"-",
	"title",
	"sub",
	"sup",
	"quote",
	"unorderedList",
	"orderedList",
	"task",
	"-",
	"codeRow",
	"code",
	"link",
	"image",
	"table",
	"-",
	"revoke",
	"next",
	"save",
	"=",
	"pageFullscreen",
	"fullscreen",
	"preview",
	"previewOnly",
];

// 文章表单数据
const articleForm = reactive({
	id: null as number | null,
	title: "",
	summary: "",
	content: "",
	categoryId: null as number | null,
	tags: [] as string[],
	status: "DRAFT",
	isPinned: false,
	isOriginal: true,
	allowComment: true,
	metaDescription: "",
	metaKeywords: "",
	slug: "",
	coverImage: "",
	wordCount: 0,
	readingTime: 0,
});

// 常用标签建议
const suggestedTags = ref(["Vue.js", "Spring Boot", "JavaScript", "Java", "前端开发", "后端开发", "数据库", "MySQL", "Redis", "微服务", "架构设计", "性能优化"]);

// 上传图片标识
const isUploading = ref(false);
const uploadProgress = ref<Map<number, number>>(new Map());

// 表单验证相关的响应式数据
const formErrors = reactive({
	title: "",
	content: "",
	categoryId: "",
	tags: "",
	summary: "",
	metaDescription: "",
	metaKeywords: "",
	slug: "",
});

// 验证规则
const validationRules = {
	title: {
		required: true,
		maxLength: 200,
	},
	content: {
		required: true,
	},
	categoryId: {
		required: true,
	},
	tags: {
		maxCount: 10,
	},
	summary: {
		maxLength: 500,
	},
	metaDescription: {
		maxLength: 160,
	},
	metaKeywords: {
		maxLength: 200,
	},
	slug: {
		maxLength: 60,
		pattern: /^[a-z0-9-]+$/,
	},
};

// 计算属性
const canPublish = computed(() => {
	return articleForm.title.trim() && articleForm.content.trim() && articleForm.categoryId;
});

const wordCount = computed(() => {
	return articleForm.content.replace(/\s/g, "").length;
});

const readingTime = computed(() => {
	return Math.ceil(wordCount.value / 300);
});

// 实时验证标题
const validateTitle = () => {
	if (!articleForm.title.trim()) {
		formErrors.title = "标题不能为空";
		return false;
	} else if (articleForm.title.length > validationRules.title.maxLength) {
		formErrors.title = `标题长度不能超过${validationRules.title.maxLength}个字符`;
		return false;
	}
	formErrors.title = "";
	return true;
};

// 实时验证内容
const validateContent = () => {
	if (!articleForm.content.trim()) {
		formErrors.content = "内容不能为空";
		return false;
	}
	formErrors.content = "";
	return true;
};

// 实时验证分类
const validateCategory = () => {
	if (!articleForm.categoryId) {
		formErrors.categoryId = "请选择文章分类";
		return false;
	}
	formErrors.categoryId = "";
	return true;
};

// 实时验证标签
const validateTags = () => {
	if (articleForm.tags.length > validationRules.tags.maxCount) {
		formErrors.tags = `标签数量不能超过${validationRules.tags.maxCount}个`;
		return false;
	}
	formErrors.tags = "";
	return true;
};

// 实时验证摘要
const validateSummary = () => {
	if (articleForm.summary.length > validationRules.summary.maxLength) {
		formErrors.summary = `摘要长度不能超过${validationRules.summary.maxLength}个字符`;
		return false;
	}
	formErrors.summary = "";
	return true;
};

// 实时验证SEO描述
const validateMetaDescription = () => {
	const desc = articleForm.metaDescription.trim();
	if (desc.length > validationRules.metaDescription.maxLength) {
		formErrors.metaDescription = `SEO描述不能超过${validationRules.metaDescription.maxLength}个字符`;
		return false;
	}
	formErrors.metaDescription = "";
	return true;
};

// 实时验证SEO关键词
const validateMetaKeywords = () => {
	const keywords = articleForm.metaKeywords.trim();
	if (keywords.length > validationRules.metaKeywords.maxLength) {
		formErrors.metaKeywords = `关键词总长度不能超过${validationRules.metaKeywords.maxLength}个字符`;
		return false;
	}
	formErrors.metaKeywords = "";
	return true;
};

// 实时验证URL别名
const validateSlug = () => {
	const slug = articleForm.slug.trim();
	if (slug) {
		if (slug.length > validationRules.slug.maxLength) {
			formErrors.slug = `URL别名不能超过${validationRules.slug.maxLength}个字符`;
			return false;
		} else if (!validationRules.slug.pattern.test(slug)) {
			formErrors.slug = "URL别名只能包含小写字母、数字和连字符(-)";
			return false;
		}
	}
	formErrors.slug = "";
	return true;
};

// 修改验证表单方法
const validateForm = (): boolean => {
	const isTitleValid = validateTitle();
	const isContentValid = validateContent();
	const isCategoryValid = validateCategory();
	const isTagsValid = validateTags();
	const isSummaryValid = validateSummary();
	const isMetaDescriptionValid = validateMetaDescription();
	const isMetaKeywordsValid = validateMetaKeywords();
	const isSlugValid = validateSlug();

	return isTitleValid && isContentValid && isCategoryValid && isTagsValid && 
		isSummaryValid && isMetaDescriptionValid && isMetaKeywordsValid && isSlugValid;
};

// 方法
const goBack = () => {
	if (hasUnsavedChanges()) {
		if (confirm("有未保存的更改，确定要离开吗？")) {
			router.push("/admin/articles");
		}
	} else {
		router.push("/admin/articles");
	}
};

const hasUnsavedChanges = () => {
	return articleForm.title.trim() || articleForm.content.trim();
};

const loadCategories = async () => {
	try {
		const response = await categoryAPI.getCategories();
		console.log("这是所有的分类", response.data);
		categories.value = response.data;
	} catch (error: any) {
		console.error("获取分类列表失败:", error);
		showMessage(error.response?.data?.message || "获取分类列表失败","error");
	}
};

const loadArticle = async (id: string) => {
	try {
		const response = await articleAPI.getArticle(id);
		const article = response.data;

		// 更新表单数据
		Object.assign(articleForm, {
			id: article.id,
			title: article.title,
			summary: article.summary || "",
			content: article.content,
			categoryId: article.categoryId,
			tags: article.tags || [],
			status: article.status,
			isPinned: article.isPinned,
			isOriginal: article.isOriginal,
			allowComment: article.allowComment,
			metaDescription: article.metaDescription || "",
			metaKeywords: article.metaKeywords || "",
			slug: article.slug || "",
			coverImage: article.coverImage || "",
		});
	} catch (error: any) {
		console.error("获取文章详情失败:", error);
		showMessage(error.response?.data?.message || "获取文章详情失败","error");
		router.push("/admin/articles");
	}
};

const saveDraft = async () => {
	try {
		// 草稿模式下只验证标题
		if (!articleForm.title.trim()) {
			formErrors.title = "标题不能为空";
			showMessage("请填写文章标题","warning");
			return;
		}

		articleForm.status = "DRAFT";
		await saveArticle();
		showMessage("草稿保存成功","success");
	} catch (error) {
		console.error("保存草稿失败:", error);
	}
};

const publishArticle = async () => {
	try {
		// 先进行表单验证
		if (!validateForm()) {
			showMessage("请检查表单填写是否正确","warning");
			return;
		}

		articleForm.status = "PUBLISHED";
		await saveArticle();
		showMessage(isEditing.value ? "文章更新成功" : "文章发布成功","success");

		setTimeout(() => {
			router.push("/admin/articles");
		}, 2000);
	} catch (error) {
		console.error("发布文章失败:", error);
	}
};

const saveArticle = async () => {
	try {
		// 先进行表单验证
		if (!validateForm()) {
			showMessage("请检查表单填写是否正确","warning");
			return;
		}

		const articleData = {
			...articleForm,
		};

		if (isEditing.value) {
			await articleAPI.updateArticle(articleForm.id!.toString(), articleData);
		} else {
			const response = await articleAPI.createArticle(articleData);
			articleForm.id = response.data.id;
			isEditing.value = true;
		}
	} catch (error: any) {
		console.error("保存文章失败:", error);
		showMessage(error.response?.data?.message || "保存失败，请重试","error");
		throw error;
	}
};

const addTag = () => {
	const tag = newTag.value.trim();
	if (tag && !articleForm.tags.includes(tag)) {
		articleForm.tags.push(tag);
		newTag.value = "";
		validateTags(); // 添加标签后验证
	}
};

const removeTag = (tag: string) => {
	const index = articleForm.tags.indexOf(tag);
	if (index > -1) {
		articleForm.tags.splice(index, 1);
		validateTags(); // 移除标签后验证
	}
};

const addSuggestedTag = (tag: string) => {
	if (!articleForm.tags.includes(tag)) {
		articleForm.tags.push(tag);
		validateTags(); // 添加推荐标签后验证
	}
};

const handleCoverUpload = (event: Event) => {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];
	if (file) {
		const reader = new FileReader();
		reader.onload = (e) => {
			articleForm.coverImage = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}
};

const removeCover = () => {
	articleForm.coverImage = "";
};

// 根据type类型选择不同的message
const showMessage = (message: string,type:string) => {
	switch(type){
		case "primary":
			ElMessage.primary(message);
			break;
		case "success":
			ElMessage.success(message);
			break;
		case "warning":
			ElMessage.warning(message);
			break;
		case "info":
			ElMessage.info(message);
			break;
		case "error":
			ElMessage.error(message);
			break;
		default:
			ElMessage.warning(message);
	}
};

// md-editor-v3 回调函数
const onUploadImg = async (files: File[], callback: (urls: string[]) => void) => {
	try {
		isUploading.value = true;
		const urls: string[] = [];
		const uploadResults = await uploadAPI.uploadImages(files, (fileIndex, progress) => {
			// 更新上传进度
			uploadProgress.value.set(fileIndex, progress.percentage);
			console.log(`文件 ${fileIndex + 1} 上传进度: ${progress.percentage}%`);
		});
		// 处理上传结果
		for (const result of uploadResults) {
			if (result.code === 200) {
				urls.push(result.data.url);
			} else {
				console.error("上传失败:", result.message);
				showMessage(`文件上传失败: ${result.message}`,`error`);
			}
		}
		// 清除进度信息
		uploadProgress.value.clear();
		if (urls.length > 0) {
			showMessage("图片上传成功","success");
			callback(urls);
		}
	} catch (error) {
		console.error("图片上传失败:", error);
		showMessage("图片上传失败，请重试","error");
	} finally {
		isUploading.value = false;
		uploadProgress.value.clear();
	}
};

const onSave = (v: string, h: Promise<string>) => {
	saveDraft();
};

// 动态计算编辑器高度
const calculateEditorHeight = () => {
	const headerHeight = 80; // 页面头部高度
	const titleHeight = 60; // 标题区域高度
	const padding = 48; // 容器内边距
	const remainingHeight = window.innerHeight - headerHeight - titleHeight - padding;
	editorHeight.value = `${Math.max(remainingHeight, 400)}px`;
};

// 组件挂载时初始化
onMounted(() => {
	loadCategories();
	calculateEditorHeight();

	// 监听窗口大小变化
	window.addEventListener("resize", calculateEditorHeight);

	// 检查是否为编辑模式
	const articleId = route.params.id as string;
	if (articleId) {
		isEditing.value = true;
		loadArticle(articleId);
	}
});
</script>

<template>
	<div class="article-edit">
		<div class="page-header">
			<div class="header-left">
				<button class="back-btn" @click="goBack">
					<span class="btn-icon">←</span>
					返回
				</button>
				<h2 class="page-title">{{ isEditing ? "编辑文章" : "新建文章" }}</h2>
			</div>
			<div class="header-actions">
				<button class="save-draft-btn" @click="saveDraft" :disabled="!articleForm.title.trim()">
					<span class="btn-icon">💾</span>
					保存草稿
				</button>
				<button class="publish-btn" @click="publishArticle" :disabled="!canPublish">
					<span class="btn-icon">🚀</span>
					{{ isEditing ? "更新" : "发布" }}
				</button>
			</div>
		</div>

		<div class="edit-container">
			<!-- 左侧编辑区域 -->
			<div class="edit-area">
				<!-- 紧凑的标题区域 -->
				<div class="title-section">
					<input 
						v-model="articleForm.title" 
						type="text" 
						class="title-input" 
						:class="{ 'error': formErrors.title }"
						placeholder="请输入文章标题..." 
						maxlength="200"
						@input="validateTitle"
						@blur="validateTitle"
					/>
					<div v-if="formErrors.title" class="error-message">{{ formErrors.title }}</div>
				</div>

				<!-- Markdown编辑器 -->
				<div class="editor-section">
					<MdEditor
						v-model="articleForm.content"
						:height="editorHeight"
						:theme="editorTheme"
						:preview-theme="previewTheme"
						:code-theme="codeTheme"
						:toolbars="toolbars"
						:footer-height="30"
						@on-upload-img="onUploadImg"
						@on-save="onSave"
						@on-change="validateContent"
						placeholder="开始写作吧..."
					/>
					<div v-if="formErrors.content" class="error-message">{{ formErrors.content }}</div>
				</div>
			</div>

			<!-- 右侧设置面板 -->
			<div class="settings-panel">
				<!-- 基本信息 -->
				<div class="panel-section">
					<h3 class="section-title">基本信息</h3>
					<div class="form-group">
						<label class="form-label">文章摘要</label>
						<textarea 
							v-model="articleForm.summary" 
							class="form-textarea compact" 
							:class="{ 'error': formErrors.summary }"
							placeholder="请输入文章摘要（可选）..." 
							rows="2" 
							maxlength="500"
							@input="validateSummary"
							@blur="validateSummary"
						></textarea>
						<div class="input-hint">{{ articleForm.summary.length }}/500</div>
						<div v-if="formErrors.summary" class="error-message">{{ formErrors.summary }}</div>
					</div>
				</div>

				<!-- 发布设置 -->
				<div class="panel-section">
					<h3 class="section-title">发布设置</h3>
					<div class="form-group">
						<label class="form-label">文章状态</label>
						<select v-model="articleForm.status" class="form-select">
							<option value="DRAFT">草稿</option>
							<option value="PUBLISHED">已发布</option>
							<option value="ARCHIVED">已归档</option>
						</select>
					</div>
					<div class="form-group">
						<div class="checkbox-group">
							<label class="checkbox-item">
								<input v-model="articleForm.isPinned" type="checkbox" class="checkbox" />
								<span class="checkmark"></span>
								<span class="checkbox-text">置顶文章</span>
							</label>
							<label class="checkbox-item">
								<input v-model="articleForm.isOriginal" type="checkbox" class="checkbox" />
								<span class="checkmark"></span>
								<span class="checkbox-text">原创内容</span>
							</label>
							<label class="checkbox-item">
								<input v-model="articleForm.allowComment" type="checkbox" class="checkbox" />
								<span class="checkmark"></span>
								<span class="checkbox-text">允许评论</span>
							</label>
						</div>
					</div>
				</div>

				<!-- 分类和标签 -->
				<div class="panel-section">
					<h3 class="section-title">分类和标签</h3>
					<div class="form-group">
						<label class="form-label">文章分类</label>
						<select 
							v-model="articleForm.categoryId" 
							class="form-select" 
							:class="{ 'error': formErrors.categoryId }"
							@change="validateCategory"
						>
							<option :value="null">请选择分类</option>
							<option v-for="category in categories" :key="category.id" :value="category.id">
								{{ category.name }}
							</option>
						</select>
						<div v-if="formErrors.categoryId" class="error-message">{{ formErrors.categoryId }}</div>
					</div>
					<div class="form-group">
						<label class="form-label">文章标签</label>
						<div class="tag-input-container">
							<input v-model="newTag" type="text" class="tag-input" placeholder="输入标签后按回车添加" @keyup.enter="addTag" @keyup.esc="newTag = ''" />
							<button class="add-tag-btn" @click="addTag" :disabled="!newTag.trim()">添加</button>
						</div>
						<div class="selected-tags">
							<span v-for="tag in articleForm.tags" :key="tag" class="tag-item">
								{{ tag }}
								<button class="remove-tag" @click="removeTag(tag)">✕</button>
							</span>
						</div>
						<div v-if="formErrors.tags" class="error-message">{{ formErrors.tags }}</div>
						<div class="tag-suggestions">
							<span class="suggestions-label">推荐：</span>
							<button v-for="tag in suggestedTags.slice(0, 6)" :key="tag" class="suggestion-tag" @click="addSuggestedTag(tag)" :disabled="articleForm.tags.includes(tag)">
								{{ tag }}
							</button>
						</div>
					</div>
				</div>

				<!-- 封面图片 -->
				<div class="panel-section">
					<h3 class="section-title">封面图片</h3>
					<div class="form-group">
						<div class="cover-upload">
							<input ref="coverInput" type="file" accept="image/*" style="display: none" @change="handleCoverUpload" />
							<div v-if="articleForm.coverImage" class="cover-preview">
								<img :src="articleForm.coverImage" alt="封面预览" />
								<button class="remove-cover" @click="removeCover">删除</button>
							</div>
							<button v-else class="upload-cover-btn" @click="$refs.coverInput.click()">
								<span class="btn-icon">📷</span>
								上传封面
							</button>
						</div>
					</div>
				</div>

				<!-- SEO设置 -->
				<div class="panel-section">
					<h3 class="section-title">SEO设置</h3>
					<div class="form-group">
						<label class="form-label">SEO描述</label>
						<textarea 
							v-model="articleForm.metaDescription" 
							class="form-textarea compact" 
							:class="{ 'error': formErrors.metaDescription }"
							placeholder="用于搜索引擎展示的描述，建议150-160个字符..." 
							rows="2" 
							maxlength="160"
							@input="validateMetaDescription"
							@blur="validateMetaDescription"
						></textarea>
						<div class="input-hint">
							<span>{{ articleForm.metaDescription.length }}/160</span>
							<span class="hint-text">建议：150-160字符，简明扼要描述文章内容</span>
						</div>
						<div v-if="formErrors.metaDescription" class="error-message">{{ formErrors.metaDescription }}</div>
					</div>
					<div class="form-group">
						<label class="form-label">SEO关键词</label>
						<input 
							v-model="articleForm.metaKeywords" 
							type="text" 
							class="form-input" 
							:class="{ 'error': formErrors.metaKeywords }"
							placeholder="关键词用英文逗号分隔" 
							maxlength="200"
							@input="validateMetaKeywords"
							@blur="validateMetaKeywords"
						/>
						<div class="input-hint">
							<span class="hint-text">建议：使用英文逗号分隔关键词</span>
						</div>
						<div v-if="formErrors.metaKeywords" class="error-message">{{ formErrors.metaKeywords }}</div>
					</div>
					<div class="form-group">
						<label class="form-label">URL别名</label>
						<input 
							v-model="articleForm.slug" 
							type="text" 
							class="form-input" 
							:class="{ 'error': formErrors.slug }"
							placeholder="自定义URL路径，只能包含小写字母、数字和连字符(-)" 
							maxlength="60"
							@input="validateSlug"
							@blur="validateSlug"
						/>
						<div class="input-hint">
							<span class="hint-text">建议：使用英文或拼音，用连字符(-)分隔</span>
						</div>
						<div v-if="formErrors.slug" class="error-message">{{ formErrors.slug }}</div>
					</div>
				</div>

				<!-- 文章统计 -->
				<div class="panel-section">
					<h3 class="section-title">文章统计</h3>
					<div class="stats-grid">
						<div class="stat-item">
							<span class="stat-label">字数</span>
							<span class="stat-value">{{ wordCount }}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">阅读时间</span>
							<span class="stat-value">{{ readingTime }}分钟</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- 保存成功提示 -->
		<div v-if="showSaveMessage" class="save-message">
			<span class="save-icon">✅</span>
			{{ saveMessage }}
		</div>
	</div>
</template>



<style scoped>
.article-edit {
	padding: 24px;
	height: 100vh;
	display: flex;
	flex-direction: column;
}

.page-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
	padding-bottom: 16px;
	border-bottom: 1px solid rgba(100, 255, 218, 0.1);
	flex-shrink: 0;
}

.header-left {
	display: flex;
	align-items: center;
	gap: 16px;
}

.back-btn {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 16px;
	background: transparent;
	border: 1px solid rgba(100, 255, 218, 0.3);
	border-radius: 6px;
	color: var(--text-secondary);
	cursor: pointer;
	transition: all 0.3s ease;
}

.back-btn:hover {
	color: var(--accent);
	border-color: var(--accent);
}

.page-title {
	font-size: 24px;
	font-weight: 600;
	color: var(--text-primary);
	margin: 0;
}

.header-actions {
	display: flex;
	gap: 12px;
}

.save-draft-btn,
.publish-btn {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 16px;
	border: none;
	border-radius: 6px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.3s ease;
	font-size: 14px;
}

.save-draft-btn {
	background: rgba(140, 140, 140, 0.1);
	color: #8c8c8c;
	border: 1px solid rgba(140, 140, 140, 0.2);
}

.save-draft-btn:hover:not(:disabled) {
	background: rgba(140, 140, 140, 0.2);
}

.publish-btn {
	background: var(--accent);
	color: var(--bg-primary);
}

.publish-btn:hover:not(:disabled) {
	background: var(--accent-hover);
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(100, 255, 218, 0.3);
}

.save-draft-btn:disabled,
.publish-btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
	transform: none;
	box-shadow: none;
}

.btn-icon {
	font-size: 14px;
}

/* 编辑容器 */
.edit-container {
	display: grid;
	grid-template-columns: 1fr 320px;
	gap: 20px;
	flex: 1;
	overflow: hidden;
}

.edit-area {
	display: flex;
	flex-direction: column;
	background: rgba(26, 35, 50, 0.8);
	border-radius: 12px;
	border: 1px solid rgba(100, 255, 218, 0.1);
	overflow: hidden;
}

/* 紧凑的标题区域 */
.title-section {
	padding: 16px 20px;
	border-bottom: 1px solid rgba(100, 255, 218, 0.1);
	flex-shrink: 0;
}

.title-input {
	width: 100%;
	padding: 8px 0;
	background: transparent;
	border: none;
	color: var(--text-primary);
	font-size: 22px;
	font-weight: 600;
	line-height: 1.3;
}

.title-input:focus {
	outline: none;
}

.title-input::placeholder {
	color: var(--text-secondary);
}

/* 编辑器区域 */
.editor-section {
	flex: 1;
	overflow: hidden;
}

/* 设置面板 */
.settings-panel {
	background: rgba(26, 35, 50, 0.8);
	border-radius: 12px;
	border: 1px solid rgba(100, 255, 218, 0.1);
	height: fit-content;
	max-height: 100%;
	overflow-y: auto;
}

.panel-section {
	padding: 16px;
	border-bottom: 1px solid rgba(100, 255, 218, 0.1);
}

.panel-section:last-child {
	border-bottom: none;
}

.section-title {
	font-size: 14px;
	font-weight: 600;
	color: var(--text-primary);
	margin: 0 0 12px 0;
}

.form-group {
	margin-bottom: 12px;
}

.form-group:last-child {
	margin-bottom: 0;
}

.form-label {
	display: block;
	color: var(--text-primary);
	font-weight: 500;
	margin-bottom: 6px;
	font-size: 13px;
}

.form-select,
.form-input,
.form-textarea {
	width: 100%;
	padding: 8px 10px;
	background: var(--bg-tertiary);
	border: 1px solid rgba(100, 255, 218, 0.1);
	border-radius: 6px;
	color: var(--text-primary);
	font-size: 13px;
	transition: all 0.3s ease;
}

.form-textarea.compact {
	min-height: 60px;
}

.form-select:focus,
.form-input:focus,
.form-textarea:focus {
	outline: none;
	border-color: var(--accent);
	box-shadow: 0 0 0 2px rgba(100, 255, 218, 0.1);
}

/* 复选框组 */
.checkbox-group {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.checkbox-item {
	display: flex;
	align-items: center;
	gap: 8px;
	cursor: pointer;
	user-select: none;
}

.checkbox {
	display: none;
}

.checkmark {
	width: 16px;
	height: 16px;
	border: 2px solid rgba(100, 255, 218, 0.3);
	border-radius: 3px;
	position: relative;
	transition: all 0.3s ease;
}

.checkbox:checked + .checkmark {
	background: var(--accent);
	border-color: var(--accent);
}

.checkbox:checked + .checkmark::after {
	content: "";
	position: absolute;
	left: 4px;
	top: 1px;
	width: 3px;
	height: 6px;
	border: solid var(--bg-primary);
	border-width: 0 2px 2px 0;
	transform: rotate(45deg);
}

.checkbox-text {
	color: var(--text-secondary);
	font-size: 13px;
}

/* 标签输入 */
.tag-input-container {
	display: flex;
	gap: 6px;
	margin-bottom: 8px;
}

.tag-input {
	flex: 1;
}

.add-tag-btn {
	padding: 8px 12px;
	background: var(--accent);
	color: var(--bg-primary);
	border: none;
	border-radius: 6px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.3s ease;
	font-size: 12px;
}

.add-tag-btn:hover:not(:disabled) {
	background: var(--accent-hover);
}

.add-tag-btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.selected-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin-bottom: 8px;
}

.tag-item {
	display: flex;
	align-items: center;
	gap: 4px;
	background: rgba(100, 255, 218, 0.1);
	color: var(--accent);
	padding: 3px 6px;
	border-radius: 10px;
	font-size: 11px;
	font-weight: 500;
}

.remove-tag {
	background: none;
	border: none;
	color: var(--accent);
	cursor: pointer;
	font-size: 11px;
	padding: 0;
	width: 14px;
	height: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	transition: all 0.3s ease;
}

.remove-tag:hover {
	background: rgba(255, 107, 107, 0.2);
	color: #ff6b6b;
}

.tag-suggestions {
	display: flex;
	flex-wrap: wrap;
	gap: 4px;
	align-items: center;
}

.suggestions-label {
	color: var(--text-secondary);
	font-size: 11px;
	margin-right: 4px;
}

.suggestion-tag {
	background: var(--bg-tertiary);
	color: var(--text-secondary);
	border: 1px solid rgba(100, 255, 218, 0.1);
	padding: 2px 6px;
	border-radius: 6px;
	font-size: 11px;
	cursor: pointer;
	transition: all 0.3s ease;
}

.suggestion-tag:hover:not(:disabled) {
	background: rgba(100, 255, 218, 0.1);
	color: var(--accent);
	border-color: var(--accent);
}

.suggestion-tag:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

/* 封面上传 */
.cover-upload {
	border: 2px dashed rgba(100, 255, 218, 0.3);
	border-radius: 8px;
	padding: 16px;
	text-align: center;
	transition: all 0.3s ease;
}

.cover-upload:hover {
	border-color: var(--accent);
}

.cover-preview {
	position: relative;
	display: inline-block;
}

.cover-preview img {
	max-width: 100%;
	max-height: 120px;
	border-radius: 6px;
}

.remove-cover {
	position: absolute;
	top: 4px;
	right: 4px;
	background: rgba(255, 107, 107, 0.9);
	color: white;
	border: none;
	border-radius: 3px;
	padding: 2px 6px;
	font-size: 10px;
	cursor: pointer;
	transition: all 0.3s ease;
}

.remove-cover:hover {
	background: #ff6b6b;
}

.upload-cover-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 8px 16px;
	background: transparent;
	border: 1px solid rgba(100, 255, 218, 0.3);
	border-radius: 6px;
	color: var(--text-secondary);
	cursor: pointer;
	transition: all 0.3s ease;
	margin: 0 auto;
	font-size: 12px;
}

.upload-cover-btn:hover {
	color: var(--accent);
	border-color: var(--accent);
	background: rgba(100, 255, 218, 0.05);
}

/* 文章统计 */
.stats-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
}

.stat-item {
	background: var(--bg-tertiary);
	padding: 8px;
	border-radius: 6px;
	text-align: center;
}

.stat-label {
	display: block;
	color: var(--text-secondary);
	font-size: 11px;
	margin-bottom: 2px;
}

.stat-value {
	display: block;
	color: var(--accent);
	font-size: 16px;
	font-weight: 600;
}

.input-hint {
	text-align: right;
	color: var(--text-secondary);
	font-size: 11px;
	margin-top: 4px;
}

/* 保存提示 */
.save-message {
	position: fixed;
	top: 100px;
	right: 24px;
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 20px;
	background: rgba(82, 196, 26, 0.1);
	border: 1px solid rgba(82, 196, 26, 0.2);
	border-radius: 8px;
	color: #52c41a;
	font-weight: 500;
	z-index: 1000;
	animation: slideInRight 0.3s ease-out;
}

.save-icon {
	font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
	.edit-container {
		grid-template-columns: 1fr 280px;
	}
}

@media (max-width: 768px) {
	.article-edit {
		padding: 16px;
	}

	.page-header {
		flex-direction: column;
		gap: 16px;
		align-items: stretch;
	}

	.header-actions {
		justify-content: flex-end;
	}

	.edit-container {
		grid-template-columns: 1fr;
		gap: 16px;
	}

	.settings-panel {
		order: -1;
	}

	.title-input {
		font-size: 18px;
	}

	.save-message {
		right: 16px;
		left: 16px;
	}
}

@keyframes slideInRight {
	from {
		opacity: 0;
		transform: translateX(100%);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
}

/* 滚动条样式 */
.settings-panel::-webkit-scrollbar {
	width: 4px;
}

.settings-panel::-webkit-scrollbar-track {
	background: transparent;
}

.settings-panel::-webkit-scrollbar-thumb {
	background: rgba(100, 255, 218, 0.3);
	border-radius: 2px;
}

.settings-panel::-webkit-scrollbar-thumb:hover {
	background: rgba(100, 255, 218, 0.5);
}

/* md-editor-v3 主题覆盖 */
:deep(.md-editor) {
	background: transparent !important;
	border: none !important;
}

:deep(.md-editor-dark) {
	--md-color: var(--text-primary);
	--md-hover-color: var(--accent);
	--md-bk-color: var(--bg-primary);
	--md-bk-color-outstand: var(--bg-secondary);
	--md-bk-hover-color: rgba(100, 255, 218, 0.1);
	--md-border-color: rgba(100, 255, 218, 0.1);
	--md-border-hover-color: var(--accent);
}

:deep(.md-editor-input-wrapper) {
	border-right: 1px solid rgba(100, 255, 218, 0.1) !important;
}

:deep(.md-editor-input) {
	color: var(--text-primary) !important;
	background: var(--bg-primary) !important;
	font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace !important;
}

:deep(.md-editor-preview-wrapper) {
	background: var(--bg-primary) !important;
}

:deep(.md-editor-preview) {
	color: var(--text-primary) !important;
	background: var(--bg-primary) !important;
}

:deep(.md-editor-toolbar) {
	background: var(--bg-tertiary) !important;
	border-bottom: 1px solid rgba(100, 255, 218, 0.1) !important;
}

:deep(.md-editor-toolbar-item) {
	color: var(--text-secondary) !important;
}

:deep(.md-editor-toolbar-item:hover) {
	color: var(--accent) !important;
	background: rgba(100, 255, 218, 0.1) !important;
}

:deep(.md-editor-footer) {
	background: var(--bg-tertiary) !important;
	border-top: 1px solid rgba(100, 255, 218, 0.1) !important;
	color: var(--text-secondary) !important;
}

/* 错误提示样式 */
.error-message {
	color: #ff4d4f;
	font-size: 12px;
	margin-top: 4px;
}

.form-select.error,
.form-input.error,
.form-textarea.error {
	border-color: #ff4d4f;
}

.form-select.error:focus,
.form-input.error:focus,
.form-textarea.error:focus {
	box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.1);
}

.title-section .error-message {
	margin-top: 8px;
}

.editor-section .error-message {
	margin-top: 8px;
	padding: 0 16px;
}

.slug-input-group {
	display: flex;
	gap: 8px;
}

.generate-slug-btn {
	padding: 8px;
	background: var(--bg-tertiary);
	border: 1px solid rgba(100, 255, 218, 0.1);
	border-radius: 6px;
	color: var(--text-secondary);
	cursor: pointer;
	transition: all 0.3s ease;
}

.generate-slug-btn:hover {
	color: var(--accent);
	border-color: var(--accent);
	background: rgba(100, 255, 218, 0.05);
}

.hint-text {
	color: var(--text-secondary);
	font-size: 11px;
	margin-left: 8px;
}

.input-hint {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 4px;
}
</style>
