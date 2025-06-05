// 博客文章相关API
import api from "@/api/index.ts";

export const articleAPI = {
	// 获取文章列表（公开接口）
	getArticles: (params?: { page?: number; size?: number; category?: string }) => api.get("/articles", { params }),

	// 获取文章详情（公开接口）
	getArticle: (id: string) => api.get(`/articles/${id}`),

	// 创建文章（需要认证）
	createArticle: (article: any) => api.post("/article/create-article", article),

	// 更新文章（需要认证）
	updateArticle: (id: string, article: any) => api.put(`/admin/articles/${id}`, article),

	// 删除文章（需要认证）
	deleteArticle: (id: string) => api.delete(`/admin/articles/${id}`),
};
