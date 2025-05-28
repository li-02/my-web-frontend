// 分类相关API
import api from '@/api/index.ts'

export const categoryAPI = {
  // 获取所有分类（公开接口）
  getCategories: () => api.get('/categories'),

  // 创建分类（需要认证）
  createCategory: (category: { name: string; description?: string }) =>
    api.post('/admin/categories', category),

  // 更新分类（需要认证）
  updateCategory: (id: string, category: any) => api.put(`/admin/categories/${id}`, category),

  // 删除分类（需要认证）
  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}`),
}
