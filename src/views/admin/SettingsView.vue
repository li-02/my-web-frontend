<template>
	<div class="settings">
		<div class="page-header">
			<h2 class="page-title">系统设置</h2>
			<button class="save-btn" @click="saveSettings" :disabled="!hasChanges">
				<span class="btn-icon">💾</span>
				保存设置
			</button>
		</div>

		<div class="settings-content">
			<!-- 基本设置 -->
			<div class="settings-section">
				<div class="section-header">
					<h3 class="section-title">基本设置</h3>
					<span class="section-description">配置网站的基本信息</span>
				</div>
				<div class="section-body">
					<div class="form-grid">
						<div class="form-group">
							<label class="form-label">网站标题</label>
							<input v-model="settings.siteTitle" type="text" class="form-input" placeholder="请输入网站标题" />
						</div>
						<div class="form-group">
							<label class="form-label">网站副标题</label>
							<input v-model="settings.siteSubtitle" type="text" class="form-input" placeholder="请输入网站副标题" />
						</div>
						<div class="form-group full-width">
							<label class="form-label">网站描述</label>
							<textarea v-model="settings.siteDescription" class="form-textarea" rows="3" placeholder="请输入网站描述，用于SEO优化"></textarea>
						</div>
						<div class="form-group">
							<label class="form-label">网站关键词</label>
							<input v-model="settings.siteKeywords" type="text" class="form-input" placeholder="请输入关键词，用逗号分隔" />
						</div>
						<div class="form-group">
							<label class="form-label">网站作者</label>
							<input v-model="settings.siteAuthor" type="text" class="form-input" placeholder="请输入作者名称" />
						</div>
					</div>
				</div>
			</div>

			<!-- 显示设置 -->
			<div class="settings-section">
				<div class="section-header">
					<h3 class="section-title">显示设置</h3>
					<span class="section-description">配置页面显示相关选项</span>
				</div>
				<div class="section-body">
					<div class="form-grid">
						<div class="form-group">
							<label class="form-label">每页文章数量</label>
							<select v-model="settings.articlesPerPage" class="form-select">
								<option value="5">5篇</option>
								<option value="10">10篇</option>
								<option value="15">15篇</option>
								<option value="20">20篇</option>
							</select>
						</div>
						<div class="form-group">
							<label class="form-label">文章摘要长度</label>
							<input v-model.number="settings.excerptLength" type="number" class="form-input" placeholder="字符数" min="50" max="500" />
						</div>
						<div class="form-group full-width">
							<div class="checkbox-group">
								<label class="checkbox-item">
									<input v-model="settings.showReadingTime" type="checkbox" class="checkbox" />
									<span class="checkmark"></span>
									<span class="checkbox-text">显示预估阅读时间</span>
								</label>
								<label class="checkbox-item">
									<input v-model="settings.showViewCount" type="checkbox" class="checkbox" />
									<span class="checkmark"></span>
									<span class="checkbox-text">显示文章浏览量</span>
								</label>
								<label class="checkbox-item">
									<input v-model="settings.enableComments" type="checkbox" class="checkbox" />
									<span class="checkmark"></span>
									<span class="checkbox-text">启用评论功能</span>
								</label>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 安全设置 -->
			<div class="settings-section">
				<div class="section-header">
					<h3 class="section-title">安全设置</h3>
					<span class="section-description">配置登录和安全相关选项</span>
				</div>
				<div class="section-body">
					<div class="form-grid">
						<div class="form-group">
							<label class="form-label">登录会话超时时间</label>
							<select v-model="settings.sessionTimeout" class="form-select">
								<option value="30">30分钟</option>
								<option value="60">1小时</option>
								<option value="180">3小时</option>
								<option value="720">12小时</option>
								<option value="1440">24小时</option>
							</select>
						</div>
						<div class="form-group">
							<label class="form-label">最大登录失败次数</label>
							<input v-model.number="settings.maxLoginAttempts" type="number" class="form-input" min="3" max="10" />
						</div>
						<div class="form-group full-width">
							<div class="checkbox-group">
								<label class="checkbox-item">
									<input v-model="settings.enableTwoFactor" type="checkbox" class="checkbox" />
									<span class="checkmark"></span>
									<span class="checkbox-text">启用两步验证（开发中）</span>
								</label>
								<label class="checkbox-item">
									<input v-model="settings.logLoginAttempts" type="checkbox" class="checkbox" />
									<span class="checkmark"></span>
									<span class="checkbox-text">记录登录尝试日志</span>
								</label>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 邮件设置 -->
			<div class="settings-section">
				<div class="section-header">
					<h3 class="section-title">邮件设置</h3>
					<span class="section-description">配置邮件发送相关参数</span>
				</div>
				<div class="section-body">
					<div class="form-grid">
						<div class="form-group">
							<label class="form-label">SMTP服务器</label>
							<input v-model="settings.smtpHost" type="text" class="form-input" placeholder="smtp.example.com" />
						</div>
						<div class="form-group">
							<label class="form-label">SMTP端口</label>
							<input v-model.number="settings.smtpPort" type="number" class="form-input" placeholder="587" />
						</div>
						<div class="form-group">
							<label class="form-label">发送邮箱</label>
							<input v-model="settings.emailFrom" type="email" class="form-input" placeholder="noreply@example.com" />
						</div>
						<div class="form-group">
							<label class="form-label">邮箱密码</label>
							<input v-model="settings.emailPassword" type="password" class="form-input" placeholder="请输入邮箱密码或授权码" />
						</div>
						<div class="form-group full-width">
							<div class="checkbox-group">
								<label class="checkbox-item">
									<input v-model="settings.enableEmailNotification" type="checkbox" class="checkbox" />
									<span class="checkmark"></span>
									<span class="checkbox-text">启用邮件通知</span>
								</label>
								<label class="checkbox-item">
									<input v-model="settings.enableSsl" type="checkbox" class="checkbox" />
									<span class="checkmark"></span>
									<span class="checkbox-text">启用SSL/TLS加密</span>
								</label>
							</div>
						</div>
						<div class="form-group full-width">
							<button class="test-btn" @click="testEmailConfig">
								<span class="btn-icon">📧</span>
								测试邮件配置
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- 备份设置 -->
			<div class="settings-section">
				<div class="section-header">
					<h3 class="section-title">备份设置</h3>
					<span class="section-description">管理数据备份和恢复</span>
				</div>
				<div class="section-body">
					<div class="backup-options">
						<div class="backup-item">
							<div class="backup-info">
								<h4>数据库备份</h4>
								<p>导出所有文章、分类、标签等数据</p>
								<span class="backup-time">上次备份：{{ lastBackupTime }}</span>
							</div>
							<div class="backup-actions">
								<button class="backup-btn" @click="backupDatabase">
									<span class="btn-icon">📦</span>
									立即备份
								</button>
							</div>
						</div>
						<div class="backup-item">
							<div class="backup-info">
								<h4>自动备份</h4>
								<p>定期自动备份数据库</p>
								<div class="backup-schedule">
									<label class="checkbox-item">
										<input v-model="settings.autoBackup" type="checkbox" class="checkbox" />
										<span class="checkmark"></span>
										<span class="checkbox-text">启用自动备份</span>
									</label>
									<select v-model="settings.backupFrequency" class="form-select" :disabled="!settings.autoBackup">
										<option value="daily">每日</option>
										<option value="weekly">每周</option>
										<option value="monthly">每月</option>
									</select>
								</div>
							</div>
						</div>
						<div class="backup-item">
							<div class="backup-info">
								<h4>数据恢复</h4>
								<p>从备份文件恢复数据</p>
							</div>
							<div class="backup-actions">
								<input ref="fileInput" type="file" accept=".sql,.json" style="display: none" @change="handleFileSelect" />
								<button class="restore-btn" @click="$refs.fileInput.click()">
									<span class="btn-icon">📥</span>
									选择备份文件
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- 保存成功提示 -->
		<div v-if="showSuccessMessage" class="success-message">
			<span class="success-icon">✅</span>
			设置保存成功！
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";

