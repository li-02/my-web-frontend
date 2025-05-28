import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "home",
			component: HomeView,
		},
		{
			path: "/dreamory-admin-login",
			name: "admin-login",
			component: () => import("../views/login/AdminLoginView.vue"),
			meta: {
				title: "管理员登录",
			},
		},
		// 管理后台路由（使用AdminLayout）
		{
			path: "/admin",
			component: () => import("../layout/AdminLayout.vue"),
			meta: {
				requiresAuth: true, // 需要登录认证
			},
			children: [
				{
					path: "",
					redirect: "/admin/dashboard", // 默认重定向到仪表盘
				},
				{
					path: "dashboard",
					name: "admin-dashboard",
					component: () => import("../views/admin/DashboardView.vue"),
					meta: {
						title: "仪表盘",
					},
				},
				{
					path: "articles",
					name: "admin-articles",
					component: () => import("../views/admin/ArticleManageView.vue"),
					meta: {
						title: "文章管理",
					},
				},
				{
					path: "articles/create",
					name: "admin-article-create",
					component: () => import("../views/admin/ArticleEditView.vue"),
					meta: {
						title: "新建文章",
					},
				},
				{
					path: "articles/edit/:id",
					name: "admin-article-edit",
					component: () => import("../views/admin/ArticleEditView.vue"),
					meta: {
						title: "编辑文章",
					},
				},
				{
					path: "categories",
					name: "admin-categories",
					component: () => import("../views/admin/CategoryManageView.vue"),
					meta: {
						title: "分类管理",
					},
				},
				{
					path: "tags",
					name: "admin-tags",
					component: () => import("../views/admin/TagManageView.vue"),
					meta: {
						title: "标签管理",
					},
				},
				{
					path: "comments",
					name: "admin-comments",
					component: () => import("../views/admin/CommentManageView.vue"),
					meta: {
						title: "评论管理",
					},
				},
				{
					path: "settings",
					name: "admin-settings",
					component: () => import("../views/admin/SettingsView.vue"),
					meta: {
						title: "系统设置",
					},
				},
			],
		},

		// 404 页面
		{
			path: "/:pathMatch(.*)*",
			name: "not-found",
			component: () => import("../views/NotFoundView.vue"),
		},
	],
});

export default router
