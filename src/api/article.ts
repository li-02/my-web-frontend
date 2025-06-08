// 博客文章相关API
import api from "@/api/index.ts";

export const articleAPI = {
	// 获取文章列表（公开接口）
	getArticles: (params?: { 
		page?: number; 
		size?: number; 
		status?: string;
		categoryId?: number;
		keyword?: string;
	}) => api.get("/article/articles", { params }),

	// 获取文章详情（公开接口）
	getArticle: (id: string) => api.get(`/article/article-detail/${id}`),

	// 增加文章浏览次数（公开接口）
	incrementViewCount: (id: string) => api.get(`/article/increment-view/${id}`),

	// 创建文章（需要认证）
	createArticle: (article: any) => api.post("/article/create-article", article),

	// 更新文章（需要认证）
	updateArticle: (id: string, article: any) => api.put(`/article/update-article/${id}`, article),

	// 删除文章（需要认证）
	deleteArticle: (id: string) => api.delete(`/article/delete-article/${id}`),

	// 批量更新文章状态
	batchUpdateStatus: (ids: number[], status: string) => 
		api.put("/article/batch-update-status", { ids, status }),

	// 批量删除文章
	batchDelete: (ids: number[]) => 
		api.delete("/article/batch-delete", { data: { ids } }),

	// 更新文章置顶状态
	updatePinStatus: (id: string, isPinned: boolean) => 
		api.put(`/article/update-pin-status/${id}`, { isPinned }),

	// 更新文章发布状态
	updatePublishStatus: (id: string, status: string) => 
		api.put(`/article/update-publish-status/${id}`, { status }),
};
