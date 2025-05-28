// 标签相关API
import api from "@/api/index.ts";

export const tagAPI = {
	// 获取所有标签（公开接口）
	getTags: () => api.get("/tags"),

	// 创建标签（需要认证）
	createTag: (tag: { name: string }) => api.post("/admin/tags", tag),

	// 删除标签（需要认证）
	deleteTag: (id: string) => api.delete(`/admin/tags/${id}`),
};