// 设置数据
const settings = reactive({
	// 基本设置
	siteTitle: "我的博客",
	siteSubtitle: "分享技术见解，记录成长历程",
	siteDescription: "这是一个专注于技术分享的个人博客，记录学习过程中的思考和总结。",
	siteKeywords: "博客,技术,编程,开发,Vue,Spring Boot",
	siteAuthor: "博主",

	// 显示设置
	articlesPerPage: "10",
	excerptLength: 200,
	showReadingTime: true,
	showViewCount: true,
	enableComments: true,

	// 安全设置
	sessionTimeout: "60",
	maxLoginAttempts: 5,
	enableTwoFactor: false,
	logLoginAttempts: true,

	// 邮件设置
	smtpHost: "",
	smtpPort: 587,
	emailFrom: "",
	emailPassword: "",
	enableEmailNotification: false,
	enableSsl: true,

	// 备份设置
	autoBackup: false,
	backupFrequency: "weekly",
});

// 原始设置数据（用于检测是否有变更）
const originalSettings = ref({});
const showSuccessMessage = ref(false);
const lastBackupTime = ref("2024-03-15 14:30:00");

// 计算是否有变更
const hasChanges = computed(() => {
	return JSON.stringify(settings) !== JSON.stringify(originalSettings.value);
});

