// 分类相关API
import api from "@/api/index.ts";
import type { 
  CategoryQueryParams, 
  CategoryListResponse, 
  CreateCategoryRequest, 
  UpdateCategoryRequest,
  ApiResponse 
} from "@/type/category";

export const categoryAPI = {
	// 获取分类列表（支持分页和搜索）
	getCategoriesList: (params: CategoryQueryParams): Promise<ApiResponse<CategoryListResponse>> => 
		api.get("/category/categories", { params }),

	// 获取所有分类（公开接口，用于下拉选择等）
	getCategories: () => api.get("/category/all"),

	// 创建分类（需要认证）
	createCategory: (category: CreateCategoryRequest): Promise<ApiResponse<any>> => 
		api.post("/category/categories", category),

	// 更新分类（需要认证）
	updateCategory: (id: number, category: UpdateCategoryRequest): Promise<ApiResponse<any>> => 
		api.put(`/category/categories/${id}`, category),

	// 删除分类（需要认证）
	deleteCategory: (id: number): Promise<ApiResponse<any>> => 
		api.delete(`/category/categories/${id}`),
};
