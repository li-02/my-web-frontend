// 标签相关API
import api from "@/api/index.ts";

export const tagAPI = {
	// 获取所有标签（公开接口）
	getTags: (params?: { page?: number; size?: number; keyword?: string }) => 
		api.get("/tag/tags", { params }),

	// 获取热门标签（按使用频率排序）
	getPopularTags: (limit?: number) => api.get("/tag/popular", { params: { limit } }),

	// 搜索标签（模糊搜索）
	searchTags: (keyword: string) => api.get("/tag/search",  {params: {keyword} } ),

	// 获取标签统计信息
	getTagStats: () => api.get("/tag/stats"),

	// 创建标签（需要认证）
	createTag: (name: string) => api.get("/tag/createTag", { params: { name } }),

	// 更新标签（需要认证）
	updateTag: (id: string, tag: { name: string }) => api.put(`/admin/tags/${id}`, tag),

	// 删除标签（需要认证）
	deleteTag: (id: number) => api.delete(`/tag/delete/${id}`),

	// 批量创建标签（如果不存在则创建）
	createTagsIfNotExist: (tagNames: string[]) => api.post("/admin/tags/batch", { tagNames }),
};
