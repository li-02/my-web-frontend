<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const isCollapsed = ref(false);

// 菜单配置
const menuItems = [
	{ path: "/admin/dashboard", icon: "📊", label: "仪表盘" },
	{ path: "/admin/articles", icon: "📝", label: "文章管理" },
	{ path: "/admin/categories", icon: "📁", label: "分类管理" },
	{ path: "/admin/tags", icon: "🏷️", label: "标签管理" },
	{ path: "/admin/comments", icon: "💬", label: "评论管理" },
	{ path: "/admin/settings", icon: "⚙️", label: "系统设置" },
];

// 切换侧边栏折叠状态
const toggleSidebar = () => {
	isCollapsed.value = !isCollapsed.value;
};

// 处理退出登录
const handleLogout = () => {
	// 清除token
	localStorage.removeItem("admin_token");
	localStorage.removeItem("remember_me");

	// 跳转到登录页
	router.push("/dreamory-admin-login");
};
</script>

<template>
	<div class="admin-layout">
		<!-- 侧边栏 -->
		<aside :class="['sidebar', { collapsed: isCollapsed }]">
			<!-- Logo 区域 -->
			<div class="sidebar-header">
				<div class="logo">
					{{ isCollapsed ? "B" : "博客管理" }}
				</div>
			</div>

			<!-- 导航菜单 -->
			<nav class="sidebar-nav">
				<router-link v-for="item in menuItems" :key="item.path" :to="item.path" class="nav-item" active-class="active">
					<span class="nav-icon">{{ item.icon }}</span>
					<span v-if="!isCollapsed" class="nav-label">{{ item.label }}</span>
				</router-link>
			</nav>

			<!-- 底部退出按钮 -->
			<div class="sidebar-footer">
				<div class="nav-item logout" @click="handleLogout">
					<span class="nav-icon">🚪</span>
					<span v-if="!isCollapsed" class="nav-label">退出登录</span>
				</div>
			</div>
		</aside>

		<!-- 主内容区域 -->
		<div class="main-content">
			<!-- 顶部导航栏 -->
			<header class="top-header">
				<div class="header-left">
					<button class="collapse-btn" @click="toggleSidebar">
						<span>{{ isCollapsed ? "☰" : "✕" }}</span>
					</button>
				</div>

				<div class="header-right">
					<button class="header-btn">
						<span>🔔</span>
					</button>
					<div class="user-info">
						<span class="username">管理员</span>
						<div class="avatar">
							<span>👤</span>
						</div>
					</div>
				</div>
			</header>

			<!-- 页面内容 -->
			<main class="page-content">
				<router-view />
			</main>
		</div>
	</div>
</template>

<style scoped>
.admin-layout {
	display: flex;
	min-height: 100vh;
	background: var(--bg-primary);
	color: var(--text-primary);
}

/* 侧边栏 */
.sidebar {
	width: 250px;
	background: rgba(26, 35, 50, 0.9);
	border-right: 1px solid rgba(100, 255, 218, 0.1);
	transition: width 0.3s ease;
	display: flex;
	flex-direction: column;
	position: fixed;
	left: 0;
	top: 0;
	height: 100vh;
	z-index: 1000;
}

.sidebar.collapsed {
	width: 70px;
}

.sidebar-header {
	padding: 20px;
	border-bottom: 1px solid rgba(100, 255, 218, 0.1);
}

.logo {
	font-size: 20px;
	font-weight: 600;
	color: var(--accent);
	text-align: center;
	transition: font-size 0.3s ease;
}

.collapsed .logo {
	font-size: 18px;
}

/* 导航菜单 */
.sidebar-nav {
	flex: 1;
	padding: 20px 0;
	display: flex;
	flex-direction: column;
}

.nav-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px 20px;
	color: var(--text-secondary);
	text-decoration: none;
	transition: all 0.3s ease;
	cursor: pointer;
	border-right: 3px solid transparent;
}

.nav-item:hover {
	color: var(--accent);
	background: rgba(100, 255, 218, 0.05);
}

.nav-item.active {
	color: var(--accent);
	background: rgba(100, 255, 218, 0.1);
	border-right-color: var(--accent);
}

.nav-icon {
	font-size: 16px;
	min-width: 20px;
	text-align: center;
}

.nav-label {
	font-weight: 500;
	white-space: nowrap;
}

.collapsed .nav-label {
	display: none;
}

/* 侧边栏底部 */
.sidebar-footer {
	padding: 20px;
	border-top: 1px solid rgba(100, 255, 218, 0.1);
}

.logout {
	color: var(--text-secondary) !important;
}

.logout:hover {
	color: #ff6b6b !important;
	background: rgba(255, 107, 107, 0.1) !important;
}

/* 主内容区域 */
.main-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	margin-left: 250px;
	transition: margin-left 0.3s ease;
}

.sidebar.collapsed + .main-content {
	margin-left: 70px;
}

/* 顶部导航栏 */
.top-header {
	height: 70px;
	background: rgba(26, 35, 50, 0.9);
	border-bottom: 1px solid rgba(100, 255, 218, 0.1);
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 24px;
	position: sticky;
	top: 0;
	z-index: 999;
	backdrop-filter: blur(20px);
}

.header-left {
	display: flex;
	align-items: center;
}

.collapse-btn {
	background: transparent;
	border: none;
	color: var(--text-secondary);
	font-size: 18px;
	cursor: pointer;
	padding: 8px;
	border-radius: 6px;
	transition: all 0.3s ease;
}

.collapse-btn:hover {
	color: var(--accent);
	background: rgba(100, 255, 218, 0.1);
}

.header-right {
	display: flex;
	align-items: center;
	gap: 16px;
}

.header-btn {
	background: transparent;
	border: none;
	color: var(--text-secondary);
	font-size: 16px;
	cursor: pointer;
	padding: 8px;
	border-radius: 6px;
	transition: all 0.3s ease;
}

.header-btn:hover {
	color: var(--accent);
	background: rgba(100, 255, 218, 0.1);
}

.user-info {
	display: flex;
	align-items: center;
	gap: 12px;
}

.username {
	color: var(--text-primary);
	font-size: 14px;
	font-weight: 500;
}

.avatar {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: var(--accent);
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--bg-primary);
	font-weight: 600;
}

/* 页面内容 */
.page-content {
	flex: 1;
	overflow: auto;
	background: var(--bg-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
	.sidebar {
		transform: translateX(-100%);
	}

	.sidebar.collapsed {
		transform: translateX(-100%);
	}

	.main-content {
		margin-left: 0;
	}

	.sidebar.collapsed + .main-content {
		margin-left: 0;
	}

	/* 移动端时可以考虑添加遮罩层和滑出效果 */
}

/* 滚动条样式 */
.sidebar::-webkit-scrollbar {
	width: 4px;
}

.sidebar::-webkit-scrollbar-track {
	background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
	background: rgba(100, 255, 218, 0.3);
	border-radius: 2px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
	background: rgba(100, 255, 218, 0.5);
}
</style>