// 保存设置
const saveSettings = async () => {
	try {
		// 这里应该调用API保存设置
		// await settingsAPI.updateSettings(settings);

		// 更新原始设置数据
		originalSettings.value = JSON.parse(JSON.stringify(settings));

		// 显示成功消息
		showSuccessMessage.value = true;
		setTimeout(() => {
			showSuccessMessage.value = false;
		}, 3000);

		console.log("设置已保存:", settings);
	} catch (error) {
		console.error("保存设置失败:", error);
	}
};

// 测试邮件配置
const testEmailConfig = async () => {
	try {
		// 这里应该调用API测试邮件配置
		// await settingsAPI.testEmailConfig(settings);
		alert("邮件配置测试成功！");
	} catch (error) {
		console.error("邮件配置测试失败:", error);
		alert("邮件配置测试失败，请检查配置参数。");
	}
};

// 备份数据库
const backupDatabase = async () => {
	try {
		// 这里应该调用API备份数据库
		// const response = await settingsAPI.backupDatabase();

		// 模拟下载备份文件
		const filename = `blog_backup_${new Date().toISOString().split("T")[0]}.sql`;
		console.log(`开始下载备份文件: ${filename}`);

		// 更新最后备份时间
		lastBackupTime.value = new Date().toLocaleString("zh-CN");

		alert("数据库备份成功！");
	} catch (error) {
		console.error("数据库备份失败:", error);
		alert("数据库备份失败，请稍后重试。");
	}
};

// 处理文件选择
const handleFileSelect = (event: Event) => {
	const target = event.target as HTMLInputElement;
	const file = target.files?.[0];

	if (file) {
		if (confirm(`确定要从文件 "${file.name}" 恢复数据吗？此操作将覆盖现有数据！`)) {
			restoreFromFile(file);
		}
		// 清空文件输入
		target.value = "";
	}
};

// 从文件恢复数据
const restoreFromFile = async (file: File) => {
	try {
		// 这里应该调用API恢复数据
		// const formData = new FormData();
		// formData.append('file', file);
		// await settingsAPI.restoreFromFile(formData);

		console.log(`开始从文件恢复数据: ${file.name}`);
		alert("数据恢复成功！");
	} catch (error) {
		console.error("数据恢复失败:", error);
		alert("数据恢复失败，请检查文件格式。");
	}
};

// 加载设置数据
const loadSettings = async () => {
	try {
		// 这里应该调用API加载设置
		// const response = await settingsAPI.getSettings();
		// Object.assign(settings, response.data);

		// 保存原始设置
		originalSettings.value = JSON.parse(JSON.stringify(settings));
	} catch (error) {
		console.error("加载设置失败:", error);
	}
};

// 组件挂载时加载数据
onMounted(() => {
	loadSettings();
});
</script>

<style scoped>
.settings {
	padding: 24px;
}

/* 页面头部 */
.page-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 32px;
}

.page-title {
	font-size: 24px;
	font-weight: 600;
	color: var(--text-primary);
	margin: 0;
}

.save-btn {
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

.save-btn:hover:not(:disabled) {
	background: var(--accent-hover);
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(100, 255, 218, 0.3);
}

.save-btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
	transform: none;
	box-shadow: none;
}

.btn-icon {
	font-size: 14px;
}

/* 设置内容 */
.settings-content {
	display: flex;
	flex-direction: column;
	gap: 32px;
}

