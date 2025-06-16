// 分类基础信息
export interface Category {
	id: number;
	name: string;
	description: string;
	createTime: string;
	updateTime: string;
	deleteTime: string | null;
	deleted: boolean;
	articleCount?: number; // 可选字段，某些接口可能不返回
}

// 分类表单数据（新增/编辑时使用）
export interface CategoryFormData {
	name: string;
	description: string;
}

// 分类列表查询参数
export interface CategoryQueryParams {
	page: number;
	pageSize: number;
	keyword?: string; // 搜索关键词
}

// 分类列表响应数据
export interface CategoryListResponse {
	data: Category[];
	total: number;
	totalPages: number;
	page: number;
	pageSize: number;
}

// 分类创建请求数据
export interface CreateCategoryRequest {
	name: string;
	description: string;
}

// 分类更新请求数据
export interface UpdateCategoryRequest {
	id: number;
	name: string;
	description: string;
}

// API 响应基础结构
export interface ApiResponse<T = any> {
	code: number;
	message: string;
	data: T;
}

// 分页信息
export interface PaginationInfo {
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}