.settings-section {
	background: rgba(26, 35, 50, 0.8);
	border-radius: 12px;
	border: 1px solid rgba(100, 255, 218, 0.1);
	overflow: hidden;
}

.section-header {
	padding: 24px;
	border-bottom: 1px solid rgba(100, 255, 218, 0.1);
}

.section-title {
	font-size: 18px;
	font-weight: 600;
	color: var(--text-primary);
	margin: 0 0 4px 0;
}

.section-description {
	color: var(--text-secondary);
	font-size: 14px;
}

.section-body {
	padding: 24px;
}

/* 表单样式 */
.form-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 20px;
}

.form-group {
	display: flex;
	flex-direction: column;
}

.form-group.full-width {
	grid-column: 1 / -1;
}

.form-label {
	color: var(--text-primary);
	font-weight: 500;
	margin-bottom: 8px;
	font-size: 14px;
}

.form-input,
.form-select,
.form-textarea {
	padding: 12px 16px;
	background: var(--bg-tertiary);
	border: 1px solid rgba(100, 255, 218, 0.1);
	border-radius: 8px;
	color: var(--text-primary);
	font-size: 14px;
	transition: all 0.3s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
	outline: none;
	border-color: var(--accent);
	box-shadow: 0 0 0 3px rgba(100, 255, 218, 0.1);
}

.form-textarea {
	resize: vertical;
	min-height: 80px;
}

.form-select {
	cursor: pointer;
}

/* 复选框组 */
.checkbox-group {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.checkbox-item {
	display: flex;
	align-items: center;
	gap: 12px;
	cursor: pointer;
	user-select: none;
}

.checkbox {
	display: none;
}

.checkmark {
	width: 20px;
	height: 20px;
	border: 2px solid rgba(100, 255, 218, 0.3);
	border-radius: 4px;
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
	left: 6px;
	top: 2px;
	width: 6px;
	height: 10px;
	border: solid var(--bg-primary);
	border-width: 0 2px 2px 0;
	transform: rotate(45deg);
}

.checkbox-text {
	color: var(--text-secondary);
	font-size: 14px;
}

/* 测试按钮 */
.test-btn {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 16px;
	background: rgba(24, 144, 255, 0.1);
	color: #1890ff;
	border: 1px solid rgba(24, 144, 255, 0.2);
	border-radius: 6px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.3s ease;
	font-size: 14px;
}

.test-btn:hover {
	background: rgba(24, 144, 255, 0.2);
	border-color: rgba(24, 144, 255, 0.3);
}

/* 备份设置 */
.backup-options {
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.backup-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20px;
	background: var(--bg-tertiary);
	border-radius: 8px;
	border: 1px solid rgba(100, 255, 218, 0.1);
}

.backup-info h4 {
	color: var(--text-primary);
	font-size: 16px;
	font-weight: 600;
	margin: 0 0 4px 0;
}

.backup-info p {
	color: var(--text-secondary);
	font-size: 14px;
	margin: 0 0 8px 0;
}

.backup-time {
	color: var(--text-secondary);
	font-size: 12px;
}

.backup-schedule {
	display: flex;
	align-items: center;
	gap: 16px;
	margin-top: 12px;
}

.backup-schedule .form-select {
	min-width: 120px;
}

.backup-actions {
	display: flex;
	gap: 12px;
}

.backup-btn {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	background: var(--accent);
	color: var(--bg-primary);
	border: none;
	border-radius: 6px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.3s ease;
	font-size: 14px;
}

.backup-btn:hover {
	background: var(--accent-hover);
}

.restore-btn {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	background: rgba(250, 140, 22, 0.1);
	color: #fa8c16;
	border: 1px solid rgba(250, 140, 22, 0.2);
	border-radius: 6px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.3s ease;
	font-size: 14px;
}

.restore-btn:hover {
	background: rgba(250, 140, 22, 0.2);
}

/* 成功消息 */
.success-message {
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

.success-icon {
	font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
	.settings {
		padding: 16px;
	}

	.page-header {
		flex-direction: column;
		gap: 16px;
		align-items: stretch;
	}

	.form-grid {
		grid-template-columns: 1fr;
	}

	.backup-item {
		flex-direction: column;
		gap: 16px;
		align-items: flex-start;
	}

	.backup-actions {
		width: 100%;
		justify-content: flex-start;
	}

	.success-message {
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
</style>
